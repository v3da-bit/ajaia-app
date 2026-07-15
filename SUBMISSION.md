# Submission checklist

## Included in this repo

- [x] `backend/` — NestJS API (auth, documents, sharing, upload), Prisma schema + migration, seed script
- [x] `frontend/` — Next.js app (login, dashboard, editor)
- [x] `README.md` — local setup/run instructions, seeded accounts, supported upload types, deployment notes
- [x] `ARCHITECTURE.md` — architecture note: what was prioritized and why, what was cut
- [x] `AI_WORKFLOW.md` — AI tool usage note
- [x] `SUBMISSION.md` — this file
- [x] Automated tests: `backend/src/documents/{access,import,documents.service}*.spec.ts` (12 tests, run via `cd backend && npm test`)
- [x] Input validation (`class-validator` DTOs) and error handling (404/403/400 with clear messages) throughout the API

## Not included yet — to be added by whoever deploys this

These require accounts/actions outside this environment (hosting logins,
screen recording) and were called out explicitly before building, rather
than silently skipped:

- [ ] **Live deployment URL** — repo is deploy-ready (see `README.md` →
      Deployment) for Vercel (frontend) + Render or similar (backend) +
      Supabase/managed Postgres (database), but has not been deployed from
      this environment.
- [ ] **Walkthrough video (3-5 min)** — not recorded here (no
      screen/audio capture available in this environment). Suggested flow
      to record, matching what was already verified end-to-end via a
      scripted browser pass during development: login as Alice → create a
      document → format text (bold/heading/list) → watch autosave → upload
      a `.md` file → share the original doc with Bob → switch to Bob → see
      it under "Shared with me" with content intact.
- [ ] Google Drive folder link, live URL, and video URL text file — packaging step for final submission.

## What's working

Everything in the "Working end-to-end" list in `README.md`: auth, document
CRUD, rich-text editing with autosave, `.txt`/`.md` upload-to-document,
sharing with an owned/shared distinction, persistence across refresh and
server restart (verified by killing and restarting both servers mid-session).

## What's incomplete / next 2-4 hours

- Granular share permissions (view-only vs. edit) — currently a share always
  grants edit access.
- `.docx` upload support.
- A frontend test (component or Playwright) codified from the manual
  browser-scripted pass used during development, so the end-to-end flow is
  guarded by CI, not just a one-time manual run.
- Rate limiting / brute-force protection on `/auth/login`.
