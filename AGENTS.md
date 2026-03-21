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

### Password Reset — POST `/api/auth/forgot`

- **Purpose**: Generate a password reset token and email the reset link.
- **Auth**: None (always responds 200 to avoid user enumeration).
- **Behavior**: Sends reset email when the user exists. When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are configured, the route generates a Supabase Auth recovery link (and auto-seeds a Supabase auth user for legacy app accounts that do not yet exist there) and emails that link. If Supabase link generation fails, it falls back to the local `password_resets` token flow. Non-production responses include the reset URL and error reason if email sending fails.
- **From/Sender**: Prefers `RESEND_FROM_EMAIL` when set, otherwise uses `SES_FROM_EMAIL_NO_REPLY`, then `SES_FROM_EMAIL`, then `SES_FROM_EMAIL_CONTACT`, then `SMTP_FROM`, then `no-reply@envitefy.com`.
- **Env**: `RESEND_API_KEY` (preferred, for password reset delivery) with optional `RESEND_FROM_EMAIL`; optionally SMTP fallback with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`/`SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_FROM`.

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

### Event Media Thumbnail — GET `/api/events/[id]/thumbnail`

- **Purpose**: Serve inline event media as cacheable image responses so public pages and dashboards do not need to fetch base64 image payloads inside `event_history.data`.
- **Auth**: None.
- **Input**: Route param `id` accepts either the event UUID or slug/slug-id form used by public event URLs.
- **Query params**: Optional `variant` chooses which inline image to serve: `"thumbnail"` (default event header image), `"attachment"` (image attachment), `"profile"` (birthday/profile image), `"hero"` (custom or fallback hero image), or `"signup-header"` (smart signup header image). Optional `v` is a cache-busting signature.
- **Output**: Raw image bytes with `Content-Type` derived from the stored data URL, or `404` when the requested inline media is absent.
- **Env**: None.

### RSVP Attendance — POST `/api/rsvp/attendance`

- **Purpose**: Update an athlete's attendance status from the RSVP form and sync the Team Roster.
- **Auth**: Optional. Signed-in owners/share recipients can always update. Guests can update when the event is public or when they hold a valid passcode unlock cookie for protected events.
- **Input (JSON)**: `{ eventId: string, status: "going"|"notgoing"|"not_going"|"maybe"|"late"|"pending", athleteId?: string, athleteName?: string, guest?: { name?: string, email?: string, phone?: string } }`.
- **Behavior**: Looks up the event's `advancedSections.roster.athletes`, matches by `athleteId` (preferred) or case-insensitive `athleteName`, sets `status`, and stamps `attendanceUpdatedAt`. Signed-in updates set `attendanceUpdatedByUserId`; guest updates set `attendanceUpdatedByGuestName`/`attendanceUpdatedByGuestEmail`/`attendanceUpdatedByGuestPhone`.
- **Output**: `{ ok: true, athlete, updatedEvent, updatedBy: "user"|"guest" }` or `{ error }`.
- **Env**: None.

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
- **Output**: `{ ok: true, overview: { totalUsers, totalEvents, totalShares, totalScans, usersPaid, usersFF, eventsByCategory }, topUsers: Array<{ email, scans, shares }> }`. `eventsByCategory` sums the per-user scan counters (`scans_birthdays`, `scans_weddings`, `scans_sport_events`, `scans_appointments`, `scans_doctor_appointments`, `scans_play_days`, `scans_general_events`, `scans_car_pool`). `topUsers` returns up to 20 rows ordered by scans (ties broken by shares).
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

### Promo Gift Agent — POST `/api/promo/gift`

- **Purpose**: Initiate a Stripe Checkout session for gifting subscriptions. The promo code is created and emailed only after payment succeeds (via webhook). UI now redirects the purchaser to Stripe.
- **UI guard (temporary)**: The Gift flow is currently disabled client-side (see `src/components/GiftSnapModal.tsx`) to prevent Stripe calls while the Stripe account is inactivation/limited mode. API behavior unchanged.
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
- **UI guard (temporary)**: The Subscription page currently blocks paid-plan checkout calls client-side (see `src/app/subscription/page.tsx`) to avoid Stripe requests while the Stripe account is inactivation/limited mode. API behavior unchanged.
- **Auth**: NextAuth session required.
- **Input (JSON)**: `{ plan: "monthly" | "yearly" }`.
- **Behavior**: Ensures the user has a Stripe customer record, provisions or reuses the price (lookup keys `envitefy-monthly` / `envitefy-yearly`), and returns the hosted checkout URL. Active subscriptions short-circuit with HTTP 409.
- **Output**: `{ ok: true, sessionId, url }`.
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `APP_URL`.

### Stripe Billing Portal — POST `/api/billing/stripe/portal`

- **Purpose**: Generate a Stripe Billing Portal session so users can update payment methods or cancel directly with Stripe.
- **UI guard (temporary)**: The Subscription page currently disables opening the Billing Portal while Stripe payments are blocked (see `src/app/subscription/page.tsx`). API behavior unchanged.
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

- **Purpose**: OCR event flyers/images and parse title/date/time/location/description using OpenAI Vision only (optimized for invitations and appointments).
- **Auth**: None.
- **Input**: `multipart/form-data` with `file` (image or PDF).
- **Query params**:
  - `fast=1`: enables latency-focused mode that time-budgets OCR stages and skips optional rewrite/deep schedule LLM passes.
  - `fast=0`: enables full-quality mode (allows extra rewrite/deep schedule passes when budget remains).
  - `turbo=1`: runs OpenAI OCR in a more aggressive, latency-focused mode (no Google fallback).
  - `timing=1` (or `debug=1`): includes per-stage timing metadata in the JSON response for diagnostics.
  - `rewrite=1`: forces rewrite passes on even when `fast=1`.
  - Existing params remain supported: `llm=1` / `engine=openai` and `gym=1` / `sport=gymnastics`.
- **OCR Pipeline**:
  1. **Primary**: OpenAI Vision API (direct image analysis, best for cursive/decorative fonts)
  2. **Enhancement**: Heuristic parsing and text-based LLM cleanup as needed
- **Output**: JSON with extracted text and best-guess fields. Includes a heuristic `category` when detectable, plus `ocrSource` indicating which OCR method was used (currently `"openai"`; older responses may also include `"google-sdk"` or `"google-rest"`).
- **Birthday template hinting**: When the OCR result is a birthday invite, the response now also includes `birthdayTemplateHint` so clients can route the scanned event into the correct birthday renderer automatically. Detection uses text/theme cues only. Girl-coded cues (for example `ballerina`, `ballet`, `tutu`, `princess`, `bows`, `she/her`) map to `audience: "girl"` and theme `editorial_ballerina_bloom`. Boy-coded cues (for example `all-star`, `sports`, `mvp`, `superhero`, `trucks`, `he/him`) map to `audience: "boy"` and theme `editorial_blue_allstar`. If the scan is clearly a birthday but the audience is ambiguous, the route returns `audience: "neutral"` and theme `editorial_confetti_neutral`. The OCR route does not infer girl/boy from a face alone or from the honoree name alone.
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
  "birthdayTemplateHint": {
    "detected": true,
    "audience": "girl",
    "confidence": "high",
    "reasons": ["ballerina", "tutu"],
    "honoreeName": "Alice",
    "age": 8,
    "themeId": "editorial_ballerina_bloom"
  },
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
  - **Optional**: `OPENAI_OCR_MODEL` to override the dedicated OCR model (defaults to `gpt-5.1`; falls back to `LLM_MODEL` when set).
  - **Optional**: `OPENAI_OCR_FAST_MODEL` for `fast=1` extraction path (defaults to `gpt-5.1-mini`, then `LLM_MODEL`).
  - **Optional**: `OCR_TOTAL_BUDGET_MS` to cap total OCR processing budget (default `35000`).
  - **Optional**: `OCR_ENABLE_REWRITES=1` to re-enable rewrite passes by default in fast mode.

#### Common OCR Errors

- **Venue/Activity Misinterpretation**: The OCR agent may sometimes misinterpret the event activity as the venue, especially when they are closely related. For example, "Ninja Warrior Course" might be identified as the venue when it is actually an activity held at a venue like "US Gold Gym". Clients should verify and correct these distinctions.

#### Notes

- Time parsing improved to detect spelled-out phrases like "four o'clock in the afternoon" and merge with detected dates; afternoon/evening keywords bias to PM.
- LLM prompt now prioritizes decorative/cursive text (names) on invitation cards and ignores boilerplate like "Invitation"/"Invitation Card" when forming titles. It also classifies wedding/marriage invites and can surface an LLM-provided `category` when present.
- Prompt enforces contextual reading of the flyer: venue values must come from the section labelled as venue/address (e.g., `US Gold Gym` in the attached example), while repeated activity strings (e.g., `Ninja Warrior Course, the Ninja Warrior Course`) stay in the event title/description. When venue and activity names conflict, prefer the location text paired with the address block, and only duplicate the activity wording if it actually appears inside that block.
- Birthday OCR-created events may now be persisted by clients as `createdVia: "ocr-birthday-renderer"` with the selected `variationId` from `birthdayTemplateHint.themeId`, which routes the public page into the birthday renderer instead of the generic OCR event page.
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
- **Input (default mode)**: `multipart/form-data` `file`.
- **Output (default mode)**: JSON `{ ocrText, event: { title, start, end, location, description, timezone }, schedule, events, category }` (schedule/events are empty; football schedule detection removed).
- **Discovery mode (gymnastics)**: `POST /api/ingest?mode=meet_discovery` accepts either:
  - `multipart/form-data` `file` (`pdf`, `jpg/jpeg`, `png`), or
  - `multipart/form-data` `url` (event/meet page URL).
- **Discovery mode (football)**: `POST /api/ingest?mode=football_discovery` accepts either:
  - `multipart/form-data` `file` (`pdf`, `jpg/jpeg`, `png`), or
  - `multipart/form-data` `url` (schedule/packet page URL).
- **Discovery mode output**: `{ eventId }`.
- **Discovery mode behavior**: Creates either a gymnastics or football discovery scaffold in `event_history` and stores `discoverySource.workflow` plus source input metadata for follow-up parsing. URL sources are intended for discovery crawling during `/api/parse/[eventId]`, not for synchronous extraction during ingest.
- **Env**: Same GCP Vision credentials as above. No LLM usage here.

### Discovery Parse — POST `/api/parse/[eventId]`

- **Purpose**: Run the fast core discovery extraction + parse for an ingested gymnastics or football source and persist builder-usable data immediately.
- **Auth**: Optional; enforces ownership when event has `user_id`.
- **Query params**:
  - `repair=1` (optional): forces a re-parse/re-map pass for an existing discovery event to repair stale or mis-mapped fields (same output shape, response includes `repaired: true`).
- **Behavior**:
  - Resolves the stored discovery workflow first. Football stays single-stage; gymnastics now returns after the core parse and marks enrichment as pending.
  - Extracts text from source input:
    - File PDFs use native extraction first; low-text PDFs fall back to OCR.
    - Images use OCR.
    - URLs fetch readable HTML text + metadata from the source page, follow up to one additional same-host HTML level, and parse same-host PDF/image assets discovered on the landing page or those followed child pages.
  - Dense document OCR now uses Google Vision `documentTextDetection` before OpenAI OCR fallback.
  - Extraction is workflow-aware:
    - `workflow="football"` skips gymnastics-only hall-layout and schedule-image branches entirely.
    - `mode="core"` still skips gym-layout screenshots and keeps schedule extraction text-first, but gymnastics core parse now also extracts schedule page images when available so bounded structural schedule repair can run before the builder first renders.
    - Gymnastics core parse keeps text-derived `schedulePageTexts` when native PDF text already exposes schedule pages, and pairs them with schedule page images when available.
  - Extraction now computes quality diagnostics (`textQuality`, `qualitySignals`) and timing/call-count telemetry, stored under `discoverySource.performance` and `discoverySource.extractionMeta`.
  - URL-based gymnastics landing pages now perform event-scoped resource discovery before mapping:
    - root-page direct resources are classified deterministically (`packet`, `roster`, `team_divisions`, `results_hub`, `rotation_hub`, `hotel_booking`, `photo_video`, `admission`, `parking`, etc.),
    - trusted external resource pages are fetched once for supported domains (`api.groupbook.io`, `jotform.com`, `form.jotform.com`, `pci.jotform.com`, `meetscoresonline.com`, `results.scorecatonline.com`) and their readable HTML text is appended to extraction evidence,
    - results and rotation hubs are only promoted when descendant links event-match the root title/date/location; conflicting weekends stay attached only as neutral hub links or `not_posted` status instead of being promoted.
  - Extraction metadata stores hall-layout and schedule artifacts when available, with heavy base64 debug artifacts persisted only when `DISCOVERY_DEBUG_ARTIFACTS=1`:
    - `discoveredLinks` (labeled discovered URLs with crawl metadata such as source page, depth, kind, follow status, and content type when fetched),
    - `resourceLinks` (structured canonical landing-page resources with kind, posting status, source URL, origin, follow state, content type, and event-match metadata),
    - `crawledPages` (root page plus any followed same-host child HTML pages with title/depth),
    - `gymLayoutImageDataUrl` (optimized screenshot data URL from PDF/image),
    - `gymLayoutFacts` (OCR-extracted hall/registration/awards/location lines),
    - `gymLayoutZones` (LLM-detected map regions with normalized boxes and confidence),
    - `gymLayoutPage` (0-based PDF page index when applicable),
    - `gymLayoutSelection` (optional diagnostics payload with selected page, confidence, reason, and scored candidates).
    - `coachPageHints` (optional compact hints for PDF/source sections that look coach-specific, including page number, heading, and excerpt).
    - `schedulePageImages` / `schedulePageTexts` (optional schedule-grid artifacts used for gymnastics session extraction and structural repair when needed),
    - `scheduleDiagnostics` (optional schedule extraction diagnostics including selected schedule pages, selected/rejected schedule segments by kind, ambiguity notes, text/image parse counts, fallback usage, and stale-schedule repair detection).
  - PDF hall-layout image capture now uses a renderer fallback path (PDF.js + Canvas) when direct PDF page rasterization is unavailable, so venue map screenshots can still be generated from uploaded PDFs.
  - PDF hall-layout page selection is strict map-only: text/prose pages are rejected even if they contain generic hall terms. If no page passes strict gates, `gymLayoutImageDataUrl` is stored as `null` (no text-page fallback image).
  - Hall-layout fact lines are now strictly sanitized before mapping/rendering (readability + venue-anchor checks + near-duplicate collapse). Fragmented/paraphrased snippets are dropped so Venue Details may be intentionally sparse when source confidence is low.
  - If extracted text quality is `poor`, the route skips model calls and returns a safe null-heavy parse payload (`modelUsed: "quality-gate"`) instead of hallucinating fields from corrupted text.
  - AI parsing is **OpenAI primary** with strict JSON schema / structured outputs.
  - Gemini remains the final fallback when the primary parse call fails.
  - Gymnastics parse schema is dynamic-file oriented and includes `documentProfile` plus expanded sections for operations/policies/coach info/contacts/deadlines/unmapped facts to improve recall across varied meet packets.
  - Gymnastics parsing now trains specifically on coach-only sections/pages and returns a structured `parseResult.coachInfo` block when detected. The block now separates coach/registration data from public admission and includes coach ops (`signIn`, `attire`, `hospitality`, `floorAccess`, `scratches`, `floorMusic`, `rotationSheets`, `awards`, `regionalCommitment`), rules (`qualification`, `meetFormat`, `equipment`, `refundPolicy`, `paymentInstructions`), fee arrays (`entryFees`, `teamFees`, `lateFees`), and coach-facing `contacts`, `deadlines`, `links`, and `notes`.
  - Gymnastics mapping safeguards meet dates by preferring parsed date ranges (for example `March 6-8, 2026`) when a conflicting single `startAt` value is out of range, and it now applies deterministic date classification to demote update/posted/deadline stamps before mapped meet dates are finalized.
  - Gymnastics mapping resolves an assigned gym location (`athlete.assignedGym` first, then strongest gym mention) and attempts a focused crop from the detected gym layout zones. If crop confidence is insufficient or no matching zone is found, it safely falls back to the full layout image.
  - Gymnastics discovery rendering keeps the public tabs fixed (`Meet Details`, `Venue Details`, `Admission & Sales`, `Traffic & Parking`, `Safety Policy`) and adds dynamic navigation tabs when source-backed content exists: `Coaches` for coach-only packet content and `Schedule` for extracted session grids. `Schedule` appears between `Coaches` and `Venue Details` and stays hidden when no usable schedule data is stored.
  - Gymnastics core schedule extraction is now segment-first. It classifies schedule pages into grid, narrative, and assignment segments before parsing, so packet headers, award prose, and age-group tables do not leak into session-grid fields.
  - Visual schedule repair is no longer enrich-only. Core parse can run bounded structural repair for true schedule-grid pages when text heuristics indicate incomplete or ambiguous grid parsing, so the initial builder view gets correctly separated sessions/clubs. Enrichment still retries/refines the same repair path later when needed.
  - Gymnastics mapping now stores coach-facing content in `advancedSections.coaches`, extracted multi-day session grids in `advancedSections.schedule`, adds `resultsInfo` / `rotationSheetsInfo` / `awardsInfo` to `advancedSections.meet`, and preserves normalized parking map/rate links in `advancedSections.logistics`. `advancedSections.schedule` also preserves `annotations` for schedule rules (for example team-awards timing, senior recognition, pending/finalized schedule notes) and `assignments` for age-group or birth-date to session mappings. Parsed schedule data seeds the builder when empty; later manual schedule edits are preserved on reparses unless explicitly replaced.
  - Deterministic resource promotion now also populates `advancedSections.meet.scoresLink`, promotes landing-page documents into `advancedSections.logistics.additionalDocuments`, and stores hotel/travel summary copy in `advancedSections.logistics.hotelInfo` when extraction or parsing yields it.
  - Football uses a separate football-oriented schema/prompt that classifies `football_game_packet` vs `football_season_schedule` and maps results into football builder fields (`games`, `practice`, `roster`, `logistics`, `gear`, `volunteers`, `announcements`, team/stadium metadata).
  - Stores source audit info (`extractedText`, `parseResult`, `rawModelOutput`, `modelUsed`, timestamps, extraction quality metadata, performance, enrichment state`) under `discoverySource`.
- **Output**: `{ ok, eventId, repaired, modelUsed, parseResult, statuses, phase: "core", enrichment, performance }` where `modelUsed` is `"openai"`, `"gemini"`, or `"quality-gate"` when parsing is skipped due to low extraction quality. `performance.persistMs` is returned in the response/logs but is not written back into `event_history.data` to avoid a second persistence pass.
- **Env**: `OPENAI_API_KEY` required for primary parse; Gemini fallback needs `GEMINI_API_KEY` (or `GOOGLE_AI_API_KEY`). Optional model overrides: `OPENAI_DISCOVERY_PARSE_MODEL` (default `gpt-4.1-mini`), `OPENAI_DISCOVERY_VISION_MODEL` (default `gpt-4o-mini`), `DISCOVERY_CORE_BUDGET_MS` (default `25000`), `DISCOVERY_ENRICH_BUDGET_MS` (default `45000`), `DISCOVERY_ENRICH_STALE_MS` (default `600000`), `DISCOVERY_DEBUG_ARTIFACTS=1` to persist heavy debug artifacts, plus optional `GEMINI_MODEL`.

### Discovery Enrich — POST `/api/parse/[eventId]/enrich`

- **Purpose**: Run deferred gymnastics-only enrichment after the builder opens, without blocking the initial discovery parse.
- **Auth**: Optional; enforces ownership when event has `user_id`.
- **Query params**:
  - `force=1` (optional): retries enrichment after a previous `failed` or `completed` run. Fresh `running` leases still win and return `202`.
- **Behavior**:
  - Gymnastics only. Football returns `400`.
  - Requires an existing core parse (`discoverySource.parseResult` + `extractedText`).
  - Uses server-side lease semantics stored in `discoverySource.enrichment`:
    - a fresh `running` enrichment returns `202` without duplicating OCR/vision/model work,
    - stale `running` enrichments older than `DISCOVERY_ENRICH_STALE_MS` are reclaimed automatically,
    - completed enrichments short-circuit unless `force=1` is supplied.
  - Re-extracts the source in `mode="enrich"` and performs heavy gymnastics-only work:
    - PDF/image hall-layout extraction with deterministic shortlist first, then at most 2 OpenAI layout confirmations across a 4-page scan window.
    - Schedule image extraction capped to at most 2 pages and 3 table crops per page, with concurrency 2.
    - Visual schedule repair retries/refines the schedule structure when text heuristics still indicate incomplete or ambiguous schedule parsing after core parse.
    - Enrichment may still use schedule images for structural schedule repair when text parsing is incomplete or ambiguous, but no schedule color metadata is persisted or rendered.
  - Persists `discoverySource.enrichment` with `state`, `pending`, `startedAt`, `finishedAt`, `lastError`, and `performance`.
  - Merges enrichment output back into mapped builder data without intentionally clobbering existing manual schedule edits.
- **Output**: `{ ok, eventId, enrichmentState, updatedSections, performance, statuses }`. Successful no-op responses reuse the same shape; active in-flight enrichments return HTTP `202` with the current `enrichmentState` and no `updatedSections`.

### Meet Builder Data — GET/PUT `/api/meet/[eventId]`

- **Purpose**: Read/update gymnastics meet page JSON with computed builder step statuses.
- **Auth**:
  - GET: optional; enforces ownership for user-owned rows.
  - PUT: NextAuth session required; owner-only for user-owned rows.
- **GET Output**: `{ ok, eventId, title, meet_page_json, statuses }`.
- **PUT Input (JSON)**: `{ patch: object, title?: string }` (deep-merges `patch` into existing meet JSON).
- **PUT Output**: `{ ok, eventId, meet_page_json, statuses }`.
- **Meet JSON**: `meet_page_json.advancedSections` includes the discovery/builder sections used by the gymnastics page, including `meet`, `coaches`, `logistics`, and `schedule`. `advancedSections.schedule` stores public session-grid data as `days[] -> sessions[] -> clubs[]`, plus optional `venueLabel`, `supportEmail`, `notes`, `annotations`, and `assignments`. Schedule prose such as team-awards timing or senior recognition is stored in `annotations`.
- **Statuses**: Includes grouped step statuses for `Essentials`, `Operations`, `Communication`, and `Before Publish`. `Operations` now includes a `schedule` status that is `ready` when stored schedule days contain at least one usable session.

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

### Event OG Data — GET `/api/events/[id]/og-data`

- **Purpose**: Return minimal event metadata for social image rendering.
- **Auth**: None.
- **Behavior**: Loads event data by slug/id and returns only fields needed by `src/app/event/[id]/opengraph-image.tsx` (`title`, `description`, `location`, and image data URLs). This keeps database imports out of the OG image route so it can stay on Edge runtime and avoid large serverless bundles.
- **Output**: `{ title, description, location, thumbnail, attachmentDataUrl }` or `null` (404).
- **Env**: `DATABASE_URL`.

### Event Access Unlock — POST `/api/events/[id]/unlock`

- **Purpose**: Validate a private access code and grant a signed cookie so the invite unlocks without signing in.
- **Auth**: None; possession of the access code is the gate.
- **Input (JSON)**: `{ code: string }`.
- **Behavior**: Verifies the submitted code against the event's hashed `accessControl.passcodeHash`. Successful requests set an HTTP-only `event_access_<eventId>` cookie (30-day TTL) and return `{ ok: true }`. Incorrect codes return HTTP 401 with `{ error }`.
- **Env**: Optional `EVENT_ACCESS_SECRET`; defaults to `NEXTAUTH_SECRET` when unset.

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

### Dashboard Data — GET `/api/dashboard`

- **Purpose**: Return DB-only home dashboard payload for the signed-in user (no external API calls).
- **Auth**: NextAuth session required.
- **Behavior**: Resolves `nextEvent` (earliest future event excluding archived/canceled) across the caller's own events plus invited shared events (`pending` and `accepted` shares), upcoming list (up to 12), schedule snapshot counts (30 days + 7 days), RSVP snapshot (going/maybe/declined/pending + last 3 updates), setup-health flags, derived checklist items (from setup-health warnings), and drafts summary. Drafts, setup-health flags, and derived checklist items remain owner-only; invited events can still be selected as `nextEvent` and appear in `upcoming`. Uses a lightweight scalar projection from `event_history.data` (instead of returning full JSON payloads) to reduce transfer and parse cost. The dashboard history selector first tries a bounded recent window with a shorter local statement timeout, then falls back to a broader owner+shared scan if that fast path times out. If `event_metrics_cache` exists, cached travel/weather metrics are returned but never recomputed here.
- **Caching**: In-memory TTL cache (`15s`) with stale-while-refresh behavior up to `60s`, plus in-flight request coalescing per user to avoid duplicate recomputation under concurrent calls.
- **Query params**: Optional `refresh=1` bypasses the in-memory cache for the signed-in user so clients can reload immediately after creating/updating events.
- **Diagnostics**: Optional `?timing=1` adds a `timings` object to JSON and a `Server-Timing` response header.
- **Output**: `{ ok, nextEvent, snapshot, upcoming, rsvp, setupHealth, checklist, drafts, metricsCache, metricsEligibility }` where `nextEvent` and `upcoming[]` now include additive relation fields `ownership: "owned"|"invited"` and `shareStatus: "pending"|"accepted"|null`.
- **Env**: `DATABASE_URL`.

### Dashboard Next-Event Enrichment — POST `/api/dashboard/enrich-next-event`

- **Purpose**: Lazily compute cached travel + weather for the **next event only**.
- **Auth**: NextAuth session required; verifies requested `eventId` matches the owner’s next event.
- **Input (JSON)**: `{ eventId?: string, forceTravel?: boolean, originLat?: number, originLng?: number, originLabel?: string }`.
- **Origin override**: Clients may pass `originLat`/`originLng` (for example, browser geolocation) when a saved home origin is missing. The route prioritizes this request origin over stored profile origin.
- **Travel rules**: Uses Mapbox Directions API for ETA/distance. Calls only when origin + destination are available and either event starts within 72 hours or `forceTravel=true`; normal requests use a 1-hour cache, while `forceTravel=true` bypasses travel cache. When event/home coordinates are missing, the route attempts Mapbox Geocoding from location text before routing.
- **Weather rules**: Uses WeatherAPI forecast (`/v1/forecast.json`) and picks the hourly forecast point nearest the event start. Calls only when destination is available, event starts within 3 days, and cache is stale; cache TTL is 3 hours.
- **Latency behavior**: Reuses the same lightweight next-event selector as `/api/dashboard`, parallelizes travel/weather external calls when both are eligible, and applies network timeouts for geocoding/directions/weather fetches.
- **Cache**: Persists/reads `event_metrics_cache(event_id, travel_minutes, travel_distance_km, travel_updated_at, weather_summary, weather_temp, weather_updated_at)`.
- **Diagnostics**: Optional `?timing=1` adds a `timings` object to JSON and a `Server-Timing` response header.
- **Output**: `{ ok, eventId, metrics, meta }` where `metrics` contains cached/refreshed next-event values.
- **Env**: `DATABASE_URL`, `MAPBOX_ACCESS_TOKEN` (or `MAPBOX_API_KEY`), `WEATHERAPI_KEY` (or `WEATHERAPI_API_KEY`).

### Event RSVP Responses — `/api/events/[id]/rsvp`

- **Purpose**: Manage RSVP submissions and owner-side RSVP moderation for a single event.
- **Auth**:
  - `GET`: public stats for guests; includes detailed `responses` only for event owner.
  - `POST`: optional auth (guests and signed-in users can submit).
  - `PATCH` / `DELETE`: NextAuth session required and caller must own the event.
- **Input**:
  - `POST`: `{ response: "yes"|"no"|"maybe", name?: string, email?: string, firstName?: string, lastName?: string, phone?: string, message?: string }`.
  - `PATCH`: `{ response: "yes"|"no"|"maybe", target: { userId?: string, email?: string, name?: string } }`.
  - `DELETE`: `{ target: { userId?: string, email?: string, name?: string } }`.
- **Behavior**: Upserts RSVP rows by `(event_id,user_id)` when signed in, otherwise `(event_id,email)` or anonymous `(event_id,lower(name))` fallback. Owner `GET` includes full response rows ordered by `created_at desc`.
- **Output**:
  - `GET`: `{ ok, stats, numberOfGuests, remaining, filled }` (+ `responses` for owners).
  - `POST` / `PATCH`: `{ ok: true }`.
  - `DELETE`: `{ ok: true, deleted: number }`.
- **Diagnostics**: Optional `?timing=1` on any method adds a `timings` object and `Server-Timing` header.
- **Schema note**: Runtime schema creation was removed from request path; table/index bootstrap is handled by manual SQL migration `prisma/manual_sql/20260305_rsvp_bootstrap.sql`.

### Registry Add — POST `/api/registry/add`

- **Purpose**: Create or update a wedding registry item for a given event (used by the couple in the wedding customize UI; no PA-API).
- **Auth**: NextAuth session required (caller must be signed in; current implementation does not yet enforce event ownership on the server).
- **Input (JSON)**: `{ id?: string, eventId: string, title: string, affiliateUrl: string, imageUrl: string, price?: string, quantity?: number, category?: string, notes?: string }`.
- **Behavior**: Upserts into `registry_items` keyed by UUID `id` (when omitted, a new item is created). `affiliateUrl` is normalized with `decorateAmazonUrl` using the `"wedding"` category and `viewer="guest"` so Amazon links inherit the configured affiliate tag. Quantity defaults to 1 and is clamped to at least 1.
- **Output**: The stored registry item row: `{ id, event_id, title, affiliate_url, image_url, price, quantity, claimed, category, notes, created_at, updated_at }`.
- **Env**: Uses the same Amazon affiliate envs as other flows (`NEXT_PUBLIC_AFFILIATE_AMAZON_*`, `NEXT_PUBLIC_AFFILIATE_AMAZON_TAG`) via `decorateAmazonUrl`. Requires `DATABASE_URL` for Postgres.

### Registry List — GET `/api/registry/list`

- **Purpose**: Load all registry items for a specific event so couples (and guest pages) can render the registry.
- **Auth**: None (public read; possession of the event link is the gate, consistent with public event pages).
- **Query params**: `eventId` (string, required; matches the `event_id` stored in `registry_items`).
- **Output**: JSON array of items: `Array<{ id, event_id, title, affiliate_url, image_url, price, quantity, claimed, category, notes, created_at, updated_at }>` ordered by `created_at asc, id asc`.
- **Env**: `DATABASE_URL` (Postgres).

### Registry Claim — POST `/api/registry/claim`

- **Purpose**: Allow guests to mark gifts as purchased/claimed so other guests see remaining quantities.
- **Auth**: None (public action tied to the registry item link; no account required).
- **Input (JSON)**: `{ itemId: string, guestName?: string, quantity?: number, message?: string }`.
- **Behavior**: Atomically increments `claimed` on `registry_items` using a `claimed + quantity <= quantity` guard to prevent over-claiming; if the guard fails (all gifts already claimed), returns HTTP 409. On success, inserts a row into `registry_claims` with the guest name, quantity, and optional message.
- **Output**: On success: `{ ok: true, item, claim }` where `item` is the updated item row and `claim` is `{ id, item_id, guest_name, quantity, message, created_at }`. On conflict or error, returns `{ error }`.
- **Env**: `DATABASE_URL` (Postgres).

### Registry Autofill — POST `/api/registry/autofill`

- **Purpose**: Given an Amazon product URL (or SiteStripe link), infer basic metadata so the registry form can be auto-fillled.
- **Auth**: None.
- **Input (JSON)**: `{ url: string }`.
- **Behavior**: Extracts ASIN from the URL when present, builds a best-guess image URL using the Amazon CDN, then attempts a single HTML fetch to read `<meta property="og:title">`, `<title>`, `<meta property="og:image">`, and the first currency-formatted price (e.g., `$349.00`). Fetch failures are tolerated and fall back to an ASIN-only image when possible.
- **Output**: `{ asin: string|null, title: string|null, imageUrl: string|null, price: string|null }`.
- **Env**: None specific beyond general egress; uses a lightweight browser-like `User-Agent` for the HTML fetch.

---

### History — GET/POST `/api/history`, GET/PATCH/DELETE `/api/history/[id]`

- **Purpose**: Store and manage extracted events/history items for users.
- **Auth**:
  - List (GET `/api/history`) requires session to return user items; returns `{ items: [] }` when unauthenticated.
  - Create (POST `/api/history`) resolves the canonical app user from the signed-in session email and attaches the row to that `users.id`.
  - Signed-in creates fail closed with HTTP `409` / `{ error: "Unable to resolve signed-in account" }` when the session cannot be resolved to a DB user. The route no longer silently falls back to anonymous writes for signed-in dashboard/customizer saves.
  - Read single (GET `/api/history/[id]`) is public.
  - Update title (PATCH) and Delete (DELETE) require session and ownership.
- **Input**:
  - GET `/api/history` query params:
    - `limit` (optional, `1-200`, default `40`).
    - `view` (optional): `"summary" | "calendar" | "sidebar" | "full"` (default `"summary"`).
    - `time` (optional): `"all" | "upcoming" | "past"` (default `"all"`). `upcoming` keeps drafts and rows without a parseable start time, while `past` returns only non-draft rows whose saved start parses before `now()`.
  - POST `/api/history`: `{ title?: string, data?: any }`.
  - PATCH `/api/history/[id]`: Either `{ title: string }` or `{ category: string }` or `{ data: object }` to shallow-merge into the JSON `data` (e.g., to fix the saved `category`).
- **Output**:
  - GET list: `{ items: Array<HistoryRow> }`.
    - Includes invited shared events for the user when the share is `pending` or `accepted` (annotated with `data.shared=true`, `data.ownership="invited"`, `data.shareStatus`, and default category `Shared events`).
    - Response payload is view-dependent:
      - `view=summary`: only lightweight `category/shared/sharedOut/ownership/shareStatus` flags.
      - `view=sidebar`: compact fields used by the left sidebar (`status`, `description`, `startAt/start/startISO`, `ownership`, `shareStatus`, compact `event`, compact `signupForm.responses`).
      - `view=calendar`: same as standard lightweight mode with heavy blobs removed.
      - `view=full`: full `data` JSON (includes heavy fields when present).
  - GET single: `HistoryRow` or `{ error }` with 404.
  - POST: created `HistoryRow` `{ status: 201 }`.
  - PATCH: updated `HistoryRow`.
  - DELETE: `{ ok: true }`.
- **Notes**:
  - When debugging future events in Postgres, filter on `event_history.data->>'startAt'` or `event_history.data->>'startISO'`, not `event_history.created_at`. `created_at` is save time, not event date.
  - PATCH now supports combined title + data updates in one request and preserves full template state (themes, fonts, advanced sections) when present. When `data` contains `themeId|theme|fontId|fontSize|advancedSections`, the route performs a full replace/merge that overwrites previous theme/font fields instead of a shallow merge, ensuring edited gymnastics/sports templates retain the saved theme color and typography. Cache for the owner’s history list is invalidated after successful update.
  - The `view=sidebar&time=all` fast path is intentionally capped to a smaller bounded candidate window for responsiveness on large accounts. It now uses a lightweight owner+shared union (including pending invites), uses a shorter local statement timeout than the pool default, and falls back to the simpler owner/shared history reads if the fast path times out before finally degrading to HTTP 204 with `X-History-Degraded: statement-timeout` when nothing can be returned. Cache still wins when available, and stale cache still wins on timeout.
  - Custom builders (e.g., baby showers) now persist their selected `templateBackgroundCss`/`header*` fields alongside `titleStyle` when publishing so the public view can rehydrate the same hero gradient, card background, and section layout that was shown in the editor.
  - Gymnastics template publish flow posts `themeId`, full `theme` object, `fontId`, `fontFamily`, and `fontSizeClass` plus all advanced sections (`roster`, `meet`, `practice`, `logistics`, `gear`, `volunteers`, `announcements`) into `event_history.data`. Editing uses `/api/history/[id]` to reload those fields so the preview and the saved event stay visually identical (section headings inherit the chosen font; background/accents come from the saved theme palette).
  - Football-season template workflow (customize → publish → view/edit):
    - Customize: user picks theme, font, size, hero, headline, date/time, venue, city/state, stadium address, details, RSVP/attendance copy, and fills advanced sections (games, practice, roster, logistics, gear, volunteers). Google Fonts sheet (`fontHref`) is injected for the selected font.
    - Publish/Patch: payload saves `themeId` + full `theme`, `fontId`, `fontFamily`, `fontSizeClass`, `fontHref`, `templateConfig` (detail field labels + attendance copy), hero image (blob-safe conversion for blobs), `advancedSections`, `customFields` (detail grid + advancedSections), `extra`, `address/location` lines, and RSVP settings into `event_history.data`.
    - View/Edit: SimpleTemplateView loads `fontHref` to reapply the exact heading face, uses saved `theme`/palette for gradients, restores headline size/family, and renders location/address + detail grid from `templateConfig`/`customFields`. Editing an existing football event revalidates theme/font/size and keeps all published fields intact.

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

### User Onboarding — GET/PUT `/api/user/onboarding`

- **Purpose**: Manage persona-driven onboarding and per-user feature visibility used across dashboard, create menus, and template pickers.
- **Auth**: NextAuth session required.
- **GET Output**: `{ required, completed, persona, promptDismissedAt, visibleTemplateKeys, dashboardLayout }`.
- **PUT Input (JSON)**:
  - Complete onboarding: `{ action: "complete", persona: "parents_moms"|"organizers"|"couples"|"sports_staff"|"educators"|"church_community"|"business_teams"|"general", visibleTemplateKeys?: string[] }`
  - Dismiss one-time soft prompt: `{ action: "dismiss_prompt" }`
- **PUT Output**: `{ ok: true, onboarding }` where `onboarding` matches GET output.
- **Behavior**:
  - Completing onboarding sets `users.onboarding_required=false`, stores `onboarding_persona`, sets `onboarding_completed_at`, and writes `feature_visibility` JSON metadata.
  - Dismiss stores `onboarding_prompt_dismissed_at=now()` and keeps onboarding optional for existing users.

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
- **Output**: `{ user: { id, email }|null, sessionEmail, rawSessionUserId, resolvedUserId, mineCount, recentCount, recentAnonymousCount, mine: HistoryRow[], recent: HistoryRow[], recentAnonymous: HistoryRow[] }`.

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
  - Dependency compatibility: keep `nodemailer` on major v6 (`^6.10.1`) while using `next-auth@4.x` to satisfy peerOptional ranges in npm/Vercel installs.
- **Supabase Auth (password reset bridge)**
  - `SUPABASE_URL`: Supabase project URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: Required for server-side recovery link generation and user lookup during reset completion.
- **Google OAuth/Calendar**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- **Microsoft OAuth/Graph**
  - `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID` (default `common`).
  - Token refresh requests include scopes: `offline_access https://graph.microsoft.com/Calendars.ReadWrite`.
- **Resend (email campaigns + password reset)**
  - `RESEND_API_KEY`: Required for admin bulk email campaigns via `/api/admin/campaigns/send`; also used by `/api/auth/forgot` for password reset delivery.
  - `RESEND_FROM_EMAIL`: Optional default sender (falls back to no-reply/onboarding sender when omitted).
- **GCP Vision**
  - Prefer inline: `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS_BASE64`.
  - Or ADC file path: `GOOGLE_APPLICATION_CREDENTIALS`.
- **OpenAI (optional OCR fallback)**
- `OPENAI_API_KEY`, `LLM_MODEL` (default `gpt-5.1-mini`).
- **AWS SES (email senders)**
  - `SES_FROM_EMAIL_NO_REPLY` e.g. `Envitefy <no-reply@envitefy.com>` (system mail; password reset now prefers Resend)
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

- 2026-03-20: **Dashboard home**: The main dashboard now calls `GET /api/dashboard` when signed in (it previously never loaded server data, so upcoming events stayed empty). `GET /api/dashboard?refresh=1` skips the server response cache. The left sidebar loads `/api/history?view=sidebar` on sign-in so Invited/My Events counts survive refresh and navigation. To avoid Postgres `statement_timeout` (default pool `PG_STATEMENT_TIMEOUT_MS` 15s) on large accounts, the dashboard now uses a bounded recent-window scan first, then falls back to the simpler owner/shared history reads if that fast path times out, so older upcoming/draft rows can still surface without bringing back the old 800-row expansion. The dashboard history read uses a slim dashboard-specific JSON projection instead of the broader history payload, and both the dashboard and sidebar hot paths now use shorter local statement timeouts so they degrade before hitting the pool-wide 15s limit. The sidebar `view=sidebar&time=all` path now bypasses the generic history projection and uses a dedicated summary loader (`listSidebarHistoryForUserFast`) built from lightweight own rows plus accepted shared rows, trims shared sign-up response projection to the current user, and keeps the candidate window intentionally capped for responsiveness while still falling back to the simpler owner/shared history reads before returning HTTP 204 or stale cache on timeout. The client now keeps prior dashboard/sidebar state on transient failures and avoids clearing sidebar rows on cache revalidation. `/api/dashboard` still returns a degraded empty payload instead of HTTP 500 when a statement timeout occurs. Ensure `idx_event_history_user_created_id` from `prisma/manual_sql/20251130_add_event_history_user_created_id_idx.sql` is applied for best performance.
- 2026-03-21: **Dashboard + invited-event visibility**: `GET /api/dashboard` now considers both owned events and invited shared events (`pending` and `accepted`) when resolving `nextEvent` and the `upcoming` list, and returns additive relation metadata on each event (`ownership`, `shareStatus`). `/api/history?view=sidebar&time=all` now uses the same owner+shared model instead of the old owner-only fast path, so invited events reliably appear in the left sidebar even when opened from the event page first. Sidebar compact payloads now include `startAt` plus the same relation metadata so upcoming/past bucketing matches dashboard/event-page date parsing. Share create/accept/remove and core history/event mutation routes now invalidate the dashboard response cache alongside the history cache so Home refreshes immediately after invitation-state changes.
- 2026-03-01: Added gymnastics meet discovery flow: `POST /api/ingest?mode=meet_discovery` (upload or URL to scaffold event), `POST /api/parse/[eventId]` (OpenAI-first strict parse with one retry, Gemini fallback), and `GET/PUT /api/meet/[eventId]` (meet JSON + grouped builder statuses). Discovery now supports URL readable-text extraction plus linked same-domain PDF/image assets and stores parse/source audit metadata.
- 2026-02-28: Dashboard next-event enrichment now uses Mapbox Directions + Geocoding fallback for travel ETA/distance and WeatherAPI (`WEATHERAPI_KEY` or `WEATHERAPI_API_KEY`) for nearest-time hourly forecast within a 3-day window. Updated `/api/dashboard` eligibility flags and `/api/dashboard/enrich-next-event` env requirements accordingly.
- 2026-02-28: `/api/dashboard/enrich-next-event` now accepts optional request-origin coordinates (`originLat`/`originLng` + `originLabel`) so clients can calculate travel from current device location when no saved home origin exists.
- 2026-02-28: Added dashboard APIs `GET /api/dashboard` (DB-only home tiles payload) and `POST /api/dashboard/enrich-next-event` (lazy next-event-only travel/weather enrichment with strict window checks + `event_metrics_cache` TTLs: travel 1h, weather 3h). Main dashboard now renders immediately from DB data and enriches only the next event after initial load.
- 2026-02-28: OCR latency hardening: `/api/ocr` now runs with a total request-time budget, stage-level timing logs, and fast-mode gating that skips optional rewrite/deep schedule LLM passes unless requested. Added `OPENAI_OCR_FAST_MODEL` support for fast scans, optional `turbo=1` parallel provider race (OpenAI+Google), and `timing=1` debug payloads. Main dashboard/demo OCR calls are set to full-quality mode with `/api/ocr?fast=0`.
- 2026-02-16: Added Supabase Auth bridge for password reset: `/api/auth/forgot` now generates Supabase recovery links when Supabase envs are configured (with fallback to local `password_resets` tokens), and `/api/auth/reset` accepts Supabase recovery access tokens to update the app's password hash.
- 2026-02-16: Password reset delivery (`POST /api/auth/forgot`) now sends through Resend first (`RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`) with SMTP fallback. Updated agent/env docs to remove AWS SES as a requirement for reset-email delivery.
- 2026-02-15: **OG image + deploy guardrails**: Documented `GET /api/events/[id]/og-data` as the dedicated metadata agent for OG rendering so `/event/[id]/opengraph-image` can remain Edge/lightweight and avoid oversized serverless bundles. Also documented dependency pin guidance: with `next-auth@4.x`, keep `nodemailer` on `^6.10.1` to prevent Vercel npm peer-resolution failures.
- 2026-01-XX: **Football roster editing**: Resolved keyboard focus loss inside `/event/football-season/customize` by mirroring the Passcode input pattern—each roster text/textarea uses a local `useState`/`onBlur` commit (`src/components/event-templates/FootballSeasonTemplate.tsx`) while the parent editor now clones only the touched field/state before saving (`src/app/event/football-season/customize/page.tsx`) so remounts disappear. Document this walkthrough when future roster inputs misbehave.
- 2026-02-XX: **Cheerleading design polish**: The cheer edit preview now waits for saved data (no more flash of the default template), the Design tab auto-expands its theme grid, and the palette list is capped at ~40vh so typography stays visible while scrolling; publishing now requires a street address and the public view renders Events & Competitions, Roster, Logistics, and Uniform/Props from the advanced sections so every filled field stays visible.
- 2026-02-XX: **Soccer match coach view**: Expanded `/event/soccer/customize` detail fields (meeting point, travel plan, snack duty, keeper rotation, training focus, equipment, weather plan, staff contact, etc.) with meaningful prefills, added a loading guard so edits no longer flash the default template, and kept the Design panel expanded like other sports templates so every filled field publishes cleanly.
- 2026-02-XX: **Soccer lineup + snack sign-ups**: `/event/soccer/customize` now publishes the new lineup grid, snacks/hydration volunteer slots, compact roster, and kit checklist (all defined in `SoccerTemplate.tsx`). `SimpleTemplateView.tsx` renders those sections (matches nav, lineup pitch, compact roster/practice grid, snacks cards) and pipes snack sign-ups through the existing `/api/history/[id]/volunteer` route, which also keeps `advancedSections.snacks` in sync so the public page updates immediately. Soccer publish flow now enforces a required address and copies snack slots into `advancedSections.volunteers` so the volunteer endpoint can claim them.
- 2026-02-XX: **Soccer attendance tracking**: The soccer template’s RSVP slot was rebranded as “Attendance” (menu + preview) with helper copy that explains roster-linked responses. `SimpleTemplateView` already surfaces the roster dropdown for attendance submissions; now `/event/soccer/customize` ships that copy via `templateConfig.rsvpCopy`, so attendance is the default wording everywhere.
- 2026-03-XX: **Dance design height**: `/event/dance-ballet/customize` now opens the Design tab with the theme list expanded and limits the theme grid to ~40vh so typography previews stay visible while scrolling, matching the experience on other templates that show the swatches immediately.
- 2025-11-05: OCR descriptions no longer repeat the title by default. Prompt now instructs the LLM to produce a standalone, sentence-cased line that prefers venue names over street addresses. Exception: when the server builds a deterministic one‑liner (e.g., "Join <Title> on <Date> at <Time>"), we intentionally keep the title and skip stripping to preserve the natural invite phrasing present on many flyers. We also sentence‑case descriptions after cleanup to avoid lowercase starts like "on November…".
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

- 2025-12-XX: **New Event Templates**: Added comprehensive Football Season page (`/event/football-season/customize`) with 6 advanced sections: Game Schedule (home/away games with opponent, date/time, venue, results), Practice Schedule (weekly blocks with equipment level, position groups, focus areas), Team Roster (players with jersey numbers, positions, parent contacts, medical notes), Travel & Logistics (bus times, weather policy), Equipment Checklist (separate lists for games vs practice), and Parent Volunteers (chain gang, concessions, etc.). Enhanced Football Practice page (`/event/football-practice/customize`) with 16 essential fields including end time, arrival time, practice type, drop-off/pickup locations, hydration, weather policy, and emergency contacts. Both pages include 8-12 team color themes. Navigation updated in `TopNav.tsx` and `navigation-config.tsx` to include both templates.
- 2025-10-06: **UI Enhancement**: Event creation modal now supports custom categories with automatic icon assignment. Users can select from preset categories (with emoji icons) or add their own custom category via "➕ Add your own..." option. Icons are intelligently assigned based on category keywords (e.g., 🎂 for birthdays, 💍 for weddings, 🩺 for medical appointments).
- 2025-10-06: Default LLM model upgraded to `gpt-5.1` for best OCR accuracy with cursive/decorative fonts. Users can override with `LLM_MODEL=gpt-5.1-mini` for faster, lower-cost processing when high accuracy is not critical.
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
