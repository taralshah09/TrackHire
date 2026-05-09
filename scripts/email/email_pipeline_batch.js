/**
 * email_pipeline_batch.js — Batch-optimized email notification pipeline
 *
 * Uses Cloudflare Worker gateway and Resend Batch API for high performance.
 * Processes 100 users at a time and sends them in a single HTTP call.
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = require("./db_pool");
const { sendBatch } = require("./email_sender_gateway");
const { buildDigest } = require("./email_template");
const { findJobsForUser, logEmailsSent } = require("./job_matcher");

// ─── Config ──────────────────────────────────────────────────────────────────

const USER_BATCH_SIZE = 100;   // Matches Resend's batch limit
const MAX_JOBS_PER_EMAIL = 10; // Cap to keep emails scannable

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchUserBatch(afterId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT
                u.id          AS user_id,
                u.email,
                u.username,
                COALESCE(array_agg(DISTINCT jt.title)     FILTER (WHERE jt.title     IS NOT NULL), '{}') AS job_titles,
                COALESCE(array_agg(DISTINCT sk.skill)     FILTER (WHERE sk.skill     IS NOT NULL), '{}') AS skills,
                COALESCE(array_agg(DISTINCT rt.role_type) FILTER (WHERE rt.role_type IS NOT NULL), '{}') AS role_types
             FROM users u
             JOIN user_job_preferences p ON p.user_id = u.id
             LEFT JOIN user_job_preference_titles     jt ON jt.preference_id = p.id
             LEFT JOIN user_job_preference_skills     sk ON sk.preference_id = p.id
             LEFT JOIN user_job_preference_role_types rt ON rt.preference_id = p.id
             WHERE u.id > $1
               AND p.email_enabled = TRUE
               AND u.email IS NOT NULL
               AND u.account_enabled = TRUE
             GROUP BY u.id, u.email, u.username
             ORDER BY u.id ASC
             LIMIT $2`,
            [afterId, USER_BATCH_SIZE]
        );
        return result.rows;
    } finally {
        client.release();
    }
}

async function prepareEmailForUser(user) {
    const { user_id, email, username, job_titles, skills, role_types } = user;

    try {
        const tieredJobs = await findJobsForUser(
            user_id,
            job_titles || [],
            skills || [],
            role_types || [],
            MAX_JOBS_PER_EMAIL
        );

        const { topPicks, recommended } = tieredJobs;
        const allJobs = [...topPicks, ...recommended];

        if (allJobs.length === 0) {
            return null;
        }

        const totalCount = allJobs.length;
        const subject = totalCount === 1
            ? `🎯 1 new job match for your profile`
            : `🎯 ${totalCount} new jobs matching your preferences`;

        const interests = [...(job_titles || []), ...(skills || [])];
        const html = buildDigest({ username, email, interests }, tieredJobs);

        return {
            emailData: {
                to: email,
                subject,
                html
            },
            userId: user_id,
            jobIds: allJobs.map(j => j.id)
        };

    } catch (err) {
        console.error(`  ❌ Preparation failed for user ${user_id} (${email}): ${err.message}`);
        return null;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
    console.log("=".repeat(50));
    console.log("  TrackHire — Batch Email Pipeline (Resend Gateway)");
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log("=".repeat(50) + "\n");

    const stats = { sent: 0, skipped: 0, errors: 0, usersProcessed: 0 };

    let cursorId = 0;
    let batchNum = 0;

    while (true) {
        batchNum++;
        const users = await fetchUserBatch(cursorId);

        if (users.length === 0) {
            console.log("\n✅ No more users to process.");
            break;
        }

        console.log(`\n📦 Batch #${batchNum}: Preparing ${users.length} users…`);

        // Prepare all emails in the batch concurrently
        const emailPreparations = await Promise.all(
            users.map(user => prepareEmailForUser(user))
        );

        const validPreparations = emailPreparations.filter(p => p !== null);
        const batchEmails = validPreparations.map(p => p.emailData);

        if (batchEmails.length > 0) {
            try {
                console.log(`  📤 Sending batch of ${batchEmails.length} emails via gateway…`);
                await sendBatch(batchEmails);
                
                // Log all successfully sent emails
                for (const prep of validPreparations) {
                    await logEmailsSent(prep.userId, prep.jobIds);
                    stats.sent++;
                }
            } catch (err) {
                console.error(`  ❌ Batch send failed: ${err.message}`);
                stats.errors += batchEmails.length;
            }
        }

        stats.skipped += (users.length - validPreparations.length);
        stats.usersProcessed += users.length;

        cursorId = users[users.length - 1].user_id;
        if (users.length < USER_BATCH_SIZE) break;

        // Slight delay to be safe
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(50));
    console.log("  Pipeline Complete");
    console.log(`  Users processed : ${stats.usersProcessed}`);
    console.log(`  Emails sent     : ${stats.sent}`);
    console.log(`  Skipped (0 match): ${stats.skipped}`);
    console.log(`  Errors          : ${stats.errors}`);
    console.log("=".repeat(50));

    return stats;
}

if (require.main === module) {
    run();
}

module.exports = { run };
