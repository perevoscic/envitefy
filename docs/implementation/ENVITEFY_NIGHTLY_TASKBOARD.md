# Envitefy Concierge V2 Taskboard

Date: 2026-06-04

## Completed

- Repo discovery: confirmed Next.js app router, NextAuth, raw Postgres through `src/lib/db.ts`, partial Prisma only, manual SQL migrations, and Biome/targeted Node tests as the useful validation path.
- Feature flags: added `src/config/concierge-v2-flags.ts` with production-safe defaults and local/dev defaults for the first vertical slice.
- Canonical graph foundation: added additive SQL migration for workspaces, programs, event series, event occurrences, event pages, concierge sessions/drafts, forms, volunteer signup, payments, reminders, imports, calendar feeds, integrations, and audit logs.
- Concierge parser: added deterministic fallback parser for social, school, gymnastics, team, class, family, community, business, and planner language.
- Apply draft flow: added storage service that creates program/series/occurrences, writes the public `event_history` row, links an `event_pages` row, and persists forms, volunteer slots, payment requests, reminders, and checklist items.
- API routes: added authenticated Concierge V2 parse/session/apply endpoints.
- UI: added mobile-first `/concierge-v2` builder with prompt examples, detected mode, structured draft cards, editable core fields, publish action, and result link.
- Public event page: extended the existing concierge public event renderer to show v2 schedule, forms, volunteer signup, manual payments, checklist, and reminder sections.
- RSVP Board 2.0 storage: extended RSVP submissions with `answers_json`, adult count, kid count, and allergy notes.
- RSVP Board 2.0 host UI: added owner-only `/concierge-v2/events/[id]/rsvp` with summary cards, filters, guest detail panel, status updates, reminder handoff, and CSV export.
- Smart Forms: added public response submission endpoint, required-field validation, persisted `form_responses`, and an owner operations view for responses.
- Volunteer Signup: added public claim endpoint with capacity and duplicate-email guards, persisted `volunteer_claims`, and owner operations visibility.
- Manual Payments: added owner-only status updates for stored payment requests and a premium operations UI to mark unpaid, paid, waived, or refunded.
- Owner ops route: added `/concierge-v2/events/[id]/ops` as the host control surface linked from publish success and owner event pages.
- Reminder Engine: added owner-only reminder queue, preview, dry-run delivery recording, cancel/restore status actions, and providerless due-reminder dispatcher foundation.
- Schedule Hub: added owner-only agenda/list/conflicts route backed by `event_occurrences`, one-off item creation, inline move/edit/status actions, conflict detection, and public schedule republishing.
- Calendar Center: added owner-only `/concierge-v2/events/[id]/calendar`, active `calendar_feeds` runtime support, tokenized public ICS feed endpoint, copy/download/Google subscribe controls, and feed token regeneration.
- Source Import Center: added owner-only `/concierge-v2/events/[id]/imports`, pasted-text extraction through the deterministic parser, `source_documents`/`extracted_items` runtime support, accept/reject review cards, and apply-to-schedule/forms/reminders/checklist/payments.
- Tests: added `src/lib/concierge-v2/core.test.mjs` for parser, recurrence, exceptions, conflicts, forms, volunteer capacity, payment status, and ICS output.
- Tests: added `src/lib/concierge-v2/operations-shape.test.mjs` to guard persisted operation IDs, live public endpoints, and volunteer capacity logic.
- Tests: added `src/lib/concierge-v2/reminders-shape.test.mjs` to guard providerless dry-run behavior and owner reminder APIs.
- Tests: added `src/lib/concierge-v2/schedule-shape.test.mjs` to guard canonical schedule APIs, conflict detection, and public event sync.
- Tests: added `src/lib/concierge-v2/rsvp-board-shape.test.mjs` to guard owner RSVP Board APIs, export, and host UI actions.
- Tests: added `src/lib/concierge-v2/calendar-shape.test.mjs` to guard Calendar Center APIs, feed table guard, public ICS output, and host UI actions.
- Tests: added `src/lib/concierge-v2/source-imports-shape.test.mjs` to guard source import tables, owner APIs, review/apply wiring, and no fake upload controls.

## Deferred

- Actual AI provider selection for Concierge V2. The first slice uses deterministic fallback parsing only.
- Storage-backed image/PDF OCR uploads and provider adapters. Pasted-text source ingestion, review, and apply are implemented.
- Real reminder delivery jobs. Reminder preview, dry-run records, cancel/restore, and providerless due-dispatch scaffolding exist; no email/SMS provider is called.
- Payment provider integration. Manual payment requests are stored and can be marked by hosts; no Stripe/Venmo/Zelle provider is implemented.
- Volunteer unclaim/edit/export/reminder actions. Claiming works, but the richer management loop is still a follow-up.
- Smart Form response editing/export and file-upload fields. Basic responses work; storage-backed uploads are still documented/stubbed.
- Canonical graph backfill for legacy `event_history` rows. The migration is additive and non-destructive; no data backfill was run.
- Rich schedule board rendering and formal blackout exception rows remain follow-up work. The current Schedule Hub edits persisted occurrences directly, and Calendar Center now publishes an ICS feed rather than a full visual calendar grid.

## Current Validation Status

- `node --test src/lib/concierge-v2/core.test.mjs`: passing.
- `node --test src/lib/concierge-v2/operations-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/reminders-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/schedule-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/rsvp-board-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/calendar-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/source-imports-shape.test.mjs`: passing.
- `node --check src/lib/concierge-v2/core.mjs`: passing.
- Scoped Biome lint on touched files: passing.
- `npm run lint -- <touched files>`: failing on unrelated repo-wide issues because the script expands to `biome lint .` before supplied paths.
- `node_modules\\.bin\\tsc.cmd --noEmit`: failing on existing repo-wide TypeScript issues in generated Next route types, sample Vite app deps, studio pages, meet-discovery, legacy event page nullability, and other pre-existing areas. No remaining errors point at new Concierge V2 files.
- VS Code diagnostics linter: blocked because the Chat-to-CLI bridge provider context is missing in this shell.

## Recommended Next Slice

1. Add Team/Class Hub and role-aware host/member views on top of the canonical program graph.
2. Add storage-backed image/PDF upload and OCR provider extraction to the Source Import Center.
3. Add volunteer unclaim/edit, Smart Form exports, and payment exports.
4. Add richer schedule board views, blackout exception rows, and recurring-series edit controls.
5. Add real reminder provider adapters and a safe scheduled job after email/SMS provider setup is decided.
6. Backfill canonical `event_pages` links for existing public `event_history` rows after production schema is migrated.
