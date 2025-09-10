## Snap My Date

OCR images/flyers, parse events, and add them to Google Calendar or Microsoft Outlook. Includes ICS generation and OAuth flows. See `AGENTS.md` for a concise catalog of API agents.

### Tech

- Next.js 15 (App Router) + Node runtime for API routes
- NextAuth (credentials provider) with JWT sessions
- Google Cloud Vision for OCR
- Postgres (AWS RDS) for users and OAuth token storage

---

## Quick Start (Local)

1. Install dependencies

```bash
npm install
```

2. Configure environment

Create `.env` with the following (fill values):

```bash
# NextAuth / URLs
NEXTAUTH_SECRET=dev-build-secret
# Optional alternative secret used by auth
AUTH_SECRET=
# Public/base URL (used by OAuth callbacks when behind proxies)
NEXTAUTH_URL=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:3000

# Google OAuth / Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Microsoft OAuth / Graph
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/outlook/callback
OUTLOOK_TENANT_ID=common

# GCP Vision (prefer one of these inline variants)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=
# or
GOOGLE_APPLICATION_CREDENTIALS_JSON=

# Optional LLM fallback for OCR title/schedule
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini

# Postgres (users + token store)
DATABASE_URL=postgresql://appuser:pass@host:5432/snapmydate
# Choose ONE SSL mode for local/dev; remove sslmode from DATABASE_URL if using these
PGSSL_DISABLE_VERIFY=true
# or
PGSSL_CA_BASE64=
```

Tips:

- To create BASE64 creds: `base64 -i service-account.json | tr -d '\n'` and paste into `GOOGLE_APPLICATION_CREDENTIALS_BASE64`.
- If you use `PGSSL_CA_BASE64`, download RDS CA bundle `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem` and base64 the contents.

3. Initialize database (optional, but recommended)

```bash
npm run db:init
```

4. Start dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Core API Endpoints

See `AGENTS.md` for the complete catalog. Common routes below.

### OCR — POST `/api/ocr`

High-confidence OCR with heuristics and optional LLM fallback. Accepts a file upload.

```bash
curl -X POST -F "file=@flyer.jpg" http://localhost:3000/api/ocr
```

Returns fields guess, schedule detection, and normalized game events (when applicable).

### OCR (lightweight) — POST `/api/ingest`

Quick baseline extraction using Vision + chrono.

```bash
curl -X POST -F "file=@flyer.jpg" http://localhost:3000/api/ingest
```

### ICS — GET `/api/ics`

Generate `.ics` invite from query params.

```bash
curl "http://localhost:3000/api/ics?title=Party&start=2025-06-23T19:00:00Z&end=2025-06-23T21:00:00Z&location=Home&timezone=America/Chicago"
```

### Google Event (authenticated) — POST `/api/events/google`

Creates a Google Calendar event using the signed-in user's tokens (NextAuth JWT/DB). If not connected, returns 401/400.

```bash
curl -X POST http://localhost:3000/api/events/google \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Party",
    "start":"2025-06-23T19:00:00.000Z",
    "end":"2025-06-23T21:00:00.000Z",
    "timezone":"America/Chicago",
    "location":"Home",
    "description":"Bring snacks"
  }'
```

Legacy no-session alternative (provide refresh token header):

```bash
curl -X POST http://localhost:3000/api/google/insert \
  -H 'Content-Type: application/json' \
  -H 'x-refresh-token: <GOOGLE_REFRESH_TOKEN>' \
  -d '{"title":"Party","start":"2025-06-23T19:00:00Z","end":"2025-06-23T21:00:00Z","location":"Home","description":"...","timezone":"America/Chicago"}'
```

### Outlook Event (authenticated) — POST `/api/events/outlook`

Creates an Outlook event via Microsoft Graph using stored refresh token.

```bash
curl -X POST http://localhost:3000/api/events/outlook \
  -H 'Content-Type: application/json' \
  -d '{"title":"Party","start":"2025-06-23T19:00:00Z","end":"2025-06-23T21:00:00Z","timezone":"America/Chicago"}'
```

Legacy:

```bash
curl -X POST http://localhost:3000/api/outlook/insert \
  -H 'Content-Type: application/json' \
  -H 'x-refresh-token: <MICROSOFT_REFRESH_TOKEN>' \
  -d '{"title":"Party","start":"2025-06-23T19:00:00Z","end":"2025-06-23T21:00:00Z","location":"Home","description":"...","timezone":"America/Chicago"}'
```

### OAuth

- Google: start `GET /api/google/auth`, callback `GET /api/google/callback`.
  - Optional `?consent=1` to force consent screen.
  - Supports `state` carrying base64-encoded JSON `{ title, description, location, start, end, timezone }` to create immediately and redirect to `/open?url=<link>`.
- Microsoft: start `GET /api/outlook/auth`, callback `GET /api/outlook/callback`.
- Disconnect legacy cookies: `POST /api/oauth/disconnect`.

### Auth (email/password)

- Signup: `POST /api/auth/signup` `{ email, password, firstName?, lastName? }`.
- Forgot: `POST /api/auth/forgot` `{ email }` → `{ ok: true }` (non-prod also returns `{ resetUrl }`).
- Reset: `POST /api/auth/reset` `{ token, newPassword }`.
- Change password: `POST /api/user/change-password` `{ currentPassword, newPassword }` (requires session).

### User + Provider

- Provider status: `GET /api/calendars` → `{ google, microsoft, apple }`.
- Profile: `GET/PUT /api/user/profile` → read/update names, preferred provider, subscription plan.
- Subscription: `GET/PUT /api/user/subscription`.
- History: `GET/POST /api/history`, `GET/PATCH/DELETE /api/history/[id]`.

### Health + Debug

- Health: `GET /api/health` → `{ status: "ok" }`.
- Egress test: `GET /api/net`.
- Debug env: `GET /api/debug` and `GET /api/debug-env`.
- Debug Vision: `GET /api/debug-vision`.
- Debug DB (PG\* vars): `GET /api/debug-db`.
- DB test (DATABASE_URL): `GET /api/db-test`.
- Debug OCR upload: `POST /api/debug-ocr` with `file`.

---

## Environment Reference

See `AGENTS.md` for full details. Highlights:

- NextAuth: `NEXTAUTH_SECRET` or `AUTH_SECRET`, plus `NEXTAUTH_URL`/`PUBLIC_BASE_URL` for external redirects.
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- Microsoft OAuth: `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID`.
- Vision: prefer `GOOGLE_APPLICATION_CREDENTIALS_BASE64` (or `GOOGLE_APPLICATION_CREDENTIALS_JSON`).
- OpenAI (optional): `OPENAI_API_KEY`, `LLM_MODEL`.
- Postgres: `DATABASE_URL` with optional `PGSSL_DISABLE_VERIFY` or `PGSSL_CA_BASE64`.

---

## Notes

- In dev without a signed-in user, legacy cookies (`g_refresh`, `o_refresh`) can enable event creation. When a user is signed in, server routes avoid using legacy cookies to prevent cross-user leakage.
- Routes that require Node.js runtime are annotated and may set `dynamic = "force-dynamic"` and `maxDuration` for long OCR calls.

---

## Links

- API catalog: see `AGENTS.md`.
