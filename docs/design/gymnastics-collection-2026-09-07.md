# Gymnastics collection — September 7, 2026

The gymnastics gallery and editor now offer 60 newly created templates. Every template has a unique ID, name, original artwork, sample event title, venue, and composition. The former 37 gymnastics choices and their individual renderer files have been replaced. Saved events using retired template IDs resolve to Airborne Atlas; their event data is preserved.

## Design and integration

- The registry is `src/components/gym-meet-templates/registry.ts`.
- `GymnasticsScene.tsx` and `gymnastics-collection.module.css` define the 60 compositions, including typography, artwork frames, column arrangements, spacing, colors, and six supporting content treatments.
- `GymnasticsPreview.tsx` supplies the same real renderer to the gallery and editor picker. Both use the shared square thumbnail frame, white inset, rounded corners, and inert preview content. Selection controls remain outside the preview.
- The shared guest content retains meet discovery sections, RSVP, calendars, sharing, and custom uploaded artwork.
- Football previously imported the gymnastics catalog. Its existing 37 choices were preserved in an independent football registry and selector.
- The gymnastics proof points in `src/lib/product-marketing-catalog.ts` describe the new collection.

## Artwork provenance

All 60 artworks were generated individually with the built-in ImageGen tool. No existing gymnastics artwork was reused. The collection includes sports photographs, gouache and ink illustrations, architectural scenes, paper compositions, and sculptural still lifes.

Final assets: `public/templates/gymnastics/collection-2026/<template-id>.webp`.

Exact prompts, generation source paths, final paths, dimensions, hashes, and cleanup status are recorded in [prompts.json](../../public/templates/gymnastics/collection-2026/prompts.json).

Each original was encoded directly with FFmpeg `libwebp`, quality 85 and compression level 6. All 60 outputs preserve 1536 × 1024 dimensions, decode successfully, have a WebP signature, and have distinct SHA-256 hashes. Total final artwork size is 10,243,572 bytes. All 60 corresponding generated PNG originals were deleted only after verification, and their absence was checked again after cleanup.

## Verification

- 17 targeted Node tests passed across `collection.test.cjs`, `renderModelGuards.test.mjs`, and `titleTypography.test.mjs`.
- 3 discovery template-selection tests passed with Bun.
- The rendering checks cover all 60 guest pages, unique artwork and sample data, uploaded-image priority, submitted RSVP state, preview consistency, and compatibility with football.
- Biome passed for the touched template and editor TypeScript files. The VS Code diagnostics wrapper could not run because its Chat-to-CLI bridge was unavailable. A scoped TypeScript diagnostic check reported no errors in the gymnastics and football template modules; unrelated repository errors remain.
- The running gallery displayed all 60 designs after pagination, with square inert previews and no horizontal page overflow.
- The live editor loaded Neon Runway. Selecting Petal & Poise changed the artwork and composition while preserving the event title. An undefined search-params hook reference in the editor wrapper was corrected during this check.
- A phone check exposed a CSS specificity issue that retained desktop grid positions. The mobile reset now has sufficient specificity. All 60 production scene compositions were then rendered in a temporary static verification page: at 390 px, every section stacked without overlap and the page had no horizontal overflow; at 1280 px, no title overflow or horizontal page overflow was found. This final composition check used the same scene component and CSS while the shared Next.js server was busy compiling. The temporary page was removed afterward.

Earlier broader source-guard runs still reported unrelated discovery hotel/admission and football navigation guard failures. Those unrelated guards were not weakened. No production deployment or stored-event migration was performed.
