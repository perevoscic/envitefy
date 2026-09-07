# Anniversary collection expansion — September 7, 2026

Added 20 anniversary templates to the existing 10, for 30 in the Anniversaries gallery at `/event/anniversaries`.

Each design includes its own hero composition, palette, locally bundled headline font, new artwork, and a matching arrangement for invitation details, photos, and guest actions. All templates use the anniversary editor and existing event publishing/rendering flow.

## Artwork

Generated with the built-in `image_gen` tool, one asset per design. Original PNGs were deleted at the user’s request after the FFmpeg WebP copies were verified. Production assets are 1536 × 1024 WebP files (quality 85), about 4.3 MB combined.

Exact final generation prompts: [prompts.json](../../public/templates/anniversaries/collection-2026/prompts.json).

| Design | Suggested milestone | Style | Production asset |
| --- | --- | --- | --- |
| Cotton Love Letters | 2 years | Romantic | [WebP](../../public/templates/anniversaries/collection-2026/cotton-letter-second-anniversary.webp) |
| Our Next Adventure | 3 years | Destination | [WebP](../../public/templates/anniversaries/collection-2026/leather-passport-third-anniversary.webp) |
| Sunday in Linen | 4 years | Garden | [WebP](../../public/templates/anniversaries/collection-2026/linen-sunday-fourth-anniversary.webp) |
| Iron & Roses | 6 years | Garden | [WebP](../../public/templates/anniversaries/collection-2026/iron-rose-sixth-anniversary.webp) |
| Copper Afterglow | 7 years | Candlelit | [WebP](../../public/templates/anniversaries/collection-2026/copper-glow-seventh-anniversary.webp) |
| The Bronze Hour | 8 years | Modern | [WebP](../../public/templates/anniversaries/collection-2026/bronze-hour-eighth-anniversary.webp) |
| Made for Each Other | 9 years | Artisan | [WebP](../../public/templates/anniversaries/collection-2026/pottery-studio-ninth-anniversary.webp) |
| City, After Dark | 11 years | City | [WebP](../../public/templates/anniversaries/collection-2026/steel-skyline-eleventh-anniversary.webp) |
| Silk Moon | 12 years | Celestial | [WebP](../../public/templates/anniversaries/collection-2026/silk-moon-twelfth-anniversary.webp) |
| Lace & Heirlooms | 13 years | Vintage | [WebP](../../public/templates/anniversaries/collection-2026/lace-heirloom-thirteenth-anniversary.webp) |
| Ivory Orchid | 14 years | Minimal | [WebP](../../public/templates/anniversaries/collection-2026/ivory-orchid-fourteenth-anniversary.webp) |
| Sapphire Soirée | 45 years | Formal | [WebP](../../public/templates/anniversaries/collection-2026/sapphire-evening-anniversary.webp) |
| Emerald Conservatory | 55 years | Botanical | [WebP](../../public/templates/anniversaries/collection-2026/emerald-conservatory-anniversary.webp) |
| Diamond Light | 60 years | Elegant | [WebP](../../public/templates/anniversaries/collection-2026/diamond-light-sixtieth-anniversary.webp) |
| Hydrangea House | Any anniversary | Watercolor | [WebP](../../public/templates/anniversaries/collection-2026/hydrangea-house-anniversary.webp) |
| Amalfi, With Love | Any anniversary | Coastal | [WebP](../../public/templates/anniversaries/collection-2026/amalfi-postcard-anniversary.webp) |
| Written in the Stars | Any anniversary | Celestial | [WebP](../../public/templates/anniversaries/collection-2026/stargazer-vows-anniversary.webp) |
| Our Favorite Record | Any anniversary | Retro | [WebP](../../public/templates/anniversaries/collection-2026/vinyl-love-song-anniversary.webp) |
| Desert, Together | Any anniversary | Desert | [WebP](../../public/templates/anniversaries/collection-2026/desert-sunrise-anniversary.webp) |
| Midnight Champagne | Any anniversary | Evening | [WebP](../../public/templates/anniversaries/collection-2026/champagne-midnight-anniversary.webp) |

## Implementation

- `src/data/anniversary-template-data.ts`: 20 new catalog entries.
- `src/components/birthdays/redesign/AnniversaryScenes.tsx` and its CSS module: 20 responsive compositions using the shared calendar, directions, RSVP, and share controls.
- Catalog wiring preserves all existing template IDs and all 94 birthday templates.
- Absolute anniversary artwork paths are handled during saving and theme changes. User-uploaded photos retain priority.
- The marketing catalog describes the expanded collection.

## Validation

- Seven anniversary tests pass, including rendering all 20 new guest pages, unique real artwork, editor definitions, edit links, anniversary wording, font availability, and uploaded photo preservation.
- Three shared rendering checks pass across all 124 birthday and anniversary designs.
- Biome passes for touched source files.
- TypeScript compiler comparison reports zero diagnostics in touched files. The VS Code diagnostics bridge was unavailable.
- Browser review verifies the 30-item gallery, new template selection, and desktop and phone editor layouts.

## FFmpeg delivery pass

All artwork in this collection was re-encoded from the original PNGs with FFmpeg/libwebp on September 7, 2026, at quality 85 and compression level 6. Original dimensions are preserved. See the [conversion report and per-file manifest](./generated-artwork-webp-2026-09-07.md).
