# Shared font library

`src/lib/font-library.ts` catalogs 150 self-hosted families: 24 existing birthday
fonts, the two Josefin brand families, and 124 additions. The latest 100 are
defined in `src/lib/font-library-additions.ts`, shared with the asset bundler. Existing saved title
stacks and theme IDs remain valid. The shared title picker uses the full catalog;
body options exclude decorative scripts and display faces.

Sign-up forms and custom Event Pages offer 12 additional curated title/body
pairings and an All 150 fonts collection through `FontPairingSelect`. Every
family has a readable companion body face. Search matches the style and both
font names. Only 18 previews render initially; Show more reveals another batch
without preloading the full catalog. The same pairing IDs are accepted by generation, explicit saves, reloads
and public renderers. Typography choices do not save or generate artwork.

The root stylesheet registers the birthday/brand faces and shared Raleway body
fallback with `font-display: swap`. The complete gallery catalog is served from a
content-versioned static stylesheet through `FontCatalogStyles`. Anonymous `/`
and `/landing` do not request that catalog; other routes and the authenticated
dashboard receive its link in server HTML, including without JavaScript. The
persistent component also loads it on client navigation and account changes.
Browsers request only font binaries used on the page. New WOFF2 assets include the upstream
language subsets and supported weight ranges. We do not preload the whole
library or fetch fonts from Google at runtime. The logo's existing Josefin files
and settings are unchanged. Generated Live Card lettering is separate and keeps
its theme-specific image generation behavior.

To refresh the added font assets explicitly, run:

```sh
node scripts/bundle-gallery-fonts.mjs
# Refetch completed families instead of using the local download cache:
node scripts/bundle-gallery-fonts.mjs --refresh
# Regenerate/check delivery files after changing the existing catalog locally:
node scripts/split-font-catalog.mjs
node scripts/split-font-catalog.mjs --check
```

This requires network access and is never part of a build. Each family includes
its upstream license, and `public/fonts/gallery/manifest.json` records source
URLs, local files and sizes. Review asset changes after refreshing. The existing
fonts retain their licenses alongside their original files.

Inter and Playfair Display also have losslessly compressed WOFF2 derivatives
beside their original TTFs. CSS tries WOFF2 first and retains the original TTF
fallback. `scripts/compress-bundled-fonts.py` requires `fonttools[woff]==4.59.0`;
run it with `--check` to verify the committed derivatives. It compares every
decompressed sfnt table with the originals, accounting only for the container
checksum and WOFF2's compression flag. It does not subset characters, remove
hinting, change font weights/styles or alter glyphs/metrics. The locked Josefin
Slab brand font keeps its existing asset and registration.

The anonymous homepage and its footer select separate `Envitefy Homepage Inter`
and `Envitefy Homepage Playfair` aliases from `public/fonts/marketing/homepage-v1/`.
These Latin-extended subsets total 71,532 bytes; full original families remain
next in each stack for other Unicode characters. Only the subset URLs are
preloaded on the homepage. `scripts/generate-homepage-font-subsets.py --check`
verifies retained outlines, advances, hints and line metrics; the Chromium test
`scripts/homepage-font-subsets.test.cjs` compares glyph pixels and metrics across
weights/styles and verifies full-font fallback requests. Keep the aliases scoped
to the homepage rather than changing saved invitation typography. The October 28
compaction removes unused glyph-ID slots while remapping layout references;
outlines, advances, hints, character coverage and authored features stay intact.
It saves 7,920 bytes versus the first v1 derivatives. A 224-case comparison against
those derivatives found identical pixels and metrics, including mixed Latin
extended text and existing Unicode fallback behavior. Splitting this family into
separate Unicode shards was rejected because it changed cross-shard kerning.

`node --test scripts/font-catalog-delivery.test.cjs` verifies catalog descriptor
parity, server delivery, hydration, page/account transitions, no-JavaScript saved
typography and TTF/WOFF2 pixel/metric equality in Chromium.

The included fonts use the SIL Open Font License or Apache License 2.0. These
permit commercial use without font royalties, including websites, invitations,
exported graphics and marketing. Keep the license and copyright notices with
distributed font files. OFL fonts cannot be sold by themselves; modified fonts
have additional conditions, including reserved-name rules. A license file alone
does not imply that an arbitrary font is free. We use verified open-source font
sources and retain their individual notices.

Licensing: [OFL FAQ](https://openfontlicense.org/ofl-faq/) and
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Sources: [Google Fonts repository and redistribution guidance](https://github.com/google/fonts),
[self-hosted web font registration](https://github.com/google/fonts/blob/main/cc-by-sa/knowledge/modules/using_type/lessons/using_web_fonts/content.md).
