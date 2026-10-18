# Testimonial Uploader

See `README.md` for full project docs (purpose, stack, deploy).

Key conventions:
- Next.js 16 (`src/` dir) on Cloud Run (`testimonial-uploader`, `us-central1`). Data is a Prisma **SQLite** file (`prisma/data/testimonials.db`) replicated to GCS via **Litestream** (`entrypoint.sh` restores on boot). Don't assume a server DB.
- Videos/headshots -> Google Drive; transcripts via Google Gemini (`src/lib/gemini.ts`). Admin is password-gated (`ADMIN_PASSWORD`, `src/middleware.ts`). Slack notify on submit; Nexus telemetry via `src/lib/nexus.ts`.
