/**
 * Listens for PostgreSQL NOTIFY events fired by Spring Boot when a user
 * updates their preferences, then enqueues a relevance rebuild into BullMQ.
 *
 * Run as a long-lived process alongside the workers:
 *   node scripts/preference_change_listener.js
 */

const { Client } = require("pg");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const { enqueueUserRelevanceRebuild, userRebuildQueue } = require("./multi_ats/user_rebuild_queue");

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${DB_SCHEMA}`,
};

const CHANNEL = "user_relevance_rebuild";
let isShuttingDown = false;

async function startListener() {
    if (isShuttingDown) return;

    const client = new Client(DB_CONFIG);

    client.on("error", (err) => {
        console.error(`⚠️  PG listener error: ${err.message} — reconnecting in 5s`);
        client.end().catch(() => {});
        if (!isShuttingDown) setTimeout(startListener, 5000);
    });

    try {
        await client.connect();
        await client.query(`LISTEN ${CHANNEL}`);
        console.log(`👂 Listening on PG channel "${CHANNEL}"`);

        client.on("notification", async (msg) => {
            try {
                const { userId } = JSON.parse(msg.payload);
                console.log(`🔄 Preference change detected — queuing rebuild for user ${userId}`);
                await enqueueUserRelevanceRebuild(userId);
            } catch (err) {
                console.error(`❌ Failed to handle notification: ${err.message}`, msg.payload);
            }
        });

        client.on("end", () => {
            if (!isShuttingDown) {
                console.warn("PG listener connection ended — reconnecting in 5s");
                setTimeout(startListener, 5000);
            }
        });
    } catch (err) {
        console.error(`❌ Failed to connect PG listener: ${err.message} — retrying in 5s`);
        if (!isShuttingDown) setTimeout(startListener, 5000);
    }
}

async function shutdown() {
    isShuttingDown = true;
    console.log("Shutting down preference change listener...");
    await userRebuildQueue.close();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startListener();
console.log("🚀 Preference change listener started");
