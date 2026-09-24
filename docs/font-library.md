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

The root stylesheet registers the families with `font-display: swap`; browsers
request only faces used on the page. New WOFF2 assets include the upstream
language subsets and supported weight ranges. We do not preload the whole
library or fetch fonts from Google at runtime. The logo's existing Josefin files
and settings are unchanged. Generated Live Card lettering is separate and keeps
its theme-specific image generation behavior.

To refresh the added font assets explicitly, run:

```sh
node scripts/bundle-gallery-fonts.mjs
# Refetch completed families instead of using the local download cache:
node scripts/bundle-gallery-fonts.mjs --refresh
```

This requires network access and is never part of a build. Each family includes
its upstream license, and `public/fonts/gallery/manifest.json` records source
URLs, local files and sizes. Review asset changes after refreshing. The existing
fonts retain their licenses alongside their original files.

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
