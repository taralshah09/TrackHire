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

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Running migration: add country_code column...\n");

        for (const table of ["jobs", "intern_jobs", "fulltime_jobs"]) {
            await client.query(
                `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS country_code VARCHAR(5);`
            );
            console.log(`✅ ${table} — country_code column ready`);
        }

        console.log("\n✅ Migration complete. DB is ready for global country filtering.");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
