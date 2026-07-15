# AI workflow note

## Tool used

Claude Code (Claude, Anthropic), used as the primary and only builder for
this assignment — writing every file, running the terminal, and driving the
browser test at the end. This note is describing how *this specific session*
went, honestly, not a generic AI-workflow pitch.

## Where it materially sped things up

- **Scaffolding + wiring boilerplate**: `create-next-app`, `nest new`,
  Prisma init/migrate, installing and wiring `@nestjs/jwt` + Passport +
  `class-validator` — the kind of setup that's mechanical but easy to get
  subtly wrong (guard registration order, `ValidationPipe` options, CORS)
  went from zero to a booting, authenticated API in a few minutes instead of
  the usual trial-and-error against docs.
- **Parallel-ish execution across a wide surface**: this assignment touches
  auth, a DB schema, file parsing, sharing/access rules, a rich-text editor,
  and two separate deploy targets. Having one agent hold the whole shape of
  the system while writing each piece meant the access-control logic
  (`canAccess`/`canManage`) ended up identical in the backend service and its
  test, instead of the two drifting apart the way they might across a
  multi-day, multi-sitting build.
- **Version-mismatch debugging**: Prisma 7 shipped with a breaking schema
  change (`url` no longer allowed directly in `schema.prisma`) that the
  installed CLI's own error message pointed at a migration guide for. Rather
  than hand-debugging that, I pinned to Prisma 5 — a judgment call about
  which side of "fight the bleeding edge" vs. "use the stable, documented
  path" to land on, which is exactly the kind of call I don't want to
  delegate away even when the tool *could* have pushed through the v7 path.

## What I changed or rejected from the AI's first pass

- **The stack itself.** My first move was a lean single-app Next.js +
  SQLite + mocked-cookie-auth build — I'd built roughly 40% of it (schema,
  access control, dashboard, editor) before a message came in mid-session
  asking to switch to NestJS + Prisma + Postgres + JWT + a three-service
  deploy split. Before doing that, I pushed back explicitly: the assignment
  itself says not to over-engineer and explicitly sanctions SQLite/mocked
  auth for this scope, and three separately-deployed services is a lot more
  for a reviewer to stand up and verify than one. That pushback was
  presented as a real tradeoff (with the time-cost and deploy-complexity
  spelled out), not swallowed — the heavier stack was still built once that
  tradeoff was explicitly chosen, but on the record as a deliberate
  scope-vs-"looks more production" tradeoff, not a default.
- **`marked` v18** was the first choice for Markdown parsing (latest, most
  natural pick) — it turned out to be ESM-only, which broke Jest's CommonJS
  transform. Downgraded to `marked@4` (still actively maintained-enough,
  ships CJS) rather than reconfiguring Jest's transform pipeline for one
  dependency.
- **Rejected**: adding Zustand alongside React Query "because the brief
  mentioned it as an option." The brief said "React Query *or* Zustand" —
  React Query already covers all the server-state needs (documents, shares),
  and the only client state left (the JWT/current user) is small enough for
  a plain `useState` + `localStorage` context. Adding a second state library
  for state that fits in one `useState` would have been unrequested
  complexity, not fidelity to the brief.

## How correctness and UX were verified

Not just "it compiled":

- Backend: `npx tsc --noEmit`, `npm run build`, then the actual compiled
  server was booted and driven with `curl` — real login, real JWT, create a
  document, PATCH its content, share it with a second seeded user, confirm
  that user's `GET /documents` lists it correctly, and confirm an
  unsupported upload extension (`.docx`) is rejected with `400` while `.md`
  is correctly converted (checked the literal HTML output, including that a
  heading got an `id` attribute from the Markdown renderer, which the first
  test assertion had wrongly assumed away — caught and fixed).
- Frontend: `npx tsc --noEmit` and `next build` (catches the App Router's
  server/client component rules, which are easy to violate silently).
- End-to-end: both servers were started together and driven with a
  **scripted real-browser pass** (Playwright + actual Chrome, not a mock) —
  logged in as Alice, created a document, renamed it, typed rich text and
  toggled bold, watched the autosave indicator flip to "Saved," shared it
  with Bob, reloaded the page to confirm the title/content/formatting
  persisted (not just held in React state), then logged in as Bob in a
  separate browser context and confirmed the document appeared under
  "Shared with me" with the shared content intact. This is what actually
  caught that the "Shared with me" section needs a wait for the query to
  resolve before asserting on it in a test — a real timing detail, not
  something a type-checker or a unit test would surface.
- Backend unit tests (`npm test`, 12 passing) target the three spots where a
  silent regression would actually hurt a user: who can access/rename a
  document, that uploaded plain text is HTML-escaped rather than injected
  raw, and that the service layer (not just the pure helper functions)
  enforces those rules.

## Debugging the actual deployment, not just the local build

Passing locally didn't mean passing in production — the live deploy surfaced
four real bugs that local `curl`/browser testing hadn't, each fixed by
reading the actual evidence (deploy logs, network tab, response bodies)
rather than guessing:

- **Supabase's direct connection is IPv6-only**; Render has no IPv6 egress,
  so `prisma migrate deploy` failed with `P1001` on first deploy. Fixed by
  switching to Supabase's session pooler (IPv4-compatible, and unlike the
  transaction pooler, it still supports the prepared statements migrations
  need).
- **Vercel showed a 404 on every route** despite a clean build log — turned
  out Framework Preset had fallen back to "Other" (Root Directory was set
  after the initial import, so auto-detection never re-ran), so Vercel
  wasn't using its Next.js-aware serving layer even though `next build`
  itself succeeded.
- **Delete looked broken but wasn't** — the DELETE endpoint returned `200`
  with an empty body, and the frontend's generic fetch wrapper called
  `res.json()` on it, which throws on empty input. The delete had actually
  succeeded; the error toast was a client-side parsing artifact. Fixed at
  the source (`@HttpCode(204)` on the endpoint, which the client already
  special-cased) rather than papering over it with a try/catch in the
  fetch wrapper.
- **Headings and lists rendered with zero visual distinction** even though
  the toolbar correctly showed them as active — `@tailwindcss/typography`
  was never actually installed, so the `prose` classes on the editor were
  silently inert and Tailwind's base reset (which strips default heading
  size/list bullets on purpose) left them looking like plain paragraphs.
  Confirmed the fix with a scripted browser check reading the *computed*
  font-size and `list-style-type`, not just eyeballing a screenshot.

## What this note is not

Not a claim that every line was hand-verified independently of the AI — for
a 4-6 hour scope, verification focused on the paths a user actually walks
(auth, edit, upload, share, persistence) rather than exhaustively
re-deriving every generated file by hand. The gaps that implies are the same
ones listed under "What I cut" in `ARCHITECTURE.md`.
