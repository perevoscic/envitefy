# Event Page presentation audit — October 22, 2026

The follow-up request concerns the complete event page opened from a design, including the editor, clean preview and published guest view. Different photographs or differently shaped gallery covers alone do not establish different page templates.

## Complete scope

| Collection | Active designs checked |
| --- | ---: |
| Bridal shower | 60 |
| Graduation | 60 |
| Housewarming | 60 |
| Open house | 60 |
| Religious celebration | 60 |
| Dance | 60 |
| Cheerleading | 60 |
| Basketball | 60 |
| Baseball | 60 |
| Softball | 60 |
| Soccer | 60 |
| Volleyball | 60 |
| Hockey | 60 |
| Lacrosse | 60 |
| Tennis | 60 |
| Track & Field | 60 |
| Swimming | 60 |
| Wrestling | 60 |
| Holidays & seasonal — all 44 occasions | 440 |
| Existing everyday General event designs | 12 |
| **Total active designs in the affected rendering families** | **1,532** |

The eighteen replacement collections contain **1,080** v2 designs added on October 22. The holiday photographs were authored earlier and exposed through today's dedicated creation category; all **440** belong in this audit because the supplied Cinco de Mayo example uses that path. The main requested scope is therefore **1,520** replacement/holiday designs, with the **12** existing everyday designs checked for the same loss of presentation. The sixty frozen Bridal v1 designs remain available only through compatibility lookup and are preserved separately.

## Findings at the start of this correction

1. The holiday gallery renders `GeneralEventDesign.composition`, palette and typography through `TemplateArtworkThumbnail`. The General editor instead looked up only `getThemedEventDesign`, which has no holiday entries. `ThemedEventHeader` consequently returned its children unchanged and `TemplateBodyLayout` received no presentation. Every holiday opened the same generic image-above-title page. The guest renderer had the same lookup gap. This directly explains the supplied Cinco de Mayo screenshots.
2. The 1,080 v2 designs did retain their distinct artwork. Their page presentation was still derived from only thirteen medium treatments. Measured across the entire catalog there were thirteen structural recipes and 129 full recipes including literal palette and font; one full recipe appeared on 105 designs. Seventeen collections had thirteen structural recipes each, and Religious celebration had eleven.
3. The existing editor browser test selected the first design in only Bridal shower, Dance and Graduation. It checked retained IDs, artwork, typography, palette and the presence of a body wrapper. It did not compare every page's visible structure, cover all holiday designs or establish page-level diversity. The earlier artwork delivery report must not be read as that verification.

## Presentation correction

`src/data/event-page-presentation-directions.ts` now binds every one of the 180 named v2 themes to an explicit six-scene page family. The authored source scene positions select six hand-written page directions; gallery sorting and filtering never select a direction. Each collection consequently has sixty distinct section-shape/heading pairs, including an otherwise empty editor with only Details. The collection spans all twelve existing body structures, twenty section shapes, six heading treatments and seven header layouts, with authored spacing, radii and section flows.

Exact `bodyLayout`, `bodySurface`, `bodyHeading` and `bodyFlow` fields survive the catalog-to-renderer resolver rather than collapsing back to the old medium defaults. Shared page primitives remain reusable across categories; these are sixty deliberately composed structural directions paired with each category's individual artwork and original palette, not a claim that 1,080 separate rendering engines were written. Original artwork compositions, all 1,080 artwork paths, authored colors/fonts, stable IDs and all sixty frozen v1 records remain unchanged.

General and holiday presentation now resolve their own design records through `src/lib/general-event-presentation.ts` and pass the same authored header and body through editor and guest rendering. Each holiday collection has ten distinct full-page compositions; the twelve everyday designs also have distinct header/body combinations. The selected design title replaces the generic empty holiday heading, with the occasion still visible. Host-entered titles retain priority. Preview, save/reload and publication retain the design ID and original image; choosing an occasion never supplies an event date.

The header renderer now provides separate artwork and copy slots for seven responsive page arrangements, independent of the nine original artwork silhouettes. It preserves parent palette overrides, title sizing and clickable image controls. Exact section shapes retain their asymmetric radii instead of being flattened by the old uniform-radius override. The same panels and headings remain mounted during section editing, while explicit alternate layouts still apply the host's composition.

## Evidence recorded by this audit

- Read-only catalog measurement established the before counts above.
- Fourteen focused Node tests passed after v2 presentation integration: the themed catalog, artwork-manifest builder and new `src/lib/event-page-presentation-directions.test.cjs` suites.
- The new regression checks enumerate all eighteen collections, require sixty different visible shape/heading pairs in each, require every body/header layout, compare all 1,080 images/crops/colors/fonts to authored records, and compare every frozen Bridal record exactly.
- Scoped Biome passed for the five v2 presentation source/test files.

## Integration evidence

- Twenty-six targeted Node tests passed, including static rendering of all 1,532 active designs and the preserved legacy catalog. Uniqueness assertions exclude photographs, wording, palette and typeface, so changing only a photo cannot satisfy them.
- Chromium compared all sixty v2 body treatments with only Details at 390px and 1280px, using computed silhouettes, borders, shadows, padding and heading treatment. All sixty differed, and the actual section-editing canvas retained the guest treatment.
- Header browser checks passed all 63 artwork/layout combinations at phone, tablet and desktop widths, plus a narrow desktop editor, image-control hit testing and host palette overrides.
- The real editor fixture passed Bridal shower, Dance, Graduation and holiday draft-save/reload/guest journeys. All ten Cinco de Mayo designs passed phone/desktop geometry, original artwork, selected title, occasion and blank-date checks. Actual artwork contact sheets were visually inspected in `.qa/themed-event-editor-browser/cinco-de-mayo-compositions-1280.png` and `-390.png`.
- Existing responsive section-layout checks passed 1,955 template renderings across twelve layouts. Source TypeScript checks, scoped Biome and `git diff --check` passed.
- The signed-in application running through Next on localhost was inspected directly with Paper Banners and Family Kitchen. The actual delivered stylesheet rendered their different arch and editorial compositions, correct titles, original images and image controls.
- The final complete `npm run test:unified-create` run passed: 136 Node tests, 91 Bun creation tests, four OCR tests and 49 browser tests. Its local log is `.qa/template-uniqueness-unified-create.log`.
- Six complete Bridal v2 pages, including their single-section body treatments and real artwork, were compared visually in `.qa/themed-event-editor-browser/bridal-v2-full-page-directions.png`.

No production deployment or real event publication was performed. Save/publish tests used intercepted local fixture requests.
