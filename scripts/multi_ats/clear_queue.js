// scripts/multi_ats/clear_queue.js
const { queue } = require("./multi_ats_queue")

async function clear() {
    try {
        // `obliterate` removes every job type and all associated Redis keys.
        // `force: true` skips the safety‑check that refuses to delete when active jobs exist.
        await queue.obliterate({ force: true });
        console.log("🗑️  Queue cleared successfully.");
        await queue.disconnect(); // clean shutdown of the Redis connection
    } catch (err) {
        console.error("❌  Failed to clear queue:", err);
        process.exit(1);
    }
}

clear();
