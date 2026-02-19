const fs = require("fs-extra");
const { Pool } = require("pg");

const DB_CONFIG = {
    host: "localhost",
    user: "postgres",
    password: "root",
    database: "jobs_tracker_v1",
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

const BATCH_SIZE = 500;
const TABLE_NAME = "jobs";

// ---------- Helpers ----------

// Create primary key: company + title + id
function generateId(company, title, id) {
    const normalize = str =>
        str
            ?.toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w]/g, "") || "unknown";

    return `${normalize(company)}_${normalize(title)}_${id}`;
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

async function loadJobs() {
    const jobs = await fs.readJson("./adzuna_jobs_v1.json");

    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();

    console.log(`📦 Processing ${jobs.length} jobs...`);

    try {
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const batch = jobs.slice(i, i + BATCH_SIZE);

            // Construct values and placeholders for bulk insert
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            for (const job of batch) {
                const row = [
                    generateId(job.company, job.title, job.id),
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
        `;

            await client.query(sql, values);

            console.log(`✅ Inserted ${i + batch.length}/${jobs.length}`);
        }

        console.log("🎉 All jobs loaded!");
    } catch (err) {
        console.error("Error loading jobs:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

loadJobs().catch(console.error);
