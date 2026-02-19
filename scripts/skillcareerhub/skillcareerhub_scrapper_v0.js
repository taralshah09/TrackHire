const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();


const URL = process.env.SKILLHUB_URL;

const HEADERS = {
    "apikey": process.env.SKILLHUB_API_KEY,
    "authorization": "Bearer " + process.env.SKILLHUB_API_KEY,
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.6",
    "accept-profile": "public",
    "origin": "https://skillcareerhub.com",
    "referer": "https://skillcareerhub.com/",
    "cache-control": "no-cache",
    "pragma": "no-cache"
};

function sanitize(str) {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
}

function mapEmploymentType(type) {
    if (!type) return "FULL_TIME";
    const t = type.toLowerCase();
    if (t.includes("full")) return "FULL_TIME";
    if (t.includes("part")) return "PART_TIME";
    if (t.includes("contract")) return "CONTRACT";
    if (t.includes("intern")) return "INTERNSHIP";
    if (t.includes("temp")) return "TEMPORARY";
    if (t.includes("free")) return "FREELANCE";
    return "FULL_TIME";
}

function mapExperience(exp) {
    if (!exp) return "ENTRY";
    const e = exp.toLowerCase();
    if (e.includes("0") || e.includes("entry")) return "ENTRY";
    if (e.includes("junior")) return "JUNIOR";
    if (e.includes("mid")) return "MID";
    if (e.includes("senior")) return "SENIOR";
    if (e.includes("lead")) return "LEAD";
    if (e.includes("exec")) return "EXECUTIVE";
    return "ENTRY";
}

function buildDescription(job) {
    let text = job.description || "";
    if (job.requirements?.length) {
        text += "\n\n=== Requirements ===\n";
        text += job.requirements.map(r => `• ${r}`).join("\n");
    }
    if (job.benefits?.length) {
        text += "\n\n=== Benefits ===\n";
        text += job.benefits.map(b => `• ${b}`).join("\n");
    }
    return text;
}

function transformJob(job) {
    const newId = `${sanitize(job.company_name)}_${sanitize(job.title)}_${job.id}`;
    const location = job.location || job.company_location || null;

    return {
        id: newId,
        company: job.company_name,
        company_logo: job.company_logo || null,
        title: job.title,
        location: location,
        category: job.category || null,
        employment_type: mapEmploymentType(job.type),
        description: buildDescription(job),
        apply_url: job.apply_url,
        posted_at: job.created_at
            ? new Date(job.created_at).toISOString().slice(0, 19).replace("T", " ")
            : null,
        source: "SkillCareerHub", // Updated source name
        skills: job.skills || [],
        salary_min: null,
        salary_max: null
    };
}

async function fetchJobs() {
    try {
        const res = await fetch(URL, { headers: HEADERS });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Jobs fetched:", data.length);

        const transformedJobs = data.map(transformJob);

        fs.writeFileSync('skillcareerhub_jobs.json', JSON.stringify(transformedJobs, null, 2));
        console.log("Jobs saved to skillcareerhub_jobs.json");

    } catch (err) {
        console.error("Error fetching jobs:", err);
    }
}

fetchJobs();
