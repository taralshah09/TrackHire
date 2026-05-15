const { Queue } = require("bullmq");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const REDIS_URL = process.env.REDIS_URL;

const REDIS_CONFIG = REDIS_URL ? REDIS_URL : {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // Enable TLS for cloud providers like Upstash (uses rediss://)
    tls: (process.env.REDIS_HOST && !process.env.REDIS_HOST.includes("127.0.0.1")) ? {} : undefined,
    maxRetriesPerRequest: null // Required by BullMQ
};

const QUEUE_NAME = "description-scraper";

const queue = new Queue(QUEUE_NAME, {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 500,
    },
});

async function enqueueJob(jobData) {
    console.log(`➕ Enqueuing job: ${jobData.title} @ ${jobData.company}`);
    await queue.add("scrape-description", jobData);
}

module.exports = { queue, enqueueJob, QUEUE_NAME, REDIS_CONFIG };
