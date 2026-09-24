# Job Dashboard — AI-Powered Job Search & Application Tracker

A full-stack MERN application that helps you discover jobs, match them against your resume with AI, track applications end-to-end, analyze recruiter emails straight from Gmail, and stay on top of follow-ups and interviews.

**Safety principle:** this tool never auto-submits applications. Every AI-assisted output (job match scores, customized resumes, email summaries) is a **draft you review and act on yourself**.

---

## Features

### Job discovery & inventory
- Discover jobs from public APIs (RemoteOK, Arbeitnow) and your tracked company career pages
- Add jobs manually with full details (salary, skills, location, employment type)
- Duplicate detection with a stable job hash (`company + title + URL`)
- Filter, sort, and search your job pool

### AI resume matching & customization
- Upload a PDF/DOC/DOCX resume → parsed into a structured profile
- Per-job **AI match score** with a component breakdown (skills, experience, role, location, education) plus matched/missing skills
- **Customized resume generation** per job — produced as PDF, stored as a reviewable version, never auto-sent
- Download formatted PDFs of your master and customized resumes

### Application tracking
- Full pipeline: Saved → Applied → Viewed → Recruiter Contacted → Shortlisted → Assessment → Interview → Offer / Rejected
- Timeline of status changes with notes
- Linked interviews and emails per application

### Gmail intelligence (OAuth only)
- Connect Gmail via Google OAuth (read-scope; nothing is ever sent)
- Sync recent mail, auto-classify into categories (interview, shortlist, rejection, offer, recruiter contact…)
- Auto-link emads to matching applications; anything uncertain lands in **Needs Review**
- Per-email category override and manual linking

### Follow-ups & interviews
- Schedule follow-ups with due dates, recruiter contacts, next actions
- Overdue / due-today alerts on the dashboard
- Interview scheduler with rounds, meeting links, and preparation notes

### Analytics & insights
- Pipeline stats: response, interview conversion, offer and rejection rates
- Applications per month, status distribution, top companies/roles/skills
- **Skill gap analysis**: in-demand skills from your job pool that are missing from your resume
- Email and follow-up activity reports

### Automation (n8n)
- Prebuilt n8n workflows for scheduled job discovery, Gmail sync, resume matching, and follow-up reminders (see `n8n/`)

---

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Recharts, lucide-react, react-hot-toast, dayjs |
| Backend | Node.js 22 (ESM), Express 4, Mongoose |
| Database | MongoDB (local by default) |
| AI | OpenAI-compatible LLM client (optional `OPENAI_API_KEY`; graceful heuristic fallbacks) |
| Integrations | Google Gmail API (OAuth), RemoteOK/Arbeitnow APIs, n8n webhooks |

---

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`) or a remote URI

### 1. Backend

```bash
cd backend
npm install
cp ../.env.example .env        # fill in values (Gmail keys optional)
npm run seed                   # loads demo data + demo user
npm run dev                    # http://localhost:5000
```

Demo login:

```
Email:    demo@jobdashboard.local
Password: demo12345
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so no extra config is needed.

### 3. (Optional) n8n automations

```bash
n8n start                       # http://localhost:5678
```

Import workflows from [`n8n/workflows/`](n8n/). See [`n8n/README.md`](n8n/README.md).

---

## Configuration (.env)

| Variable | Notes |
| --- | --- |
| `PORT` | Backend port (default 5000) |
| `FRONTEND_URL` | CORS + password-reset link (default `http://localhost:5173`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRE` | Auth token signing |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Optional AI provider. Without a key the app uses offline heuristics. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Gmail OAuth. Only needed for the Gmail integration. |
| `N8N_BASE_URL` / `N8N_WEBHOOK_SECRET` | n8n communication settings |

---

## Project structure

```
backend/
  src/
    config/        Env & DB setup
    controllers/   Route handlers (auth, jobs, applications, resumes, emails, interviews, follow-ups, analytics, gmail, n8n)
    integrations/  gmail, openai, job sources (RemoteOK/Arbeitnow), company career poller, n8n webhook client
    jobs/          Scheduled jobs (follow-up reminders, gmail auto-sync)
    middleware/    Auth, uploads, rate limiting, error handling
    models/        Mongoose models
    routes/        Express routers
    scripts/       seedData.js (demo seed)
    services/      Resume parsing/customization, matching engine, email classifier/matcher, notifications
    utils/         Duplicate detection, skill dictionary, logger
frontend/
  src/
    charts/        Recharts wrappers
    components/    Common UI, layout (sidebar/topbar), job cards
    context/       Auth provider
    hooks/         useFetch, useForm, useNotifications
    layouts/       Dashboard layout shell
    pages/         All feature pages
    services/      Typed API client (axios)
    utils/         Constants, formatting, form helpers
n8n/
  workflows/       Importable automation workflows
  README.md        n8n setup guide
docs/              Architecture, API and setup documentation
```

---

## API overview

Base URL: `http://localhost:5000/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Jobs | `GET/POST /jobs`, `GET/PUT/DELETE /jobs/:id`, `POST /jobs/:id/match`, `GET /jobs/recommended`, `POST /jobs/discover`, `GET /jobs/sources`, `POST /jobs/scan-companies` |
| Applications | `GET/POST /applications`, `GET/PUT /applications/:id` |
| Resumes | `POST /resumes` (upload), `GET /resumes`, `GET/PUT/DELETE /resumes/:id`, `POST /resumes/:id/analyze`, `POST /resumes/:id/customize`, `GET /resumes/:id/download.pdf`, `GET/PUT/DELETE /resumes/versions/:id`, `GET /resumes/:id/versions` |
| Emails | `GET/POST(w) /emails`, `GET /emails/:id`, `GET /emails/categories`, `PUT /emails/:id/category`, `POST /emails/:id/link`, `POST /emails/sync`, `POST /emails/relink`, `DELETE /emails/delete-all` |
| Interviews | `GET/POST /interviews`, `PUT/DELETE /interviews/:id` |
| Follow-ups | `GET/POST /followups`, `PUT /followups/:id` |
| Companies | `GET/POST /companies`, `PUT/DELETE /companies/:id` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` |
| Analytics | `GET /analytics`, and `/analytics/{monthly,status-distribution,companies,jobs-by,skills,applications,jobs,insights,emails,followups}` |
| Gmail | `GET /gmail/auth`, `GET /gmail/callback`, `POST /gmail/sync`, `POST /gmail/disconnect` |
| n8n | `GET /n8n/health`, `POST /n8n/{jobs,emails,followups,jobs/query,ai/classify,trigger}` |

See [`docs/API.md`](docs/API.md) for details.

---

## Automated jobs

| Job | Schedule | What it does |
| --- | --- | --- |
| Follow-up reminders | every 12h | Flags overdue/due-today follow-ups and creates notifications |
| Gmail auto-sync | every 6h | Pulls new mail if Gmail is connected |

Configure in `backend/src/jobs/cronJobs.js`.

---

## Notes & limits

- **Gmail requires OAuth creds** (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`). The app uses a read-only scope and never sends mail.
- **AI is optional.** With no `OPENAI_API_KEY`, resume parsing and matching fall back to offline heuristics (keyword + skill dictionary based).
- Resumes are analyzed locally by default; AI re-analysis can be triggered per resume.
- Company career-page scanning performs availability checks only (no scraping of private data).# JOB_DASHBOARD
