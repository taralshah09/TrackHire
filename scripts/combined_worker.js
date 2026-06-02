/**
 * combined_worker.js
 *
 * Single entry point for the Railway worker service.
 * Spawns all BullMQ workers + the PG preference listener as isolated
 * child processes and auto-restarts any that crash.
 *
 * Railway start command: node combined_worker.js
 */

const { spawn } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const WORKERS = [
    { name: "description-worker",  file: "multi_ats/multi_ats_worker.js" },
    { name: "skill-worker",        file: "multi_ats/skill_extraction_worker.js" },
    { name: "relevance-worker",    file: "multi_ats/job_relevance_worker.js" },
    { name: "rebuild-worker",      file: "multi_ats/user_rebuild_worker.js" },
    { name: "pref-listener",       file: "preference_change_listener.js" },
];

const RESTART_DELAY_MS = 5000;

function launch(worker) {
    const proc = spawn("node", [path.resolve(__dirname, worker.file)], {
        stdio: "inherit",
        env: process.env,
    });

    console.log(`▶  [${worker.name}] started (pid ${proc.pid})`);

    proc.on("exit", (code, signal) => {
        if (signal === "SIGTERM" || signal === "SIGINT") return; // intentional shutdown
        console.warn(
            `⚠️  [${worker.name}] exited (code=${code ?? "?"}, signal=${signal ?? "?"}) — restarting in ${RESTART_DELAY_MS / 1000}s`
        );
        setTimeout(() => launch(worker), RESTART_DELAY_MS);
    });

    return proc;
}

const processes = WORKERS.map(launch);

function shutdown() {
    console.log("\n🛑  Shutting down all workers...");
    processes.forEach((proc) => {
        if (proc && !proc.killed) proc.kill("SIGTERM");
    });
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`🚀  Combined worker running — managing ${WORKERS.length} processes`);
