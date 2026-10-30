# Envitefy current print sizes on a shirt

The current 22 × 36 inch print sheet is unchanged. Its saved 300 DPI layout is the source of every artwork measurement.

| Artwork | Current print canvas |
| --- | --- |
| Front pocket logo | 3 × 2.325 inches |
| MAKE IT A THING. back | 10.5 × 13.25625 inches |
| GOOD PLANS. GREAT PEOPLE. back | 10.5 × 13.51875 inches |

The reference shirt measures 22 inches across the flat body and 30 inches from high shoulder to center hem. This is a stated geometry reference, not a verified size for a particular shirt brand. The back artworks begin 4 inches below high shoulder (3 inches below the reference back neckline). The front logo begins 7 inches below high shoulder, on the wearer's left chest. Placement is suggested.

`scripts/build-envitefy-shirt-scale-preview.mjs` builds an editable SVG at exactly 22 pixels per physical inch. It embeds the existing artwork without changing its aspect ratios. The shirt hem curve reaches exactly 30 inches at center. Physical scale and aspect ratios were independently checked.

Final previews:

- `output/merch/shirt-fit-2026-10-29/envitefy-current-print-sizes-to-scale.svg`: exact proportional diagram.
- `output/merch/shirt-fit-2026-10-29/envitefy-current-print-sizes-to-scale.webp`: diagram viewing copy, 2400 × 1120 pixels.
- `output/merch/shirt-fit-2026-10-29/envitefy-current-print-sizes-shirt-mockup.webp`: illustrative photographic mockup, 1836 × 857 pixels. The diagram is the authority for geometry; the image model renders the shirt texture and photograph.
- `output/merch/shirt-fit-2026-10-29/scale-dimensions.json`: measured placement metadata.

Both viewing copies were encoded using FFmpeg libwebp, quality 85 and compression level 6, checked for dimensions, and decoded successfully. Existing print PNGs and original artwork are preserved.

## Image generation provenance

Used the built-in image generation tool with the measured diagram as its sole image reference. No separately billed CLI/API workflow was used.

Exact prompt:

> Use case: product-mockup / precise-object-edit. The supplied image is the exact measured layout and edit target. Turn ONLY the three cream shirt silhouettes into realistic premium cream/ecru cotton T-shirts photographed completely flat from directly overhead. Preserve the entire board composition, three shirts, white background, all text labels, all dimension lines, and most critically the exact proportional size and placement of the existing Envitefy print artwork on each garment. This is a sizing approval view, not a new design. Do not enlarge the graphics to fill the shirts. Keep both back print blocks exactly 10.5 inches wide relative to each shirt's 22-inch flat body width (47.727 percent). Shirt body length is 30 inches from high shoulder to hem. Front pocket logo is 3 inches wide by 2.325 inches tall (13.636 percent of shirt body width), positioned on wearer's left chest, which is viewer right. Back middle design is 10.5 by 13.25625 inches, beginning 4 inches below high shoulder. Back right design is 10.5 by 13.51875 inches, beginning 4 inches below high shoulder. Keep the substantial blank lower half of all shirts. Do not stretch, recompose, rearrange, simplify, crop, recolor, retype or redesign the supplied artwork or Envitefy logos; the current image is the authority for every graphic. Keep the approved exact wording MAKE IT / A THING. with five social icons and YOU ARE INVITED on middle back, GOOD / PLANS. / GREAT / PEOPLE. with envitefy com. below on right back; original gradient E with plane and wordmark on front. Preserve original lettering shapes. Render delicate cloth texture, natural stitching, ribbed collar and very subtle shallow folds, without moving the garment outline or obscuring print edges. Entire shoulders, sleeves and hems visible. The final board must retain the supplied measurements and one shared physical scale. No people, hangers, perspective, extra logos, decoration or new text. Large detailed landscape image matching the supplied board aspect ratio, ideally 2400x1120 or higher.
