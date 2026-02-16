const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");

// 🔐 Add your credentials
const APP_ID = "b401efea";
const APP_KEY = "65ce630fab025f6d5e6fbd310680da3a";

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search";

// Tech keywords to search
const SEARCH_TERMS = [
    "software engineer",
    "software developer",
    "backend engineer",
    "frontend engineer",
    "full stack developer",
    "SDE",
    "data engineer",
    "machine learning engineer"
];

// Skill keywords for extraction
const SKILL_KEYWORDS = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust",
    "React", "Angular", "Vue", "Node.js", "Express",
    "Django", "Flask", "Spring", "ASP.NET",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes",
    "SQL", "MySQL", "PostgreSQL", "MongoDB",
    "Redis", "GraphQL", "REST", "Microservices",
    "TensorFlow", "PyTorch"
];

const RESULTS_PER_PAGE = 100;
const MAX_PAGES = 5; // Increase for more jobs

// 🧠 Extract skills from description

function extractSkills(text) {
    const found = new Set();
    // Helper to escape special regex characters (like + in C++)
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const skill of SKILL_KEYWORDS) {
        const escaped = escapeRegExp(skill);
        // Use (?:^|\W) instead of \b to handle keywords ending/starting with non-word chars (e.g. C++, .NET)
        // This ensures "C++" matches in "C++ Developer" but not "C++11" (mostly) or matches if followed by space/punctuation
        const regex = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, "i");
        if (regex.test(text)) found.add(skill);
    }

    return [...found];
}

// 🔗 Extract REAL apply URL from Adzuna redirect page
async function getRealApplyUrl(redirectUrl) {
    try {
        const res = await axios.get(redirectUrl, { timeout: 15000 });
        const $ = cheerio.load(res.data);

        // Adzuna apply buttons vary — try multiple selectors
        const link =
            $('a[data-qa="apply-button"]').attr("href") ||
            $('a.apply-button').attr("href") ||
            $('a:contains("Apply")').attr("href");

        if (!link) return redirectUrl;

        if (link.startsWith("http")) return link;

        return new URL(link, redirectUrl).href;

    } catch (err) {
        console.error("Failed to extract apply URL:", redirectUrl);
        return redirectUrl;
    }
}

// ⏳ Delay helper (avoid rate limits)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJobs() {
    const allJobs = [];

    for (const term of SEARCH_TERMS) {
        console.log(`\n🔎 Searching for: ${term}`);

        for (let page = 1; page <= MAX_PAGES; page++) {
            const url =
                `${BASE_URL}/${page}` +
                `?app_id=${APP_ID}` +
                `&app_key=${APP_KEY}` +
                `&what=${encodeURIComponent(term)}` +
                `&category=it-jobs` +
                `&sort_by=date` +
                `&results_per_page=${RESULTS_PER_PAGE}` +
                `&content-type=application/json`;

            try {
                const res = await axios.get(url);
                const jobs = res.data.results;

                if (!jobs.length) break;

                for (const job of jobs) {
                    console.log("➡️ Processing:", job.title);

                    const applyUrl = await getRealApplyUrl(job.redirect_url);

                    const description = job.description || "";

                    allJobs.push({
                        id: job.id,
                        title: job.title,
                        company: job.company?.display_name || "Unknown",
                        category: job.category?.label || "IT",
                        location: job.location?.display_name || "",
                        date_posted: job.created,
                        description: description,
                        skills: extractSkills(description),
                        job_type: job.contract_type || "",
                        salary_min: job.salary_min || null,
                        salary_max: job.salary_max || null,
                        source: "Adzuna",
                        apply_url: applyUrl
                    });

                    await sleep(500); // polite delay
                }

            } catch (err) {
                console.error("API error:", err.message);
            }
        }
    }

    // 🧹 Deduplicate by ID
    const uniqueJobs = Object.values(
        allJobs.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {})
    );

    await fs.writeJson("adzuna_jobs.json", uniqueJobs, { spaces: 2 });

    console.log(`\n✅ Saved ${uniqueJobs.length} jobs to adzuna_jobs.json`);
}

fetchJobs();
