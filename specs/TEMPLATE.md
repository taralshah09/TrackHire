# Feature: Multi-ATS Queue-Based Description Scraper

## Problem statement

The current `multi_ats` scraper only discovers job metadata (title, URL, company) but leaves the `description` field null. Fetching descriptions synchronously during discovery is inefficient and risks IP blocking due to lack of rate limiting. We need a decoupled system where discovery happens fast, and a background queue handles the heavy lifting of fetching and parsing job descriptions with intelligent fallbacks.

## Acceptance criteria

1.  **Producer Decoupling**: `multi_ats_scrapper.js` must be modified to enqueue job discovery data into a BullMQ queue instead of saving directly to a JSON/DB with null descriptions.
2.  **Queue System**: Implement a BullMQ-based system using Redis for persistence.
3.  **Worker Implementation**: A standalone `multi_ats_worker.js` that:
    *   Pops jobs from the `description-scraper` queue.
    *   Uses **Axios + Cheerio** as the primary fetching mechanism for speed.
    *   Uses **Puppeteer** as a fallback for JS-heavy sites (e.g., Workday).
4.  **Source-Specific Parsing**: Implement a selector registry for:
    *   **Greenhouse**: `div#content`
    *   **Lever**: `div.posting-description`
    *   **Ashby**: `div.ashby-job-posting-details`
    *   **SmartRecruiters**: `div.job-details`
5.  **Rate Limiting**: Enforce a global rate limit (e.g., 5 jobs/5 seconds) to avoid anti-bot detection.
6.  **Atomicity**: A job is only inserted/upserted into the PostgreSQL database *after* the description is successfully scraped or has definitively failed (falling back to `null`).
7.  **Error Handling**: If both Axios and Puppeteer fail, the job is saved with `description: null` and the error is logged.

## Out of scope

- Paid proxy rotation services (direct connection or free-tier only).
- Scraping "Apply" forms or internal ATS metadata.
- Re-scraping descriptions for jobs already in the database.

## Data contracts

### BullMQ Job Data
```json
{
  "id": "base64_url_string",
  "url": "https://jobs.lever.co/company/job-id",
  "company": "Company Name",
  "title": "Software Engineer",
  "ats": "lever",
  "location": "Bengaluru, India",
  "source": "ATS_LEVER"
}
```

### Function Signatures

```javascript
// Enqueue discovery data
async function enqueueJob(jobData);

// Scraping logic with fallbacks
async function scrapeDescription(url, atsType);
```

## Non-functional requirements

- **Resiliency**: Redis persistence ensures jobs are not lost if the worker crashes.
- **Performance**: Use of Axios as primary keeps resource usage low.
- **Compliance**: Respect `robots.txt` and rate limits.

## Open questions

- **Workday URL stability**: Workday URLs are often session-based. Can we generate direct links? (Assumption: Yes, by mapping external paths).
- **Redis Instance**: Should we use a local Docker container or a cloud provider like Upstash for development? (Assumption: Local Redis for dev).
