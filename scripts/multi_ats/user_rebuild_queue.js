const { Queue } = require("bullmq");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");

const USER_REBUILD_QUEUE_NAME = "user-relevance-rebuild";

const userRebuildQueue = new Queue(USER_REBUILD_QUEUE_NAME, {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 200,
        removeOnFail: 100,
        // Deduplicate rapid preference changes — only keep the latest rebuild per user
        jobId: undefined, // set per-call using userId as jobId
    },
});

async function enqueueUserRelevanceRebuild(userId) {
    // Using userId as jobId deduplicates: if user saves preferences twice quickly,
    // only one rebuild runs (the queue replaces the pending job).
    await userRebuildQueue.add(
        "rebuild-relevance",
        { userId },
        { jobId: `user-rebuild-${userId}` }
    );
}

module.exports = { userRebuildQueue, enqueueUserRelevanceRebuild, USER_REBUILD_QUEUE_NAME };
