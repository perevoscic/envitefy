# Football collection: 23 additional designs

The football gallery and editor now offer 60 designs. The original 37 remain available. Each addition has its own OpenAI-generated artwork, palette, title typography, and coordinated event surfaces. The opening gallery mixes new and existing designs.

New designs: Friday Night, Coastal Kickoff, Desert Gridiron, Mountain League, Homecoming, Rain Game, Snow Bowl, Red Zone, Leather & Linen, Chrome League, Saturday Morning, Women's Gridiron, Pep Rally, Captain's Band, Overtime, Tailgate Social, Bandstand, Goal Line, Retro Broadcast, Rivalry Week, City League, Sunday Ink, and Pennant Club.

Art direction spans stadium photography, regional landscapes, weather, youth and women's football, community traditions, watercolor, linocut, paper craft, and graphic still lifes. Thumbnail focal positions keep key subjects visible; Women's Gridiron also preserves its portrait crop in the event hero.

## Verification

- All 60 IDs resolve, have distinct artwork and palettes, and render through the shared event hero. Custom image retention and theme contrast checks pass.
- All 60 gallery designs are reachable through automatic loading. No title clipping or horizontal page overflow at desktop width or 375px mobile width.
- Gallery search opens Mountain League in the editor. The editor lists 60 designs; selecting Rivalry Week updates the artwork, layout, and palette. Temporary verification changes were discarded without saving a draft.
- Seven football tests passed. Biome passed and TypeScript reported zero diagnostics in the changed files. The VS Code diagnostics bridge was unavailable.
- All 23 images were encoded with FFmpeg libwebp at quality 85 and compression level 6. Every WebP was decoded and checked against its original dimensions. The 23 matched generated PNG originals were deleted after verification.

The [artwork manifest](football-expansion-artwork-2026-09-12.json) records all prompts, final paths, dimensions, hashes, generation provenance, and cleanup results. Final assets are in `public/images/football/templates/`.
