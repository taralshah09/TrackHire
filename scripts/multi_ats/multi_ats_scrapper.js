const path = require("path");
const { enqueueJob, queue } = require("./multi_ats_queue");
const { generateId, getExistingExternalIds } = require("./multi_ats_load_to_db");

/**
 * Multi-ATS Pipeline
 * Discovers jobs via job-boards/scraper.js, filters to India, normalises,
 * and enqueues each job into the BullMQ `description-scraper` queue.
 * The worker (multi_ats_worker.js) fetches descriptions and writes to the DB.
 */
async function run() {
    console.log("\n🔍 Starting Multi-ATS Pipeline...");

    // 1. Scrape using job-boards (ESM module, dynamic import required)
    const scraperPath = path.resolve(__dirname, "../job-boards/scraper.js");
    let scrapedJobs = [];
    try {
        const scraperUrl = `file://${scraperPath.replace(/\\/g, "/")}`;
        const { runScraper } = await import(scraperUrl);
        scrapedJobs = await runScraper();
    } catch (err) {
        console.error("❌ Failed to run Multi-ATS scraper:", err.message);
        throw err;
    }

    if (scrapedJobs.length === 0) {
        console.log("⚠️ No jobs found by Multi-ATS scraper.");
        await queue.close();
        return { count: 0, filePath: null };
    }

    // 2. Filter to India jobs and deduplicate
    const indiaRegex = /\b(india|bengaluru|bangalore|hyderabad|mumbai|pune|chennai|delhi|gurugram|gurgaon|noida|kolkata|ahmedabad|blr|hyd|mum)\b/i;

    const seenUrls = new Set();
    const indiaJobs = scrapedJobs.filter(job => {
        if (!job.url || seenUrls.has(job.url)) return false;
        // Only match against location to be precise
        const locMatch = job.location && indiaRegex.test(job.location);
        if (locMatch) { seenUrls.add(job.url); return true; }
        return false;
    });

    console.log(`🇮🇳 Filtered to ${indiaJobs.length} India-specific jobs`);

    // 3. Normalise all India jobs and compute their external_ids
    const normalized = indiaJobs.map(job => {
        const urlId = Buffer.from(job.url).toString("base64").substring(0, 16).replace(/[+/=]/g, "");
        const jobId = job.jobId || urlId;
        const date_posted = job.postedAt || new Date().toISOString();
        return {
            id: urlId,
            jobId,
            external_id: generateId(job.company, job.title, jobId, date_posted),
            url: job.url,
            company: job.company,
            title: job.title,
            ats: job.ats,
            location: job.location || null,
            source: `ATS_${(job.ats || "unknown").toUpperCase()}`,
            job_type: (job.title || "").toLowerCase().includes("intern") ? "INTERNSHIP" : "FULL_TIME",
            date_posted,
            is_remote: !!job.remote,
            department: job.department || null,
            description: job.description || null,
            salary_min: 0,
            salary_max: 0,
        };
    });

    // 4. Check which external_ids already exist in the DB — skip those
    console.log(`🔎 Checking ${normalized.length} jobs against DB for duplicates...`);
    const existingIds = await getExistingExternalIds(normalized.map(j => j.external_id));
    const newJobs = normalized.filter(j => !existingIds.has(j.external_id));

    console.log(`📋 ${existingIds.size} already in DB, ${newJobs.length} new jobs to enqueue`);

    // 5. Enqueue only new jobs — worker handles description fetch + DB write
    for (const job of newJobs) {
        await enqueueJob(job);
    }

    console.log(`✅ Enqueued ${newJobs.length} jobs for description scraping`);
    await queue.close();

    return { count: newJobs.length, filePath: null };
}

module.exports = { run };

if (require.main === module) {
    run().catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
}
