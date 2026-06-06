# Dynamic Event Page Legacy Map

## Phase

Phase 1: inventory and collision prevention.

Status: completed. This phase maps the legacy surfaces and protects existing Concierge v2 operational storage while the dynamic page renderer is introduced.

## Current Route Impact

- `src/app/event/[id]/page.tsx` is the existing public event dispatcher. It renders many legacy surfaces, including scanned invites, generic skins, wedding renderers, gym discovery content, football discovery content, smart signup links, RSVP, registry, tracking, and owner preview controls.
- `src/app/event/*/customize/page.tsx` contains event-type-specific creation/customization flows for birthdays, weddings, gymnastics, football, sport events, gender reveal, baby showers, dance/ballet, cheerleading, soccer, appointments, workshops, and general events.
- `src/app/smart-signup-form/[id]/page.tsx` is a separate public smart signup renderer.
- New additive route: `src/app/e/[slug]/page.tsx` renders dynamic Event Page Blueprints and falls back to an event-history-derived blueprint when no stored dynamic page exists.
- Existing Concierge v2 operations already own a table named `event_pages`. Dynamic blueprint storage now uses `dynamic_event_pages` and `dynamic_event_page_versions` to avoid schema collision.

## Files To Keep

- Shared event actions and visitor tools: `src/components/EventActions.tsx`, `src/components/EventRsvpPrompt.tsx`, `src/components/EventTrackedLink.tsx`, `src/components/EventMap.tsx`, `src/components/EventViewTracker.tsx`.
- RSVP/registry/sign-up backend surfaces in `src/lib/db.ts`, `src/app/api/events/[id]/rsvp/route.ts`, and registry helpers in `src/utils/registry-links.ts`.
- Public slug utilities: `src/utils/event-url.ts`, `src/utils/event-public-slug.ts`.
- Discovery systems while migration is underway: `src/lib/meet-discovery.ts`, `src/lib/football-discovery.ts`, `src/components/gym-meet-templates/*`, `src/components/football-discovery/*`.

## Files To Refactor

- `src/lib/concierge/event-actions.ts` should eventually create/update `event_pages` records directly instead of only creating `event_page` assets or patching event JSON.
- `src/lib/concierge-v2/system-templates.ts` should shift from event-type templates to blueprint presets and classification hints.
- `src/components/concierge/ConciergeEventWebsite.tsx` can be retired or converted into dynamic sections once the new renderer covers all current Concierge public operations.
- `src/app/event/[id]/page.tsx` should become a compatibility dispatcher that hands eligible events to the dynamic renderer.

## Files To Migrate

- Legacy template groups in `src/components/event-templates/*`.
- Wedding renderer catalog in `src/app/event/weddings/_renderers/*` and `templates/weddings/*`.
- Birthday customization and renderer code in `src/app/event/birthdays/customize/*` and `src/components/birthdays/*`.
- Gym meet renderer variants in `src/components/gym-meet-templates/renderers/*`.
- Baby shower, gender reveal, football season, dance/ballet, cheerleading, and sport event customize pages.

## Files To Delete Later

Do not delete in this phase. Candidates after parity:

- Duplicate event-type template React files that can be represented as blueprint presets.
- Mock/demo-only template code with no live route or registry reference.
- Hardcoded one-off card sections that duplicate the new section registry.

## Database Impact

- Added manual migration `prisma/manual_sql/20260606_add_dynamic_event_pages.sql`.
- Added runtime-safe schema creation in `src/lib/db.ts`.
- New tables: `dynamic_event_pages` and `dynamic_event_page_versions`.
- Existing Concierge v2 operational table `event_pages` remains unchanged and continues to power hubs, schedules, RSVP boards, resources, imports, and reminders.
- Existing `event_history` remains authoritative for base event data and public slugs.

## Risks

- `src/app/event/[id]/page.tsx` is large and currently owns many compatibility branches.
- Existing legacy routes may rely on renderer-specific data fields that need blueprint migration adapters.
- Stored dynamic blueprints must be validated before save and before render.
- Slug collisions need product handling if hosts manually choose duplicate dynamic page slugs.

## Test Impact

- Added source-shape guard: `src/features/event-pages/event-page-engine.source.test.mjs`.
- Future phases need behavior tests for blueprint validation, API authorization, preview/publish, and visual regression across mobile/desktop.
