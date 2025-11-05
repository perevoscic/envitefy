## Agents overview

This document describes the app’s server-side agents (API routes) that extract event data, generate ICS, and insert events into Google Calendar and Microsoft Outlook. Keep this file up to date when any agent’s request/response, auth, or env dependencies change.

### What is an agent?

- An agent is any API route under `src/app/api/**` that performs a focused capability (OCR, ICS generation, calendar insertion, OAuth).

---

## Agent catalog

### Contact — POST `/api/contact`

- **Purpose**: Receive messages from the Contact form and deliver them via SES.
- **Auth**: None.
- **Input (JSON)**: `{ name?: string, email?: string, title: string, message: string }`.
- **Behavior**: Sends an email to the contact inbox. The destination address is taken from `CONTACT_TO` when set; otherwise it uses the email portion of `SES_FROM_EMAIL_CONTACT` (display name ignored), falling back to `contact@envitefy.com`. The message is sent using AWS SES when configured, with `Reply-To` set to the submitter's `email` when provided.
- **From/Sender**: Uses `SES_FROM_EMAIL_CONTACT` when available; otherwise falls back to `SES_FROM_EMAIL`, then `SES_FROM_EMAIL_NO_REPLY`, then `SMTP_FROM`, then `no-reply@envitefy.com`.
- **Output**: `{ ok: true, delivered: boolean }`.
- **Env**: `SES_FROM_EMAIL_CONTACT` (e.g., `Envitefy Contact <contact@envitefy.com>`), optional `CONTACT_TO` to override destination; standard AWS credentials and `AWS_REGION`/`AWS_DEFAULT_REGION`. Optionally supports SMTP fallback with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`/`SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_FROM`.

### Event Share — POST `/api/events/share`

- **Purpose**: Share an event with another existing user by email. Creates or updates a pending share.
- **Auth**: NextAuth session required; caller must be the event owner.
- **Input (JSON)**: `{ eventId: string, recipientEmail: string }`.
- **Output**: `{ ok: true, share }`.

### Event Share Accept — POST `/api/events/share/accept`

- **Purpose**: Recipient accepts a pending share.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ eventId: string }`.
- **Output**: `{ ok: true }`.

### Event Share Remove — POST `/api/events/share/remove`

- **Purpose**: Remove share access. If called by recipient, removes from their calendar only. If called by owner with `recipientUserId`, revokes that recipient; if without, revokes all recipients.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ eventId: string, recipientUserId?: string }`.
- **Output**: `{ ok: true, revoked: number }`.

### Admin Users Search — GET `/api/admin/users/search`

- **Purpose**: Admin-only, on-demand user lookup without loading all users by default.
- **Auth**: NextAuth session required and `isAdmin=true`.
- **Query params**: `q` (string, required to search), optional `limit` (1-50, default 20), optional `cursor` (opaque).
- **Behavior**: Returns a page of users matching `email` or `first_name` or `last_name` using a contains match. Results are ordered by `created_at desc, id desc`. When more results exist, `nextCursor` is set; pass it back to load subsequent pages. When `q` is empty, returns no results (avoids scanning the table).
- **Output**: `{ ok: true, items: Array<{ id, email, first_name, last_name, subscription_plan, ever_paid, credits, created_at, scans_total, shares_sent }>, nextCursor: string|null }`.

### Admin Users Filter — GET `/api/admin/users/filter`

- **Purpose**: Provide paginated admin views of user segments (all users, paid, FF lifetime, top scanners, top sharers) without needing a search query.
- **Auth**: NextAuth session required and `isAdmin=true`.
- **Query params**: `view` (required; one of `"all"|"paid"|"ff"|"scans"|"shares"`), optional `limit` (1-50, default 20), optional `cursor` (base64 checkpoint from the previous response).
- **Behavior**: Returns users sorted by `created_at desc, id desc` for most views, `scans_total desc, id desc` when `view="scans"`, and `shares_sent desc, id desc` when `view="shares"`. Cursor encodes the tuple used for pagination (created_at/id or scans_total/id or shares_sent/id). If `view` is missing, the endpoint returns `{ ok: true, items: [], nextCursor: null }`.
- **Output**: `{ ok: true, items: Array<{ id, email, first_name, last_name, subscription_plan, ever_paid, credits, created_at, scans_total, shares_sent }>, nextCursor: string|null }`.
- **Env**: `DATABASE_URL` (required). Optional SSL helpers: `PGSSL_DISABLE_VERIFY=true` or `PGSSL_CA_BASE64` (CA bundle). Connection strips any `sslmode` query params automatically.

### Admin Stats — GET `/api/admin/stats`

- **Purpose**: Fetch headline metrics and top performers for the admin dashboard.
- **Auth**: NextAuth session required and `isAdmin=true`.
- **Output**: `{ ok: true, overview: { totalUsers, totalEvents, totalShares, usersPaid, usersFF }, topUsers: Array<{ email, scans, shares }> }`. `topUsers` returns up to 20 rows ordered by scans (ties broken by shares).
- **Env**: `DATABASE_URL` (required) plus optional `PGSSL_DISABLE_VERIFY` or `PGSSL_CA_BASE64` for Postgres SSL.

### Admin Campaigns Send — POST `/api/admin/campaigns/send`

- **Purpose**: Create and send a bulk email campaign to users filtered by subscription plan or other criteria.
- **Auth**: NextAuth session required and `isAdmin=true`.
- **Input (JSON)**: `{ subject: string, body: string, fromEmail?: string, audienceFilter: { plans?: string[], minScans?: number, maxScans?: number, lastActiveAfter?: string, lastActiveBefore?: string }, buttonText?: string, buttonUrl?: string }`.
- **Behavior**: Queries users matching the audience filter, creates a campaign record in `email_campaigns` table, sends emails in batches of 100 via Resend, and updates campaign stats (sent/failed counts). The body supports a `{{greeting}}` placeholder for personalized greetings. Emails use the standard Envitefy template wrapper.
- **Output**: `{ ok: true, campaignId: string, sent: number, failed: number, errors: Array<{ email: string, error: string }> }`.
- **Env**: `RESEND_API_KEY` (required), `SES_FROM_EMAIL_NO_REPLY` (default sender), `DATABASE_URL`.

### Admin Campaigns List — GET `/api/admin/campaigns`

- **Purpose**: List all email campaigns with stats and creator info (admin only).
- **Auth**: NextAuth session required and `isAdmin=true`.
- **Query params**: `status` (optional: filter by status), `limit` (default 50), `offset` (default 0).
- **Output**: `{ ok: true, campaigns: Array<{ id, subject, bodyHtml, fromEmail, audienceFilter, recipientCount, sentCount, failedCount, status, errorMessage, sentAt, createdAt, updatedAt, creator: { email, firstName, lastName } }>, total: number, limit: number, offset: number }`.

### Admin Theme Override — GET/POST/DELETE `/api/admin/theme-override`

- **Purpose**: Allow administrators to preview holiday themes on their own accounts without changing the global schedule.
- **Auth**: NextAuth session required and `isAdmin=true`.
- **GET Output**: `{ override: { themeKey, variant, expiresAt }, schedule: { themeKey, window: { key, start, end } } }`.
- **POST Input (JSON)**: `{ themeKey: string, variant: "light"|"dark", expiresAt?: string|null }`.
- **POST Output**: `{ override: { themeKey, variant, expiresAt } }`.
- **DELETE Output**: `{ ok: true }` (clears the personal override).
- **Notes**: Overrides only apply to the requesting admin and fall back to the automated schedule when cleared or expired.

### Promo Gift Agent — POST `/api/promo/gift`

- **Purpose**: Initiate a Stripe Checkout session for gifting subscriptions. The promo code is created and emailed only after payment succeeds (via webhook). UI now redirects the purchaser to Stripe.
- **Auth**: Optional (reads NextAuth session to prefill purchaser email/name).
- **Input (JSON)**: `{ quantity: number, period: "months"|"years", recipientName?: string, recipientEmail?: string, message: string, senderFirstName?: string, senderLastName?: string, senderEmail?: string }`. Non-authenticated purchasers must supply the sender fields.
- **Pricing**: Server computes cents using Stripe plan pricing (defaults: $0.99/month, $9.99/year). `quantity` multiplies the unit amount.
- **Output**: `{ ok: true, orderId, sessionId, checkoutUrl, amountCents, currency }`. Clients must redirect the browser to `checkoutUrl` to complete payment.
- **Fulfillment**: Webhook `payment_intent.succeeded` issues the promo code, attaches it to the `gift_orders` row (including the purchaser's user id when known for downstream linking). If the recipient email already belongs to a Envitefy user, the gifted months are automatically added to their subscription and the promo code is marked redeemed; otherwise the recipient receives the code to redeem manually. Refunds revoke the code.
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
- **Behavior**: Ensures the user has a Stripe customer record, provisions or reuses the price (lookup keys `envitefy-monthly` / `envitefy-yearly`), and returns the hosted checkout URL. Active subscriptions short-circuit with HTTP 409.
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

- **Purpose**: OCR event flyers/images, parse title/date/time/location/description with OpenAI Vision as primary OCR, Google Vision as fallback (optimized for invitations and appointments).
- **Auth**: None.
- **Input**: `multipart/form-data` with `file` (image or PDF).
- **OCR Pipeline**:
  1. **Primary**: OpenAI Vision API (direct image analysis, best for cursive/decorative fonts)
  2. **Fallback**: Google Cloud Vision API (used only if OpenAI fails or returns no results)
  3. **Enhancement**: Heuristic parsing and text-based LLM cleanup as needed
- **Output**: JSON with extracted text and best-guess fields. Includes a heuristic `category` when detectable, plus `ocrSource` indicating which OCR method was used (`"openai"`, `"google-sdk"`, or `"google-rest"`).
- **Gymnastics schedules**: Detects season schedule flyers (e.g., "2026 Gymnastics Schedule"). Returns an `events` array of all-day meets with `title` like `NIU Gymnastics: vs Central Michigan` or `NIU Gymnastics: at Illinois State`. Home meets use the flyer address; away meets leave location empty when unknown (no external geocoding).
- **Practice schedules**: Recognizes weekly team practice tables (groups vs. days). The response adds a `practiceSchedule` object with the detected groups, their weekly sessions, and pre-built normalized events that include `RRULE:FREQ=WEEKLY` recurrences for each day/time block. When multiple groups are present, clients should prompt the user to pick one group before saving events.

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
    "title": "Alice's Birthday Party",
    "start": "2025-06-23T14:00:00.000Z",
    "end": null,
    "location": "123 Main St, Chicago, IL",
    "description": "Alice's Birthday Party...",
    "timezone": "America/Chicago",
    "rsvp": "RSVP: Jennifer 555-895-9741"
  },
  "category": "Birthdays",
  "ocrSource": "openai",
  "practiceSchedule": {
    "detected": false,
    "title": null,
    "timeframe": null,
    "timezone": "America/Chicago",
    "groups": []
  },
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
  - **Required**: `OPENAI_API_KEY` (Primary OCR via OpenAI Vision).
  - **Optional**: `OPENAI_OCR_MODEL` to override the dedicated OCR model (defaults to `gpt-4o`; falls back to `LLM_MODEL` when set).
  - **Optional fallback**: `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64` (preferred inline) or ADC via `GOOGLE_APPLICATION_CREDENTIALS` for Google Vision fallback.

#### Common OCR Errors

- **Venue/Activity Misinterpretation**: The OCR agent may sometimes misinterpret the event activity as the venue, especially when they are closely related. For example, "Ninja Warrior Course" might be identified as the venue when it is actually an activity held at a venue like "US Gold Gym". Clients should verify and correct these distinctions.

#### Notes

- Time parsing improved to detect spelled-out phrases like "four o'clock in the afternoon" and merge with detected dates; afternoon/evening keywords bias to PM.
- LLM prompt now prioritizes decorative/cursive text (names) on invitation cards and ignores boilerplate like "Invitation"/"Invitation Card" when forming titles. It also classifies wedding/marriage invites and can surface an LLM-provided `category` when present.
- Prompt enforces contextual reading of the flyer: venue values must come from the section labelled as venue/address (e.g., `US Gold Gym` in the attached example), while repeated activity strings (e.g., `Ninja Warrior Course, the Ninja Warrior Course`) stay in the event title/description. When venue and activity names conflict, prefer the location text paired with the address block, and only duplicate the activity wording if it actually appears inside that block.
- Wedding rewrite prompt now forbids templated phrases (e.g., "together with their parents", "Dinner and dancing to follow") unless they appear verbatim on the card. It uses only facts present on the invite.
- **Medical and dental appointments** extract only the clinical information actually visible on the scanned image - no templates, no invented information. The LLM reads the content and outputs only what it sees: appointment type, provider (if shown), facility (if shown), time, or other relevant details. Each fact appears on its own line. Patient name and DOB are excluded. Invitation phrases like "You're invited", "Join", "for his/her", "please" are explicitly forbidden. Example output based on actual content:
  ```
  Appointment type: Dental Cleaning.
  Scheduled for: October 6, 2023 at 10:30 AM.
  ```
  (Only includes what's visible on the image)
- Basic timezone inference from U.S. addresses (e.g., "Fresno, CA" → `America/Los_Angeles`). If no hint is found, falls back to the server timezone.
- Weekly practice schedules map day/time blocks to weekly recurrences. Returned events include `recurrence` strings (`RRULE:FREQ=WEEKLY;BYDAY=...`) and default 1-day-before reminders.

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
- **Input (JSON)**: `{ email: string, password: string, firstName?: string, lastName?: string, recaptchaToken?: string }`.
- **Behavior**:
  - New users are created with `subscription_plan = "freemium"` and no initial credits assignment (legacy `credits` column remains `NULL`).
  - Verifies reCAPTCHA v3 token if provided and `RECAPTCHA_SECRET_KEY` is configured.
  - Requires score > 0.5 for reCAPTCHA v3.
  - Falls back gracefully if reCAPTCHA is not configured.
- **Output**: `{ ok: true }` on success or `{ error }` on failure.
- **Env**:
  - `DATABASE_URL` (Postgres connection string)
  - `RECAPTCHA_SECRET_KEY` (optional, for bot protection)
  - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (optional, frontend key)

### Google OAuth Sign In/Up

- **Purpose**: Authenticate users via Google OAuth 2.0 through NextAuth.
- **Auth**: None (public OAuth flow).
- **Providers**: NextAuth configured with Google OAuth provider.
- **Behavior**:
  - Users can sign in/up using their Google account.
  - On first Google sign-in, a new user account is created automatically with `subscription_plan = "freemium"` and leaves the legacy `credits` column `NULL`.
  - Existing users can link their Google account by signing in with Google using the same email.
  - OAuth users have `password_hash = NULL` in the database (no password required).
  - User profile (first_name, last_name) is populated from Google profile data.
- **Callback URL**: Google redirects to NextAuth callback after authentication.
- **UI**: "Continue with Google" buttons in both login and signup modals.
- **Env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (same as calendar OAuth)

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
    - Includes accepted shared events for the user (annotated with `data.shared=true` and default category `Shared events`).
  - GET single: `HistoryRow` or `{ error }` with 404.
  - POST: created `HistoryRow` `{ status: 201 }`.
  - PATCH: updated `HistoryRow`.
  - DELETE: `{ ok: true }`.

### History Signup — POST `/api/history/[id]/signup`

- **Purpose**: Reserve, waitlist, or cancel "Smart sign-up" commitments for an event.
- **Auth**: NextAuth session required. Caller must be the event owner or an accepted share recipient.
- **Input (JSON)**:
  - Reserve: `{ action: "reserve", slots: Array<{ sectionId: string, slotId: string, quantity?: number }>, name: string, email?: string, phone?: string, guests?: number, note?: string, answers?: Array<{ questionId: string, value: string }>, signupId?: string }`.
  - Cancel: `{ action: "cancel", signupId: string }`.
- **Behavior**:
  - Validates slot availability, per-person limits, and required questions based on the form's `settings`.
  - Applies automatic waitlisting and promotions: when capacity frees up, earliest waitlisted responses are moved to confirmed.
  - Persists updates to both places for backward compatibility:
    - Normalized table: `signup_forms.form` (authoritative for sign-up forms only)
    - Legacy JSON: `event_history.data.signupForm` (kept in sync)
- **Storage**:
  - Events and their metadata continue to live in `event_history`.
  - Sign-up forms are normalized in `signup_forms(event_id uuid primary key references event_history(id) on delete cascade, form jsonb, created_at, updated_at)`.
  - When a legacy-only form exists in `event_history.data.signupForm`, the API backfills it into `signup_forms` on first access if it has a valid form shape.
- **Output**: `{ ok: true, signupForm, response? }` with the normalized form state and (for reserve) the caller's latest response. Errors return `{ error }` with HTTP 4xx/5xx codes.
- **Notes**: Fails with 400 when the event lacks a sign-up form. Contact fields are optional unless the sign-up settings require them.

### OAuth disconnect — POST `/api/oauth/disconnect`

- **Purpose**: Clear legacy OAuth cookies for Google and Microsoft.
- **Auth**: None.
- **Behavior**: Expires `g_refresh` and `o_refresh` cookies; returns `{ ok: true }`.

### User Profile — GET/PUT `/api/user/profile`

- **Purpose**: Read and update user profile, preferred provider, and subscription plan.
- **Auth**: NextAuth session required.
- **GET Output**: `{ email, firstName, lastName, preferredProvider, subscriptionPlan, credits, name, categoryColors, isAdmin }`.
- Notes: When `subscriptionPlan` is `FF`, `credits` is returned as `null` (unlimited usage).
- **PUT Input (JSON)**: `{ firstName?: string|null, lastName?: string|null, preferredProvider?: "google"|"microsoft"|"apple"|null, subscriptionPlan?: "free"|"monthly"|"yearly"|"FF"|null, categoryColors?: Record<string,string>|null }`.
- **PUT Output**: Updated profile `{ email, firstName, lastName, preferredProvider, subscriptionPlan, categoryColors, isAdmin }`.

### Change Password — POST `/api/user/change-password`

- **Purpose**: Change password for the signed-in user.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ currentPassword: string, newPassword: string }` (min length 8).
- **Output**: `{ ok: true }` or `{ error }`.

### Subscription — GET/PUT `/api/user/subscription`

- **Purpose**: Read or set the user's subscription plan.
- **Auth**: NextAuth session required.
- **GET Output**: `{ plan, stripeSubscriptionStatus, stripeSubscriptionId, stripeCustomerId, stripePriceId, currentPeriodEnd, subscriptionExpiresAt, cancelAtPeriodEnd, pricing: { monthly, yearly } }`.
- Notes: `plan` may be `FF` for unlimited lifetime access; in that case `subscriptionExpiresAt` is `null` and credits UI should be hidden.
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

### Debug: History — GET `/api/debug/history`

- **Purpose**: Inspect recent `event_history` inserts and whether the current session has user-linked rows.
- **Output**: `{ user: { id, email }|null, mineCount, recentCount, mine: HistoryRow[], recent: HistoryRow[] }`.

### Debug: Egress — GET `/api/debug-egress`

- **Purpose**: Run several outbound HTTP checks (Google 204, Vision root, Vision v1) and report reachability for each host.
- **Output**: `{ ok: true, results: { google_204: { ok, status|error }, vision_root: {...}, vision_metadata: {...} } }`.
- **Notes**: Each probe times out after ~8 seconds and the handler disables caching so console checks reflect live network status.

### Egress test — GET `/api/net`

- **Purpose**: Quick HEAD request to `https://vision.googleapis.com` to confirm outbound network access.
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
  "venue": "string (optional)",
  "location": "string",
  "description": "string",
  "recurrence": "RRULE:... | null",
  "reminders": [{ "minutes": 30 }],
  "registries": [{ "label": "Amazon", "url": "https://www.amazon.com/..." }],
  "attachment": {
    "name": "invite.pdf",
    "type": "application/pdf",
    "dataUrl": "data:application/pdf;base64,..."
  }
}
```

- Weekly practice schedules produced by the OCR agent pre-fill `recurrence` with `RRULE:FREQ=WEEKLY;BYDAY=…` so downstream agents can save repeating events without additional parsing.
- `venue` allows clients to surface a human-friendly place name separately from the street address; calendar agents combine `venue` + `location` while deduplicating repeated venue segments inside the address field automatically.
- `registries` holds up to three shareable retailer links (`amazon.com`, `target.com`, `walmart.com`, `babylist.com`, `myregistry.com`). Each entry includes a `label` for display and the HTTPS URL guests can open in a new tab. The UI only surfaces registry inputs/cards when the event category is **Birthdays**, **Weddings**, or **Baby Showers**.
- `attachment` stores an optional flyer/document upload (images or PDFs up to 10 MB). Event details render a preview for images and a download link for other file types.
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
- **Resend (email campaigns)**
  - `RESEND_API_KEY`: Required for admin bulk email campaigns via `/api/admin/campaigns/send`.
- **GCP Vision**
  - Prefer inline: `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64`.
  - Or ADC file path: `GOOGLE_APPLICATION_CREDENTIALS`.
- **OpenAI (optional OCR fallback)**
  - `OPENAI_API_KEY`, `LLM_MODEL` (default `gpt-4o-mini`).
- **AWS SES (email senders)**
  - `SES_FROM_EMAIL_NO_REPLY` e.g. `Envitefy <no-reply@envitefy.com>` (password reset, system mail)
  - `SES_FROM_EMAIL_GIFT` e.g. `"Envitefy Gifts" <gift@envitefy.com>` (gift delivery emails)
  - `SES_FROM_EMAIL_CONTACT` e.g. `"Envitefy Contact" <contact@envitefy.com>` (reserved for contact replies)
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

- 2025-11-05: OCR (all invites) generalized: primary OpenAI prompt now emphasizes cursive/handwritten decoding, ensures titles include honorees (e.g., "<FullName> Baby Shower"), avoids generic titles when names are visible, and forbids placeholder phrases like "private residence" unless printed. Fallback title heuristics recognize baby/bridal showers.
- 2025-11-05: OCR (weddings) tightened: title now uses "<Name A> & <Name B> Wedding" (never invitation wording). Descriptions may retain verbatim invitation phrasing like "invites you" when present, but otherwise keep only facts (names, venue/address, time). Added deterministic fallback when LLM rewrite fails and expanded invite-phrase stripping for titles.
- 2025-10-25: Signup and OAuth user creation now leave the legacy `credits` column `NULL` (no default allotment) while keeping `subscription_plan = "freemium"`; update FAQ to reflect the retirement of credits.
- 2025-10-25: History Signup now stores forms in normalized `signup_forms` table (with backfill from `event_history.data.signupForm`) and keeps the legacy JSON in sync for backward compatibility.
- 2025-10-21: Event detail pages now surface a guided RSVP prompt when a phone number is available. Guests can tap **Yes**, **No**, or **Maybe** to launch an SMS with prefilled copy, after sharing their contact details. We cache the sender info in `localStorage` (`snapmydate:rsvp-sender`) so future RSVPs prefill, and declining shows a confirmation message with the host’s contact.
- 2025-10-20: Added admin dashboard endpoints `GET /api/admin/users/filter` (segmented user views) and `GET /api/admin/stats` (overview metrics + top scanners), plus `/api/debug-egress` for richer outbound network diagnostics.
- 2025-10-18: Added optional `registries` (Amazon/Target/Walmart/Babylist/MyRegistry links), file `attachment`, and `venue` to NormalizedEvent. Event create/edit flows capture up to three shareable registries for **Birthdays**, **Weddings**, and **Baby Showers**, support image/PDF uploads for all categories, the event detail page renders branded registry cards plus attachment downloads, and calendar mappers still deduplicate venues while keeping same-day ranges formatted as "start – end". Added Baby Showers as a top-level category with registry + RSVP support and sidebar icon.
- 2025-10-10: Added admin email campaigns system with Resend integration. New endpoints: `POST /api/admin/campaigns/send`, `GET /api/admin/campaigns`. New database table: `email_campaigns`. Admin UI at `/admin/campaigns` for composing and sending bulk marketing emails to users filtered by subscription tier.
- 2025-10-05: Updated yearly Stripe pricing to $9.99 (`prod_T93Df9XcDp26Nm`).
- 2025-09-29: Updated Stripe pricing to $0.99/month (`prod_T93CX7Yaqefp2B`) and $19.99/year (`prod_T93Df9XcDp26Nm`); portal button only shows for active paid plans.
- 2025-09-27: User profile API now returns `isAdmin` so clients can surface admin UI without relying on session-only flags.
- 2025-09-26: OCR medical appointment outputs keep notes strictly clinical—avoiding phrases like "Join us for" and skipping friendly invitation rewrites.

- 2025-09-26: Added `FF` subscription plan (never expires, unlimited). API returns `credits: null` for FF users and preserves FF in Stripe sync.

- 2025-09-19: User profile now supports `categoryColors` so event/category colors sync across devices for signed-in users.
- 2025-09-19: Shared events: added `/api/events/share`, `/api/events/share/accept`, `/api/events/share/remove`. `/api/history` includes accepted shares; UI marks shared items and adds a hidden-until-used `Shared events` category above Birthdays.

---

## Conventions and update guidelines

- When you modify any agent’s request/response shape, auth behavior, or env requirements, update the relevant section here.
- Add a concise entry under the changelog including date, agent name, and short description.
- Keep curl examples minimal and correct; prefer showing only required fields.
- Avoid duplicating implementation detail; link to the route path and summarize behavior.

---

## Changelog

- 2025-10-06: **UI Enhancement**: Event creation modal now supports custom categories with automatic icon assignment. Users can select from preset categories (with emoji icons) or add their own custom category via "➕ Add your own..." option. Icons are intelligently assigned based on category keywords (e.g., 🎂 for birthdays, 💍 for weddings, 🩺 for medical appointments).
- 2025-10-06: Default LLM model set to `gpt-4o` for best OCR accuracy with cursive/decorative fonts. Users can override with `LLM_MODEL=gpt-4o-mini` for faster, lower-cost processing when high accuracy is not critical.
- 2025-10-06: **New feature**: Event creation modal now detects connected calendars (Google, Microsoft, Apple) and shows checkboxes to add events to multiple calendars simultaneously. All connected calendars are pre-selected by default.
- 2025-10-06: Medical and dental appointment descriptions are now content-based, not template-based. The LLM extracts only the clinical information actually visible on the scanned image (appointment type, provider if shown, facility if shown, time, etc.). No rigid templates, no invented information. Patient name and DOB are excluded. All invitation-style phrases like "You're invited", "Join", "for his/her", "please" are forbidden. Each fact appears on its own line.
- 2025-10-06: **BREAKING**: OCR pipeline flipped to use OpenAI Vision as PRIMARY OCR method, with Google Vision as fallback. OpenAI Vision now runs first for all scans (direct image analysis), Google Vision only used if OpenAI fails. Response includes `ocrSource` field (`"openai"`, `"google-sdk"`, or `"google-rest"`). This improves accuracy for cursive fonts, decorative text, and RSVP extraction.
- 2025-10-06: OCR agent now extracts RSVP contact info (name + phone) into a separate `rsvp` field in `fieldsGuess` for better structured data access. Event pages display RSVP info with Text/Call links, and signed-in users see an RSVP button in the event actions toolbar when a phone number is detected.
- 2025-10-03: Added reCAPTCHA v3 protection to signup form. Verifies tokens server-side with score threshold (>0.5). Optional and gracefully falls back if not configured.
- 2025-10-03: Added Google OAuth Sign In/Up integration with NextAuth. Users can now authenticate using their Google account. Database schema updated to make `password_hash` nullable for OAuth users.
- 2025-10-05: Updated yearly Stripe pricing to $9.99 (`prod_T93Df9XcDp26Nm`).
- 2025-09-29: Updated Stripe pricing to $0.99/month (`prod_T93CX7Yaqefp2B`) and $19.99/year (`prod_T93Df9XcDp26Nm`); portal button only shows for active paid plans.
- 2025-09-27: User profile API now returns `isAdmin` so clients can surface admin UI without relying on session-only flags.
- 2025-09-18: OCR practice schedules now capture weekly team tables, return a `practiceSchedule` payload with per-group recurring events, and the Snap UI prompts for group selection while surfacing repeat controls only when a schedule is detected.
- 2025-09-17: Stripe webhook now handles `customer.subscription.updated` to immediately sync plan changes (e.g., monthly to yearly) after Stripe Checkout completes.
- 2025-09-17: Added `/api/billing/stripe/sync` and shared subscription sync utilities so the success page can refresh plan changes immediately after Checkout.
- 2025-09-17: Stripe webhook plan detection falls back to Stripe price intervals so yearly upgrades apply even if lookup keys or metadata are absent.
- 2025-09-17: Gift checkout/webhook instrumentation now traces SES email delivery, promo codes store the purchaser’s `created_by_user_id`, and fulfilled gifts auto-extend existing recipients’ subscriptions while marking the promo code redeemed.
- 2025-09-17: Stripe webhook now scans subscription and invoice items to sync yearly upgrades correctly and updates checkout success URLs to respect localhost origins, preventing dev redirects to production.
- 2025-09-16: Integrated Stripe billing. Added `/api/billing/stripe/checkout`, `/api/billing/stripe/portal`, and `/api/stripe/webhook`; promo gifts now initiate checkout sessions and are fulfilled post-payment. Documented new Stripe env vars and database tables (`gift_orders`, `stripe_webhook_events`, Stripe columns on `users`/`promo_codes`).
- 2025-10-06: Documented History, User Profile/Subscription/Change Password, OAuth disconnect, and additional debug endpoints; clarified NextAuth envs (`AUTH_SECRET`, `NEXTAUTH_URL`, `PUBLIC_BASE_URL`).
- 2025-10-06: Added Promo Gift agent/email delivery and Promo Redeem agent; expanded `promo_codes` schema (quantity/period, redeemed_by_email) and added `users.subscription_expires_at`; Subscription page modals for gifting/redeeming.
- 2025-10-03: Promo Gift Agent no longer returns gift code in response; code is email-only and UI shows in-modal success with auto-close.
- 2025-10-03: Switched SES sender envs to per-channel vars: `SES_FROM_EMAIL_NO_REPLY`, `SES_FROM_EMAIL_GIFT`, `SES_FROM_EMAIL_CONTACT`.
- 2025-10-04: OCR: Improved invitation handling (cursive names, ignore "Invitation Card" header), added wedding/marriage classification, and basic U.S. timezone inference from address; accepts optional LLM `category` from image parsing. Also switched event times to be preserved as typed (floating) with no cross-timezone adjustment; ICS supports `floating=1`.
- 2025-10-04: OCR/ingest: Category detection is words-only (from OCR text). Removed any image-only category influence. If wedding and birthday keywords both appear, neither is preferred (category left unset). Tightened birthday matching (e.g., 'birthday party', 'b-day', 'turns 5').
- 2025-10-04: History PATCH now supports updating `data` (shallow merge) or just `category` to fix miscategorized rows post-creation. Left sidebar adds quick "Mark as <Category>" to re-sync colors.
- 2025-08-28: Added Forgot/Reset password agents; created `password_resets` table; non-prod returns resetUrl for testing.
- 2025-08-27: Switched token and user storage from Supabase to Postgres (AWS RDS); Signup now writes to Postgres; added DATABASE_URL env.
- 2025-08-27: Documented Google callback state-based event creation; clarified Microsoft OAuth scopes; added Signup endpoint.
- 2025-08-26: Initial creation with OCR, ICS, Google/Outlook agents, OAuth routes, and debug/status endpoints documented.
