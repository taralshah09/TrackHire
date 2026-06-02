const { Queue } = require("bullmq");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");

const RELEVANCE_QUEUE_NAME = "job-relevance-generation";

const relevanceQueue = new Queue(RELEVANCE_QUEUE_NAME, {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 500,
        removeOnFail: 200,
    },
});

async function enqueueRelevanceGeneration(jobId) {
    await relevanceQueue.add("generate-relevance", { jobId });
}

module.exports = { relevanceQueue, enqueueRelevanceGeneration, RELEVANCE_QUEUE_NAME };
