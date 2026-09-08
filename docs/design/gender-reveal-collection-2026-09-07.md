# Gender reveal collection — September 7, 2026

Replaced the 8 retired gender reveal templates with 60 original designs. Every entry has a unique name, ID, composition, image prompt, and newly generated artwork. The collection spans Botanical, Celestial, Coastal, Editorial, Landscape, Playful, and Storybook styles.

## Implementation

- Catalog: `src/data/gender-reveal-templates.json`.
- Shared design lookup: `src/lib/gender-reveal-designs.ts`.
- Compositions: `src/components/gender-reveal/GenderRevealScene.tsx` and `gender-reveal-scenes.module.css`. All 60 compositions have individually assigned artwork geometry, text placement, framing, and palette, with responsive layouts and locally bundled display fonts.
- Gallery, editor, and public invitations use `GenderRevealTemplateView`. Square gallery previews use the shared `TemplateThumbnailFrame` and `TemplateThumbnailPreview`, with inert content at quarter scale. Thumbnail mode omits the live map and outer page margins. Artwork loads eagerly for the currently rendered gallery batch, preventing blank images inside the scaled preview frames.
- Saved event details and uploaded images take precedence over catalog defaults. Existing saved template IDs remain intact when editing; retired or unknown IDs resolve to the first new composition without replacing a saved image.
- Preview RSVPs stay local. Live attendance, guesses, reveal behavior, registry links, and guest planning remain in the public viewer.
- The customer-facing product marketing catalog includes the new collection.

## Artwork and provenance

Generated each artwork separately with the **built-in image generation tool**. Final files are in [`public/templates/gender-reveal/collection-2026/`](../../public/templates/gender-reveal/collection-2026/). The complete exact prompt set is in [prompts.json](../../public/templates/gender-reveal/collection-2026/prompts.json).

All 60 images were encoded directly from their generated PNG originals with FFmpeg/libwebp, quality 85 and compression level 6. Dimensions are preserved at 1536 × 1024. The complete WebP collection totals 10,597,782 bytes. Every output decodes, has a unique SHA-256 hash, and passed comparison against its original; the minimum measured PSNR is 35.69 dB. All 60 exact matched PNG originals were deleted after verification.

See the [per-image verification and cleanup record](./gender-reveal-webp-verification-2026-09-07.json).

## Validation

- 19 targeted tests cover the 60 catalog entries, unique assets and compositions, rendering every design through the full public viewer, uploaded-image preservation, local fonts and licenses, guest planning, RSVP answers, and reveal rules.
- Biome passes on the touched TypeScript files.
- Scoped TypeScript compiler diagnostics report zero errors. The VS Code diagnostics wrapper could not run because the Chat-to-CLI bridge is unavailable.
- Chrome verification: the real gallery loads all 60 designs with 60 distinct image paths; every thumbnail is square, inert, and hidden from assistive technology. Keyboard pagination works.
- Petal Post was reviewed in the actual editor on desktop and at 390px mobile width, with no horizontal page overflow. The complete artwork collection was visually inspected.
- No sample events were published.
