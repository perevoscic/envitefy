# Envitefy Notes For Future Codex

This is the stuff that was not obvious on first read and is worth keeping in one place.

## Reality Check

- The repo still has rename drift. `package.json` says `snap-my-date`, and `README.md` still frames the product as OCR-to-calendar first, but the current app is broader: multi-vertical event creation, public event sites, RSVP/sign-up flows, registry links, and admin campaign tooling.
- Anonymous `/` is not the real landing route. `src/middleware.ts` rewrites signed-out users to `/landing`; signed-in users stay on `/`.
- `npm run dev` does not run plain `next dev`. It goes through `scripts/dev-single.js`, defaults to port `3000`, writes to `.next-dev`, and uses `.next-dev.lock` to block a second dev server.
- Dashboard preference (September 7, 2026): keep the original image-led `InvitationEventCard` design for Upcoming Events, including its event details and action buttons. The user prefers these cards to a compact agenda/list; preserve the cards when adding dashboard data or filters.
- Upcoming cards use left-aligned All, My events, and Invited events filters with count bubbles in place of the visible Upcoming Events heading/count. Counts reflect the complete card list before filtering or pagination, excluding the spotlight event.
- Dashboard Drive tile preference (September 7, 2026): show total route distance in miles and drive duration in hours/minutes. Keep departure times, arrival buffers, traffic notes, and drive update timestamps out of this tile.
- Dashboard panel preference (September 7, 2026): keep Guest responses beside Continue creating. Do not restore the large Needs attention panel; use separate compact Schedule conflicts (second summary tile) and Needs attention tiles with clickable details.

## Template Gallery Standard

- Standing preference (September 7, 2026): use the wedding gallery's square thumbnails for all event template lists and design pickers, including birthdays, anniversaries, weddings, baby showers, gender reveals, and gymnastics.
- Reuse `TemplateThumbnailFrame` and `TemplateThumbnailPreview` from `src/components/events/TemplateThumbnail.tsx`: square viewport, 8px white inset, 1.35rem outer corners, 1rem inner corners, warm neutral border, and the shared soft hover shadow. Render actual event layouts at quarter scale when available; use `scaled={false}` for image or swatch previews.
- Keep thumbnail content inert and hidden from assistive technology; the surrounding link/button supplies the accessible design name and selection action. Keep favorites and selection controls outside the inert preview.
- The decorative wedding hero runway can retain its compact ratio. Full template lists must use the default square preview. Color/font swatches and saved user event cards are separate controls and do not use this gallery standard.

## Envitefy Logo Brand Lock

The lowercase `envitefy` wordmark is a locked brand asset. Do not change any of the settings below unless the user explicitly asks to change the logo itself.

- Canonical component: `src/components/branding/EnvitefyWordmark.tsx`
- Exact typeface: locally bundled **Josefin Slab**, normal style, weight `700`, optical sizing `auto`
- Font asset: `public/fonts/Josefin_Slab/JosefinSlab-VariableFont_wght.ttf`
- Font registration: the `@font-face` named `"Josefin Slab"` in `src/app/globals.css`
- Exact tracking: `letter-spacing: -0.075em`
- Exact default transform when `scaled` is enabled: `scale-[2.95]`
- Exact internal line height and optical padding: `leading-[1.16] pl-[0.02em] pr-[0.14em] pt-[0.04em] pb-[0.16em]`
- Exact primary fill: `linear-gradient(96deg, #6b3cff 0%, #6757ff 22%, #5a7dff 54%, #37a8ff 100%)`
- Exact light/reversed fill: `#ffffff`
- The text remains lowercase: `envitefy`
- Keep `/fonts/` and the font extensions `woff`, `woff2`, `ttf`, and `otf` excluded from authentication middleware so the real typeface loads instead of falling back to Georgia.
- Placement-specific font sizes may remain responsive, but do not alter the canonical typeface, weight, tracking, scale, line height, padding, colors, gradient stops, or font-loading path without an explicit user request.
- `src/app/landing/page.test.mjs` and `src/middleware.auth-routing.test.mjs` intentionally guard this contract. Treat failures as brand regressions, not tests to weaken casually.

## Generated Image Delivery And Cleanup

Standing user rule (September 7, 2026): after generating new raster artwork for Envitefy, convert it to **WebP with FFmpeg**, then **delete the PNG/JPG/JPEG originals** once the replacements are verified. Complete this workflow in the same task, before reporting the images finished.

1. Encode directly from the generated original using FFmpeg's `libwebp` encoder, with quality `85` and compression level `6` by default. Preserve dimensions, aspect ratio, and transparency unless the user requests a change. Save the final `.webp` in the appropriate project asset directory.
2. Verify that every output is an actual WebP file, decodes successfully, and preserves the intended image quality and dimensions. Update application, template, and manifest references to the final WebP paths and check that those paths exist.
3. After verification, delete the corresponding generated PNG/JPG/JPEG originals, including copies in the generator output directory and temporary or project folders. Delete only the exact originals matched to verified WebP replacements; never use a broad deletion glob. If conversion or verification fails, retain that original until a working replacement is ready.
4. Keep prompt/provenance records and final WebP paths accurate, and confirm that the originals are gone while the WebPs remain intact.

This is standing authorization for that cleanup; do not ask the user again for each generation batch. Follow any later explicit request to retain an original or deliver another format. This rule concerns newly generated artwork, not unrelated existing assets or user-supplied reference files.

## My events vs Invited events (product language)

- **My events** — Events you are **creating and owning** in the workspace. That includes manual creation and upload/snap flows when the result is **not** an “invite card” for the core social-invite verticals (see below). Uploading a schedule, flyer, or anything where you are really **authoring your own event** in Envitefy belongs here, even when the source was a file or camera.
- **Invited events** — Events from **uploading/snapping someone else’s invite** for the classic cases: **birthday party**, **wedding**, **gender reveal** invite (and similar invite-card intent). That is “I received an invite” rather than “I’m hosting / creating my event in the app.”

If you upload something **outside** those invite-card cases, treat it as **My events**: you are still **creating** an event in the product.

**Codebase map (how this ties to data and UI):**

- Left sidebar grouping uses `isInvitedHistoryEvent` in `src/app/left-sidebar.tsx`. It is true when `event_history.data.shared` is set **or** when `isInvitedEventLikeRecord` applies in `src/lib/dashboard-data.ts` (explicit `ownership: "invited"` and/or `invitedFromScan: true`).
- Dashboard/home projections use `normalizeDashboardEventOwnership` in `src/lib/dashboard-data.ts`, which treats `ownership: "invited"` or `invitedFromScan: true` as **invited**.

**Drift:** The main OCR save path `saveToEnvitefyHistory` in `src/components/Dashboard.tsx` still sets `ownership: "invited"` and `invitedFromScan: true` for **all** OCR saves; `src/app/api/google/callback/route.ts` does similar for best-effort history inserts. That does **not** yet match the product definition above until those flags are narrowed to true invite-card verticals only.

## Data Model That Actually Matters

- The real app state lives in Postgres plus JSONB, not Prisma. `src/lib/db.ts` is the primary data layer.
- Prisma is partial and not authoritative for the app shape. `prisma/schema.prisma` only models a subset of `users`, `oauth_tokens`, `password_resets`, and `theme_overrides`.
- The real schema lives in `prisma/manual_sql/init_db_pgcrypto.sql` and other manual SQL files. That is where `event_history`, `event_shares`, `promo_codes`, `email_campaigns`, `rsvp_responses`, and the extra `users` columns are defined.
- Most product behavior hangs off `event_history.data`. When mutating event payloads, preserve the canonical top-level fields that downstream queries assume exist: `startAt`/`startISO`/`start`, `endAt`/`endISO`/`end`, `timezone`/`tz`, `category`, `status`, `ownership`, `createdVia`, and title-like fields. `src/lib/dashboard-data.ts` and the history SQL depend on those fallbacks.
- History and dashboard are separately cached in memory. If a mutation changes what users should see, check both `src/lib/history-cache.ts` and `src/lib/dashboard-cache.ts` for needed invalidation.

## Sharp Edges I Would Want To Remember

- `next.config.ts` sets `typescript.ignoreBuildErrors = true`. `next build` is not a reliable correctness check here.
- Use Biome plus the VS Code diagnostics linter after TS/TSX edits. This repo will otherwise let type errors slip through.
- Avoid using TypeScript `unknown` as an escape hatch. Use concrete types when the contract is known, use `void` for ignored return values, and reserve `unknown` for true untrusted boundaries like parsed JSON, external API payloads, dynamic imports, or generic utility inputs. Narrow `unknown` immediately with guards.
- The codebase is intentionally mixed `ts`, `tsx`, `js`, and `mjs` with `allowJs: true`.
- A lot of regression tests are not behavior tests; they are source-shape guards that assert specific strings or structure. If you refactor intentionally, expect to update the guard tests rather than assuming they are wrong.
- Several core files are huge enough that opening them wholesale is a waste:
  - `src/lib/meet-discovery.ts` is about 10k lines.
  - `src/lib/db.ts` is about 4k lines.
  - `src/app/event/gymnastics/customize/page.tsx` and `src/app/event/dance-ballet/customize/page.tsx` are both about 3.6k lines.
  - `src/app/event/[id]/page.tsx` is about 2.2k lines and acts as a public-render dispatcher.
  Start with `rg` on symbols, then use targeted `sed -n` slices.

## Feature Maps

- Concierge V2 was fully removed on September 6, 2026 at the user's request, including its stored records. The current creator is `/chat` (`ConciergeChatClient` -> `ChatProductPreview`, `/api/creation/intake` -> `src/lib/concierge/intake.ts`); published Live Cards use `/card/[id]`. All `/concierge-v2` page paths redirect to `/chat`. Do not restore V2 drafts, APIs, tools, flags, seed scripts, or schema setup. The shared `event-website-schedule.ts` preserves current event schedules independently. `/api/concierge/message` and `/api/concierge/events/[id]/message` belong to the current creator and remain active. See `docs/concierge-route-map.md` for the deletion scope. Verify the full `/chat` UI, not only an isolated preview fixture.
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

- Standing preference (September 5, 2026): Google/Outlook calendar syncing must remain enabled. Keep `CONNECTED_CALENDAR_SYNC_ENABLED = true` in `src/config/calendar-sync.ts`; do not pause it for verification or maintenance unless the user explicitly requests that change. The earlier verification pause is superseded; see `docs/calendar-sync-pause-2026-09-05.md`.
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
  - `npm run lint:vscode -- <touched files>`; this wrapper resolves the installed Chat to CLI extension and provider bridge instead of relying on a versioned extension path.

## Docs Drift

- Trust the route tree, registries, and SQL more than the top-level docs. The README is directionally useful, but it undersells how much of the app now lives in wedding themes, discovery workflows, public event rendering, signup tooling, and admin operations.

## Product Marketing Catalog Contract

- `src/lib/product-marketing-catalog.ts` is the customer-facing product and sales source of truth. The admin email generator imports it directly into the email marketing LLM prompt.
- Every launched customer-facing feature must add or update its catalog entry in the same change. Include the customer promise, concrete proof points, availability (`core`, `event-dependent`, or `specialized`), and when the marketing team should sell it.
- Do not duplicate the complete feature inventory inside `src/lib/admin/email-generation-guide.ts`; keep that file focused on campaign behavior and let it consume the shared catalog so future feature updates reach email generation automatically.
- Do not add admin-only, disabled, feature-flagged, experimental, or unverified capabilities to the marketing catalog.

## Envitefy Video Studio

- The admin Content Studio at `/admin/marketing-images` was retired on September 5, 2026. Its dedicated APIs and Vercel reconciliation cron are removed; do not reintroduce them for local video production. See `docs/admin-content-studio.md`. The customer `/studio` entry was retired on September 7, 2026: it redirects to the public `/envitefy-concierge` explainer, whose creation and authentication actions lead to `/chat`. Live Card attribution links use `/envitefy-concierge`. Keep shared Studio-named renderers/assets used by current cards; the old URL is not the active creator.
- Video production lives in `video-studio/`. For video creation, revisions, aspect-ratio adaptations, or copy accompanying a studio video, read `video-studio/AGENTS.md` and use `video-studio/.agents/skills/envitefy-video-producer/SKILL.md`.
- Standing video preferences are in `video-studio/STUDIO-GUIDE.md`; campaign history is indexed in `video-studio/projects/README.md`. Update these records when relevant feedback arrives so fresh tasks do not need the conversation repeated.
