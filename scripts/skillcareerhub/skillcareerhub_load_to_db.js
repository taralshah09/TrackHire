const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

async function saveJobsToDb() {
    const pool = new Pool(dbConfig);
    let client;
    try {
        const jobsFilePath = path.join(__dirname, "skillcareerhub_jobs.json");
        if (!fs.existsSync(jobsFilePath)) {
            console.error("Error: skillcareerhub_jobs.json not found.");
            return;
        }

        const jobsData = fs.readFileSync(jobsFilePath, "utf-8");
        const jobs = JSON.parse(jobsData);
        console.log(`Loaded ${jobs.length} jobs from JSON.`);

        client = await pool.connect();
        console.log("Connected to database.");

        const sql = `
            INSERT INTO jobs
            (external_id, company, title, location, department, employment_type,
             description, apply_url, posted_at, source, is_remote, company_logo, job_category)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (external_id) DO UPDATE SET
                title = EXCLUDED.title,
                location = EXCLUDED.location,
                description = EXCLUDED.description,
                company_logo = EXCLUDED.company_logo,
                updated_at = CURRENT_TIMESTAMP
        `;

        let inserted = 0;
        let failed = 0;

        for (const job of jobs) {
            try {
                // Determine is_remote based on location
                const isRemote = job.location && job.location.toLowerCase().includes("remote") ? true : false;

                // Ensure posted_at is a valid date or null
                let postedAt = null;
                if (jobs.indexOf(job) === 0) console.log("First job logo:", job.company_logo);
                if (job.posted_at) {
                    postedAt = new Date(job.posted_at);
                    if (isNaN(postedAt.getTime())) {
                        postedAt = null;
                    }
                }

                const result = await client.query(sql, [
                    job.id, // Maps to external_id
                    job.company,
                    job.title,
                    job.location,
                    job.category,       // Mapping category to department
                    job.employment_type || null,
                    job.description,
                    job.apply_url,
                    postedAt,
                    "OTHER", // Using 'OTHER' because 'SkillCareerHub' is not in the source ENUM
                    isRemote,
                    job.company_logo || null,
                    "DISCOVER" // Default job_category
                ]);

                if (result.rowCount > 0) {
                    inserted++;
                }
            } catch (err) {
                console.error(`Failed to insert job ${job.id}:`, err.message);
                failed++;
            }
        }

        console.log("\nDatabase Import Summary:");
        console.log(`- Processed (Inserted/Updated): ${inserted}`);
        console.log(`- Failed: ${failed}`);

    } catch (error) {
        console.error("Fatal error:", error);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        console.log("Database connection closed.");
    }
}

saveJobsToDb();
