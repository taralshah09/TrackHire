const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 🔐 Add your credentials
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

const BASE_URL = process.env.ADZUNA_BASE_URL;

// Tech keywords to search
const SEARCH_TERMS = [

    // 🔹 Core Software Engineering
    "software engineer",
    "software developer",
    "software development engineer",
    "SDE",
    "application developer",
    "programmer",

    // 🔹 Frontend
    "frontend engineer",
    "frontend developer",
    "front end developer",
    "front end engineer",
    "UI developer",
    "React developer",
    "Angular developer",
    "Vue developer",

    // 🔹 Backend
    "backend engineer",
    "backend developer",
    "back end developer",
    "API developer",
    "server side engineer",

    // 🔹 Full Stack
    "full stack developer",
    "full stack engineer",
    "fullstack developer",

    // 🔹 Mobile
    "android developer",
    "ios developer",
    "mobile developer",
    "react native developer",
    "flutter developer",
    "mobile engineer",

    // 🔹 Data & AI
    "data engineer",
    "data scientist",
    "machine learning engineer",
    "AI engineer",
    "deep learning engineer",
    "analytics engineer",
    "NLP engineer",

    // 🔹 DevOps / Cloud / SRE
    "devops engineer",
    "site reliability engineer",
    "SRE",
    "cloud engineer",
    "platform engineer",
    "infrastructure engineer",
    "build engineer",
    "release engineer",

    // 🔹 Security
    "security engineer",
    "application security engineer",
    "cybersecurity engineer",
    "information security engineer",

    // 🔹 QA / Testing
    "QA engineer",
    "test engineer",
    "software tester",
    "automation engineer",
    "SDET",
    "quality engineer",

    // 🔹 Product & Design (YOU WERE MISSING THESE)
    "product manager",
    "technical product manager",
    "product owner",
    "product designer",
    "UX designer",
    "UI designer",
    "UX UI designer",
    "interaction designer",

    // 🔹 Architecture & Leadership
    "software architect",
    "solutions architect",
    "technical lead",
    "engineering manager",

    // 🔹 Entry-Level & Internships
    "software engineer intern",
    "developer intern",
    "tech intern",
    "engineering intern",
    "product intern",
    "design intern",
    "data intern",
    "summer intern",

    // 🔹 Generic Startup Titles
    "tech lead",
    "technical specialist",
    "technical consultant",
    "IT engineer",
    "IT developer"
];

const SKILL_KEYWORDS = [

    // 🔹 Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#",
    "Go", "Rust", "Kotlin", "Swift", "Dart", "PHP", "Ruby", "Scala",

    // 🔹 Frontend
    "React", "Angular", "Vue", "Next.js", "Nuxt", "Redux",
    "HTML", "CSS", "Sass", "Tailwind", "Bootstrap", "Webpack", "Vite",

    // 🔹 Backend
    "Node.js", "Express", "NestJS", "Spring", "Spring Boot",
    "Django", "Flask", "FastAPI", "ASP.NET", "Laravel", "Ruby on Rails",

    // 🔹 Mobile
    "Android", "iOS", "React Native", "Flutter", "Xamarin",

    // 🔹 Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "DynamoDB", "Cassandra", "SQLite", "Elasticsearch",

    // 🔹 Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
    "Ansible", "Jenkins", "GitHub Actions", "CI/CD",
    "CloudFormation", "Helm",

    // 🔹 Architecture
    "Microservices", "REST", "GraphQL", "gRPC", "Event-driven",
    "Kafka", "RabbitMQ", "System Design",

    // 🔹 Data & AI
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
    "Spark", "Hadoop", "Airflow", "Databricks", "MLflow",

    // 🔹 Security
    "OAuth", "JWT", "Encryption", "Penetration Testing",
    "OWASP", "IAM", "Network Security",

    // 🔹 Testing
    "Selenium", "Cypress", "Playwright", "JUnit", "Mocha",
    "Jest", "TestNG", "Appium",

    // 🔹 Product / Design
    "Figma", "Sketch", "Adobe XD", "User Research",
    "Wireframing", "Prototyping", "Design Systems",
    "Usability Testing",

    // 🔹 Version Control & Tools
    "Git", "SVN", "JIRA", "Confluence", "Agile", "Scrum", "Kanban"
];



const RESULTS_PER_PAGE = 3;
const MAX_PAGES = 10; // Increase for more jobs

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

// 🔗 Fetch Adzuna job page — extract real apply URL + full description
async function getJobPageDetails(redirectUrl) {
    try {
        const res = await axios.get(redirectUrl, { timeout: 15000 });
        const $ = cheerio.load(res.data);

        // Extract apply URL
        const rawLink =
            $('a[data-qa="apply-button"]').attr("href") ||
            $('a.apply-button').attr("href") ||
            $('a:contains("Apply")').attr("href");

        const applyUrl = !rawLink
            ? redirectUrl
            : rawLink.startsWith("http")
                ? rawLink
                : new URL(rawLink, redirectUrl).href;

        // Extract full description — try known Adzuna selectors in order
        const descSelectors = [
            '[data-qa="job-description"]',
            '.adp-body',
            '[itemprop="description"]',
            'section.job__description',
            '.job__description',
            'div.description',
        ];
        let fullDescription = null;
        for (const sel of descSelectors) {
            const el = $(sel);
            if (el.length) {
                fullDescription = el.text().trim().replace(/[ \t]+/g, ' ') || null;
                if (fullDescription) break;
            }
        }

        return { applyUrl, fullDescription };

    } catch (err) {
        console.error("Failed to fetch job page:", redirectUrl);
        return { applyUrl: redirectUrl, fullDescription: null };
    }
}

// ⏳ Delay helper (avoid rate limits)
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Runs the Adzuna scraper.
 * @param {string|null} cursorDate - ISO date string. Stop fetching if job.created <= cursor.
 * @returns {Promise<{ filePath: string, count: number, newCursor: string|null }>}
 */
async function run(cursorDate) {
    const allJobs = [];
    let maxDate = null;

    // ⏰ Hard 7-day age cutoff — skip jobs older than this
    const MAX_AGE_DAYS = 7;
    const cutoffTime = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    // Normalize cursor (incremental check on top of age filter)
    const cursorTime = cursorDate ? new Date(cursorDate).getTime() : 0;
    console.log(`🚀 Starting Adzuna Scraper. Cursor: ${cursorDate || "NONE (Full Sync)"}`);
    console.log(`📅 Age cutoff: only jobs newer than ${new Date(cutoffTime).toISOString().slice(0, 10)}`);

    for (const term of SEARCH_TERMS) {
        console.log(`\n🔎 Searching for: ${term}`);
        let termStopped = false;

        for (let page = 1; page <= MAX_PAGES; page++) {
            if (termStopped) break;

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
                    const jobDate = new Date(job.created).getTime();

                    // 🚫 7-day hard cutoff — Adzuna sorts newest-first,
                    //    so any older job means all remaining pages also fail → stop term
                    if (jobDate < cutoffTime) {
                        console.log(`🛑 Job too old (${job.created}). Stopping term "${term}".`);
                        termStopped = true;
                        break;
                    }

                    // 🔄 Incremental cursor — skip already-synced jobs
                    if (cursorTime > 0 && jobDate <= cursorTime) {
                        console.log(`� Already synced (${job.created}). Stopping term "${term}".`);
                        termStopped = true;
                        break;
                    }

                    // Track max date for next cursor
                    if (!maxDate || jobDate > new Date(maxDate).getTime()) {
                        maxDate = job.created;
                    }

                    console.log("➡️ Processing:", job.title);

                    const { applyUrl, fullDescription } = await getJobPageDetails(job.redirect_url);
                    const description = fullDescription || job.description || "";

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
                // Continue to next term/page? yes
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


    const filePath = path.resolve(__dirname, "adzuna_jobs_v1.json");
    await fs.writeJson(filePath, uniqueJobs, { spaces: 2 });

    console.log(`\n✅ Saved ${uniqueJobs.length} jobs to ${filePath}`);

    return {
        filePath,
        count: uniqueJobs.length,
        newCursor: maxDate
    };
}

module.exports = { run };
