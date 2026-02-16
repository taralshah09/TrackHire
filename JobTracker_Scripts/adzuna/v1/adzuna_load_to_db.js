const fs = require("fs-extra");
const mysql = require("mysql2/promise");

const DB_CONFIG = {
    host: "localhost",
    user: "root",
    password: "Ardumyaj@2599",
    database: "jobs_tracker_v1",
};

const BATCH_SIZE = 500;
const TABLE_NAME = "discover";

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

// Convert ISO date → MySQL DATETIME
function toMySQLDate(iso) {
    if (!iso) return null;
    return new Date(iso);
}

// ---------- Main Loader ----------

async function loadJobs() {
    const jobs = await fs.readJson("./adzuna_jobs_v1.json");

    const conn = await mysql.createConnection(DB_CONFIG);

    console.log(`📦 Processing ${jobs.length} jobs...`);

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        const batch = jobs.slice(i, i + BATCH_SIZE);

        const values = batch.map(job => [
            generateId(job.company, job.title, job.id),
            job.company,
            null, // company_logo
            job.title,
            job.location || null,
            null, // department
            mapEmploymentType(job.job_type),
            job.description || null,
            job.apply_url,
            toMySQLDate(job.date_posted),
            mapSource(job.source),
            detectRemote(job.location, job.title),
            null, // experience_level
            true, // is_active
            job.salary_min || 0,
            job.salary_max || 0,
        ]);

        const sql = `
      INSERT INTO ${TABLE_NAME} (
        id, company, company_logo, title, location, department,
        employment_type, description, apply_url, posted_at,
        source, is_remote, experience_level, is_active,
        min_salary, max_salary
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        location = VALUES(location),
        description = VALUES(description),
        posted_at = VALUES(posted_at),
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
    `;

        await conn.query(sql, [values]);

        console.log(`✅ Inserted ${i + batch.length}/${jobs.length}`);
    }

    await conn.end();
    console.log("🎉 All jobs loaded!");
}

loadJobs().catch(console.error);
