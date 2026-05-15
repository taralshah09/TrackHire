# TrackHire — Platform Feature Reference

> Use this document as context when brainstorming new features, expansions, or tools for the platform.

---

## What TrackHire Is

TrackHire is a job-hunting platform for developers and tech professionals. It aggregates job listings from multiple external sources (public APIs, scrapers, ATS feeds), lets users track their applications end-to-end, and sends personalized weekly email digests based on user preferences. The platform is targeted at early-to-mid career tech professionals seeking full-time roles or internships.

**Target users:** Tech job seekers — interns, junior-to-senior engineers, contractors.  
**Core value prop:** One place to discover jobs, track applications, and get matched listings delivered to your inbox — without manually scouring 10 different job boards.

---

## Current Feature Set

### 1. Authentication & Onboarding

- Email/password registration and login
- Google OAuth login
- JWT-based sessions with access + refresh token rotation
- Multi-step onboarding wizard (4 steps):
  - Preferred job titles
  - Preferred skills
  - Role types (Intern / Junior / Mid / Senior / Lead / Full-time / Part-time / Contract / Freelance)
  - Email notification opt-in

---

### 2. Job Discovery

**Browse Jobs** (`/jobs`)
- Tabbed view: All / Intern / Full-Time with live counts
- Search across: Job Title / Skill / Company, Location, Skills/Keywords, Company Name
- Sort: Newest First, Relevance
- Infinite scroll, 3-column grid layout
- Job cards: title, company, salary range, location, employment type

**Job Detail** (`/jobs/:id`)
- Full description, requirements, company info
- Salary, location, type, experience level, skills list
- External link to original posting
- Save / Apply actions directly on the page
- Application status selector (Applied → Interview → Offer / Rejected / Phone Screen / Withdrawn)

**Startup Launchpad** (`/launchpad`)
- Curated startup job feed separate from the main board
- Filters: Funding Stage (Seed / Series A / B / C+), Team Size, Role Type, Salary Range

**Preferred Jobs** (`/preferred-jobs`)
- Jobs filtered to user's bookmarked companies only
- Shows active company filters as removable chips
- Same search + tab controls as main browse page

---

### 3. Application Tracking

**Applied Jobs** (`/applied-all`)
- Full paginated history of every application (15/page)
- Columns: Job Title, Company, Location, Status, Date Posted, Date Applied
- Sort by any column, ASC/DESC
- Color-coded status badges

**Status Lifecycle**
```
Applied → Phone Screen → Interview → Offer
                                   → Rejected
       → Withdrawn
```

**Saved Jobs** (`/saved-all`)
- Grid of saved-for-later jobs (9/page, infinite scroll)
- Sort: Date Saved, Date Posted, Job Title, Company
- Direct link to apply from saved list

**Dashboard Stats** (`/dashboard`)
- 4 summary cards: Total Applied, Interviews Scheduled, Offers Received, Saved Jobs
- Full status breakdown chart
- Recent activity table (5 latest applications)
- 4 most recently saved jobs

---

### 4. Personalization & Preferences

**Profile** (`/profile`)
- Personal info: name, location, years of experience (slider)
- Work location preference: Remote / Hybrid / Onsite
- Skills tags (add/remove)
- Social links: GitHub, LinkedIn, Website
- Profile completion progress bar

**Email Notification Preferences** (within Profile)
- Toggle weekly digest on/off
- Preferred job titles (tags)
- Skills to match (tags)
- Role types to include

**Preferred Companies** (`/company-preferences`)
- Search and multi-select from 5,000+ companies
- Selected companies shown as chips
- Drives the Preferred Jobs feed

---

### 5. Personalized Email Digest

**Weekly job digest emails** sent automatically to opted-in users.

**Matching engine** (`scripts/email/job_matcher.js`):
- Filters by role type preference and employment type
- Matches job titles with keyword scoring (+10 pts/title keyword)
- Skill overlap scoring (+5 pts/skill keyword)
- Recency boost (+15 pts if posted <24h, +5 pts if <48h)
- Max 2 jobs per company (diversity enforcement)
- 7-day deduplication window (no re-sends)
- Excludes already-applied jobs

**Output tiers:** Top Picks (high relevance) + Recommended (broader fallback)

**Email pipeline** processes users in batches of 100, sends via Cloudflare Worker → Resend API.

---

### 6. Data Pipelines (Backend Automation)

**Job scrapers and loaders** run on a schedule (IST time windows):
- **Adzuna API** — cursor-aware paginator, resumes from last run
- **Public APIs** — additional job board integrations
- **Multi-ATS scraper** — pulls from several ATS platforms simultaneously
- **Job Boards scraper** — targeted scrapers for specific company career pages

**Data flow:** Scrape → write JSON to disk → load/upsert to PostgreSQL  
**Tables written:** `jobs`, `intern_jobs`, `fulltime_jobs`  
**Run tracking:** every pipeline run logged to `db_sync_state` (start, complete, fail, cursor)

---

### 7. Email Gateway (Cloudflare Worker)

Serverless proxy that wraps the Resend API. The Node pipeline never holds the Resend API key.

- `POST /` — single transactional email
- `POST /batch` — batch digest (up to 100 emails per call)
- Auth: `x-api-key` header (`WORKER_SECRET`)
- Provider-agnostic: can swap Resend for any SMTP provider by editing the worker only

---

### 8. Public / Unauthenticated Surfaces

- **Landing Page** (`/`) — hero section with 3D Spline visualization, feature highlights, CTA
- **Platform Stats API** (`/api/public/stats`) — total jobs, users, applications (used on landing page)
- **Featured Jobs API** (`/api/public/jobs/featured`) — 10 jobs shown to logged-out visitors
- **Health endpoint** (`/api/public/health`) — keeps the Render instance warm

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind v4, React Router |
| Backend | Spring Boot 4, Java 21, Hibernate JPA |
| Database | PostgreSQL (Supabase), schema `jobs_tracker_v1` |
| Auth | JWT (access + refresh), Google OAuth |
| Email pipeline | Node.js 20 (CommonJS), `pg` client |
| Email gateway | Cloudflare Workers, Resend API |
| Caching | Caffeine (in-memory, single instance) |
| Job filtering | JPA Criteria API (`JobSpecification`) |
| Deployment | Backend → Render, Frontend → Vercel, Worker → Cloudflare |

---

## Data Model (Key Tables)

| Table | Purpose |
|---|---|
| `users` | Accounts (email, OAuth, password hash) |
| `user_profiles` | Name, location, XP, skills, social links |
| `user_job_preferences` | Email digest settings (titles, skills, role types) |
| `jobs` | Unified legacy job table |
| `intern_jobs` | Internship-specific listings |
| `fulltime_jobs` | Full-time listings |
| `applied_jobs` | Application records with status lifecycle |
| `saved_jobs` | User bookmarks |
| `preferred_companies` | Per-user company bookmark list |
| `email_log` | Dedup log — which jobs were sent to whom and when |
| `refresh_tokens` | Persisted refresh tokens (rotated on use) |
| `db_sync_state` | Pipeline run tracking (start/end/cursor/counts) |

---

## What the Platform Does NOT Currently Do

This section is useful for identifying gaps when brainstorming:

- No resume upload, parsing, or matching
- No interview scheduling or calendar integration
- No job application autofill (Chrome extension, etc.)
- No salary negotiation tools or compensation data
- No recruiter-facing side (platform is job-seeker only)
- No community, forums, or social feed
- No AI-powered cover letter or resume tailoring
- No skills assessment or quiz-based ranking
- No referral network or connection graph
- No mobile app (web-only)
- No job alerts via SMS or push notifications (email only)
- No browser extension for one-click apply from external sites
- No analytics for users (e.g., response rate, application funnel stats)
- No ATS integrations for direct application submission
- No company review data (no Glassdoor-style content)
- No job board for employers to post directly
- No freemium / paid tier differentiation
