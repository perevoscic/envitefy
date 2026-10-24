# Signed-out landing page

The anonymous homepage is rewritten to `/landing`; the signed-in dashboard at `/` keeps its existing behavior.

The October 24, 2026 design develops the approved product-first concept. Its first screen explains the invitation and event-page product, shows a guest preview and makes **Create your event** the primary action. A static headline, restrained serif typography, lavender accents and soft app surfaces replace the photographic hero carousel. Authored artwork and the sample invitation's cream paper retain their colors in both app appearances.

## Structure and behavior

- `LandingExperience.tsx` owns the compact header, account dialog, category directory, guest benefits, live examples, native FAQ disclosures and final creation action. The shared application footer remains outside this component.
- `sections/ProductLandingHero.tsx` owns the hero, local sample RSVP and guest-action explanations, occasion links and three creation steps. Sample interactions stay in memory and never call a guest-response or save API.
- Explicit creation opens the shared account dialog with `/create` as its continuation. Ordinary login and general menu signup return to `/`. Authenticated creation goes directly to `/create`.
- Public category links and template browsing remain available before signup. All eight featured categories remain reachable.
- The homepage supplies its own Templates / Examples / Create / Help / Menu bottom navigation. The optional creation callback on the shared navigation leaves other pages' creation sheets intact.
- `landing-hero` drives shared Concierge and phone-navigation visibility. `examples`, `guest-flow`, `creation-paths` and `showcase` preserve existing links. The `showcase` wrapper exists before its deferred content loads; the reused card gallery receives `showcase-cards` as its inner section ID.
- The global install toast stays off the signed-out homepage so it cannot cover the header. Existing installation options elsewhere remain available.

## Verification

Run the landing contracts, authentication routing and marketing navigation checks:

```powershell
node --import ./scripts/lib/create-offline-network.mjs --test --test-concurrency=1 src/app/landing/page.test.mjs src/middleware.auth-routing.test.mjs src/components/navigation/marketing-hero-nav.test.mjs
```

The isolated product browser test uses the real landing components and styles with local artwork, substitutes only the heavy lower live-card gallery and authentication forms, and checks light/dark responsive layouts and sample interactions. Its generated screenshots belong under `output/landing-product/`. Verify actual Next.js delivery as well, particularly account dialogs, prepared wordmark images, deferred example navigation and shared phone/desktop help controls.
