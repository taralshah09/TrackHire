/**
 * One-shot loader — loads existing JSON files into DB without scraping.
 * Usage: node load_now.js
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const adzunaLoader = require("./adzuna/v1/adzuna_load_to_db");
const skillhubLoader = require("./skillcareerhub/skillcareerhub_load_to_db");

async function main() {
    console.log("📦 Loading Adzuna jobs...");
    const adzunaFile = path.resolve(__dirname, "adzuna_jobs_v1.json");
    const a = await adzunaLoader.run(adzunaFile);
    console.log(`✅ Adzuna done — inserted: ${a.inserted}, updated: ${a.updated}, failed: ${a.failed}`);

    console.log("\n📦 Loading SkillCareerHub jobs...");
    const skillhubFile = path.resolve(__dirname, "skillcareerhub/skillcareerhub_jobs.json");
    const s = await skillhubLoader.run(skillhubFile);
    console.log(`✅ SkillCareerHub done — inserted: ${s.inserted}, updated: ${s.updated || 0}, failed: ${s.failed || 0}`);
}

main().catch(err => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
