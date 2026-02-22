/**
 * setup_email_preferences.js
 *
 * Creates the two tables required by the email notification service:
 *   1. user_job_preferences — stores each user's desired titles & skills
 *   2. email_log            — tracks which jobs were emailed to which users
 *                             (used for 7-day deduplication)
 *
 * Run once (or on each deploy) — all statements are idempotent (IF NOT EXISTS).
 *
 * Usage:
 *   node setup_email_preferences.js
 */

const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", (client) => {
    client.query(`SET search_path TO ${DB_SCHEMA}`);
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log(`\n🛠️  Setting up email tables in schema: ${DB_SCHEMA}\n`);

        // ── 1. user_job_preferences ──────────────────────────────────────────
        console.log("Creating user_job_preferences table…");
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_job_preferences (
                id              SERIAL          PRIMARY KEY,

                -- References users.id (no FK enforced here; managed by app layer)
                user_id         BIGINT          NOT NULL UNIQUE,

                -- Arrays of preferred job title keywords and skill names
                -- e.g. job_titles = ['software engineer', 'backend developer']
                --      skills     = ['Java', 'Docker', 'AWS']
                job_titles      TEXT[]          NOT NULL DEFAULT '{}',
                skills          TEXT[]          NOT NULL DEFAULT '{}',

                -- Opt-out flag: set to FALSE to stop receiving emails
                email_enabled   BOOLEAN         NOT NULL DEFAULT TRUE,

                created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("  ✅ user_job_preferences table ready.");

        // Index: fast look-up by user_id (already implicit via UNIQUE, but explicit for clarity)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ujp_user_id
            ON user_job_preferences (user_id)
            WHERE email_enabled = TRUE;
        `);
        console.log("  ✅ Index idx_ujp_user_id created.");

        // GIN index on job_titles array for faster ANY() / @> queries if needed later
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ujp_job_titles_gin
            ON user_job_preferences USING GIN (job_titles);
        `);
        console.log("  ✅ GIN index on job_titles created.");

        // Auto-update updated_at via a trigger
        await client.query(`
            CREATE OR REPLACE FUNCTION update_ujp_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_trigger
                    WHERE tgname = 'trg_ujp_updated_at'
                ) THEN
                    CREATE TRIGGER trg_ujp_updated_at
                    BEFORE UPDATE ON user_job_preferences
                    FOR EACH ROW EXECUTE FUNCTION update_ujp_updated_at();
                END IF;
            END $$;
        `);
        console.log("  ✅ Auto-update trigger on updated_at set.");

        // ── 2. email_log ─────────────────────────────────────────────────────
        console.log("\nCreating email_log table…");
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_log (
                id          SERIAL      PRIMARY KEY,
                user_id     BIGINT      NOT NULL,
                job_id      BIGINT      NOT NULL,
                sent_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

                -- Prevents the same job from being emailed to the same user twice
                UNIQUE (user_id, job_id)
            );
        `);
        console.log("  ✅ email_log table ready.");

        // Composite index for the dedup query: WHERE user_id = ? AND sent_at >= ?
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_email_log_user_sent
            ON email_log (user_id, sent_at DESC);
        `);
        console.log("  ✅ Index idx_email_log_user_sent created.");

        console.log("\n🎉 All email tables and indices created successfully!\n");

    } catch (err) {
        console.error("❌ Setup failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
