# Event website discovery

Gymnastics URL imports collect related event pages through `src/lib/discovery/event-website.ts`, wired into the existing extract → parse → map → enrich → compose pipeline. Navigation hrefs, including collapsed menus, are read separately from page prose. Sources use the existing public-URL reader, including its address and redirect checks. The final fetched URL supplies the base for relative links.

The collector follows up to ten requests (hard ceiling twelve), two at a time, through two link levels within a twenty-second sub-budget. It prioritizes event overview and uncovered sections. It recognizes www aliases, preserves meaningful query parameters and restricts shared-host URLs to their event directory. A redirect outside that directory is recorded as a failed source. Hotel booking and attraction destinations remain external links, rather than becoming additional crawl targets.

Each relevant section has an independent result:

- `collected`: source information was retrieved and mapped.
- `unavailable`: the official schedule explicitly says it is not published.
- `failed`: a discovered page could not be retrieved or redirected outside the event.
- `pending`: collection limits were reached or a retrieved section still needs review.
- `not_found`: no relevant source was discovered. This does not establish that information is unavailable.

The event year comes from overview/event-date evidence. The clubs mapper selects that edition instead of merging archived lists. Clubs stay separate from athlete rosters and guest attendance. Attraction cards preserve organizer-listed names, descriptions and destinations. Schedule availability supports published, unpublished, partial and unconfirmed states without creating session times or calendar entries.

Discovery has no organizer-domain rules or event-name checks. Section labels and linked paths identify content. Tests cover unrelated synthetic UK, Canadian and root-host sites: arbitrary `.html`/`.aspx` page names, a directory landing without a trailing slash, club tables and lists, international locations, semantic attraction cards and 12/24-hour schedules. Shared-host discovery stays inside the selected event directory. This integration currently runs for gymnastics website imports; it does not imply that every category's import flow has been converted.

Visible event dates take priority over conflicting SEO/JSON-LD descriptions. Collected hotel HTML preserves CTAs in their source order and feeds the existing hotel evidence mapper directly, keeping hotels that share a booking URL separate. Hotel images cannot become booking buttons. Booking destinations retain their parameters and fragments; mapped hotels carry their source URL and evidence into enrichment and explicit saves.

Admission cards retain separate daily and weekend pass labels instead of merging both prices under one audience.

Mapped content and source coverage are persisted with the builder snapshot and the event's discovery source. Dedicated sections render through the shared Gymnastics page and section canvas, retaining ordering, hiding, Undo, explicit saves and clean guest views. Owners can inspect the source coverage in Event settings. Existing file extraction, PDF/image processing, browser fallback, venue preparation and timezone resolution remain in the pipeline.

Website imports use populated Overview, Schedule, Teams, Venue & Parking, Hotels and Explore tabs across the sixty Gymnastics designs. Venue & Parking contains venue/address, maps and arrival guidance; Hotels contains accommodation, rates, room blocks and reservation links; Explore contains organizer-listed attractions and things to do. Only populated, visible tabs appear. Both targeted and full-document extraction prompts explicitly keep these groups separate and preserve source reservation links without inventing missing places or travel facts. Editors use the same tabs without an All sections tab. Switching tabs changes presentation only; all section contents remain mounted, and the canvas still registers the complete section list for editing, ordering and Undo. Hidden sections remain hidden, host-authored pairs stay together in the first section's group, and custom information stays in Overview. Tabs support arrow keys, Home/End, roving focus and a focusable named panel. The existing responsive navigation scrolls horizontally on phones as needed. The earlier signed-in guest preview check at desktop size and 390 × 844 covered the previous four-tab grouping; it does not verify the new six-tab grouping.

Verified Create URL text is expanded through discovery for gymnastics; completed file reads still use the existing reuse path. Website material remains extraction evidence and cannot authorize actions or override host-authored instructions.

## Checks

```text
node --test src/lib/discovery/event-website.test.mjs src/lib/discovery/website-composition.test.cjs
node --test src/lib/event-information-tabs.test.cjs src/lib/event-section-layout.test.cjs
node --test --test-name-pattern="website import" src/components/gym-meet-templates/collection.test.cjs
bun test --timeout 20000 src/lib/travel-accommodation-enrichment.test.ts src/lib/meet-discovery/dates.test.ts
node scripts/verify-event-website.mjs
npm run typecheck
```

The live verifier makes no AI calls or event writes. It tests the home, overview, hotels, visit, schedule and competing-teams entry URLs and stores its report under ignored `output/event-website-discovery/verification-v2.json`. On October 20, 2026, every entry resolved the same six canonical source pages, 45 clubs from 2027, four attractions and the unpublished 2027 schedule.

On October 20, 2026, a real signed-in import through `http://localhost:3000/create` using only the overview URL opened the editor, saved a private draft and survived reload. The draft contains January 29–31, 2027, 45 clubs, three host hotels with the organizer's reservation URL, four attractions and the unpublished schedule notice. Coverage reports six collected sections and one not published. The authenticated status endpoint confirmed `review_ready`, last successful stage `compose_public`, both draft and builder ready, and no error or review flags. Team search and keyboard tab navigation were exercised in the actual browser. The saved test event is `c204231b-bfe2-4dda-8672-07245315dbfa`; it was not published. Screenshots and the status response are under ignored `output/event-website-discovery/`.

Collector, composition, tab grouping, saved layouts and all sixty design-render checks pass, as does application typecheck. Hotel/date regression tests passed 28 cases; the separate browser DOM/PDF fixture timed out at 20 seconds, including outside the sandbox, so that fixture remains unverified. The broader content-builder suite has 21 failures; running the same test with the content builder loaded from HEAD reproduced the identical 21 failures (`output/event-website-discovery/content-regression-*.tap`). The complete template suite also has an existing design-ID collision assertion between the football and gymnastics registries, confirmed against its original HEAD test. The VS Code diagnostics check could not run because the Chat to CLI bridge is unavailable; Biome checks cover the changed code.
## Source photography and visitor layout (October 20, 2026; historical photo behavior)

Hotel and attraction cards retain photographs from their own named source card or row. `websiteImagesForNames` supports semantic cards, lazy image attributes, relative/CDN URLs and CMS columns separated by rules. It matches names within the same source fragment instead of pairing images by array position; a photo shared by several places remains unassigned. Overlapping hotel names use their full name spans. Logo, spacer and tracking images are excluded. Executable, credentialed and local-network image URLs are rejected.

Hotel image URLs and their source evidence flow through the existing accommodation enrichment and public section mapping. Attractions retain optional `imageUrl` beside their organizer source URL. The shared `EventPlaceCard` renders original photographs, readable titles, rates and details, and complete existing booking destinations. Photos load lazily in a fixed aspect ratio; missing or failed images leave a clean text card. The matching and rendering contain no Atlanta-specific rules or image URLs.

The hotel and attraction sections use quiet surfaces and responsive photo grids. Arrival maps are capped at 600px wide with a 260px desktop image; wide venue sections place guidance beside the map. Smaller screens stack the content without cropping provider attribution or removing Directions.

The signed-in current event `17a96fd8-d5c8-4cc1-9daf-089ea6f9237e` was augmented with its organizer's three hotel and four attraction photos using a conditional update against its exact prior data. Its publication state, hero and dates were retained. Chrome confirmed all seven images decoded, the desktop map measured 598 × 259px, and the 375px phone preview had a 375px document scroll width. Evidence is under `output/event-website-discovery/`: `place-photos.json`, `place-photos-applied.json`, `hotels-redesign-desktop.png`, `attractions-redesign-desktop.png`, `arrival-map-redesign-desktop.png` and `hotels-redesign-mobile.png`.

Validation: 22 collector checks, the travel rendering regression and 21 accommodation checks passed; typecheck and focused Biome lint passed. The accommodation suite's browser DOM extraction check could not launch because its headless Chromium executable is absent in the test environment. Actual Chrome desktop and phone verification succeeded through the connected browser.

## Text-only hotel and attraction cards (October 20, 2026)

Hotel and attraction cards now retain names, details, rates and complete booking or information links without displaying source photographs. This supersedes the photo-rendering behavior above. `EventPlaceCard` has no image input or image element, so existing saved photo URLs and newly imported photo URLs are not requested or displayed in the editor, preview or published page. Saved source metadata is retained; no event data migration or publication is performed.

