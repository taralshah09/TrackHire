const { Worker } = require("bullmq");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");
const { USER_REBUILD_QUEUE_NAME } = require("./user_rebuild_queue");
const { calculateScore } = require("./relevance_scoring_service");

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";
const RELEVANCE_THRESHOLD = 40;
const JOB_CHUNK_SIZE = 100;

// Words stripped when building title candidate patterns
const SENIORITY_WORDS = new Set([
    "senior", "sr", "junior", "jr", "lead", "staff", "principal", "associate",
    "head", "director", "vp", "vice", "president", "fellow", "graduate",
    "entry", "mid", "intern", "the", "and", "for", "with",
]);

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

// ── Preference loading ────────────────────────────────────────────────────────

async function loadUserPreferences(client, userId) {
    const [prefRes, companyRes] = await Promise.all([
        client.query(
            `SELECT p.id AS preference_id,
                    COALESCE(array_agg(DISTINCT s.skill) FILTER (WHERE s.skill IS NOT NULL), '{}') AS skills,
                    COALESCE(array_agg(DISTINCT t.title) FILTER (WHERE t.title IS NOT NULL), '{}') AS job_titles,
                    COALESCE(array_agg(DISTINCT r.role_type) FILTER (WHERE r.role_type IS NOT NULL), '{}') AS role_types
             FROM user_job_preferences p
             LEFT JOIN user_job_preference_skills s ON s.preference_id = p.id
             LEFT JOIN user_job_preference_titles t ON t.preference_id = p.id
             LEFT JOIN user_job_preference_role_types r ON r.preference_id = p.id
             WHERE p.user_id = $1
             GROUP BY p.id`,
            [userId]
        ),
        client.query(
            "SELECT company_name FROM user_preferred_companies WHERE user_id = $1",
            [userId]
        ),
    ]);

    if (prefRes.rows.length === 0) return null;

    const pref = prefRes.rows[0];
    return {
        userId,
        skills: pref.skills,
        jobTitles: pref.job_titles,
        roleTypes: pref.role_types,
        preferredCompanies: companyRes.rows.map((r) => r.company_name),
    };
}

// ── Candidate job discovery ───────────────────────────────────────────────────

async function findJobsBySkills(client, skills) {
    if (skills.length === 0) return [];
    const lowerSkills = skills.map((s) => s.toLowerCase());
    const res = await client.query(
        "SELECT DISTINCT job_id AS id FROM job_skills WHERE LOWER(skill) = ANY($1)",
        [lowerSkills]
    );
    return res.rows.map((r) => r.id);
}

async function findJobsByTitles(client, titles) {
    if (titles.length === 0) return [];

    // Extract significant words and build ILIKE patterns
    const words = [
        ...new Set(
            titles
                .flatMap((t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/))
                .filter((w) => w.length > 2 && !SENIORITY_WORDS.has(w))
        ),
    ];

    if (words.length === 0) return [];

    const patterns = words.map((w) => `%${w}%`);
    const res = await client.query(
        "SELECT id FROM jobs WHERE title ILIKE ANY($1::text[])",
        [patterns]
    );
    return res.rows.map((r) => r.id);
}

async function findJobsByCompanies(client, companies) {
    if (companies.length === 0) return [];
    const lowerCompanies = companies.map((c) => c.toLowerCase().trim());
    const res = await client.query(
        "SELECT id FROM jobs WHERE LOWER(company) = ANY($1)",
        [lowerCompanies]
    );
    return res.rows.map((r) => r.id);
}

async function findCandidateJobIds(client, preferences) {
    const [bySkill, byTitle, byCompany] = await Promise.all([
        findJobsBySkills(client, preferences.skills),
        findJobsByTitles(client, preferences.jobTitles),
        findJobsByCompanies(client, preferences.preferredCompanies),
    ]);

    // Union with deduplication
    return [...new Set([...bySkill, ...byTitle, ...byCompany])];
}

// ── Job + skills loader (chunked) ─────────────────────────────────────────────

async function loadJobsWithSkills(client, jobIds) {
    const [jobRes, skillRes] = await Promise.all([
        client.query(
            "SELECT id, title, company, employment_type, posted_at FROM jobs WHERE id = ANY($1)",
            [jobIds]
        ),
        client.query(
            "SELECT job_id, skill FROM job_skills WHERE job_id = ANY($1)",
            [jobIds]
        ),
    ]);

    const skillsByJobId = new Map();
    for (const row of skillRes.rows) {
        if (!skillsByJobId.has(row.job_id)) skillsByJobId.set(row.job_id, []);
        skillsByJobId.get(row.job_id).push(row.skill);
    }

    return jobRes.rows.map((job) => ({
        job,
        skills: skillsByJobId.get(job.id) || [],
    }));
}

// ── Relevance persistence ─────────────────────────────────────────────────────

async function upsertRelevanceBatch(client, userId, scoredJobs) {
    const qualifying = scoredJobs.filter((j) => j.score >= RELEVANCE_THRESHOLD);
    if (qualifying.length === 0) return 0;

    const values = [];
    const placeholders = [];
    let idx = 1;

    for (const { jobId, score, reasons } of qualifying) {
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

// ── Main rebuild logic ────────────────────────────────────────────────────────

async function rebuildForUser(userId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const preferences = await loadUserPreferences(client, userId);
        if (!preferences) {
            console.warn(`⚠️  No preferences found for user ${userId} — skipping rebuild`);
            return { userId, candidateCount: 0, storedCount: 0 };
        }

        // Delete all existing relevance for this user before rebuilding
        await client.query("DELETE FROM user_job_relevance WHERE user_id = $1", [userId]);

        const candidateJobIds = await findCandidateJobIds(client, preferences);
        if (candidateJobIds.length === 0) {
            return { userId, candidateCount: 0, storedCount: 0 };
        }

        let totalStored = 0;

        // Process in chunks to bound memory and query param count
        for (let i = 0; i < candidateJobIds.length; i += JOB_CHUNK_SIZE) {
            const chunk = candidateJobIds.slice(i, i + JOB_CHUNK_SIZE);
            const jobsWithSkills = await loadJobsWithSkills(client, chunk);

            const scoredJobs = jobsWithSkills.map(({ job, skills }) => {
                const { score, reasons } = calculateScore(job, skills, preferences);
                return { jobId: job.id, score, reasons };
            });

            totalStored += await upsertRelevanceBatch(client, userId, scoredJobs);
        }

        return { userId, candidateCount: candidateJobIds.length, storedCount: totalStored };
    } finally {
        client.release();
    }
}

// ── BullMQ worker ─────────────────────────────────────────────────────────────

const worker = new Worker(
    USER_REBUILD_QUEUE_NAME,
    async (job) => {
        return rebuildForUser(job.data.userId);
    },
    {
        connection: REDIS_CONFIG,
        concurrency: 3,
    }
);

worker.on("completed", (job, result) => {
    console.log(
        `✅ Rebuild complete — user ${result.userId}: ${result.storedCount}/${result.candidateCount} jobs above threshold`
    );
});

worker.on("failed", (job, err) => {
    console.error(`❌ Rebuild failed — user ${job?.data?.userId}: ${err.message}`);
});

async function shutdown() {
    console.log("Shutting down user rebuild worker...");
    await worker.close();
    if (_pool) await _pool.end();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("🔁 User relevance rebuild worker started");
