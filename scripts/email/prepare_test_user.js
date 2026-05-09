/**
 * prepare_test_user.js
 * 
 * Ensures the user with email 'taralshah604@gmail.com' is eligible for the 
 * email notification pipeline by:
 * 1. Enabling their account.
 * 2. Enabling their email notifications.
 * 3. Adding some sample job preferences if none exist.
 */

const pool = require("./db_pool");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TEST_EMAIL = "taralonyt@gmail.com";
const SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

async function prepare() {
    const client = await pool.connect();
    try {
        console.log(`\n🔍 Checking user: ${TEST_EMAIL}...`);

        // 1. Find the user
        const userRes = await client.query(
            `SELECT id, username FROM users WHERE email = $1`,
            [TEST_EMAIL]
        );

        if (userRes.rows.length === 0) {
            console.error(`❌ User with email ${TEST_EMAIL} not found.`);
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`  ✅ Found user ID: ${userId}`);

        // 2. Ensure account is enabled
        await client.query(
            `UPDATE users SET account_enabled = TRUE WHERE id = $1`,
            [userId]
        );
        console.log(`  ✅ Account enabled.`);

        // 3. Ensure preferences exist and are enabled
        const prefRes = await client.query(
            `SELECT id FROM user_job_preferences WHERE user_id = $1`,
            [userId]
        );

        let prefId;
        if (prefRes.rows.length === 0) {
            console.log(`  🛠️ Creating initial preferences...`);
            const insertPref = await client.query(
                `INSERT INTO user_job_preferences (user_id, email_enabled) 
                 VALUES ($1, TRUE) RETURNING id`,
                [userId]
            );
            prefId = insertPref.rows[0].id;
        } else {
            prefId = prefRes.rows[0].id;
            await client.query(
                `UPDATE user_job_preferences SET email_enabled = TRUE WHERE id = $1`,
                [prefId]
            );
            console.log(`  ✅ Email notifications enabled.`);
        }

        // 4. Add sample titles and skills if none exist
        const titlesRes = await client.query(
            `SELECT 1 FROM user_job_preference_titles WHERE preference_id = $1`,
            [prefId]
        );
        if (titlesRes.rows.length === 0) {
            console.log(`  🛠️ Adding sample job titles...`);
            await client.query(
                `INSERT INTO user_job_preference_titles (preference_id, title) 
                 VALUES ($1, 'Software Engineer'), ($1, 'Backend Developer')`,
                [prefId]
            );
        }

        const skillsRes = await client.query(
            `SELECT 1 FROM user_job_preference_skills WHERE preference_id = $1`,
            [prefId]
        );
        if (skillsRes.rows.length === 0) {
            console.log(`  🛠️ Adding sample skills...`);
            await client.query(
                `INSERT INTO user_job_preference_skills (preference_id, skill) 
                 VALUES ($1, 'Node.js'), ($1, 'React'), ($1, 'PostgreSQL')`,
                [prefId]
            );
        }

        console.log(`\n🎉 User ${TEST_EMAIL} is now fully eligible for test emails!`);

    } catch (err) {
        console.error("❌ Preparation failed:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

prepare();
