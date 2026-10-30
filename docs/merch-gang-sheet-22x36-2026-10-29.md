# Envitefy — 22 × 36 inch PNG gang sheet

Prepared October 29, 2026 for the user's request to organize the approved shirt artwork on a 3-foot, 22-inch-wide PNG sheet. The user explicitly requested PNG, so the upload PNG and PNG proofs are retained rather than converted/deleted under the repository's default WebP delivery rule.

## Deliverables

- Upload: `output/merch/envitefy-22x36-4-shirts-300dpi.png`.
- Separate checkerboard proof: `output/merch/envitefy-22x36-preview.png`. The checkerboard exists only in this proof; it is absent from the upload file.
- Final build sources and detailed report: `output/merch/gang-sheet-22x36-2026-10-29-v3/`.
- Reusable builder: `scripts/build-envitefy-merch-gang-sheet.mjs`.
- Native contour reconstruction helper: `scripts/lib/merch-contours.mjs`.

## Print layout

The upload is **6600 × 10800 pixels, RGBA PNG at 300 DPI**, representing **22 × 36 inches**. Its PNG pHYs chunk is 11811 × 11811 pixels/metre, unit 1.

There are exactly eight printed pieces for four shirts:

- 2 × MAKE IT A THING back, with official wordmark, five social icons and YOU ARE INVITED.
- 2 × GOOD PLANS. GREAT PEOPLE. back, with official wordmark and matching serif-gradient com. left of the y tail.
- 4 × matching pocket-size E/plane + Envitefy front.

Back cells are 10.5 inches wide, approximately 13.26 and 13.52 inches high. Pocket prints are 3 × 2.325 inches. The two columns have a 0.5-inch gap and 0.25-inch outer margins. The row/pocket gaps are at least 0.5 inch. The artwork ends around 30.83 inches down the 36-inch sheet, leaving transparent spare material. There are no printed labels, cut boxes or guide lines.

## Artwork preparation

The shirt photos are not embedded in the upload file. Only their approved saturated headline silhouettes were selected, flattened to the approved berry/coral inks, cleaned with a normalized coverage-mask Gaussian, and reconstructed as closed SVG curves with preserved counters. The source geometry is traced from the approved raster mockups; this creates clean scalable edges, not missing original font-master detail.

The wordmarks are rendered at high resolution from the **actual canonical EnvitefyWordmark component** through the existing `wordmarkMarkup` and `wordmarkDocument` exports, with the actual bundled Josefin Slab font and original joined pairs/gradient. The high-resolution render is 4775 × 1602 pixels. Public brand assets/components are unchanged.

The E/plane keeps the canonical `public/brand/e-only.png` silhouette, traced for crisp boundaries, and its original smooth color field. The existing social SVG artwork is used directly; Reddit's embedded mark is traced to preserve clean contours. The small com. is rendered from the actual Josefin Slab weight-700 font and canonical gradient. The YOU ARE INVITED footer uses local Arial Bold, matching the approved clean sans-serif treatment.

One built-in imagegen isolation attempt was rejected because it retained an unsuitable translucent background and dimensional shading. It was not used in the final artwork. Its verified WebP archive is `output/merch/iterations-2026-10-29/headline-isolation-rejected-2026-10-29.webp`. Its raw generated PNG was removed, then a display-only derivative was recreated at the old gallery path, continuing the preview-cache exception established earlier in this chat.

The initial contour proof showed source-grid nicks. A second candidate over-smoothed/expanded the masks and exposed unconstrained long-segment curve bows; neither was delivered as final. V3 uses normalized linear mask smoothing (no grayscale/gamma growth) and dense <=1-pixel fit constraints. Headline source ink counts changed only 78865→78884 and 112250→112271; contour counts stayed 9 and 24. The final helper's M/slanted-rectangle/rectangle checks bounded full-boundary deviation below the requested fitting tolerance and preserved closed paths/counters.

## Verification

The builder confirmed PNG type, 6600 × 10800 dimensions, four channels, real alpha, density 300, the exact pHYs fields, eight placements, on-sheet bounds, nonoverlap, nonempty artwork and transparent sample lanes. The final named copy's SHA-256 matches the validated V3 PNG:

`eb9877947e62271c72b41d334f525066de8090d86fce842f549f4590ce11f19c`.

Independent QA reviewed the complete sheet and actual-resolution M/G/P crops: all wording/icons/copy counts are correct, edges are smooth without collapsed openings, and no fabric or garment imagery remains. Direct alpha scans of the central cutting lane (1620000 pixels), back-row gap (1471800), pocket-row gap (1445400), left/right margins (810000 each), and bottom spare area (10230000) all returned max alpha 0 and no nonzero pixels. The final upload is 2266774 bytes.

No physical transfer/press proof or vendor upload was performed. This task creates the local upload file only.

## Rejected imagegen prompt (provenance)

Use case: background-extraction / precise-object-edit.
Reference image is the approved Envitefy cream shirt mockup, front left and back right. Extract and clean up ONLY the LARGE TWO-LINE BACK HEADLINE into standalone transparent apparel print artwork.
Exact lettering: first line "MAKE IT"; second line "A THING." including period.
Preserve the approved headline's distinctive shapes, arrangement and proportions: very heavy tall condensed closely set poster capitals, slightly lively angled letter contours; deep berry first line, vivid coral-pink second line with the restrained deep berry offset ink shadow already present in the reference. Keep the same glyph style, spacing, two-line hierarchy and exact words. Clean professional flat spot-color ink shapes with crisp smooth edges and open counters.
REMOVE everything else completely: no shirt, no fabric grain, no folds, no photography, no cream background, no studio background, no lighting, no drop shadow from the garment, no envitefy wordmark, no E symbol, no social icons, no divider, no YOU ARE INVITED footer. Only the two headline rows remain, floating on real transparent alpha. Letter counters and all outside space must be truly transparent, not cream/white/black.
Output the isolated headline LARGE and sharply resolved, filling a roughly 3:2 landscape canvas with minimal 3% transparent safety margin, ideally at least 2048px wide. Treat this as clean graphic art for transfer printing, not a product mockup and not a newly designed font. No gradients, no texture/noise, no distress, no extra lines or text. Flat deep berry and coral with the existing solid berry shadow accent only. Keep all letters completely in frame.

