-- Run once, by hand, against Postgres (schema jobs_tracker_v1).
--
-- ddl-auto=update creates the new table and columns but will NOT add constraints
-- to a table it did not itself just create, so these are not optional.

-- ---------------------------------------------------------------------------
-- 1. One Google account maps to exactly one user.
-- ---------------------------------------------------------------------------
ALTER TABLE jobs_tracker_v1.oauth_accounts
  ADD CONSTRAINT uk_oauth_provider_user UNIQUE (provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_user
  ON jobs_tracker_v1.oauth_accounts (user_id);

-- ---------------------------------------------------------------------------
-- 2. Case-insensitive email uniqueness.
--
-- Emails are matched case-insensitively from here on, so the database has to
-- agree: otherwise two rows differing only by case could both match one Google
-- login and the "link, don't duplicate" rule silently picks whichever the
-- planner returns first.
--
-- STEP 2a — check for existing collisions FIRST:
-- ---------------------------------------------------------------------------
SELECT lower(email) AS normalized, count(*)
  FROM jobs_tracker_v1.users
 WHERE email IS NOT NULL
 GROUP BY lower(email)
HAVING count(*) > 1;

-- STEP 2b — ONLY if the query above returned zero rows.
-- If it returned rows, resolve them by hand. Do not script a merge.
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email_lower
  ON jobs_tracker_v1.users (lower(email))
  WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. OPTIONAL backfill of email_verified.
--
-- Login deliberately does NOT check email_verified: the OTP flow creates rows
-- only after verification, so every row from here on is already verified, and
-- gating login on the flag would lock out every existing user. This backfill is
-- a reporting concern only. Substitute the real deploy timestamp.
-- ---------------------------------------------------------------------------
-- UPDATE jobs_tracker_v1.users
--    SET email_verified = true
--  WHERE email IS NOT NULL
--    AND created_at < '<deploy timestamp>';
