# Production CSS delivery

The signed-out homepage (`/`, rewritten to `/landing`) and `/landing` use a
smaller global stylesheet. Other routes, including public galleries, editors,
saved invitations and the signed-in dashboard, use the complete stylesheet.
Mobile and desktop use the same route boundary.

`src/app/globals.css` remains the canonical source. Before Next compiles,
`next.config.ts` runs `scripts/lib/runtime-styles.mjs`, which emits content-hashed
assets under `public/styles/runtime/` and an ignored
`src/generated/runtime-styles.json` manifest. The complete output retains all
application utilities and font descriptors. The homepage output scans its
explicit source set, retains the shared appearance rules, and includes only
referenced gallery font families with their complete weights and Unicode ranges.
Keep `LANDING_STYLE_SOURCES` current when adding shared public components.

Middleware overwrites the internal `x-envitefy-style-scope` request header.
`RuntimeStyles` defaults to the complete stylesheet when the header is absent or
unrecognized. It emits a React stylesheet resource in the root layout for the
initial response. `RuntimeStyleBoundary` inside the session provider selects the
destination resource from live router/session state during client navigation and
account transitions; persistent server layouts cannot make that selection alone.
React deduplicates the resource and waits for a new stylesheet before committing
the destination. Strict Next CSS chunking preserves dependency order and limits
unrelated route styles being merged into public chunks. Shared navigation, Concierge and appearance-switch CSS still
load through the root layout. Development retains the ordinary global CSS import
and Next CSS hot reload.

Only the visible hero image is preloaded, with an explicit high fetch priority.
The separate sample image farther down the page uses native lazy loading.

Generated assets have immutable one-year caching. Local generation retains old
hashes, but a fresh deployment contains only its own generated assets. Production
startup does not regenerate CSS or import the build tools. As with other public
assets, standalone packaging must include `public/` and `.next/static/`.
When Vercel Skew Protection is enabled, generated links carry its deployment ID
using the platform's [documented `dpl` query parameter](https://vercel.com/docs/skew-protection),
so open tabs can load their stylesheet from the matching deployment.

## Verification

```sh
node --test scripts/runtime-styles.test.mjs scripts/runtime-css-parity.test.mjs scripts/run-lighthouse.test.mjs src/middleware.concierge-retirement.test.mjs
npm run build
node node_modules/next/dist/bin/next start --port 3117
```

With that production server running:

```sh
node --test scripts/runtime-styles-browser.test.mjs
node scripts/run-lighthouse.mjs --origin http://localhost:3117 --path / --runs 3 --output-dir output/performance-css/after
```

The browser suite checks cold delivery, mobile/desktop and light/dark appearance,
public dialogs, catalog fonts, and client navigation while application CSS is
delayed. Screenshots and measurements are saved in
`output/runtime-styles-browser/`. Set `RUNTIME_STYLES_ORIGIN` to use another server.

The Lighthouse runner defaults to both mobile and desktop. `--profile mobile`
or `--profile desktop` selects one. It preserves every run and reports medians.
Use the same origin, machine, profiles and cache conditions for timing comparisons;
live-site and local-server timing differences cannot be attributed solely to CSS.
The ordinary Next local server uses HTTP/1.1. Use an HTTPS HTTP/2 test origin for
representative production connection behavior, and confirm the request protocols
in the Lighthouse network audit before comparing timings.
