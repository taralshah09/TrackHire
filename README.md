<div align="center">

<!-- Replace with your actual logo -->
<img width="600" height="300" alt="image" src="https://github.com/user-attachments/assets/29038379-cc37-455e-bfc0-6f313e039c20" />

Track every opportunity. Miss none.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)
<br>
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

</div>

---

## What is TrackHire?

**TrackHire** is a full-stack job discovery and tracking platform that aggregates opportunities directly from company career pages and exclusive sources — many of which never surface on mainstream platforms like LinkedIn or Indeed.

Users can browse 10,000+ curated, deduplicated job listings, save the ones they care about, and track every application through a personal pipeline. A custom Node.js data pipeline runs on a scheduled cron to scrape, clean, and ingest fresh listings daily, ensuring the feed stays accurate and ahead of the crowd.

### Core Features at a Glance

- 🔍 **Exclusive job feed** aggregated from 500+ company career pages
- ⚡ **Daily cron pipeline** — new listings ingested and deduplicated automatically
- 📌 **Personal tracker** — save jobs and manage your application pipeline
- 🔐 **Secure auth** — JWT-based authentication with refresh token support
- 📊 **Dashboard** — at-a-glance stats on your search activity
- 🔔 **Smart alerts** *(in development)* — email notifications for matched roles

---

## The Problem

Most job seekers spend **45+ minutes daily** checking the same recycled listings across LinkedIn, Indeed, and Glassdoor only to find roles that were posted days ago, already flooded with hundreds of applicants.

The real opportunities live on company career pages. Most never get indexed by mainstream boards. By the time they do, the early application window is gone.

**TrackHire solves this by going directly to the source.** Our pipeline fetches listings from company career pages and exclusive hubs before they reach mainstream boards — giving users a genuine first-mover advantage. A single dashboard replaces ten open tabs and a chaotic spreadsheet.

---

## Key Features

- **Curated, Deduplicated Feed** — Listings sourced from company career pages, cleaned and deduplicated by the Node.js pipeline before hitting the database
- **Advanced Filtering** — Filter by role, company, location, job type, and experience level
- **Save & Organize** — Bookmark jobs and manage them in a personal saved list
- **Application Tracking** — Track the status of every application in a single view
- **Dashboard Analytics** — View saved count, application count, and search activity
- **JWT Authentication** — Stateless, secure auth with access and refresh token rotation
- **Scheduled Data Ingestion** — Cron-based Node.js scripts run daily to keep listings fresh
- **RESTful API** — Clean, versioned Spring Boot API consumed by the React frontend

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                   React + Vite (Vercel)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────────┐
│                        API LAYER                                │
│             Spring Boot — /api/**  (Render)                  │
│         JWT Auth Filter → Controllers → Services                │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
┌──────────────▼──────────┐    ┌──────────────▼───────────────────┐
│      DATA LAYER         │    │         PIPELINE LAYER           │
│  PostgreSQL (Neon DB)   │◄───│  Node.js Cron Scripts (/scripts) │
│  Users · Jobs · Saves   │    │  Scrape → Clean → Deduplicate    │
│  Applications           │    │  → Insert into PostgreSQL        │
└─────────────────────────┘    └──────────────────────────────────┘
```

**Request lifecycle:**

1. React client makes an authenticated request with a Bearer JWT
2. Spring Boot's `JwtAuthFilter` validates the token and sets the `SecurityContext`
3. The relevant `Controller` delegates to a `Service`, which queries the `Repository` (JPA)
4. PostgreSQL returns data; the response is serialized and returned as JSON
5. Independently, Node.js cron scripts scrape and ingest fresh job data into the same PostgreSQL database on a daily schedule

---

## API Endpoints

> Base URL: `https://<your-backend>.onrender.com/api/v1`
> All protected routes require: `Authorization: Bearer <token>`

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register a new user account |
| `POST` | `/auth/login` | Public | Authenticate and receive access + refresh tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for a new access token |
| `POST` | `/auth/logout` | Protected | Invalidate the current session |

### 💼 Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/jobs` | Protected | Fetch all jobs (paginated) |
| `GET` | `/jobs/:id` | Protected | Fetch a single job by ID |
| `GET` | `/jobs/search` | Protected | Search jobs by keyword, company, location |
| `GET` | `/jobs/filter` | Protected | Filter jobs by type, experience level, work style |

### 👤 User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/user/profile` | Protected | Get the authenticated user's profile |
| `PUT` | `/user/profile` | Protected | Update profile details |
| `POST` | `/user/jobs/:jobId/save` | Protected | Save a job to the user's list |
| `DELETE` | `/user/jobs/:jobId/save` | Protected | Remove a job from saved list |
| `GET` | `/user/jobs/saved` | Protected | Retrieve all saved jobs for the user |

### 📋 Applications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/applications` | Protected | Track a new job application |
| `GET` | `/applications` | Protected | Get all applications for the user |
| `PUT` | `/applications/:id` | Protected | Update application status or notes |
| `DELETE` | `/applications/:id` | Protected | Remove a tracked application |

### 📊 Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard/stats` | Protected | Fetch user stats (saved count, applied count, etc.) |
| `GET` | `/dashboard/activity` | Protected | Recent application and save activity feed |

---

## Running Locally

### Prerequisites

- Java 21
- Node.js 18+
- Maven 3.8+
- PostgreSQL 14+

---

### 1. Clone the Repository

```bash
git clone https://github.com/taralshah09/TrackHire.git
cd TrackHire
```

---

### 2. Environment Variables

#### Backend — `backend/src/main/resources/application.properties`

```properties
DB_PASSWORD=
DB_URL=
DB_USERNAME=
FRONTEND_URL=
JWT_SECRET=
PORT=
```

#### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

#### Data Pipeline — `scripts/.env`

```env
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
ADZUNA_BASE_URL=
SKILLHUB_URL=
SKILLHUB_API_KEY=
DB_USER=
DB_PASSWORD=
DB_URL=
DB_PORT=
DB_HOST=
DB_NAME=
DB_SSL=
DB_SCHEMA=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
APP_URL=
RENDER_HEALTH_URL=
```

---

### 3. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The API will be available at `http://localhost:8081`.

---

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`.

---

### 5. Data Pipeline (Optional — for local job ingestion)

```bash
cd scripts
npm install
node index.js
```

> The pipeline scrapes company career pages, deduplicates listings, and inserts them into your local PostgreSQL database.

---

## Deployment

| Layer | Platform | Notes |
|-------|----------|-------|
| **Frontend** | [Vercel](https://vercel.com) | Auto-deploys from `main` branch; set `VITE_API_BASE_URL` in project settings |
| **Backend** | [Render](https://render.com) | Deployed as a Web Service; set all `application.properties` values as environment variables |
| **Database** | [Supabase](https://supabase.com) | Serverless PostgreSQL; free tier sufficient for development |
| **Cron Pipeline** | [Render Cron Jobs](https://render.com/docs/cronjobs) / [GitHub Actions](https://github.com/features/actions) | Scheduled daily via cron expression `0 2 * * *` (runs at 2 AM UTC) |

### Deployment Steps (Frontend)

1. Push to `main` — Vercel picks up the change automatically
2. Ensure `VITE_API_BASE_URL` points to your deployed Render backend URL

### Deployment Steps (Backend)

1. Connect your GitHub repo to Render as a **Web Service**
2. Set build command: `mvn clean package -DskipTests`
3. Set start command: `java -jar target/*.jar`
4. Add all environment variables from `application.properties` in Render's dashboard

---

---

## Contributing

Contributions are welcome and appreciated. To get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes with a clear message
   ```bash
   git commit -m "feat: add email notification support"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch with a clear description of what you changed and why

### Contribution Guidelines

- Follow existing code style — Java code uses standard Spring conventions; frontend uses functional components with hooks
- Write clear, scoped commit messages (prefer [Conventional Commits](https://www.conventionalcommits.org/))
- For major changes, open an issue first to discuss the approach
- Ensure the backend builds clean (`mvn clean install`) before submitting a PR
- Test your changes locally against a real PostgreSQL database

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for full details.
MIT License — Copyright (c) 2026 Taral Shah

---

<div align="center">

Built with intent by [Taral Shah](https://github.com/taralshah09)

[![GitHub](https://img.shields.io/badge/GitHub-taralshah09-181717?style=flat-square&logo=github)](https://github.com/taralshah09)

*If TrackHire helped you — a ⭐ on the repo goes a long way.*

</div>
