## Agents overview

This document describes the app’s server-side agents (API routes) that extract event data, generate ICS, and insert events into Google Calendar and Microsoft Outlook. Keep this file up to date when any agent’s request/response, auth, or env dependencies change.

### What is an agent?

- An agent is any API route under `src/app/api/**` that performs a focused capability (OCR, ICS generation, calendar insertion, OAuth).

---

## Agent catalog

### OCR Agent (high-confidence title) — POST `/api/ocr`

- **Purpose**: OCR event flyers/images, parse title/date/time/location/description with heuristics and LLM fallback.
- **Auth**: None.
- **Input**: `multipart/form-data` with `file` (image or PDF).
- **Output**: JSON with extracted text and best-guess fields. Also detects football multi-game schedules and returns normalized events. Includes a heuristic `category` when detectable.

```bash
curl -X POST \
  -F "file=@flyer.jpg" \
  http://localhost:3000/api/ocr
```

```json
{
  "intakeId": null,
  "ocrText": "...",
  "fieldsGuess": {
    "title": "Alice’s Birthday Party",
    "start": "2025-06-23T14:00:00.000Z",
    "end": null,
    "location": "123 Main St, Chicago, IL",
    "description": "Alice’s Birthday Party...",
    "timezone": "America/Chicago"
  },
  "category": "Birthdays",
  "schedule": {
    "detected": true,
    "homeTeam": "Chicago Tigers",
    "season": "2025",
    "games": [
      {
        "opponent": "Green Bay Packers",
        "homeAway": "home",
        "startISO": "2025-09-07T18:00:00.000Z",
        "endISO": "2025-09-07T21:00:00.000Z",
        "stadium": "Soldier Field",
        "city": null,
        "state": null,
        "sourceLines": ["Sun Sep 7, 1 PM vs Packers", "Soldier Field"]
      }
    ]
  },
  "events": [
    {
      "title": "Home: Chicago Tigers vs Green Bay Packers",
      "start": "2025-09-07T18:00:00.000Z",
      "end": "2025-09-07T21:00:00.000Z",
      "allDay": false,
      "timezone": "America/Chicago",
      "location": "Soldier Field",
      "description": "Home: Chicago Tigers vs Green Bay Packers\nSun Sep 7, 1 PM vs Packers\nSoldier Field",
      "recurrence": null,
      "reminders": [{ "minutes": 30 }]
    }
  ]
}
```

- **Env**:
  - `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64` (preferred inline) or ADC via `GOOGLE_APPLICATION_CREDENTIALS` for Vision.
  - Optional LLM fallback: `OPENAI_API_KEY`, `LLM_MODEL` (default `gpt-4o-mini`).

### OCR Agent (lightweight) — POST `/api/ingest`

- **Purpose**: Simpler OCR and chrono-based parse; quick baseline.
- **Auth**: None.
- **Input**: `multipart/form-data` `file`.
- **Output**: JSON `{ ocrText, event: { title, start, end, location, description, timezone }, schedule, events, category }`.
- **Env**: Same GCP Vision credentials as above. No LLM usage here.

### ICS Agent — GET `/api/ics`

- **Purpose**: Generate an `.ics` file (invitation) from query params.
- **Auth**: None.
- **Input (query)**: `title`, `start` (ISO), `end` (ISO), `location`, `description`, `timezone` (IANA, default `America/Chicago`), optional `recurrence` (RRULE), optional `reminders` (comma-separated minutes).
- **Output**: `text/calendar` (attachment `event.ics`).

```bash
curl "http://localhost:3000/api/ics?title=Party&start=2025-06-23T19:00:00Z&end=2025-06-23T21:00:00Z&location=Home&timezone=America/Chicago"
```

### Google Events Agent (authenticated) — POST `/api/events/google`

- **Purpose**: Create a Google Calendar event from a normalized event payload.
- **Auth**: NextAuth JWT; uses stored provider tokens. Falls back to legacy cookie `g_refresh` and database token store.
- **Input (JSON)**: NormalizedEvent (see schema below); optional `intakeId` ignored server-side.
- **Output**: `{ htmlLink, id }`.
- **Headers**: None required if signed in via NextAuth.
- **Env**: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

### Microsoft Events Agent (authenticated) — POST `/api/events/outlook`

- **Purpose**: Create an Outlook (Microsoft Graph) event from a normalized event payload.
- **Auth**: NextAuth JWT + database-stored Microsoft refresh token; falls back to JWT/cookie in dev.
- **Input (JSON)**: NormalizedEvent; optional `intakeId` ignored.
- **Output**: `{ webLink, id }`.
- **Env**: `NEXTAUTH_SECRET`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_TENANT_ID` (default `common`).

### Google OAuth Agents — GET `/api/google/auth`, GET `/api/google/callback`

- **Purpose**: Start OAuth and capture a Google refresh token.
- **Behavior**:
  - Auth: Redirects to Google. Optional query: `consent=1` forces the Google consent screen.
  - Callback: Exchanges code; if a refresh token is returned, sets `g_refresh` cookie and redirects.
  - Optional `state` support: If `state` contains a base64-encoded JSON payload representing an event `{ title, description, location, start, end, timezone }`, the callback will create the event immediately and then redirect to `/open?url=<eventHtmlLink>`.
- **Env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

### Microsoft OAuth Agents — GET `/api/outlook/auth`, GET `/api/outlook/callback`

- **Purpose**: Start OAuth and capture a Microsoft refresh token.
- **Behavior**: Redirects to Microsoft; callback sets `o_refresh` cookie and redirects to `/`.
- **Scopes**: Requests `offline_access https://graph.microsoft.com/Calendars.ReadWrite`.
- **Env**: `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID` (default `common`).

### Legacy direct insert (no NextAuth session)

- Google — POST `/api/google/insert`
  - **Auth**: `x-refresh-token` header (Google refresh token).
  - **Input**: `{ title, start, end, location, description, timezone }`.
  - **Output**: `{ htmlLink }`.
- Outlook — POST `/api/outlook/insert`
  - **Auth**: `x-refresh-token` header (Microsoft refresh token).
  - **Input**: `{ title, start, end, location, description, timezone }`.
  - **Output**: `{ htmlLink }`.

### Signup — POST `/api/auth/signup`

- **Purpose**: Create a user account in Postgres (AWS RDS) using email/password.
- **Auth**: None.
- **Input (JSON)**: `{ email: string, password: string, firstName?: string, lastName?: string }`.
- **Output**: `{ ok: true }` on success or `{ error }` on failure.
- **Env**: `DATABASE_URL` (Postgres connection string)

### Forgot Password — POST `/api/auth/forgot`

- **Purpose**: Issue a password reset link (token) to the user email.
- **Auth**: None.
- **Input (JSON)**: `{ email: string }`.
- **Output**: `{ ok: true }`. In non-production, also returns `{ resetUrl }` for convenience.
- **Notes**: Always returns 200 to avoid email enumeration leaks.

### Reset Password — POST `/api/auth/reset`

- **Purpose**: Set a new password using a reset token.
- **Auth**: None.
- **Input (JSON)**: `{ token: string, newPassword: string }`.
- **Output**: `{ ok: true }` or `{ error }`.
- **Behavior**: Validates token (unused, unexpired), updates password, marks token as used.

### Provider status — GET `/api/calendars`

- **Purpose**: Returns which providers are connected in the current session.
- **Auth**: Optional (reads NextAuth JWT if available).
- **Detection sources**:
  - NextAuth JWT tokens: `providers.google.refreshToken` (Google requires refresh token), `providers.microsoft.connected|refreshToken`, `providers.apple.connected`.
  - Postgres token store: `oauth_tokens` table lookup by `email` or `user_id`.
  - Legacy OAuth cookies: `g_refresh` (Google), `o_refresh` (Microsoft). These are only considered when no user is signed in (no JWT email) to avoid cross-user leakage on shared browsers.
- **Output**: `{ google: boolean, microsoft: boolean, apple: boolean }`.

### OAuth token debug — GET `/api/debug/oauth-tokens`

- **Purpose**: Introspection of token storage and configuration.
- **Auth**: NextAuth JWT if present (reads user email).
- **Output**: `{ email, jwtProviders: {...}, database: { configured, error, googleStored, microsoftStored } }`.
  - Tokens are read from Postgres when `DATABASE_URL` is set.

### Health — GET `/api/health`

- **Purpose**: Liveness probe.
- **Output**: `{ status: "ok" }`.

---

## NormalizedEvent schema

Payload used by the authenticated calendar agents.

```json
{
  "title": "string",
  "start": "ISO string",
  "end": "ISO string",
  "allDay": false,
  "timezone": "IANA tz e.g. America/Chicago",
  "location": "string",
  "description": "string",
  "recurrence": "RRULE:... | null",
  "reminders": [{ "minutes": 30 }]
}
```

- Google mapping: `dateTime/timeZone` or all-day `date` fields; multiple reminder overrides.
- Microsoft mapping: Graph `subject/body/location/start/end` (UTC), optional `isAllDay`, single `reminderMinutesBeforeStart`.

---

## Environment variables

- **NextAuth**
  - `NEXTAUTH_SECRET`: JWT signing secret.
- **Google OAuth/Calendar**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- **Microsoft OAuth/Graph**
  - `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID` (default `common`).
  - Token refresh requests include scopes: `offline_access https://graph.microsoft.com/Calendars.ReadWrite`.
- **GCP Vision**
  - Prefer inline: `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64`.
  - Or ADC file path: `GOOGLE_APPLICATION_CREDENTIALS`.
- **OpenAI (optional OCR fallback)**
  - `OPENAI_API_KEY`, `LLM_MODEL` (default `gpt-4o-mini`).
- **Postgres (token and user storage)**
  - `DATABASE_URL` e.g. `postgresql://appuser:pass@host:5432/snapmydate`.
  - SSL configuration: do one of the following (not both):
    - Set `PGSSL_DISABLE_VERIFY=true` to skip verification in dev. The app sets `ssl: { rejectUnauthorized: false }`. Remove any `sslmode` params from `DATABASE_URL` to avoid conflicts.
    - Set `PGSSL_CA_BASE64=<base64 of rds-combined-ca-bundle.pem>` to enforce verification. The app sets `ssl: { ca, rejectUnauthorized: true }`. Remove `sslmode` from `DATABASE_URL` when passing SSL via env.
  - To get the latest AWS RDS CA bundle, download `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem` and base64-encode its contents.

---

## Changelog

---

## Conventions and update guidelines

- When you modify any agent’s request/response shape, auth behavior, or env requirements, update the relevant section here.
- Add a concise entry under the changelog including date, agent name, and short description.
- Keep curl examples minimal and correct; prefer showing only required fields.
- Avoid duplicating implementation detail; link to the route path and summarize behavior.

---

## Changelog

- 2025-08-28: Added Forgot/Reset password agents; created `password_resets` table; non-prod returns resetUrl for testing.
- 2025-08-27: Switched token and user storage from Supabase to Postgres (AWS RDS); Signup now writes to Postgres; added DATABASE_URL env.
- 2025-08-27: Documented Google callback state-based event creation; clarified Microsoft OAuth scopes; added Signup endpoint.
- 2025-08-26: Initial creation with OCR, ICS, Google/Outlook agents, OAuth routes, and debug/status endpoints documented.
