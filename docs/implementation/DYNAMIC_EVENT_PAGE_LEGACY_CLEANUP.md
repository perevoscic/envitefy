# Dynamic Event Page Legacy Cleanup

## Phase

Phase 2: migration presets and compatibility cleanup.

Status: completed as a guarded cleanup framework. No legacy event templates were deleted because deletion is intentionally blocked until the delete criteria pass.

## Completed In This Phase

- Added `src/features/event-pages/ai/blueprintPresets.ts`.
- Added `src/features/event-pages/ai/verticalParityScenarios.ts`.
- Added presets for gymnastics meets, wedding weekends, shower/registry events, sports/team events, and simple social events.
- Wired deterministic blueprint generation to use presets for safe theme tokens.
- Presets identify migration targets but do not import, render, or duplicate legacy React templates.
- Added executable source guards for the required migration verticals and parity checks.

## Cleanup Strategy

Cleanup should not start by deleting templates. It should start by moving new creation traffic to the dynamic renderer, proving parity by vertical, then shrinking legacy code only after route and visual compatibility are stable.

## Phase 2A: Promote Dynamic Creation

Newly generated event pages should use `/e/[slug]` and `dynamic_event_pages`.

Required before moving on:

- Concierge-created pages return `/e/[slug]` as the guest-facing link.
- Legacy `/event/[slug]` remains available as a compatibility path.
- `dynamic_event_pages` has a stored, validated blueprint for the created event.
- The public page renders without depending on a legacy event-type React template.

## Phase 2B: Add Concierge Controls

Concierge should expose event-page lifecycle controls before any large legacy deletion.

Required controls:

- Preview dynamic page.
- Revise page intent, sections, copy, and theme through blueprint updates.
- Publish the current blueprint.
- Restore or inspect prior versions from `dynamic_event_page_versions`.

Do not expose raw JSX, raw CSS, or direct template selection in these controls.

Status: implemented for the Concierge v2 post-apply success state. The current UI supports opening the dynamic guest page, saving a bounded hero-intro revision as a preview version, publishing the current blueprint, listing recent versions, and restoring a previous version as preview.

## Phase 2C: Migrate Verticals One At A Time

Each vertical gets a blueprint preset, a fallback adapter from existing `event_history.data`, and a parity review before route cleanup.

| Vertical | Preset Mode | Legacy Areas | Minimum Dynamic Sections | Cleanup Priority |
| --- | --- | --- | --- | --- |
| Gymnastics meet | `gymnastics_meet` | `src/components/gym-meet-templates/*`, `src/app/event/gymnastics/*` | hero, quick details, schedule timeline, team notes, location, checklist, RSVP | first |
| Wedding weekend | `wedding_weekend` | `src/app/event/weddings/_renderers/*`, `templates/weddings/*` | hero, itinerary, travel, registry, FAQ, RSVP | second |
| Bridal/baby shower with registry | `shower_or_registry_event` | `BabyShowerTemplateView`, baby shower and bridal shower routes | hero, host notes, registry, location, RSVP | third |
| Birthday party | `simple_social_event` | birthday customize flow, birthday skins/templates | hero, details, host/guest notes, registry/gifts, RSVP | fourth |
| Football/team schedule | `sports_team_event` | football discovery, football season customize flow, sport-events templates | hero, schedule timeline, team notes, location, checklist, RSVP | fifth |

## Phase 2D: Parity Gate

For each migrated vertical, compare the old public route and `/e/[slug]` before replacing route branches.

Required comparisons:

- Desktop screenshot.
- Mobile screenshot.
- Primary CTA behavior.
- RSVP behavior.
- Calendar/save behavior when dates exist.
- Registry/gift behavior when links exist.
- Map/directions behavior when location exists.
- Schedule scanning for schedule-heavy pages.
- Public slug compatibility.
- No fake buttons or dead actions.

The dynamic version does not need pixel parity. It must render equivalent or better guest value with fewer legacy assumptions.

Status: implemented as parity scenario definitions and source guards. Manual screenshot capture is still a release task, but the required verticals, legacy targets, required sections, and required checks are now codified.

## Phase 2E: Compatibility Wrapper

After a vertical passes parity, replace old route branches with a compatibility wrapper instead of deleting immediately.

Wrapper behavior:

- Resolve the existing event by id or public slug.
- Build or fetch a dynamic blueprint.
- Render `EventPageRenderer`.
- Preserve old public URLs and metadata.
- Keep owner/admin edit links pointed at the current workspace tools.

Keep the wrapper through at least one release cycle before deleting legacy files.

## Phase 2F: Delete

Delete only after the compatibility wrapper is live and no references remain.

Deletion order:

1. Remove unused template gallery references.
2. Remove route imports.
3. Remove source-shape tests that assert old template structure, replacing them with dynamic renderer guards.
4. Remove template files.
5. Remove stale assets only when no preset, renderer, or admin preview references them.

Status: deletion criteria are defined and enforced as a process gate. No deletion was performed in this phase.

## Keep During Cleanup

- Shared RSVP, calendar, map, tracking, registry, and sign-up components.
- Public slug compatibility and redirects.
- Discovery parsing and enrichment code.
- Event owner dashboards and operations pages.
- Existing Concierge v2 operational `event_pages` rows for hubs, resources, schedules, RSVP boards, imports, and reminders.
- `event_history` canonical data fields used by dashboard/history queries.

## Delete Criteria

A legacy template file is safe to delete only when all of these are true:

- the dynamic blueprint preset renders equivalent or better content,
- existing public links still resolve,
- source-shape tests are updated intentionally,
- no route imports the old template,
- no template gallery still references it,
- no admin preview references it,
- no registry/sidebar/category entry references it,
- no visual asset is exclusively required by the deleted template,
- rollback is possible by routing the vertical back through the compatibility wrapper.

## Do Not Delete

Do not delete these as part of template cleanup:

- RSVP submission and dashboard code.
- Calendar links and ICS generation.
- Event tracking.
- Registry utilities and database rows.
- Smart sign-up forms.
- Gymnastics and football discovery parsers.
- Public slug helpers and aliases.

These are shared product capabilities, not legacy templates.
