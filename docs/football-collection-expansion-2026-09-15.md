# Football collection: 30 additional designs

The football gallery and editor registry now include 90 designs. The previous 60 IDs and artwork are preserved. Each addition has a distinct OpenAI-generated image, palette, title font choice, and coordinated hero, navigation and section surfaces. The shared football renderer carries these choices into editor previews and public events.

## New designs

Stadium Mosaic, Copper Kickoff, Clay Play, Paper Stadium, Stitched Season, Risograph Rush, Cyanotype Club, Stained Glass Sunday, Terrazzo Touchdown, Origami Offense, Velvet Victory, Blue Hour Stands, Aerial Playbook, Locker Room, Tunnel Vision, Foggy Morning, Harvest Kickoff, Riverside Lights, Steel Town, Desert Moon, Tropical Touchdown, Flag Football, Backyard Bowl, Senior Night, Saturday Scrapbook, Midcentury Matchup, Quilted Gridiron, Electric Lime, Monochrome Motion, and Rooftop League.

The opening gallery mixes new and existing designs. All additions also appear in the existing search, style filters, and editor design picker. Thumbnails keep the shared white inset shells and place the live design name directly on artwork. Paper Stadium and Stained Glass Sunday were refined after phone-size review to provide a calmer area behind their names.

## Artwork

- Built-in OpenAI image generation produced 30 originals and two refinements.
- All 30 final assets are 1536 × 1024 WebP files in `public/images/football/templates/`.
- FFmpeg used `libwebp`, quality 85, compression level 6. Dimensions and alpha state were preserved, and every output was decoded.
- All 32 generated PNG originals and the two superseded WebPs were removed after verification. Existing artwork was untouched.
- The [artwork manifest](football-expansion-artwork-2026-09-15.json) records the complete prompt set, refinements, source paths, final asset paths, dimensions, hashes, and cleanup.

## Verification

- Nine template/rendering tests pass, including all 90 unique artwork hashes, distinct palettes, valid ID resolution, shared hero rendering, saved wording, custom image retention, and text/accent contrast of at least 4.5:1.
- The football skin source test passes.
- Browser checks at 1280px and 390px confirm all 90 cards are reachable through automatic loading, with no clipped titles or horizontal overflow. Searching Rooftop League returns its correct customization link and account prompt.
- Full authenticated editor interaction was not tested: the browser session is signed out. The editor/public shared renderer was exercised by the rendering tests.
- Biome lint passes (two pre-existing informational suggestions in the wording test). TypeScript reports no diagnostics in the changed template/catalog files; repository-wide checking still reports existing errors elsewhere. The VS Code diagnostics bridge is unavailable.
- The older `FootballSeasonTemplate.test.mjs` source guard still fails on `sectionHeadingFontStyle`, which is already absent from the HEAD version of the editor. This expansion does not change that editor file.
