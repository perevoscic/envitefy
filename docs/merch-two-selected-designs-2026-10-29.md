# Envitefy — two selected shirt designs

October 29, 2026. This brief supersedes the earlier large-front and black/cream colorway explorations for the selected deliverables.

## Selected layouts

Both cream/ecru shirts use the same pocket-size print at wearer-left chest (viewer-right): the official E-and-integrated-paper-plane symbol stacked above the official lowercase envitefy wordmark, in their existing blue-purple gradients. The rest of the front is blank. There is no sewn pocket.

1. **Make it a thing.** Back: official wordmark above the chosen berry/coral MAKE IT / A THING. statement, then the five existing social icons (Instagram, Facebook, YouTube, TikTok, Reddit) and YOU ARE INVITED. No URL or com. suffix on this design.
2. **Good plans. Great people.** Back: the user's attached four-line GOOD / PLANS. / GREAT / PEOPLE. typography, with berry letters and coral GREAT, followed by the Envitefy wordmark with small literal com. tucked left of the descending y tail. The com. matches the wordmark's bold slab-serif style and blue-purple gradient. No social icons, divider or invitation footer on Design 2.

The second slogan follows the exact lettering in the user's selected image reference (GOOD PLANS. GREAT PEOPLE.).

## Final files

- Design 1 — Make it a thing: `output/merch/envitefy-shirt-01-make-it-a-thing-final-2026-10-29.webp`.
  Display cache: `C:/Users/rjosan/.codex/generated_images/01a18903-cb1a-7783-aee5-8dac51694f51/exec-2eb5e7a5-a050-4799-bb28-21c34498d4e5.png`.
- Design 2 — Good plans. Great people.: `output/merch/envitefy-shirt-02-good-plans-great-people-final-2026-10-29.webp`.
  Display cache: `C:/Users/rjosan/.codex/generated_images/01a18903-cb1a-7783-aee5-8dac51694f51/exec-a3bc3ce8-aeb4-4b72-9eab-166fe292bae3.png`.

Built with the built-in OpenAI image generation tool, using the existing imagegen, brand and design workflow. These are visual garment mockups; production layouts should place the original logo assets.

## Exact brand inputs

- `public/brand/e-only.png`.
- `public/brand/wordmark-v2/envitefy-wordmark.webp`.
- Existing five social SVG assets under `public/email/white-v1/`, combined as the already verified `output/merch/envitefy-social-reference-2026-10-29.webp` reference board.
- Native small com. reference generated from `public/fonts/Josefin_Slab/JosefinSlab-VariableFont_wght.ttf`, Josefin Slab weight 700, with canonical gradient colors #6b3cff / #6757ff / #5a7dff / #37a8ff: `output/merch/envitefy-com-type-reference-2026-10-29.webp`.
- Exact combined wordmark + native com. source: `output/merch/envitefy-com-lockup-2026-10-29.svg` and `.webp`. The core official wordmark and its y-tail shape remain unchanged; com. is a separate small companion annotation. The canonical app/component assets were not edited.

The type source was rendered with the actual bundled font. This avoided the image editor's earlier rounded sans-serif approximations. Discarded iterations were retained as WebPs under `output/merch/iterations-2026-10-29/`.

## Verification and preview handling

Both final images and five superseded intermediate images were converted directly from generated originals with FFmpeg libwebp, quality 85 and compression level 6. All seven outputs passed actual WebP codec, unchanged 1536 × 1024 dimensions and full decode verification.

Independent visual QA confirmed matching small chest fronts, correct full slogans and punctuation, the five icons and invitation footer on Design 1, and matching serif-gradient com. left of the y tail on Design 2. No concrete visual defect requiring another generation was found.

All seven raw generated PNG originals were removed after conversion. Display-only PNG derivatives were reconstructed from the verified WebPs at the original generated cache paths and retained to avoid recreating the user's repeatedly reported broken-gallery issue. The WebPs are authoritative deliverables. The generated originals and display derivatives have separate SHA-256 hashes recorded in `output/merch/envitefy-final-shirt-preview-caches-2026-10-29.json`. This continues the display-cache exception recorded in `docs/merch-social-marketing-review-2026-10-29.md`; deleting those cache paths again could break previous gallery items. Existing approved preview caches are left intact.

## Design 1 final prompt

Use case: precise-object-edit / product-mockup.
Create the user's FINAL SHIRT DESIGN 1 from these exact references.
Image 1 is the current cream Envitefy front-and-back garment mockup, the EDIT TARGET for garment composition, fabric, lighting and back social row. Image 2 is the user's chosen MAKE IT A THING lettering crop; preserve this headline's exact style and colors on the BACK. Image 3 is the locked official gradient lowercase envitefy wordmark. Image 4 is the locked official gradient E-and-integrated-paper-plane symbol. Image 5 is the exact five-social-icon strip reference, whose dark background is not printed.

Both shirts remain matching warm cream/ecru oversized heavyweight cotton, fully visible, FRONT on left and BACK on right, soft realistic folds and shadows, pale concrete studio backdrop, landscape 1536x1024.
FRONT, LEFT SHIRT: REMOVE all the huge front slogan artwork. Replace it with ONLY a small POCKET-SIZE print at the WEARER'S LEFT CHEST (viewer RIGHT side of the front shirt). The print is the original official E-and-airplane symbol stacked directly ABOVE the original official lowercase envitefy wordmark. Combined chest print about 3 inches wide, small and tasteful, not large or centered. No actual sewn pocket is needed. Preserve exact supplied logo shapes and original blue-purple gradients. Leave the rest of front blank cream cotton.
BACK, RIGHT SHIRT: REMOVE the previous giant E symbol and giant wordmark composition. At upper back place the original official envitefy wordmark at modest about 4 inches width, centered. Beneath it place the BIG headline exactly like user's crop: "MAKE IT" in deep berry bold condensed poster letters on row 1, "A THING." in hot coral-pink on row 2, same heavy close-set shape and restrained berry print-shadow as supplied crop. The headline is the main back statement, readable and fills the upper/middle back comfortably inside seams.
Below the headline put one thin coral horizontal rule, then a balanced row of exactly FIVE existing social icons in order Instagram, Facebook, YouTube, TikTok, Reddit, all deep berry, equally sized and spaced, using the supplied shapes. Under the icons place exact centered berry uppercase "YOU ARE INVITED" in clean readable sans-serif. Keep the icon/footer block comfortably above hem with breathing room.
No URL anywhere on this design. No com. suffix on Design 1. No plain envitefy username beneath socials. No extra slogans, new logos, decorations, QR codes, envelopes or generic planes. Print the actual supplied brand assets without changing fonts, spacing or gradients. The front must be a SMALL left-chest E symbol + wordmark only; the big MAKE IT A THING statement belongs ONLY on the BACK.

## Design 2 final prompt

Use case: precise-object-edit / product-mockup.
Create the user's FINAL SHIRT DESIGN 2 by editing image 1.
Image 1 is the EDIT TARGET: complete cream shirt mockup with the FINAL approved small left-chest E-and-plane + envitefy front and MAKE IT A THING back.
Image 2 is the USER'S SELECTED BACK LETTERING reference: exact words "GOOD PLANS. GREAT PEOPLE." with playful chunky berry lettering and coral GREAT. This is the visual authority for the headline.
Image 3 is the EXACT supplied Envitefy + small com. logo lockup for the lower back: it already contains the official gradient wordmark and a separate small matching JOSEFIN SLAB bold serif "com." placed LEFT of the descending y tail. Copy this whole provided lockup as artwork; do not retype, simplify, redraw or detach the com. Its serif m feet and original purple-to-blue gradient must remain the same as the supplied reference.

PRESERVE the complete LEFT FRONT shirt EXACTLY as image 1: same small wearer-left-chest/viewer-right E-and-plane symbol stacked over envitefy, same size, coordinates and approved gradient. Keep blank cream fabric everywhere else on front. No front slogans.
REPLACE ONLY the BACK shirt's entire printed design:
Upper and middle back: BIG four-line statement exactly "GOOD" / "PLANS." / "GREAT" / "PEOPLE." in the user's supplied typography from image 2, with the same confident bouncy heavy rounded serif-ish poster letter shapes. GOOD, PLANS., PEOPLE. in deep berry; GREAT in vibrant coral pink with restrained deep berry print shadow. The four-line stack is the hero, bold and fully readable, no words cropped.
Centered beneath the statement: the COMPLETE exact Envitefy-com. lockup from image 3, approximately 7.5 inches wide, original blue-purple gradient. This is the only additional back graphic. The small com. is to the LEFT of the y's descending tail, in SAME serif font and SAME gradient as Envitefy. Literal com. ends in a period, not .com. No separate full envitefy.com line.
REMOVE all five social icons, horizontal divider and YOU ARE INVITED from the BACK of Design 2. Those belong to Design 1 only.
No large standalone E symbol on the back, no extra wordmark above the slogan, no extra copy, no decorations. Keep the lower logo comfortably above the hem. Preserve matching warm cream oversized garments, all realistic fabric folds, exact front layout, studio lighting/background/shadows, landscape 1536x1024 front-left/back-right full-shirt composition.

