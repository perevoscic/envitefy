# Concierge V2 Database Changes

Migration file: `prisma/manual_sql/20260604_add_concierge_v2_foundation.sql`

## Tables Added

- `workspaces`: personal/team workspace container.
- `programs`: high-level program or event plan, such as a season, spirit week, class party, or social event.
- `event_series`: recurring rules and series-level metadata.
- `event_occurrences`: materialized schedule events, deadlines, practices, meets, parties, and one-offs.
- `event_pages`: public/live page records linked to canonical graph rows and legacy `event_history`.
- `concierge_sessions`: raw and normalized Concierge V2 parsing sessions.
- `concierge_drafts`: draft payload parts generated from a Concierge session.
- `smart_forms`: schema-driven forms linked to programs/occurrences/pages.
- `form_fields`: normalized form field rows.
- `form_responses`: schema-driven form response storage.
- `volunteer_boards`: signup board container.
- `volunteer_slots`: signup slots with quantity and requirements.
- `volunteer_claims`: guest/participant claims for signup slots.
- `payment_requests`: manual payment tracking requests.
- `payments`: payment status records against payment requests.
- `message_templates`: reusable reminder/message templates.
- `reminders`: scheduled reminder records.
- `message_campaigns`: reminder/message campaign metadata.
- `message_deliveries`: delivery attempts and provider status.
- `source_documents`: uploaded/pasted/imported source material records.
- `extracted_items`: proposed extracted schedule/form/payment/checklist items.
- `checklist_items`: generated or user-maintained planning checklist rows.
- `calendar_feeds`: shareable calendar feed metadata.
- `integration_connections`: external account/provider connection metadata.
- `sync_jobs`: import/export/sync job status.
- `audit_logs`: append-only audit entries for canonical actions.

## Existing And Runtime Table Changes

`rsvp_responses`:

- Added `answers_json jsonb not null default '{}'::jsonb`
- Added `adult_count integer`
- Added `kid_count integer`
- Added `allergy_notes text`

`volunteer_slots`:

- Includes `claimed_quantity integer not null default 0` for atomic capacity checks. The runtime guard also adds it if an earlier local table already exists without the column.

`message_deliveries`:

- Includes `metadata_json jsonb not null default '{}'::jsonb` for providerless dry-run previews and future provider payload metadata. The runtime guard also adds it if an earlier local table already exists without the column.

## Indexes Added

- Workspace owner/type, program workspace/status, series program, occurrence program/start, occurrence owner/start.
- Event page lookup by legacy `event_history`, owner/status, share token, and program.
- Concierge session user/update indexes and draft session/type indexes.
- Smart form, form field, and form response indexes, including unique `form_fields(form_id, field_key)` keys for idempotent field inserts.
- Volunteer board/slot/claim indexes including unique active email claim per slot.
- Payment request/program and payment status indexes.
- Reminder program/schedule/status indexes, plus `message_deliveries(reminder_id, created_at desc)`.
- Message campaign/delivery indexes.
- Source document and extracted item indexes.
- Checklist, calendar feed, integration, sync job, and audit log indexes.
- GIN index on `rsvp_responses.answers_json`.
- Expression index on `event_history ((data->'conciergeV2'->>'programId'))`.

## Runtime Guards

- `src/lib/concierge-v2/storage.ts` creates the subset of canonical tables needed by the current slice if the migration has not run locally.
- `src/lib/concierge-v2/operations.ts` checks event-page ownership before returning private operations data or updating payment status.
- `src/lib/concierge-v2/reminders.ts` checks event-page ownership before returning queue details, previews, dry-run records, or reminder status updates.
- Volunteer claims use both a unique active email claim index and an atomic `volunteer_slots.claimed_quantity` update to prevent over-claiming.
- Smart Form submissions validate required fields against stored `form_fields` before inserting `form_responses`.
- Reminder dry runs insert `message_deliveries` rows with `status = 'dry_run'`, `provider = 'stub'`, and `metadata_json.providerCalled = false`.
- `src/app/api/events/[id]/rsvp/route.ts` lazily ensures the new RSVP answer columns before reading or writing RSVP data.

## Backfill Plan

No legacy `event_history` backfill was run. The migration does include an idempotent `volunteer_slots.claimed_quantity` sync from existing active claims.

Recommended production backfill after migration:

1. Create a personal `workspaces` row for each `event_history.user_id` that does not already have one.
2. For complex existing events only, create a `program` and one or more `event_occurrences`.
3. Create an `event_pages` row for each public `event_history` row and set `legacy_event_history_id`.
4. Preserve existing public slugs, aliases, RSVP rows, shares, and tracking records.
5. Verify `/event/[slug-or-id]` before switching any dashboards to canonical graph reads.
