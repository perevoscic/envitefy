# Envitefy Notes For Future Codex

This is the stuff that was not obvious on first read and is worth keeping in one place.

## Reality Check

- The repo still has rename drift. `package.json` says `snap-my-date`, and `README.md` still frames the product as OCR-to-calendar first, but the current app is broader: multi-vertical event creation, public event sites, RSVP/sign-up flows, registry links, and admin campaign tooling.
- Anonymous `/` is not the real landing route. `src/middleware.ts` rewrites signed-out users to `/landing`; signed-in users stay on `/`.
- `npm run dev` does not run plain `next dev`. It goes through `scripts/dev-single.js`, defaults to port `3000`, writes to `.next-dev`, and uses `.next-dev.lock` to block a second dev server.

## Data Model That Actually Matters

- The real app state lives in Postgres plus JSONB, not Prisma. `src/lib/db.ts` is the primary data layer.
- Prisma is partial and not authoritative for the app shape. `prisma/schema.prisma` only models a subset of `users`, `oauth_tokens`, `password_resets`, and `theme_overrides`.
- The real schema lives in `prisma/manual_sql/init_db_pgcrypto.sql` and other manual SQL files. That is where `event_history`, `event_shares`, `promo_codes`, `email_campaigns`, `rsvp_responses`, and the extra `users` columns are defined.
- Most product behavior hangs off `event_history.data`. When mutating event payloads, preserve the canonical top-level fields that downstream queries assume exist: `startAt`/`startISO`/`start`, `endAt`/`endISO`/`end`, `timezone`/`tz`, `category`, `status`, `ownership`, `createdVia`, and title-like fields. `src/lib/dashboard-data.ts` and the history SQL depend on those fallbacks.
- History and dashboard are separately cached in memory. If a mutation changes what users should see, check both `src/lib/history-cache.ts` and `src/lib/dashboard-cache.ts` for needed invalidation.

## Sharp Edges I Would Want To Remember

- `next.config.ts` sets `typescript.ignoreBuildErrors = true`. `next build` is not a reliable correctness check here.
- Use Biome plus the VS Code diagnostics linter after TS/TSX edits. This repo will otherwise let type errors slip through.
- The codebase is intentionally mixed `ts`, `tsx`, `js`, and `mjs` with `allowJs: true`.
- A lot of regression tests are not behavior tests; they are source-shape guards that assert specific strings or structure. If you refactor intentionally, expect to update the guard tests rather than assuming they are wrong.
- Several core files are huge enough that opening them wholesale is a waste:
  - `src/lib/meet-discovery.ts` is about 10k lines.
  - `src/lib/db.ts` is about 4k lines.
  - `src/app/event/gymnastics/customize/page.tsx` and `src/app/event/dance-ballet/customize/page.tsx` are both about 3.6k lines.
  - `src/app/event/[id]/page.tsx` is about 2.2k lines and acts as a public-render dispatcher.
  Start with `rg` on symbols, then use targeted `sed -n` slices.

## Feature Maps

- Weddings are split between static theme data and renderer code.
  - Catalog and metadata: `templates/weddings/index.json`
  - Per-theme configs/assets: `templates/weddings/*/config.json`
  - Public renderer implementations: `src/app/event/weddings/_renderers/*`
  Adding or changing a wedding theme usually means touching both config/assets and a renderer path.
- Gym meet discovery is its own subsystem, not a minor event variant.
  - Parse entry: `src/app/api/parse/[eventId]/route.ts`
  - Enrichment follow-up: `src/app/api/parse/[eventId]/enrich/route.ts`
  - Core logic: `src/lib/meet-discovery.ts`
  - Builder status logic: `src/lib/meet-discovery/status.ts`
  - Template registry: `src/components/gym-meet-templates/registry.ts`
- Football discovery has a parallel pipeline with separate normalization and rendering. Look at `src/lib/football-discovery.ts`, `src/components/football-discovery/*`, and `src/app/event/football-season/customize/*`.
- Smart signup is effectively a second product surface.
  - Builder/viewer: `src/components/smart-signup-form/*`
  - Public page: `src/app/smart-signup-form/[id]/page.tsx`
  - Template image manifest and assets: `public/templates/signup/manifest.json`, `src/assets/signup-templates.ts`

## Route And Runtime Quirks

- Public access is controlled by middleware heuristics, not just folder names. `src/middleware.ts` treats `/event/[slug-or-id]` and `/smart-signup-form/[id]` as public share pages.
- `/event` itself is different from `/event/[id]`; the base route requires a session cookie and behaves like app workspace entry, not a public share page.
- Event passcodes are implemented with per-event cookies in `src/lib/event-access.ts`. If you change access-code behavior, also inspect:
  - `src/app/api/events/[id]/unlock/route.ts`
  - `src/app/api/rsvp/attendance/route.ts`
  - `src/app/event/[id]/page.tsx`
- Most API routes explicitly pin `runtime = "nodejs"`, which is important because OCR, PDF parsing, Sharp, Google APIs, and raw Postgres all assume Node.
- The notable edge-runtime exceptions are `src/app/api/maps/static/route.ts`, `src/app/api/templates/signup/route.ts`, and `src/app/event/[id]/opengraph-image.tsx`. Do not pull Node-only imports into those by accident.

## Testing And Validation

- There is no useful top-level `npm test` flow right now.
- The targeted test command is usually `node --test path/to/file.test.mjs`.
- There are also `.test.ts` files, but many of the active regression guards are `.test.mjs` source inspections.
- Good default validation sequence after edits:
  - `npm run lint -- <paths>` if the change is broad enough to justify it.
  - `node --test <targeted-tests>`
  - `node "/Users/michaelisom/.cursor/extensions/airizom.chat-to-cli-0.410.4/scripts/vscode-lint.js" <touched files>`

## Docs Drift

- Trust the route tree, registries, and SQL more than the top-level docs. The README is directionally useful, but it undersells how much of the app now lives in wedding themes, discovery workflows, public event rendering, signup tooling, and admin operations.
