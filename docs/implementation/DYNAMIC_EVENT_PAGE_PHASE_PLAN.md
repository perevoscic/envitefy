# Dynamic Event Page Phase Plan

## Phase 1: Legacy Map

Source file: `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_MAP.md`

Goal: identify existing routes, templates, data tables, and collision risks before migrating.

Completed:

- Mapped legacy public event routes and event-type customize pages.
- Identified shared components to keep.
- Preserved existing Concierge v2 `event_pages` operational table.
- Moved dynamic blueprint storage to `dynamic_event_pages`.

## Phase 2: Legacy Cleanup

Source file: `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_CLEANUP.md`

Goal: migrate legacy verticals into blueprint presets without deleting working templates too early.

Completed:

- Added blueprint presets for gymnastics meets, wedding weekends, shower/registry events, sports/team events, and simple social events.
- Wired deterministic blueprint generation to use those presets.
- Added guard coverage that presets are section/theme seeds, not React templates.

Remaining:

- Run visual parity checks vertical by vertical.
- Delete legacy templates only after parity and route compatibility are proven.

## Phase 3: Handoff

Source file: `docs/implementation/DYNAMIC_EVENT_PAGES_HANDOFF.md`

Goal: wire Concierge v2 into dynamic event pages and document the production handoff.

Completed:

- Concierge v2 apply now creates and publishes a dynamic blueprint page.
- Apply result returns `/e/[slug]` as the guest-facing event path.
- Legacy `/event/[slug]` remains available as `legacyEventPath`.

Remaining:

- Add a pre-publish revision UI for blueprint edits.
- Add version restore UI backed by `dynamic_event_page_versions`.
- Run manual mobile/desktop review on the required event scenarios.
