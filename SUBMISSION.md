# Submission checklist

## Live demo

- **App**: https://ajaia-app.vercel.app
- **API**: https://ajaia-api.onrender.com
- **Login**: `alice@example.com` / `bob@example.com` / `carol@example.com`, password `password123` for all — use Alice + Bob to see the sharing flow (Alice shares a doc, Bob sees it under "Shared with me")

## Included in this repo

- [x] `backend/` — NestJS API (auth, documents, sharing, upload), Prisma schema + migration, seed script
- [x] `frontend/` — Next.js app (login, dashboard, editor)
- [x] `README.md` — local setup/run instructions, live demo link + credentials, seeded accounts, supported upload types, deployment steps
- [x] `ARCHITECTURE.md` — architecture note: what was prioritized and why, what was cut
- [x] `AI_WORKFLOW.md` — AI tool usage note
- [x] `SUBMISSION.md` — this file
- [x] Automated tests: `backend/src/documents/{access,import,documents.service}*.spec.ts` (12 tests, run via `cd backend && npm test`)
- [x] Input validation (`class-validator` DTOs) and error handling (404/403/400 with clear, user-facing messages) throughout the API
- [x] **Live deployment** — Vercel (frontend) + Render (backend) + Supabase (Postgres), verified working end-to-end including the sharing flow across two accounts

## Not included — needs a human

These can't be produced from an automated environment and are called out
rather than silently skipped:

- [ ] **Walkthrough video (3-5 min)** — needs to be recorded and narrated by
      a person. Suggested flow, matching what's been verified end-to-end:
      log in as Alice → create a document → format text (bold/heading/list)
      → watch autosave → upload a `.md` file → share the original doc with
      Bob → switch to Bob → see it under "Shared with me" with content
      intact → delete a document (shows the confirm dialog + toast).
- [ ] Google Drive folder containing this source, the docs, the live URL,
      and the video URL as a text file — final packaging step.

## What's working

Everything in "Working end-to-end" in `README.md`: auth, document CRUD, rich
text editing (bold/italic/underline/headings/lists — headings and lists are
now visually distinct after fixing a missing Tailwind Typography plugin),
autosave, `.txt`/`.md` upload-to-document, sharing with an owned/shared
distinction, persistence across refresh and server restart, toast
notifications and a confirm dialog on delete. Verified live on the deployed
URLs above, not just locally.

## What's incomplete / next 2-4 hours

- Granular share permissions (view-only vs. edit) — currently a share always
  grants edit access.
- `.docx` upload support.
- A frontend test (component or Playwright) codified from the manual
  browser-scripted passes used during development, so the end-to-end flow is
  guarded by CI, not just one-off manual runs.
- Rate limiting / brute-force protection on `/auth/login`.
