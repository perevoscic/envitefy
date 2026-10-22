# Event Page template rebuild

The October 22, 2026 audit covers every category offered by Create an event → Start from scratch. The requested work adds Holidays & seasonal with existing artwork and replaces the eighteen incomplete category collections with sixty individually illustrated or photographed designs each. The replacement target is 1,080 designs; a manifest entry is an authored brief, not a delivered image.

## Audit

| Existing collection | Audit result | Action |
| --- | --- | --- |
| Birthday | 120 dedicated designs | Retain |
| Wedding | 60 dedicated designs | Retain |
| Anniversary | 30 dedicated designs | Retain |
| Baby shower | 60 dedicated designs | Retain |
| Gender reveal | 60 dedicated designs | Retain |
| Gymnastics | 60 dedicated designs | Retain |
| Football | 90 dedicated designs | Retain dedicated collection; retire basic wrappers from selection |
| General event | 452 designs: twelve everyday gatherings and 440 holiday designs | Retain |
| Holidays & seasonal | Existing holiday artwork lacked its own creation category | Add category; expose existing 440 designs in 44 ten-design occasion collections |
| Bridal shower | Three basic templates | Replace with sixty |
| Graduation | Incorrectly showed the General event collection | Replace with sixty |
| Housewarming | Incorrectly showed the General event collection | Replace with sixty |
| Open house | Incorrectly showed the General event collection | Replace with sixty |
| Religious celebration | Incorrectly showed the General event collection | Replace with sixty, explicitly labeled by tradition and occasion |
| Dance, Cheerleading, Basketball, Baseball, Softball, Soccer, Volleyball, Hockey, Lacrosse, Tennis, Track & Field, Swimming, Wrestling | Three basic wrappers per category, with one repeated image | Replace each category with sixty |

The holiday category uses the existing General editor and account grant. Choosing an occasion filters designs without changing entered event facts or inferring a calendar date.

## Delivery sequence

1. Add Holidays & seasonal and its occasion filter using existing designs.
2. Separate category-scoped catalogs from shared editor and permission families. Preserve full design IDs, artwork, palette, typography and body composition through selection, save, reload and guest rendering.
3. Author ten themed directions with six distinct visual narratives for each replacement category. The user rejected the initial repeated warm tabletop photographs; v2 changes subject/action, viewpoint, scale, setting, lighting, focal placement and medium. Review the six redesigned Graduation trade examples before expanding production.
4. Generate one original asset per design with the built-in OpenAI image tool. The user selected built-in generation; the separately billed CLI/API path is not authorized.
5. Inspect exact installed file hashes for technical correctness and visual diversity. Compare each six-design theme and all sixty designs together. See [the artwork diversity standard](event-page-artwork-diversity.md).
6. Activate a replacement collection after all sixty assets pass both reviews. Replace old choices in galleries while preserving saved legacy designs and addresses.
7. Verify category counts/filtering, matching editor artwork and colors, explicit draft saves, reload, guest views, responsive layouts and actual Next stylesheet delivery.

## Versioning and evidence

New v2 artwork lives at `public/templates/event-pages/v2/<collection>/<scene>.webp`; IDs include `--v2-`. The active worklist is `docs/event-page-themed-artwork.json`. `scripts/event-page-themed-artwork.mjs status` reports installed and reviewed assets separately from authored briefs.

The frozen v1 worklist is `docs/event-page-themed-artwork-v1.json`. The sixty previously delivered Bridal designs retain their original metadata in `src/data/event-page-themed-legacy.json`, so saved designs resolve exactly after the v2 catalog changes. Their original files and source provenance remain preserved. Existing basic IDs also remain available to saved-event compatibility lookup.

Generated PNG originals remain under the built-in tool's generated-images directory; project artwork is encoded as WebP in the workspace. Result records retain the actual generation prompt, original path, dimensions and SHA-256. Visual review evidence is recorded against the installed output hash. Technical approval alone does not approve diversity.

The rebuild is complete locally as of October 22, 2026. All eighteen replacement collections are active with sixty installed and individually reviewed v2 designs each (1,080 total). Each six-design theme and each complete sixty-design collection received a visual comparison; targeted replacements corrected repeated framing and visible equipment or branding defects. The final catalog audit verified 1,080 distinct artwork hashes, matching selection artwork and editor links, separate technical and diversity approvals, preserved PNG originals, all sixty frozen legacy designs and the existing 440 holiday choices. New-selection galleries contain no old basic choices in the eighteen replacement categories.

Verification after the v2 integration passed: the complete unified-creation suite (78 Node, 91 Bun, four OCR and 29 browser tests), source TypeScript checks, authored body/browser fixtures, draft save/reload and published guest rendering. Actual Next delivery passed for the current category picker, Christmas filtering, the sixty-design Graduation gallery and its selected artwork, typography and body layout on desktop and a 390px phone. The phone's Preview view had no horizontal overflow; the browser reported no errors. Artwork/catalog changes are available in the local workspace; deployment is separate.

The final independent audit also found and removed an incomplete-delivery fallback: Graduation, Housewarming, Open house and Religious celebration now keep their own scope when no complete collection is available, instead of showing unrelated General designs. Twelve focused tests passed, including each scoped category with zero, fifty-nine and sixty available designs; unscoped General retains 452 designs and Holidays retains 440. The final source TypeScript check and all-eighteen catalog audit passed again after this correction.
