# Birthday collection redesign — September 7, 2026

Replaced the catalog’s repeated hero compositions with 104 individually composed invitation scenes and 104 newly generated artworks. The collection retains its existing IDs: 24 originals, 30 kids themes, 40 adult birthdays, and 10 anniversaries.

## Implementation

- `src/components/birthdays/redesign/OriginalBirthdayScenes.tsx`: 24 explicit scene compositions.
- `src/components/birthdays/redesign/KidsBirthdayScenes.tsx`: 30 explicit scene compositions.
- `src/components/birthdays/redesign/AdultBirthdayScenes.tsx`: 50 explicit scene compositions.
- `BirthdayScene.tsx` selects the design; `primitives.tsx` shares data and action behavior without imposing a common hero layout.
- `BirthdayArtDirectedBody.tsx`, `body-directions.ts`, and `birthday-scenes.module.css` provide 24 curated supporting layout treatments assigned by theme meaning. These replace the repeated facts strip and generic cards for catalog designs.
- Gallery previews render the same hero and body used by the editor and published invitation.
- Date/calendar, venue/directions, RSVP, and sharing remain part of the design. Existing user-uploaded art is preserved when bundled artwork upgrades.
- 24 typefaces are bundled locally in `public/fonts/birthday/`; source URLs and individual licenses are included. The canonical Envitefy wordmark was not changed.

## Generated artwork and exact prompts

All artwork was generated with the built-in image generation tool. Final project assets are WebP, maximum width 1600px, quality 85, without upscaling. Original generation PNGs were deleted at the user’s request after the FFmpeg WebP copies were verified.

| Collection | Assets | Exact prompt record |
|---|---:|---|
| Original birthdays | `public/templates/birthdays/redesign/original/` — 24 | `public/templates/birthdays/redesign/original/prompts.json` |
| New kids birthdays | `public/templates/birthdays/redesign/kids/` — 30 | `public/templates/birthdays/redesign/kids/prompts.json` |
| Adult birthdays and anniversaries | `public/templates/birthdays/redesign/adult/` — 50 | `public/templates/birthdays/redesign/adult/prompts.json` |

## Verification

- 14 regression tests passed, including server rendering all 104 designs, checking every artwork reference, one primary heading per scene, guest notes/actions, uploaded-image preservation, and local font/license coverage.
- Biome passed on touched birthday implementation files.
- Scoped TypeScript diagnostics: zero errors.
- Production build passed. Next’s configured type-check bypass is supplemented by the scoped TypeScript check above.
- Chrome desktop checks included Party Pop, Rainbow Bash, Happy Dance, Sparkle Splash, Construction Crew, Junior Baker, Airplane Travel, Disco Cowgirl, Observatory, and Paper Atelier. Gallery previews were compared visually. Construction Crew and Paper Atelier were also reviewed at 390px width with no horizontal page overflow.
- Fixed font fallback, title wrapping, artwork crops, long-copy accommodation, dark host-card contrast, adult/anniversary preview defaults, singular anniversary wording, and duplicate notes found during review.
- VS Code diagnostic wrapper could not run because the Chat-to-CLI bridge is unavailable; the scoped TypeScript compiler check passed instead.

No sample events were published during verification.

## FFmpeg delivery pass

All artwork in this collection was re-encoded from the original PNGs with FFmpeg/libwebp on September 7, 2026, at quality 85 and compression level 6. Original dimensions are preserved. See the [conversion report and per-file manifest](./generated-artwork-webp-2026-09-07.md).
