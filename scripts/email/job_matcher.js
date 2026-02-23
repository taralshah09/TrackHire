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
async function findJobsForUser(userId, jobTitles, skills, roleTypes, limit = 10) {
    if (!jobTitles || jobTitles.length === 0) return [];

    const client = await pool.connect();
    try {
        // ── Build role type filter ──────────────────────────────────────
        // Group user role types into experience_level values and employment_type values
        let expLevels = [];
        let empTypes = [];

        const types = (roleTypes && roleTypes.length > 0) ? roleTypes : ["Senior"];
        for (const rt of types) {
            const mapping = ROLE_TYPE_MAP[rt];
            if (!mapping) continue;
            if (mapping.col === "experience_level") expLevels.push(mapping.val);
            else if (mapping.col === "employment_type") empTypes.push(mapping.val);
        }

        // If no valid mappings found, default to SENIOR
        if (expLevels.length === 0 && empTypes.length === 0) {
            expLevels = ["SENIOR"];
        }

        // Build role type SQL conditions — jobs must match ANY of the selected levels/types
        const roleConditions = [];
        const roleParams = [];
        let paramIdx = 3; // $1=userId(applied), $2=userId(email_log), $3+ = dynamic

        if (expLevels.length > 0) {
            const placeholders = expLevels.map((v) => {
                roleParams.push(v);
                return `$${paramIdx++}`;
            });
            roleConditions.push(`(j.experience_level IN (${placeholders.join(", ")}) OR j.experience_level IS NULL)`);
        }
        if (empTypes.length > 0) {
            const placeholders = empTypes.map((v) => {
                roleParams.push(v);
                return `$${paramIdx++}`;
            });
            roleConditions.push(`(j.employment_type IN (${placeholders.join(", ")}) OR j.employment_type IS NULL)`);
        }

        const roleFilter = roleConditions.length > 0
            ? `AND (${roleConditions.join(" OR ")})`
            : "";

        // ── Build title match conditions ────────────────────────────────
        const titleConditions = jobTitles
            .map((_, i) => `j.title ILIKE $${paramIdx + i}`)
            .join(" OR ");

        const titleParams = jobTitles.map((t) => `%${t}%`);
        paramIdx += jobTitles.length;

        // ── Skill relevance score ───────────────────────────────────────
        let skillScoreExpr = "0";
        const skillParams = [];
        if (skills && skills.length > 0) {
            const skillCases = skills.map((s) => {
                skillParams.push(`%${s}%`);
                return `CASE WHEN LOWER(j.description) LIKE LOWER($${paramIdx++}) THEN 1 ELSE 0 END`;
            });
            skillScoreExpr = `(${skillCases.join(" + ")})`;
        }

        const allParams = [userId, userId, ...roleParams, ...titleParams, ...skillParams];

        const sql = `
            SELECT
                j.id,
                j.title,
                j.company,
                j.location,
                j.apply_url,
                j.posted_at,
                j.experience_level,
                j.employment_type,
                ${skillScoreExpr} AS skill_score
            FROM jobs j
            WHERE
                -- Only recent, active jobs
                j.is_active = TRUE
                AND j.posted_at >= NOW() - INTERVAL '7 days'

                -- Role type filter (experience level / employment type)
                ${roleFilter}

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
