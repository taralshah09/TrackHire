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

        // ---------- Relevance System Tables ----------
        console.log("Creating Relevance System tables...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS job_skills (
                job_id BIGINT NOT NULL,
                skill VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY(job_id, skill),

                CONSTRAINT fk_job_skills_job
                FOREIGN KEY(job_id)
                REFERENCES jobs(id) ON DELETE CASCADE
            );
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill);
            CREATE INDEX IF NOT EXISTS idx_job_skills_job ON job_skills(job_id);
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS user_job_relevance (
                user_id BIGINT NOT NULL,
                job_id BIGINT NOT NULL,

                score SMALLINT NOT NULL,
                reasons JSONB,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY(user_id, job_id),

                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_relevance_user_score ON user_job_relevance(user_id, score DESC);
            CREATE INDEX IF NOT EXISTS idx_relevance_job ON user_job_relevance(job_id);
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS job_enrichment (
                job_id BIGINT PRIMARY KEY,

                extracted_skills JSONB,
                role_family VARCHAR(100),
                seniority VARCHAR(50),

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );
        `);

        console.log("✅ Relevance System tables created successfully.");

    } catch (err) {
        console.error("❌ Error setting up database:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
