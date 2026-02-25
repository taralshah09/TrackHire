/**
 * test_redesign.js — Verification script for email pipeline redesign
 * 
 * Tests:
 * 1. findJobsForUser tiered response
 * 2. diversity constraint (max 2 per company)
 * 3. email template generation
 */

const { findJobsForUser } = require("./job_matcher");
const { buildDigest } = require("./email_template");
const fs = require("fs");
const path = require("path");

async function test() {
    console.log("🚀 Testing Email Pipeline Redesign...\n");

    // Generic test user data
    const userId = 1; // Assuming user 1 exists or query works without throwing
    const jobTitles = ["Software Engineer", "Intern", "Backend"];
    const skills = ["Node.js", "Java", "Python"];
    const roleTypes = ["Intern", "Junior"];

    try {
        console.log("📌 Testing job matching logic...");
        const result = await findJobsForUser(userId, jobTitles, skills, roleTypes, 10);

        console.log("✅ findJobsForUser returned:");
        console.log(`   Top Picks  : ${result.topPicks.length}`);
        console.log(`   Recommended: ${result.recommended.length}`);

        // Check diversity
        const companyCounts = {};
        [...result.topPicks, ...result.recommended].forEach(j => {
            companyCounts[j.company] = (companyCounts[j.company] || 0) + 1;
        });

        const diversityBroken = Object.values(companyCounts).some(count => count > 2);
        if (diversityBroken) {
            console.error("❌ Diversity check FAILED: More than 2 jobs from a single company.");
            console.error(companyCounts);
        } else {
            console.log("✅ Diversity check PASSED: Max 2 jobs per company.");
        }

        // Print some scores
        console.log("\n📊 Sample Scores:");
        result.topPicks.slice(0, 3).forEach(j => {
            console.log(`   [${j.total_score} pts] ${j.title} @ ${j.company}`);
        });

        // Test Template Generation
        console.log("\n📌 Testing email template generation...");
        const user = { username: "Taral", email: "test@example.com", interests: jobTitles };
        const html = buildDigest(user, result);

        const outputPath = path.join(__dirname, "test_email.html");
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Test email generated at: ${outputPath}`);

    } catch (err) {
        console.error("❌ Test FAILED:", err);
    }
}

test();
