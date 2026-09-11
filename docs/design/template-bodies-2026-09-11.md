# Template body audit — September 11, 2026

The public catalog contains 585 templates across nine categories. This change redesigns 402 repeated bodies and preserves 183 designs. Layouts can be reused across categories, but each category must retain distinct body compositions independent of its hero artwork and colors.

| Category | Redesigned | Preserved |
| --- | ---: | ---: |
| Birthdays | 96 | 24 |
| Weddings | 0 | 60 |
| Anniversaries | 13 | 17 |
| Baby showers | 51 | 9 |
| Bridal showers | 2 | 1 |
| Gender reveals | 54 | 6 |
| Gymnastics | 0 | 60 |
| Sports | 41 | 1 |
| Signup forms | 145 | 5 |

The per-template inventory and preservation decisions are in `template-body-audit-2026-09-11.json`. Weddings retain their individual renderers and body compositions. Gymnastics retains the earlier collection redesign. In the remaining categories, existing structural families retain one representative. Additional mobile comparisons identified three family representatives that still repeated another body; those received new compositions too.

## Implementation

- `src/data/template-body-presentations.json` assigns explicit, stable template IDs to layouts. Gallery ordering and future additions cannot change existing assignments.
- `TemplateBodyLayout` rearranges the existing content in DOM order. Its 12 arrangements, 20 panel silhouettes, six heading treatments and four reading orders allow distinct compositions without changing guest actions or event data.
- Empty optional sections are omitted. RSVP forms retain a full-width panel. Mobile layouts use one column while retaining the design's inset rhythm, framing and heading treatment.
- Birthday/anniversary, baby/bridal shower, reveal and signup renderers are shared with their editor previews. Sports saves its selected `bodyDesignId` and renders it in both editor and saved page, with existing template-editor IDs supported as a fallback.
- Heroes, artwork thumbnails, galleries used to choose templates, and shared footers are unchanged.

## Verification

- All 585 catalog IDs are covered by the audit. Overrides have no duplicate arrangement/silhouette pair within their category; preserved IDs have no override.
- Browser geometry comparison of all 402 new bodies at 1280px and 375px with identical content: no duplicates or overflow.
- Actual birthday/anniversary, shower, reveal, sports, signup and wedding renderers checked at both widths. Wedding checks include body sections without heading tags; signup checks include the real page container. No duplicate bodies or overflow in changed designs.
- Sparse event checks omit optional content and disabled RSVP sections; section anchors and action callbacks remain intact.
- 36 regression tests pass, including full saved-event Share behavior, all gymnastics pages, signup rendering/persistence, and section preservation/reordering.
- Scoped TypeScript diagnostics: zero. Biome: no new warnings. The VS Code diagnostics bridge was unavailable; TypeScript was run directly instead.

Run `node scripts/verify-template-bodies.cjs` for real-renderer checks, `--mode=geometry` for identical-content comparisons, and `--sparse` for missing optional content. `--category=signup-forms` narrows a check; `--screens` writes local review screenshots under `tmp/template-body-review/review`. The harness does not save events or submit forms. Network-backed session/map services are mocked, and unavailable remote fonts may fall back.

Unchanged designs have existing overflow observations: decorative artwork in Retro 70s and Garden Wedding; Industrial Wedding and Newspaper Wedding outer layouts; Riviera Stripes photos; and Super Star's desktop schedule. These are reported separately and were not redesigned, following the request to preserve already distinct designs. An existing optional-chain Biome warning in `SimpleTemplateView.tsx` is also unchanged.
