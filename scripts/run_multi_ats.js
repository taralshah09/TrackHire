/**
 * One-off runner for the Multi-ATS pipeline.
 * Invokes the same logic as scheduler.js → runMultiAtsPipeline()
 * without the IST time-window check.
 *
 * Usage: node scripts/run_multi_ats.js
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const dbSync = require("./utils/db_sync_state");
const multiAtsScraper = require("./multi_ats/multi_ats_scrapper");
const multiAtsLoader = require("./multi_ats/multi_ats_load_to_db");

async function main() {
    const pipelineName = "multi_ats_v1";
    console.log(`\n🚀 ${pipelineName} (direct run)`);

    let syncId;
    try {
        syncId = await dbSync.startSync(pipelineName);

        const scrapeStats = await multiAtsScraper.run();

        if (scrapeStats.count > 0) {
            if (scrapeStats.filePath) {
                const loadStats = await multiAtsLoader.run(scrapeStats.filePath);
                await dbSync.completeSync(syncId, scrapeStats.count, loadStats.inserted, null);
            } else {
                console.log(`📬 ${scrapeStats.count} jobs enqueued — start the worker to write descriptions to DB`);
                await dbSync.completeSync(syncId, scrapeStats.count, 0, null);
            }
        } else {
            await dbSync.completeSync(syncId, 0, 0, null);
        }
    } catch (err) {
        console.error(`❌ Pipeline failed:`, err.message);
        if (syncId) await dbSync.failSync(syncId, err.message);
        process.exitCode = 1;
    } finally {
        await dbSync.pool.end();
    }
}

main();
