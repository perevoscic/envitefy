# Envitefy Concierge V2 Implementation Report

Date: 2026-06-04

## Executive Summary

Implemented the first coherent Concierge V2 vertical slice plus the next operational slices: feature flags, additive canonical graph migration, deterministic natural-language parser, authenticated Concierge V2 APIs, apply-draft persistence, mobile-first `/concierge-v2` builder UI, public event page v2 sections, owner Schedule Hub, owner RSVP Board 2.0 with CSV export, RSVP answer storage, guest Smart Form responses, guest Volunteer Signup claims, owner manual payment status updates, owner reminder queue preview/dry-run/cancel controls, owner operations UI, tests, and handoff docs.

Feature-flagged by `ENABLE_CONCIERGE_V2` plus capability flags for schedule hub, smart forms, volunteer signup, manual payments, OCR imports, team/class hub, resource planning, and reminder engine.

Stubbed/provider-dependent: AI provider selection for V2, OCR import review, real reminder delivery, volunteer unclaim/reminder actions, and payment provider processing. Reminder dry runs record `message_deliveries` rows with provider `stub`; no email/SMS provider is called. The current payment tracker is manual-only, but owners can mark manual payment requests as unpaid, paid, waived, or refunded.

## Commands Run

- `node --test src/lib/concierge-v2/core.test.mjs`: pass.
- `node --test src/lib/concierge-v2/operations-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/reminders-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/schedule-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/rsvp-board-shape.test.mjs`: pass.
- `node --check src/lib/concierge-v2/core.mjs`: pass.
- `node_modules\\.bin\\biome.cmd lint <touched files>`: pass.
- `node_modules\\.bin\\tsc.cmd --noEmit`: fail on existing repo-wide TypeScript errors. Representative first errors:
  - `.next/types/app/api/creation/threads/[id]/route.ts(244,7): Type ... does not satisfy the constraint 'ParamCheck<RouteContext>'.`
  - `ai-studio-code-samples/ethereal-invitations/vite.config.ts(1,25): Cannot find module '@tailwindcss/vite'.`
  - `src/app/api/admin/marketing-campaigns/[runId]/captions/regenerate/route.ts(15,60): Property 'runDir' is missing.`
  - `src/app/event/[id]/page.tsx(3366,15): Type 'string | null' is not assignable to type 'string'.`
  - `src/lib/meet-discovery/core.ts(858,11): Cannot find name 'ScheduleColorTarget'.`
- `npm run lint -- <touched files>`: fail because the script runs `biome lint .` before the supplied paths; failures are unrelated existing sample-app/repo issues such as `ai-studio-code-samples/ethereal-invitations/src/components/FormalSkin.tsx` comment text and unused imports.
- VS Code diagnostics linter:
  - Old documented path failed with `Cannot find module '...airizom.chat-to-cli-0.499.1\\scripts\\vscode-lint.js'`.
  - Current extension path failed with `Bridge provider context is missing. Set CLI_PROVIDER_ID (provider id) or CLI_BRIDGE_INFO_FILE (explicit bridge info path).`
- In-app browser smoke: opened unauthenticated owner routes including `http://localhost:3000/concierge-v2/events/smoke-test/schedule` and `http://localhost:3000/concierge-v2/events/smoke-test/rsvp`; both redirected to `http://localhost:3000/` as expected without an owner session. Signed-in owner UI still needs manual smoke testing.

## Database Changes

Migration created: `prisma/manual_sql/20260604_add_concierge_v2_foundation.sql`

Tables added: `workspaces`, `programs`, `event_series`, `event_occurrences`, `event_pages`, `concierge_sessions`, `concierge_drafts`, `smart_forms`, `form_fields`, `form_responses`, `volunteer_boards`, `volunteer_slots` with atomic `claimed_quantity`, `volunteer_claims`, `payment_requests`, `payments`, `message_templates`, `reminders`, `message_campaigns`, `message_deliveries` with dry-run `metadata_json`, `source_documents`, `extracted_items`, `checklist_items`, `calendar_feeds`, `integration_connections`, `sync_jobs`, and `audit_logs`.

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
- `GET /api/concierge/events/[id]/rsvps`: authenticated owner-only RSVP Board 2.0 summary with counts, answers, and guest detail rows.
- `GET /api/concierge/events/[id]/rsvps/export`: authenticated owner-only RSVP CSV export.
- `PATCH /api/concierge/events/[id]/rsvps/[rsvpId]`: authenticated owner-only RSVP status update by response row id.
- `GET /api/concierge/events/[id]/schedule`: authenticated owner-only Schedule Hub summary with series, occurrences, counts, and conflicts.
- `POST /api/concierge/events/[id]/schedule`: authenticated owner-only one-off schedule item creation.
- `PATCH /api/concierge/events/[id]/schedule/occurrences/[occurrenceId]`: authenticated owner-only occurrence move/edit/cancel/restore/status update.
- `GET /api/concierge/events/[id]/reminders`: authenticated owner-only reminder queue summary with audience counts and recent dry-run records.
- `GET /api/concierge/events/[id]/reminders/[reminderId]/preview`: authenticated owner-only reminder preview.
- `POST /api/concierge/events/[id]/reminders/[reminderId]/dry-run`: authenticated owner-only dry-run delivery recording; no provider call.
- `PATCH /api/concierge/events/[id]/reminders/[reminderId]/status`: authenticated owner-only reminder cancel/restore/status update.
- `POST /api/events/[id]/rsvp`: changed to store RSVP V2 answers and counts.
- `GET /api/events/[id]/rsvp`: changed so owners receive RSVP V2 answer fields.

## UI Routes And Components

- `src/app/concierge-v2/page.tsx`: feature-flagged entry page for Concierge V2.
- `src/app/concierge-v2/ConciergeV2Client.tsx`: premium mobile-first builder with examples, detected mode, draft sections, edit fields, loading/error states, and publish result link.
- `src/app/concierge-v2/events/[id]/schedule/page.tsx`: owner-only Schedule Hub route backed by canonical `event_occurrences`.
- `src/app/concierge-v2/events/[id]/schedule/ConciergeV2ScheduleHubClient.tsx`: premium mobile-first agenda/list/conflicts UI with add, edit, move, cancel, and restore controls.
- `src/app/concierge-v2/events/[id]/rsvp/page.tsx`: owner-only RSVP Board 2.0 route backed by `rsvp_responses`.
- `src/app/concierge-v2/events/[id]/rsvp/ConciergeV2RsvpBoardClient.tsx`: premium mobile-first host board with summary cards, filters, guest detail panel, status updates, reminder handoff, and CSV export.
- `src/app/concierge-v2/events/[id]/ops/page.tsx`: owner-only operations route for generated forms, volunteer claims, and manual payments.
- `src/app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx`: premium mobile-first host operations surface with summary cards, payment status actions, and reminder queue controls.
- `src/components/concierge/ConciergePublicOperations.tsx`: public Smart Form, Volunteer Signup, Payment Tracker, Checklist, and Reminder Timeline interaction sections.
- `src/components/concierge/ConciergeEventWebsite.tsx`: changed to render v2 schedule, forms, volunteer signup, manual payment, checklist, and reminder sections.
- `src/app/event/[id]/page.tsx`: changed only in the concierge event page branch to extract and pass v2 public sections and expose an owner ops link.

## Design QA Notes

- Components changed: new Concierge V2 builder cards/inputs/action bar, existing concierge public event page cards/sections.
- Pages updated: `/concierge-v2` and the existing `/event/[id]` concierge public renderer.
- Mobile improvements: stacked builder sections, sticky publish bar, large tap targets, responsive public section grids.
- Accessibility improvements: semantic buttons/sections, aria labels on icon-only controls inherited from existing renderer, clear loading/error states.
- Remaining design issues: public reminder timeline is display-only, while owner ops supports preview/dry-run/cancel; payment collection remains manual/providerless; Schedule Hub has agenda/list/conflict views but not a full calendar grid yet.
- Screens needing manual review: signed-in `/concierge-v2` builder, published v2 public event page, owner RSVP Board, owner ops page, owner RSVP responses with v2 answers, mobile public page sections.

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
- Open `/concierge-v2/events/[eventHistoryId]/schedule`, add a one-off item, edit a generated occurrence, cancel/restore it, and confirm the public event schedule updates.
- Open `/concierge-v2/events/[eventHistoryId]/rsvp`, filter RSVP responses, update one response status, export CSV, and use the reminder handoff link.
- Submit RSVP as a guest and confirm owner RSVP response includes `answersJson`, `adultCount`, `kidCount`, and `allergyNotes` when provided.
- Submit a generated Smart Form and confirm it appears on `/concierge-v2/events/[eventHistoryId]/ops`.
- Claim a generated volunteer slot as a guest and confirm capacity/claimed counts update in ops.
- Mark a manual payment request paid, waived, refunded, and unpaid from the ops route.
- Open the reminder queue in ops, preview a reminder, record a dry run, and cancel/restore it.
- Verify public v2 sections render on mobile and desktop without guest login.
- Verify calendar links still appear for the primary event time.
- Confirm payment sections clearly stay manual/providerless and do not imply Stripe/Venmo processing.

## Known Limitations And Next Tasks

- V2 parser is deterministic fallback only and does not call OpenAI yet.
- Smart Form response editing/export and Volunteer Signup unclaim/reminder actions remain to be built.
- Manual payment provider processing is not implemented; host status tracking is manual only.
- Reminder preview/dry-run/cancel exists, plus a providerless due-reminder dispatcher foundation. Real scheduler jobs and email/SMS delivery are not wired.
- Schedule Hub supports direct occurrence edits and conflict detection, but recurring-series editing, formal blackout exception rows, and full calendar/board views remain future work.
- OCR import and source document review UI remain to be built.
- Legacy event backfill into canonical graph rows is documented but not run.
- Source/OCR ingestion, richer host dashboard exports/actions, schedule hub views, real reminder provider adapters, and legacy backfill are the next practical slices.
