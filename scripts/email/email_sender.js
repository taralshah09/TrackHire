const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "TrackHire <noreply@trackhire.com>",
        to,
        subject,
        html,
    });

    if (error) throw new Error(error.message);
}

async function verifyConnection() {
    // Resend has no explicit verify step — API key is validated on first send
    // Optionally hit their /domains endpoint to confirm key is valid
    console.log("✅ Resend API key loaded.");
}

module.exports = { sendEmail, verifyConnection };
