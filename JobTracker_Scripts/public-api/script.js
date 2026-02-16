const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");


const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Ardumyaj@2599",
    database: "jobs_tracker",
    waitForConnections: true,
    connectionLimit: 20
});


////////////////////////////////////////////////////////////
// ALL YOUR ENDPOINTS — JUST DATA
////////////////////////////////////////////////////////////

const endpoints = [

    // GREENHOUSE
    { company: "PhonePe", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/phonepe/jobs" },
    // { company: "Razorpay", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/razorpay/jobs" },
    { company: "CloudSEK", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/cloudsek/jobs" },
    { company: "InMobi", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/inmobi/jobs" },
    { company: "Coinbase", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/coinbase/jobs" },
    { company: "Stripe", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/stripe/jobs" },
    { company: "Dropbox", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/dropbox/jobs" },
    { company: "Airbnb", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/airbnb/jobs" },
    { company: "GitLab", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/gitlab/jobs" },
    { company: "Affirm", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/affirm/jobs" },
    { company: "Figma", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/figma/jobs" },
    { company: "Grammarly", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/grammarly/jobs" },
    { company: "Instacart", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/instacart/jobs" },
    { company: "MongoDB", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/mongodb/jobs" },
    { company: "Pinterest", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/pinterest/jobs" },
    { company: "Reddit", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/reddit/jobs" },
    { company: "Robinhood", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/robinhood/jobs" },
    { company: "Twilio", provider: "greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/twilio/jobs" },

    // LEVER
    { company: "Meesho", provider: "lever", url: "https://api.lever.co/v0/postings/meesho" },
    { company: "CRED", provider: "lever", url: "https://api.lever.co/v0/postings/cred" },

    // ASHBY
    { company: "OpenAI", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/openai" },
    { company: "Perplexity", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/perplexity" },
    { company: "Ramp", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/ramp" },
    { company: "Cursor", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/cursor" },
    { company: "Snowflake", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/snowflake" },
    { company: "Cartesia", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/cartesia" },
    { company: "Ema", provider: "ashby", url: "https://api.ashbyhq.com/posting-api/job-board/ema" },

    // SMARTRECRUITERS
    { company: "Visa", provider: "smartrecruiters", url: "https://api.smartrecruiters.com/v1/companies/Visa/postings" },
    { company: "ServiceNow", provider: "smartrecruiters", url: "https://api.smartrecruiters.com/v1/companies/ServiceNow/postings" },
    { company: "Bosch", provider: "smartrecruiters", url: "https://api.smartrecruiters.com/v1/companies/BoschGroup/postings" }

];

////////////////////////////////////////////////////////////
// FETCH
////////////////////////////////////////////////////////////

async function fetchData(url) {
    try {
        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        return res.data;
    } catch {
        return null;
    }
}
async function fetchDataPost(url) {
    try {
        const res = await axios.post(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        return res.data;
    } catch {
        return null;
    }
}

////////////////////////////////////////////////////////////
// GREENHOUSE
////////////////////////////////////////////////////////////

function gh(data, company) {
    return data.jobs.map(j => ({
        id: j.id.toString(),
        company,
        title: j.title,
        location: j.location?.name || "",
        department: j.departments?.map(d => d.name).join(", ") || "",
        employment_type: "",
        description: "",
        apply_url: j.absolute_url,
        posted_at: j.updated_at || "",
        source: "greenhouse",
        is_remote: /remote/i.test(j.location?.name || "")
    }));
}

////////////////////////////////////////////////////////////
// LEVER (JSON + HTML FALLBACK)
////////////////////////////////////////////////////////////

function lever(data, company) {
    // JSON case
    if (Array.isArray(data)) {
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

    // HTML case
    const $ = cheerio.load(data);
    const jobs = [];

    $("a").each((_, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr("href");

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

////////////////////////////////////////////////////////////
// ASHBY
////////////////////////////////////////////////////////////

function ashby(data, company) {
    return (data.jobs || []).map(j => ({
        id: j.id,
        company,
        title: j.title,
        location: j.location || "",
        department: j.department || "",
        employment_type: j.employmentType || "",
        description: j.descriptionPlain || "",
        apply_url: j.applyUrl,
        posted_at: j.publishedAt || "",
        source: "ashby",
        is_remote: /remote/i.test(j.location || "")
    }));
}

////////////////////////////////////////////////////////////
// SMARTRECRUITERS
////////////////////////////////////////////////////////////

function sr(data, company) {
    return (data.content || []).map(j => ({
        id: j.id,
        company,
        title: j.name,
        location: j.location?.city || "",
        department: j.department || "",
        employment_type: j.typeOfEmployment || "",
        description: "",
        apply_url: j.ref,
        posted_at: j.releasedDate || "",
        source: "smartrecruiters",
        is_remote: /remote/i.test(j.location?.city || "")
    }));
}

////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////

let jobs = [];
async function aggregateJobs() {

    for (const e of endpoints) {
        console.log("Fetching", e.company);

        const data = await fetchData(e.url);
        if (!data) continue;

        switch (e.provider) {
            case "greenhouse": jobs.push(...gh(data, e.company)); break;
            case "lever": jobs.push(...lever(data, e.company)); break;
            case "ashby": jobs.push(...ashby(data, e.company)); break;
            case "smartrecruiters": jobs.push(...sr(data, e.company)); break;
        }
    }

    fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));

    console.log(`✅ Saved ${jobs.length} jobs`);
    return jobs;
}


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
    ON DUPLICATE KEY UPDATE id = id
  `;

    let inserted = 0;

    for (const j of jobs) {
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

        if (result.affectedRows === 1) inserted++;
    }

    console.log(`✅ Inserted ${inserted} new jobs`);
}

(async () => {
    const rawJobs = await aggregateJobs();
    const uniqueJobs = dedupeJobs(rawJobs);
    console.log("After dedupe:", uniqueJobs.length);
    await insertJobs(uniqueJobs);
    process.exit();
})();
