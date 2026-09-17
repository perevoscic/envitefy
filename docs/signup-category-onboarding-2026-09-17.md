# Category signup and football landing — September 17, 2026

## Investigation

The existing email signup and Google callback already read signup source/intent cookies. However, both initialized `visibleTemplateKeys` with every category and only changed `defaultCreateIntent`. Gymnastics inferred a sport suggestion, but did not complete sport setup. Signup source only distinguished Snap and Gymnastics, collapsing football into Snap. The shared Create menu also appended Football whenever any sport was enabled, even if Football was not in the saved visibility list.

`/football` already existed, with an older standalone marketing layout, its own navigation, and no equivalent direct signup controls.

## Implemented behavior

- Marketing visits retain a short-lived, HTTP-only category and original category pathname. Galleries and editors retain that landing pathname. A newly chosen category replaces prior category intent. Paths exclude query strings and fragments. Prefetched pages and signed-in browsing do not change acquisition cookies.
- Every SignupForm primes signup context before either email or Google signup, including generic forms without category props. Explicit intent/current category context takes precedence over remembered context. General signup defaults to Snap.
- `primary_signup_source` now preserves any recognized signup intent. Product access scopes remain independent and retain Snap access for all accounts.
- `buildSignupDefaults` initializes account preferences inside the user INSERT. Both registration methods use the same initializer; an existing OAuth account is returned without resetting its preferences.
- Gymnastics signup selects only Gymnastics and marks gymnastics as the primary enabled sport. Football selects only Football and marks football as primary. Other category signups select their corresponding event category; general Snap signup retains the general menu.
- Snap, Upload and sign-up forms remain universal quick-access tools. Settings can enable other categories. Preferences change what creation menus show; existing events and direct category access remain available.
- Original category/path attribution is stored in `users.feature_visibility.signupAttribution`; explicit Settings updates merge into this JSON rather than replacing attribution. No new schema migration or existing-account rewrite is needed.
- The shared Create menu now respects Football visibility instead of inserting it into all sports accounts.

## Football page

`/football` now uses the shared hero media, signed-out navigation, signup dialog, marketing footer and inert masonry artwork previews. Visitors can select featured football designs, browse the complete gallery, review feature/FAQ sections and continue to their chosen editor after authentication. Shared navigation now sends Football visitors to `/football/templates`, not the generic sports gallery.

New OpenAI hero: `public/images/landing/football/friday-night-team.webp`. FFmpeg encoded libwebp at quality 85/compression 6. Dimensions are 1536 × 1024. The WebP decoded successfully and its generated PNG original was deleted after verification. Exact prompt and checksum: `public/images/landing/football/provenance.json`.

## Validation

- 40 targeted signup, authentication, landing, navigation and visibility checks pass, including executable email/Google callback, cookie, preference, menu and account SQL tests.
- TypeScript semantic and syntax diagnostics for all 18 changed TS/TSX files (including their resolved dependency types): zero diagnostics. The unrestricted repository typecheck exceeded Node’s default 4 GB heap; the scoped check used an 8 GB heap.
- Biome: no errors; two existing optional-chain warnings in auth/legal-acceptance checks.
- VS Code diagnostics wrapper was attempted; the Chat to CLI linter bridge is not running.
- Real local browser checks: Football returns 200, desktop and 375px mobile layouts render, the hero loads, no JavaScript page errors, no mobile or landscape horizontal overflow, featured design selection opens Football signup, and signup-source returns Football while retaining `/football` through gallery context. Real Next.js prefetch requests for Weddings preserve Football intent; the native Next matcher test also confirms protected routes remain matched even with a prefetch header.
- The separate existing gymnastics page source guards still expect old signup CTAs rather than the current Browse templates behavior; those unchanged files were not altered to satisfy stale assertions.

No production deployment or real account creation was performed during verification.

## Football carousel follow-up

Added four OpenAI-generated scenes: stadium lights, a game-night catch, sunset practice, and sideline families. Together with the original team image, these form a five-photo hero carousel on `/football`. Each new image is 1536 × 1024, encoded by FFmpeg with libwebp quality 85 and compression level 6, and verified by metadata inspection and full decoding. The exact generated PNG originals were deleted after verification. Prompts, checksums and final paths are recorded in `public/images/landing/football/carousel-provenance.json`.

The carousel crossfades every seven seconds, offers previous/next and play/pause controls, and starts paused for reduced-motion preferences. Automatic rotation waits for the next image to load and pauses while the page is hidden, the hero is offscreen, the auth dialog is open, or its controls are hovered/focused. Other landing pages retain their existing static hero behavior.

Validation: all five images loaded in a real local browser; autoplay, pause, manual navigation and reduced motion passed. At 375px there was no horizontal overflow or overlap between the controls and headline. No browser page errors occurred. Seventeen relevant regression tests passed, Biome reported no diagnostics for the carousel components, and scoped TypeScript checks reported zero diagnostics across 20 changed files. The VS Code linter bridge remains unavailable.

### Visual variety revision

After comparing the complete carousel, replaced the repeated dusk stadium, evening catch and sunset practice compositions with an overhead field in morning light, a crimson-uniform running back in daylight, and football equipment on a warm wooden locker-room bench. The original night huddle and cheering families remain. The five active slides now vary in subject, viewpoint, setting and lighting. The three superseded WebPs remain available as earlier artwork; the hero uses only the new selection. Exact prompts, final paths, checksums and active order are recorded in `public/images/landing/football/carousel-variety-provenance.json`. All new assets follow the same FFmpeg WebP conversion, verification and original-cleanup workflow.

### Headlines matched to each photo

Each football hero frame now carries its own headline, italic continuation and supporting paragraph: team coordination for the night huddle, season planning for the overhead field, game-day details for the runner, preparation for the equipment, and family participation for the cheering crowd. `LandingHeroMedia` accepts optional content rendered from the carousel's active index, so photo and copy use the same state for autoplay, manual navigation and wraparound. The static hero path still supports existing consumers.

The five text variants share grid cells to reserve their maximum height and keep the calls to action stationary. Inactive wording is hidden from assistive technology; one accessible H1 contains the current headline. Copy follows the photo crossfade and honors reduced motion. Browser checks covered all five headlines on desktop and 375px mobile, image/copy synchronization, forward/back wraparound and stationary buttons. No horizontal overflow or browser errors occurred. TypeScript and Biome checks passed for the four changed files; 13 relevant regression tests passed. The VS Code diagnostics bridge remains unavailable.
