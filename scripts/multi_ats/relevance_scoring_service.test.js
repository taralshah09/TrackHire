/**
 * Tests for relevance_scoring_service.js
 * Run: node --test scripts/multi_ats/relevance_scoring_service.test.js
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateScore,
    calculateSkillScore,
    calculateCompanyScore,
    calculateTitleScore,
    calculateRoleTypeScore,
    calculateFreshnessScore,
} = require("./relevance_scoring_service");

// ── Skill Score ───────────────────────────────────────────────────────────────

test("skill score: plan example — 2/3 overlap = 33 pts", () => {
    const { score, matchedSkills } = calculateSkillScore(
        ["Java", "Spring Boot", "AWS"],
        ["Java", "Spring Boot", "Kafka"]
    );
    assert.equal(score, 33);
    assert.deepEqual(matchedSkills.sort(), ["Java", "Spring Boot"].sort());
});

test("skill score: perfect match = 50 pts", () => {
    const { score } = calculateSkillScore(["React", "TypeScript"], ["React", "TypeScript", "Node.js"]);
    assert.equal(score, 50);
});

test("skill score: no overlap = 0 pts", () => {
    const { score, matchedSkills } = calculateSkillScore(
        ["Java", "Spring Boot"],
        ["Python", "Django"]
    );
    assert.equal(score, 0);
    assert.equal(matchedSkills.length, 0);
});

test("skill score: case-insensitive matching", () => {
    const { score } = calculateSkillScore(["react", "typescript"], ["React", "TypeScript"]);
    assert.equal(score, 50);
});

test("skill score: empty user skills = 0 pts", () => {
    const { score } = calculateSkillScore([], ["Java", "Python"]);
    assert.equal(score, 0);
});

test("skill score: empty job skills = 0 pts", () => {
    const { score } = calculateSkillScore(["Java", "Python"], []);
    assert.equal(score, 0);
});

test("skill score: capped at 50 even if fraction exceeds 1", () => {
    // Edge case: jobSkills contains duplicates (shouldn't happen but defensive)
    const { score } = calculateSkillScore(["Java"], ["Java"]);
    assert.ok(score <= 50);
});

// ── Company Score ─────────────────────────────────────────────────────────────

test("company score: exact match = 20 pts", () => {
    const { score, matched } = calculateCompanyScore(["Google", "Stripe"], "Stripe");
    assert.equal(score, 20);
    assert.equal(matched, true);
});

test("company score: case-insensitive match = 20 pts", () => {
    const { score } = calculateCompanyScore(["google"], "Google");
    assert.equal(score, 20);
});

test("company score: no match = 0 pts", () => {
    const { score, matched } = calculateCompanyScore(["Google", "Stripe"], "Airbnb");
    assert.equal(score, 0);
    assert.equal(matched, false);
});

test("company score: empty preferred list = 0 pts", () => {
    const { score } = calculateCompanyScore([], "Google");
    assert.equal(score, 0);
});

// ── Title Score ───────────────────────────────────────────────────────────────

test("title score: plan example — Backend Engineer vs Senior Backend Engineer = 15 pts", () => {
    const { score, matchedTitle } = calculateTitleScore(
        ["Backend Engineer", "Software Engineer", "Java Developer"],
        "Senior Backend Engineer"
    );
    assert.equal(score, 15);
    assert.equal(matchedTitle, "Backend Engineer");
});

test("title score: partial word overlap = partial score", () => {
    const { score } = calculateTitleScore(["Data Scientist"], "Senior Data Analyst");
    // "data" matches, "scientist" vs "analyst" don't → 1/3 overlap → round(5) = 5
    assert.ok(score > 0 && score < 15);
});

test("title score: no overlap = 0 pts", () => {
    const { score, matchedTitle } = calculateTitleScore(
        ["Frontend Developer"],
        "Database Administrator"
    );
    assert.equal(score, 0);
    assert.equal(matchedTitle, null);
});

test("title score: empty preferred titles = 0 pts", () => {
    const { score } = calculateTitleScore([], "Software Engineer");
    assert.equal(score, 0);
});

test("title score: seniority words stripped before comparison", () => {
    // "Staff Software Engineer" → ["software", "engineer"]
    // "Senior Software Engineer" → ["software", "engineer"]
    const { score } = calculateTitleScore(
        ["Staff Software Engineer"],
        "Senior Software Engineer"
    );
    assert.equal(score, 15);
});

// ── Role Type Score ───────────────────────────────────────────────────────────

test("role type score: full-time match = 5 pts", () => {
    const { score, matched } = calculateRoleTypeScore(["Full-time", "Contract"], "FULL_TIME");
    assert.equal(score, 5);
    assert.equal(matched, true);
});

test("role type score: internship match = 5 pts", () => {
    const { score } = calculateRoleTypeScore(["Intern"], "INTERNSHIP");
    assert.equal(score, 5);
});

test("role type score: contract match = 5 pts", () => {
    const { score } = calculateRoleTypeScore(["Contract"], "CONTRACT");
    assert.equal(score, 5);
});

test("role type score: mismatch = 0 pts", () => {
    const { score, matched } = calculateRoleTypeScore(["Intern"], "FULL_TIME");
    assert.equal(score, 0);
    assert.equal(matched, false);
});

test("role type score: empty preferred = 0 pts", () => {
    const { score } = calculateRoleTypeScore([], "FULL_TIME");
    assert.equal(score, 0);
});

// ── Freshness Score ───────────────────────────────────────────────────────────

test("freshness score: < 24 hours = 10 pts", () => {
    const now = Date.now();
    const postedAt = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    const { score, label } = calculateFreshnessScore(postedAt, now);
    assert.equal(score, 10);
    assert.equal(label, "< 24 hours");
});

test("freshness score: < 3 days = 7 pts", () => {
    const now = Date.now();
    const postedAt = new Date(now - 2 * 86_400_000).toISOString(); // 2 days ago
    const { score, label } = calculateFreshnessScore(postedAt, now);
    assert.equal(score, 7);
    assert.equal(label, "< 3 days");
});

test("freshness score: < 7 days = 5 pts", () => {
    const now = Date.now();
    const postedAt = new Date(now - 5 * 86_400_000).toISOString(); // 5 days ago
    const { score, label } = calculateFreshnessScore(postedAt, now);
    assert.equal(score, 5);
    assert.equal(label, "< 7 days");
});

test("freshness score: < 30 days = 2 pts", () => {
    const now = Date.now();
    const postedAt = new Date(now - 15 * 86_400_000).toISOString(); // 15 days ago
    const { score, label } = calculateFreshnessScore(postedAt, now);
    assert.equal(score, 2);
    assert.equal(label, "< 30 days");
});

test("freshness score: > 30 days = 0 pts", () => {
    const now = Date.now();
    const postedAt = new Date(now - 45 * 86_400_000).toISOString(); // 45 days ago
    const { score, label } = calculateFreshnessScore(postedAt, now);
    assert.equal(score, 0);
    assert.equal(label, "> 30 days");
});

test("freshness score: null postedAt = 0 pts", () => {
    const { score } = calculateFreshnessScore(null);
    assert.equal(score, 0);
});

// ── Full calculateScore ───────────────────────────────────────────────────────

test("calculateScore: all components contribute correctly", () => {
    const now = Date.now();
    const job = {
        id: 1,
        title: "Senior Backend Engineer",
        company: "Stripe",
        employment_type: "FULL_TIME",
        posted_at: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    };
    const jobSkills = ["Java", "Spring Boot", "Kafka"];
    const preferences = {
        userId: 42,
        skills: ["Java", "Spring Boot", "AWS"],        // 2/3 → 33 pts
        jobTitles: ["Backend Engineer"],               // full match → 15 pts
        roleTypes: ["Full-time"],                      // match → 5 pts
        preferredCompanies: ["Stripe"],                // match → 20 pts
    };

    const { score, reasons } = calculateScore(job, jobSkills, preferences);

    // skill(33) + company(20) + title(15) + role(5) + freshness(10) = 83
    assert.equal(score, 83);
    assert.deepEqual(reasons.skillMatches.sort(), ["Java", "Spring Boot"].sort());
    assert.equal(reasons.companyMatch, true);
    assert.equal(reasons.titleMatch, "Backend Engineer");
    assert.equal(reasons.roleTypeMatch, true);
    assert.equal(reasons.freshness, "< 24 hours");
    assert.equal(reasons.breakdown.skill, 33);
    assert.equal(reasons.breakdown.company, 20);
    assert.equal(reasons.breakdown.title, 15);
    assert.equal(reasons.breakdown.roleType, 5);
    assert.equal(reasons.breakdown.freshness, 10);
});

test("calculateScore: score capped at 100", () => {
    const now = Date.now();
    const job = {
        id: 2,
        title: "Backend Engineer",
        company: "Google",
        employment_type: "FULL_TIME",
        posted_at: new Date(now - 1000).toISOString(),
    };
    const jobSkills = ["Java", "Spring Boot"];
    const preferences = {
        userId: 1,
        skills: ["Java", "Spring Boot"],               // 2/2 → 50 pts
        jobTitles: ["Backend Engineer"],               // 15 pts
        roleTypes: ["Full-time"],                      // 5 pts
        preferredCompanies: ["Google"],                // 20 pts
    };

    const { score } = calculateScore(job, jobSkills, preferences);
    // 50+15+5+20+10 = 100
    assert.equal(score, 100);
});

test("calculateScore: no preferences = freshness only", () => {
    const now = Date.now();
    const job = {
        id: 3,
        title: "Data Engineer",
        company: "Amazon",
        employment_type: "FULL_TIME",
        posted_at: new Date(now - 2 * 86_400_000).toISOString(),
    };
    const { score } = calculateScore(job, ["Python", "Spark"], {
        userId: 99,
        skills: [],
        jobTitles: [],
        roleTypes: [],
        preferredCompanies: [],
    });

    assert.equal(score, 7); // freshness < 3 days only
});

test("calculateScore: reasons.breakdown sums to score", () => {
    const now = Date.now();
    const job = {
        id: 4,
        title: "DevOps Engineer",
        company: "Cloudflare",
        employment_type: "CONTRACT",
        posted_at: new Date(now - 10 * 86_400_000).toISOString(),
    };
    const jobSkills = ["Docker", "Kubernetes"];
    const preferences = {
        userId: 7,
        skills: ["Docker", "Terraform"],
        jobTitles: ["DevOps Engineer"],
        roleTypes: ["Contract"],
        preferredCompanies: [],
    };

    const { score, reasons } = calculateScore(job, jobSkills, preferences);
    const sumFromBreakdown = Object.values(reasons.breakdown).reduce((a, b) => a + b, 0);
    assert.equal(score, Math.min(sumFromBreakdown, 100));
});
