const pool = require("./db_pool");

/**
 * Maps user-facing role type preference strings to DB enum values.
 *
 * Job entity has:
 *   experience_level: ENTRY, JUNIOR, MID, SENIOR, LEAD, EXECUTIVE
 *   employment_type:  FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, TEMPORARY, FREELANCE
 */
const ROLE_TYPE_MAP = {
    // experience_level mappings
    "Intern": { col: "experience_level", val: "ENTRY" },
    "Junior": { col: "experience_level", val: "JUNIOR" },
    "Mid-level": { col: "experience_level", val: "MID" },
    "Senior": { col: "experience_level", val: "SENIOR" },
    "Lead": { col: "experience_level", val: "LEAD" },
    // employment_type mappings
    "Full-time": { col: "employment_type", val: "FULL_TIME" },
    "Part-time": { col: "employment_type", val: "PART_TIME" },
    "Contract": { col: "employment_type", val: "CONTRACT" },
    "Freelance": { col: "employment_type", val: "FREELANCE" },
};

/**
 * Finds matching new jobs (last 7 days) for a given user based on their preferences.
 *
 * Matching strategy:
 *  1. Role type filter (experience_level / employment_type) — applied FIRST
 *     If the user has no role types, defaults to SENIOR experience level.
 *  2. Job title contains at least one of the user's preferred_titles (case-insensitive)
 *  3. Job was posted in the last 7 days and is_active = TRUE
 *  4. User has NOT already applied to the job
 *  5. The job has NOT been sent to this user in the last 7 days (email dedup)
 *
 * Relevance boost: if user has skills set, jobs whose description mentions any of
 * the skills are ranked higher (via a computed `skill_score` DESC sort).
 *
 * @param {number}   userId      The user's DB id
 * @param {string[]} jobTitles   Preferred job title keywords
 * @param {string[]} skills      Preferred skills
 * @param {string[]} roleTypes   Preferred role types (from user preferences)
 * @param {number}   [limit=10]  Max results to return
 * @returns {Promise<Array>}
 */
/**
 * Finds matching jobs for a user with weighted ranking, diversity enforcement, and smart fallback.
 *
 * Ranking Strategy:
 *  - Title Match Coverage: 10 points per matched keyword
 *  - Skill Keywords Score: 5 points per matched skill in description
 *  - Recency Bonus: 15 points if posted in last 24h, 5 points if last 48h
 *
 * Diversity: Max 2 jobs per company.
 * Fallback: If top picks < 5, returns additional recommended jobs with broader matching.
 *
 * @returns {Promise<{topPicks: Array, recommended: Array}>}
 */
async function findJobsForUser(userId, jobTitles, skills, roleTypes, limit = 10) {
    if (!jobTitles || jobTitles.length === 0) return { topPicks: [], recommended: [] };

    const client = await pool.connect();
    try {
        // ── Role Type Preparation ──────────────────────────────────────
        let expLevels = [];
        let empTypes = [];
        const types = (roleTypes && roleTypes.length > 0) ? roleTypes : ["Senior"];
        for (const rt of types) {
            const mapping = ROLE_TYPE_MAP[rt];
            if (!mapping) continue;
            if (mapping.col === "experience_level") expLevels.push(mapping.val);
            else if (mapping.col === "employment_type") empTypes.push(mapping.val);
        }
        if (expLevels.length === 0 && empTypes.length === 0) expLevels = ["SENIOR"];

        // ── SQL Parameters & Placeholders ──────────────────────────────
        // $1: userId (applied), $2: userId (email_log)
        let paramIdx = 3;
        const params = [userId, userId];

        const getPlaceholders = (arr) => {
            const ph = arr.map(() => `$${paramIdx++}`);
            params.push(...arr);
            return ph.join(", ");
        };

        const expPH = expLevels.length > 0 ? getPlaceholders(expLevels) : null;
        const empPH = empTypes.length > 0 ? getPlaceholders(empTypes) : null;
        const titleLikes = jobTitles.map(t => `%${t}%`);
        const titlePHs = jobTitles.map(() => `$${paramIdx++}`);
        params.push(...titleLikes);

        // Role Type Title matching: 20 points for each match
        const roleTypeLikes = roleTypes.map(rt => `%${rt}%`);
        const roleTypePHs = roleTypes.map(() => `$${paramIdx++}`);
        params.push(...roleTypeLikes);

        // Skill scoring expressions
        let skillScoreExpr = "0";
        if (skills && skills.length > 0) {
            const skillCases = skills.map((s) => {
                params.push(`%${s}%`);
                return `CASE WHEN LOWER(j.description) LIKE LOWER($${paramIdx++}) THEN 5 ELSE 0 END`;
            });
            skillScoreExpr = `(${skillCases.join(" + ")})`;
        }

        // Title scoring: 10 points for each match
        const titleScoreExpr = `(${titlePHs.map(ph => `CASE WHEN j.title ILIKE ${ph} THEN 10 ELSE 0 END`).join(" + ")})`;

        // Role type in title scoring: 20 points for each match
        const roleTypeScoreExpr = roleTypePHs.length > 0
            ? `(${roleTypePHs.map(ph => `CASE WHEN j.title ILIKE ${ph} THEN 20 ELSE 0 END`).join(" + ")})`
            : "0";

        const roleFilter = [];
        if (expPH) roleFilter.push(`(j.experience_level IN (${expPH}) OR j.experience_level IS NULL)`);
        if (empPH) roleFilter.push(`(j.employment_type IN (${empPH}) OR j.employment_type IS NULL)`);
        const roleFilterSql = roleFilter.length > 0 ? `AND (${roleFilter.join(" OR ")})` : "";

        const schema = process.env.DB_SCHEMA || "jobs_tracker_v1";

        // ── The Big Query ──────────────────────────────────────────────
        const sql = `
            WITH ScoredJobs AS (
                SELECT
                    j.id, j.title, j.company, j.location, j.apply_url, j.posted_at,
                    ${titleScoreExpr} AS title_score,
                    ${roleTypeScoreExpr} AS role_type_title_score,
                    ${skillScoreExpr} AS skill_score,
                    CASE
                        WHEN j.posted_at >= NOW() - INTERVAL '24 hours' THEN 15
                        WHEN j.posted_at >= NOW() - INTERVAL '48 hours' THEN 5
                        ELSE 0
                    END AS recency_bonus
                FROM ${schema}.jobs j
                WHERE j.is_active = TRUE
                  AND j.posted_at >= NOW() - INTERVAL '7 days'
                  ${roleFilterSql}
                  -- Exclude already applied
                  AND j.id NOT IN (SELECT job_id FROM ${schema}.applied_jobs WHERE user_id = $1)
                  -- Exclude already emailed (7-day window)
                  AND NOT EXISTS (
                      SELECT 1 FROM ${schema}.email_log el
                      WHERE el.user_id = $2 AND el.job_id = j.id
                        AND el.sent_at >= NOW() - INTERVAL '7 days'
                  )
            ),
            RankedJobs AS (
                SELECT *,
                       (title_score + role_type_title_score + skill_score + recency_bonus) AS total_score,
                       ROW_NUMBER() OVER (PARTITION BY company ORDER BY (title_score + role_type_title_score + skill_score + recency_bonus) DESC, posted_at DESC) as company_rank
                FROM ScoredJobs
                WHERE title_score > 0 OR skill_score > 0 OR role_type_title_score > 0
            )
            SELECT * FROM RankedJobs
            WHERE company_rank <= 2
            ORDER BY total_score DESC, posted_at DESC
            LIMIT ${parseInt(limit)};
        `;

        const result = await client.query(sql, params);
        const allMatches = result.rows;

        // Split into Tiered Results
        // Top Picks: Strong title match (score >= 10)
        // Recommended: Lower score or fallback
        const topPicks = allMatches.filter(j => j.title_score >= 10);
        let recommended = allMatches.filter(j => j.title_score < 10);

        // Smart Fallback: If we have very few top picks, and room for more
        if (topPicks.length < 3 && allMatches.length < limit) {
            // Future improvement: Could run a second broader query here if needed
            // For now, we rely on the single efficient query that includes both tiers
        }

        return {
            topPicks: topPicks.slice(0, 5),
            recommended: recommended.concat(topPicks.slice(5)).slice(0, limit - topPicks.slice(0, 5).length)
        };
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
