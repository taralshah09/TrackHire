const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const WORKER_URL = process.env.WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

/**
 * Sends a single email via the Cloudflare Worker gateway.
 *
 * @param {string} to      Recipient email address
 * @param {string} subject Email subject line
 * @param {string} html    HTML email body
 */
async function sendEmail(to, subject, html) {
    if (!WORKER_URL || !WORKER_SECRET) {
        console.warn("⚠️ WORKER_URL or WORKER_SECRET not set. Falling back to console log.");
        console.log(`Email to ${to}: ${subject}`);
        return;
    }

    try {
        const res = await axios.post(WORKER_URL, {
            to,
            subject,
            html
        }, {
            headers: {
                "x-api-key": WORKER_SECRET,
                "Content-Type": "application/json"
            }
        });

        if (res.status !== 200) {
            throw new Error(`Gateway returned ${res.status}: ${JSON.stringify(res.data)}`);
        }
    } catch (err) {
        console.error(`❌ Gateway send failed for ${to}:`, err.message);
        throw err;
    }
}

/**
 * Sends a batch of emails via the Cloudflare Worker gateway.
 * Max 100 emails per batch.
 *
 * @param {Array} emails Array of {to, subject, html} objects
 */
async function sendBatch(emails) {
    if (!WORKER_URL || !WORKER_SECRET) {
        console.warn("⚠️ WORKER_URL or WORKER_SECRET not set. Cannot send batch.");
        return;
    }

    if (emails.length === 0) return;

    try {
        const res = await axios.post(`${WORKER_URL}/batch`, {
            emails
        }, {
            headers: {
                "x-api-key": WORKER_SECRET,
                "Content-Type": "application/json"
            }
        });

        if (res.status !== 200) {
            throw new Error(`Gateway batch returned ${res.status}: ${JSON.stringify(res.data)}`);
        }

        return res.data;
    } catch (err) {
        if (err.response && err.response.data) {
            console.error(`❌ Gateway batch send failed:`, JSON.stringify(err.response.data));
        } else {
            console.error(`❌ Gateway batch send failed:`, err.message);
        }
        throw err;
    }
}

module.exports = { sendEmail, sendBatch };
