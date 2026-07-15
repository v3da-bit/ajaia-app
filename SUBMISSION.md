# Ajaia Full Stack Developer Assignment Submission

## Google Drive Folder
https://drive.google.com/drive/folders/1wHjSejuhHnmXEACgipy62hLAni0HXxl7?usp=drive_link

## Live Application
URL: https://ajaia-app.vercel.app

## Source Code
Repository: https://github.com/v3da-bit/ajaia-app

## Test Credentials

User 1 (owner in the demo sharing flow):
Email: alice@example.com
Password: password123

User 2 (recipient in the demo sharing flow):
Email: bob@example.com
Password: password123

A third seeded account (carol@example.com, same password) also exists for additional testing.

## Completed Features

✅ JWT authentication (seeded demo accounts, no real signup — kept intentionally lightweight per assignment guidance)
✅ Create documents
✅ Rename documents (owner only)
✅ Rich text editing — bold, italic, underline, H1/H2 headings, bulleted & numbered lists
✅ Autosave + reopen (debounced, with a save-state indicator)
✅ File upload — .txt and .md → new editable document (other types rejected with a clear error)
✅ Document sharing by email, with an explicit Owned vs. Shared distinction on the dashboard
✅ Persistent PostgreSQL storage (survives refresh and server restart)
✅ Delete with confirmation dialog + toast notifications for all major actions
✅ **Stretch feature**: export a document as Markdown or PDF (browser print, no extra service)

## Technology Stack

Frontend:
- Next.js (App Router, client-rendered), TypeScript
- Tailwind CSS (+ Typography plugin for editor content)
- TipTap (rich text editor)
- TanStack React Query (server state/mutations)

Backend:
- NestJS, TypeScript
- Prisma ORM
- Passport + JWT (auth), class-validator (input validation)
- Multer (file upload handling)

Database:
- PostgreSQL (Supabase, session pooler connection)

Testing:
- Jest — 12 backend unit tests covering access control, file-import HTML conversion, and service-layer permission enforcement

Deployment:
- Frontend → Vercel
- Backend → Render
- Database → Supabase

## Architecture

Two independently deployed apps: a Next.js frontend and a NestJS API, talking
over a REST API secured with JWT bearer tokens (no shared session/cookie —
the frontend holds no direct database access). Documents are stored in
PostgreSQL via Prisma. Rich text content is persisted as **HTML** (TipTap's
native serialization), not JSON — this was a deliberate choice so uploaded
`.txt`/`.md` files and manually-typed content share one representation
without a conversion step. Sharing is modeled as a `DocumentShare` join
table (`documentId`, `userId`); access control is two pure, unit-tested
functions (`canAccess`, `canManage`) reused across every service method that
touches a document, rather than authorization logic scattered per endpoint.
Full detail and reasoning in `ARCHITECTURE.md`.

## AI Workflow

AI tool used: Claude Code (Anthropic) — used as the primary builder for the
full stack, terminal, and deployment debugging, not just code suggestions.

AI helped with:
- Scaffolding (NestJS/Next.js/Prisma setup) and wiring auth/guards/validation correctly the first time
- Keeping access-control logic consistent between the service layer and its tests
- Diagnosing real production issues from evidence (Supabase IPv6-only connection, Vercel Framework Preset misdetection, a `200`-with-empty-body delete bug, a missing Tailwind Typography plugin) rather than guessing

What was changed or rejected rather than accepted as-is:
- The initial build was a leaner Next.js + SQLite + mocked-auth stack; a
  request to switch to NestJS + Postgres + JWT was pushed back on first
  (flagged the added deploy complexity and time cost) before being built,
  once that tradeoff was made explicit
- `marked` v18 (ESM-only) broke Jest's CommonJS transform — downgraded to
  `marked@4` rather than reconfiguring the test pipeline for one dependency
- Declined to add Zustand alongside React Query "because the brief allowed
  it" — the remaining client state fits in one `useState`, so a second
  state library would have been unrequested complexity

How correctness was verified: `tsc --noEmit` + production builds on both
apps, backend driven with real `curl` requests (login, create, share,
reject bad uploads), and full user flows driven with a scripted real
Chrome browser (not a mock) — login → create → format → autosave → upload
→ share → second-account view → reload-persists → export. Full detail in
`AI_WORKFLOW.md`.

## Tradeoffs

Implemented:
- Core document workflow (create/rename/edit/autosave/reopen)
- Sharing with owned/shared distinction
- File import (.txt/.md)
- Export to Markdown/PDF (stretch)

Deliberately deprioritized (see `ARCHITECTURE.md` for the reasoning behind each):
- Real-time collaboration — would require a CRDT/websocket architecture change, not a small add
- Comments / suggestion mode
- Document version history
- Granular view-vs-edit share permissions (a share currently grants edit access)
- `.docx` upload support

What I'd build next with another 2-4 hours:
- Role-based sharing (view-only vs. edit)
- A frontend test suite, codifying the manual browser-scripted passes used during development
- Rate limiting on `/auth/login`

## Walkthrough Video
[ ADD VIDEO URL HERE before submitting — Loom/YouTube unlisted link ]

## Additional Links

GitHub: https://github.com/v3da-bit/ajaia-app

Documentation included in repository:
- `README.md` — setup, live demo, deployment steps
- `ARCHITECTURE.md` — architecture note
- `AI_WORKFLOW.md` — AI workflow note
- `SUBMISSION.md` — this file
