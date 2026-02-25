🧠 1. System Philosophy

You are not “filtering jobs”.

You are:

🎯 Ranking jobs by relevance per user and sending a curated digest.

That mindset shift changes everything.

🏗 2. Final Architecture Overview
[Users + Preferences]
        ↓
[Candidate Job Pool Selection]
        ↓
[Scoring Engine (DB-side)]
        ↓
[Tiered Ranking + Deduplication]
        ↓
[Top N Selection]
        ↓
[Email Template Builder]
        ↓
[Logging + Anti-Duplicate Guard]
🔹 Step 1 — Fetch Users in Batches (You Already Do This Well)

✔ Cursor-based pagination
✔ Concurrency control
✔ Single shared DB pool

No changes needed here.

🔹 Step 2 — Build a Candidate Job Pool (Important)

Before scoring everything in the table, shrink the search space.

Instead of:

Scanning entire jobs table.

Do:

Only consider:

Jobs posted in last 7–10 days

Active jobs only

Matching role type (if selected)

This keeps matching fast and relevant.

🔹 Step 3 — Scoring Engine (Core of System)

This is the brain.

Each job gets a relevance score per user.

Weighted Signals
Signal	Weight	Why
Preferred Company	100	Strong intent
Preferred Title	60	Strong intent
Role Type Match	40	Mandatory alignment
Skill Overlap	10 per match	Supporting signal
Recency Boost	+5 if <48h	Freshness
Score Formula Concept
score =
  (company_match * 100) +
  (title_match * 60) +
  (role_type_match * 40) +
  (skill_overlap_count * 10) +
  recency_bonus

Then:

ORDER BY score DESC, posted_at DESC
LIMIT 20

Then from top 20 → send top 10.

🔹 Step 4 — Tiered Result Bucketing (UX Upgrade)

Instead of sending just 10 jobs randomly ordered:

Segment inside the email:

🥇 Top Picks (Score ≥ 120)

Company + Title match

🥈 Strong Matches (Score ≥ 70)
🥉 Relevant for You (Skill-based)

This feels curated instead of generic.

🔹 Step 5 — Deduplication & Diversity

Avoid:

❌ 7 Amazon SDE Intern roles
❌ Same job reposted
❌ Similar titles from same company

Implementation ideas:

Max 2 jobs per company

Exclude already emailed job IDs

Exclude jobs user clicked before (future enhancement)

🔹 Step 6 — Anti-Duplicate Window

You already log emails.

Final logic should:

Exclude jobs already sent in last 7 days

Prevents repetition fatigue.

🔹 Step 7 — Smart Fallback Strategy

If user preferences are too strict:

Example:
Company: Google only
Role: Intern only

If zero results:

Instead of skipping email:

Fallback tiers:

Remove company constraint

Keep role type

Match by title

Match by skills

Still send something relevant.

🔹 Step 8 — Email Composition Strategy

Instead of:

"10 jobs matching your preferences"

Do:

Subject examples:

🎯 3 Google internships + 5 curated matches

🚀 Fresh Backend Intern roles at Amazon & more

Inside email:

Hi Taral,

Based on your interest in:
• Internship roles
• Backend / SWE
• Companies like Google, Amazon

Here are your top picks this week:

This feels personal.

🔹 Step 9 — Performance at Scale (100K+ Users)

Final optimized version should:

Use SQL scoring (not JS filtering)

Avoid loading large arrays in memory

Use indexed columns:

company

role_type

title

posted_at

Add indexes:

CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_role_type ON jobs(role_type);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
🔹 Step 10 — Future-Level Improvements (Optional But Powerful)

These make TrackHire feel elite:

⭐ A) User Behavior Feedback

Increase score if:

User clicked similar company before

User applied to similar title before

⭐ B) TF-IDF or Vector Similarity

Instead of ILIKE,
store embeddings of job descriptions.

Then:

ORDER BY embedding <-> user_embedding

Now you're at LinkedIn level.

🎯 Final Mental Model

You want:

Generic Filtering ❌
Relevance Ranking ✅
Curated Digest ✅
Freshness Prioritized ✅
Diversity Enforced ✅
No Duplicates ✅
🏁 Final Implementation Summary

Your final production system should:

Fetch user batch

Pull recent active jobs

Score jobs using weighted ranking

Exclude previously sent jobs

Sort by score + recency

Limit + diversify

Send tiered digest

Log sent jobs