# Signed-out landing page

The anonymous homepage is rewritten to `/landing`; the signed-in dashboard at `/` keeps its existing behavior.

The October 24, 2026 editorial design uses a large approved Envitefy wordmark, a clear invitation headline, a garden portrait and **Create your event** as its primary action. Native scrolling expands a plum arch around the gathering message, reveals occasion cards and assembles a mosaic of original Envitefy artwork. A working guest preview follows the opening message. Warm cream/blush surfaces, plum and berry accents and existing bundled serif typography carry through the public site. The implementation is original Envitefy React and CSS; the external community template was a visual reference only. No template source, photographs, fonts, animation libraries or attribution assets are bundled. Authored artwork and sample invitation paper retain their colors in both app appearances.

## Shared public design

- `src/components/marketing/MarketingPage.tsx` provides scoped semantic colors, typography and celebration, sports and product tones. Its CSS never changes the application palette globally.
- Desktop marketing headers and heroes span the viewport with fluid gutters. At 1024px and above, public navigation and account actions appear inline and the mobile menu trigger is hidden. Phones and tablets retain their menu.
- Other public landing headers match the homepage's flat 80px bar, approved image wordmark, bottom divider, default cream/plum palette, outlined account-action pill and plain 44px menu control. The same header palette applies on sports and product pages while their content retains its category colors. Page-local links and primary actions keep their destinations; desktop links use the homepage's small uppercase typography. The account action remains visible on phones and a distinct primary header action appears above 960px. Shared public headers remain fixed to preserve existing hero clearance, with scroll-direction hiding and keyboard access; this shared styling does not change the homepage's own header or large-wordmark visibility behavior.
- Public headers hide on downward scrolling and return upward, ignoring small reversals. The homepage header starts visible with only its small logo hidden while the large opening wordmark is in the viewport. The small logo is hidden in the server/initial render, retains its layout space, returns after the large wordmark leaves, and reveals on keyboard focus. The homepage header stays sticky in its original flow space; other public headers remain fixed. Open menus/dialogs and keyboard-focused header controls keep navigation visible. Dialog scroll locks reset direction tracking; reduced motion removes the slide transition. Without JavaScript, navigation controls remain available.
- `MarketingHero.tsx` provides a static, readable headline, explicit navigation actions and an optional artwork/product-preview slot. Copy and actions precede previews on phones. Use existing local artwork and bundled font families.
- `ConditionalFooter.tsx` retains the existing shared footer, social links and privacy control, with a scoped editorial skin. Public navigation continues using existing authentication and page-local links.
- The homepage closes with a solid soft blush (`#F3E1E5`) CTA with a straight top edge, plum (`#482B3E`) footer and deeper plum (`#3B2333`) copyright strip. Keep cream footer text, the canonical white wordmark and white social icons in both appearances. The footer retains only device safe-area padding, with no blank strip for the retired bottom navigation or Concierge launcher; phone copyright links leave room beside the icon. This palette is scoped to the signed-out homepage and `/landing` footer.
- Celebration pages use `CelebrationLanding.module.css` and `CelebrationPreview.tsx`; product/sports pages use `ProductSportsLanding.module.css`; supporting pages use `supporting-public.module.css`. Guest previews use the canonical `data-appearance-scope="authored"` boundary so appearance compatibility rules cannot recolor their contents.
- `MarketingMotion.tsx` enhances declarative `data-motion-scene` and `data-motion-reveal` hooks using a single scheduled frame per scroll/resize, with no idle loop. `data-motion-range="contain"` follows a bounded sticky scene; `exit` follows the target's bottom from the viewport bottom to 30% down by default, with an optional descendant `data-motion-target`. Optional `data-motion-exit-start` / `data-motion-exit-end` specify alternative viewport fractions; invalid/reversed ranges retain the defaults. Content is visible without JavaScript; live reduced-motion changes restore static content and remove long sticky scenes. Keyboard focus reveals controls immediately. The homepage has a shorter phone composition.
- Keep natural scrolling, reserved image space, 44px or larger interactive controls and visible keyboard focus. Do not import reference source, global resets, split wordmark or animation runtime. The large opening uses the whole approved wordmark asset without recoloring or changing its letter geometry.

## Route coverage

- Main introduction: anonymous `/` and `/landing`.
- Celebrations: `/weddings`, `/birthdays`, `/anniversaries`, `/baby-showers`, `/bridal-showers`, `/gender-reveal`.
- Coordination: `/signup-forms`, `/sport-events` and its `/sports` alias, `/football`, `/gymnastics`.
- Product introductions: signed-out `/snap`, `/envitefy-create`, `/invitation-maker`. The authenticated Live Card introduction has coordinated styling; its builder remains separate.
- Supporting public pages: `/about`, `/how-it-works`, `/who-its-for`, `/guides` and its shared article renderer, `/faq`, `/contact`, `/privacy`, `/terms`, `/delete-account`, `/showcase`.
- Public template gallery headers/filters share the visual language. Football opts into its public gallery skin with `publicView`; its editor gallery keeps its existing behavior.

Non-homepage public creation actions use `PublicCreationLink` when their destination requires an account. Its account dialog is portaled to the document body so animated content cannot clip it, and signup and login retain the explicit creation destination. Gender-reveal actions retain their own editor and signup intent. The signup landing page's Browse templates actions remain public; its Claim/Undo interaction is an explicitly local sample that never submits a response.

Supporting pages, guide articles and product introductions share the public Concierge launcher. Existing support contact behavior remains in `GuestChatWidget`, with the e-symbol launcher enabled only for marketing callers. `PublicConciergeWidget` covers the other signed-out pages and unmounts when an authenticated session begins. Public template galleries use the editorial footer. Signed-out template customization keeps the shared public header above the editor controls, with room for navigation on phones and desktops. Guests can edit before signup; saving or publishing requires an account. Header authentication retains the current browser draft without implicitly saving, while an explicit save resumes after authentication. The sign-up editor stays mounted as the account navigation appears. Non-homepage `HeroTopNav` callers opt into an explicit editorial tone for their portaled phone menus; the homepage keeps its existing navigation and appearance.

Each page retains category-specific artwork, content and destinations. Wedding and shower studios, birthday demos, sports query choices, public template selection, metadata, JSON-LD, category anchors and existing account continuations remain. Public template creation loads the same native Event Page and Sign-up Form editor modules as internal creation, with identical editing controls and behavior; public navigation and the authentication requirement at Save/Publish supply the access differences. Do not maintain a separate public editor or recreate its tools. Contact/deletion handlers, reCAPTCHA and legal wording remain intact. Individual event/card/showcase rendering, the signed-in dashboard and editing workspaces do not inherit marketing typography or surfaces.

Guest publishing offers **Create an account & publish** and **Sign in & publish** within the existing editor actions. These explicit choices retain the publication intent through credentials or OAuth and resume the same native publisher after authentication, including its validation. Save draft remains private, and ordinary header authentication does not publish. Cancelling authentication clears the pending publication; failed or consumed requests are not replayed by later login or reload.

## Structure and behavior

- `/gymnastics` links to `/gymnastics/templates` from its create/design links and Browse templates header action. The former featured “Make it yours” gallery is removed from the landing page. Its remaining local section links align the section boundary with the viewport top on desktop and phones, using the same CSS scroll margin for native fragments and header navigation while retaining authored section padding, history and reduced-motion behavior.

- `LandingExperience.tsx` owns the compact header, account dialog, guest benefits, live examples, native FAQ disclosures and final creation action. The header starts with Categories (`#categories`), without a separate Templates link. Native fragment navigation aligns the collection with the viewport top and its introduction directly below the navigation, keeping all eight category artworks and labels fully revealed. Existing `#examples` links retain the same behavior; ordinary scrolling retains its reversible sequence. The shared application footer remains outside this component.
- `sections/LandingCategoryCollection.tsx` owns all eight category links. Its category photographs come from `src/lib/landing-category-media.ts`, shared with the artwork mosaic and separate from historical hero galleries. The photographs use distinct subjects: a bride and groom, children celebrating, baby gifts, bridal friends, a vivid pink-and-blue reveal, volunteers signing up and several sports together. These seven new 1024 × 1536 WebPs are under `public/images/landing/categories/stories-2026/`; the accepted gymnastics photograph remains under `editorial-2026/`. All were generated without existing image references; exact prompts, hashes, encoding and cleanup records are in `docs/landing-category-media-2026-10-27.json`. On desktops at least 1280px wide and 700px high, one bounded sticky row opens colored arches from left to right: each arch rises, its cover wipes down, the image settles from a zoom and the label appears. Phones use compact natural-flow rows, with each card following its own reading progress. Artwork and labels complete their reveal around 67% down the phone viewport, one third up from the bottom; upward scrolling reverses the reveal. Tablets/short desktop windows and no-JavaScript/reduced-motion views show fully open cards without a long sticky region. Keyboard focus opens its card immediately; original public destinations and `examples`/`categories` anchors remain.
- `sections/ProductLandingHero.tsx` owns the opening, expanding gathering message, local sample RSVP and guest-action explanations, occasion links and three creation steps. `LandingArtCollage.tsx` owns the artwork mosaic. Sample interactions stay in memory and never call a guest-response or save API.
- `LandingHowItWorks` keeps light “Less planning.” above upright bold “More celebrating.” and the showcase link. The three ruled rows preserve their original ordered titles/descriptions and existing `birthday-step` photos behind cream 01/02/03 numerals at reduced but visible opacity; each adds a useful supporting paragraph and three highlights about starting options, event details or sharing. The pink tile rotates “From idea” / bold “to invited.” to read vertically from bottom to top. On desktops at least 1024 × 650 CSS pixels, the smaller heading and shorter tile fit the viewport and the introduction uses native sticky positioning while the right rows scroll, releasing at the section end. Below either threshold the introduction stays in normal flow; phones/tablets retain stacking. Outer top/bottom padding remains half its former size. Preserve bundled variable serif, native reveals, complete reduced-motion/no-JavaScript content, `how-it-works` and existing sample/creation actions.
- The “Every kind of together.” mosaic has twelve rounded tiles in a six-column, three-row desktop composition: seven original artwork links and five original type/check/stripe tiles. Wide desktops at least 1100 × 700 CSS pixels assemble the tiles from a small centered stack into their final cells over a bounded 170%-viewport scroll path, with a sticky full-screen stage and Concierge clearance. Keyboard focus completes the board immediately. Tablets reflow to three columns and phones to two, using natural-flow per-tile reveals; all seven destinations stay visible. No-JavaScript/reduced motion displays the complete grid without the long scene. Preserve the authored artwork colors and the original gallery links. This replaces the rotating card fan and its hidden mobile items.
- The opening and gathering message remain adjacent sections in normal page flow. Desktop (at least 720px) waits until the middle seed's baseline reaches 85% of the viewport, then completes when the hero bottom reaches the greater of 10% viewport height or the 96px native anchor clearance. Use a gentle accelerating expansion and later copy fade so the bubble remains narrow and the hero readable longer. Phones retain the hero-bottom-at-viewport-bottom trigger and 70%-viewport travel. Measure the middle seed on resize/font readiness; expand its rounded mask, bridge and gathering background with the same progress while the six surrounding arches drift apart and dissolve. Reveal the message near completion and preserve the native `#gathering-note` anchor. The former A little more together scroll cue and its row are removed. Phones center the portrait above the seven arches; the portrait retains its opacity as it drifts away with scrolling. No pinned opening or extra scroll spacer is used. No-JavaScript/reduced motion retains the visible static sections. The gallery no longer includes the former browse-before-signup sentence.
- The gathering heading uses a scoped alias for the existing bundled Cormorant Infant variable serif. As the heading moves from the lower viewport toward its reading position, “the” and then “people.” gain weight from 300 to 700 and change from cream to pink. Add a subtle 0.014em stroke to “people.” that grows with the same progress for stronger emphasis. Reserve the final bold word dimensions without duplicating accessible text. Keep the completed bold pink treatment without JavaScript or with reduced motion; do not change global font descriptors or import reference fonts/libraries. Supporting copy explains invitations, RSVPs, schedules, directions, guest updates and volunteer sign-ups.
- The gathering message fills at least the current viewport height on desktop and phones. Once the full text block, including its link, reaches the viewport bottom, the complete plum surface and text gradually shrink to 90% with softly rounded corners over the next 75% of viewport scroll. Measure the untransformed layout clearance below the copy so scaling cannot move its own trigger; refresh after font, content and viewport size changes. Keep the full-height layout footprint and following links in normal page flow, reversing the shrink on upward scrolling. Keyboard focus restores the full-size section; no-JavaScript/live reduced motion keeps a static full-size message. Use a minimum height so short screens or larger text can expand it, with phone navigation/safe-area clearance.
- `sections/LandingGuestBenefits.tsx` presents “Less chasing. More celebrating.” with a light serif first phrase, upright bold second phrase and supporting copy beside the heading. Four solid pink, berry, pale blue and blush cards spell RSVP with decorative R/S/V/P initials for RSVPs, Sign-up forms, Venue & details and Planning together. Their copy covers guest responses, supplies/potluck/volunteer sign-ups, directions/arrival/event details and co-host planning; retain the showcase link. Wide desktops have four columns with alternating card offsets; tablets have two columns and phones one, without offsets. Reuse the shared once-only reveals with a nested card tilt/scale settling to neutral; keep normal page flow, readable static no-JavaScript/reduced-motion content and scoped original code/assets. The former inline benefit list and its unused CSS were removed.
- Explicit creation opens the shared account dialog with `/create` as its continuation. Ordinary login and general menu signup return to `/`. Authenticated creation goes directly to `/create`.
- Public category links and template browsing remain available before signup. All eight featured categories remain reachable.
- The signed-out bottom navigation bar is retired. The homepage and shared public-page chrome show an always-available Concierge launcher: the existing gold Envitefy e/chat symbol at 56px on phones and desktops, with a plum background clipped inside the speech bubble. It fills the former phone circle's footprint without an extra surrounding circle, border, shadow or visible label. Keep its accessible name, focus outline and 56px touch target. It opens the existing help chat; the header retains navigation and explicit creation actions. Keep phone safe areas without adding a blank footer strip.
- Concierge answers all five suggested questions and clear common product questions synchronously from shared product knowledge, without a network request or Thinking state. The same fast answer resolver runs on `/api/guest-chat`. Contextual or unfamiliar product questions retain streamed responses, with a 2.5-second server first-text deadline and an eight-second total AI deadline. Browser transport also bounds stalled connections and response bodies, preserves partial streamed text and keeps local answers in follow-up history. Unknown product facts must not become unsupported canned claims.
- Once a conversation or draft question starts, New conversation returns to the welcome message and five starter questions without closing Concierge. It clears the transcript, input and suggested account action, cancels a pending reply and moves keyboard focus to the first starter. Every dismissal (Close, Escape, outside click on any screen or parent closure) clears the conversation too. Reopening starts fresh; a canceled response cannot reappear or interrupt a newer request. The separate guest-help widget also clears its support-contact fields and pending submission state on restart or close.
- Concierge uses an anchored popover inspired by the Barbara reference: a compact rounded panel above the e/chat icon, with a small pointer aligned to the button and a subtle fade, six-pixel lift and 0.95-to-1 scale. Keep Envitefy's existing colors, content and 56px icon. The panel is capped at 384 × 544 CSS pixels, stays inside 16px viewport gutters, can flip below the icon when needed, and follows resize, safe areas and the visual viewport. Its transcript scrolls independently while the page remains usable, with no scrim or page lock on phones or desktop. Welcome questions start at the top; later replies scroll into view. Reduced motion is immediate, including live preference changes. This replaces the earlier genie stretch and phone bottom sheet.
- The same e/chat launcher toggles Concierge open and minimized on the homepage and shared public pages. Expose its expanded state and switch its accessible label from Open to Minimize while open. Exclude launcher presses from outside-click dismissal so pointer-down cannot close and then reopen it. Keep the popover above the icon with a 12px gap so the composer stays usable. Minimizing clears the conversation and cancels pending replies just like Close; Ask Concierge in the FAQ remains an explicit open action.
- The popover's lift and retreat follow its resolved side, including a flip below the launcher. Keyboard opening moves focus inside; Escape and Close return focus to the opening control. Outside clicks and tabbing into the page keep the new focus instead. Phone opening focuses the panel without raising the keyboard. Both chat variants use instant welcome/reset scrolling and honor live reduced motion for later replies; keep close targets at least 44px.
- `landing-hero`, `examples`, `guest-flow`, `creation-paths` and `showcase` preserve existing links. The `showcase` wrapper exists before its deferred content loads; the reused card gallery receives `showcase-cards` as its inner section ID.
- The Live Card carousel keeps the center and two neighbors on each side mounted as live previews. Farther cards use lazy artwork posters with the snapshots' original 1024 × 1536 dimensions, so wide screens show filled side cards at the same 2:3 proportions without mounting every live action surface.
- `sections/LandingTestimonials.tsx` follows Good questions and retains the editorial feedback style: a giant faint active number, vertical label/progress rail, small occasion pill, large light sans-serif quote, author/role, round 48px arrows and a faint occasion ribbon moving continuously from right to left. One complete quote fits on desktop, tablet and phone. All 24 original guest/host quotes and attributions from `landing-data.ts` remain rendered under `testimonials`, with native horizontal swiping, previous/next controls and Arrow/Home/End keyboard navigation. Quotes advance automatically every six seconds while visible and wrap from the last to the first. Keep only the original previous/next arrows, with no play/pause button. The large number gently follows the mouse within a 20px horizontal / 10px vertical range using a separate translation wrapper so its entrance remains intact; reset on pointer exit/cancel, window blur, hidden/offscreen views and live reduced motion. Mouse movement keeps rotation and the ribbon running; keyboard focus pauses them temporarily until focus leaves, and hidden/offscreen views pause. No-JavaScript and reduced motion keep static complete content with immediate manual scrolling. Preserve rapid-navigation requests and synchronized quote/author/number/progress. Keep no portraits, ratings, verification claims or new motion runtime.
- Testimonial buttons and arrow keys accumulate their requested destination independently from the visible quote, so rapid input does not lose steps. New pointer/wheel gestures take over, while scroll completion resolves a pending newer button target if an older native wheel snap canceled its smooth move. Preserve the active/requested quote on resize and complete pending movement when reduced motion becomes active. Finite native CSS entrances animate the active quote's words, occasion, author and number while retaining one complete accessible quote; no-JavaScript/reduced-motion views keep static readable text.
- `sections/LandingQuestions.tsx` presents twelve FAQ answers beneath “Good questions.”: the original four topics plus sharing, RSVPs, guest fields, directions/schedules, manual calendar actions, gift links, sign-up forms and co-hosts. Keep supported-event/settings qualifiers and no automatic calendar-sync promise. Use a light opening and bold second word from the bundled serif. Desktop places the introduction beside the questions. At least 1024 × 650 CSS pixels, the introduction uses native sticky positioning while the questions scroll through the final item, releasing at the section end. Below either threshold it remains in normal flow; phones stack the introduction above the questions. Native `details`/`summary` disclosures retain no-JavaScript and keyboard operation, fine dividers and 44px outlined plus/minus controls. Keep Ask Concierge connected to the existing help chat and the `/faq` destination.
- The global install toast stays off the signed-out homepage so it cannot cover the header. Existing installation options elsewhere remain available.

- The RSVP cards retain soft plum shadows and share one subtle rose/cream surface sheen with a darker plum/berry border glint. Fine hover pointers move one light field across the full grid and its gaps; each rounded card samples it at its measured offset. On touch/coarse screens, the shared reading light sits around 58% down the viewport and drifts diagonally through the card stack with native scrolling, retracing its path on upward scrolling. The light stops with the page and pauses offscreen. Keep the touch wrapper lift but omit nested tilt/scale, updating offsets through the lift so the field remains aligned. Use passive listeners and animation-frame updates without autoplay or touch interception. Overlay layers remain below text and ignore pointer input. No JavaScript and reduced motion keep static cards; live reduced-motion changes clear the effect immediately.

## Verification

Production builds retain the homepage's complete utility dependency set in root
CSS, including account dialogs, navigation, Concierge and the deferred Live Card
showcase. Other routes and the authenticated dashboard also receive the complete
original utility catalog through `RuntimeUtilityStyles`, rendered as a stylesheet
resource in server HTML and maintained across client navigation. The full catalog
deliberately overlaps the critical subset to preserve original cascade order.
Keep both stylesheet resources inside `Providers`, with AppShell rendered
directly. An enclosing empty `Suspense` fallback can stream the entire shell into
a hidden container whose reveal requires JavaScript; moving only the styles
outside it does not solve that case. React coordinates stylesheet loading across
the client commit without that enclosing boundary.
Root foundations, theme variables, appearance boundaries, typography and persistent
navigation CSS remain in place. Development keeps the original full stylesheet
and normal automatic source watching.

`npm run build` runs `scripts/build-runtime-utilities.mjs` before Next's parallel
CSS compilation. This creates the immutable `public/styles/runtime-utilities-*.css`
asset, generated URL and source/declaration manifest. PostCSS only validates and
reads those outputs. After changing runtime sources, direct `next build` requires
regeneration first; stale inputs fail with the regeneration command. Run
`node scripts/build-runtime-utilities.mjs --check` to verify generated delivery.
`node --test scripts/runtime-utility-delivery.test.mjs` verifies complete-rule
parity, ordering, foundation preservation, stale detection and development/SSR
loading boundaries. Real production widget and route delivery is checked by
`scripts/homepage-performance-browser.test.cjs` against an explicitly supplied
`ENVITEFY_PERFORMANCE_ORIGIN`; it never starts a development server.

### Performance verification, October 27, 2026

The implementation retains the existing artwork, typography, appearance palettes,
motion, template destinations and account actions. It changes asset delivery:

- Production root CSS keeps 1,443 utility entries needed by 144 homepage/chrome/
  widget source files; every original utility remains in the complete catalog.
  Generated critical root CSS is 43,733 gzip bytes versus 134,323 before the split.
  Production CSS transfer in the local homepage audit fell from 195,362 to
  101,549 bytes across the seven initial stylesheet requests.
- The full 660-descriptor gallery font catalog is omitted on anonymous Home.
  Homepage Inter/Playfair subsets total 79,452 bytes, saving 89,104 bytes versus
  the full WOFF2 preload pair. Full original families and Unicode fallbacks remain.
- Prepared wordmark sizes retain the original artwork; hidden header variants
  are lazy. The Concierge mask is 3,514 bytes versus the 41,490-byte original.
  Its anonymous-CORS, high-priority preload matches the CSS request and avoids
  the duplicate fetch found in the earlier production trace.
- Account, menu and Concierge modules load on first opening and remain mounted
  for close/reset cleanup. Testimonial scroll updates reuse measured card
  offsets; marketing scenes share geometry reads within each update.
- The empty root AppShell Suspense wrapper was removed after actual no-JavaScript
  checks found the whole page inside hidden streamed containers. The rebuilt
  homepage, birthday landing and gallery now visibly render without JavaScript.
  Footer heading hierarchy and 44px link targets were also corrected.

Three cold simulated-mobile runs per route used Lighthouse 13.4.1 against the
local production build. These are local measurements, not a new public PageSpeed
result. Medians from `output/lighthouse/2026-10-27T22-33-27.804Z-WYiCWc/summary.json`:

| Route | Performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 81 | 2.11s | 4.69s | 24.5ms | 0 |
| `/landing` | 81 | 2.11s | 4.82s | 24ms | 0 |
| `/gymnastics` | 60 | 5.86s | 10.07s | 43.5ms | 0.0019 |
| `/snap` | 67 | 3.91s | 7.37s | 26.5ms | 0.0203 |

The first local implementation-stage homepage median was 74 / 2.71s FCP /
5.79s LCP, using the same runner. LCP still exceeds the 2.5s error budget on every
configured route, so the complete Lighthouse command correctly exits nonzero.
Every run, median, HTML report, trace and network log is retained; a best outlier
is never substituted for a failing budget.

An isolated native-image version of the same Concierge icon was tested and
discarded: median LCP was 4.67s versus 4.69s with the mask, with different edge
rasterization during interaction. All generated experiment files and the original
mask were restored with matching hashes. The shipped source retains the mask.

The next performance work is the remaining critical rendering path, rather than
more icon compression. Roughly 30KiB of unused CSS comes from Next's CSS chunk
coalescing: those files also contain required homepage button, motion and chrome
styles, so deferring entire files is unsafe. Evaluate `cssChunking: "strict"`
with emitted-module, request-count and cross-route appearance comparisons before
adopting it. The category and Snap routes also need their own measured delivery
work; the homepage utility closure does not replace their full catalog.

Verification passed: production build with application type checks and 153 static
pages; 36 final delivery/asset/runner/homepage contracts; 28 customer-entrypoint
checks; 14 PWA/routing checks; CSS/font parity and 64 subset pixel/metric cases;
the phone/desktop light/dark landing matrix; and the production browser smoke.
Appearance, signed-in navigation, category hero/dark appearance, birthday gallery,
showcase, motion and Concierge regression checks also passed during the change.
The broad CSS parity check initially exceeded its 60s limit during a concurrent
build; its isolated rerun passed in 24.37s.

The final production smoke passed in 42.57s, with evidence in
`output/homepage-performance/delivery.json`: visible no-JavaScript content on all
three public routes, real Next client navigation, full font loading, actual CSS
order and a conflicting-utility probe, compressed immutable stylesheet delivery,
one mask fetch per context, native account controls, Concierge answer/reset/reopen
and live showcase Details open/close on light/dark 390px and 1440px viewports.
It recorded no uncaught page errors. Authenticated Home needs an authorized
storage state for this production smoke; fixture tests cover its loader/session
states. Google rejects the configured public reCAPTCHA key on localhost, so the
test does not certify provider authentication or Concierge after signup on the
public domain. Signup UI checks run last to avoid that local error badge.

Local SEO 92 reflects Lighthouse 13.4.1's `head meta` gatherer: browser HTML and
hydrated DOM contain the description in the streamed body, while Twitterbot's
response contains it in the initial head. The metadata remains present; no
audit-only streaming override was added. The unrelated baby-shower static
`gallery previews` render test also reproduces its 0/60-marker failure on the
unchanged starting commit, because `renderToStaticMarkup` does not resolve its
Next dynamic thumbnail. That fixture failure is not an established product defect.

### October 28 follow-up and accepted stopping point

The user accepted the measured **2.52–2.80s mobile LCP range** and requested no
further optimization. These are actual DevTools-throttled browser measurements
against the local production app, not a new public PageSpeed result. The three
runs were 2,727 / 2,803 / 2,525ms, with a 2,727ms median. Evidence is in
`output/lighthouse-throttling-compare/2026-10-28T15-49-27.947Z-devtools-2lZaVy/`.

The retained implementation:

- Disables Next CSS chunk merging (`experimental.cssChunking: false`). Home now
  receives three stylesheets totaling 66,967 transferred bytes, versus seven /
  101,549 bytes in the prior build. Strict chunking was rejected after it produced
  thirteen initial requests and slower browser results.
- Uses the same Concierge artwork as a 3,514-byte native gold image. Its resized
  alpha and authored gold are exact; the plum backing, 56px control, hover/press,
  popover, keyboard and reset behavior remain. This avoids the late CSS-mask
  paint observed during hydration. The old white mask asset stays available.
- Provides a media-matched, high-priority mobile portrait preload and native
  picture with AVIF/WebP fallback. The 480px AVIF is 13,829 bytes and retains the
  original photograph's 59%-center crop; the desktop source and all frame/motion
  styles remain. Public AVIF paths bypass authentication middleware, with a
  framework matcher regression that also checks protected application routes.
- Loads the unchanged unsaved-progress dialog library when an editor registers,
  rather than on every anonymous visit. Dirty navigation remains blocked while
  loading; failed chunk requests preserve work and allow retry. Theme-color
  formatting and sidebar dimensions no longer pull unrelated template and OCR
  registries into the startup bundle.
- Keeps all 24 testimonial texts and attributions while rendering per-word
  animation spans only for the active quote, including the first SSR quote.
  This removes 523 initial elements. Seventy-two comparisons preserve dimensions
  and line breaks; word positions differ by at most 0.125px on inactive text.
- Compacts unused glyph-ID slots in the same Latin-extended homepage fonts,
  saving another 7,920 bytes without changing character coverage, outlines,
  hints, layout features or current rendering (224 pixel/metric comparisons).
  Footer images are lazy; the five-size favicon retains every RGBA pixel in
  lossless PNG entries, reducing it from 34,494 to 17,807 bytes.

Build `vWvf8Emi6lwL8q895O-FC` passed compilation, application type checks and all
153 static pages on Next 15.5.28. The Next/dependency update came from concurrent
workspace work and was preserved. The final static font/photo compaction does
not change compiled application code; its exact hashes are recorded in
`output/performance-oct28-final-asset-manifest.json`.

Regression verification passed: 44 delivery/runner/homepage/middleware contracts;
63 shell/sidebar/onboarding/event-paper checks; 28 customer-entrypoint checks;
four CSS parity/delivery checks; five font/catalog checks; the full landing
matrix; four motion checks; unsaved-progress/editor Back checks; Concierge and
dark-appearance browser suites; and the actual production navigation/widget
smoke in all four phone/desktop light/dark contexts. The smoke also confirms
visible no-JavaScript pages, full saved-font delivery, CSS cascade order, one
native Concierge request, decoded mobile portraits and no uncaught page errors.

The last full simulated Lighthouse matrix, before the final static compaction,
reported Home 85 / FCP 1.81s / LCP 4.14s / TBT 14ms / CLS 0; Gymnastics LCP
9.61s and Snap 6.92s. Those simulated LCP budgets still fail. The runner retains
the original 2,500ms error threshold and every-run checks. It was not rerun after
the user's stopping instruction. No deployment or public PageSpeed retest was
performed. Unverified follow-up motion-startup and layout-auth experiments were
removed; the restored application files match the measured build's source hashes.

Run the landing contracts, authentication routing and marketing navigation checks:

```powershell
node --import ./scripts/lib/create-offline-network.mjs --test --test-concurrency=1 src/app/landing/page.test.mjs src/middleware.auth-routing.test.mjs src/components/navigation/marketing-hero-nav.test.mjs
```

The isolated product browser test uses the real landing components and styles with local artwork, substitutes only the heavy lower live-card gallery and authentication forms, and checks light/dark responsive layouts and sample interactions. Its generated screenshots belong under `output/landing-product/`. Verify actual Next.js delivery as well, particularly account dialogs, prepared wordmark images, deferred example navigation and shared phone/desktop help controls.

`node --test scripts/landing-showcase-browser.test.cjs` exercises the actual Live Card carousel separately, checking filled side artwork and matching proportions on wide screens, navigation into distant cards, detail panels/fullscreen and phone sizing. Screenshots are written to `output/landing-showcase/`.

Run the category render/route checks and customer/appearance suites when shared public components change:

```powershell
node --test src/app/category-pages/celebration-render.test.mjs src/app/category-pages/page.test.mjs src/app/baby-showers/page.test.mjs src/app/bridal-showers/page.test.mjs src/app/guides/page.test.mjs src/app/faq/page.test.mjs
npm run test:customer-entrypoints
npm run test:appearance
npm run typecheck
npm run build
```

The motion driver has isolated browser coverage in `scripts/marketing-motion-browser.test.cjs` for progress ranges, no-JavaScript visibility, keyboard focus, live reduced motion, idle scheduling and cleanup.

Actual Next.js route screenshots and responsive verification for this design belong under ignored `output/landing-editorial/`.
