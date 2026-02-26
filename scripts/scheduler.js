const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const dbSync = require("./utils/db_sync_state");

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Pipelines
const adzunaScraper = require("./adzuna/v1/adzuna_scrapper_v1");
const adzunaLoader = require("./adzuna/v1/adzuna_load_to_db");
const skillhubScraper = require("./skillcareerhub/skillcareerhub_scrapper_v0");
const skillhubLoader = require("./skillcareerhub/skillcareerhub_load_to_db");
const emailPipeline = require("./email/email_pipeline");

// Config
const RENDER_HEALTH_URL =
    process.env.RENDER_HEALTH_URL ||
    "https://trackhire-singapore.onrender.com/api/public/health";

// ─── Time Helper (UTC → IST) ──────────────────────────────────────────────

function getISTTime() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

// ─── Render Ping ──────────────────────────────────────────────────────────

async function pingRenderServer() {
    console.log("\n🔔 Pinging Render server...");

    try {
        const res = await axios.get(RENDER_HEALTH_URL, { timeout: 15000 });
        console.log(`  Render server pinged ✅ (${res.status})`);
    } catch (err) {
        console.error(`  Render ping failed ❌: ${err.message}`);
    }
}

// ─── Pipelines ────────────────────────────────────────────────────────────

async function runAdzunaPipeline() {
    const pipelineName = "adzuna_v1";
    console.log(`\n🚀 ${pipelineName}`);

    let syncId;

    try {
        syncId = await dbSync.startSync(pipelineName);
        const cursor = await dbSync.getLastCursor(pipelineName);

        const scrapeStats = await adzunaScraper.run(cursor);

        if (scrapeStats.count > 0) {
            const loadStats = await adzunaLoader.run(scrapeStats.filePath);

            await dbSync.completeSync(
                syncId,
                scrapeStats.count,
                loadStats.inserted,
                scrapeStats.newCursor || cursor
            );
        } else {
            await dbSync.completeSync(syncId, 0, 0, cursor);
        }
    } catch (err) {
        if (syncId) await dbSync.failSync(syncId, err.message);
    }
}

async function runSkillhubPipeline() {
    const pipelineName = "skillcareerhub_v0";
    console.log(`\n🚀 ${pipelineName}`);

    let syncId;

    try {
        syncId = await dbSync.startSync(pipelineName);

        const scrapeStats = await skillhubScraper.run();
        const loadStats = await skillhubLoader.run(scrapeStats.filePath);

        await dbSync.completeSync(
            syncId,
            scrapeStats.count,
            loadStats.inserted,
            null
        );
    } catch (err) {
        if (syncId) await dbSync.failSync(syncId, err.message);
    }
}

async function runEmails() {
    console.log("\n📧 Email Pipeline");

    try {
        const stats = await emailPipeline.run();
        console.log(`Emails sent: ${stats.sent}`);
    } catch (err) {
        console.error("Email pipeline failed ❌", err.message);
    }
}

// ─── Scheduler Logic ──────────────────────────────────────────────────────

async function runScheduler() {
    console.log("\n==============================================");

    const istNow = getISTTime();
    const hour = istNow.getUTCHours();
    const minute = istNow.getUTCMinutes();

    console.log(`Current IST time: ${hour}:${String(minute).padStart(2, '0')} (${istNow.toISOString()})`);

    // Always ping Render
    await pingRenderServer();

    // 🔹 03:30 IST → Job pipelines
    if (hour === 3 && minute < 10) {
        console.log("⏰ Running scraping pipelines (03:30 IST window)");

        await runAdzunaPipeline();
        await runSkillhubPipeline();
    }

    // 🔹 19:10 IST (7:10 PM) → Email Pipeline
    if (hour === 19 && minute >= 20 && minute < 30) {
        console.log("⏰ Running email pipeline (19:20 IST window)");

        await runEmails();
    }

    console.log("==============================================\n");
}

// ─── Entry ────────────────────────────────────────────────────────────────

(async () => {
    console.log("🟢 TrackHire Scheduler started");

    try {
        await runScheduler();
    } catch (err) {
        console.error("Scheduler failure ❌", err);
    } finally {
        try {
            await dbSync.pool.end();
        } catch (_) { }
    }
})();