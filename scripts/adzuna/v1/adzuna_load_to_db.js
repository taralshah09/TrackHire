const fs = require("fs-extra");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
};

const BATCH_SIZE = 500;
const TABLE_NAME = "jobs";

// ---------- Helpers ----------

// Create primary key: company + title + id
function generateId(company, title, id, date) {
    const normalize = str =>
        str
            ?.toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w]/g, "") || "unknown";

    // Normalise date to YYYY-MM-DD so ID is clean and deterministic
    const dateStr = date ? new Date(date).toISOString().slice(0, 10) : "unknown";

    return `${normalize(company)}_${normalize(title)}_${id}_${dateStr}`;
}

// Map job type → ENUM
function mapEmploymentType(type) {
    if (!type) return null;

    const t = type.toLowerCase();

    if (t.includes("intern")) return "INTERNSHIP";
    if (t.includes("contract")) return "CONTRACT";
    if (t.includes("part")) return "PART_TIME";
    if (t.includes("temporary")) return "TEMPORARY";
    if (t.includes("freelance")) return "FREELANCE";
    return "FULL_TIME";
}

// Map source → ENUM
function mapSource(src) {
    if (!src) return "OTHER";

    const s = src.toLowerCase();
    if (s.includes("adzuna")) return "ADZUNA"; // Added Adzuna
    if (s.includes("linkedin")) return "LINKEDIN";
    if (s.includes("indeed")) return "INDEED";
    if (s.includes("glassdoor")) return "GLASSDOOR";
    if (s.includes("company")) return "COMPANY_WEBSITE";

    return "OTHER";
}

// Detect remote jobs
function detectRemote(location, title) {
    const text = `${location} ${title}`.toLowerCase();
    return text.includes("remote") || text.includes("work from home");
}

// Convert ISO date → MySQL DATETIME / Postgres TIMESTAMP
function toDate(iso) {
    if (!iso) return null;
    return new Date(iso);
}

// ---------- Main Loader ----------

// ---------- Main Loader ----------

/**
 * Helper to upsert a batch of jobs into a specific table.
 * @param {import('pg').PoolClient} client 
 * @param {string} tableName 
 * @param {Array} batch 
 * @returns {Promise<{ inserted: number, updated: number, skipped: number }>}
 */
async function upsertBatch(client, tableName, batch) {
    if (batch.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const job of batch) {
        const row = [
            generateId(job.company, job.title, job.id, job.date_posted),
            job.company,
            null, // company_logo
            job.title,
            job.location || null,
            null, // department
            mapEmploymentType(job.job_type),
            job.description || null,
            job.apply_url,
            toDate(job.date_posted),
            mapSource(job.source),
            detectRemote(job.location, job.title),
            null, // experience_level
            true, // is_active
            job.salary_min || 0,
            job.salary_max || 0,
            "DISCOVER", // job_category
            job.country_code || null // country_code
        ];
        values.push(...row);

        const rowPlaceholders = row.map(() => `$${paramIndex++}`).join(", ");
        placeholders.push(`(${rowPlaceholders})`);
    }

    const sql = `
        INSERT INTO ${tableName} (
            external_id, company, company_logo, title, location, department,
            employment_type, description, apply_url, posted_at,
            source, is_remote, experience_level, is_active,
            min_salary, max_salary, job_category, country_code
        )
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            posted_at = EXCLUDED.posted_at,
            country_code = EXCLUDED.country_code,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            ${tableName}.title IS DISTINCT FROM EXCLUDED.title OR
            ${tableName}.location IS DISTINCT FROM EXCLUDED.location OR
            ${tableName}.description IS DISTINCT FROM EXCLUDED.description
        RETURNING (xmax = 0) AS inserted
    `;

    const res = await client.query(sql, values);
    const inserted = res.rows.filter(r => r.inserted).length;
    const updated = res.rows.filter(r => !r.inserted).length;
    const skipped = batch.length - res.rows.length;

    return { inserted, updated, skipped };
}

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

    const jobs = await fs.readJson(filePath);

    const pool = new Pool(DB_CONFIG);
    pool.on("connect", (client) => {
        client.query(`SET search_path TO ${process.env.DB_SCHEMA}`);
    });

    console.log(`📦 Loading ${jobs.length} jobs from ${filePath}...`);
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const client = await pool.connect();
    try {
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const batch = jobs.slice(i, i + BATCH_SIZE);

            // 1. All jobs go to 'jobs' table
            const stats = await upsertBatch(client, "jobs", batch);
            totalInserted += stats.inserted;
            totalUpdated += stats.updated;
            totalSkipped += stats.skipped;

            // 2. Conditionally insert into intern_jobs or fulltime_jobs
            const internBatch = batch.filter(job => job.title && job.title.toLowerCase().includes("intern"));
            const fulltimeBatch = batch.filter(job => !job.title || !job.title.toLowerCase().includes("intern"));

            if (internBatch.length > 0) {
                await upsertBatch(client, "intern_jobs", internBatch);
            }
            if (fulltimeBatch.length > 0) {
                await upsertBatch(client, "fulltime_jobs", fulltimeBatch);
            }

            console.log(`✅ Batch ${i + batch.length}/${jobs.length} processed`);
        }

        console.log(`\n🎉 Load complete: ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped (unchanged)`);
        return { inserted: totalInserted, updated: totalUpdated, failed: 0 };
    } catch (err) {
        console.error("Error loading jobs:", err);
        throw err;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

module.exports = { run };
