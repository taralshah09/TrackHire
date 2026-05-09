const path = require("path");
const fs = require("fs-extra");
const loader = require("./multi_ats_load_to_db");

/**
 * Multi-ATS Pipeline
 * Scrapes jobs using the new-scrapper, normalizes them, and loads them to DB.
 */
async function run() {
    console.log("\n🔍 Starting Multi-ATS Pipeline...");
    
    // 1. Scrape using job-boards
    // Since scraper.js is ESM, we use dynamic import
    const scraperPath = path.resolve(__dirname, "../job-boards/scraper.js");
    
    let scrapedJobs = [];
    try {
        // Fix for Windows paths in dynamic import
        const scraperUrl = `file://${scraperPath.replace(/\\/g, "/")}`;
        const { runScraper } = await import(scraperUrl);
        scrapedJobs = await runScraper();
    } catch (err) {
        console.error("❌ Failed to run Multi-ATS scraper:", err.message);
        throw err;
    }

    if (scrapedJobs.length === 0) {
        console.log("⚠️ No jobs found by Multi-ATS scraper.");
        return { count: 0, filePath: null };
    }

    // 2. Extra filter for India and Deduplicate (just in case)
    const indiaKeywords = [
        "india", "bengaluru", "bangalore", "hyderabad", "mumbai", "pune",
        "chennai", "delhi", "gurugram", "gurgaon", "noida", "kolkata",
        "ahmedabad", "remote, india", "in", "blr", "hyd", "mum",
    ];

    const isIndia = (location = "") => {
        const loc = location.toLowerCase();
        return indiaKeywords.some((kw) => loc.includes(kw));
    };

    const seenUrls = new Set();
    const indiaJobs = scrapedJobs.filter(job => {
        if (!job.url || seenUrls.has(job.url)) return false;
        
        const loc = (job.location || "").toLowerCase();
        const title = (job.title || "").toLowerCase();
        
        const match = isIndia(loc) || isIndia(title);
        
        if (match) {
            seenUrls.add(job.url);
            return true;
        }
        return false;
    });

    console.log(`🇮🇳 Filtered to ${indiaJobs.length} India-specific jobs`);

    // 3. Normalize to the format expected by the loader
    // Required format: { company, title, id, location, job_type, description, apply_url, date_posted, source, is_remote, department }
    const normalizedJobs = indiaJobs.map(job => {
        // Create a unique ID from the URL
        const id = Buffer.from(job.url).toString("base64").substring(0, 16).replace(/[+/=]/g, "");
        
        return {
            company: job.company,
            title: job.title,
            id: id,
            location: job.location,
            job_type: job.title.toLowerCase().includes("intern") ? "INTERNSHIP" : "FULL_TIME",
            description: null, // Scraper doesn't fetch description yet
            apply_url: job.url,
            date_posted: job.postedAt || new Date().toISOString(),
            source: `ATS_${job.ats.toUpperCase()}`,
            is_remote: !!job.remote,
            department: job.department || null,
            salary_min: 0,
            salary_max: 0
        };
    });

    // 3. Save to temporary file
    const outputDir = path.resolve(__dirname, "../job-boards");
    const filePath = path.join(outputDir, "multi_ats_normalized.json");
    await fs.writeJson(filePath, normalizedJobs, { spaces: 2 });
    
    console.log(`✅ Normalized ${normalizedJobs.length} jobs and saved to ${filePath}`);
    
    return {
        count: normalizedJobs.length,
        filePath: filePath
    };
}

module.exports = { run };
