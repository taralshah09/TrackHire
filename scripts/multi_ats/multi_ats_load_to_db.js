const fs = require("fs-extra");
const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

// Shared pool used by the long-running worker process
let _workerPool = null;

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

// ---------- Helpers ----------

function generateId(company, title, id, date) {
    const normalize = str =>
        str
            ?.toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "") || "unknown";

    const dateStr = date ? new Date(date).toISOString().slice(0, 10) : "no-date";
    // Using a clear separator to match the requested components
    return `${normalize(company)}--${normalize(title)}--${id}--${dateStr}`;
}

function mapEmploymentType(type) {
    if (!type) return "FULL_TIME";
    const t = type.toLowerCase();
    if (t.includes("intern")) return "INTERNSHIP";
    if (t.includes("contract")) return "CONTRACT";
    if (t.includes("part")) return "PART_TIME";
    if (t.includes("temporary")) return "TEMPORARY";
    if (t.includes("freelance")) return "FREELANCE";
    return "FULL_TIME";
}

function mapSource(src) {
    if (!src) return "COMPANY_WEBSITE";
    const s = src.toLowerCase();
    if (s.includes("adzuna")) return "ADZUNA";
    if (s.includes("linkedin")) return "LINKEDIN";
    if (s.includes("indeed")) return "INDEED";
    if (s.includes("glassdoor")) return "GLASSDOOR";
    return "COMPANY_WEBSITE";
}

function detectRemote(location, title, remoteFlag) {
    if (remoteFlag) return true;
    const text = `${location} ${title}`.toLowerCase();
    return text.includes("remote") || text.includes("work from home");
}

function toDate(iso) {
    if (!iso) return null;
    return new Date(iso);
}

async function upsertBatch(client, tableName, batch) {
    if (batch.length === 0) return { inserted: 0, updated: 0, skipped: 0 };

    const values = [];
    const placeholders = [];
    let paramIndex = 1;
    // Deduplicate batch by external_id to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueBatchMap = new Map();
    for (const job of batch) {
        const extId = job.external_id || generateId(job.company, job.title, job.jobId || job.id, job.date_posted);
        if (!uniqueBatchMap.has(extId)) {
            uniqueBatchMap.set(extId, { ...job, extId });
        }
    }
    const uniqueBatch = Array.from(uniqueBatchMap.values());

    for (const job of uniqueBatch) {
        const row = [
            job.extId,
            job.company,
            null, // company_logo
            job.title,
            job.location || null,
            job.department || null,
            mapEmploymentType(job.job_type),
            job.description || null,
            job.apply_url,
            toDate(job.date_posted),
            mapSource(job.source),
            detectRemote(job.location, job.title, job.is_remote),
            null, // experience_level
            true, // is_active
            job.salary_min || 0,
            job.salary_max || 0,
            "DISCOVER" // job_category
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
            min_salary, max_salary, job_category
        )
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            location = EXCLUDED.location,
            department = EXCLUDED.department,
            posted_at = EXCLUDED.posted_at,
            description = COALESCE(EXCLUDED.description, ${tableName}.description),
            is_active = EXCLUDED.is_active,
            updated_at = CURRENT_TIMESTAMP
        WHERE 
            ${tableName}.title IS DISTINCT FROM EXCLUDED.title OR
            ${tableName}.location IS DISTINCT FROM EXCLUDED.location OR
            ${tableName}.department IS DISTINCT FROM EXCLUDED.department OR
            (EXCLUDED.description IS NOT NULL AND ${tableName}.description IS DISTINCT FROM EXCLUDED.description)
        RETURNING (xmax = 0) AS inserted
    `;

    const res = await client.query(sql, values);
    const inserted = res.rows.filter(r => r.inserted).length;
    const updated = res.rows.filter(r => !r.inserted).length;
    const skipped = batch.length - res.rows.length;

    return { inserted, updated, skipped };
}

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

    console.log(`📦 Loading ${jobs.length} Multi-ATS jobs from ${filePath}...`);
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const client = await pool.connect();
    try {
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const batch = jobs.slice(i, i + BATCH_SIZE);

            const stats = await upsertBatch(client, "jobs", batch);
            totalInserted += stats.inserted;
            totalUpdated += stats.updated;
            totalSkipped += stats.skipped;

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

        console.log(`\n🎉 Multi-ATS Load complete: ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped`);
        return { inserted: totalInserted, updated: totalUpdated, failed: 0 };
    } catch (err) {
        console.error("Error loading jobs:", err);
        throw err;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

function getWorkerPool() {
    if (!_workerPool) {
        _workerPool = new Pool(DB_CONFIG);
        _workerPool.on("connect", (client) => {
            client.query(`SET search_path TO ${DB_SCHEMA}`);
        });
    }
    return _workerPool;
}

async function upsertSingleJob(jobData) {
    const pool = getWorkerPool();
    const client = await pool.connect();
    try {
        await upsertBatch(client, "jobs", [jobData]);
        const isIntern = (jobData.title || "").toLowerCase().includes("intern");
        if (isIntern) {
            await upsertBatch(client, "intern_jobs", [jobData]);
        } else {
            await upsertBatch(client, "fulltime_jobs", [jobData]);
        }
    } finally {
        client.release();
    }
}

async function closeWorkerPool() {
    if (_workerPool) {
        await _workerPool.end();
        _workerPool = null;
    }
}

async function getExistingExternalIds(externalIds) {
    if (externalIds.length === 0) return new Set();
    const pool = new Pool(DB_CONFIG);
    try {
        await pool.query(`SET search_path TO ${DB_SCHEMA}`);
        const res = await pool.query(
            `SELECT external_id FROM ${DB_SCHEMA}.jobs          WHERE external_id = ANY($1)
             UNION
             SELECT external_id FROM ${DB_SCHEMA}.fulltime_jobs WHERE external_id = ANY($1)
             UNION
             SELECT external_id FROM ${DB_SCHEMA}.intern_jobs   WHERE external_id = ANY($1)`,
            [externalIds]
        );
        return new Set(res.rows.map(r => r.external_id));
    } finally {
        await pool.end();
    }
}

module.exports = { run, upsertSingleJob, closeWorkerPool, generateId, getExistingExternalIds };
