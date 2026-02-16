const axios = require("axios");
const fs = require("fs");

////////////////////////////////////////////////////////////
// CONFIG — YOUR ENDPOINTS
////////////////////////////////////////////////////////////

const endpoints = [
    { company: "PhonePe", url: "https://boards-api.greenhouse.io/v1/boards/phonepe/jobs", provider: "greenhouse" },
    { company: "Meesho", url: "https://api.lever.co/v0/postings/meesho", provider: "lever" },
    { company: "Linear", url: "https://api.ashbyhq.com/posting-api/job-board/linear", provider: "ashby" },
    { company: "Visa", url: "https://api.smartrecruiters.com/v1/companies/Visa/postings", provider: "smartrecruiters" }
];

////////////////////////////////////////////////////////////
// GENERIC FETCHER
////////////////////////////////////////////////////////////

async function fetchJSON(url) {
    try {
        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 15000
        });

        if (typeof res.data === "string") {
            console.warn("⚠️ HTML returned instead of JSON:", url);
            return null;
        }

        return res.data;
    } catch (err) {
        console.error("❌ Fetch failed:", url);
        return null;
    }
}

////////////////////////////////////////////////////////////
// NORMALIZERS
////////////////////////////////////////////////////////////

function normalizeGreenhouse(data, company) {
    return data.jobs.map(job => ({
        id: job.id?.toString(),
        company,
        title: job.title,
        location: job.location?.name || "",
        department: job.departments?.map(d => d.name).join(", ") || "",
        employment_type: "",
        description: "",
        apply_url: job.absolute_url,
        posted_at: job.updated_at || "",
        source: "greenhouse",
        is_remote: /remote/i.test(job.location?.name || "")
    }));
}

function normalizeLever(data, company) {
    return data.map(job => ({
        id: job.id,
        company,
        title: job.text,
        location: job.categories?.location || "",
        department: job.categories?.team || "",
        employment_type: job.categories?.commitment || "",
        description: job.descriptionPlain || "",
        apply_url: job.hostedUrl,
        posted_at: job.createdAt || "",
        source: "lever",
        is_remote: /remote/i.test(job.categories?.location || "")
    }));
}

function normalizeAshby(data, company) {
    return (data.jobs || []).map(job => ({
        id: job.id,
        company,
        title: job.title,
        location: job.location || "",
        department: job.department || "",
        employment_type: job.employmentType || "",
        description: job.descriptionPlain || "",
        apply_url: job.applyUrl,
        posted_at: job.publishedAt || "",
        source: "ashby",
        is_remote: /remote/i.test(job.location || "")
    }));
}

function normalizeSmartRecruiters(data, company) {
    return (data.content || []).map(job => ({
        id: job.id,
        company,
        title: job.name,
        location: job.location?.city || "",
        department: job.department || "",
        employment_type: job.typeOfEmployment || "",
        description: "",
        apply_url: job.ref,
        posted_at: job.releasedDate || "",
        source: "smartrecruiters",
        is_remote: /remote/i.test(job.location?.city || "")
    }));
}

////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////

function isValidJob(job) {
    return (
        job.id &&
        job.company &&
        job.title &&
        job.apply_url
    );
}

////////////////////////////////////////////////////////////
// DEDUPLICATION
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

////////////////////////////////////////////////////////////
// MAIN AGGREGATOR
////////////////////////////////////////////////////////////

async function aggregateJobs() {
    const allJobs = [];

    for (const { company, url, provider } of endpoints) {
        console.log(`Fetching ${company} (${provider})...`);

        const data = await fetchJSON(url);
        if (!data) continue;

        let normalized = [];

        switch (provider) {
            case "greenhouse":
                normalized = normalizeGreenhouse(data, company);
                break;
            case "lever":
                normalized = normalizeLever(data, company);
                break;
            case "ashby":
                normalized = normalizeAshby(data, company);
                break;
            case "smartrecruiters":
                normalized = normalizeSmartRecruiters(data, company);
                break;
        }

        const validJobs = normalized.filter(isValidJob);
        allJobs.push(...validJobs);
    }

    return dedupeJobs(allJobs);
}

////////////////////////////////////////////////////////////
// SAVE TO FILE
////////////////////////////////////////////////////////////

function saveToFile(jobs) {
    fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));
    console.log(`\n✅ Saved ${jobs.length} jobs to jobs.json`);
}

////////////////////////////////////////////////////////////
// RUN
////////////////////////////////////////////////////////////

(async () => {
    const jobs = await aggregateJobs();

    if (jobs.length === 0) {
        console.log("No jobs fetched.");
        return;
    }

    saveToFile(jobs);

    console.log("\nSample job:\n", jobs[0]);
})();
