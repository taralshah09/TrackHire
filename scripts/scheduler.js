const dotenv = require("dotenv");
const path = require("path");
const dbSync = require("./utils/db_sync_state");

// Load env
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Import Pipelines
const adzunaScraper = require("./adzuna/v1/adzuna_scrapper_v1");
const adzunaLoader = require("./adzuna/v1/adzuna_load_to_db");
const skillhubScraper = require("./skillcareerhub/skillcareerhub_scrapper_v0");
const skillhubLoader = require("./skillcareerhub/skillcareerhub_load_to_db");

async function runAdzunaPipeline(fullSync = false) {
    const pipelineName = "adzuna_v1";
    console.log(`\n🚀 Starting Pipeline: ${pipelineName} [FullSync=${fullSync}]`);

    let syncId;
    try {
        syncId = await dbSync.startSync(pipelineName);

        // 1. Get Cursor
        let cursor = null;
        if (!fullSync) {
            cursor = await dbSync.getLastCursor(pipelineName);
            console.log(`Last cursor: ${cursor}`);
        }

        // 2. Scrape
        console.log("Step 1: Scraping...");
        const scrapeStats = await adzunaScraper.run(cursor);
        console.log(`Scraped ${scrapeStats.count} jobs. File: ${scrapeStats.filePath}`);

        if (scrapeStats.count === 0) {
            console.log("No new jobs found. Skipping load.");
            await dbSync.completeSync(syncId, 0, 0, cursor); // Keep old cursor
            return;
        }

        // 3. Load
        console.log("Step 2: Loading to DB...");
        const loadStats = await adzunaLoader.run(scrapeStats.filePath);

        // 4. Update Sync State
        const finalCursor = scrapeStats.newCursor || cursor;
        await dbSync.completeSync(syncId, scrapeStats.count, loadStats.inserted, finalCursor);
        console.log(`Pipeline ${pipelineName} completed successfully.`);

    } catch (err) {
        console.error(`Pipeline ${pipelineName} failed:`, err);
        if (syncId) await dbSync.failSync(syncId, err.message);
    }
}

/**
 * Executes the SkillCareerHub pipeline
 */
async function runSkillhubPipeline() {
    const pipelineName = "skillcareerhub_v0";
    console.log(`\n🚀 Starting Pipeline: ${pipelineName}`);

    let syncId;
    try {
        syncId = await dbSync.startSync(pipelineName);

        // 1. Scrape (Always full fetch for now as it's small)
        console.log("Step 1: Scraping...");
        const scrapeStats = await skillhubScraper.run();

        // 2. Load
        console.log("Step 2: Loading to DB...");
        const loadStats = await skillhubLoader.run(scrapeStats.filePath);

        // 3. Update Sync State (No cursor needed for full sync pipeline)
        await dbSync.completeSync(syncId, scrapeStats.count, loadStats.inserted, null);
        console.log(`Pipeline ${pipelineName} completed successfully.`);

    } catch (err) {
        console.error(`Pipeline ${pipelineName} failed:`, err);
        if (syncId) await dbSync.failSync(syncId, err.message);
    }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);

    console.log("===========================================");
    console.log("  Job Pipeline Runner");
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log(`  Arguments : ${args.length ? args.join(", ") : "(none — running all pipelines)"}`);
    console.log("===========================================\n");

    const runAdzuna = args.includes("--run-adzuna");
    const runSkillhub = args.includes("--run-skillhub");
    const runAll = !runAdzuna && !runSkillhub;

    let exitCode = 0;

    try {
        if (runAll || runAdzuna) {
            console.log("▶ Running Adzuna pipeline...");
            await runAdzunaPipeline(false);
            console.log("✅ Adzuna pipeline complete.\n");
        }

        if (runAll || runSkillhub) {
            console.log("▶ Running SkillCareerHub pipeline...");
            await runSkillhubPipeline();
            console.log("✅ SkillCareerHub pipeline complete.\n");
        }

        console.log("===========================================");
        console.log("  All selected pipelines finished successfully.");
        console.log("===========================================");
    } catch (err) {
        console.error("❌ Unexpected top-level error:", err);
        exitCode = 1;
    } finally {
        console.log("\nClosing database connections...");
        await dbSync.pool.end();
        console.log("Database pool closed. Exiting.");
        process.exit(exitCode);
    }
}

main();
