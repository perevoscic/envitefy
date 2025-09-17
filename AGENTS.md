## Agents overview

This document describes the app’s server-side agents (API routes) that extract event data, generate ICS, and insert events into Google Calendar and Microsoft Outlook. Keep this file up to date when any agent’s request/response, auth, or env dependencies change.

### What is an agent?

- An agent is any API route under `src/app/api/**` that performs a focused capability (OCR, ICS generation, calendar insertion, OAuth).

---

## Agent catalog

### Promo Gift Agent — POST `/api/promo/gift`

- **Purpose**: Initiate a Stripe Checkout session for gifting subscriptions. The promo code is created and emailed only after payment succeeds (via webhook). UI now redirects the purchaser to Stripe.
- **Auth**: Optional (reads NextAuth session to prefill purchaser email/name).
- **Input (JSON)**: `{ quantity: number, period: "months"|"years", recipientName?: string, recipientEmail?: string, message: string, senderFirstName?: string, senderLastName?: string, senderEmail?: string }`. Non-authenticated purchasers must supply the sender fields.
- **Pricing**: Server computes cents using Stripe plan pricing (defaults: $2.99/month, $29.99/year). `quantity` multiplies the unit amount.
- **Output**: `{ ok: true, orderId, sessionId, checkoutUrl, amountCents, currency }`. Clients must redirect the browser to `checkoutUrl` to complete payment.
- **Fulfillment**: Webhook `payment_intent.succeeded` issues the promo code, attaches it to the `gift_orders` row (including the purchaser's user id when known for downstream linking). If the recipient email already belongs to a Snap My Date user, the gifted months are automatically added to their subscription and the promo code is marked redeemed; otherwise the recipient receives the code to redeem manually. Refunds revoke the code.
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `APP_URL`, plus `DATABASE_URL`, `SES_FROM_EMAIL_GIFT`, and AWS credentials/region for SES (`AWS_REGION` or `AWS_DEFAULT_REGION`, and standard AWS credentials). Gift emails still send from `SES_FROM_EMAIL_GIFT`; purchaser email is used for Reply-To when provided.

### Promo Redeem Agent — POST `/api/promo/redeem`

- **Purpose**: Redeem a promo code and extend the signed-in user's subscription expiration.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ code: string }`.
- **Behavior**: Validates code (exists, not expired/redeemed). Converts gift to months using `quantity+period` or amount fallback, extends `users.subscription_expires_at`, and marks code redeemed by the user's email.
- **Output**: `{ ok: true, months }` or `{ error }`.
- **Revocation**: Codes flagged as refunded (`revoked_at` set) return `{ error: "Code is no longer valid" }`.

### Stripe Checkout Agent — POST `/api/billing/stripe/checkout`

- **Purpose**: Create a Stripe Checkout session for upgrading to the paid monthly or yearly plan.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ plan: "monthly" | "yearly" }`.
- **Behavior**: Ensures the user has a Stripe customer record, provisions or reuses the price (lookup keys `snap-my-date-monthly` / `snap-my-date-yearly`), and returns the hosted checkout URL. Active subscriptions short-circuit with HTTP 409.
- **Output**: `{ ok: true, sessionId, url }`.
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `APP_URL`.

### Stripe Billing Portal — POST `/api/billing/stripe/portal`

- **Purpose**: Generate a Stripe Billing Portal session so users can update payment methods or cancel directly with Stripe.
- **Auth**: NextAuth session required and `stripe_customer_id` must exist.
- **Input**: none.
- **Output**: `{ ok: true, url }`.
- **Env**: Same as checkout (Stripe keys + `APP_URL`).

### Stripe Checkout Sync — POST `/api/billing/stripe/sync`

- **Purpose**: After returning from Stripe Checkout, force-refresh the signed-in user's subscription state using the Checkout Session ID.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ sessionId: string }` (`session_id` alias accepted).
- **Behavior**: Loads the Checkout Session, expands the subscription + invoice, and runs the same sync logic as webhooks (including plan detection fallbacks). Useful when the browser lands back on `/subscription` before Stripe webhooks finish.
- **Output**: `{ ok: true, updated: boolean }` (`updated` indicates whether a matching user row was found and refreshed).
- **Env**: Same as checkout (Stripe keys + `APP_URL`).

### Stripe Webhook — POST `/api/stripe/webhook`

- **Purpose**: Receive Stripe events (`checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`).
- **Behavior**: Stores each event in `stripe_webhook_events` for idempotency, syncs user subscription state, fulfills gift orders (creates promo codes + sends emails), and revokes gifts on refund. Gift fulfillment now emits structured logs (prefixed `[stripe webhook]`/`[email]`) to trace whether SES accepted each dispatch, persists the sender’s `created_by_user_id` on `promo_codes`, and auto-applies gifts when the recipient email matches an existing user (extending their subscription immediately and marking the promo code redeemed). Subscription upgrades or downgrades now sync immediately via `customer.subscription.updated`, and plan detection falls back to the Stripe price interval so yearly upgrades still apply even when lookup keys are missing. The new `/api/billing/stripe/sync` endpoint shares the same sync routine so the `/subscription` page can refresh immediately after Checkout.
- **Env**: `STRIPE_WEBHOOK_SECRET` (plus Stripe secret). Route expects raw body (`req.text()`); ensure webhook endpoint in Stripe Dashboard uses the same secret.

### OCR Agent (high-confidence title) — POST `/api/ocr`

- **Purpose**: OCR event flyers/images, parse title/date/time/location/description with heuristics and LLM fallback (optimized for invitations and appointments).
- **Auth**: None.
- **Input**: `multipart/form-data` with `file` (image or PDF).
- **Query options**:
  - `llm=1` or `engine=openai` forces OpenAI image parsing in addition to Google Vision OCR text, useful when Vision misses spelled-out times.
- **Output**: JSON with extracted text and best-guess fields. Includes a heuristic `category` when detectable.
- **Gymnastics schedules**: Detects season schedule flyers (e.g., "2026 Gymnastics Schedule"). Returns an `events` array of all-day meets with `title` like `NIU Gymnastics: vs Central Michigan` or `NIU Gymnastics: at Illinois State`. Home meets use the flyer address; away meets attempt venue lookup via OpenStreetMap.

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
    "detected": false,
    "homeTeam": null,
    "season": null,
    "games": []
  },
  "events": []
}
```

- **Env**:
  - `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64` (preferred inline) or ADC via `GOOGLE_APPLICATION_CREDENTIALS` for Vision.
  - Optional LLM fallback: `OPENAI_API_KEY`, `LLM_MODEL` (default `gpt-4o-mini`).

#### Notes

- Time parsing improved to detect spelled-out phrases like "four o'clock in the afternoon" and merge with detected dates; afternoon/evening keywords bias to PM.
- LLM prompt now prioritizes decorative/cursive text (names) on invitation cards and ignores boilerplate like "Invitation"/"Invitation Card" when forming titles. It also classifies wedding/marriage invites and can surface an LLM-provided `category` when present.
- Wedding rewrite prompt now forbids templated phrases (e.g., "together with their parents", "Dinner and dancing to follow") unless they appear verbatim on the card. It uses only facts present on the invite.
- Basic timezone inference from U.S. addresses (e.g., "Fresno, CA" → `America/Los_Angeles`). If no hint is found, falls back to the server timezone.

### OCR Agent (lightweight) — POST `/api/ingest`

- **Purpose**: Simpler OCR and chrono-based parse; quick baseline.
- **Auth**: None.
- **Input**: `multipart/form-data` `file`.
- **Output**: JSON `{ ocrText, event: { title, start, end, location, description, timezone }, schedule, events, category }` (schedule/events are empty; football schedule detection removed).
- **Env**: Same GCP Vision credentials as above. No LLM usage here.

### ICS Agent — GET `/api/ics`

- **Purpose**: Generate an `.ics` file (invitation) from query params.
- **Auth**: None.
- **Input (query)**: `title`, `start` (ISO), `end` (ISO), `location`, `description`, optional `timezone` (ignored when `floating=1`), optional `floating=1` (treat as floating local times, no timezone conversion), optional `recurrence` (RRULE), optional `reminders` (comma-separated minutes), optional `disposition` (`inline`|`attachment`, default `attachment`).
- **Output**: `text/calendar` (defaults to attachment `event.ics`; pass `disposition=inline` to encourage native Calendar opening on iOS/macOS).

### ICS Bulk — POST `/api/events/ics/bulk`

- **Purpose**: Generate a single `.ics` containing multiple VEVENTs for bulk import (Apple Calendar friendly, also works with Google/Outlook).
- **Auth**: None.
- **Input (JSON)**: `{ events: NormalizedEvent[], filename?: string }`.
- **Output**: `text/calendar` (attachment `events.ics`).

```bash
curl "http://localhost:3000/api/ics?title=Party&start=2025-06-23T19:00:00Z&end=2025-06-23T21:00:00Z&location=Home&timezone=America/Chicago&disposition=inline"
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

### Google Events Bulk — POST `/api/events/google/bulk`

- **Purpose**: Create multiple Google Calendar events in one request.
- **Auth**: NextAuth JWT; uses stored provider tokens (same as single insert).
- **Input (JSON)**: `{ events: NormalizedEvent[] }`.
- **Output**: `{ ok: true, results: Array<{ index, id?, htmlLink?, error? }> }`.

### Microsoft Events Bulk — POST `/api/events/outlook/bulk`

- **Purpose**: Create multiple Outlook events in one request.
- **Auth**: NextAuth JWT + stored Microsoft refresh token; dev falls back to JWT/cookie.
- **Input (JSON)**: `{ events: NormalizedEvent[] }`.
- **Output**: `{ ok: true, results: Array<{ index, id?, webLink?, error? }> }`.

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
- **Behavior**: New users are created with `subscription_plan = "free"` and `credits = 3`.
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

### History — GET/POST `/api/history`, GET/PATCH/DELETE `/api/history/[id]`

- **Purpose**: Store and manage extracted events/history items for users.
- **Auth**:
  - List (GET `/api/history`) requires session to return user items; returns `{ items: [] }` when unauthenticated.
  - Create (POST `/api/history`) associates the row to the signed-in user when available; still accepts unauthenticated writes.
  - Read single (GET `/api/history/[id]`) is public.
  - Update title (PATCH) and Delete (DELETE) require session and ownership.
- **Input**:
  - POST `/api/history`: `{ title?: string, data?: any }`.
  - PATCH `/api/history/[id]`: Either `{ title: string }` or `{ category: string }` or `{ data: object }` to shallow-merge into the JSON `data` (e.g., to fix the saved `category`).
- **Output**:
  - GET list: `{ items: Array<HistoryRow> }`.
  - GET single: `HistoryRow` or `{ error }` with 404.
  - POST: created `HistoryRow` `{ status: 201 }`.
  - PATCH: updated `HistoryRow`.
  - DELETE: `{ ok: true }`.

### OAuth disconnect — POST `/api/oauth/disconnect`

- **Purpose**: Clear legacy OAuth cookies for Google and Microsoft.
- **Auth**: None.
- **Behavior**: Expires `g_refresh` and `o_refresh` cookies; returns `{ ok: true }`.

### User Profile — GET/PUT `/api/user/profile`

- **Purpose**: Read and update user profile, preferred provider, and subscription plan.
- **Auth**: NextAuth session required.
- **GET Output**: `{ email, firstName, lastName, preferredProvider, subscriptionPlan, credits, name }`.
- **PUT Input (JSON)**: `{ firstName?: string|null, lastName?: string|null, preferredProvider?: "google"|"microsoft"|"apple"|null, subscriptionPlan?: "free"|"monthly"|"yearly"|null }`.
- **PUT Output**: Updated profile `{ email, firstName, lastName, preferredProvider, subscriptionPlan }`.

### Change Password — POST `/api/user/change-password`

- **Purpose**: Change password for the signed-in user.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ currentPassword: string, newPassword: string }` (min length 8).
- **Output**: `{ ok: true }` or `{ error }`.

### Subscription — GET/PUT `/api/user/subscription`

- **Purpose**: Read or set the user's subscription plan.
- **Auth**: NextAuth session required.
- **GET Output**: `{ plan, stripeSubscriptionStatus, stripeSubscriptionId, stripeCustomerId, stripePriceId, currentPeriodEnd, subscriptionExpiresAt, cancelAtPeriodEnd, pricing: { monthly, yearly } }`.
- **PUT Input (JSON)**: `{ plan: "free"|null, cancelAtPeriodEnd?: boolean }`. Only downgrades/cancellations are handled here; upgrades must go through Stripe checkout.
- **PUT Behavior**: Cancels the active Stripe subscription (default `cancel_at_period_end=true`). Response mirrors new `plan` and `cancelAtPeriodEnd` state.
- **PUT Output**: `{ ok: true, plan, cancelAtPeriodEnd }` or `{ error }`.

### Debug: NextAuth/Env — GET `/api/debug`

- **Purpose**: Quick introspection of auth/env configuration.
- **Output**: `{ has_NEXTAUTH_SECRET, has_AUTH_SECRET, url, cacheDir }`.

### Debug: GCP creds presence — GET `/api/debug-env`

- **Purpose**: Validate `GOOGLE_APPLICATION_CREDENTIALS_BASE64` is present and decodable.
- **Output**: `{ base64: boolean, client_email? }`.

### Debug: Vision client — GET `/api/debug-vision`

- **Purpose**: Validate Vision SDK can initialize and report project ID.
- **Output**: `{ ok, projectId, hasGOOGLE_B64, b64Length }`.

### Debug: OCR upload — POST `/api/debug-ocr`

- **Purpose**: Test file upload/processing pipeline.
- **Input**: `multipart/form-data` `file`.
- **Output**: `{ ok, receivedBytes, processedBytes, mime, name }`.

### Debug: DB (PG\* env) — GET `/api/debug-db`

- **Purpose**: Test connectivity using discrete `PG*` env variables.
- **Output**: `{ ok: true, rows }` or `{ ok: false, err }`.

### DB test (DATABASE_URL) — GET `/api/db-test`

- **Purpose**: Test Postgres connectivity using `DATABASE_URL`.
- **Output**: `{ ok, ms, now }` or `{ ok: false, error }`.

### Egress test — GET `/api/net`

- ### Debug: History — GET `/api/debug/history`

- **Purpose**: Inspect recent `event_history` inserts and whether the current session has user-linked rows.
- **Output**: `{ user: { id, email }|null, mineCount, recentCount, mine: HistoryRow[], recent: HistoryRow[] }`.

- **Purpose**: Check outbound network access (HEAD to Google Vision endpoint).
- **Output**: `{ ok, status }` or `{ ok: false, error }`.

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
  - `AUTH_SECRET`: Optional; alternative read by auth setup. If both are set, either works.
  - `NEXTAUTH_URL`: External base URL for NextAuth; also used to compute callback redirects.
  - `PUBLIC_BASE_URL`: Optional; used by OAuth callbacks to construct external redirects when behind proxies.
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
- **AWS SES (email senders)**
  - `SES_FROM_EMAIL_NO_REPLY` e.g. `Snap My Date <no-reply@snapmydate.com>` (password reset, system mail)
  - `SES_FROM_EMAIL_GIFT` e.g. `"Snap My Date Gifts" <gift@snapmydate.com>` (gift delivery emails)
  - `SES_FROM_EMAIL_CONTACT` e.g. `"Snap My Date Support" <contact@snapmydate.com>` (reserved for contact replies)
  - Region: `AWS_REGION` or `AWS_DEFAULT_REGION` and standard AWS credentials
- **Stripe**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `APP_URL` (external base URL used for success/cancel redirects)
- **Postgres (token and user storage)**
  - `DATABASE_URL` e.g. `postgresql://appuser:pass@host:5432/snapmydate`.
  - SSL configuration: do one of the following (not both):
    - Set `PGSSL_DISABLE_VERIFY=true` to skip verification in dev. The app sets `ssl: { rejectUnauthorized: false }`. Remove any `sslmode` params from `DATABASE_URL` to avoid conflicts.
    - Set `PGSSL_CA_BASE64=<base64 of rds-combined-ca-bundle.pem>` to enforce verification. The app sets `ssl: { ca, rejectUnauthorized: true }`. Remove `sslmode` from `DATABASE_URL` when passing SSL via env.
  - To get the latest AWS RDS CA bundle, download `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem` and base64-encode its contents.
  - Optional debug connectivity also supports `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` via `/api/debug-db`.

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

- 2025-09-17: Stripe webhook now handles `customer.subscription.updated` to immediately sync plan changes (e.g., monthly to yearly) after Stripe Checkout completes.
- 2025-09-17: Added `/api/billing/stripe/sync` and shared subscription sync utilities so the success page can refresh plan changes immediately after Checkout.
- 2025-09-17: Stripe webhook plan detection falls back to Stripe price intervals so yearly upgrades apply even if lookup keys or metadata are absent.
- 2025-09-17: Gift checkout/webhook instrumentation now traces SES email delivery, promo codes store the purchaser’s `created_by_user_id`, and fulfilled gifts auto-extend existing recipients’ subscriptions while marking the promo code redeemed.
- 2025-09-17: Stripe webhook now scans subscription and invoice items to sync yearly upgrades correctly and updates checkout success URLs to respect localhost origins, preventing dev redirects to production.
- 2025-09-16: Integrated Stripe billing. Added `/api/billing/stripe/checkout`, `/api/billing/stripe/portal`, and `/api/stripe/webhook`; promo gifts now initiate checkout sessions and are fulfilled post-payment. Documented new Stripe env vars and database tables (`gift_orders`, `stripe_webhook_events`, Stripe columns on `users`/`promo_codes`).
- 2025-09-10: Documented History, User Profile/Subscription/Change Password, OAuth disconnect, and additional debug endpoints; clarified NextAuth envs (`AUTH_SECRET`, `NEXTAUTH_URL`, `PUBLIC_BASE_URL`).
- 2025-09-11: Added Promo Gift agent/email delivery and Promo Redeem agent; expanded `promo_codes` schema (quantity/period, redeemed_by_email) and added `users.subscription_expires_at`; Subscription page modals for gifting/redeeming.
- 2025-09-13: Promo Gift Agent no longer returns gift code in response; code is email-only and UI shows in-modal success with auto-close.
- 2025-09-13: Switched SES sender envs to per-channel vars: `SES_FROM_EMAIL_NO_REPLY`, `SES_FROM_EMAIL_GIFT`, `SES_FROM_EMAIL_CONTACT`.
- 2025-09-14: OCR: Improved invitation handling (cursive names, ignore "Invitation Card" header), added wedding/marriage classification, and basic U.S. timezone inference from address; accepts optional LLM `category` from image parsing. Also switched event times to be preserved as typed (floating) with no cross-timezone adjustment; ICS supports `floating=1`.
- 2025-09-14: OCR/ingest: Category detection is words-only (from OCR text). Removed any image-only category influence. If wedding and birthday keywords both appear, neither is preferred (category left unset). Tightened birthday matching (e.g., 'birthday party', 'b-day', 'turns 5').
- 2025-09-14: History PATCH now supports updating `data` (shallow merge) or just `category` to fix miscategorized rows post-creation. Left sidebar adds quick "Mark as <Category>" to re-sync colors.
- 2025-08-28: Added Forgot/Reset password agents; created `password_resets` table; non-prod returns resetUrl for testing.
- 2025-08-27: Switched token and user storage from Supabase to Postgres (AWS RDS); Signup now writes to Postgres; added DATABASE_URL env.
- 2025-08-27: Documented Google callback state-based event creation; clarified Microsoft OAuth scopes; added Signup endpoint.
- 2025-08-26: Initial creation with OCR, ICS, Google/Outlook agents, OAuth routes, and debug/status endpoints documented.
