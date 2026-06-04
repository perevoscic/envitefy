# Repo Scout

## Architecture Summary

- Framework: Next.js 15 app router with React 19 and TypeScript.
- Auth: NextAuth in `src/lib/auth.ts`, with Google provider and app-specific session helpers.
- Data layer: raw Postgres through `src/lib/db.ts` is authoritative. Prisma exists but models only a subset and is not the source of truth for product schema.
- Schema/migrations: manual SQL under `prisma/manual_sql`. The canonical existing schema starts in `prisma/manual_sql/init_db_pgcrypto.sql`.
- Public events: `src/app/event/[id]/page.tsx` dispatches public renderers, including the existing concierge event page branch.
- Existing concierge: `src/lib/concierge/*`, `src/app/api/concierge/message/route.ts`, and `src/app/chat/ConciergeChatClient.tsx`.
- RSVP: `src/app/api/events/[id]/rsvp/route.ts` stores public responses in `rsvp_responses`.
- Caching: user history/dashboard views are cached separately through `src/lib/history-cache.ts` and `src/lib/dashboard-cache.ts`.
- UI stack: Tailwind-style utility classes, `lucide-react` icons, Radix pieces, and local components.

## Useful Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint -- <paths>` when scoped, or `npm run lint`
- Typecheck: `node_modules\\.bin\\tsc.cmd --noEmit`
- Targeted tests: `node --test path/to/file.test.mjs`
- Concierge V2 tests: `node --test src/lib/concierge-v2/core.test.mjs`
- Existing dev server note: `npm run dev` uses `scripts/dev-single.js`, defaults to port `3000`, writes `.next-dev`, and uses `.next-dev.lock`.

## Relevant Existing Tables

- `users`: owners, auth identity, admin/product metadata.
- `oauth_tokens`: calendar OAuth tokens.
- `event_history`: primary event payload table and current public event source.
- `event_public_slug_aliases`: slug alias support for public events.
- `event_shares`: invited/shared event relationships.
- `event_tracking_events`: public tracking events.
- `rsvp_responses`: public RSVP responses.
- `smart_signup_forms` and related signup files exist separately for the current smart signup surface.

## Migration Strategy Recommendation

- Use additive manual SQL migrations. Do not rename or drop existing `event_history`, RSVP, or smart signup tables.
- Keep `event_history` as the public page compatibility row while introducing canonical graph tables for programs, series, occurrences, and pages.
- Link new `event_pages.legacy_event_history_id` to the existing public event row for transition safety.
- Add new RSVP answer columns to `rsvp_responses` instead of introducing a parallel guest response table for this slice.
- Run a production backfill only after the new migration is applied and public event reads are verified.

## Risky Areas

- `src/app/event/[id]/page.tsx` is a large dispatcher. Keep changes targeted to the concierge branch.
- `src/lib/db.ts` is large and central. Prefer small imported services over broad edits there.
- Dashboard ownership language has known drift for scan-created invited vs owned events.
- `next.config.ts` ignores TypeScript build errors, so `next build` alone is not enough.
- Several regression tests are source-shape guards. Refactors may require test updates even when behavior is correct.
