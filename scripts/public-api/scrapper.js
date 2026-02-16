const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mysql = require("mysql2/promise");
const fs = require("fs");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Ardumyaj@2599",
    database: "jobs_tracker_v1",
    waitForConnections: true,
    connectionLimit: 20
});

////////////////////////////////////////////////////////////
// LOGGING UTILITIES
////////////////////////////////////////////////////////////

const logFile = "scraper.log";

function log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
}

function logError(company, error) {
    log(`Error scraping ${company}: ${error.message}`, "ERROR");
}

function logSuccess(company, count) {
    log(`✅ ${company}: Found ${count} jobs`, "SUCCESS");
}

////////////////////////////////////////////////////////////
// RETRY LOGIC
////////////////////////////////////////////////////////////

async function retryWithBackoff(fn, maxRetries = 3, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const waitTime = delay * Math.pow(2, i);
            log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`, "WARN");
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

////////////////////////////////////////////////////////////
// CAREER PAGE CONFIGURATIONS
////////////////////////////////////////////////////////////

const careerPages = [
    // Companies with API endpoints
    { company: "Apple", url: "https://jobs.apple.com/en-in/search?search=Software%20engineer&sort=relevance&location=india-INDC", type: "apple_api", enabled: true },
    { company: "Netflix", url: "https://jobs.netflix.com/api/search", type: "netflix_api", enabled: true },
    { company: "TikTok", url: "https://careers.tiktok.com/api/position/list", type: "tiktok_api", enabled: true },

    // Workday-based companies
    { company: "NVIDIA", url: "https://nvidia.eightfold.ai/careers?start=0&pid=893375058075&sort_by=timestamp", type: "workday", enabled: true },
    { company: "AMD", url: "https://careers.amd.com/careers-home/jobs", type: "workday", enabled: true },
    { company: "Salesforce", url: "https://salesforce.wd12.myworkdayjobs.com/External_Career_Site", type: "workday", enabled: true },
    { company: "Qualcomm", url: "https://qualcomm.wd5.myworkdayjobs.com/External", type: "workday", enabled: true },
    { company: "Wipro", url: "https://careers.wipro.com/careers-home/jobs", type: "workday", enabled: true },
    { company: "Workday", url: "https://workday.wd5.myworkdayjobs.com/Workday", type: "workday", enabled: true },

    // Phenom-based companies
    { company: "Intel", url: "https://jobs.intel.com/en/search-jobs", type: "phenom", enabled: true },
    { company: "Adobe", url: "https://careers.adobe.com/us/en/search-results", type: "phenom", enabled: true },
    { company: "Dell", url: "https://jobs.dell.com/search-jobs", type: "phenom", enabled: true },
    { company: "HP", url: "https://jobs.hp.com/en-us/search-jobs", type: "phenom", enabled: true },
    { company: "Cognizant", url: "https://careers.cognizant.com/global-en/jobs/", type: "phenom", enabled: true },

    // Lever-based companies
    { company: "Palantir", url: "https://jobs.lever.co/palantir", type: "lever", enabled: true },
    { company: "DoorDash", url: "https://careers.doordash.com/jobs/", type: "lever", enabled: true },
    { company: "Box", url: "https://www.box.com/careers/jobs", type: "lever", enabled: true },

    // Greenhouse-based companies (additional to your main script)
    { company: "Atlassian", url: "https://www.atlassian.com/company/careers/all-jobs", type: "greenhouse", enabled: true },
    { company: "Canva", url: "https://www.canva.com/careers/jobs/", type: "greenhouse", enabled: true },
    { company: "HubSpot", url: "https://www.hubspot.com/careers/jobs", type: "greenhouse", enabled: true },
    { company: "Zendesk", url: "https://jobs.zendesk.com/us/en", type: "greenhouse", enabled: true },
    { company: "Okta", url: "https://www.okta.com/company/careers/opportunity/", type: "greenhouse", enabled: true },
    { company: "CrowdStrike", url: "https://www.crowdstrike.com/careers/", type: "greenhouse", enabled: true },
    { company: "Datadog", url: "https://www.datadoghq.com/careers/", type: "greenhouse", enabled: true },
    { company: "Elastic", url: "https://jobs.elastic.co/", type: "greenhouse", enabled: true },
    { company: "Snap", url: "https://careers.snap.com/jobs", type: "greenhouse", enabled: true },
    { company: "Discord", url: "https://discord.com/careers", type: "greenhouse", enabled: true },
    { company: "Spotify", url: "https://www.lifeatspotify.com/jobs", type: "greenhouse", enabled: true },

    // Ashby-based companies (additional to your main script)
    { company: "Anthropic", url: "https://jobs.ashbyhq.com/anthropic", type: "ashby", enabled: true },

    // Workable-based companies
    { company: "Hugging Face", url: "https://apply.workable.com/huggingface/", type: "workable", enabled: true },

    // Custom scrapers needed
    { company: "Flipkart", url: "https://www.flipkartcareers.com/", type: "custom", enabled: false },
    { company: "Zomato", url: "https://www.zomato.com/careers", type: "custom", enabled: false },
    { company: "Swiggy", url: "https://careers.swiggy.com/", type: "custom", enabled: false },
    { company: "Zoho", url: "https://www.zoho.com/careers/jobs.html", type: "custom", enabled: true },
    { company: "Paytm", url: "https://paytm.com/careers/", type: "custom", enabled: false },
    { company: "Udaan", url: "https://udaan.com/careers/", type: "custom", enabled: false },
    { company: "Ola", url: "https://careers.olacabs.com/", type: "custom", enabled: false },
];

////////////////////////////////////////////////////////////
// FETCH UTILITIES
////////////////////////////////////////////////////////////

async function fetchWithAxios(url, options = {}) {
    return retryWithBackoff(async () => {
        const response = await axios({
            url,
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                ...options.headers
            },
            ...options
        });
        return response.data;
    });
}

async function fetchWithPuppeteer(url, waitForSelector = "body") {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000
        });

        try {
            await page.waitForSelector(waitForSelector, { timeout: 10000 });
        } catch {
            // Selector not found, continue anyway
        }

        // Scroll to load lazy content
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const content = await page.content();
        await browser.close();
        return content;
    } catch (error) {
        if (browser) await browser.close();
        throw error;
    }
}

////////////////////////////////////////////////////////////
// SCRAPERS BY TYPE
////////////////////////////////////////////////////////////

async function scrapeAppleAPI(url, company) {
    const data = await fetchWithAxios(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { filters: {}, page: 1 }
    });

    if (!data || !data.searchResults) return [];

    return data.searchResults.map(j => ({
        id: j.positionId,
        company,
        title: j.postingTitle,
        location: j.locations?.join(", ") || "",
        department: j.team || "",
        employment_type: "",
        description: "",
        apply_url: `https://jobs.apple.com/en-us/details/${j.positionId}`,
        posted_at: j.postingDate || "",
        source: "apple-api",
        is_remote: /remote/i.test(j.locations?.join(" ") || "")
    }));
}

async function scrapeNetflixAPI(url, company) {
    const data = await fetchWithAxios(url);

    if (!data || !data.records) return [];

    return data.records.map(j => ({
        id: j.external_id,
        company,
        title: j.text,
        location: j.location || "",
        department: j.team || "",
        employment_type: "",
        description: "",
        apply_url: `https://jobs.netflix.com/jobs/${j.external_id}`,
        posted_at: j.created_at || "",
        source: "netflix-api",
        is_remote: /remote/i.test(j.location || "")
    }));
}

async function scrapeTikTokAPI(url, company) {
    const data = await fetchWithAxios(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: {
            keyword: "",
            category: "",
            location: "",
            type: "",
            limit: 100
        }
    });

    if (!data || !data.data || !data.data.list) return [];

    return data.data.list.map(j => ({
        id: j.id,
        company,
        title: j.title,
        location: j.location || "",
        department: j.category || "",
        employment_type: j.type || "",
        description: "",
        apply_url: `https://careers.tiktok.com/position/${j.id}`,
        posted_at: j.create_time ? new Date(j.create_time * 1000).toISOString() : "",
        source: "tiktok-api",
        is_remote: /remote/i.test(j.location || "")
    }));
}

async function scrapeWorkday(url, company) {
    const html = await fetchWithPuppeteer(url, "li[data-automation-id='compositeContainer']");
    const $ = cheerio.load(html);
    const jobs = [];

    $("li[data-automation-id='compositeContainer'], .job-item, [data-automation-id='jobPostingItem']").each((_, el) => {
        const $el = $(el);
        const title = $el.find("a, h3").first().text().trim();
        const link = $el.find("a").first().attr("href");
        const location = $el.find("[data-automation-id='compositeLocation'], .location").first().text().trim();

        if (title && link) {
            jobs.push({
                id: link.split("/").pop() || link,
                company,
                title,
                location,
                department: "",
                employment_type: "",
                description: "",
                apply_url: link.startsWith("http") ? link : `${new URL(url).origin}${link}`,
                posted_at: "",
                source: "workday",
                is_remote: /remote/i.test(location)
            });
        }
    });

    return jobs;
}

async function scrapePhenom(url, company) {
    const html = await fetchWithPuppeteer(url, ".job-item, .jobs-list-item");
    const $ = cheerio.load(html);
    const jobs = [];

    $(".job-item, .jobs-list-item, [data-ph-at-job-title-text]").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h3, .job-title, [data-ph-at-job-title-text]").first().text().trim();
        const link = $el.find("a").first().attr("href");
        const location = $el.find(".location, [data-ph-at-job-location-text]").first().text().trim();

        if (title && link) {
            jobs.push({
                id: link.split("/").pop() || link,
                company,
                title,
                location,
                department: "",
                employment_type: "",
                description: "",
                apply_url: link.startsWith("http") ? link : `${new URL(url).origin}${link}`,
                posted_at: "",
                source: "phenom",
                is_remote: /remote/i.test(location)
            });
        }
    });

    return jobs;
}

async function scrapeLever(url, company) {
    // Try JSON endpoint first
    try {
        const data = await fetchWithAxios(url.replace(/\/$/, "") + "?mode=json");
        if (Array.isArray(data) && data.length > 0) {
            return data.map(j => ({
                id: j.id,
                company,
                title: j.text,
                location: j.categories?.location || "",
                department: j.categories?.team || "",
                employment_type: j.categories?.commitment || "",
                description: j.descriptionPlain || "",
                apply_url: j.hostedUrl,
                posted_at: j.createdAt || "",
                source: "lever",
                is_remote: /remote/i.test(j.categories?.location || "")
            }));
        }
    } catch {
        // Fall through to HTML scraping
    }

    // Fallback to HTML
    const html = await fetchWithAxios(url);
    const $ = cheerio.load(html);
    const jobs = [];

    $(".posting, a.posting-title").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h5, .posting-title").text().trim() || $el.text().trim();
        const link = $el.attr("href") || $el.find("a").first().attr("href");

        if (title && link) {
            jobs.push({
                id: link,
                company,
                title,
                location: "",
                department: "",
                employment_type: "",
                description: "",
                apply_url: link.startsWith("http") ? link : `https://jobs.lever.co${link}`,
                posted_at: "",
                source: "lever-html",
                is_remote: false
            });
        }
    });

    return jobs;
}

async function scrapeWorkable(url, company) {
    const html = await fetchWithAxios(url);
    const $ = cheerio.load(html);
    const jobs = [];

    $("li.job").each((_, el) => {
        const $el = $(el);
        const title = $el.find("a").first().text().trim();
        const link = $el.find("a").first().attr("href");
        const location = $el.find(".job-location").text().trim();

        if (title && link) {
            jobs.push({
                id: link.split("/").pop(),
                company,
                title,
                location,
                department: "",
                employment_type: "",
                description: "",
                apply_url: link.startsWith("http") ? link : `https://apply.workable.com${link}`,
                posted_at: "",
                source: "workable",
                is_remote: /remote/i.test(location)
            });
        }
    });

    return jobs;
}

////////////////////////////////////////////////////////////
// MAIN SCRAPER
////////////////////////////////////////////////////////////

async function scrapeCompany(endpoint) {
    if (!endpoint.enabled) {
        log(`⏭️  Skipping ${endpoint.company} (disabled)`, "INFO");
        return [];
    }

    log(`🔍 Scraping ${endpoint.company} (${endpoint.type})...`, "INFO");

    try {
        let jobs = [];

        switch (endpoint.type) {
            case "apple_api":
                jobs = await scrapeAppleAPI(endpoint.url, endpoint.company);
                break;
            case "netflix_api":
                jobs = await scrapeNetflixAPI(endpoint.url, endpoint.company);
                break;
            case "tiktok_api":
                jobs = await scrapeTikTokAPI(endpoint.url, endpoint.company);
                break;
            case "workday":
                jobs = await scrapeWorkday(endpoint.url, endpoint.company);
                break;
            case "phenom":
                jobs = await scrapePhenom(endpoint.url, endpoint.company);
                break;
            case "lever":
                jobs = await scrapeLever(endpoint.url, endpoint.company);
                break;
            case "workable":
                jobs = await scrapeWorkable(endpoint.url, endpoint.company);
                break;
            default:
                log(`⚠️  No scraper for type: ${endpoint.type}`, "WARN");
        }

        if (jobs.length > 0) {
            logSuccess(endpoint.company, jobs.length);
        } else {
            log(`⚠️  ${endpoint.company}: No jobs found`, "WARN");
        }

        return jobs;
    } catch (error) {
        logError(endpoint.company, error);
        return [];
    }
}

async function scrapeAllCompanies() {
    const allJobs = [];
    const stats = {
        total: 0,
        success: 0,
        failed: 0,
        skipped: 0
    };

    for (const endpoint of careerPages) {
        stats.total++;

        if (!endpoint.enabled) {
            stats.skipped++;
            continue;
        }

        const jobs = await scrapeCompany(endpoint);

        if (jobs.length > 0) {
            allJobs.push(...jobs);
            stats.success++;
        } else {
            stats.failed++;
        }

        // Rate limiting: 2-5 seconds between requests
        const delay = 2000 + Math.random() * 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    log(`\n📊 Scraping Statistics:`, "INFO");
    log(`   Total companies: ${stats.total}`, "INFO");
    log(`   Successful: ${stats.success}`, "INFO");
    log(`   Failed: ${stats.failed}`, "INFO");
    log(`   Skipped: ${stats.skipped}`, "INFO");
    log(`   Total jobs found: ${allJobs.length}`, "INFO");

    return allJobs;
}

////////////////////////////////////////////////////////////
// DATABASE
////////////////////////////////////////////////////////////

function dedupeJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
        const key = `${job.company}-${job.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function insertJobs(jobs) {
    const sql = `
        INSERT INTO jobs
        (id, company, title, location, department, employment_type,
         description, apply_url, posted_at, source, is_remote)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            title = VALUES(title),
            location = VALUES(location),
            updated_at = CURRENT_TIMESTAMP
    `;

    let inserted = 0;
    let updated = 0;

    for (const j of jobs) {
        try {
            const [result] = await db.execute(sql, [
                j.id,
                j.company,
                j.title,
                j.location,
                j.department,
                j.employment_type,
                j.description,
                j.apply_url,
                j.posted_at ? new Date(j.posted_at) : null,
                j.source,
                j.is_remote
            ]);

            if (result.affectedRows === 1) {
                inserted++;
            } else if (result.affectedRows === 2) {
                updated++;
            }
        } catch (error) {
            logError(`DB Insert ${j.company}`, error);
        }
    }

    log(`\n💾 Database Results:`, "INFO");
    log(`   Inserted: ${inserted} new jobs`, "SUCCESS");
    log(`   Updated: ${updated} existing jobs`, "SUCCESS");
}

////////////////////////////////////////////////////////////
// RUN
////////////////////////////////////////////////////////////

(async () => {
    console.log("Scrapping starts!")
    const startTime = Date.now();
    log("🚀 Starting job scraper...\n", "INFO");

    try {
        const rawJobs = await scrapeAllCompanies();

        if (rawJobs.length === 0) {
            log("⚠️  No jobs found across all companies", "WARN");
            process.exit(1);
        }

        const uniqueJobs = dedupeJobs(rawJobs);
        log(`\n📋 After deduplication: ${uniqueJobs.length} unique jobs`, "INFO");

        // Save to JSON for backup
        fs.writeFileSync("scraped_jobs.json", JSON.stringify(uniqueJobs, null, 2));
        log(`💾 Saved backup to scraped_jobs.json`, "INFO");

        await insertJobs(uniqueJobs);

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        log(`\n✅ Scraping complete! Duration: ${duration} minutes`, "SUCCESS");

    } catch (error) {
        log(`Fatal error: ${error.message}`, "ERROR");
        console.error(error);
        process.exit(1);
    } finally {
        await db.end();
    }

    console.log("Scrapping ends!")
    process.exit(0);
})();