const { Worker } = require("bullmq");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG, QUEUE_NAME } = require("./multi_ats_queue");
const { upsertSingleJob, closeWorkerPool } = require("./multi_ats_load_to_db");

// Source-specific CSS selectors for description content
const SELECTORS = {
    greenhouse: "div#content",
    lever: "div.posting-description",
    ashby: "div.ashby-job-posting-details",
    smartrecruiters: "div.job-details",
};

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

async function scrapeWithAxios(url, atsType) {
    const res = await axios.get(url, {
        headers: REQUEST_HEADERS,
        timeout: 15000,
    });
    const $ = cheerio.load(res.data);
    const selector = SELECTORS[atsType] || "body";
    const text = $(selector).text().replace(/\s+/g, " ").trim();
    if (text.length < 50) {
        throw new Error(`Thin content (${text.length} chars) for selector "${selector}"`);
    }
    return text;
}

async function scrapeWithPuppeteer(url, atsType) {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process"
        ],
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent(USER_AGENT);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        const selector = SELECTORS[atsType] || "body";
        // Best-effort wait — don't hard-fail if selector doesn't appear
        await page.waitForSelector(selector, { timeout: 10000 }).catch(() => { });

        const text = await page
            .$eval(selector, (el) => el.innerText.replace(/\s+/g, " ").trim())
            .catch(() => "");

        if (text.length < 50) {
            throw new Error(`Thin content from Puppeteer (${text.length} chars)`);
        }
        return text;
    } finally {
        await browser.close();
    }
}

async function scrapeDescription(url, atsType) {
    try {
        return await scrapeWithAxios(url, atsType);
    } catch (axiosErr) {
        console.warn(`⚠️  Axios failed [${atsType}] ${url}: ${axiosErr.message} — trying Puppeteer`);
        try {
            return await scrapeWithPuppeteer(url, atsType);
        } catch (puppeteerErr) {
            console.error(`❌  Puppeteer also failed [${atsType}] ${url}: ${puppeteerErr.message}`);
            return null;
        }
    }
}

const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { url, ats, title, company } = job.data;
        console.log(`🔍  [${ats}] ${title} @ ${company}`);

        const description = await scrapeDescription(url, ats);

        // Atomic: upsert only after description is resolved (null on definitive failure)
        await upsertSingleJob({
            ...job.data,
            apply_url: url,
            description,
        });

        return { scraped: description !== null };
    },
    {
        connection: REDIS_CONFIG,
        concurrency: 5,
        limiter: { max: 5, duration: 5000 },
    }
);

worker.on("completed", (job, result) => {
    const status = result.scraped ? "✅ desc fetched" : "⚠️ desc null";
    console.log(`  ${status} — [${job.id}] ${job.data.title}`);
});

worker.on("failed", (job, err) => {
    console.error(`  ❌ failed — [${job?.id}] ${job?.data?.title}: ${err.message}`);
});

async function shutdown() {
    console.log("Shutting down worker...");
    await worker.close();
    await closeWorkerPool();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("🚀 Multi-ATS description worker started");

module.exports = { scrapeDescription };
