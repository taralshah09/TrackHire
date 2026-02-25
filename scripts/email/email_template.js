/**
 * Builds a branded HTML digest email showing matched job listings.
 * Follows TrackHire Brand Guidelines — dark theme, orange accent, branded typography.
 *
 * @param {object} user         User object with `username`, `email`, `interests` (optional)
 * @param {object} tieredJobs   Object with { topPicks: Array, recommended: Array }
 * @param {string} unsubUrl     URL for unsubscribe (optional)
 * @returns {string}            HTML string ready to send
 */
function buildDigest(user, tieredJobs, unsubUrl = "#") {
  const { topPicks = [], recommended = [] } = tieredJobs;
  const name = user.username || "there";
  const totalCount = topPicks.length + recommended.length;

  // ── Determine greeting based on UTC time ──
  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── Personalized Intro ──
  const interests = user.interests || [];
  const interestSection = interests.length > 0
    ? `<p style="margin:8px 0 0 0;font-size:13px;color:rgba(255,255,255,0.45);font-family:'DM Sans',sans-serif;">
        Based on your interest in: <span style="color:rgba(255,255,255,0.8);">${escHtml(interests.slice(0, 3).join(", "))}${interests.length > 3 ? "..." : ""}</span>
       </p>`
    : "";

  const renderJobCard = (job) => {
    const postedDate = job.posted_at
      ? new Date(job.posted_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
      : "Recently";

    const company = job.company || "Company";
    const scoreTag = job.total_score ? `<span style="float:right;font-size:10px;color:rgba(255,115,22,0.8);font-family:'Space Mono',monospace;">+${job.total_score} pts</span>` : "";

    return `
      <tr>
        <td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background:#181818;border:1px solid #2e2e2e;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;">
                <div style="margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.05em;font-family:'Syne',sans-serif;">
                        ${escHtml(company)}
                    </span>
                    ${scoreTag}
                </div>
                <p style="margin:0 0 12px 0;font-size:17px;font-weight:700;color:#ffffff;font-family:'Syne',sans-serif;letter-spacing:-0.01em;line-height:1.4;">
                  ${escHtml(job.title)}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                        <span style="font-size:13px;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;">
                             ${escHtml(job.location || "Remote")} &nbsp;&middot;&nbsp; ${postedDate}
                        </span>
                    </td>
                    <td align="right">
                        <a href="${escHtml(job.apply_url)}" target="_blank"
                           style="display:inline-block;background:#f97316;color:#000000;text-decoration:none;font-size:12px;font-weight:800;padding:8px 16px;border-radius:6px;font-family:'Syne',sans-serif;">
                          Apply &rarr;
                        </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  };

  const topPicksHtml = topPicks.map(renderJobCard).join("");
  const recommendedHtml = recommended.map(renderJobCard).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Job Matches — TrackHire</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080808;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#101010;border:1px solid #2e2e2e;border-radius:20px 20px 0 0;padding:40px;">
              <p style="margin:0 0 4px 0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;font-family:'Syne',sans-serif;">
                Track<span style="color:#f97316;">H</span>ire
              </p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;">
                Intelligence-driven job discovery.
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="background:#101010;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:0 40px 30px;">
              <p style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;font-family:'Syne',sans-serif;">
                ${escHtml(greeting)}, ${escHtml(name)}
              </p>
              <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.7);line-height:1.6;font-family:'DM Sans',sans-serif;">
                We analyzed thousands of new roles to find matches that align with your career goals.
              </p>
              ${interestSection}
            </td>
          </tr>

          <!-- Top Picks -->
          ${topPicks.length > 0 ? `
          <tr>
            <td style="background:#080808;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:32px 40px 0;">
              <p style="margin:0 0 20px 0;font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.15em;text-transform:uppercase;font-family:'Syne',sans-serif;">
                🎯 TOP PICKS FOR YOU
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${topPicksHtml}
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Recommended -->
          ${recommended.length > 0 ? `
          <tr>
            <td style="background:#080808;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:32px 40px 0;">
              <p style="margin:0 0 20px 0;font-size:11px;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:0.15em;text-transform:uppercase;font-family:'Syne',sans-serif;">
                ✨ RECOMMENDED ROLES
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${recommendedHtml}
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Summary Bar -->
          <tr>
            <td style="background:#181818;border-left:1px solid #2e2e2e;border-right:1px solid #2e2e2e;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;font-family:'Space Mono',monospace;">
                      ${totalCount}
                    </p>
                    <p style="margin:0;font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;font-family:'Syne',sans-serif;">
                      NEW MATCHES
                    </p>
                  </td>
                  <td width="1" style="background:#2e2e2e;"></td>
                  <td align="center">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#f97316;font-family:'Space Mono',monospace;">
                      99%
                    </p>
                    <p style="margin:0;font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;font-family:'Syne',sans-serif;">
                      RELEVANCE
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#101010;border:1px solid #2e2e2e;border-radius:0 0 20px 20px;padding:40px;text-align:center;">
              <a href="${process.env.APP_URL || "https://trackhire.com"}/jobs"
                 target="_blank"
                 style="display:inline-block;background:#f97316;color:#000000;text-decoration:none;font-size:14px;font-weight:800;padding:14px 40px;border-radius:10px;font-family:'Syne',sans-serif;">
                View All New Openings &rarr;
              </a>
              <p style="margin:30px 0 0 0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;font-family:'DM Sans',sans-serif;">
                You're receiving this because you're early to the hunt.<br>
                <a href="${escHtml(unsubUrl)}" style="color:#f97316;text-decoration:none;">Unsubscribe</a>
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
