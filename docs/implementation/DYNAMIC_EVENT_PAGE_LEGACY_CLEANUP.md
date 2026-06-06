# Dynamic Event Page Legacy Cleanup

## Phase

Phase 2: migration presets and compatibility cleanup.

Status: in progress. No legacy event templates were deleted. The dynamic renderer now has blueprint presets that act as migration targets for the major legacy verticals.

No legacy event templates were deleted in this phase.

## Completed In This Phase

- Added `src/features/event-pages/ai/blueprintPresets.ts`.
- Added presets for gymnastics meets, wedding weekends, shower/registry events, sports/team events, and simple social events.
- Wired deterministic blueprint generation to use presets for safe theme tokens.
- Presets identify migration targets but do not import, render, or duplicate legacy React templates.

## Cleanup Plan

1. Promote the dynamic renderer behind `/e/[slug]` for newly generated event pages.
2. Add Concierge UI controls for preview, revise, publish, and version restore.
3. Migrate one vertical at a time into blueprint presets:
   - gymnastics meet
   - wedding weekend
   - bridal/baby shower with registry
   - birthday party
   - football/team schedule
4. For each migrated vertical, compare the old public route and `/e/[slug]` on mobile and desktop.
5. Replace old route branches with compatibility wrappers only after parity.
6. Delete legacy template files only when no registry, route, test, or admin preview references remain.

## Keep During Cleanup

- Shared RSVP, calendar, map, tracking, registry, and sign-up components.
- Public slug compatibility and redirects.
- Discovery parsing and enrichment code.

## Delete Criteria

A legacy template file is safe to delete only when:

- the dynamic blueprint preset renders equivalent or better content,
- existing public links still resolve,
- source-shape tests are updated intentionally,
- no route imports the old template,
- no template gallery still references it.
