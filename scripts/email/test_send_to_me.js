/**
 * test_send_to_me.js
 * 
 * SPECIAL TEST MODE:
 * Fetches data for 'taralshah604@gmail.com' but sends it to 'taralonyt@gmail.com'
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = require("./db_pool");
const { sendEmail, sendBatch } = require("./email_sender_gateway");
const { buildDigest } = require("./email_template");
const { findJobsForUser } = require("./job_matcher");

const DATA_EMAIL = "taralshah604@gmail.com";  // Who we get preferences/jobs for
const TARGET_EMAIL = "taralonyt@gmail.com";   // Who we actually send to (verified)
const MAX_JOBS_PER_EMAIL = 10;

async function runTest() {
    console.log(`\n🚀 Starting cross-test:`);
    console.log(`   - Data Source: ${DATA_EMAIL}`);
    console.log(`   - Destination: ${TARGET_EMAIL}\n`);
    
    const client = await pool.connect();
    try {
        // 1. Fetch preferences for the DATA_EMAIL
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
             WHERE u.email = $1
             GROUP BY u.id, u.email, u.username`,
            [DATA_EMAIL]
        );

        if (result.rows.length === 0) {
            console.error(`❌ Data source user ${DATA_EMAIL} not found.`);
            return;
        }

        const user = result.rows[0];
        console.log(`  ✅ Data found. Preferences: ${user.job_titles.length} titles, ${user.skills.length} skills.`);

        // 2. Find jobs for the DATA_EMAIL user
        const tieredJobs = await findJobsForUser(
            user.user_id,
            user.job_titles,
            user.skills,
            user.role_types,
            MAX_JOBS_PER_EMAIL
        );

        const { topPicks, recommended } = tieredJobs;
        const allJobs = [...topPicks, ...recommended];

        if (allJobs.length === 0) {
            console.log("  ⚠️ No matching jobs found for the data source user.");
            return;
        }

        console.log(`  🎯 Found ${allJobs.length} matching jobs.`);

        // 3. Build HTML
        const interests = [...user.job_titles, ...user.skills];
        const html = buildDigest({ username: user.username, email: user.email, interests }, tieredJobs);

        // 4. Send via Gateway to the TARGET_EMAIL
        const subject = `🎯 Test: ${allJobs.length} job matches for your profile`;
        console.log(`  📤 Sending email to ${TARGET_EMAIL} via gateway...`);
        
        await sendEmail(TARGET_EMAIL, subject, html);

        console.log(`\n✅ Success! Email sent to ${TARGET_EMAIL}.`);

    } catch (err) {
        if (err.response && err.response.data) {
            console.error(`\n❌ Test failed:`, JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(`\n❌ Test failed:`, err.message);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

runTest();
