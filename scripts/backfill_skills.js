/**
 * Backfill script — two-phase:
 *   Phase A: jobs with no skills  → skill extraction queue (which chains to relevance)
 *   Phase B: jobs with skills but no relevance entries → relevance generation queue directly
 *
 * Run once: node scripts/backfill_skills.js
 */

const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const { enqueueSkillExtraction, skillQueue } = require("./multi_ats/skill_extraction_queue");
const { enqueueRelevanceGeneration, relevanceQueue } = require("./multi_ats/job_relevance_queue");

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";
const BATCH_SIZE = 1000;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${DB_SCHEMA}`,
});

async function getJobsNeedingSkills(client, offset) {
    const res = await client.query(
        `SELECT j.id
         FROM jobs j
         LEFT JOIN job_skills js ON js.job_id = j.id
         WHERE js.job_id IS NULL
         ORDER BY j.id
         LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
    );
    return res.rows.map((r) => r.id);
}

async function getJobsNeedingRelevance(client, offset) {
    const res = await client.query(
        `SELECT DISTINCT js.job_id
         FROM job_skills js
         LEFT JOIN user_job_relevance ujr ON ujr.job_id = js.job_id
         WHERE ujr.job_id IS NULL
         ORDER BY js.job_id
         LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
    );
    return res.rows.map((r) => r.job_id);
}

async function main() {
    const client = await pool.connect();

    try {
        // ── Phase A: Skill extraction ─────────────────────────────────────────
        console.log("\n📋 Phase A — Finding jobs without skills...");
        let skillEnqueued = 0;
        let offset = 0;

        while (true) {
            const jobIds = await getJobsNeedingSkills(client, offset);
            if (jobIds.length === 0) break;

            for (const jobId of jobIds) {
                await enqueueSkillExtraction(jobId);
            }

            skillEnqueued += jobIds.length;
            offset += jobIds.length;
            console.log(`  ➕ Skill extraction enqueued: ${skillEnqueued}`);

            if (jobIds.length < BATCH_SIZE) break;
        }

        console.log(`✅ Phase A complete: ${skillEnqueued} jobs enqueued for skill extraction`);

        // ── Phase B: Relevance generation ─────────────────────────────────────
        console.log("\n📋 Phase B — Finding jobs with skills but no relevance entries...");
        let relevanceEnqueued = 0;
        offset = 0;

        while (true) {
            const jobIds = await getJobsNeedingRelevance(client, offset);
            if (jobIds.length === 0) break;

            for (const jobId of jobIds) {
                await enqueueRelevanceGeneration(jobId);
            }

            relevanceEnqueued += jobIds.length;
            offset += jobIds.length;
            console.log(`  ➕ Relevance generation enqueued: ${relevanceEnqueued}`);

            if (jobIds.length < BATCH_SIZE) break;
        }

        console.log(`✅ Phase B complete: ${relevanceEnqueued} jobs enqueued for relevance generation`);

    } finally {
        client.release();
        await pool.end();
    }

    console.log("\n🎉 Backfill enqueuing complete. Start the workers to process:");
    console.log("   node scripts/multi_ats/skill_extraction_worker.js");
    console.log("   node scripts/multi_ats/job_relevance_worker.js");

    await skillQueue.close();
    await relevanceQueue.close();
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
});
