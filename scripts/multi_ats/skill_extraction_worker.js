const { Worker } = require("bullmq");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");
const { SKILL_QUEUE_NAME } = require("./skill_extraction_queue");
const { enqueueRelevanceGeneration } = require("./job_relevance_queue");
const { extractSkills, detectRoleFamily, detectSeniority } = require("./skill_extraction_service");

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

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

async function loadJob(client, jobId) {
    const res = await client.query(
        "SELECT id, title, description FROM jobs WHERE id = $1",
        [jobId]
    );
    return res.rows[0] || null;
}

async function storeJobSkills(client, jobId, skills) {
    if (skills.length === 0) return;

    const values = [];
    const placeholders = [];
    let idx = 1;
    for (const skill of skills) {
        placeholders.push(`($${idx++}, $${idx++})`);
        values.push(jobId, skill);
    }

    await client.query(
        `INSERT INTO job_skills (job_id, skill)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT (job_id, skill) DO NOTHING`,
        values
    );
}

async function storeJobEnrichment(client, jobId, skills, roleFamily, seniority) {
    await client.query(
        `INSERT INTO job_enrichment (job_id, extracted_skills, role_family, seniority)
         VALUES ($1, $2::jsonb, $3, $4)
         ON CONFLICT (job_id) DO UPDATE SET
             extracted_skills = EXCLUDED.extracted_skills,
             role_family = EXCLUDED.role_family,
             seniority = EXCLUDED.seniority`,
        [jobId, JSON.stringify(skills), roleFamily, seniority]
    );
}

const worker = new Worker(
    SKILL_QUEUE_NAME,
    async (job) => {
        const { jobId } = job.data;
        const pool = getPool();
        const client = await pool.connect();
        try {
            const dbJob = await loadJob(client, jobId);
            if (!dbJob) {
                console.warn(`⚠️  Job ${jobId} not found in DB — skipping skill extraction`);
                return { skipped: true };
            }

            const skills = extractSkills(dbJob.title, dbJob.description);
            const roleFamily = detectRoleFamily(dbJob.title);
            const seniority = detectSeniority(dbJob.title);

            await storeJobSkills(client, jobId, skills);
            await storeJobEnrichment(client, jobId, skills, roleFamily, seniority);

            // Trigger relevance generation for this job now that skills are ready
            if (skills.length > 0) {
                await enqueueRelevanceGeneration(jobId);
            }

            return { jobId, skillCount: skills.length, roleFamily, seniority };
        } finally {
            client.release();
        }
    },
    {
        connection: REDIS_CONFIG,
        concurrency: 10,
    }
);

worker.on("completed", (job, result) => {
    if (!result.skipped) {
        console.log(`✅ Skills extracted — job ${result.jobId}: ${result.skillCount} skills [${result.seniority} ${result.roleFamily}]`);
    }
});

worker.on("failed", (job, err) => {
    console.error(`❌ Skill extraction failed — job ${job?.data?.jobId}: ${err.message}`);
});

async function shutdown() {
    console.log("Shutting down skill extraction worker...");
    await worker.close();
    if (_pool) await _pool.end();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("🧠 Skill extraction worker started");
