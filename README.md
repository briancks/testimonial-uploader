# Testimonial Uploader

## 1. At a glance
| Field | Value |
|---|---|
| **Project name** | Testimonial Uploader (testimonial-uploader) |
| **One-line purpose** | Self-service web app where course graduates record and submit a video testimonial in under 3 minutes; files land in Google Drive and get AI-transcribed. |
| **Status** | Live |
| **Live URL(s)** | https://testimonial-uploader-234446661815.us-central1.run.app |
| **Local path** | `d:\BEPS\TestimonialUploader` |
| **Git remote** | https://github.com/briancks/testimonial-uploader.git (branch `master`) |
| **Primary owner / contact** | Brian (briancks@gmail.com) |
| **Last reviewed** | 2026-06-18 |

## 2. What it is
Testimonial Uploader lets a student visit a public page, enter their name and course, take a headshot photo, record a short video (up to ~2 minutes) in the browser, and submit. Behind the scenes the headshot and video are uploaded to a shared Google Drive folder (organized per student/course), a transcript is generated automatically with Google Gemini, and the submission is cataloged in a database. Staff review everything through a password-protected admin dashboard. It replaces the manual back-and-forth of collecting testimonials by email/file share. It is catalogued in Nexus and posts usage events there.

## 3. Tech stack
- **Language(s):** TypeScript
- **Framework:** Next.js 16.1.6 (App Router, `src/` dir, `output: standalone`), React 19
- **Package manager / runtime:** npm; Node 20 (Alpine in Docker)
- **Key libraries:** Prisma 6 (SQLite), @google/genai (Gemini transcripts), googleapis (Google Drive upload), Tailwind CSS 4
- **Notable patterns / conventions:** SQLite file DB (`prisma/data/testimonials.db`) replicated to Google Cloud Storage with **Litestream** (restore-on-boot, continuous replication) via `entrypoint.sh` + `litestream.yml`. Server Actions body limit raised to 500mb for video. Admin auth via `src/lib/auth.ts` + `src/middleware.ts`. Slack notification on submit (`src/lib/slack.ts`). Nexus telemetry via `src/lib/nexus.ts`.

## 4. Where it lives (hosting & services)
| Service | Used for | Identifier / project name | Account owner |
|---|---|---|---|
| Google Cloud Run | App hosting (Docker) | service `testimonial-uploader` (project id 234446661815), region `us-central1` | Brian (Google Cloud) |
| Google Cloud Storage | Litestream backup of SQLite DB | bucket via `GCS_BUCKET_NAME` | Brian (Google Cloud) |
| Google Drive | Stores headshot + video files | folder via `GOOGLE_DRIVE_FOLDER_ID`; service account | Brian (Google) |
| Google Gemini API | Auto-transcription | via `GEMINI_API_KEY` | Brian (Google) |
| Slack | Submission notifications | webhook/token in `src/lib/slack.ts` | Brian |
| GitHub | Source repo | briancks/testimonial-uploader | Brian |

> Credentials are not stored here. Location of credentials: Unknown / TODO (injected as Cloud Run env vars; `.env.local` holds local copies).

## 5. Environment variables
| Variable name | Purpose | Where the value lives |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service-account JSON for Google Drive uploads | `.env.local`; Cloud Run env |
| `GOOGLE_DRIVE_FOLDER_ID` | Target Drive folder for submissions | `.env.local`; Cloud Run env |
| `GEMINI_API_KEY` | Google Gemini API key for transcripts | `.env.local`; Cloud Run env |
| `ADMIN_PASSWORD` | Password for the admin dashboard | `.env.local`; Cloud Run env |
| `DATABASE_URL` | Prisma SQLite connection (file path) | `.env.local`; Cloud Run env |
| `GCS_BUCKET_NAME` | GCS bucket for Litestream DB replication | `.env.local`; Cloud Run env |

- Local env file: `.env.local` (template in `.env.example`)
- Production env: Google Cloud Run service environment variables

## 6. Run it locally
**Prerequisites:** Node 20+, npm. Prisma client is generated on install/build.
```bash
cd TestimonialUploader
npm install            # runs prisma generate (postinstall)
npm run dev
```
| Task | Command |
|---|---|
| Dev server | `npm run dev` (http://localhost:3000) |
| Production build | `npm run build` (runs `prisma generate` then `next build`) |
| Lint / test | `npm run lint` (no test suite) |

## 7. Deploy it
- **Trigger:** Manual build/deploy of the `Dockerfile` to Cloud Run.
- **Steps:** Build image (entrypoint = `entrypoint.sh`, which restores the SQLite DB from GCS via Litestream, falls back to seed DB, then runs `node server.js`), deploy to Cloud Run with the env vars above.
- **Where to watch the build:** Google Cloud Console -> Cloud Run / Cloud Build logs.
- **Rollback:** Cloud Run -> Revisions -> route traffic to a prior revision (DB persists in GCS via Litestream).

## 8. How to make common edits
| I want to change... | Edit this | Then |
|---|---|---|
| Submission form / recorder UI | `src/components/submission-form.tsx`, `video-recorder.tsx`, `webcam-capture.tsx` | Redeploy |
| Drive upload behavior | `src/lib/google-drive.ts` | Redeploy |
| Transcript generation | `src/lib/gemini.ts` | Redeploy |
| Admin dashboard | `src/app/admin/*`, `src/components/admin/*` | Redeploy |
| Database shape | `prisma/schema.prisma` + new migration | `prisma migrate`, redeploy |
| Tutorial page | `src/app/tutorial/page.tsx` | Redeploy |

No Amazon/affiliate links are rendered by this project; no affiliate disclosure applies.

## 9. Data & content sources
- **Source of content:** User-submitted (name, course, headshot, video). Transcript from Gemini.
- **Schema / shape:** Prisma `Testimonial` model: id (cuid), name, course, headshotDriveId/Url, videoDriveId/Url, transcript, status (`processing|completed|failed`), createdAt. Files stored in Google Drive.
- **How content is updated:** Through the public submission form; status updated as Drive upload + transcription complete.

## 10. Project structure
```
src/app/        # page.tsx (public form), tutorial/, admin/ (+ [id]), api/ (testimonials, admin/login)
src/components/ # submission-form, video-recorder, webcam-capture, admin/*
src/lib/        # auth, gemini, google-drive, prisma, slack, nexus
src/middleware.ts # admin route protection
prisma/         # schema.prisma, migrations/, data/testimonials.db
entrypoint.sh   # Litestream restore + replicate + node server.js
litestream.yml  # GCS replica config
Dockerfile
```

## 11. Integrations & external dependencies
- Google Drive (file storage), Google Gemini (transcription), Google Cloud Storage (Litestream DB backup), Slack (notifications), Nexus (telemetry).

## 12. Known issues, gotchas & TODOs
- DB is a single SQLite file; durability depends entirely on Litestream replication to GCS. If `GCS_BUCKET_NAME` is unset, it runs in local mode with no offsite backup.
- 500mb server-action body limit; very large iPhone videos still risk timeouts/memory pressure on Cloud Run.
- No automated tests.
- `.env.local` contains real values locally; never commit it.
