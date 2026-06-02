// Seniority qualifiers stripped when comparing titles so "Senior Backend Engineer"
// matches a user preference of "Backend Engineer".
const SENIORITY_WORDS = new Set([
    "senior", "sr", "junior", "jr", "lead", "staff", "principal", "associate",
    "head", "director", "vp", "vice", "president", "distinguished", "fellow",
    "graduate", "entry", "mid", "intern",
]);

function normalizeTitleWords(title) {
    return (title || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !SENIORITY_WORDS.has(w));
}

// ── Skill Match: 50 pts ───────────────────────────────────────────────────────

function calculateSkillScore(userSkills, jobSkills) {
    if (!userSkills || userSkills.length === 0) {
        return { score: 0, matchedSkills: [] };
    }

    const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
    const matched = (jobSkills || []).filter((s) => userSet.has(s.toLowerCase()));

    const fraction = matched.length / userSkills.length;
    const score = Math.min(Math.round(fraction * 50), 50);

    return { score, matchedSkills: matched };
}

// ── Preferred Company: 20 pts ─────────────────────────────────────────────────

function calculateCompanyScore(preferredCompanies, jobCompany) {
    if (!preferredCompanies || preferredCompanies.length === 0) {
        return { score: 0, matched: false };
    }

    const normalizedJob = (jobCompany || "").toLowerCase().trim();
    const matched =
        normalizedJob.length > 0 &&
        preferredCompanies.some((c) => c.toLowerCase().trim() === normalizedJob);

    return { score: matched ? 20 : 0, matched };
}

// ── Title Match: 15 pts ───────────────────────────────────────────────────────

function calculateTitleScore(userTitles, jobTitle) {
    if (!userTitles || userTitles.length === 0) {
        return { score: 0, matchedTitle: null };
    }

    const jobWords = new Set(normalizeTitleWords(jobTitle));
    if (jobWords.size === 0) return { score: 0, matchedTitle: null };

    let bestFraction = 0;
    let bestTitle = null;

    for (const title of userTitles) {
        const userWords = new Set(normalizeTitleWords(title));
        if (userWords.size === 0) continue;

        const overlapCount = [...userWords].filter((w) => jobWords.has(w)).length;
        const fraction = overlapCount / Math.max(userWords.size, jobWords.size);

        if (fraction > bestFraction) {
            bestFraction = fraction;
            bestTitle = title;
        }
    }

    const score = Math.min(Math.round(bestFraction * 15), 15);
    return { score, matchedTitle: score > 0 ? bestTitle : null };
}

// ── Role Type Match: 5 pts ────────────────────────────────────────────────────

// Maps raw strings from both the job (FULL_TIME enum) and user preferences
// ("Full-time", "Intern") to a common normalized key.
function normalizeRoleType(raw) {
    if (!raw) return null;
    const s = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (s.includes("intern")) return "internship";
    if (s.includes("contract")) return "contract";
    if (s.includes("part")) return "part_time";
    if (s.includes("temporary") || s.includes("temp")) return "temporary";
    if (s.includes("freelance")) return "freelance";
    if (s.includes("full") || s.includes("fulltime")) return "full_time";
    return s;
}

function calculateRoleTypeScore(userRoleTypes, jobEmploymentType) {
    if (!userRoleTypes || userRoleTypes.length === 0) {
        return { score: 0, matched: false };
    }

    const normalizedJob = normalizeRoleType(jobEmploymentType);
    const matched =
        normalizedJob !== null &&
        userRoleTypes.some((rt) => normalizeRoleType(rt) === normalizedJob);

    return { score: matched ? 5 : 0, matched };
}

// ── Freshness: 10 pts ─────────────────────────────────────────────────────────

function calculateFreshnessScore(postedAt, now = Date.now()) {
    if (!postedAt) return { score: 0, label: "unknown" };

    const ageDays = (now - new Date(postedAt).getTime()) / 86_400_000;

    if (ageDays < 1) return { score: 10, label: "< 24 hours" };
    if (ageDays < 3) return { score: 7, label: "< 3 days" };
    if (ageDays < 7) return { score: 5, label: "< 7 days" };
    if (ageDays < 30) return { score: 2, label: "< 30 days" };
    return { score: 0, label: "> 30 days" };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Calculate a relevance score between a job and user preferences.
 *
 * @param {object} job          { id, title, company, employment_type, posted_at }
 * @param {string[]} jobSkills  Skills extracted from the job (from job_skills table)
 * @param {object} preferences  { userId, skills, jobTitles, roleTypes, preferredCompanies }
 * @returns {{ score: number, reasons: object }}
 *   score    0–100 integer
 *   reasons  stored as JSONB in user_job_relevance
 */
function calculateScore(job, jobSkills, preferences) {
    const skill = calculateSkillScore(preferences.skills, jobSkills);
    const company = calculateCompanyScore(preferences.preferredCompanies, job.company);
    const title = calculateTitleScore(preferences.jobTitles, job.title);
    const role = calculateRoleTypeScore(preferences.roleTypes, job.employment_type);
    const freshness = calculateFreshnessScore(job.posted_at);

    const total = skill.score + company.score + title.score + role.score + freshness.score;

    const reasons = {
        skillMatches: skill.matchedSkills,
        companyMatch: company.matched,
        titleMatch: title.matchedTitle,
        roleTypeMatch: role.matched,
        freshness: freshness.label,
        breakdown: {
            skill: skill.score,
            company: company.score,
            title: title.score,
            roleType: role.score,
            freshness: freshness.score,
        },
    };

    return { score: Math.min(total, 100), reasons };
}

module.exports = {
    calculateScore,
    calculateSkillScore,
    calculateCompanyScore,
    calculateTitleScore,
    calculateRoleTypeScore,
    calculateFreshnessScore,
};
