# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

TrackHire is a polyglot monorepo with four independently-deployed services that share one PostgreSQL database (Neon, schema `jobs_tracker_v1`):

- `backend/` — Spring Boot 4 / Java 21 REST API (deployed to Render). Maven project. All routes mounted under `/api`.
- `frontend/` — React 19 + Vite + Tailwind v4 SPA (deployed to Vercel). Talks to the backend over HTTPS with Bearer JWTs.
- `scripts/` — Node.js 20 (CommonJS) cron entry-point that runs scrapers, DB loaders, and the email pipeline. Deployed as a Render cron job; `scheduler.js` is the single entry.
- `email-gateway/` — Cloudflare Worker (`wrangler.jsonc`) that wraps Resend's API. The Node scripts call this gateway instead of Resend directly so the Resend key never leaves Cloudflare.

The backend and the scripts both write to the same Postgres instance; the frontend never touches the DB directly.

## Common Commands

### Backend (`backend/`)
```bash
mvn spring-boot:run                 # local dev server (port from $PORT, defaults to 10000)
mvn clean install                   # build + run tests
mvn clean package -DskipTests       # production jar (used by Render)
java -jar target/*.jar              # run the packaged jar
mvn test -Dtest=ClassName#method    # run a single test
```
Backend requires env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `FRONTEND_URLS` (comma-separated list used for CORS). `PORT` is optional.

### Frontend (`frontend/`)
```bash
npm run dev       # Vite dev server on :5173
npm run build     # production build into dist/
npm run lint      # ESLint
npm run preview   # serve built assets locally
```
Requires `VITE_API_BASE_URL` in `frontend/.env` (e.g. `http://localhost:10000/api`). No test runner is configured.

### Data pipeline (`scripts/`)
```bash
npm start         # node scheduler.js — the cron entry point
node scheduler.js # same thing
```
`scheduler.js` is **time-window driven, not argument driven**: it computes the current IST hour/minute and only runs pipelines when the clock matches a window (03:30 IST → scrapers, 19:50 IST → emails). To run a specific pipeline locally, require it directly from a one-off script — invoking `scheduler.js` outside its windows just pings Render health URLs and exits.

Individual scrapers/loaders live under `scripts/adzuna/v1/`, `scripts/skillcareerhub/`, `scripts/multi_ats/`, `scripts/public-api/`, `scripts/job-boards/`. Each pipeline directory typically has a `*_scrapper*.js` (writes JSON to disk) paired with a `*_load_to_db.js` (reads the JSON and upserts into Postgres). The email pipeline is in `scripts/email/email_pipeline_batch.js`.

### Email gateway (`email-gateway/`)
Deployed via Wrangler. There is no build step — `src/index.js` is a single Worker. Routes: `POST /` for transactional, `POST /batch` for digests (max 100). Every request must carry `x-api-key: $WORKER_SECRET`.

## Architecture Notes

### Database schema is shared, ownership is not
Two writers touch Postgres: the Spring Boot backend (Hibernate JPA, schema managed by `spring.jpa.hibernate.ddl-auto=update`) and the Node scrapers (raw SQL via `pg`). Hibernate will silently add new columns when entity classes change, but it will **not** drop/rename — and the Node scripts assume specific column names. When changing a JPA entity, check the corresponding loader in `scripts/<source>/` for matching SQL.

Job data is split across multiple tables: `jobs` (unified/legacy, model `Job.java`), `intern_jobs` (`InternJobs.java`), `fulltime_jobs` (`FulltimeJobs.java`). Controllers and services for each are separate (`JobService`, `InternJobsService`, `FulltimeJobsService`). The `JobController` exposes endpoints for all three. New job sources usually write into one of these tables — don't introduce a new table unless schema actually differs.

### Authentication flow
- `WebSecurityConfig` permits `/api/auth/**`, `/api/public/**`, `/actuator/health`; everything else needs a Bearer JWT.
- `AuthTokenFilter` runs before `UsernamePasswordAuthenticationFilter` and populates `SecurityContext`. Use `SecurityUtil.getCurrentUser()` inside controllers/services to get the authenticated `User` — don't re-parse the token.
- Refresh tokens are persisted in `refresh_tokens` (`RefreshToken.java` / `RefreshTokenRepository`) and rotated by `POST /api/auth/refresh`.
- Frontend stores tokens in cookies via `js-cookie`. `frontend/src/service/ApiService.js` is the single API entry point — it transparently refreshes on 401 and redirects to `/login` on refresh failure. Always go through `apiRequest()` rather than calling `fetch` directly from components.
- CORS allowed origins come from the comma-separated `FRONTEND_URLS` env var. Adding a new deploy URL requires updating that variable, not the code.

### Filtering / search
Complex job filtering uses `JobSpecification.filterJobs(...)` (JPA Criteria API) rather than custom JPQL. It accepts lists for keywords/locations/companies/skills/etc. and ORs across keywords while ANDing across fields. Always go through this specification for new filters so the active-only predicate stays consistent.

### Caching
Caffeine in-memory cache is enabled (`spring.cache.type=caffeine`, `CacheConfig.java`). Because the cache is local to a single instance, anything cached will diverge across replicas — Render currently runs one instance, so this is fine, but don't add a second backend replica without moving to a distributed cache.

### Scrapers and the `db_sync_state` table
Every pipeline run is wrapped in `scripts/utils/db_sync_state.js`: `startSync()` → `completeSync(syncId, scraped, inserted, cursor)` or `failSync(syncId, err)`. The `cursor` lets cursor-aware scrapers (Adzuna) resume from where they left off. When adding a new pipeline, copy this pattern so the scheduler can track success/failure consistently.

### Email pipeline performance shape
`email_pipeline_batch.js` paginates users 100 at a time (matching Resend's batch ceiling), builds digest HTML per user via `email_template.js`, and ships the whole batch through the Cloudflare Worker in one HTTP call. The job-to-user match is computed in Postgres by `job_matcher.js`. Don't add per-user `fetch` calls inside the loop — the batching is the whole point.

### Frontend routing
`App.jsx` is the route registry. `ProtectedRoute` wraps pages that need auth; `GuestRoute` redirects logged-in users away from `/login`. `/` renders `NewLandingPage` (the old `LandingPage.jsx` still exists but is unrouted). When adding a new authenticated page, wrap it in `ProtectedRoute` and add the route there.

## Things to know before editing

- **`spring.jpa.hibernate.ddl-auto=update`** is enabled in `application.properties`. This is convenient for dev but means renaming a JPA field in prod silently leaves the old column behind. For destructive schema changes, write a migration manually against the Neon DB and then update the entity.
- **`spring.jpa.show-sql=true`** is on — backend logs are noisy. Don't add another logger for SQL.
- **No backend test suite**: only the auto-generated `JobTrackerBackendApplicationTests.java` exists. Don't claim "tests pass" as verification of a backend change unless you actually wrote one.
- **Render free tier sleeps**: the scheduler pings `/api/public/health` to keep the backend warm. If you remove that ping, expect cold-start latency on the first morning request.
- **Two job entities, one logical concept**: `intern_jobs` and `fulltime_jobs` are recent additions alongside the older unified `jobs` table. Be explicit about which one a new feature targets.
- **Don't put secrets in `application.properties`** — every secret is interpolated from env (`${...}`). Render dashboard holds the real values.

---

## Spec-Driven Pipeline

This project uses a spec-driven development pipeline. All subagents and coding decisions trace back to a written spec.

### Architecture decisions

- TODO: document key architectural decisions as they are made
- TODO: record why one approach was chosen over alternatives

### Naming conventions

- TODO: fill in language-specific naming rules (e.g. camelCase for JS, PascalCase for Java classes)
- TODO: file naming conventions per service (`*_scrapper.js`, `*Service.java`, etc.)

### Hard rules

- **Never modify SPEC.md during a coding cycle** — only `/doc-sync` may append to it.
- **Never mark a task done unless the exit gate has passed** — all four checks in the orchestrator must be green.
- **All inter-agent communication goes through `agent-state/status.json`** — do not pass state through conversation context.
- **If a subagent's output conflicts with SPEC.md, stop and flag it; do not proceed.**

### Tech stack

- TODO: fill in after first spec cycle completes

### Coverage threshold

Default: **80%**. Override per-feature in the `## Non-functional requirements` section of each spec.

## Local Agents

The following local agents are registered in `.gemini/agents/`:

- **quality-gate** — Reviews git diffs against specs for quality, security, and documentation.
- **senior-fullstack** — Handles full context feature implementation (plan, implement, test) in a single turn.

To reload agents after modification, run `/agents reload` in the terminal.
