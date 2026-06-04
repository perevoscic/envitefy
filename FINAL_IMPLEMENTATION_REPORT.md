# Envitefy Concierge V2 Implementation Report

Date: 2026-06-04

## Executive Summary

Implemented the full Concierge V2 master-prompt foundation plus the provider-hardening follow-up: feature flags, additive canonical graph migration, OpenAI-backed parsing with deterministic fallback, authenticated Concierge V2 APIs, apply-draft persistence, mobile-first `/concierge-v2` builder UI, public event page v2 sections, owner Schedule Hub, owner RSVP Board 2.0 with CSV export, owner Calendar Center with tokenized ICS feed, owner Source Import Center with pasted-text and storage-backed file import flows, Team/Class Hub with workspace roles, tokenized invitation acceptance, and participant roster modeling, Resource Planning / Day-of Ops with resource assignments, requirements, attendance check-in/check-out, and CSV export, required seed system templates, RSVP answer storage, guest Smart Form responses, guest Volunteer Signup claims, owner manual payment status updates, Stripe Checkout creation and webhook reconciliation, owner reminder queue preview/dry-run/send/cancel controls, Resend/Twilio reminder delivery adapters, owner operations UI, tests, backfill tooling, and handoff docs.

Feature-flagged by `ENABLE_CONCIERGE_V2` plus capability flags for schedule hub, smart forms, volunteer signup, manual payments, OCR imports, team/class hub, resource planning, and reminder engine.

Provider-dependent paths are now wired to live adapters when credentials are present: OpenAI for parsing, Vercel Blob plus PDF.js/Google Vision for file imports, Resend for email, Twilio for SMS, and Stripe Checkout/webhooks for payments. Without the corresponding env vars, the flows return explicit fallback or blocked statuses rather than pretending delivery/payment/OCR happened. Still not run in this session: production legacy backfill and signed-in provider QA against real accounts.

## Commands Run

- `node --test src/lib/concierge-v2/core.test.mjs`: pass.
- `node --test src/lib/concierge-v2/operations-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/reminders-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/schedule-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/rsvp-board-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/calendar-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/source-imports-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/team-class-hub-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/resource-planning-shape.test.mjs`: pass.
- `node --test src/lib/concierge-v2/provider-hardening-shape.test.mjs`: pass.
- Full focused Concierge V2 suite with all files above: pass, 38 tests.
- `node --check scripts\\concierge-v2-backfill-dry-run.mjs`: pass.
- `node --check src/lib/concierge-v2/core.mjs`: pass.
- `node_modules\\.bin\\biome.cmd lint <touched files>`: pass.
- `node_modules\\.bin\\tsc.cmd --noEmit`: fail on existing repo-wide TypeScript errors. Representative first errors:
  - `.next/types/app/api/creation/threads/[id]/route.ts(244,7): Type ... does not satisfy the constraint 'ParamCheck<RouteContext>'.`
  - `ai-studio-code-samples/ethereal-invitations/vite.config.ts(1,25): Cannot find module '@tailwindcss/vite'.`
  - `src/app/api/admin/marketing-campaigns/[runId]/captions/regenerate/route.ts(15,60): Property 'runDir' is missing.`
  - `src/app/event/[id]/page.tsx(3411,15): Type 'string | null' is not assignable to type 'string'.`
  - `src/lib/meet-discovery/core.ts(858,11): Cannot find name 'ScheduleColorTarget'.`
- `npm run lint -- <touched files>`: fail because the script runs `biome lint .` before the supplied paths; failures are unrelated existing sample-app/repo issues such as `ai-studio-code-samples/ethereal-invitations/src/components/FormalSkin.tsx` comment text and unused imports.
- VS Code diagnostics linter: failed because the diagnostics bridge refused connection at `127.0.0.1:4603`.
- In-app browser smoke: opened unauthenticated owner routes including `http://localhost:3000/concierge-v2/events/smoke-test/schedule`, `http://localhost:3000/concierge-v2/events/smoke-test/rsvp`, `http://localhost:3000/concierge-v2/events/smoke-test/calendar`, `http://localhost:3000/concierge-v2/events/smoke-test/imports`, `http://localhost:3000/concierge-v2/events/smoke-test/hub`, and `http://localhost:3000/concierge-v2/events/smoke-test/resources`; all redirected to `http://localhost:3000/` as expected without an owner session. Signed-in owner UI still needs manual smoke testing.

## Database Changes

Migrations created:

- `prisma/manual_sql/20260604_add_concierge_v2_foundation.sql`
- `prisma/manual_sql/20260604_add_concierge_v2_provider_integrations.sql`

Tables added: `workspaces`, `memberships`, `membership_invitations`, `families`, `family_guardians`, `participants`, `programs`, `program_participants`, `event_series`, `event_occurrences`, `event_pages`, `concierge_sessions`, `concierge_drafts`, `smart_forms`, `form_fields`, `form_responses`, `volunteer_boards`, `volunteer_slots` with atomic `claimed_quantity`, `volunteer_claims`, `payment_requests`, `payments`, `message_templates`, `reminders`, `message_campaigns`, `message_deliveries` with provider `metadata_json`, `source_documents`, `extracted_items`, `checklist_items`, `calendar_feeds`, `venues`, `resources`, `resource_requirements`, `resource_assignments`, `attendance_records`, `event_templates`, `integration_connections`, `sync_jobs`, and `audit_logs`.

Existing table changed: `rsvp_responses` now has `answers_json`, `adult_count`, `kid_count`, and `allergy_notes`.

Indexes added: canonical lookup indexes for workspaces/memberships/families/participants/program rosters/programs/series/occurrences/pages, concierge sessions/drafts, forms/responses, volunteer boards/slots/claims, payments, reminders/messages, imports, checklist, feeds, venues/resources/resource assignments/attendance/templates, integrations, sync jobs, audit logs, `rsvp_responses.answers_json` GIN, a unique `form_fields(form_id, field_key)` index, a unique active volunteer claim per slot/email index, and an `event_history` Concierge V2 program expression index.

Backfill performed: no legacy event graph backfill. Added `scripts/concierge-v2-backfill-dry-run.mjs`, which defaults to dry-run and requires `--write --confirm=concierge-v2-backfill` before creating canonical graph rows for legacy `event_history`.

Owner still needs to run the migration against each target database.

Runtime guard update: `src/lib/concierge-v2/storage.ts` now creates membership/family/participant/roster tables, source import tables, resource/attendance tables, calendar feeds, and system templates with local/dev indexes when the manual migration has not run.

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
- `GET /api/concierge/events/[id]/calendar`: authenticated owner-only Calendar Center summary and active feed URL.
- `POST /api/concierge/events/[id]/calendar`: authenticated owner-only calendar feed token regeneration.
- `GET /api/concierge/calendar/[token]`: public tokenized `text/calendar` ICS feed for active schedule items.
- `GET /api/concierge/events/[id]/imports`: authenticated owner-only Source Import Center summary with source documents and extracted items.
- `POST /api/concierge/events/[id]/imports`: authenticated owner-only pasted-text import that stores a source document and proposed extracted items.
- `POST /api/concierge/events/[id]/imports/upload`: authenticated owner-only multipart file import with blob storage, PDF/image/text extraction, provider metadata, and proposed extracted items.
- `PATCH /api/concierge/events/[id]/imports/[documentId]/items/[itemId]`: authenticated owner-only extracted item review status update.
- `POST /api/concierge/events/[id]/imports/[documentId]/apply`: authenticated owner-only apply action for accepted extracted items.
- `GET /api/concierge/events/[id]/hub`: authenticated workspace-member Team/Class Hub summary with roles, participants, upcoming schedule, and operational counts.
- `POST /api/concierge/events/[id]/hub/members`: authenticated role-manager workspace member invite/assignment by email.
- `POST /api/concierge/events/[id]/hub/participants`: authenticated scheduler/coach/teacher participant creation linked to the active program roster.
- `POST /api/concierge/invitations/[token]/accept`: authenticated invitee acceptance for tokenized workspace invitations.
- `GET /api/concierge/events/[id]/resources`: authenticated workspace-member Resource Planning summary with resources, assignments, conflicts, participants, and attendance.
- `POST /api/concierge/events/[id]/resources`: authenticated scheduler/coach/teacher resource creation with optional venue creation.
- `PATCH /api/concierge/events/[id]/resources/[resourceId]`: authenticated scheduler/coach/teacher resource edit/status update.
- `DELETE /api/concierge/events/[id]/resources/[resourceId]`: authenticated scheduler/coach/teacher resource archival.
- `POST /api/concierge/events/[id]/resources/assignments`: authenticated scheduler/coach/teacher resource assignment to a schedule occurrence.
- `POST /api/concierge/events/[id]/resources/requirements`: authenticated scheduler/coach/teacher resource requirement creation.
- `PATCH /api/concierge/events/[id]/resources/attendance`: authenticated check-in-capable attendance status update for a participant and occurrence.
- `PATCH /api/concierge/events/[id]/resources/attendance/checkout`: authenticated check-in-capable attendance check-out.
- `GET /api/concierge/events/[id]/resources/attendance/export`: authenticated attendance CSV export.
- `GET /api/concierge/events/[id]/schedule`: authenticated owner-only Schedule Hub summary with series, occurrences, counts, and conflicts.
- `POST /api/concierge/events/[id]/schedule`: authenticated owner-only one-off schedule item creation.
- `PATCH /api/concierge/events/[id]/schedule/occurrences/[occurrenceId]`: authenticated owner-only occurrence move/edit/cancel/restore/status update.
- `GET /api/concierge/events/[id]/reminders`: authenticated owner-only reminder queue summary with audience counts and recent dry-run records.
- `GET /api/concierge/events/[id]/reminders/[reminderId]/preview`: authenticated owner-only reminder preview.
- `POST /api/concierge/events/[id]/reminders/[reminderId]/dry-run`: authenticated owner-only dry-run delivery recording; no provider call.
- `POST /api/concierge/events/[id]/reminders/[reminderId]/send`: authenticated owner-only provider-backed send-now action.
- `PATCH /api/concierge/events/[id]/reminders/[reminderId]/status`: authenticated owner-only reminder cancel/restore/status update.
- `POST /api/concierge/reminders/dispatch`: cron-safe due reminder dispatcher guarded by `CONCIERGE_V2_CRON_SECRET` in production.
- `POST /api/concierge/events/[id]/payment-requests/[paymentRequestId]/checkout`: public/optional-session Stripe Checkout creation for a payment request.
- `POST /api/concierge/payments/stripe/webhook`: Stripe webhook signature verification and payment reconciliation.
- `POST /api/events/[id]/rsvp`: changed to store RSVP V2 answers and counts.
- `GET /api/events/[id]/rsvp`: changed so owners receive RSVP V2 answer fields.

## UI Routes And Components

- `src/app/concierge-v2/page.tsx`: feature-flagged entry page for Concierge V2.
- `src/app/concierge-v2/ConciergeV2Client.tsx`: premium mobile-first builder with examples, detected mode, draft sections, edit fields, loading/error states, and publish result link.
- `src/app/concierge-v2/events/[id]/schedule/page.tsx`: owner-only Schedule Hub route backed by canonical `event_occurrences`.
- `src/app/concierge-v2/events/[id]/schedule/ConciergeV2ScheduleHubClient.tsx`: premium mobile-first agenda/list/conflicts UI with add, edit, move, cancel, and restore controls.
- `src/app/concierge-v2/events/[id]/rsvp/page.tsx`: owner-only RSVP Board 2.0 route backed by `rsvp_responses`.
- `src/app/concierge-v2/events/[id]/rsvp/ConciergeV2RsvpBoardClient.tsx`: premium mobile-first host board with summary cards, filters, guest detail panel, status updates, reminder handoff, and CSV export.
- `src/app/concierge-v2/events/[id]/calendar/page.tsx`: owner-only Calendar Center route backed by `calendar_feeds`.
- `src/app/concierge-v2/events/[id]/calendar/ConciergeV2CalendarCenterClient.tsx`: premium mobile-first feed management UI with copy, download, Google subscribe, regenerate, safety notes, and schedule preview.
- `src/app/concierge-v2/events/[id]/imports/page.tsx`: owner-only Source Import Center route backed by `source_documents` and `extracted_items`.
- `src/app/concierge-v2/events/[id]/imports/ConciergeV2ImportCenterClient.tsx`: premium mobile-first pasted-text and file import UI with source-type selection, provider status, upload controls, extraction cards, accept/reject controls, and apply action.
- `src/app/concierge-v2/invitations/[token]/page.tsx`: signed-in workspace invitation acceptance page.
- `src/app/concierge-v2/events/[id]/hub/page.tsx`: workspace-member Team/Class Hub route backed by memberships, participants, roster rows, and program data.
- `src/app/concierge-v2/events/[id]/hub/ConciergeV2TeamClassHubClient.tsx`: premium mobile-first team/class/parent hub with member roles, participant cards, upcoming coordination, invite-member form, and add-participant form.
- `src/app/concierge-v2/events/[id]/resources/page.tsx`: workspace-member Resource Planning route backed by resources, assignments, conflicts, participants, and attendance.
- `src/app/concierge-v2/events/[id]/resources/ConciergeV2ResourcesClient.tsx`: premium mobile-first resource board with add-resource, archive, assign-resource, conflict list, CSV export, check-in, and check-out controls.
- `src/app/concierge-v2/events/[id]/ops/page.tsx`: owner-only operations route for generated forms, volunteer claims, and manual payments.
- `src/app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx`: premium mobile-first host operations surface with summary cards, manual/Stripe payment actions, and reminder queue preview/dry-run/send controls.
- `src/components/concierge/ConciergePublicOperations.tsx`: public Smart Form, Volunteer Signup, Payment Tracker, Checklist, and Reminder Timeline interaction sections.
- `src/components/concierge/ConciergeEventWebsite.tsx`: changed to render v2 schedule, forms, volunteer signup, manual payment, checklist, and reminder sections.
- `src/app/event/[id]/page.tsx`: changed only in the concierge event page branch to extract and pass v2 public sections and expose an owner ops link.

## Design QA Notes

- Components changed: new Concierge V2 builder cards/inputs/action bar, existing concierge public event page cards/sections.
- Pages updated: `/concierge-v2` and the existing `/event/[id]` concierge public renderer.
- Mobile improvements: stacked builder sections, sticky publish bar, large tap targets, responsive public section grids.
- Accessibility improvements: semantic buttons/sections, aria labels on icon-only controls inherited from existing renderer, clear loading/error states.
- Remaining design issues: public reminder timeline is display-only, while owner ops supports preview/dry-run/send/cancel; Schedule Hub has agenda/list/conflict views but not a full visual calendar grid yet; provider-backed file OCR/payment/reminder/invite flows need signed-in QA with real credentials; resource scanner and richer requirement matching remain future UX work.
- Screens needing manual review: signed-in `/concierge-v2` builder, published v2 public event page, owner Schedule Hub, owner RSVP Board, owner Calendar Center, owner Source Import Center, owner Team/Class Hub, owner Resource Planning page, owner ops page, owner RSVP responses with v2 answers, mobile public page sections.

## Environment Variables Needed

- Required for app/database: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` or `AUTH_SECRET`.
- Optional OAuth/calendar: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, `OUTLOOK_TENANT_ID`, Apple OAuth vars.
- Optional AI/OCR/storage/maps: `OPENAI_API_KEY`, `CONCIERGE_V2_OPENAI_MODEL`, `BLOB_READ_WRITE_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_CLOUD_PROJECT`, Gemini/Google AI vars, Google Maps/Places vars.
- Optional email/SMS/anti-abuse: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
- Optional payments/jobs: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CONCIERGE_V2_CRON_SECRET`.
- Concierge V2 flags: `ENABLE_CONCIERGE_V2`, `ENABLE_SCHEDULE_HUB`, `ENABLE_SMART_FORMS`, `ENABLE_VOLUNTEER_SIGNUPS`, `ENABLE_MANUAL_PAYMENTS`, `ENABLE_OCR_IMPORTS`, `ENABLE_TEAM_CLASS_HUB`, `ENABLE_RESOURCE_PLANNING`, `ENABLE_REMINDER_ENGINE`.

## External Setup

- DB migration: run both Concierge V2 manual SQL migrations in `prisma/manual_sql/`.
- AI provider: configure `OPENAI_API_KEY` to use OpenAI parsing; otherwise deterministic fallback remains active and audited.
- Storage/OCR: configure `BLOB_READ_WRITE_TOKEN` for uploaded files and Google Vision credentials for image OCR. PDF text extraction uses PDF.js after blob upload.
- Workspace invites and reminders: configure Resend for email delivery. Configure Twilio and collect RSVP phone numbers for SMS reminders.
- Payments: configure Stripe secret and webhook secret; point Stripe webhooks at `/api/concierge/payments/stripe/webhook`.
- Cron/jobs: call `/api/concierge/reminders/dispatch` with `Authorization: Bearer ${CONCIERGE_V2_CRON_SECRET}` for due reminders.

## Manual QA Checklist

- Enable `ENABLE_CONCIERGE_V2=true` locally.
- Create a birthday prompt in `/concierge-v2`, publish, and open the public event page.
- Create the gymnastics season example, verify recurring practice materialization and meet/team dinner sections.
- Create the spirit week example and verify five daily schedule cards.
- Open `/concierge-v2/events/[eventHistoryId]/schedule`, add a one-off item, edit a generated occurrence, cancel/restore it, and confirm the public event schedule updates.
- Open `/concierge-v2/events/[eventHistoryId]/rsvp`, filter RSVP responses, update one response status, export CSV, and use the reminder handoff link.
- Open `/concierge-v2/events/[eventHistoryId]/calendar`, copy the feed URL, download the ICS, open the Google subscribe URL, regenerate the feed, and confirm the old token stops working.
- Open `/concierge-v2/events/[eventHistoryId]/imports`, paste source details, extract proposed items, accept/reject at least one card, apply accepted items, then confirm schedule/ops rows were created.
- With blob/OCR providers configured, upload a PDF and an image in Source Import Center, then confirm source document storage metadata and extracted items.
- Open `/concierge-v2/events/[eventHistoryId]/hub`, add a member role by email, add a participant with family/group details, and confirm the roster, member count, and upcoming schedule cards update.
- Open the invite acceptance link from email or the dev response metadata, sign in as the invited email, and confirm membership activation.
- Open `/concierge-v2/events/[eventHistoryId]/resources`, create a room/coach/equipment resource, assign it to an occurrence, create an overlapping assignment for the same resource, and confirm the double-booking warning appears.
- From the same Resource Planning page, mark roster participants present, late, absent, and excused for a selected occurrence.
- Export Resource Planning attendance CSV and check out a checked-in participant.
- Submit RSVP as a guest and confirm owner RSVP response includes `answersJson`, `adultCount`, `kidCount`, and `allergyNotes` when provided.
- Submit a generated Smart Form and confirm it appears on `/concierge-v2/events/[eventHistoryId]/ops`.
- Claim a generated volunteer slot as a guest and confirm capacity/claimed counts update in ops.
- Mark a manual payment request paid, waived, refunded, and unpaid from the ops route.
- With Stripe configured, open Checkout from a payment request and process a Stripe webhook test event.
- Open the reminder queue in ops, preview a reminder, record a dry run, send now through Resend/Twilio providers, and cancel/restore it.
- Verify public v2 sections render on mobile and desktop without guest login.
- Verify calendar links still appear for the primary event time.
- Confirm payment sections clearly stay manual/providerless and do not imply Stripe/Venmo processing.

## Known Limitations And Next Tasks

- All planned master-prompt phases now have foundation implementation. Remaining work is production hardening, provider setup, backfill, richer edit/export/scanner UX, and signed-in QA.
- OpenAI parsing is implemented, but deterministic fallback remains active when `OPENAI_API_KEY` is absent or provider parsing fails.
- Smart Form response editing/export and Volunteer Signup unclaim/reminder actions remain to be built.
- Stripe Checkout and webhook reconciliation are implemented; other providers such as Venmo/Zelle remain manual tracking.
- Reminder preview/dry-run/send/cancel exists with Resend/Twilio adapters; an external scheduler still needs to call the dispatch endpoint.
- Schedule Hub supports direct occurrence edits and conflict detection, and Calendar Center publishes active items as ICS. Recurring-series editing, formal blackout exception rows, and full visual calendar/board views remain future work.
- Storage-backed file import exists; file lifecycle cleanup and richer OCR review tooling remain future work.
- Team/Class Hub supports tokenized invitation email/acceptance; participant edit/remove and cross-program family dashboards remain future work.
- Resource Planning supports resource edits/archive, requirements, check-out, and attendance export; scanner mode and richer matching/report UX remain future work.
- Legacy event backfill script exists but has not been run against a database.
- Remaining practical slices are signed-in provider QA, scheduler/webhook deployment, resource scanner UX, richer exports, and controlled legacy backfill.
