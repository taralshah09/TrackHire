const { Queue } = require("bullmq");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { REDIS_CONFIG } = require("./multi_ats_queue");

const SKILL_QUEUE_NAME = "job-skill-extraction";

const skillQueue = new Queue(SKILL_QUEUE_NAME, {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 200,
    },
});

async function enqueueSkillExtraction(jobId) {
    await skillQueue.add("extract-skills", { jobId });
}

module.exports = { skillQueue, enqueueSkillExtraction, SKILL_QUEUE_NAME };
