# Global Country Feature

## New env vars (`scripts/.env`)

```env
# Old (deprecated — keep as fallback or remove)
ADZUNA_BASE_URL=https://api.adzuna.com/v1/api/jobs/in/search

# New
ADZUNA_BASE_URL_TEMPLATE=https://api.adzuna.com/v1/api/jobs/{country}/search
ADZUNA_COUNTRIES=in,us,gb,au,ca,sg
```

- `ADZUNA_BASE_URL_TEMPLATE` — replaces hardcoded `ADZUNA_BASE_URL`. The `{country}` placeholder is filled per-country at runtime. Old `ADZUNA_BASE_URL` still works as a fallback.
- `ADZUNA_COUNTRIES` — comma-separated ISO country codes (lowercase). Scheduler runs one scrape pipeline per country. Defaults to `in` if not set.

Supported codes: `in` India · `us` United States · `gb` United Kingdom · `au` Australia · `ca` Canada · `sg` Singapore · `de` Germany · `fr` France · `nl` Netherlands · `nz` New Zealand

## DB Migration

Run once before deploying:

```bash
node scripts/migrate_country_code.js
```

Adds `country_code VARCHAR(5)` to `jobs`, `intern_jobs`, `fulltime_jobs`. Safe to re-run.

## Files Changed

| File | What changed |
|---|---|
| `scripts/migrate_country_code.js` | **New** — standalone migration script |
| `scripts/setup_db.js` | Added `country_code` migration block |
| `scripts/adzuna/v1/adzuna_scrapper_v1.js` | `run()` accepts `countryCode` param; URL built from template; each job gets `country_code` field |
| `scripts/adzuna/v1/adzuna_load_to_db.js` | Inserts `country_code` column |
| `scripts/skillcareerhub/skillcareerhub_load_to_db.js` | Inserts `null` for `country_code` |
| `scripts/scheduler.js` | Reads `ADZUNA_COUNTRIES`, loops per country, pipeline name = `adzuna_v1_{code}` |
| `Job.java`, `InternJobs.java`, `FulltimeJobs.java` | Added `countryCode` field |
| `JobDTO.java` | Added `countryCode` field, mapped in all `fromEntity()` methods |
| `JobSpecification.java` | Added `countries` as 13th param + predicate |
| `JobService.java`, `InternJobsService.java`, `FulltimeJobsService.java` | `filterJobs()` gained `List<String> countries` param |
| `JobController.java` | Added `countries` query param to `/filter`, `/intern`, `/fulltime` endpoints |
| `JobsPage.jsx`, `PreferredJobsPage.jsx` | Country dropdown filter added |
| `JobCard.jsx` | Shows country code badge next to location |

## End-to-End Flow

```
Railway Scheduler (03:30 IST)
    └── for each country in ADZUNA_COUNTRIES:
            adzuna_scrapper_v1.run(cursorDate, countryCode)
                └── fetches from https://api.adzuna.com/v1/api/jobs/{country}/search
                └── tags each job with country_code
            adzuna_load_to_db.js
                └── upserts into jobs / intern_jobs / fulltime_jobs with country_code

User on Frontend
    └── selects country from dropdown (e.g. "🇺🇸 United States")
    └── GET /api/jobs/filter?countries=us
            └── JobController → filterJobs([...], ["us"], pageable, user)
            └── JobSpecification: WHERE country_code = 'us'
            └── returns JobDTO list with countryCode field
    └── JobCard renders country badge "US" next to location
```
