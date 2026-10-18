# Operations & Access Runbook — Testimonial Uploader

> Handover / bus-factor doc. No secret values appear in this file — only names and where values live.
> ⚠️ VERIFY = inferred, confirm it. ❓ NEEDS HUMAN INPUT = not knowable from code.
> Last reviewed: 2026-06-18

## 1. Summary
- What it is / what it powers: Self-service web app where course graduates record a headshot + short video testimonial in the browser. Files upload to a shared Google Drive folder (organized by name/course), Gemini AI auto-transcribes the video, and everything is cataloged in a SQLite DB viewable in a password-protected admin dashboard. Next.js 16 app. See `EXECUTIVE_SUMMARY.md`.
- Live URL(s): https://testimonial-uploader-234446661815.us-central1.run.app (Google Cloud Run)
- Local path: D:\BEPS\TestimonialUploader
- Repo: github.com/briancks/testimonial-uploader (branch master)

## 2. Accounts & ownership
| Service | Role | Identifier (inferred) | Account owner | Who has admin |
|---|---|---|---|---|
| GitHub | source repo | briancks/testimonial-uploader | ⚠️ VERIFY briancks | ❓ |
| Google Cloud | hosting (Cloud Run) | project number 234446661815 (from run.app URL) ⚠️ VERIFY project id | ❓ | ❓ |
| Google Drive | testimonial file storage | folder GOOGLE_DRIVE_FOLDER_ID, shared with a service account | ❓ | ❓ |
| Google Cloud Storage | SQLite backup (Litestream) | bucket GCS_BUCKET_NAME | ❓ | ❓ |
| Google Gemini | video transcription | GEMINI_API_KEY | ❓ | ❓ |
- Billing owner(s): ❓

## 3. Hosting & deployment
- Host / project: Google Cloud Run, region us-central1, project number 234446661815. Container from `Dockerfile` (Node 20-alpine, Next.js standalone, EXPOSE 8080). SQLite DB lives on the container filesystem at `/app/data/testimonials.db`; durability via Litestream continuous replication to GCS (see `litestream.yml`, `entrypoint.sh`).
- Deploy trigger: Manual — `gcloud run deploy` building from Dockerfile (no CI workflow committed; `.claude/settings.local.json` shows gcloud usage). ⚠️ VERIFY.
- Build & watch: `npm run build` = `prisma generate && next build`. Image runs `entrypoint.sh` which restores the DB from GCS via Litestream (if GCS_BUCKET_NAME set), else seeds an empty DB, then `node server.js`. Dev: `npm run dev`.
- Rollback: redeploy a previous Cloud Run revision. Note: rolling back the **container** does not roll back the **database** — the DB is restored from the latest Litestream replica in GCS at startup.

## 4. Domain & DNS
- Domain(s): default `*.run.app`; no custom domain found. ⚠️ VERIFY.
- Registrar + login location: ❓
- DNS managed at: ❓
- Key records: ❓

## 5. Services this project depends on
| Service | Used for | Identifier | Credentials live in |
|---|---|---|---|
| Google Drive API | store headshots + videos | GOOGLE_DRIVE_FOLDER_ID | `.env.local` (GOOGLE_SERVICE_ACCOUNT_KEY) |
| Google Gemini | transcription | — | `.env.local` (GEMINI_API_KEY) |
| Prisma + SQLite | testimonial catalog | DATABASE_URL=file:./data/testimonials.db | local file |
| Litestream → GCS | DB backup/restore | GCS_BUCKET_NAME | Cloud Run runtime SA |

## 6. Credentials map (names only — never values)
| Variable name | Purpose | Where the value lives |
|---|---|---|
| GOOGLE_SERVICE_ACCOUNT_KEY | service-account JSON for Drive uploads | `.env.local`; Cloud Run env / Secret Manager ⚠️ VERIFY |
| GOOGLE_DRIVE_FOLDER_ID | parent Drive folder (not secret) | `.env.local` |
| GEMINI_API_KEY | transcription | `.env.local` |
| ADMIN_PASSWORD | admin dashboard gate | `.env.local` |
| DATABASE_URL | SQLite path | `.env.local` (file:./data/testimonials.db) |
| GCS_BUCKET_NAME | Litestream backup bucket (prod) | Cloud Run env |
- Local env file: `.env.local` — git-ignored? yes (`.env.local` and friends in `.gitignore`; only `.env.example` tracked). `/data/` and `*.db` also git-ignored.
- Production env set at: Cloud Run service env vars / Secret Manager ❓ VERIFY.

## 7. Security findings
- `.env.local:1 — GOOGLE_SERVICE_ACCOUNT_KEY` contains a full GCP **service-account private key** as inline JSON (`{"type":"service_account",...}`) — a high-value live secret. It is git-ignored (not in GitHub) but present in the working copy. → store in Secret Manager and inject as a Cloud Run secret; rotate the key if this machine/repo was ever shared.
- `.env.local:3 — GEMINI_API_KEY` and `.env.local:4 — ADMIN_PASSWORD` are live values in the working copy. → move to Secret Manager / password vault; rotate if exposed.
- All of the above are git-ignored and not tracked (good). ⚠️ VERIFY none were committed earlier in history. A leaked service-account key can read/write the entire Drive folder and any other resources that SA is granted.

## 8. Needs human input (checklist for the owner)
- [ ] Confirm GCP project id (number is 234446661815) + account owner + admins
- [ ] Which Google Drive folder / which service account; who owns the Drive
- [ ] Confirm GCS bucket name for Litestream backups (GCS_BUCKET_NAME)
- [ ] Domain registrar + DNS (if a custom domain is added)
- [ ] Billing owner(s)
- [ ] Password-manager vault that holds the service-account key, GEMINI_API_KEY, ADMIN_PASSWORD
- [ ] Rotate the service-account key and admin password (see Security findings)
- [ ] Anyone else with access

## 9. Notes / gotchas
- The database is a single SQLite file on an ephemeral Cloud Run instance. Durability depends entirely on Litestream + GCS. If GCS_BUCKET_NAME is unset in production, data is LOST on every cold start. Verify the bucket is set and replication is healthy.
- `serverActions.bodySizeLimit` is 500mb (large video uploads). Cloud Run request size limits and timeouts must accommodate this.
- Admin auth is a single shared ADMIN_PASSWORD, not per-user.
- No automated CI; deploys are manual gcloud.
