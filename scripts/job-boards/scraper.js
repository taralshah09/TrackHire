/**
 * India Jobs Scraper — Multi-ATS
 * Supports: Ashby · Greenhouse · Lever · Workday · SmartRecruiters
 *           · Workable · BambooHR · iCIMS · custom career pages
 *
 * Usage:
 *   node scraper.js                      # scrape all companies
 *   node scraper.js --ats ashby          # only Ashby companies
 *   node scraper.js --company notion     # single company
 *   node scraper.js --output jobs.json   # custom output file
 */

import fs from "fs/promises";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const CONFIG = {
    outputFile: "jobs.json",
    concurrency: 5,          // parallel requests at a time
    delayMs: 300,            // polite delay between requests (ms)
    retries: 3,
    timeoutMs: 15000,
    indiaKeywords: [         // location matching keywords
        "india", "bengaluru", "bangalore", "hyderabad", "mumbai", "pune",
        "chennai", "delhi", "gurugram", "gurgaon", "noida", "kolkata",
        "ahmedabad", "remote, india", "in", "blr", "hyd", "mum",
    ],
};

// ─── COMPANY REGISTRY ────────────────────────────────────────────────────────
// Format: { name, ats, slug/url, extraParams? }
//
// ATS values:
//   ashby | greenhouse | lever | workday | smartrecruiters
//   workable | bamboohr | icims | custom

const COMPANIES = [
    // ── ASHBY ──────────────────────────────────────────────────────────────────
    { name: "Notion", ats: "ashby", slug: "notion" },
    { name: "Linear", ats: "ashby", slug: "linear" },
    { name: "Vercel", ats: "ashby", slug: "vercel" },
    { name: "Runway", ats: "ashby", slug: "runway" },
    { name: "ElevenLabs", ats: "ashby", slug: "elevenlabs" },
    { name: "Cohere", ats: "ashby", slug: "cohere" },
    { name: "Warp", ats: "ashby", slug: "warp" },

    // ── GREENHOUSE ─────────────────────────────────────────────────────────────
    { name: "Stripe", ats: "greenhouse", slug: "stripe" },
    { name: "Airbnb", ats: "greenhouse", slug: "airbnb" },
    { name: "Coinbase", ats: "greenhouse", slug: "coinbase" },
    { name: "Figma", ats: "greenhouse", slug: "figma" },
    { name: "Dropbox", ats: "greenhouse", slug: "dropbox" },
    { name: "HubSpot", ats: "greenhouse", slug: "hubspot" },
    { name: "Squarespace", ats: "greenhouse", slug: "squarespace" },
    { name: "Brex", ats: "greenhouse", slug: "brex" },
    { name: "Discord", ats: "greenhouse", slug: "discord" },
    { name: "Duolingo", ats: "greenhouse", slug: "duolingo" },
    { name: "Pinterest", ats: "greenhouse", slug: "pinterest" },
    { name: "Twilio", ats: "greenhouse", slug: "twilio" },
    { name: "Databricks", ats: "greenhouse", slug: "databricks" },
    { name: "dbt Labs", ats: "greenhouse", slug: "dbtlabsinc" },
    { name: "Robinhood", ats: "greenhouse", slug: "robinhood" },
    { name: "LaunchDarkly", ats: "greenhouse", slug: "launchdarkly" },
    { name: "Ramp", ats: "greenhouse", slug: "ramp" },
    { name: "Amplitude", ats: "greenhouse", slug: "amplitude" },
    { name: "Mixpanel", ats: "greenhouse", slug: "mixpanel" },
    { name: "Contentful", ats: "greenhouse", slug: "contentful" },
    { name: "Cockroach Labs", ats: "greenhouse", slug: "cockroachlabs" },
    { name: "Netlify", ats: "greenhouse", slug: "netlify" },

    // ── LEVER ──────────────────────────────────────────────────────────────────
    { name: "Netflix", ats: "lever", slug: "netflix" },
    { name: "Spotify", ats: "lever", slug: "spotify" },
    { name: "Freshworks", ats: "lever", slug: "freshworks" },


    // ── SMARTRECRUITERS ────────────────────────────────────────────────────────
    { name: "Visa", ats: "smartrecruiters", slug: "Visa" },

    // ── WORKABLE ───────────────────────────────────────────────────────────────
    { name: "Spenmo", ats: "workable", slug: "spenmo" },
    { name: "Xoxoday", ats: "workable", slug: "xoxoday" },
    { name: "Kissflow", ats: "workable", slug: "kissflow" },
    { name: "Keka", ats: "workable", slug: "keka" },


    // ── CUSTOM / DIRECT SCRAPE ─────────────────────────────────────────────────
    // These companies host jobs on their own site or a niche ATS
    {
        name: "Dream11",
        ats: "lever",
        slug: "dream11",
    },
    {
        name: "Games24x7",
        ats: "lever",
        slug: "games24x7",
    },
    {
        name: "Vedantu",
        ats: "lever",
        slug: "vedantu",
    },
    {
        name: "Unacademy",
        ats: "lever",
        slug: "unacademy",
    },
];

// ─── ATS FETCHERS ────────────────────────────────────────────────────────────

/**
 * Generic fetch with timeout + retry
 */
async function fetchJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)",
                Accept: "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Normalize a raw job object into a standard shape
 */
function normalize({ title, location, url, department, remote, company, ats, postedAt, jobId }) {
    return { title, location, url, department, remote: !!remote, company, ats, postedAt, jobId };
}

/**
 * Check if a location string matches India using precise keyword matching
 */
function isIndia(location = "") {
    if (!location) return false;
    const loc = location.toLowerCase();
    
    // Use word boundaries to prevent matching substrings like "in" in "Berlin" or "Insurance"
    // Also removed "in" as a standalone keyword because it's too ambiguous (e.g. "Engineer in London")
    const indiaRegex = /\b(india|bengaluru|bangalore|hyderabad|mumbai|pune|chennai|delhi|gurugram|gurgaon|noida|kolkata|ahmedabad|blr|hyd|mum)\b/i;
    
    return indiaRegex.test(loc);
}

function htmlToPlain(html = "") {
    if (!html) return "";
    return html
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// ── Ashby ─────────────────────────────────────────────────────────────────────
// Docs: https://api.ashbyhq.com/posting-api/job-board/:company
async function fetchAshby(company) {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}`;
    const data = await fetchJSON(url);
    // data.jobPostings[]
            return (data.jobPostings || [])
            .filter((j) => isIndia(j.location) || j.isRemote)
            .map((j) => {
                const baseJob = normalize({
                    title: j.title,
                    location: j.location,
                    url: j.applyUrl || j.jobUrl,
                    department: j.department,
                    remote: j.isRemote,
                    company: company.name,
                    ats: "ashby",
                    postedAt: j.publishedAt,
                    jobId: j.id,
                });
                // Add plain description if available
                return {
                    ...baseJob,
                    description: j.descriptionPlain?.trim() || "",
                };
            });
}

// ── Greenhouse ────────────────────────────────────────────────────────────────
// Docs: https://boards-api.greenhouse.io/v1/boards/:slug/jobs?content=true
async function fetchGreenhouse(company) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
    const data = await fetchJSON(url);
    // data.jobs[]  — each job has offices[] and departments[]
            return (data.jobs || [])
            .filter((j) => {
                const locs = [
                    ...(j.offices || []).map((o) => o.name),
                    ...(j.location ? [j.location.name] : []),
                ].join(" ");
                return isIndia(locs);
            })
            .map((j) => {
                const loc = (j.offices || []).map((o) => o.name).join(", ") || j.location?.name;
                const dept = (j.departments || []).map((d) => d.name).join(", ");
                const description = j.content ? htmlToPlain(j.content) : "";
                const baseJob = normalize({
                    title: j.title,
                    location: loc,
                    url: j.absolute_url,
                    department: dept,
                    remote: false,
                    company: company.name,
                    ats: "greenhouse",
                    postedAt: j.updated_at,
                    jobId: j.id?.toString(),
                });
                return {
                    ...baseJob,
                    description,
                };
            });
}

// ── Lever ─────────────────────────────────────────────────────────────────────
// Public API: https://api.lever.co/v0/postings/:company?mode=json
async function fetchLever(company) {
    const slug = company.slug;
    const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
    const data = await fetchJSON(url);
    // data[] — array directly
    const jobs = Array.isArray(data) ? data : data.data || [];
    return jobs
        .filter((j) => {
            const loc = (j.categories?.location || j.workplaceType || "").toLowerCase();
            return isIndia(loc) || loc === "remote";
        })
        .map((j) => {
            const listParts = (j.lists || []).map(l => {
                const heading = l.text || "";
                const body = htmlToPlain(l.content || "");
                return [heading, body].filter(Boolean).join("\n");
            });
            const description = [
                j.descriptionPlain,
                j.descriptionBodyPlain,
                ...listParts,
                j.additionalPlain,
            ].filter(Boolean).join("\n\n");

            return {
                ...normalize({
                    title: j.text,
                    location: j.categories?.location,
                    url: j.applyUrl || `https://jobs.lever.co/${slug}/${j.id}/apply`,
                    department: j.categories?.team,
                    remote: j.workplaceType === "remote",
                    company: company.name,
                    ats: "lever",
                    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
                    jobId: j.id,
                }),
                description,
            };
        });
}

// ── Workday ───────────────────────────────────────────────────────────────────
// Workday has no standard public API. We POST to their internal faceted search.
// Each company has a unique subdomain + tenant. The `url` field in COMPANIES
// points to the CXS jobs endpoint. Payload: standard Workday search body.
async function fetchWorkday(company) {
    const url = company.url;
    if (!url) return [];

    const body = {
        appliedFacets: {},
        limit: 100,
        offset: 0,
        searchText: "",
    };

    const data = await fetchJSON(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    // data.jobPostings[]
    return (data.jobPostings || [])
        .filter((j) => isIndia(j.locationsText || j.location || ""))
        .map((j) => {
            // Build the apply URL from the company's Workday base + external path
            const base = url.replace(/\/wday\/cxs.*/, "");
            const applyUrl = j.externalPath ? `${base}${j.externalPath}` : "";
            return normalize({
                title: j.title,
                location: j.locationsText,
                url: applyUrl,
                department: j.jobFamilyGroupCode || "",
                remote: false,
                company: company.name,
                ats: "workday",
                postedAt: j.postedOn,
                jobId: j.externalPath?.split("/").pop(),
            });
        });
}

// ── SmartRecruiters ───────────────────────────────────────────────────────────
// Public API: https://api.smartrecruiters.com/v1/companies/:slug/postings
async function fetchSmartRecruiters(company) {
    let allJobs = [];
    let offset = 0;
    const limit = 100;
    while (true) {
        const url = `https://api.smartrecruiters.com/v1/companies/${company.slug}/postings?limit=${limit}&offset=${offset}`;
        const data = await fetchJSON(url);
        const items = data.content || [];
        allJobs.push(...items);
        if (items.length < limit || allJobs.length >= (data.totalFound || 0)) break;
        offset += limit;
        await sleep(CONFIG.delayMs);
    }

    // Filter and basic normalization
    const basicJobs = allJobs
        .filter((j) => {
            const loc = [j.location?.city, j.location?.region, j.location?.country]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return isIndia(loc) || j.location?.remote;
        })
        .map((j) => ({
            base: normalize({
                title: j.name,
                location: [j.location?.city, j.location?.region, j.location?.country]
                    .filter(Boolean)
                    .join(", "),
                url: `https://jobs.smartrecruiters.com/${company.slug}/${j.id}`,
                department: j.department?.label,
                remote: !!j.location?.remote,
                company: company.name,
                ats: "smartrecruiters",
                postedAt: j.releasedDate,
                jobId: j.id,
            }),
            detailUrl: j.ref,
        }));

    // Fetch detailed sections for each job (concurrently respecting a modest limit)
    const detailedJobs = await Promise.all(
        basicJobs.map(async ({ base, detailUrl }) => {
            try {
                const detail = await fetchJSON(detailUrl);
                const sections = detail.sections || {};
                const sectionKeys = ["companyDescription", "jobDescription", "qualifications", "additionalInformation"];
                const parts = sectionKeys
                    .map(key => sections[key])
                    .filter(Boolean)
                    .map(sec => {
                        const title = sec.title || "";
                        const text = htmlToPlain(sec.text || "");
                        return [title, text].filter(Boolean).join("\n");
                    });
                const description = parts.filter(Boolean).join("\n\n");
                return { ...base, description };
            } catch (e) {
                console.warn(`Failed to fetch details for job ${base.jobId}: ${e.message}`);
                return base;
            }
        })
    );

    return detailedJobs;
}

// ── Workable ──────────────────────────────────────────────────────────────────
// Public API: https://apply.workable.com/api/v3/accounts/:slug/jobs
async function fetchWorkable(company) {
    const url = `https://apply.workable.com/api/v3/accounts/${company.slug}/jobs`;
    const data = await fetchJSON(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "", location: [], department: [], worktype: [], remote: [] }),
    });

    return (data.results || [])
        .filter((j) => isIndia(j.location || "") || j.remote)
        .map((j) =>
            normalize({
                title: j.title,
                location: j.location,
                url: `https://apply.workable.com/${company.slug}/j/${j.shortcode}/`,
                department: j.department,
                remote: !!j.remote,
                company: company.name,
                ats: "workable",
                postedAt: j.published_on,
                jobId: j.shortcode,
            })
        );
}

// ── BambooHR ──────────────────────────────────────────────────────────────────
// Public API: https://:slug.bamboohr.com/careers/list
async function fetchBambooHR(company) {
    const url = `https://${company.slug}.bamboohr.com/careers/list`;
    const data = await fetchJSON(url);
    return (data.result || [])
        .filter((j) => isIndia(j.location?.city || j.location?.country || ""))
        .map((j) =>
            normalize({
                title: j.jobOpening?.jobOpeningName || j.title,
                location: [j.location?.city, j.location?.state, j.location?.country]
                    .filter(Boolean)
                    .join(", "),
                url: `https://${company.slug}.bamboohr.com/careers/${j.id}`,
                department: j.department?.label,
                remote: false,
                company: company.name,
                ats: "bamboohr",
                postedAt: j.datePosted,
                jobId: j.id?.toString(),
            })
        );
}

// ── Custom / iCIMS / HTML ─────────────────────────────────────────────────────
// For custom companies, delegate based on company.parser field
async function fetchCustom(company) {
    // If a custom company actually resolves to a known ATS, reuse that fetcher
    switch (company.parser) {
        case "lever":
            return fetchLever({ ...company, ats: "lever" });
        case "greenhouse":
            return fetchGreenhouse({ ...company, ats: "greenhouse" });
        case "ashby":
            return fetchAshby({ ...company, ats: "ashby" });
        default:
            // HTML scraping: fetch the page and try to extract <a> tags with job-like text
            return fetchHTMLPage(company);
    }
}

async function fetchHTMLPage(company) {
    const res = await fetch(company.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)" },
        signal: AbortSignal.timeout(CONFIG.timeoutMs),
    });

    const html = await res.text();

    // Very naive link extractor — replace with cheerio or JSDOM for production
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const jobs = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (text.length > 10 && text.length < 200 && (href.includes("job") || href.includes("career"))) {
            jobs.push(
                normalize({
                    title: text,
                    location: "India (check listing)",
                    url: href.startsWith("http") ? href : new URL(href, company.url).href,
                    department: "",
                    remote: false,
                    company: company.name,
                    ats: "custom-html",
                    postedAt: null,
                })
            );
        }
    }

    return jobs;
}

// ─── DISPATCHER ──────────────────────────────────────────────────────────────

const ATS_MAP = {
    ashby: fetchAshby,
    greenhouse: fetchGreenhouse,
    lever: fetchLever,
    workday: fetchWorkday,
    smartrecruiters: fetchSmartRecruiters,
    workable: fetchWorkable,
    bamboohr: fetchBambooHR,
    custom: fetchCustom,
};

async function scrapeCompany(company) {
    const fetcher = ATS_MAP[company.ats];
    if (!fetcher) {
        console.warn(`⚠️  No fetcher for ATS: ${company.ats} (${company.name})`);
        return [];
    }

    try {
        const jobs = await fetcher(company);
        console.log(`✅  ${company.name.padEnd(25)} → ${jobs.length} India jobs`);
        return jobs;
    } catch (err) {
        console.error(`❌  ${company.name.padEnd(25)} → ${err.message}`);
        return [];
    }
}

// ─── CONCURRENCY POOL ─────────────────────────────────────────────────────────

async function runPool(tasks, concurrency) {
    const results = [];
    const queue = [...tasks];

    async function worker() {
        while (queue.length > 0) {
            const task = queue.shift();
            const result = await task();
            results.push(...result);
            await sleep(CONFIG.delayMs);
        }
    }

    await Promise.all(
        Array.from({ length: concurrency }, () => worker())
    );

    return results;
}

// ─── CLI ARGS ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { ats: null, company: null, output: CONFIG.outputFile };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--ats") opts.ats = args[++i];
        if (args[i] === "--company") opts.company = args[++i]?.toLowerCase();
        if (args[i] === "--output") opts.output = args[++i];
    }

    return opts;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export async function runScraper(options = {}) {
    const companies = options.ats 
        ? COMPANIES.filter((c) => c.ats === options.ats)
        : options.company
            ? COMPANIES.filter((c) => c.name.toLowerCase().includes(options.company.toLowerCase()))
            : COMPANIES;

    console.log(`\n🔍  Scraping ${companies.length} companies for India jobs...\n`);
    const startTime = Date.now();

    const tasks = companies.map((company) => () => scrapeCompany(company));
    const allJobs = await runPool(tasks, CONFIG.concurrency);

    // Deduplicate by URL
    const seen = new Set();
    const unique = allJobs.filter((j) => {
        if (!j.url || seen.has(j.url)) return false;
        seen.add(j.url);
        return true;
    });

    // Sort by company name then title
    unique.sort((a, b) =>
        a.company.localeCompare(b.company) || a.title.localeCompare(b.title)
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n📊  Found ${unique.length} unique India jobs in ${elapsed}s`);

    return unique;
}

async function main() {
    const opts = parseArgs();
    const unique = await runScraper(opts);
    const companiesCount = opts.ats 
        ? COMPANIES.filter((c) => c.ats === opts.ats).length
        : opts.company
            ? COMPANIES.filter((c) => c.name.toLowerCase().includes(opts.company)).length
            : COMPANIES.length;

    // Stats breakdown
    const byAts = unique.reduce((acc, j) => {
        acc[j.ats] = (acc[j.ats] || 0) + 1;
        return acc;
    }, {});
    console.log("\n📋  Breakdown by ATS:");
    Object.entries(byAts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([ats, count]) => console.log(`    ${ats.padEnd(20)} ${count}`));

    // Write output
    const output = {
        scrapedAt: new Date().toISOString(),
        totalJobs: unique.length,
        companiesScraped: companiesCount,
        jobs: unique,
    };

    await fs.writeFile(opts.output, JSON.stringify(output, null, 2));
    console.log(`\n💾  Saved to ${opts.output}\n`);
}

// Only run if called directly
if (process.argv[1] && process.argv[1].endsWith("scraper.js")) {
    main().catch((err) => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}