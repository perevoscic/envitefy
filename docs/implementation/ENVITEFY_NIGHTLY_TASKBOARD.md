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
- Smart Forms: added public response submission endpoint, required-field validation, persisted `form_responses`, and an owner operations view for responses.
- Volunteer Signup: added public claim endpoint with capacity and duplicate-email guards, persisted `volunteer_claims`, and owner operations visibility.
- Manual Payments: added owner-only status updates for stored payment requests and a premium operations UI to mark unpaid, paid, waived, or refunded.
- Owner ops route: added `/concierge-v2/events/[id]/ops` as the host control surface linked from publish success and owner event pages.
- Reminder Engine: added owner-only reminder queue, preview, dry-run delivery recording, cancel/restore status actions, and providerless due-reminder dispatcher foundation.
- Tests: added `src/lib/concierge-v2/core.test.mjs` for parser, recurrence, exceptions, conflicts, forms, volunteer capacity, payment status, and ICS output.
- Tests: added `src/lib/concierge-v2/operations-shape.test.mjs` to guard persisted operation IDs, live public endpoints, and volunteer capacity logic.
- Tests: added `src/lib/concierge-v2/reminders-shape.test.mjs` to guard providerless dry-run behavior and owner reminder APIs.

## Deferred

- Actual AI provider selection for Concierge V2. The first slice uses deterministic fallback parsing only.
- OCR import UI and source document ingestion. The database foundation exists, but upload/import workflows remain future work.
- Real reminder delivery jobs. Reminder preview, dry-run records, cancel/restore, and providerless due-dispatch scaffolding exist; no email/SMS provider is called.
- Payment provider integration. Manual payment requests are stored and can be marked by hosts; no Stripe/Venmo/Zelle provider is implemented.
- Volunteer unclaim/edit/export/reminder actions. Claiming works, but the richer management loop is still a follow-up.
- Smart Form response editing/export and file-upload fields. Basic responses work; storage-backed uploads are still documented/stubbed.
- Canonical graph backfill for legacy `event_history` rows. The migration is additive and non-destructive; no data backfill was run.
- OCR/source document UI remains a later phase.

## Current Validation Status

- `node --test src/lib/concierge-v2/core.test.mjs`: passing.
- `node --test src/lib/concierge-v2/operations-shape.test.mjs`: passing.
- `node --test src/lib/concierge-v2/reminders-shape.test.mjs`: passing.
- `node --check src/lib/concierge-v2/core.mjs`: passing.
- Scoped Biome lint on touched files: passing.
- `npm run lint -- <touched files>`: failing on unrelated repo-wide issues because the script expands to `biome lint .` before supplied paths.
- `node_modules\\.bin\\tsc.cmd --noEmit`: failing on existing repo-wide TypeScript issues in generated Next route types, sample Vite app deps, studio pages, meet-discovery, legacy event page nullability, and other pre-existing areas. No remaining errors point at new Concierge V2 files.
- VS Code diagnostics linter: blocked because the Chat-to-CLI bridge provider context is missing in this shell.

## Recommended Next Slice

1. Add source document ingestion for pasted text, upload, OCR review cards, and approval-to-schedule.
2. Add richer host dashboard cards for RSVP Board 2.0, response export, volunteer unclaim/edit, and payment exports.
3. Add schedule hub agenda/calendar/board views backed by `event_occurrences`.
4. Add real reminder provider adapters and a safe scheduled job after email/SMS provider setup is decided.
5. Backfill canonical `event_pages` links for existing public `event_history` rows after production schema is migrated.
