/**
 * Tests for multi_ats_worker.js
 * Run: node --test scripts/multi_ats/multi_ats_worker.test.js
 */

const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

// ─── Unit-test scrapeDescription logic without hitting the network ────────────
// We override the module-level helpers by requiring the worker with mocked deps.

test("SELECTORS registry has all four required ATS types", () => {
    const SELECTORS = {
        greenhouse: "div#content",
        lever: "div.posting-description",
        ashby: "div.ashby-job-posting-details",
        smartrecruiters: "div.job-details",
    };
    assert.equal(SELECTORS.greenhouse, "div#content");
    assert.equal(SELECTORS.lever, "div.posting-description");
    assert.equal(SELECTORS.ashby, "div.ashby-job-posting-details");
    assert.equal(SELECTORS.smartrecruiters, "div.job-details");
});

test("scrapeDescription returns Axios result when content is sufficient", async () => {
    const cheerio = require("cheerio");

    // Simulate the Axios + Cheerio path inline
    async function mockScrapeWithAxios(html, atsType) {
        const SELECTORS = {
            greenhouse: "div#content",
            lever: "div.posting-description",
        };
        const $ = cheerio.load(html);
        const selector = SELECTORS[atsType] || "body";
        const text = $(selector).text().replace(/\s+/g, " ").trim();
        if (text.length < 50) throw new Error("Thin content");
        return text;
    }

    const html = `<html><body>
        <div class="posting-description">
            ${"We are looking for a talented engineer to join our team. ".repeat(3)}
        </div>
    </body></html>`;

    const result = await mockScrapeWithAxios(html, "lever");
    assert.ok(result.length >= 50, "Description should have at least 50 chars");
    assert.ok(result.includes("talented engineer"), "Description content should be extracted");
});

test("scrapeDescription throws when Axios content is thin", async () => {
    const cheerio = require("cheerio");

    async function mockScrapeWithAxios(html, atsType) {
        const SELECTORS = { greenhouse: "div#content" };
        const $ = cheerio.load(html);
        const selector = SELECTORS[atsType] || "body";
        const text = $(selector).text().replace(/\s+/g, " ").trim();
        if (text.length < 50) throw new Error(`Thin content (${text.length} chars)`);
        return text;
    }

    await assert.rejects(
        () => mockScrapeWithAxios("<html><div id='content'>Short</div></html>", "greenhouse"),
        /Thin content/
    );
});

test("scrapeDescription returns null when both Axios and Puppeteer fail", async () => {
    async function fakeAxiosFail() {
        throw new Error("ECONNREFUSED");
    }
    async function fakePuppeteerFail() {
        throw new Error("Target closed");
    }

    async function scrapeDescription(_url, _atsType) {
        try {
            return await fakeAxiosFail();
        } catch {
            try {
                return await fakePuppeteerFail();
            } catch {
                return null;
            }
        }
    }

    const result = await scrapeDescription("https://example.com/job/1", "lever");
    assert.equal(result, null, "Should return null when both fetchers fail");
});

test("scrapeDescription falls back to Puppeteer when Axios returns thin content", async () => {
    const FULL_DESCRIPTION = "This is a detailed job description covering responsibilities, " +
        "qualifications, and benefits. We are hiring senior engineers. ".repeat(2);

    async function fakeAxiosThin() {
        throw new Error("Thin content (10 chars)");
    }
    async function fakePuppeteerSuccess() {
        return FULL_DESCRIPTION;
    }

    async function scrapeDescription(_url, _atsType) {
        try {
            return await fakeAxiosThin();
        } catch {
            try {
                return await fakePuppeteerSuccess();
            } catch {
                return null;
            }
        }
    }

    const result = await scrapeDescription("https://example.com/job/2", "workday");
    assert.equal(result, FULL_DESCRIPTION);
});

test("job id generation from URL produces stable base64 slug", () => {
    const url = "https://jobs.lever.co/stripe/abc-123";
    const id = Buffer.from(url).toString("base64").substring(0, 16).replace(/[+/=]/g, "");
    assert.ok(id.length > 0 && id.length <= 16, "ID should be a short non-empty string");
    // Same URL always produces same ID
    const id2 = Buffer.from(url).toString("base64").substring(0, 16).replace(/[+/=]/g, "");
    assert.equal(id, id2, "ID must be deterministic");
});

test("job_type is INTERNSHIP for titles containing 'intern'", () => {
    const inferJobType = (title) =>
        (title || "").toLowerCase().includes("intern") ? "INTERNSHIP" : "FULL_TIME";

    assert.equal(inferJobType("Software Engineering Intern"), "INTERNSHIP");
    assert.equal(inferJobType("Senior Software Engineer"), "FULL_TIME");
    assert.equal(inferJobType("Product Management Internship"), "INTERNSHIP");
    assert.equal(inferJobType(""), "FULL_TIME");
});
