# Architecture

## High level

```
┌─────────────────────┐        ┌──────────────────────────────────────────────┐
│  React SPA (5173)   │  /api  │  Express API (5000)                          │
│  Vite + Tailwind    │───────▶│  routes → controllers → services            │
│  Recharts / lucide  │  /uploads│   models (Mongoose) ←→ MongoDB             │
└─────────────────────┘        └──────────┬──────────┬──────────┬─────────────┘
                                          │          │          │
                              integrations │          │          │
                    ┌─────────────────────┐  ┌───────┴──────┐  ┌─────────────┐
                    │ OpenAI (optional)   │  │ Gmail OAuth  │  │ n8n         │
                    │ Resume/match/class  │  │ ingest +     │  │ workflows   │
                    │ (heuristic fallback)│  │ classify     │  │ (webhooks)  │
                    └─────────────────────┘  └──────────────┘  └─────────────┘
```

## Data flow

### Job discovery
1. `POST /api/jobs/discover` (or n8n schedule) pulls jobs from RemoteOK / Arbeitnow / company pages.
2. Each raw job gets a `uniqueHash` (`sha1(company + title + url)`); duplicates are skipped.
3. If a primary resume exists, `matchingEngineService.calculateMatch()` scores raw skills/summary against the job → `matchScore`, `matchedSkills`, `missingSkills`, `matchBreakdown`, `matchReason`.
4. High-scoring jobs create a `Notification` (type `JOB_MATCH`).

### AI matching
- `matchingEngineService` uses the OpenAI-compatible client when `OPENAI_API_KEY` is present, otherwise a local heuristic (skill dictionary + title/location/experience similarity).
- Scores are 0–100 and stored directly on the `Job` document for fast list/analytics queries.

### Gmail ingest
1. `GET /api/gmail/auth` returns the Google OAuth URL (modal read scope).
2. After callback, tokens are stored on the `User` doc; `POST /api/gmail/sync` pulls the latest ~30 messages.
3. `emailClassifierService` categorizes each email (`INTERVIEW, SHORTLIST, REJECTION, …`). High-confidence items are `unlinked`, low-confidence become `needs_review`.
4. `emailMatcherService` tries to link each email to an application by company/role/domain matching.
5. The user can override category and re/link from the UI.

### Resume customization
1. `POST /api/resumes/:id/customize` reads the job, tailors the `parsedProfile` via `resumeCustomizationService` (summary, skills reordering/insertion, achievements).
2. A `ResumeVersion` is stored and a PDF rendered via `resumeVersionService` (PDFKit).
3. Versions remain drafts; setting a version as primary only marks it for your own use.

### Scheduled jobs (backend/src/jobs/cronJobs.js)
- Follow-up reminders (12h): flags follow-ups due today, creates notifications.
- Gmail auto-sync (6h): pulls mail if the account is connected.

## Frontend architecture
- `AuthContext` owns the JWT + user; the axios instance in `services/api.js` injects `Bearer` tokens, unwraps `response.data`, and bounces 401s to `/login`.
- `useFetch` + `useForm` hooks standardize data-loading and form submissions across pages.
- Pages map 1:1 to REST resources; charts reuse Recharts wrappers in `src/charts`.

## Key backend decisions
- **Graceful degradation everywhere**: if OpenAI or Gmail or n8n is down/unconfigured, endpoints return helpful errors or offline fallbacks instead of crashing.
- **`verifySecret` on n8n routes** uses `N8N_WEBHOOK_SECRET` in dev with a known default (production requires the header).
- **Enum discipline**: statuses / employment types / email categories are exact-string enums shared between the UI constants (`frontend/src/utils/constants.js`) and Mongoose schemas.

## Folder map

See the [README](../README.md#project-structure).