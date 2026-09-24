# API Reference

Base URL: `http://localhost:5000/api` (dev). All success responses look like:

```json
{ "success": true, ... }
```

Errors:

```json
{ "success": false, "message": "human readable error" }
```

Protected routes require the header `Authorization: Bearer <jwt>`.

---

## Auth

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | – | `name, email, password, title?, location?` | `{ token, user }` |
| POST | `/auth/login` | – | `email, password` | `{ token, user }` |
| GET | `/auth/me` | ✓ | – | `{ user }` |
| PUT | `/auth/profile` | ✓ | `name?, title?, location?, phone?, preferredRoles[], preferredLocations[], experienceYears?, settings?` | `{ user }` |
| POST | `/auth/forgot-password` | – | `email` | `{ resetToken, resetUrl }` (dev) |
| POST | `/auth/reset-password` | – | `token, password` | `{ success }` |

## Jobs

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/jobs` | ✓ | Query: `status, remote, source, minMatch, role, company, search, page, limit` |
| POST | `/jobs` | ✓ | Create manually. Body includes `companyName, jobTitle, jobUrl, jobDescription, location, remote, employmentType, experienceRequired, minExperienceYears, maxExperienceYears, salary, skills[], source` |
| GET | `/jobs/:id` | ✓ | Full job including `matchBreakdown`, `matchedSkills`, `missingSkills` |
| PUT | `/jobs/:id` | ✓ | Update (e.g. `status: saved/applied/rejected/archived`) |
| DELETE | `/jobs/:id` | ✓ | Remove |
| POST | `/jobs/:id/match` | ✓ | Run AI match against primary resume → `{ match: { overallMatch, skillsMatch, experienceMatch, roleMatch, locationMatch, educationMatch, matchedSkills, missingSkills, whyItMatches } }` |
| GET | `/jobs/recommended` | ✓ | jobs with `matchScore >= 70` |
| POST | `/jobs/discover` | ✓ | Body `{ sources?: ['RemoteOK','Arbeitnow'], resumeId? }`. Creates jobs with dedupe + match. |
| GET | `/jobs/sources` | ✓ | `{ sources }` list |
| POST | `/jobs/scan-companies` | ✓ | Availability-check tracked companies' career pages |

## Applications

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/applications` | ✓ | Query: `status, company, page, limit`; populates `jobId, emails`, `interviews` |
| POST | `/applications` | ✓ | Body: `jobId?` (auto-fills company/role) or `company, role, status, applicationUrl, applicationDate, notes` |
| GET | `/applications/:id` | ✓ | Populates `jobId`, `emails`, `interviews` |
| PUT | `/applications/:id` | ✓ | Update (status change appends to `timeline`) |

## Resumes

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/resumes` | ✓ | multipart field `resume` (pdf/doc/docx). Parses to `parsedProfile`. Sets as primary. |
| GET | `/resumes` | ✓ | List |
| GET | `/resumes/:id` | ✓ | Detail with `parsedProfile` |
| PUT | `/resumes/:id` | ✓ | Body `{ parsedProfile }` |
| DELETE | `/resumes/:id` | ✓ | Remove |
| POST | `/resumes/:id/analyze` | ✓ | AI re-analysis (heuristic fallback) |
| POST | `/resumes/:id/customize` | ✓ | Body `{ jobId, versionName? }` → creates a `ResumeVersion` (PDF generated) |
| GET | `/resumes/:id/versions` | ✓ | List versions for a resume |
| GET | `/resumes/:id/download.pdf` | ✓ | Formatted PDF of the parsed profile |
| GET | `/resumes/versions/:id` | ✓ | Version detail (populates `jobId`) |
| PUT | `/resumes/versions/:id/primary` | ✓ | Set as application resume |
| DELETE | `/resumes/versions/:id` | ✓ | Delete version |
| GET | `/resumes/versions/:id/download.pdf` | ✓ | Version PDF (with `changesMade`) |

## Emails

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/emails` | ✓ | Query: `category, status, sender, company, page, limit` |
| GET | `/emails/:id` | ✓ | Populates `applicationId` |
| GET | `/emails/categories` | ✓ | `{ total, categories }` |
| PUT | `/emails/:id/category` | ✓ | Body `{ category, status? }` |
| POST | `/emails/:id/link` | ✓ | Body `{ applicationId }` or empty to auto-link |
| POST | `/emails/sync` | ✓ | Pull from Gmail (needs connection), classify + link |
| POST | `/emails/relink` | ✓ | Re-run matcher over unlinked emails |
| DELETE | `/emails/delete-all` | ✓ | Clear local email store (Gmail untouched) |

## Interviews

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/interviews` | ✓ | Query `upcoming=true`; populates `applicationId` |
| POST | `/interviews` | ✓ | Body: `applicationId, round, type, scheduledDate, durationMinutes, interviewerName, meetingLink, preparationNotes, status` (sets app status to `Interview Scheduled`) |
| PUT | `/interviews/:id` | ✓ | Update |
| DELETE | `/interviews/:id` | ✓ | Delete |

## Follow-ups

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/followups` | ✓ | Query `status` |
| POST | `/followups` | ✓ | Body: `applicationId?, company?, role?, dueDate, recruiterName?, recruiterEmail?, nextAction, notes?` |
| PUT | `/followups/:id` | ✓ | e.g. `{ status: 'completed', completedDate }` |

## Companies

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/companies` | ✓ | List |
| POST | `/companies` | ✓ | Body: `name, website?, careerPageUrl?, industry?, location?, tags[], notes?` |
| PUT | `/companies/:id` | ✓ | Update |
| DELETE | `/companies/:id` | ✓ | Delete |

## Notifications

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/notifications` | ✓ | Latest 50 + `unread` count |
| PUT | `/notifications/:id/read` | ✓ | Mark one |
| PUT | `/notifications/read-all` | ✓ | Mark all |

## Analytics

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/analytics` | Dashboard stats (`totalJobs, newJobs, matchedJobs, totalApps, inProgress, interviews, shortlisted, offers, rejected, followUpsDue, followUpsDueTomorrow, overdue`) |
| GET | `/analytics/monthly` | Applications per year/month |
| GET | `/analytics/status-distribution` | Counts per application status |
| GET | `/analytics/companies` | Jobs per company with `avgMatch` |
| GET | `/analytics/jobs-by?field=location` | Jobs grouped by `location|company|source|experience` |
| GET | `/analytics/skills` | Top skills in job pool |
| GET | `/analytics/applications` | Rates: `responseRate, interviewConversionRate, offerRate, rejectionRate` + `byMonth` |
| GET | `/analytics/jobs` | Jobs by week, source, location, experience |
| GET | `/analytics/insights` | Strongest skill, missing skills, top companies/roles, performance |
| GET | `/analytics/emails` | Email totals by category |
| GET | `/analytics/followups` | Follow-up totals |

## Gmail

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/gmail/auth` | Returns OAuth `authUrl`; 503 if not configured |
| GET | `/gmail/callback` | OAuth redirect; stores tokens, redirects to `FRONTEND_URL/integrations?gmail=connected` |
| POST | `/gmail/sync` | Pull latest 30 messages, classify + link |
| POST | `/gmail/disconnect` | Clear stored tokens |

## n8n webhooks

All inbound webhooks accept `X-Job-Dashboard-Secret` (equals `N8N_WEBHOOK_SECRET`).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/n8n/health` | Connectivity check |
| POST | `/n8n/jobs` | Array of jobs → dedupe + create + notify |
| POST | `/n8n/emails` | Array of emails → classify + link |
| POST | `/n8n/followups` | Array of follow-ups → create + notify |
| POST | `/n8n/jobs/query` | Body `{ matchScore?, status?, limit?, userId? }` → jobs |
| POST | `/n8n/ai/classify` | Body `{ text, type: 'email'|'job' }` → classification |
| POST | `/n8n/trigger` | Body `{ workflow, payload }` → POSTs to `N8N_BASE_URL/webhook/{workflow}` |