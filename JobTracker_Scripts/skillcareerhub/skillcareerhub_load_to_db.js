const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Ardumyaj@2599",
    database: "jobs_tracker_v1",
    waitForConnections: true,
    connectionLimit: 20
};

async function saveJobsToDb() {
    let connection;
    try {
        const jobsFilePath = path.join(__dirname, "skillcareerhub_jobs.json");
        if (!fs.existsSync(jobsFilePath)) {
            console.error("Error: skillcareerhub_jobs.json not found.");
            return;
        }

        const jobsData = fs.readFileSync(jobsFilePath, "utf-8");
        const jobs = JSON.parse(jobsData);
        console.log(`Loaded ${jobs.length} jobs from JSON.`);

        connection = await mysql.createPool(dbConfig);
        console.log("Connected to database.");

        const sql = `
            INSERT INTO jobs
            (id, company, title, location, department, employment_type,
             description, apply_url, posted_at, source, is_remote, company_logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                title = VALUES(title),
                location = VALUES(location),
                description = VALUES(description),
                company_logo = VALUES(company_logo),
                updated_at = CURRENT_TIMESTAMP
        `;

        let inserted = 0;
        let updated = 0;
        let failed = 0;

        for (const job of jobs) {
            try {
                // Determine is_remote based on location
                const isRemote = job.location && job.location.toLowerCase().includes("remote") ? 1 : 0;

                // Ensure posted_at is a valid date or null
                let postedAt = null;
                if (jobs.indexOf(job) === 0) console.log("First job logo:", job.company_logo);
                if (job.posted_at) {
                    postedAt = new Date(job.posted_at);
                    if (isNaN(postedAt.getTime())) {
                        postedAt = null;
                    }
                }

                const [result] = await connection.execute(sql, [
                    job.id,
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
                    job.company_logo || null
                ]);

                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Failed to insert job ${job.id}:`, err.message);
                failed++;
            }
        }

        console.log("\nDatabase Import Summary:");
        console.log(`- Inserted: ${inserted}`);
        console.log(`- Updated: ${updated}`);
        console.log(`- Failed: ${failed}`);

    } catch (error) {
        console.error("Fatal error:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
    }
}

saveJobsToDb();
