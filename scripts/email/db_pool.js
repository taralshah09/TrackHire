const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

// email/ is inside scripts/, so ../.env points to scripts/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 10,                    // keep connections low — email pipeline is I/O-bound, not CPU-bound
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", (client) => {
    client.query(`SET search_path TO ${DB_SCHEMA}, public`);
});

pool.on("error", (err) => {
    console.error("Unexpected DB pool error:", err.message);
});

module.exports = pool;
