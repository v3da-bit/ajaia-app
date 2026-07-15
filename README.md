# Docs — a lightweight collaborative document editor

A small Google-Docs-inspired editor: create/rename/edit rich-text documents,
import `.txt`/`.md` files as new documents, and share documents with other
users. Built as two apps — a NestJS API and a Next.js frontend — talking over
a REST API secured with JWT.

## Stack

- **Frontend**: Next.js 15 (App Router, client-rendered), TypeScript, Tailwind CSS, TipTap (rich text), TanStack React Query
- **Backend**: NestJS, TypeScript, Prisma ORM, Passport JWT, Multer (uploads)
- **Database**: PostgreSQL
- **Testing**: Jest (backend unit tests)

## Seeded accounts

The backend seeds three users on first run, all with password `password123`:

| Name  | Email               |
|-------|----------------------|
| Alice | alice@example.com   |
| Bob   | bob@example.com     |
| Carol | carol@example.com   |

Use these to demo sharing: sign in as Alice, create a document, share it with
`bob@example.com`, then sign in as Bob (in another browser/incognito window)
to see it under **Shared with me**.

## Supported file uploads

Only **`.txt`** and **`.md`** files can be imported. `.txt` files become
paragraphs; `.md` files are parsed as Markdown (headings, lists, bold/italic,
etc.) into the same rich-text format the editor uses. Other extensions are
rejected with a clear error, both in the UI and from the API (`400 Bad Request`).

## Local setup

### 1. Database

You need a Postgres instance reachable from the backend. Easiest path — Docker:

```bash
docker run -d --name ajaia-postgres \
  -e POSTGRES_USER=ajaia -e POSTGRES_PASSWORD=ajaia -e POSTGRES_DB=ajaia \
  -p 5433:5432 postgres:16-alpine
```

(Port `5433` is used above to avoid clashing with a Postgres you might
already have on `5432` — adjust `DATABASE_URL` below to match whatever port
you use.)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # or edit .env directly — see below
npx prisma migrate dev   # creates tables
npx prisma db seed       # creates Alice/Bob/Carol
npm run start:dev        # http://localhost:4000
```

`.env` needs:

```
DATABASE_URL="postgresql://ajaia:ajaia@localhost:5433/ajaia?schema=public"
JWT_SECRET="some-random-string"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### 3. Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev   # http://localhost:3000
```

Open http://localhost:3000/login and sign in as one of the seeded users.

### 4. Run backend tests

```bash
cd backend
npm test
```

Covers: owner-vs-shared access rules (`canAccess`/`canManage`), the
`.txt`/`.md` → HTML import logic (including HTML-escaping of plain text),
and `DocumentsService` enforcing that only the owner can rename a document
while shared users can still edit its content.

## Deployment

This was built to be deployed as three independent, free-tier-friendly pieces:

- **Frontend → Vercel**: point it at `frontend/`, set `NEXT_PUBLIC_API_URL` to
  your deployed backend URL.
- **Backend → Render (or any Node host)**: point it at `backend/`, build
  command `npm install && npx prisma generate && npm run build`, start
  command `npx prisma migrate deploy && node dist/src/main.js`. Set
  `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (your Vercel URL) as env vars.
- **Database → Supabase Postgres** (or Render's managed Postgres): copy the
  connection string into the backend's `DATABASE_URL`.

After the first deploy, run `npx prisma db seed` once (e.g. via Render's
shell) to create the demo accounts.

## What's implemented vs. deprioritized

**Working end-to-end**: auth (JWT, seeded users), create/rename/delete
documents, rich text editing (bold/italic/underline/headings/bulleted &
numbered lists) with autosave, `.txt`/`.md` upload → new document, sharing by
email with an owned/shared distinction on the dashboard, persistence across
refresh and restart.

**Deliberately deprioritized** (see `ARCHITECTURE.md` for why): real-time
co-editing/presence, comments, version history, `.docx` import, granular
view-vs-edit permission levels (a share currently grants edit access),
password reset / real user signup.
