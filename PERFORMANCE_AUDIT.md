# Envitefy Loading & Performance Audit

Audit date: 2026-06-05

## Executive Summary

The main load costs are not a single slow component. They come from a global authenticated shell, large client-only route bundles, eager client effects, and heavy media on public marketing surfaces.

Highest impact findings:

| Area | Finding | Impact | Risk |
| --- | --- | --- | --- |
| Global shell | `src/app/layout.tsx` awaits `getServerSession` for every route and wraps every page in `SessionProvider`, `AppShell`, `EventCacheProvider`, PWA, analytics, footer, and global modal helpers. | Raises TTFB and shared hydration cost on public pages. | Medium to fix because routing/auth behavior depends on it. |
| Public landing | `src/app/landing/LandingExperience.tsx` is one large client component importing `framer-motion`, auth modal, concierge sheet, live-card showcase, feature carousel, and all hero slides. | `/landing` is 249 kB first-load JS, and below-fold/interaction code ships before first paint. | Low for dynamic imports; medium for server/component split. |
| Dashboard | Signed-in `/` is 319 kB first-load JS and triggers `/api/history` and `/api/dashboard`, then dashboard enrichment. | Slower app entry, especially mobile. | Medium because dashboard/sidebar state share caches. |
| Public event pages | `/event/[id]` is 490 kB first-load JS. Renderer dispatch appears to pull many event/gym/wedding surfaces into one public path. | Largest public bundle; likely hurts LCP/INP on shared event links. | Medium-high; requires renderer/code splitting. |
| Images/fonts | Landing preloads all carousel hero images on mount and hero images use `unoptimized`. `/snap` uses `next/font/google`, which blocked builds until network was allowed. | LCP competition and build/runtime font dependency. | Low to defer preloads; medium to self-host or remove route-level Google fonts. |
| Duplicate calls | Legacy create modal and nested form both fetch `/api/calendars` when the modal opens. | Extra auth/API work on create interaction; also bundled globally before this patch. | Low to dedupe after confirming legacy path. |

Production build measurements:

| Route | First Load JS |
| --- | ---: |
| `/event/[id]` | 490 kB |
| `/snap` | 343 kB |
| `/` | 319 kB |
| `/studio` | 294 kB |
| `/event/gymnastics/customize` | 282 kB |
| `/chat` | 271 kB |
| `/landing` | 249 kB |
| shared by all | 102 kB |
| middleware | 57.1 kB |

Build note: first build attempt failed in the sandbox because `src/app/snap/page.tsx` fetches Google Fonts (`Inter`, `Outfit`) during build. Rerun with network approval succeeded.

Post-Phase-1 build check:

| Route | Before | After |
| --- | ---: | ---: |
| `/landing` | 249 kB | 201 kB |
| `/event/[id]` | 490 kB | 483 kB |
| `/event/weddings/customize` | 246 kB | 238 kB |
| shared by all | 102 kB | 102 kB |

The biggest confirmed quick-win reduction is the landing page. The shared bundle did not move because the root provider/auth shell is still global; that requires the route-group/provider split described in Phase 4.

## Current Load Map

| Route | Initial files/layouts | Server work before render | Client hydration/effects |
| --- | --- | --- | --- |
| `/` signed-out | Middleware rewrites to `/landing`; root `layout.tsx`; `providers.tsx`; `AppShell`; `landing/page.tsx`; `LandingExperience.tsx`. | Middleware parses token when cookie exists; root layout awaits `getServerSession` at `src/app/layout.tsx:128`. | SessionProvider, AppShell, ThemeProvider, PWA listener, GA route tracker, footer, landing animations, hero carousel, mobile nav state. |
| `/landing` | Same root layout/providers; `src/app/landing/page.tsx`; `LandingExperience.tsx`. | Root session check. Middleware also resolves auth state for `/landing` to redirect authenticated users. | Same as signed-out `/`; no first-paint app data fetch. |
| Sign-in modal | Landing plus `AuthModal`, `LoginForm`, `SignupForm`. | Root session check. | Login uses NextAuth `signIn`; signup calls `/api/auth/signup-source` then `/api/auth/signup`. Before patch, modal code loaded with landing. |
| `/` signed-in dashboard | Root layout/providers; `AppShell`; `Dashboard`; `HomeOverviewDashboard`; left sidebar dynamic import. | Root session check; middleware token check only for protected routes. | `EventCacheProvider` fetches `/api/history`; `Dashboard` fetches `/api/dashboard`; then may POST `/api/dashboard/enrich-next-event`. |
| `/event` | Root layout/providers; AppShell lightweight path; `event/page.tsx`; `SnapLaunchCards`. | Middleware checks only session cookie presence and redirects unauthenticated users. | No dashboard chrome for signed-out. Signed-in still global providers. |
| `/event/gymnastics` | `GymnasticsLauncher`. | Middleware requires product scope for authenticated users. | Launcher upload/status effects only after user action. |
| `/event/gymnastics/customize` | Very large client customize page and gym template components. | Middleware auth/product scope. | Edit mode fetches `/api/history/[id]`; discovery polling and save calls happen after user actions. |
| `/chat` | `chat/page.tsx`; `ConciergeChatClient.tsx`. | Root session check, plus page-level `getServerSession` and `getUserByEmail` for initials at `src/app/chat/page.tsx:50-58`. | Large chat client imports studio generation, studio category tile data, snap upload pipeline, motion, product preview before typing. |
| `/concierge-v2` | `concierge-v2/page.tsx`; `ConciergeV2Client`. | Root session check. | Client module only 7.88 kB route size; event subpages call concierge APIs after navigation/action. |
| `/admin/*` | `admin/layout.tsx` wraps all admin pages. | `requireAdminSession` in layout at `src/app/admin/layout.tsx:27`. Admin dashboard also fetches admin overview server-side. | Admin-only client pages use `/api/admin/*`; build output does not show admin code leaking into landing bundle, but root shared code still applies. |

## Network And Data Call Table

| Route | Call/File | Trigger | Server or Client | Required for first paint? | Blocking? | Duplicate? | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| all pages | `getServerSession` in `src/app/layout.tsx:128` | Every page render | Server | Only for signed-in shell decisions | Yes, TTFB | Often repeated by pages/API | Split public and app layouts or pass lightweight auth state only where needed. |
| `/`, `/landing`, `/snap` | `getToken` in `src/middleware.ts:224-244` | Routes that redirect based on auth | Edge middleware | Needed for redirect correctness when cookie exists | Yes | Similar to root session check | Keep for security; consider cookie-only fast path on `/landing` like `/event` if acceptable. |
| all pages | GA script in `src/app/layout.tsx:235-244` | After hydration | Third-party client | No | No, but competes after interactive | No | Keep but delay/idle-load if INP suffers; do not remove analytics. |
| all pages | Speed Insights in `src/app/layout.tsx:250` | Root layout | Third-party client | No | No | No | Keep, or gate by production if local/dev noise matters. |
| all pages | Global create modal import in `src/app/providers.tsx:15,103` and `src/app/GlobalEventCreate.tsx:4` | Initial client bundle | Client | No | Hydration/bundle | No | Dynamic import modal only when opened. Implemented. |
| all pages | `EventCacheProvider` in `src/app/AppShell.tsx:103` | Global shell | Client | No for public | Hydration | No | Scope provider to authenticated app chrome routes. Defer to Phase 3. |
| signed-in shell | `/api/history?view=sidebar&limit=200&time=all` at `src/app/event-cache-context.tsx:222` | Authenticated mount | Client/API/DB | Needed for sidebar, not dashboard hero | No, but early | Can overlap with dashboard data | Route-scope or reduce initial limit; load sidebar after app shell paint. |
| dashboard | `/api/dashboard` at `src/app/event-cache-context.tsx:260` and `src/components/Dashboard.tsx:342` | Dashboard mount | Client/API/DB | Yes for dashboard content | No server-blocking, but app content waits | Coalesced by provider but route/effect split is fragile | Consider server-loading initial dashboard snapshot, then hydrate cache. |
| dashboard | `/api/dashboard/enrich-next-event` at `src/components/Dashboard.tsx:552` | 80 ms after dashboard data | Client/API/DB/external possibly | No | No, but competes immediately | Also callable by force refresh | Delay to idle or after dashboard content settles; cache by event/origin. |
| dashboard event context | `/api/events/[id]/rsvp?t=...` at `src/components/Dashboard.tsx:610` | Selected event with guests | Client/API/DB | No for page shell | No | Dashboard API already loads next-event RSVP summaries | Load when dashboard tab visible or reuse dashboard payload where enough. |
| create modal | `/api/calendars` in `EventCreateModal.tsx:263` and `EventCreateForm.tsx:289` | Modal open | Client/API/auth | No | No | Yes | Remove one fetch or pass connected calendars down. |
| landing | Manual image preload in `LandingExperience.tsx:846-854` | Landing mount | Client/image network | No | Competes with LCP | No | Defer preloads to idle and only preload non-active slides later. Implemented. |
| chat | `getServerSession` + `getUserByEmail` in `src/app/chat/page.tsx:50-58` | Page render | Server/DB | Initials only | Yes | Root already checked session | Use root session or pass initials from JWT/session if available; otherwise lazy-load profile. |
| chat | `/api/creation/intake`, stream, `/api/history/[id]`, `/api/events/[id]/rsvp` | Thread/live-card state, user messages, event context | Client/API/DB/AI | Mostly no before typing | Some only after state detected | Possible server/client duplication for event details | Split chat intro from creation engines; dynamic import studio/snap pipelines on action. |
| admin | `/api/admin/stats` in `src/app/admin/users/page.tsx:73,211` | Admin users page mount and refresh | Client/API/DB | Admin only | No public impact | Yes in page | Admin-only; not affecting public bundles except shared shell. |

## Unnecessary Calls

| Route | Call | Why unnecessary for initial paint | Fix | Impact |
| --- | --- | --- | --- | --- |
| landing | Preload every hero slide image on mount | Only first active slide is visible; non-visible image downloads compete with LCP. | Idle-defer preloads; consider preloading only next slide. | Better mobile LCP and bandwidth. |
| all public routes | Global `GlobalEventCreate` import | Create modal is interaction-only and not visible on public first paint. | Dynamic import modal on open. | Lower shared/client route JS. |
| dashboard | Dashboard enrichment 80 ms after data | Travel/weather enrichment is not needed for dashboard skeleton or event title. | Idle delay or load after next-event hero paint; cache origin/event. | Less post-hydration contention. |
| chat | Studio generation and snap OCR helpers in initial chat bundle | User may only read/ask a text question; upload/studio generation are later actions. | Dynamic import on upload/generate action. | Lower `/chat` JS and parse time. |
| sign-in | Auth modal bundled in landing | Modal is hidden until user taps login/signup. | Dynamic import modal. Implemented. | Lower `/landing` JS. |

## Duplicate Calls

| Route | Duplicate source | Why duplicate | Fix |
| --- | --- | --- | --- |
| create modal | `EventCreateModal.tsx:263` and `EventCreateForm.tsx:289` both fetch `/api/calendars`. | Parent renders child form and both independently load connected calendars. | Keep one owner of calendar state and pass it down, or remove legacy duplicate after confirming modal path. |
| chat | `layout.tsx:128` and `chat/page.tsx:50` both call NextAuth session helpers. | Root shell needs auth state; chat page repeats it for initials. | Include initials/name in session or client-lazy-load profile. |
| dashboard | `/api/history` sidebar and `/api/dashboard` both project event history. | They use different views but both start on app entry. | Server-provide one initial payload or stagger sidebar fetch. |
| public routes | Middleware token parsing plus root `getServerSession`. | Redirects and layout shell both resolve auth. | Public/app route group split is the durable fix. |

## Bundle Problems

| Package/Component | Loaded where | Problem | Fix |
| --- | --- | --- | --- |
| `framer-motion` | Landing and chat (`LandingExperience.tsx:3`, `ConciergeChatClient.tsx:3`) | Animation runtime ships on initial route load. | Keep for above-fold motion only; dynamic import below-fold animated sections. |
| `AuthModal` | Landing before patch (`LandingExperience.tsx:20`) | Hidden modal, login, signup, recaptcha hooks shipped before interaction. | Dynamic import. Implemented. |
| `ConciergeSheet` | Landing before patch (`LandingExperience.tsx:22`) | Hidden chat assistant UI and guest-chat fetch code shipped before interaction. | Dynamic import. Implemented. |
| `LandingLiveCardShowcase` | Landing before patch (`LandingExperience.tsx:21`) | Below-hero carousel shipped before scroll. | Dynamic import with no SSR. Implemented. |
| `FeatureCarousel` | Landing before patch (`LandingExperience.tsx:32`) | Below-fold template carousel and image UI ships early. | Dynamic import. Implemented. |
| `GlobalEventCreate`/`EventCreateModal` | All pages before patch | Event creation form bundle globally loaded. | Dynamic import modal on open. Implemented. |
| `ConciergeChatClient` | `/chat` | Imports studio API, studio category tile data, snap upload pipeline, product preview and motion before user action. | Split chat shell, upload pipeline, studio generation, and preview adapters. |
| Public event renderer | `/event/[id]` | 490 kB first-load JS implies too many renderers/features in one dispatcher. | Dynamic renderer registry by category/theme; lazy-load owner tools and guest widgets. |
| `next/font/google` | `/snap` | Build depends on fetching Google Fonts and `/snap` first-load is 343 kB. | Use root system fonts or self-host selected fonts; avoid route-level font fetch. |

## Server/Client Boundary Problems

| File | Current behavior | Better behavior | Fix |
| --- | --- | --- | --- |
| `src/app/layout.tsx` | Server layout awaits session and always renders client providers. | Public route group with static/server marketing layout; app route group with authenticated shell. | Phase 4 route-group split. |
| `src/app/providers.tsx` | One client provider wraps everything, including public static routes. | Separate public providers from authenticated workspace providers. | Phase 4. |
| `src/app/landing/LandingExperience.tsx` | Entire landing page is one client component. | Server-render static sections; client islands for hero carousel/nav/modals. | Phase 2. |
| `src/components/ConditionalFooter.tsx` | Client footer calls `useSession` and `useSearchParams`. | Server footer for marketing pages; tiny client iframe/embed suppressor if needed. | Phase 2. |
| `src/app/chat/page.tsx` | Server blocks on DB profile just to compute initials. | Use session name/email initials or lazy-load profile after shell. | Phase 1/2 candidate. |
| `src/components/dashboard/HomeOverviewDashboard.tsx` | Re-renders every second for minute-resolution countdown. | Update once per minute and only when next event exists. | Implemented. |

## Image/Asset Problems

| Asset/component | Problem | Fix |
| --- | --- | --- |
| Landing hero carousel | Manual preloads all mobile and desktop slide images at mount. | Idle-defer non-visible preloads. Implemented; later reduce to next-slide only. |
| Landing hero images | `unoptimized` on `next/image` at `LandingExperience.tsx:898,907`. | Confirm if static public images need optimization bypass; remove `unoptimized` where safe. |
| Landing source images | Some older PNG hero assets are 647-958 kB; webp equivalents exist and are smaller. | Remove unused PNGs if not referenced; ensure all active slides use webp. |
| Menu bottom sheet wordmark | `priority` image inside hidden sheet at `MenuBottomSheet.tsx:154`. | Remove priority; image is not above fold. |
| `/snap` fonts | Route imports `Inter` and `Outfit` from Google. | Self-host or use root system font strategy. |
| Public event pages | Large renderer visuals and widgets likely load eagerly. | Prioritize hero/cover image only; lazy-load maps, owner tools, RSVP dashboards below fold. |

## Caching Opportunities

| Data | Current strategy | Better strategy | Risk |
| --- | --- | --- | --- |
| `/api/history` sidebar | In-memory cache plus private HTTP cache, ETag, stale fallback. | Client should send `If-None-Match` or use provider memory cache more deliberately; reduce initial limit for mobile. | Low-medium. |
| `/api/dashboard` | In-memory 30s fresh and 120s stale cache in `api/dashboard/route.ts:30-31`. | Server-provide initial dashboard payload on `/` and hydrate cache; keep stale-while-revalidate. | Medium. |
| Dashboard metrics | Reads `event_metrics_cache`, then client enrichment POST. | Cache by event+origin; idle-load and only refresh when stale or user requests. | Low-medium. |
| Landing static data | Hardcoded in client module. | Move most constants/sections to server-rendered static components. | Low-medium. |
| Template manifests | Signup template route is edge; many template assets are static. | Long CDN cache with manifest versioning. | Low. |
| Admin analytics | Server-only admin pages. | Keep admin isolated; cache expensive GA4 reports. | Low public risk. |

## Simulated Loading Scenarios

### A. First-time visitor opens landing page on mobile

Middleware rewrites `/` to `/landing` when no session is present. Root layout still awaits `getServerSession`, emits JSON-LD, PWA bridge, GA, providers, `AppShell`, footer, and Speed Insights. The landing client bundle hydrates hero/nav/bottom nav and, before this patch, hidden auth/concierge/menu/live-card/feature carousel code. The first hero image has `priority`, but non-visible hero slides were also preloaded on mount.

Blocking hero work: root session await, shared JS parse/hydration, landing client bundle, first hero image, and after-interactive analytics.

### B. Visitor scrolls below hero

Before this patch, below-fold live-card and feature carousel code was already in the landing JS. Scroll did not cause a fresh code load; it only revealed already-hydrated components. After this patch, those client sections are split and load when rendered by React, reducing initial parse cost.

### C. User opens sign-in

The modal opens client-side. Login calls NextAuth `signIn`; signup calls `/api/auth/signup-source` and `/api/auth/signup`, with recaptcha inside signup. Before this patch the modal stack shipped with landing; after this patch it loads on interaction.

### D. Signed-in user opens dashboard

Middleware allows `/`. Root layout awaits session. `AppShell` shows app chrome and dynamically imports `LeftSidebar`. `EventCacheProvider` fetches sidebar history with limit 200. `Dashboard` asks the provider for `/api/dashboard`; the API resolves the authenticated user, queries recent/fallback event history, loads RSVP aggregates/user RSVP/metrics in parallel, and caches the payload. Dashboard then starts enrichment for next-event weather/travel.

### E. User opens Concierge/chat/create flow

`/chat` blocks server render on session and optional DB user profile. The client bundle includes chat UI, motion, studio generation API helper, studio category tiles, snap OCR upload pipeline, registry helpers, and product preview before the user types. Existing event/thread query params can trigger `/api/creation/intake`, `/api/history/[id]`, or `/api/events/[id]/rsvp`; plain initial chat should defer more of this.

### F. Admin opens admin pages

`admin/layout.tsx` gates admin routes with `requireAdminSession`. Admin route chunks are separate in the production build. Admin does not appear to leak into landing route bundles, but every route still pays root shared providers and middleware.

## Prioritized Fix Plan

### Phase 1: Safe Quick Wins

| Task | File | Exact change | Expected benefit | Risk | Testing |
| --- | --- | --- | --- | --- | --- |
| Dynamic import hidden global create modal | `src/app/GlobalEventCreate.tsx` | Load `EventCreateModal` only when `open` is true. | Reduce shared/global JS and public hydration cost. | Low; modal appears after interaction. | Lint file; click create event. |
| Dynamic import landing hidden/below-fold clients | `src/app/landing/LandingExperience.tsx` | Dynamic import `AuthModal`, `ConciergeSheet`, `MenuBottomSheet`, `LandingLiveCardShowcase`, and `FeatureCarousel`. | Lower `/landing` initial JS parse and hydration. | Low-medium; first tap on modal/menu may load chunk. | Landing mobile/desktop, login/signup, concierge demo, menu, scroll. |
| Defer non-visible hero image preloads | `src/app/landing/LandingExperience.tsx` | Schedule preload after idle/timeout, not immediately on mount. | Less network competition with LCP image. | Low. | Landing hero image and carousel. |
| Reduce dashboard countdown rerenders | `src/components/dashboard/HomeOverviewDashboard.tsx` | Update minute-resolution countdown every 60s and only when next event exists. | Better dashboard INP/CPU. | Low; UI only displays days/hours/mins. | Dashboard countdown still updates within a minute. |
| Remove hidden sheet image priority | `src/components/navigation/MenuBottomSheet.tsx` | Remove `priority` from hidden menu logo. | Avoid priority competition on landing. | Low. | Mobile menu logo still displays. |

### Phase 2: Bundle Reduction

| Task | File | Expected benefit | Risk | Testing |
| --- | --- | --- | --- | --- |
| Split landing server/static sections from client islands | `src/app/landing/LandingExperience.tsx` | Lower `/landing` JS substantially. | Medium. | Full landing visual QA. |
| Split `/chat` action engines | `src/app/chat/ConciergeChatClient.tsx` | Lower `/chat` 271 kB first-load JS. | Medium. | Chat text, upload, studio generation, live-card preview. |
| Dynamic renderer registry for public event pages | `src/app/event/[id]/page.tsx`, renderer registries | Lower 490 kB public event JS. | Medium-high. | Every event type public page. |
| Move footer to server for marketing pages | `src/components/ConditionalFooter.tsx` | Less public hydration/session coupling. | Medium. | Footer visibility, embeds, share pages. |

### Phase 3: Data/Cache Restructuring

| Task | File | Expected benefit | Risk | Testing |
| --- | --- | --- | --- | --- |
| Server-load dashboard initial snapshot | `src/app/page.tsx`, `src/app/event-cache-context.tsx`, `/api/dashboard` helpers | Faster signed-in first useful paint. | Medium. | Dashboard, stale cache, logout/login. |
| Stagger sidebar history fetch | `src/app/event-cache-context.tsx`, `src/app/left-sidebar.tsx` | Less app-entry contention. | Medium. | Sidebar list, create/delete/update events. |
| Cache dashboard enrichment by event/origin | `src/components/Dashboard.tsx`, `/api/dashboard/enrich-next-event` | Fewer immediate POSTs. | Low-medium. | Travel/weather refresh. |
| Dedupe calendar fetch | `EventCreateModal.tsx`, `EventCreateForm.tsx` | Remove duplicate `/api/calendars`. | Low-medium. | Create form calendar save options. |

### Phase 4: Deeper Architecture

| Task | Files | Expected benefit | Risk | Testing |
| --- | --- | --- | --- | --- |
| Split public/app route groups | `src/app/(public)`, `src/app/(app)`, middleware | Lower public TTFB and shared hydration. | High. | All auth redirects, public share pages, SEO metadata. |
| Separate admin shell | `src/app/admin/layout.tsx`, root providers | Keep admin code and auth checks isolated. | Medium. | Admin gating and all admin pages. |
| Replace route-level Google fonts on `/snap` | `src/app/snap/page.tsx` | Build reliability and less font work. | Medium visual risk. | Snap page visual QA. |
| Concierge architecture split | `src/app/chat/*`, `src/lib/concierge/*` | Faster chat entry and lower INP. | Medium-high. | Full Concierge flows. |
