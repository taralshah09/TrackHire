const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");

// 🔐 Add your credentials
const APP_ID = "b401efea";
const APP_KEY = "65ce630fab025f6d5e6fbd310680da3a";

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search";

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
const MAX_PAGES = 50; // Increase for more jobs

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

    await fs.writeJson("adzuna_jobs_v1.json", uniqueJobs, { spaces: 2 });

    console.log(`\n✅ Saved ${uniqueJobs.length} jobs to adzuna_jobs.json`);
}

fetchJobs();
