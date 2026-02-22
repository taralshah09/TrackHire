/**
 * Builds a beautiful HTML digest email showing matched job listings.
 *
 * @param {object} user         User object with `username` and `email`
 * @param {Array}  jobs         Array of matched job objects
 * @param {string} unsubUrl     URL for unsubscribe (optional)
 * @returns {string}            HTML string ready to send
 */
function buildDigest(user, jobs, unsubUrl = "#") {
    const name = user.username || "there";
    const jobCount = jobs.length;

    const jobCards = jobs.map((job) => {
        const postedDate = job.posted_at
            ? new Date(job.posted_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
            : "Recently posted";

        const location = job.location || "Location not specified";
        const company = job.company || "Company not specified";

        return `
        <tr>
          <td style="padding:0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <!-- Job title -->
                  <p style="margin:0 0 4px 0;font-size:17px;font-weight:700;color:#111827;
                             font-family:'Segoe UI',Arial,sans-serif;">
                    ${escHtml(job.title)}
                  </p>
                  <!-- Company & location -->
                  <p style="margin:0 0 12px 0;font-size:14px;color:#6b7280;
                             font-family:'Segoe UI',Arial,sans-serif;">
                    ${escHtml(company)} &nbsp;·&nbsp; ${escHtml(location)}
                  </p>
                  <!-- Posted date pill -->
                  <p style="margin:0 0 16px 0;">
                    <span style="display:inline-block;background:#f3f4f6;color:#374151;
                                 font-size:12px;padding:3px 10px;border-radius:999px;
                                 font-family:'Segoe UI',Arial,sans-serif;">
                      📅 ${postedDate}
                    </span>
                  </p>
                  <!-- CTA -->
                  <a href="${escHtml(job.apply_url)}"
                     target="_blank"
                     style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                            color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;
                            padding:10px 22px;border-radius:8px;
                            font-family:'Segoe UI',Arial,sans-serif;">
                    Apply Now →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Job Matches – TrackHire</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
                        border-radius:16px 16px 0 0;padding:36px 40px 28px;">
              <p style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                🎯 TrackHire
              </p>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">
                Your personalised job digest
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px 20px;">
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;">
                Hey ${escHtml(name)} 👋
              </p>
              <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.6;">
                We found <strong>${jobCount} new job${jobCount !== 1 ? "s" : ""}</strong> matching 
                your preferences in the last 7 days that you haven't applied to yet. 
                Don't let them slip by!
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;">
            </td>
          </tr>

          <!-- Job cards -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${jobCards}
              </table>
            </td>
          </tr>

          <!-- CTA footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px 40px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:#6b7280;text-align:center;">
                Browse all available jobs on TrackHire
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.APP_URL || "https://trackhire.com"}/jobs"
                       target="_blank"
                       style="display:inline-block;background:#111827;color:#ffffff;
                              text-decoration:none;font-size:14px;font-weight:600;
                              padding:12px 32px;border-radius:8px;">
                      View All Jobs
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer / unsubscribe -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                You're receiving this because you set up job preferences on TrackHire.<br>
                <a href="${escHtml(unsubUrl)}" style="color:#6366f1;text-decoration:none;">
                  Unsubscribe / manage preferences
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/** Escape HTML special characters to prevent XSS in email content. */
function escHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

module.exports = { buildDigest };
