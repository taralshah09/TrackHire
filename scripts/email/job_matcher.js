const pool = require("./db_pool");

/**
 * Finds matching new jobs (last 7 days) for a given user based on their preferences.
 *
 * Matching strategy:
 *  - Job title contains at least one of the user's preferred_titles (case-insensitive)
 *  - Job was posted in the last 7 days and is_active = TRUE
 *  - User has NOT already applied to the job
 *  - The job has NOT been sent to this user in the last 7 days (email dedup)
 *
 * Relevance boost: if user has skills set, jobs whose description mentions any of
 * the skills are ranked higher (via a computed `skill_score` DESC sort).
 *
 * @param {number}   userId      The user's DB id
 * @param {string[]} jobTitles   Preferred job title keywords, e.g. ['software engineer', 'backend']
 * @param {string[]} skills      Preferred skills, e.g. ['Java', 'Docker']
 * @param {number}   [limit=10]  Max results to return
 * @returns {Promise<Array>}
 */
async function findJobsForUser(userId, jobTitles, skills, limit = 10) {
    if (!jobTitles || jobTitles.length === 0) return [];

    const client = await pool.connect();
    try {
        // Build title match conditions: j.title ILIKE '%<title>%' OR ...
        const titleConditions = jobTitles
            .map((_, i) => `j.title ILIKE $${i + 3}`)  // $3 onwards (after userId x2)
            .join(" OR ");

        const titleParams = jobTitles.map((t) => `%${t}%`);

        // Skill relevance score: count how many skills appear in the description
        // If no skills given, score is always 0 (neutral, sorted by posted_at DESC)
        let skillScoreExpr = "0";
        const skillParams = [];
        if (skills && skills.length > 0) {
            const skillCases = skills.map((s) => {
                skillParams.push(`%${s}%`);
                const pIdx = jobTitles.length + 3 + skillParams.length - 1; // dynamic param index
                return `CASE WHEN LOWER(j.description) LIKE LOWER($${pIdx}) THEN 1 ELSE 0 END`;
            });
            skillScoreExpr = `(${skillCases.join(" + ")})`;
        }

        // Total params: $1=userId (applied_jobs), $2=userId (email_log),
        //               $3…$(2+N) = title ILIKE params,
        //               then skill LIKE params
        const allParams = [userId, userId, ...titleParams, ...skillParams];

        const sql = `
            SELECT
                j.id,
                j.title,
                j.company,
                j.location,
                j.apply_url,
                j.posted_at,
                ${skillScoreExpr} AS skill_score
            FROM jobs j
            WHERE
                -- Only recent, active jobs
                j.is_active = TRUE
                AND j.posted_at >= NOW() - INTERVAL '7 days'

                -- Title preference match
                AND (${titleConditions})

                -- Exclude already applied
                AND j.id NOT IN (
                    SELECT job_id FROM applied_jobs WHERE user_id = $1
                )

                -- Exclude already emailed in last 7 days (deduplication)
                AND NOT EXISTS (
                    SELECT 1 FROM email_log el
                    WHERE el.user_id = $2
                      AND el.job_id = j.id
                      AND el.sent_at >= NOW() - INTERVAL '7 days'
                )

            ORDER BY skill_score DESC, j.posted_at DESC, j.id DESC
            LIMIT ${parseInt(limit)};
        `;

        const result = await client.query(sql, allParams);
        return result.rows;
    } finally {
        client.release();
    }
}

/**
 * Records that a set of jobs were successfully emailed to a user.
 * Uses INSERT … ON CONFLICT DO NOTHING to be idempotent.
 *
 * @param {number}   userId
 * @param {number[]} jobIds
 */
async function logEmailsSent(userId, jobIds) {
    if (!jobIds || jobIds.length === 0) return;

    const client = await pool.connect();
    try {
        // Build multi-row insert
        const values = [];
        const placeholders = jobIds.map((jobId, i) => {
            values.push(userId, jobId);
            return `($${i * 2 + 1}, $${i * 2 + 2})`;
        });

        await client.query(
            `INSERT INTO email_log (user_id, job_id)
             VALUES ${placeholders.join(", ")}
             ON CONFLICT (user_id, job_id) DO NOTHING`,
            values
        );
    } finally {
        client.release();
    }
}

module.exports = { findJobsForUser, logEmailsSent };
