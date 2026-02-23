/**
 * Builds a branded HTML digest email showing matched job listings.
 * Follows TrackHire Brand Guidelines — dark theme, orange accent, branded typography.
 *
 * @param {object} user         User object with `username` and `email`
 * @param {Array}  jobs         Array of matched job objects
 * @param {string} unsubUrl     URL for unsubscribe (optional)
 * @returns {string}            HTML string ready to send
 */
function buildDigest(user, jobs, unsubUrl = "#") {
  const name = user.username || "there";
  const jobCount = jobs.length;

  // ── Determine greeting based on UTC time ──
  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const jobCards = jobs
    .map((job) => {
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
                   style="background:#181818;border:1px solid #2e2e2e;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <!-- Job title -->
                  <p style="margin:0 0 4px 0;font-size:17px;font-weight:700;color:#ffffff;
                             font-family:'Syne','Segoe UI',Arial,sans-serif;letter-spacing:-0.01em;">
                    ${escHtml(job.title)}
                  </p>
                  <!-- Company & location -->
                  <p style="margin:0 0 14px 0;font-size:14px;color:rgba(255,255,255,0.65);
                             font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
                    ${escHtml(company)} &nbsp;&middot;&nbsp; ${escHtml(location)}
                  </p>
                  <!-- Posted date pill -->
                  <p style="margin:0 0 18px 0;">
                    <span style="display:inline-block;background:rgba(249,115,22,0.10);color:#f97316;
                                 font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;
                                 border:1px solid rgba(249,115,22,0.22);letter-spacing:0.06em;
                                 font-family:'Syne','Segoe UI',Arial,sans-serif;text-transform:uppercase;">
                      ${postedDate}
                    </span>
                  </p>
                  <!-- CTA -->
                  <a href="${escHtml(job.apply_url)}"
                     target="_blank"
                     style="display:inline-block;background:#f97316;
                            color:#000000;text-decoration:none;font-size:13px;font-weight:700;
                            padding:10px 24px;border-radius:8px;letter-spacing:0;
                            font-family:'Syne','Segoe UI',Arial,sans-serif;">
                    Apply Now &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Job Matches — TrackHire</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans','Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080808;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#101010;border:1px solid #2e2e2e;border-bottom:none;
                        border-radius:16px 16px 0 0;padding:36px 40px 28px;">
              <!-- Logo -->
              <p style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;
                         font-family:'Syne','Segoe UI',Arial,sans-serif;">
                Track<span style="color:#f97316;">H</span>ire
              </p>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);
                         font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
                Your personalised job digest
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="background:#101010;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;
                        padding:28px 40px 20px;">
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;
                         font-family:'Syne','Segoe UI',Arial,sans-serif;">
                ${escHtml(greeting)}, ${escHtml(name)}
              </p>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;
                         font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
                We found <strong style="color:#ffffff;font-weight:500;">${jobCount} new job${jobCount !== 1 ? "s" : ""}</strong> matching
                your preferences — roles you haven't applied to yet.
                Apply first, every time.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#101010;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #2e2e2e;margin:0;">
            </td>
          </tr>

          <!-- Job cards section -->
          <tr>
            <td style="background:#080808;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:24px 40px;">
              <!-- Section label -->
              <p style="margin:0 0 16px 0;font-size:10px;font-weight:700;color:rgba(255,255,255,0.40);
                         letter-spacing:0.12em;text-transform:uppercase;
                         font-family:'Syne','Segoe UI',Arial,sans-serif;">
                YOUR MATCHES
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${jobCards}
              </table>
            </td>
          </tr>

          <!-- Stats bar -->
          <tr>
            <td style="background:#181818;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 8px;">
                    <p style="margin:0 0 2px 0;font-size:28px;font-weight:700;color:#f97316;letter-spacing:-0.02em;
                               font-family:'Space Mono','Courier New',monospace;">
                      ${jobCount}
                    </p>
                    <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.40);
                               letter-spacing:0.12em;text-transform:uppercase;
                               font-family:'Syne','Segoe UI',Arial,sans-serif;">
                      NEW MATCHES
                    </p>
                  </td>
                  <td align="center" style="padding:0 8px;border-left:1px solid #2e2e2e;">
                    <p style="margin:0 0 2px 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;
                               font-family:'Space Mono','Courier New',monospace;">
                      500+
                    </p>
                    <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.40);
                               letter-spacing:0.12em;text-transform:uppercase;
                               font-family:'Syne','Segoe UI',Arial,sans-serif;">
                      COMPANIES TRACKED
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA footer -->
          <tr>
            <td style="background:#101010;border:1px solid #2e2e2e;border-top:none;
                        border-radius:0 0 16px 16px;padding:28px 40px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:rgba(255,255,255,0.65);text-align:center;
                         font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
                Miss nothing. Apply smarter.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.APP_URL || "https://trackhire.com"}/jobs"
                       target="_blank"
                       style="display:inline-block;background:#f97316;color:#000000;
                              text-decoration:none;font-size:14px;font-weight:700;
                              padding:12px 32px;border-radius:8px;
                              font-family:'Syne','Segoe UI',Arial,sans-serif;">
                      Browse Jobs &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer / unsubscribe -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.40);line-height:1.7;
                         font-family:'DM Sans','Segoe UI',Arial,sans-serif;">
                You're receiving this because you set up job preferences on Track<span style="color:#f97316;">H</span>ire.<br>
                <a href="${escHtml(unsubUrl)}" style="color:#f97316;text-decoration:none;">
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
