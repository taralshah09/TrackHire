const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${DB_SCHEMA}`,
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log("Creating job_sync_history table...");

        await client.query(`
            CREATE TABLE IF NOT exists job_sync_history (
                id SERIAL PRIMARY KEY,
                pipeline_name VARCHAR(50) NOT NULL,
                start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                status VARCHAR(20) CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
                jobs_processed INTEGER DEFAULT 0,
                jobs_inserted INTEGER DEFAULT 0,
                cursor_value TEXT, 
                error_message TEXT
            );
        `);

        console.log("✅ job_sync_history table created successfully.");

        // Add index on pipeline_name and start_time for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_job_sync_history_pipeline 
            ON job_sync_history(pipeline_name, start_time DESC);
        `);
        console.log("✅ Indices created.");

    } catch (err) {
        console.error("❌ Error setting up database:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
