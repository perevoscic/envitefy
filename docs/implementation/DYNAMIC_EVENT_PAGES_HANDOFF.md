# Dynamic Event Pages Handoff

## Phase

Dynamic blueprint event pages remain an independent feature.

Status as of September 6, 2026: Concierge V2 and its records were removed at the user's request. Its publish integration is removed. The blueprint APIs, `/e/[slug]`, and dynamic storage remain. Current creation uses `/chat`; see [the route map](../concierge-route-map.md).

## What Changed

- Added a schema-first Dynamic Event Page Engine foundation.
- Added validated `EventPageBlueprint`, theme, section, action, schedule, status, and version types.
- Added safe theme-token to CSS-variable conversion.
- Added a bounded React renderer with section registry behavior.
- Added `/e/[slug]` public dynamic event page route.
- Added `dynamic_event_pages` and `dynamic_event_page_versions` storage helpers plus manual SQL migration.
- Added API endpoints for draft creation, blueprint update, publish, and slug fetch.
- Updated middleware to allow public `/e/[slug]` access.
- Updated Concierge planner guardrails to prefer structured blueprint JSON and reject raw React/CSS generation.
- Corrected dynamic storage to `dynamic_event_pages` / `dynamic_event_page_versions` so it does not collide with existing Concierge v2 `event_pages`.
- Added blueprint presets for the main legacy migration verticals.
- Removed the former V2 apply integration during retirement; use the independent event-page APIs below.

## Files Added

- `src/features/event-pages/schemas/eventBlueprint.schema.ts`
- `src/features/event-pages/themes/*`
- `src/features/event-pages/renderer/*`
- `src/features/event-pages/sections/*`
- `src/features/event-pages/ai/*`
- `src/features/event-pages/event-page-engine.source.test.mjs`
- `src/app/e/[slug]/page.tsx`
- `src/app/api/event-pages/route.ts`
- `src/app/api/event-pages/[id]/route.ts`
- `src/app/api/event-pages/slug/[slug]/route.ts`
- `prisma/manual_sql/20260606_add_dynamic_event_pages.sql`
- `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_MAP.md`
- `docs/implementation/DYNAMIC_EVENT_PAGE_LEGACY_CLEANUP.md`
- `docs/implementation/DYNAMIC_EVENT_PAGE_PHASE_PLAN.md`

## Files Modified

- `src/lib/db.ts`
- `src/lib/concierge/event-actions.ts`
- `src/middleware.ts`

## Files Deleted

- None.

## Migrations Needed

Apply `prisma/manual_sql/20260606_add_dynamic_event_pages.sql` in environments that do not rely on runtime `ensureOnce` schema creation. The migration creates `dynamic_event_pages` and `dynamic_event_page_versions`.

## Environment Variables Needed

- None added.

## How To Test

- Run `node --test src/features/event-pages/event-page-engine.source.test.mjs`.
- Run `npm run lint -- src/features/event-pages src/app/e src/app/api/event-pages src/lib/db.ts src/lib/concierge/event-actions.ts src/middleware.ts`.
- Create a draft with `POST /api/event-pages` using an owned `eventId`.
- Update and publish the owned draft through `/api/event-pages/[id]`.
- Visit `/e/[slug]` for a stored dynamic page.
- Visit `/e/[existing-public-event-slug]` to exercise deterministic fallback rendering from `event_history`.

## Manual Review Needed

- API authorization and slug collision behavior.
- Visual QA for gymnastics meet, wedding weekend, shower with registry, football schedule, school event, open house, birthday, and custom event pages.
- Concierge revision UI before publish and version restore UI.
- Migration parity for legacy public pages.

## Recommended Next Phase

Consider revision controls in the current creator that call `PUT /api/event-pages/[id]` before publish and expose version restore from `dynamic_event_page_versions`. Do not restore the removed V2 creator.
