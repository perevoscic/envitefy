# Celebration content art directions

The content below each invitation's hero uses an explicit design assignment:

| Category | Designs |
| --- | ---: |
| Birthdays | 120 |
| Anniversaries | 30 |
| Weddings | 60 |
| Baby showers | 60 |
| Gender reveals | 60 |

Assignments live in `scripts/build-celebration-art-directions.cjs`. Run that script to regenerate `src/data/celebration-art-directions.json`. Each assignment combines a silhouette, border construction, heading composition, page arrangement and restrained CSS gradient. Layouts are selected explicitly for each theme, not from a hash or palette. Existing wedding compositions remain in their renderers; the shared material changes their content surfaces.

`TemplateBodyLayout` applies the same presentation in editors and guest pages. Content, anchors, RSVP controls and explicit-save behavior are preserved. Container queries keep narrow desktop editor previews in one column. Original hero artwork, gallery thumbnails and brand assets are unchanged.

The user requested removal of the added SVG backgrounds. All 90 generated football pattern files and their references were deleted. Neither generator creates SVG backgrounds. Gradients and structural CSS remain.

## Validation — September 15, 2026

- Rendered all 330 full invitation templates using their actual React components.
- Browser layout checks at 1440px desktop, 390px phone and 620px constrained preview: all 330 had styled content surfaces, no SVG background references and no overflowing content panels. All 270 shared bodies used one column in the constrained preview.
- Inspected representative birthday, anniversary, wedding, baby-shower and reveal content, including dark backgrounds. Corrected schedule wrapping, host-card contrast and birthday RSVP/registry contrast.
- 18 focused tests passed, including catalog coverage, structural treatment uniqueness, all 270 shared bodies, all 60 wedding renderers, original artwork/guest tools and football pattern removal.
- Biome passed for 19 changed implementation/test files.
- Full TypeScript checking still reports existing errors outside these changed files. The VS Code diagnostic bridge is unavailable. The existing wedding collection source test fails on its old `draftThemeId` assertion in the unchanged customization page; the new wedding rendering test passes all 60 designs.

The temporary local style review is at `http://localhost:4319/celebrations/`. It contains demonstration content and static renderings, not saved events.
