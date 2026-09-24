# n8n Workflows

These workflows integrate **n8n** (https://n8n.io) with the Job Dashboard so job discovery, Gmail sync, resume matching, customization, and follow-up reminders can run on a schedule without you lifting a finger.

## Quick start (this machine, all pre-installed)

n8n **v2.35.7** is installed globally (`C:\Users\dilip\AppData\Roaming\npm`) and all 5 workflows are already imported to `~/.n8n`.

Start n8n:

```bash
cmd /c start "" /min cmd /c "cd /d C:\Users\dilip\OneDrive\Desktop\JOB_DASHBOARD && set N8N_PORT=5678&& set N8N_SECURE_COOKIE=false&& set N8N_PROTOCOL=http&& %APPDATA%\npm\n8n.cmd start > C:\Users\dilip\AppData\Local\Temp\opencode\n8n-server.log 2>&1"
```

Then open `http://localhost:5678` and activate workflows from the **Workflows** list.

## Gmail sync (IMAP App Password)

The `Gmail Sync to Job Dashboard` workflow uses an **IMAP** credential named **Gmail IMAP**.

1. Enable 2-Step Verification on your Google account, then create an App Password at https://myaccount.google.com/apppasswords.
2. In the n8n UI: **Credentials → Add credential → IMAP** (host `imap.gmail.com`, port `993`, SSL enabled) with your Gmail address + the App Password. Name it `Gmail IMAP`.
   - (Alternatively edit `credentials/gmail-imap.json`, fill in `password`, and run `n8n import:credentials --input=n8n/credentials/gmail-imap.json`.)
3. Activate the workflow. Each hour it fetches the INBOX, maps messages to the dashboard payload, and pushes them to `POST /api/n8n/emails` — which auto-classifies and links them (userId is resolved automatically).

## Import (fresh install)

1. Start n8n:
   ```bash
   n8n start
   ```
2. Import all workflows with one command:
   ```bash
   n8n import:workflow --separate --input="C:\Users\dilip\OneDrive\Desktop\JOB_DASHBOARD\n8n\workflows"
   ```
3. For each workflow, add the shared environment variables in n8n **Settings → Variables** (or use the credentials you created):

   | Variable | Value |
   | --- | --- |
   | `JOB_DASHBOARD_WEBHOOK_SECRET` | Must match `N8N_WEBHOOK_SECRET` in `backend/.env` (default `job_dashboard_n8n_secret_token_2026`) |
   | `RESUME_SKILLS` | Comma-separated skills from your primary resume (used by resume-matching) |

4. Set each workflow to **Active** only after you've tested it once (each workflow ships inactive by default).

## Webhooks exposed by the backend

All calls from n8n to the dashboard must include the header `X-Job-Dashboard-Secret` (same value as `N8N_WEBHOOK_SECRET`).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/n8n/health` | Connectivity check |
| GET | `/api/n8n/users` | Resolve the dashboard user (`userId`) for attaching data |
| POST | `/api/n8n/jobs` | Push discovered jobs (deduped via `companyName + jobTitle + jobUrl`) |
| POST | `/api/n8n/emails` | Push synced emails (auto-classified & auto-linked) |
| POST | `/api/n8n/followups` | Create follow-up reminders + notifications |
| POST | `/api/n8n/jobs/query` | Fetch jobs for downstream processing (`matchScore`, `status`, `limit`, `userId`) |
| POST | `/api/n8n/ai/classify` | AI classification helper (email type or job skills extraction) |

Workflow → dashboard calls assume the backend runs at `http://localhost:5000`. Change the HTTP Request node URLs if you run on a different host/port.

## Workflow list

| File | What it does |
| --- | --- |
| `gmail-sync.json` | Every hour, fetches the Gmail INBOX via **IMAP** (credential `Gmail IMAP`), maps messages to the dashboard payload, and pushes them to `/api/n8n/emails` (auto-classified & auto-linked; userId auto-resolved). |
| `job-discovery.json` | Every 6 hours (or via webhook), pulls RemoteOK, maps to the dashboard schema and pushes to `/api/n8n/jobs`. |
| `resume-matching.json` | Webhook-triggered; fetches un-scored jobs via `/api/n8n/jobs/query` and buckets them by ≥70% match using `RESUME_SKILLS`. |
| `resume-customization.json` | Marks high-match jobs for tailored resumes. Final customization happens in the dashboard (Job page → **Generate customized resume**) so results always remain reviewable drafts. |
| `follow-up-reminder.json` | Daily, pushes follow-up reminders to `/api/n8n/followups`. |

## Note on the "no auto-apply" rule

These workflows may **discover** jobs, **match** them, and **remind** you to follow up — they intentionally do **not** submit applications.