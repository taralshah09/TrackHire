const { Worker } = require("bullmq");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");
const { RELEVANCE_QUEUE_NAME } = require("./job_relevance_queue");
const { calculateScore } = require("./relevance_scoring_service");

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";
const RELEVANCE_THRESHOLD = 40;
const USER_CHUNK_SIZE = 100;

let _pool = null;

function getPool() {
    if (!_pool) {
        _pool = new Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT) || 5432,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
            options: `-c search_path=${DB_SCHEMA}`,
        });
    }
    return _pool;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function loadJobWithSkills(client, jobId) {
    const [jobRes, skillsRes] = await Promise.all([
        client.query(
            "SELECT id, title, company, employment_type, posted_at FROM jobs WHERE id = $1",
            [jobId]
        ),
        client.query(
            "SELECT skill FROM job_skills WHERE job_id = $1",
            [jobId]
        ),
    ]);

    if (jobRes.rows.length === 0) return null;

    return {
        job: jobRes.rows[0],
        skills: skillsRes.rows.map((r) => r.skill),
    };
}

// Returns user_ids of users who share at least one skill with the job.
// Matching is case-insensitive on both sides.
async function findCandidateUsers(client, jobSkills) {
    if (jobSkills.length === 0) return [];

    const lowerSkills = jobSkills.map((s) => s.toLowerCase());

    const res = await client.query(
        `SELECT DISTINCT ujp.user_id
         FROM user_job_preference_skills ujps
         JOIN user_job_preferences ujp ON ujp.id = ujps.preference_id
         WHERE LOWER(ujps.skill) = ANY($1)`,
        [lowerSkills]
    );

    return res.rows.map((r) => r.user_id);
}

// Bulk-loads all preferences for a set of user IDs in 4 queries.
// Returns a Map<userId, { preferenceId, skills, jobTitles, roleTypes, preferredCompanies }>
async function loadPreferencesForUsers(client, userIds) {
    if (userIds.length === 0) return new Map();

    const [prefRes, skillRes, titleRes, roleRes, companyRes] = await Promise.all([
        client.query(
            "SELECT id, user_id FROM user_job_preferences WHERE user_id = ANY($1)",
            [userIds]
        ),
        client.query(
            `SELECT ujps.preference_id, ujps.skill
             FROM user_job_preference_skills ujps
             WHERE ujps.preference_id = ANY(
                 SELECT id FROM user_job_preferences WHERE user_id = ANY($1)
             )`,
            [userIds]
        ),
        client.query(
            `SELECT ujpt.preference_id, ujpt.title
             FROM user_job_preference_titles ujpt
             WHERE ujpt.preference_id = ANY(
                 SELECT id FROM user_job_preferences WHERE user_id = ANY($1)
             )`,
            [userIds]
        ),
        client.query(
            `SELECT ujprt.preference_id, ujprt.role_type
             FROM user_job_preference_role_types ujprt
             WHERE ujprt.preference_id = ANY(
                 SELECT id FROM user_job_preferences WHERE user_id = ANY($1)
             )`,
            [userIds]
        ),
        client.query(
            "SELECT user_id, company_name FROM user_preferred_companies WHERE user_id = ANY($1)",
            [userIds]
        ),
    ]);

    // Index pref rows by user_id
    const prefByUserId = new Map();
    for (const row of prefRes.rows) {
        prefByUserId.set(row.user_id, { preferenceId: row.id, skills: [], jobTitles: [], roleTypes: [], preferredCompanies: [] });
    }

    // Index skills/titles/roleTypes by preferenceId → userId
    const prefIdToUserId = new Map();
    for (const [userId, pref] of prefByUserId) {
        prefIdToUserId.set(pref.preferenceId, userId);
    }

    for (const row of skillRes.rows) {
        const userId = prefIdToUserId.get(row.preference_id);
        if (userId !== undefined) prefByUserId.get(userId).skills.push(row.skill);
    }
    for (const row of titleRes.rows) {
        const userId = prefIdToUserId.get(row.preference_id);
        if (userId !== undefined) prefByUserId.get(userId).jobTitles.push(row.title);
    }
    for (const row of roleRes.rows) {
        const userId = prefIdToUserId.get(row.preference_id);
        if (userId !== undefined) prefByUserId.get(userId).roleTypes.push(row.role_type);
    }
    for (const row of companyRes.rows) {
        const pref = prefByUserId.get(row.user_id);
        if (pref) pref.preferredCompanies.push(row.company_name);
    }

    return prefByUserId;
}

// Bulk upserts scored rows into user_job_relevance, skipping scores below threshold.
async function upsertRelevanceBatch(client, jobId, scoredUsers) {
    const qualifying = scoredUsers.filter((u) => u.score >= RELEVANCE_THRESHOLD);
    if (qualifying.length === 0) return 0;

    const values = [];
    const placeholders = [];
    let idx = 1;

    for (const { userId, score, reasons } of qualifying) {
        placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}::jsonb, CURRENT_TIMESTAMP)`);
        values.push(userId, jobId, score, JSON.stringify(reasons));
    }

    await client.query(
        `INSERT INTO user_job_relevance (user_id, job_id, score, reasons, updated_at)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT (user_id, job_id) DO UPDATE SET
             score      = EXCLUDED.score,
             reasons    = EXCLUDED.reasons,
             updated_at = CURRENT_TIMESTAMP`,
        values
    );

    return qualifying.length;
}

// ── Worker processor ──────────────────────────────────────────────────────────

async function processJob(jobId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const jobData = await loadJobWithSkills(client, jobId);
        if (!jobData) {
            console.warn(`⚠️  Job ${jobId} not found — skipping relevance generation`);
            return { skipped: true };
        }

        const { job, skills: jobSkills } = jobData;

        if (jobSkills.length === 0) {
            console.warn(`⚠️  Job ${jobId} has no skills — skipping relevance generation`);
            return { jobId, candidateCount: 0, storedCount: 0 };
        }

        const candidateUserIds = await findCandidateUsers(client, jobSkills);

        if (candidateUserIds.length === 0) {
            return { jobId, candidateCount: 0, storedCount: 0 };
        }

        let totalStored = 0;

        // Process in chunks to bound memory and query size
        for (let i = 0; i < candidateUserIds.length; i += USER_CHUNK_SIZE) {
            const chunk = candidateUserIds.slice(i, i + USER_CHUNK_SIZE);
            const prefsMap = await loadPreferencesForUsers(client, chunk);

            const scoredUsers = [];
            for (const [userId, prefs] of prefsMap) {
                const { score, reasons } = calculateScore(job, jobSkills, {
                    userId,
                    skills: prefs.skills,
                    jobTitles: prefs.jobTitles,
                    roleTypes: prefs.roleTypes,
                    preferredCompanies: prefs.preferredCompanies,
                });
                scoredUsers.push({ userId, score, reasons });
            }

            totalStored += await upsertRelevanceBatch(client, jobId, scoredUsers);
        }

        return { jobId, candidateCount: candidateUserIds.length, storedCount: totalStored };
    } finally {
        client.release();
    }
}

// ── BullMQ worker ─────────────────────────────────────────────────────────────

const worker = new Worker(
    RELEVANCE_QUEUE_NAME,
    async (job) => {
        return processJob(job.data.jobId);
    },
    {
        connection: REDIS_CONFIG,
        concurrency: 5,
    }
);

worker.on("completed", (job, result) => {
    if (result.skipped) return;
    console.log(
        `✅ Relevance generated — job ${result.jobId}: ${result.storedCount}/${result.candidateCount} users scored above threshold`
    );
});

worker.on("failed", (job, err) => {
    console.error(`❌ Relevance generation failed — job ${job?.data?.jobId}: ${err.message}`);
});

async function shutdown() {
    console.log("Shutting down relevance generation worker...");
    await worker.close();
    if (_pool) await _pool.end();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("⚡ Job relevance generation worker started");
