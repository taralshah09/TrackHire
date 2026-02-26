# TrackHire — Complete Metadata Pack
### SEO · Open Graph · Twitter Cards · Structured Data · Sitemap Priority

---

## QUICK REFERENCE — BRAND METADATA

```
Product Name:     TrackHire
Domain (assumed): trackhire.app  (swap with your actual domain)
Category:         Productivity / Job Search / Career Tools
Primary Keyword:  job tracker
Locale:           en_US
Theme Color:      #f97316
```

---

## 01 — LANDING PAGE (Home)

### HTML `<head>` — Copy-Paste Ready

```html
<!-- ═══════════════════════════════════════════
     PRIMARY META
═══════════════════════════════════════════ -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>TrackHire — Track Every Job. Miss No Opportunity.</title>

<meta name="description"
  content="TrackHire monitors 500+ company career pages 24/7 and notifies you the moment a matching role goes live. Stop checking manually. Apply first, every time." />

<meta name="keywords"
  content="job tracker, job application tracker, track job applications, job search organizer, career page monitor, job alert app, application pipeline, job hunt tool, job board alternative, job search productivity" />

<meta name="author" content="TrackHire" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#f97316" />
<link rel="canonical" href="https://trackhire.app/" />

<!-- ═══════════════════════════════════════════
     OPEN GRAPH (Facebook, LinkedIn, WhatsApp)
═══════════════════════════════════════════ -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://trackhire.app/" />
<meta property="og:site_name" content="TrackHire" />
<meta property="og:title" content="TrackHire — Track Every Job. Miss No Opportunity." />
<meta property="og:description"
  content="Stop wasting 45 minutes every morning checking career pages. TrackHire watches 500+ companies for you and sends instant alerts when your next role goes live." />
<meta property="og:image" content="https://trackhire.app/og/home.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt"
  content="TrackHire dashboard showing job application pipeline with notifications" />
<meta property="og:locale" content="en_US" />

<!-- ═══════════════════════════════════════════
     TWITTER / X CARD
═══════════════════════════════════════════ -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@trackhire" />
<meta name="twitter:creator" content="@trackhire" />
<meta name="twitter:title" content="TrackHire — Track Every Job. Miss No Opportunity." />
<meta name="twitter:description"
  content="Stop checking career pages manually. TrackHire monitors 500+ companies 24/7 and alerts you the moment a matching role goes live. Apply first, every time." />
<meta name="twitter:image" content="https://trackhire.app/og/home.jpg" />
<meta name="twitter:image:alt"
  content="TrackHire — job tracker and smart alert dashboard" />

<!-- ═══════════════════════════════════════════
     STRUCTURED DATA — WebSite + SoftwareApp
═══════════════════════════════════════════ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://trackhire.app/#website",
      "url": "https://trackhire.app/",
      "name": "TrackHire",
      "description": "Job tracker that monitors 500+ company career pages and sends instant alerts when matching roles go live.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://trackhire.app/jobs?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://trackhire.app/#app",
      "name": "TrackHire",
      "url": "https://trackhire.app/",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "TrackHire is a job search tracker and career page monitor. It watches 500+ company job boards 24/7 and sends instant notifications when roles matching your profile go live.",
      "screenshot": "https://trackhire.app/og/dashboard-preview.jpg",
      "featureList": [
        "Real-time job alerts from 500+ companies",
        "Kanban application pipeline",
        "Application analytics and insights",
        "Deadline reminders",
        "One-click job saving",
        "Match scoring"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "230"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://trackhire.app/#org",
      "name": "TrackHire",
      "url": "https://trackhire.app/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://trackhire.app/brand/logo.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://twitter.com/trackhire",
        "https://linkedin.com/company/trackhire",
        "https://producthunt.com/posts/trackhire"
      ]
    }
  ]
}
</script>

<!-- ═══════════════════════════════════════════
     FAVICONS & APP ICONS
═══════════════════════════════════════════ -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="msapplication-TileColor" content="#080808" />
```

---

## 02 — DASHBOARD PAGE

```html
<title>Dashboard — TrackHire</title>

<meta name="description"
  content="Your personal job search command center. Track applications, monitor interviews, and never miss a deadline — all in one place." />

<meta name="robots" content="noindex, nofollow" />

<meta property="og:title" content="Dashboard — TrackHire" />
<meta property="og:description"
  content="Track your entire job search pipeline in one place. Applications, interviews, offers, and smart alerts — all in your TrackHire dashboard." />
<meta property="og:image" content="https://trackhire.app/og/dashboard.jpg" />

<meta name="twitter:title" content="Dashboard — TrackHire" />
<meta name="twitter:description"
  content="Your job search command center. Applications, pipeline, alerts — all in one place." />
<meta name="twitter:image" content="https://trackhire.app/og/dashboard.jpg" />
```

---

## 03 — BROWSE JOBS PAGE

```html
<title>Browse Jobs — Find Roles at 500+ Companies | TrackHire</title>

<meta name="description"
  content="Search and filter jobs from Google, Stripe, Amazon, Notion, and 500+ top companies in one place. Set alerts and apply before anyone else finds out." />

<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://trackhire.app/jobs" />

<meta property="og:title" content="Browse Jobs at 500+ Companies — TrackHire" />
<meta property="og:description"
  content="All the jobs. One place. Search across 500+ company career pages and get notified the moment a new role matches your profile." />
<meta property="og:image" content="https://trackhire.app/og/jobs.jpg" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Jobs from 500+ Companies",
  "description": "Aggregated job listings from top company career pages, updated in real time.",
  "url": "https://trackhire.app/jobs"
}
</script>
```

---

## 04 — INDIVIDUAL JOB PAGE (Dynamic)

```html
<!-- Replace [variables] dynamically server-side -->

<title>[Job Title] at [Company Name] — TrackHire</title>

<meta name="description"
  content="[Job Title] opening at [Company Name]. [Location] · [Job Type] · [Salary Range]. Track this application on TrackHire and never miss a deadline." />

<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://trackhire.app/jobs/[job-slug]" />

<meta property="og:type" content="article" />
<meta property="og:url" content="https://trackhire.app/jobs/[job-slug]" />
<meta property="og:title" content="[Job Title] at [Company Name]" />
<meta property="og:description"
  content="[Location] · [Job Type] · [Salary Range]. Found on TrackHire — the job tracker that alerts you before anyone else." />
<meta property="og:image" content="https://trackhire.app/og/jobs/[job-slug].jpg" />

<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="[Job Title] at [Company Name]" />
<meta name="twitter:description" content="[Location] · [Job Type] · [Salary Range]" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "[Job Title]",
  "description": "[Full job description text]",
  "datePosted": "[ISO 8601 date, e.g. 2025-01-15]",
  "validThrough": "[ISO 8601 date, e.g. 2025-02-15]",
  "employmentType": "[FULL_TIME | PART_TIME | CONTRACTOR | INTERN]",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "[Company Name]",
    "sameAs": "[Company website URL]",
    "logo": "[Company logo URL]"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "[City]",
      "addressRegion": "[State/Region]",
      "addressCountry": "[Country Code, e.g. US]"
    }
  },
  "jobLocationType": "[TELECOMMUTE if remote]",
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": "[min salary]",
      "maxValue": "[max salary]",
      "unitText": "YEAR"
    }
  },
  "url": "https://trackhire.app/jobs/[job-slug]",
  "identifier": {
    "@type": "PropertyValue",
    "name": "TrackHire",
    "value": "[internal job ID]"
  }
}
</script>
```

---

## 05 — LOGIN PAGE

```html
<title>Sign In — TrackHire</title>

<meta name="description"
  content="Sign in to TrackHire. Your pipeline, applications, and job alerts are waiting." />

<meta name="robots" content="noindex, nofollow" />

<meta property="og:title" content="Sign In — TrackHire" />
<meta property="og:description" content="Welcome back. Your opportunities are waiting." />
<meta property="og:image" content="https://trackhire.app/og/home.jpg" />
```

---

## 06 — SIGN UP PAGE

```html
<title>Create Free Account — TrackHire</title>

<meta name="description"
  content="Start tracking your job search for free. Set up in 3 minutes. TrackHire monitors 500+ companies and alerts you the moment a matching role goes live." />

<meta name="robots" content="noindex, nofollow" />

<meta property="og:title" content="Create Your Free TrackHire Account" />
<meta property="og:description"
  content="Set up in 3 minutes. Free forever. Start applying first — before anyone else knows the role exists." />
<meta property="og:image" content="https://trackhire.app/og/home.jpg" />
```

---

## 07 — PROFILE PAGE

```html
<title>Your Profile — TrackHire</title>

<meta name="description"
  content="Manage your TrackHire profile, skills, job preferences, and resume to unlock smarter job matching and personalized alerts." />

<meta name="robots" content="noindex, nofollow" />
```

---

## 08 — APPLIED JOBS PAGE

```html
<title>Applied Jobs — Your Pipeline | TrackHire</title>

<meta name="description"
  content="Track every job application in your pipeline. View status, add notes, set reminders, and manage your entire job search from one Kanban board." />

<meta name="robots" content="noindex, nofollow" />
```

---

## 09 — SAVED JOBS PAGE

```html
<title>Saved Jobs — TrackHire</title>

<meta name="description"
  content="All the roles you've saved, in one place. Sort by deadline, company, or match score — and never let a good opportunity slip by." />

<meta name="robots" content="noindex, nofollow" />
```

---

## 10 — 404 PAGE

```html
<title>Page Not Found — TrackHire</title>

<meta name="description"
  content="This page doesn't exist — but your next job does. Head back to TrackHire and keep searching." />

<meta name="robots" content="noindex, nofollow" />
```

---

## 11 — SITE WEBMANIFEST (`/site.webmanifest`)

```json
{
  "name": "TrackHire",
  "short_name": "TrackHire",
  "description": "Track every job. Miss no opportunity.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080808",
  "theme_color": "#f97316",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Browse Jobs",
      "short_name": "Browse",
      "description": "Search and filter jobs from 500+ companies",
      "url": "/jobs",
      "icons": [{ "src": "/icons/shortcut-jobs.png", "sizes": "96x96" }]
    },
    {
      "name": "My Pipeline",
      "short_name": "Pipeline",
      "description": "View your application Kanban board",
      "url": "/applied",
      "icons": [{ "src": "/icons/shortcut-pipeline.png", "sizes": "96x96" }]
    },
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Your job search stats and activity",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/shortcut-dashboard.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard-wide.jpg",
      "sizes": "1280x800",
      "type": "image/jpeg",
      "form_factor": "wide",
      "label": "TrackHire Dashboard — Job search command center"
    },
    {
      "src": "/screenshots/dashboard-mobile.jpg",
      "sizes": "390x844",
      "type": "image/jpeg",
      "form_factor": "narrow",
      "label": "TrackHire mobile view"
    }
  ]
}
```

---

## 12 — ROBOTS.TXT (`/robots.txt`)

```txt
User-agent: *
Allow: /
Allow: /jobs
Allow: /jobs/

Disallow: /dashboard
Disallow: /applied
Disallow: /saved
Disallow: /profile
Disallow: /settings
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

Sitemap: https://trackhire.app/sitemap.xml
```

---

## 13 — SITEMAP PRIORITY REFERENCE (`sitemap.xml` guide)

| URL | Priority | Change Freq | Notes |
|---|---|---|---|
| `trackhire.app/` | `1.0` | `daily` | Homepage — highest priority |
| `trackhire.app/jobs` | `0.9` | `hourly` | Jobs index — updates constantly |
| `trackhire.app/jobs/[slug]` | `0.8` | `daily` | Individual job pages |
| `trackhire.app/blog` | `0.7` | `weekly` | Blog index (if applicable) |
| `trackhire.app/blog/[slug]` | `0.6` | `monthly` | Blog posts |
| `trackhire.app/pricing` | `0.8` | `monthly` | Pricing page |
| `trackhire.app/about` | `0.5` | `monthly` | About page |
| `trackhire.app/login` | `0.3` | `monthly` | Auth — low SEO value |
| `trackhire.app/signup` | `0.4` | `monthly` | Auth — low SEO value |

---

## 14 — OG IMAGE SPECS

Every `og:image` should be a pre-rendered static JPG. Sizes and specs:

| Page | File | Dimensions | Format |
|---|---|---|---|
| Home | `/og/home.jpg` | 1200 × 630px | JPG, < 300KB |
| Jobs index | `/og/jobs.jpg` | 1200 × 630px | JPG, < 300KB |
| Dynamic job page | `/og/jobs/[slug].jpg` | 1200 × 630px | JPG, generated via OG image API |
| Blog post | `/og/blog/[slug].jpg` | 1200 × 630px | JPG, generated via OG image API |

**OG image design rules:**
- Background: `#080808` with subtle orange radial glow
- Logo: top-left, white `TrackHire` wordmark
- Headline: Syne 800, white, max 2 lines, center or left-aligned
- Sub-copy: DM Sans 400, `rgba(255,255,255,0.65)`, max 1 line
- Bottom strip: orange `#f97316`, `trackhire.app` in dark text
- Never put stock photos or illustrations in OG images — keep it typographic and dark

---

## 15 — KEYWORD STRATEGY

### Primary Keywords (target in title + H1)
```
job tracker app
track job applications
job application tracker
job search organizer
```

### Secondary Keywords (target in meta description + H2)
```
career page monitor
job alert notifications
job hunt productivity
job search pipeline
application status tracker
job search dashboard
```

### Long-Tail Keywords (target in blog content)
```
how to track job applications
best job tracker app 2025
how to organize your job search
job application spreadsheet alternative
how to never miss a job posting
get notified when jobs go live
how to apply to jobs faster
job search system for professionals
```

### Negative Keywords (avoid — wrong intent)
```
job board (we aggregate, not post)
post a job (employer side, not our audience)
resume builder (not our product)
interview questions (informational, not our tool)
```

---

*TrackHire Metadata Pack · v1.0 · 2025*
*Replace all `trackhire.app` references with your live domain before deploying.*
*Dynamic pages (job slugs, blog posts) should generate metadata server-side using a template.*