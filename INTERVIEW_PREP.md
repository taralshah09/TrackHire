# TrackHire - Technical Interview Preparation Guide

This document is a comprehensive, deep-dive analysis of the **TrackHire** project, designed to prepare you for senior-level backend, full-stack, and system design interviews. 

---

## 1. Executive Summary

**What it does:** TrackHire is a full-stack job discovery and tracking platform that aggregates job listings directly from company career pages and exclusive sources. It features an automated daily data pipeline to ingest, clean, and deduplicate 10,000+ curated jobs, paired with a personal tracker for users to manage their application pipeline.

**Target Users:** Job seekers (especially in tech) who are frustrated with the noise, lag, and overwhelming volume on mainstream boards like LinkedIn and Indeed.

**Core Problem Solved:** The "late applicant" problem. By the time jobs hit mainstream boards, they are often flooded with applicants. TrackHire pulls directly from the source, giving users a first-mover advantage and consolidating the job hunt (search + tracking) into a single platform.

**Business Value:** High engagement and retention. By offering exclusive, faster access to listings and an embedded Kanban-style tracker, users are incentivized to return daily.

**Key Technologies:**
- **Frontend:** React 19, Vite, Tailwind CSS, deployed on Vercel.
- **Backend:** Java 21, Spring Boot 3, Spring Security (JWT), deployed on Render.
- **Database:** PostgreSQL (Neon DB/Supabase) via Spring Data JPA.
- **Data Pipeline/Workers:** Node.js, `p-limit`, `node-cron`, `axios`, `cheerio` (Web Scraping).

---

## 2. High-Level Architecture

The system follows a separated frontend-backend architecture with an asynchronous offline data ingestion pipeline.

### Component Breakdown
1. **Client Layer (React SPA):** Handles presentation, global state (Context API), and client-side routing. Talks exclusively to the REST API over HTTPS.
2. **API Layer (Spring Boot Monolith):** A stateless REST API. Handles authentication, authorization, business logic for the tracker, and querying jobs. Uses Caffeine caching for high-read, low-churn endpoints.
3. **Data Layer (PostgreSQL):** Relational store containing both operational data (users, auth, tracked applications) and analytical/search data (the scraped jobs).
4. **Pipeline Layer (Node.js Cron):** Independent Node.js workers that scrape career pages, normalize data, deduplicate, and bulk-insert into PostgreSQL. Runs out-of-band via scheduled cron jobs.
5. **Email Gateway:** Dedicated micro-service/batch processor that scans user preferences, matches jobs from the DB, and sends tailored digest emails.

### Synchronous vs Asynchronous Flows
- **Synchronous:** User logins, tracking an application, saving a job, and fetching the job feed are synchronous HTTP requests served by Spring Boot.
- **Asynchronous:** The scraping of jobs and sending of batch emails are entirely asynchronous, decoupled from user requests, running on cron schedules to protect the main API's performance.

### Architecture Strengths
- **Decoupled Data Ingestion:** If the scrapers fail or get IP-banned, the main user-facing application remains 100% unaffected.
- **Stateless API:** JWT-based auth allows the Spring Boot app to be horizontally scaled simply by adding instances.
- **Tech Alignment:** Heavy lifting (scraping/async I/O) is handled by Node.js, which excels at it. Strict business logic and relational data integrity are handled by Spring Boot/Java.

### Architecture Weaknesses & Scalability Concerns
- **Database Coupling:** Both the read-heavy user traffic and the write-heavy bulk pipeline share the same PostgreSQL instance. At massive scale, the bulk inserts might lock tables or degrade read performance.
- **Full-Text Search:** Querying jobs relies on standard SQL `ILIKE` or basic indexes. At 1M+ jobs, PostgreSQL text search will bottleneck.

### Alternatives
- Using Elasticsearch or Algolia for the job feed to offload text-search from PostgreSQL.
- Using message queues (RabbitMQ/Kafka) between the scraper and the database for smoother ingestion rather than bulk JDBC inserts.

---

## 3. Folder Structure Breakdown

```text
TrackHire/
├── frontend/             # React SPA
│   ├── src/components/   # Reusable UI widgets
│   ├── src/pages/        # Route-level components
│   └── src/context/      # Global state (AuthContext)
├── backend/              # Spring Boot Monolith
│   ├── src/main/java/.../model/       # JPA Entities (DB schemas)
│   ├── src/main/java/.../repository/  # Spring Data JPA interfaces
│   ├── src/main/java/.../service/     # Business logic layer
│   └── src/main/java/.../controller/  # REST endpoints mapping
└── scripts/              # Node.js Pipeline
    ├── adzuna/           # API aggregators
    ├── email/            # Email batch sender
    └── public-api/       # Web scrapers
```

### Layering Strategy
The backend uses a strict **Controller-Service-Repository** pattern.
- **Controllers** handle HTTP concerns (status codes, JSON serialization).
- **Services** handle business logic (validating user ownership, orchestrating models).
- **Repositories** handle persistence.

**Maintainability Concerns:** The scripts folder mixes various scraping paradigms. Some scrapers use raw HTTP (Adzuna), others use Cheerio for HTML parsing. Over time, maintaining scrapers is highly fragile as DOM structures change.

---

## 4. Database Design

A relational PostgreSQL database manages the state.

### Core Entities & Relationships
1. **User:** `id`, `email`, `password_hash`.
2. **UserProfile:** 1:1 with User. Holds non-auth data.
3. **OAuthAccount:** 1:N with User. For future SSO support.
4. **Job (BaseJob, FulltimeJobs, InternJobs):** Uses table-per-class or single-table inheritance mapping in JPA. `id`, `title`, `company`, `url`, `posted_at`.
5. **SavedJob:** Join table with metadata mapping `User` to `Job` (N:M).
6. **AppliedJob:** Tracks the kanban state. `user_id`, `job_id`, `status` (e.g., APPLIED, REJECTED, OFFER), `notes`.
7. **UserJobPreferences / UserPreferredCompany:** Tracks user notification triggers.

### Indexing & Scaling Implications
- **Indexes:** Based on models, indexes exist on `Job.company`, `Job.posted_at`, and foreign keys (`user_id` in `SavedJob`).
- **Denormalization:** The system normalizes users and jobs, but likely denormalizes `company_name` directly onto the `Job` row rather than having a strict `Company` table, optimizing for read speed over strict normalization.
- **Why PostgreSQL?** Excellent balance of relational integrity (critical for user tracking/auth) and JSONB/Array support (useful for job skills/metadata). 
- **Limitations:** Text searching `job_title` using SQL is a looming bottleneck. 

---

## 5. API Design

The API is RESTful and versioned (`/api/v1` or standard `/api`).

### Major Endpoints
- `POST /api/auth/login`: Issues Access (JWT) & Refresh tokens.
- `GET /api/jobs`: Paginated feed of jobs.
- `POST /api/jobs/preferred`: Filtered search based on user preferences.
- `POST /api/users/jobs/{id}/save`: Idempotent action to bookmark a job.
- `PUT /api/applications/{id}`: State transition for the kanban board.

### Security & Patterns
- **Auth:** Stateless JWT. Refresh tokens are stored in the DB (for revoking) while short-lived Access tokens are validated statelessly via `JwtAuthFilter`.
- **Pagination:** Essential for `/jobs`. Spring Data `Pageable` is used to prevent fetching 10k rows into JVM memory.
- **Error Handling:** Likely uses `@ControllerAdvice` to map Java exceptions to standard HTTP 4xx/5xx JSON responses.

---

## 6. Core Processing Logic

### The Data Ingestion Workflow (Node.js)
1. **Trigger:** `node-cron` fires at 03:30 IST.
2. **Scrape:** `adzuna_scrapper_v1.js` hits external APIs, paginating through results.
3. **Clean:** Normalizes dates, drops null titles, deduplicates based on `url` or `(company, title)`.
4. **Load:** `db_sync_state.js` manages batch inserts to Postgres. Updates a cursor to ensure we don't re-process old data.
5. **Failure Point:** External APIs rate-limit or fail.
6. **Recovery:** Handled by the cursor. If the script dies midway, the next run resumes from the last successfully committed cursor.

### The Email Batch Workflow
1. **Trigger:** Fires daily at 19:50 IST.
2. **Fetch Users:** Uses *cursor-based pagination* (`WHERE u.id > $1`) fetching 500 users at a time. This avoids the expensive DB `OFFSET` penalty.
3. **Match Jobs:** Runs a query to find recent jobs matching the user's saved preferences.
4. **Send Emails:** Uses `p-limit` with concurrency of 5. This is critical to avoid blowing up the memory or hitting SMTP provider rate limits.
5. **Log:** Writes to `email_logs` to ensure a job is never sent to the same user twice.

---

## 7. Authentication & Security

- **Flow:** User logs in -> Server verifies hash (Bcrypt) -> Returns JWT (15 mins) & Refresh Token (30 days).
- **Security Mechanisms:**
  - JWTs are cryptographically signed (`io.jsonwebtoken`).
  - Passwords are never logged.
  - Spring Security configuration disables CSRF (since it's a stateless API with Bearer tokens).
- **Vulnerabilities / Weaknesses:**
  - If JWTs are stored in LocalStorage on the React side, they are vulnerable to XSS. A better approach is `HttpOnly` cookies.
  - Rate limiting on `/auth/login` is necessary to prevent brute-force attacks.

---

## 8. Scalability Analysis

**Current State:** 
- Monolith backend, single DB, scheduled scripts. 
- Can easily handle 10k users and 100k jobs.

**What breaks at 10x traffic (100k users)?**
- **Database CPU:** The `findJobsForUser` query run for every single user during the email blast will spike database CPU to 100% because it does complex `ILIKE` matches on un-indexed text columns across thousands of users simultaneously.
- **Scraper memory:** In-memory deduplication arrays in Node.js might exceed the 1.5GB V8 memory limit if parsing too many jobs at once.

**Scaling Roadmap:**
1. **Read Replicas:** Route all `/api/jobs` (read) traffic to a read-replica. Let the scraper write to the primary.
2. **Elasticsearch:** Move job search off Postgres.
3. **Message Queue:** Use SQS or RabbitMQ for the email pipeline. Instead of a Node.js `while` loop, push 100k user IDs to a queue, and let horizontal workers process the emails.

---

## 9. Performance Optimization

**Current Optimizations:**
- **Cursor Pagination in Email Script:** Using `WHERE id > last_id` instead of `OFFSET` is a massive optimization for large datasets.
- **Caffeine Cache:** Spring Boot utilizes Caffeine to cache static data (like available companies) in the JVM heap, saving DB trips.
- **p-limit:** Controls concurrency in Node.js to prevent connection pool exhaustion.

**Missing Optimizations:**
- **N+1 Queries:** In Spring Data JPA, fetching `SavedJob` might lazily fetch the associated `Job` and `User` one by one. Needs `@EntityGraph` or `JOIN FETCH` in the repository.

---

## 10. Reliability & Fault Tolerance

- **Render Pings:** The cron script explicitly pings the Render backend health endpoint `pingRenderServer()`. Render spins down free tiers; this ensures the API is "warm" before users wake up or before scraping requires backend services.
- **db_sync_state:** A dedicated utility tracks the state of the scraper. This acts as a manual *Dead Letter Queue / Checkpoint* system.
- **Single Point of Failure:** The primary database. If Postgres goes down, both the API and the scrapers completely fail.

---

## 11. Concurrency & Distributed Systems Concerns

- **Idempotency in Scraping:** The `INSERT INTO jobs ... ON CONFLICT (url) DO NOTHING` pattern ensures that running the scraper 5 times yields the same database state as running it once.
- **Race Conditions:** Two users applying for the same job is fine. However, two cron jobs running the email pipeline simultaneously would send duplicate emails. This is prevented by having a single monolithic cron worker.

---

## 12. Testing Strategy

- **Backend:** Dependencies include `spring-boot-starter-data-jpa-test` and `spring-boot-starter-webmvc-test`. This implies testing is split into:
  - Repository Tests (H2 in-memory DB or Testcontainers).
  - Controller Tests (`MockMvc` to test HTTP layers without spinning up a server).
- **Gaps:** The Node.js pipelines lack a robust testing framework (like Jest). Web scraping logic is notoriously hard to unit test and requires robust E2E monitoring.

---

## 13. Deployment & DevOps

- **Frontend:** Vercel (CI/CD built-in, Edge CDN).
- **Backend:** Render (Web Service, builds via Maven).
- **Database:** Supabase/Neon DB (Managed Serverless Postgres).
- **Cron Jobs:** Render Cron or GitHub actions running Node scripts.

**Risks:** Distributed deployments mean CORS issues and network latency between the Render backend and the Supabase database if they are in different AWS/GCP regions.

---

## 14. Observability

- Spring Boot Actuator (`spring-boot-starter-actuator`) exposes `/api/public/health`.
- Manual console logging in the Node.js scripts (`console.log("⏰ Running scraping pipelines")`).
- **Blind spots:** No centralized logging (like ELK/Datadog). If an email fails for user ID 502, finding that log in Render's raw text logs a week later is nearly impossible.

---

## 15. Tradeoffs & Design Decisions

**1. Java/Spring Boot vs. Node.js for the API**
- *Why:* Java provides strict type safety, excellent ORM (Hibernate), and structure. Great for complex relational business logic (Auth, Kanban state).
- *Tradeoff:* Higher memory footprint and slower startup times compared to Express.js.

**2. Node.js for Scraping pipeline**
- *Why:* Node's non-blocking I/O and libraries like `cheerio` make it the undisputed king of web scraping and concurrent API fetching.
- *Tradeoff:* Forces a polyglot architecture (Java + JS), meaning a developer needs to know both ecosystems to maintain the full project.

**3. Cron vs Event-Driven Ingestion**
- *Why:* Scraping daily at 3 AM is cheap, easy to reason about, and sufficient for daily job boards.
- *Tradeoff:* Jobs posted at 8 AM aren't visible until the next day. An event-driven web-hook approach (if providers supported it) would be real-time but much harder to implement.

---

## 16. Production Readiness Assessment

- **Strengths:** Excellent architectural separation. Cursor-based pagination and concurrency limits show mature engineering thought. Idempotent DB inserts.
- **Weaknesses:** Lack of comprehensive E2E tests. Reliance on web scrapers which will inevitably break as DOMs change.
- **Verdict:** Highly viable MVP / Portfolio project. To be truly enterprise-ready, it needs a Queue (SQS), Elasticsearch for the feed, and centralized monitoring.

---

## 17. Future Improvements

- **Short-term:** Add Redis for caching the `/jobs` feed to drop DB load instantly.
- **Medium-term:** Move the email pipeline to AWS SQS/Lambda.
- **Enterprise-scale:** Introduce Elasticsearch for lightning-fast, typo-tolerant job searching. Build an abstract scraper framework to handle DOM changes dynamically.

---

## 18. Interview Questions & Answers

**Q: Why did you use Node.js for the scripts but Spring Boot for the backend API?**
**A:** "I chose the right tool for the job. Spring Boot and Hibernate provide incredible safety and structure for relational data, authentication, and complex state management (like the kanban board). However, Node.js is much better suited for high-concurrency I/O tasks and DOM manipulation (via cheerio) needed for scraping. Splitting them allowed me to leverage Java's stability for users and Node's speed for data ingestion."

**Q: How does your email pipeline handle 100,000 users without crashing?**
**A:** "Three ways. First, I use cursor-based pagination (`WHERE id > last_id`) instead of `OFFSET`, which prevents the database from scanning millions of rows. Second, I process them in batches of 500 so I don't blow up the Node heap. Third, I use `p-limit` to strictly cap concurrent SMTP connections to 5, preventing my provider from rate-limiting me."

**Q: What happens if your scraper fails halfway through?**
**A:** "I implemented a `db_sync_state` tracker. It logs a cursor before starting. If the script crashes due to network or rate limits, the next run reads the last successful cursor and resumes exactly where it left off, rather than starting from zero."

**Q: How do you handle job duplicates?**
**A:** "At the database level using `ON CONFLICT (url) DO NOTHING`. Even if the scraper runs twice or overlaps, PostgreSQL guarantees data integrity and prevents duplicate rows from being created."

---

## 19. Personal Contribution Framing

*When asked about the project in an interview, frame it like this:*

"I built TrackHire to solve the 'late-applicant' problem I faced in my own job search. I designed the architecture to handle two completely different workloads: a read-heavy user API and a write-heavy data ingestion pipeline. 
I took ownership of the entire stack. For instance, I identified that a naive email loop would crash my server at scale, so I implemented cursor-based pagination and concurrency limiting to process batches safely. I also designed the database schema to handle kanban-style application tracking alongside a massive deduplicated job feed."

---

## 20. Elevator Pitches

### 1-Minute Summary
"TrackHire is a full-stack platform I built to give job seekers a first-mover advantage. It uses Node.js cron workers to scrape and deduplicate thousands of hidden jobs daily from company pages, bypassing crowded boards like LinkedIn. The user-facing side is a React application powered by a Spring Boot and PostgreSQL backend, allowing users to discover these jobs and track their applications in a personal kanban board."

### 5-Minute Walkthrough
"TrackHire is split into three main components. First is the data ingestion pipeline, built in Node.js. It runs on a cron schedule, pulling data from various APIs and scraping career pages. I handle idempotency at the database level so we never have duplicate jobs. 
Second is the REST API, built with Java and Spring Boot. I chose Java because of its strict typing and robust Spring Security ecosystem, which handles my JWT auth and user state perfectly. 
Finally, there is an asynchronous email microservice that batches 500 users at a time using cursor pagination, matches jobs against their preferences in Postgres, and uses concurrency limiters to blast out digest emails without hitting SMTP rate limits. The frontend is built in React and deployed on Vercel."

### Deep-Dive Walkthrough
*(Focus on the email pipeline or database indexing)*
"Let's dive into the email pipeline. As the user base grows, running a daily digest becomes a massive bottleneck. A standard `SELECT *` with `OFFSET` degrades to O(N) at scale. To solve this, I engineered a cursor-based pagination strategy `SELECT ... WHERE id > last_cursor LIMIT 500`. 
Once I pull a batch of 500 users into Node memory, I iterate through them, querying the database for jobs matching their specific `user_job_preferences`. To prevent exhausting my database connection pool or getting banned by Resend/SendGrid, I wrapped the promise execution in `p-limit` with a concurrency of 5. Finally, successfully sent job IDs are logged to an `email_log` table, so even if the script restarts, the user never gets the same job email twice."