const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// email_sender.js
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // ← Must be before nodemailer import

const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // family: 4 ← remove this, it's not reliably supported
});

/**
 * Sends a single email.
 * Retries once on transient connection failures.
 *
 * @param {string} to      Recipient email address
 * @param {string} subject Email subject line
 * @param {string} html    HTML email body
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || "TrackHire <noreply@trackhire.com>",
        to,
        subject,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        // Retry once on transient SMTP errors (e.g. ECONNRESET, ETIMEDOUT, ENETUNREACH)
        const transient = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENETUNREACH"];
        if (transient.some((code) => err.code === code || err.message.includes(code))) {
            console.warn(`  ⚠️  Transient SMTP error for ${to}, retrying once…`);
            await new Promise((r) => setTimeout(r, 2000));
            await transporter.sendMail(mailOptions);
        } else {
            throw err; // re-throw permanent errors (bad address, auth fail, etc.)
        }
    }
}

/**
 * Verifies SMTP connectivity. Call this at startup to catch misconfig early.
 */
async function verifyConnection() {
    await transporter.verify();
    console.log("✅ SMTP connection verified.");
}

module.exports = { sendEmail, verifyConnection };
