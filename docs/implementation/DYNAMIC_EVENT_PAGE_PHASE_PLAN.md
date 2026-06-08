# Dynamic Event Page Phase Plan

## Phase 1: Legacy Map

Status: completed.

Source file: `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_MAP.md`

Goal: identify existing routes, templates, data tables, and collision risks before migrating.

Completed:

- Mapped legacy public event routes and event-type customize pages.
- Identified shared components to keep.
- Preserved existing Concierge v2 `event_pages` operational table.
- Moved dynamic blueprint storage to `dynamic_event_pages`.

## Phase 2: Legacy Cleanup

Status: completed as a guarded cleanup framework.

Source file: `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_CLEANUP.md`

Goal: migrate legacy verticals into blueprint presets without deleting working templates too early.

Completed:

- Added blueprint presets for gymnastics meets, wedding weekends, shower/registry events, sports/team events, and simple social events.
- Wired deterministic blueprint generation to use those presets.
- Added guard coverage that presets are section/theme seeds, not React templates.
- Reworked cleanup into gated phases: promote dynamic creation, add Concierge controls, migrate one vertical at a time, run parity checks, replace route branches with wrappers, then delete.
- Added codified vertical parity scenarios for gymnastics meet, wedding weekend, shower/registry event, birthday party, and football/team schedule.
- Added source guards for the migration order, required sections, and mobile/desktop parity checks.

Protected follow-on work:

- Capture manual screenshots during release QA.
- Delete legacy templates only after parity and route compatibility are proven.

## Phase 3: Handoff

Status: completed for Concierge v2 dynamic page creation and owner controls.

Source file: `docs/implementation/DYNAMIC_EVENT_PAGES_HANDOFF.md`

Goal: wire Concierge v2 into dynamic event pages and document the production handoff.

Completed:

- Concierge v2 apply now creates and publishes a dynamic blueprint page.
- Apply result returns `/e/[slug]` as the guest-facing event path.
- Legacy `/event/[slug]` remains available as `legacyEventPath`.
- Owner controls support preview, section copy revisions, theme intent revisions, publish, version listing, and restore.

Protected follow-on work:

- Extend controls from bounded text/theme edits into drag-and-drop section ordering if the product needs it.
- Run manual mobile/desktop review on the required event scenarios before deleting old templates.
