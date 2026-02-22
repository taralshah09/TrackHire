const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // Force IPv4 DNS resolution globally

// utils/ is inside scripts/, so ../.env points to scripts/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 5,
    idleTimeoutMillis: 10000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", (client) => {
    client.query(`SET search_path TO ${DB_SCHEMA}`);
});

const TABLE_NAME = "job_sync_history";

/**
 * Initializes a new sync run entry
 * @param {string} pipelineName 
 * @returns {Promise<number>} ID of the sync run
 */

async function startSync(pipelineName) {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `INSERT INTO ${TABLE_NAME} (pipeline_name, start_time, status) 
             VALUES ($1, CURRENT_TIMESTAMP, 'RUNNING') RETURNING id`,
            [pipelineName]
        );
        return res.rows[0].id;
    } catch (err) {
        console.error(`Error starting sync for ${pipelineName}:`, err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Updates the sync run with success status and stats
 * @param {number} id 
 * @param {number} processed count
 * @param {number} inserted count
 * @param {string} cursor new cursor value (e.g. max posted_at)
 */
async function completeSync(id, processed, inserted, cursor) {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE ${TABLE_NAME} 
             SET end_time = CURRENT_TIMESTAMP, 
                 status = 'SUCCESS', 
                 jobs_processed = $1, 
                 jobs_inserted = $2, 
                 cursor_value = $3 
             WHERE id = $4`,
            [processed, inserted, cursor, id]
        );
    } catch (err) {
        console.error(`Error completing sync ID ${id}:`, err);
    } finally {
        client.release();
    }
}

/**
 * Updates the sync run with failure status
 * @param {number} id 
 * @param {string} errorMessage 
 */
async function failSync(id, errorMessage) {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE ${TABLE_NAME} 
             SET end_time = CURRENT_TIMESTAMP, 
                 status = 'FAILED', 
                 error_message = $1 
             WHERE id = $2`,
            [errorMessage, id]
        );
    } catch (err) {
        console.error(`Error failing sync ID ${id}:`, err);
    } finally {
        client.release();
    }
}

/**
 * Gets the last successful cursor for a pipeline
 * @param {string} pipelineName 
 * @returns {Promise<string|null>} 
 */
async function getLastCursor(pipelineName) {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT cursor_value FROM ${TABLE_NAME} 
             WHERE pipeline_name = $1 AND status = 'SUCCESS' 
             ORDER BY start_time DESC LIMIT 1`,
            [pipelineName]
        );
        return res.rows[0]?.cursor_value || null;
    } catch (err) {
        console.error(`Error getting cursor for ${pipelineName}:`, err);
        return null;
    } finally {
        client.release();
    }
}

module.exports = {
    startSync,
    completeSync,
    failSync,
    getLastCursor,
    pool // Export pool to close it if needed, though usually kept alive for scheduler
};
