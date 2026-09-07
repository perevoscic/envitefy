# Wedding website collection — September 7, 2026

The wedding gallery now contains 60 designs. The 20 new designs use the `atelier` family and appear first, with a New collection filter. Each has its own opening composition, supporting section treatments, palette, and newly generated artwork. Gallery cards show the complete opening composition at desktop width.

## Artwork and design source

- Design specifications and image-generation prompts: [wedding-collection-2026-09-07.json](./wedding-collection-2026-09-07.json).
- Served artwork: `public/templates/weddings/generated-heroes/<design-id>-hero.webp`.
- Configuration: `templates/weddings/<design-id>/config.json`.
- All 20 artworks are distinct 1536 × 1024 WebP images, approximately 6.47 MB combined. Images were created with the built-in image generator and converted to WebP for local delivery.
- The Knot's [wedding design gallery](https://www.theknot.com/gs/wedding-websites/designs) informed the product-language and browsing review. The new artwork and layouts are original.

| Design | Composition |
| --- | --- |
| Tuscan Lemon Grove | Lemon grove triptych |
| Delft Blue Estate | Porcelain medallion |
| Meadow Reverie | Wildflower field notes |
| Desert Modernism | Adobe offset blocks |
| Chateau Toile | Toile invitation gatefold |
| Riviera Stripes | Beach-club postcard |
| Japanese Ink | Ink scroll diptych |
| Disco Afterglow | Afterparty spotlight |
| Palm Springs Mod | Poolside color blocks |
| Highland Romance | Highland panorama |
| Terracotta Courtyard | Courtyard keyhole |
| Lake Como Letter | Lakeside correspondence |
| Cherry Blossom Silk | Blossom silk fan |
| French Patisserie | Patisserie oval |
| Ocean Cyanotype | Cyanotype specimen print |
| Art Deco Soiree | Stepped marquee |
| Prairie Wildflower | Prairie patchwork |
| Red Thread | Red-thread editorial |
| Moonstone Minimal | Sculptural circle |
| Tropical Afterdark | Botanical shutters |

## Product language

Use **wedding website** and **birthday website** for the full guest experience, **design** for its visual style, and **invitation** for the invitation artwork. This update applies website wording to the wedding design gallery and relevant marketing catalog entries. A broader copy migration across every event vertical is separate work.

## Validation

### Guest controls revision

The separate white toolbar above wedding designs was removed after user feedback. All 60 designs now place the guest controls within their themed content. Wedding buttons and calendar menus use the design palette, with readable text and button shapes appropriate to the design. Gallery thumbnails omit interactive guest controls. Reusable guest buttons on other event surfaces inherit their surrounding theme instead of forcing white fills.

Keep guest actions inside the event design; do not restore a generic toolbar above the hero. Preserve calendar, directions, sharing, and guest-planning behavior when changing their presentation.

This revision passed 25 targeted regression checks, Biome, and compiler diagnostics on 27 touched TypeScript files. Mobile review confirmed the white toolbar is absent and Disco Afterglow uses pink buttons on its dark berry surface, including its calendar menu.

- 15 targeted wedding regression checks pass, covering all configurations, editor/public rendering registrations, unique layout compositions, and 20 distinct locally hosted image assets.
- Biome passes on the changed design files.
- TypeScript compiler diagnostics report no errors in the checked renderer, preview, gallery, catalog, and published-view files. The existing customizer uses `@ts-nocheck`, so its selection behavior was also checked in the browser.
- Chrome review: all 20 new desktop previews fit their opening composition; Disco Afterglow opens in the real editor with the correct image and font. Its 390 px phone layout has no horizontal overflow and section navigation works.
- The VS Code diagnostics bridge was unavailable in this session; compiler diagnostics were used as a fallback.
- No deployment or event publication was performed.

## FFmpeg delivery pass

All artwork in this collection was re-encoded from the original PNGs with FFmpeg/libwebp on September 7, 2026, at quality 85 and compression level 6. Original dimensions are preserved. See the [conversion report and per-file manifest](./generated-artwork-webp-2026-09-07.md).
