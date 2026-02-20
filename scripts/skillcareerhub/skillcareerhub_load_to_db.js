const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${DB_SCHEMA}`,
};

const BATCH_SIZE = 500;

/**
 * Loads jobs from JSON file to DB.
 * @param {string} filePath 
 * @returns {Promise<{ inserted: number, updated: number, failed: number }>}
 */
async function run(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return { inserted: 0, updated: 0, failed: 0 };
    }

    const jobsData = fs.readFileSync(filePath, "utf-8");
    const jobs = JSON.parse(jobsData);
    console.log(`Loaded ${jobs.length} jobs from ${filePath}.`);

    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    console.log("Connected to database.");

    let totalInserted = 0;

    try {
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const batch = jobs.slice(i, i + BATCH_SIZE);
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            for (const job of batch) {
                // Determine is_remote based on location
                const isRemote = job.location && job.location.toLowerCase().includes("remote") ? true : false;

                // Ensure posted_at is a valid date or null
                let postedAt = null;
                if (job.posted_at) {
                    postedAt = new Date(job.posted_at);
                    if (isNaN(postedAt.getTime())) {
                        postedAt = null;
                    }
                }

                const row = [
                    job.id, // Maps to external_id
                    job.company,
                    job.title,
                    job.location,
                    job.category,       // Mapping category to department
                    job.employment_type || null,
                    job.description,
                    job.apply_url,
                    postedAt,
                    "OTHER", // Source
                    isRemote,
                    job.company_logo || null,
                    "DISCOVER" // job_category
                ];
                values.push(...row);

                const rowPlaceholders = row.map(() => `$${paramIndex++}`).join(", ");
                placeholders.push(`(${rowPlaceholders})`);
            }

            const sql = `
            INSERT INTO jobs
            (external_id, company, title, location, department, employment_type,
             description, apply_url, posted_at, source, is_remote, company_logo, job_category)
            VALUES ${placeholders.join(", ")}
            ON CONFLICT (external_id) DO UPDATE SET
                title = EXCLUDED.title,
                location = EXCLUDED.location,
                description = EXCLUDED.description,
                company_logo = EXCLUDED.company_logo,
                posted_at = EXCLUDED.posted_at,
                updated_at = CURRENT_TIMESTAMP
            WHERE
                jobs.title IS DISTINCT FROM EXCLUDED.title OR
                jobs.description IS DISTINCT FROM EXCLUDED.description OR
                jobs.company_logo IS DISTINCT FROM EXCLUDED.company_logo
            `;

            const res = await client.query(sql, values);
            totalInserted += res.rowCount;
            console.log(`✅ Processed batch ${i + batch.length}/${jobs.length}`);
        }

        console.log(`\n🎉 Job load complete. Rows affected: ${totalInserted}`);
        return { inserted: totalInserted, updated: 0, failed: 0 };

    } catch (err) {
        console.error("Fatal error:", err);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        console.log("Database connection closed.");
    }
}

module.exports = { run };
