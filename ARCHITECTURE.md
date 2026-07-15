# Architecture note

## Shape of the system

Two independently deployable apps talking over a REST API:

```
frontend (Next.js, client-rendered)  --JWT bearer-->  backend (NestJS)  --Prisma-->  Postgres
```

- **Frontend** holds no server-side secrets or DB access — every page is a
  client component that calls the backend with `fetch`, using TanStack Query
  for caching/mutations and a JWT stored in `localStorage`.
- **Backend** owns all business logic: auth, access control, document CRUD,
  sharing, file parsing. It's the only thing that talks to Postgres.
- This split exists because the assignment specifically asked for it
  (separately deployable frontend/backend, JWT auth, Prisma/Postgres). Left
  to my own judgment for a 4-6 hour scope, I'd have shipped a single Next.js
  app with API routes, SQLite, and mocked cookie auth instead — less
  infrastructure, same functionality, one deploy target instead of three.

## Data model

Three tables, no ORM magic beyond Prisma's defaults:

- `User` — seeded, has a bcrypt-hashed password for JWT login.
- `Document` — `ownerId` FK to `User`, plus `title`/`content` (content is
  the TipTap editor's HTML output, stored as-is).
- `DocumentShare` — join table (`documentId`, `userId`) granting a
  non-owner access. No permission levels — a share means "can view and
  edit." See "What I cut" below for why.

Access control is two pure functions (`canAccess`, `canManage` in
`documents/access.util.ts`), unit-tested in isolation and reused by every
service method that touches a document. Anyone not the owner and not in
`DocumentShare` gets a `404`, not a `403` — the document's existence isn't
leaked to users who shouldn't see it.

## Why HTML-as-content instead of a structured doc format (JSON/CRDT)

TipTap can serialize either to HTML or to ProseMirror JSON. HTML was chosen
because:

- It's directly renderable and directly re-editable by TipTap — no
  serialize/deserialize step.
- It's what an imported `.md`/`.txt` file naturally converts *into*
  (`marked` outputs HTML), so upload and manual editing share one format.
- It's human-readable in the DB for debugging.

The tradeoff: no operational transform / CRDT structure, so this format
would not survive a move to real-time concurrent editing — that's exactly
why real-time collaboration was cut (see below) rather than half-built on
top of a format that can't support it.

## Autosave, not manual save

The editor autosaves 800ms after the last keystroke (debounced `PATCH
/documents/:id`) rather than requiring an explicit "Save" button. This
matches the Google Docs mental model the assignment is inspired by, and
sidesteps a whole class of "did I lose my edits" bugs a manual save button
invites. The save-state indicator (Saving… / Saved / Couldn't save) is the
only feedback loop; there's no offline queue — a failed save is surfaced,
not silently retried, since silently retrying stale content is riskier than
telling the user something went wrong.

## What I cut, and why

- **View vs. edit permission levels**: a share currently grants full edit
  access. Real Docs-style granular permissions is listed as an explicit
  stretch goal in the brief; building it means a `role` column, checks in
  every mutation, and UI for picking a role per share — real work for a
  distinction the core requirements don't ask for ("a way to grant another
  user access" is satisfied by a binary share).
- **Real-time collaboration**: explicitly out of scope per the brief. It
  also would have forced the content-format decision above in a much more
  expensive direction (Yjs/CRDT instead of plain HTML).
- **`.docx` import**: `.txt`/`.md` cover the "upload a file, get an
  editable document" requirement without pulling in a `.docx`-parsing
  dependency (`mammoth` et al.) for a format that adds parsing edge cases
  (embedded styles, images) disproportionate to the scope.
- **Comments, version history**: both explicit stretch goals, both skipped
  to keep the core flow (create → edit → upload → share) solid rather than
  shallow-covering everything.

## Testing

Backend unit tests cover the three places bugs would actually hurt:
`access.util` (who can see/manage a document), `import.util` (file → HTML,
including that plain text is HTML-escaped, not injected raw), and
`DocumentsService` (that the service layer enforces owner-only rename while
still letting a shared user edit content). No frontend test suite — for
this scope, an end-to-end click-through (login → create → format text →
upload → share → second user sees it → reload persists) was run manually
via a scripted browser pass instead, which is what actually would have
caught a broken flow.
