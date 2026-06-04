# Envitefy Concierge V2 Implementation Report

Date: 2026-06-04

## Executive Summary

Implemented the first coherent Concierge V2 vertical slice plus the second operational slice: feature flags, additive canonical graph migration, deterministic natural-language parser, authenticated Concierge V2 APIs, apply-draft persistence, mobile-first `/concierge-v2` builder UI, public event page v2 sections, RSVP answer storage, guest Smart Form responses, guest Volunteer Signup claims, owner manual payment status updates, owner operations UI, tests, and handoff docs.

Feature-flagged by `ENABLE_CONCIERGE_V2` plus capability flags for schedule hub, smart forms, volunteer signup, manual payments, OCR imports, team/class hub, resource planning, and reminder engine.

Stubbed/provider-dependent: AI provider selection for V2, OCR import review, reminder delivery, volunteer unclaim/reminder actions, and payment provider processing. The current payment tracker is manual-only, but owners can mark manual payment requests as unpaid, paid, waived, or refunded.

## Commands Run

- `node --test src/lib/concierge-v2/core.test.mjs`: pass.
- `node --test src/lib/concierge-v2/operations-shape.test.mjs`: pass.
- `node --check src/lib/concierge-v2/core.mjs`: pass.
- `node_modules\\.bin\\biome.cmd lint <touched files>`: pass.
- `node_modules\\.bin\\tsc.cmd --noEmit`: fail on existing repo-wide TypeScript errors. Representative first errors:
  - `.next/types/app/api/creation/threads/[id]/route.ts(244,7): Type ... does not satisfy the constraint 'ParamCheck<RouteContext>'.`
  - `ai-studio-code-samples/ethereal-invitations/vite.config.ts(1,25): Cannot find module '@tailwindcss/vite'.`
  - `src/app/api/admin/marketing-campaigns/[runId]/captions/regenerate/route.ts(15,60): Property 'runDir' is missing.`
  - `src/app/event/[id]/page.tsx(3348,15): Type 'string | null' is not assignable to type 'string'.`
  - `src/lib/meet-discovery/core.ts(858,11): Cannot find name 'ScheduleColorTarget'.`
- `npm run lint -- <touched files>`: fail because the script runs `biome lint .` before the supplied paths; failures are unrelated existing sample-app/repo issues such as `ai-studio-code-samples/ethereal-invitations/src/components/FormalSkin.tsx` comment text and unused imports.
- VS Code diagnostics linter:
  - Old documented path failed with `Cannot find module '...airizom.chat-to-cli-0.499.1\\scripts\\vscode-lint.js'`.
  - Current extension path failed with `Bridge provider context is missing. Set CLI_PROVIDER_ID (provider id) or CLI_BRIDGE_INFO_FILE (explicit bridge info path).`
- In-app browser smoke: opened `http://localhost:3000/concierge-v2`; current unauthenticated browser session redirected to `http://localhost:3000/` and rendered the existing signed-out landing page. Builder UI still needs a signed-in manual smoke test.

## Database Changes

Migration created: `prisma/manual_sql/20260604_add_concierge_v2_foundation.sql`

Tables added: `workspaces`, `programs`, `event_series`, `event_occurrences`, `event_pages`, `concierge_sessions`, `concierge_drafts`, `smart_forms`, `form_fields`, `form_responses`, `volunteer_boards`, `volunteer_slots` with atomic `claimed_quantity`, `volunteer_claims`, `payment_requests`, `payments`, `message_templates`, `reminders`, `message_campaigns`, `message_deliveries`, `source_documents`, `extracted_items`, `checklist_items`, `calendar_feeds`, `integration_connections`, `sync_jobs`, and `audit_logs`.

Existing table changed: `rsvp_responses` now has `answers_json`, `adult_count`, `kid_count`, and `allergy_notes`.

Indexes added: canonical lookup indexes for workspaces/programs/series/occurrences/pages, concierge sessions/drafts, forms/responses, volunteer boards/slots/claims, payments, reminders/messages, imports, checklist, feeds, integrations, sync jobs, audit logs, `rsvp_responses.answers_json` GIN, a unique `form_fields(form_id, field_key)` index, a unique active volunteer claim per slot/email index, and an `event_history` Concierge V2 program expression index.

Backfill performed: no legacy event graph backfill. The migration includes an idempotent `volunteer_slots.claimed_quantity` sync from existing active `volunteer_claims`.

Owner still needs to run the migration against each target database.

## API Routes And Server Actions

- `POST /api/concierge/parse`: authenticated, parses text into a Concierge V2 draft.
- `GET /api/concierge/sessions`: authenticated, lists recent Concierge V2 sessions for the user.
- `POST /api/concierge/sessions`: authenticated, creates a parsed Concierge V2 session.
- `GET /api/concierge/sessions/[id]`: authenticated, reads one owned Concierge V2 session.
- `POST /api/concierge/sessions/[id]/apply`: authenticated, applies an owned draft into canonical graph rows and a public `event_history` page.
- `GET /api/concierge/events/[id]/operations`: authenticated owner-only operations summary for forms, volunteer claims, and payment requests.
- `POST /api/concierge/events/[id]/forms/[formId]/responses`: public/optional-session Smart Form response submission with required-field validation.
- `POST /api/concierge/events/[id]/volunteer-slots/[slotId]/claim`: public/optional-session volunteer slot claim with capacity and duplicate-email guards.
- `PATCH /api/concierge/events/[id]/payment-requests/[paymentRequestId]/status`: authenticated owner-only manual payment status update.
- `POST /api/events/[id]/rsvp`: changed to store RSVP V2 answers and counts.
- `GET /api/events/[id]/rsvp`: changed so owners receive RSVP V2 answer fields.

## UI Routes And Components

- `src/app/concierge-v2/page.tsx`: feature-flagged entry page for Concierge V2.
- `src/app/concierge-v2/ConciergeV2Client.tsx`: premium mobile-first builder with examples, detected mode, draft sections, edit fields, loading/error states, and publish result link.
- `src/app/concierge-v2/events/[id]/ops/page.tsx`: owner-only operations route for generated forms, volunteer claims, and manual payments.
- `src/app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx`: premium mobile-first host operations surface with summary cards and payment status actions.
- `src/components/concierge/ConciergePublicOperations.tsx`: public Smart Form, Volunteer Signup, Payment Tracker, Checklist, and Reminder Timeline interaction sections.
- `src/components/concierge/ConciergeEventWebsite.tsx`: changed to render v2 schedule, forms, volunteer signup, manual payment, checklist, and reminder sections.
- `src/app/event/[id]/page.tsx`: changed only in the concierge event page branch to extract and pass v2 public sections and expose an owner ops link.

## Design QA Notes

- Components changed: new Concierge V2 builder cards/inputs/action bar, existing concierge public event page cards/sections.
- Pages updated: `/concierge-v2` and the existing `/event/[id]` concierge public renderer.
- Mobile improvements: stacked builder sections, sticky publish bar, large tap targets, responsive public section grids.
- Accessibility improvements: semantic buttons/sections, aria labels on icon-only controls inherited from existing renderer, clear loading/error states.
- Remaining design issues: reminder timeline is still display-only because delivery/list/cancel provider work is not wired; payment collection remains manual/providerless.
- Screens needing manual review: signed-in `/concierge-v2` builder, published v2 public event page, owner ops page, owner RSVP responses with v2 answers, mobile public page sections.

## Environment Variables Needed

- Required for app/database: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` or `AUTH_SECRET`.
- Optional OAuth/calendar: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID`, Apple OAuth vars.
- Optional AI/OCR/maps: `OPENAI_API_KEY`, OpenAI model vars, Gemini/Google AI vars, Google credentials vars, Google Maps/Places vars.
- Optional email/anti-abuse: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
- Concierge V2 flags: `ENABLE_CONCIERGE_V2`, `ENABLE_SCHEDULE_HUB`, `ENABLE_SMART_FORMS`, `ENABLE_VOLUNTEER_SIGNUPS`, `ENABLE_MANUAL_PAYMENTS`, `ENABLE_OCR_IMPORTS`, `ENABLE_TEAM_CLASS_HUB`, `ENABLE_RESOURCE_PLANNING`, `ENABLE_REMINDER_ENGINE`.

## External Setup

- DB migration: run the new manual SQL migration in `prisma/manual_sql/20260604_add_concierge_v2_foundation.sql`.
- AI provider: no new V2 provider key is required for the fallback parser; configure `OPENAI_API_KEY` before replacing fallback parsing with model-backed extraction.
- Storage/OCR: no new storage bucket was added in this slice.
- Email/SMS: reminder records are stored but delivery is not enabled; configure email/SMS providers before dispatch work.
- Payments: no Stripe/payment provider was implemented; manual tracking only.
- Cron/jobs/webhooks: no new cron or webhook was enabled.

## Manual QA Checklist

- Enable `ENABLE_CONCIERGE_V2=true` locally.
- Create a birthday prompt in `/concierge-v2`, publish, and open the public event page.
- Create the gymnastics season example, verify recurring practice materialization and meet/team dinner sections.
- Create the spirit week example and verify five daily schedule cards.
- Submit RSVP as a guest and confirm owner RSVP response includes `answersJson`, `adultCount`, `kidCount`, and `allergyNotes` when provided.
- Submit a generated Smart Form and confirm it appears on `/concierge-v2/events/[eventHistoryId]/ops`.
- Claim a generated volunteer slot as a guest and confirm capacity/claimed counts update in ops.
- Mark a manual payment request paid, waived, refunded, and unpaid from the ops route.
- Verify public v2 sections render on mobile and desktop without guest login.
- Verify calendar links still appear for the primary event time.
- Confirm payment sections clearly stay manual/providerless and do not imply Stripe/Venmo processing.

## Known Limitations And Next Tasks

- V2 parser is deterministic fallback only and does not call OpenAI yet.
- Smart Form response editing/export and Volunteer Signup unclaim/reminder actions remain to be built.
- Manual payment provider processing is not implemented; host status tracking is manual only.
- Reminder records are created as drafts, but no scheduler/dispatcher is wired.
- OCR import and source document review UI remain to be built.
- Legacy event backfill into canonical graph rows is documented but not run.
- Rich host dashboard surfaces for RSVP Board 2.0, reminder delivery, forms export, volunteers, payments, and schedule hub are the next practical slice.
