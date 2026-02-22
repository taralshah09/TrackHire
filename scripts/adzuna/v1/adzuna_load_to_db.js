const fs = require("fs-extra");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 5,
    idleTimeoutMillis: 10000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", (client) => {
    client.query(`SET search_path TO ${DB_SCHEMA}`);
});

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
    const client = await pool.connect();

    console.log(`📦 Loading ${jobs.length} jobs from ${filePath}...`);
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const batch = jobs.slice(i, i + BATCH_SIZE);

            // Construct values and placeholders for bulk insert
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
                    "DISCOVER" // job_category
                ];
                values.push(...row);

                // Create placeholder string like ($1, $2, ... $17)
                const rowPlaceholders = row.map(() => `$${paramIndex++}`).join(", ");
                placeholders.push(`(${rowPlaceholders})`);
            }

            // Optimization: Add WHERE clause to ON CONFLICT to avoid "fake" updates
            // xmax=0 → fresh insert, xmax>0 → updated, not returned → skipped (no change)
            const sql = `
          INSERT INTO ${TABLE_NAME} (
            external_id, company, company_logo, title, location, department,
            employment_type, description, apply_url, posted_at,
            source, is_remote, experience_level, is_active,
            min_salary, max_salary, job_category
          )
          VALUES ${placeholders.join(", ")}
          ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            posted_at = EXCLUDED.posted_at,
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
          WHERE 
            jobs.title IS DISTINCT FROM EXCLUDED.title OR
            jobs.location IS DISTINCT FROM EXCLUDED.location OR
            jobs.description IS DISTINCT FROM EXCLUDED.description
          RETURNING (xmax = 0) AS inserted
        `;

            const res = await client.query(sql, values);
            const inserted = res.rows.filter(r => r.inserted).length;
            const updated = res.rows.filter(r => !r.inserted).length;
            const skipped = batch.length - res.rows.length;
            totalInserted += inserted;
            totalUpdated += updated;
            totalSkipped += skipped;

            console.log(`✅ Batch ${i + batch.length}/${jobs.length} — +${inserted} new, ~${updated} updated, =${skipped} skipped`);
        }

        console.log(`\n🎉 Load complete: ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped (unchanged)`);
        return { inserted: totalInserted, updated: totalUpdated, failed: 0 };
    } catch (err) {
        console.error("Error loading jobs:", err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

module.exports = { run };
