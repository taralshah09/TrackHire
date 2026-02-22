/**
 * email_pipeline.js — Standalone email notification pipeline
 *
 * Deploys to a SEPARATE Railway instance from the job scraping pipelines.
 * Run via:   node email_pipeline.js
 *
 * For 100K+ users:
 *  - Users are processed in BATCHES of 500 (cursor-based, no OFFSET)
 *  - Max 5 emails sent concurrently (p-limit) to avoid SMTP rate limits
 *  - All job matching done in PostgreSQL — never loads full job table into memory
 *  - Single shared DB pool (max 10 connections) reused across all batches
 *  - email_log table prevents duplicate sends within 7-day windows
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = require("./db_pool");
const { sendEmail, verifyConnection } = require("./email_sender");
const { buildDigest } = require("./email_template");
const { findJobsForUser, logEmailsSent } = require("./job_matcher");
const pLimit = require("p-limit");

// ─── Config ──────────────────────────────────────────────────────────────────

const USER_BATCH_SIZE = 500;   // users fetched per DB round-trip
const EMAIL_CONCURRENCY = 5;   // max simultaneous SMTP sends
const MAX_JOBS_PER_EMAIL = 10; // cap to keep emails scannable

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetches one page of users who have email notifications enabled.
 * Uses cursor-based pagination (by user_id) — no OFFSET, O(1) per page.
 *
 * @param {number} afterId  Fetch users with id > afterId
 * @returns {Promise<Array>}
 */

async function fetchUserBatch(afterId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT
                u.id          AS user_id,
                u.email,
                u.username,
                p.job_titles,
                p.skills
             FROM users u
             JOIN user_job_preferences p ON p.user_id = u.id
             WHERE u.id > $1
               AND p.email_enabled = TRUE
               AND u.email IS NOT NULL
               AND u.account_enabled = TRUE
             ORDER BY u.id ASC
             LIMIT $2`,
            [afterId, USER_BATCH_SIZE]
        );
        return result.rows;
    } finally {
        client.release();
    }
}

/**
 * Processes a single user: match jobs → build email → send.
 * Returns a result object for stats tracking.
 */
async function processUser(user) {
    const { user_id, email, username, job_titles, skills } = user;

    try {
        const matchedJobs = await findJobsForUser(
            user_id,
            job_titles || [],
            skills || [],
            MAX_JOBS_PER_EMAIL
        );

        if (matchedJobs.length === 0) {
            return { status: "skipped", user_id, email };
        }

        const subject = `🎯 ${matchedJobs.length} new job${matchedJobs.length > 1 ? "s" : ""} matching your preferences`;
        const html = buildDigest({ username, email }, matchedJobs);

        await sendEmail(email, subject, html);
        await logEmailsSent(user_id, matchedJobs.map((j) => j.id));

        return { status: "sent", user_id, email, jobCount: matchedJobs.length };

    } catch (err) {
        // Log the failure but don't abort the batch
        console.error(`  ❌ Failed for user ${user_id} (${email}): ${err.message}`);
        return { status: "error", user_id, email, error: err.message };
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
    console.log("=".repeat(50));
    console.log("  TrackHire — Email Notification Pipeline");
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log("=".repeat(50) + "\n");

    // Verify SMTP before we start (fail fast)
    try {
        await verifyConnection();
    } catch (err) {
        console.error("❌ SMTP connection failed. Aborting.", err.message);
        await pool.end();
        process.exit(1);
    }

    const limit = pLimit(EMAIL_CONCURRENCY);
    const stats = { sent: 0, skipped: 0, errors: 0, usersProcessed: 0 };

    let cursorId = 0;
    let batchNum = 0;

    // Cursor-based loop — ends when no more users
    while (true) {
        batchNum++;
        const users = await fetchUserBatch(cursorId);

        if (users.length === 0) {
            console.log("\n✅ No more users to process.");
            break;
        }

        console.log(`\n📦 Batch #${batchNum}: Processing ${users.length} users (after id=${cursorId})…`);

        // Run up to EMAIL_CONCURRENCY emails in parallel within this batch
        const results = await Promise.all(
            users.map((user) => limit(() => processUser(user)))
        );

        // Accumulate stats
        for (const r of results) {
            stats.usersProcessed++;
            if (r.status === "sent") {
                stats.sent++;
                console.log(`  ✉️  Sent to ${r.email} — ${r.jobCount} jobs`);
            } else if (r.status === "skipped") {
                stats.skipped++;
            } else {
                stats.errors++;
            }
        }

        // Advance cursor to the last user id in this batch
        cursorId = users[users.length - 1].user_id;

        // If we got fewer rows than the batch size, this was the last page
        if (users.length < USER_BATCH_SIZE) break;
    }

    // ─── Summary ───────────────────────────────────────────────────────────
    console.log("\n" + "=".repeat(50));
    console.log("  Pipeline Complete");
    console.log(`  Users processed : ${stats.usersProcessed}`);
    console.log(`  Emails sent     : ${stats.sent}`);
    console.log(`  Skipped (0 match): ${stats.skipped}`);
    console.log(`  Errors          : ${stats.errors}`);
    console.log(`  Finished at     : ${new Date().toISOString()}`);
    console.log("=".repeat(50));

    await pool.end();
    process.exit(stats.errors > 0 ? 1 : 0);
}

run();