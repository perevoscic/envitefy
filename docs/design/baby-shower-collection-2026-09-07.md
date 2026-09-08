# Baby shower collection — September 7, 2026

Replaced the previous 24-design catalog with 60 original baby shower designs. Every design has a distinct name, artwork concept, generated image, composition, palette, sample baby name, parent name, venue, headline, and host copy. The collection uses 17 locally bundled, licensed display typefaces across 11 styles.

The public gallery, workspace picker, editor, and invitation viewer share the same renderer. Gallery previews use the standard square frame with an 8px white inset and inert quarter-scale content. Layouts adapt to phone widths. Calendar, directions, sharing, registry, host details, photos, RSVP, and optional guest planning remain available.

The retired catalog and bundled artwork were removed. A 24-entry compatibility map upgrades old design IDs and asset URLs; uploaded and external images are preserved. Empty saved host and registry lists remain empty when reopened. New designs start without an inherited RSVP deadline or expected-arrival date.

## Artwork and provenance

- Generated individually with the built-in ImageGen tool; exact prompts and design specifications: [collection manifest](baby-shower-collection-2026-09-07.json).
- Delivered as 60 WebPs at 1536 × 1024 pixels, encoded directly with FFmpeg libwebp, quality 85, compression level 6. Total size: 16,273,782 bytes.
- All files passed format, decoding, dimensions, alpha, and unique SHA-256 checks. All 60 exact PNG originals were deleted after verification; the temporary contact sheet was also removed.
- Verification and original/output hashes: [artwork report](baby-shower-artwork-2026-09-07.json). Recheck with `node scripts/verify-baby-shower-artwork.mjs`.

## Validation

- 12 targeted regression checks passed: collection uniqueness, complete rendering of all 60 designs, gallery accessibility, local font licenses, retired-design compatibility, guest planning, and landing-page references.
- Browser: all 60 gallery images loaded at their expected dimensions; previews were inert and hidden from assistive technology. Starlight Observatory was inspected on desktop and at 390px phone width, with no horizontal overflow. Calendar links, directions, mobile details, and live name editing were verified.
- Biome: no errors. The VS Code diagnostics bridge was unavailable; scoped TypeScript diagnostics returned zero errors across nine checked files.
- A retired artwork URL returned HTTP 308 to its new WebP. The collection also loaded on the main local server at port 3000.
- No event was published or deployed during verification.

## Designs

| Design | Sample baby | Style |
| --- | --- | --- |
| Pear Orchard Cradle | Olive | Botanical |
| Otterly Loved | Finn | Woodland |
| Starlight Observatory | Atlas | Celestial |
| Peach Patisserie | Cleo | Food & Fun |
| Whale Song Bay | Kai | Coastal |
| Marigold Courtyard | Mira | Botanical |
| Bunny Burrow Brunch | Hazel | Woodland |
| Paper Kite Parade | Leo | Playful |
| Rosewater Reverie | Isla | Elegant |
| Apricot Quilt Club | June | Artisan |
| Little Lighthouse | Noah | Coastal |
| Fig & Fern | Ivy | Botanical |
| Duckling Puddle Party | Poppy | Playful |
| Swan Lake Serenade | Odette | Elegant |
| Clementine Sunroom | Ari | Food & Fun |
| Hummingbird Haven | Wren | Botanical |
| Gingham Goose | Hugo | Farm & Garden |
| Moon Jelly Drift | Luna | Celestial |
| Cherry Bow Social | Ruby | Food & Fun |
| Alpine Fawn | Theo | Woodland |
| Rainbow Prism Studio | Nova | Modern |
| Hibiscus Hideaway | Leilani | Botanical |
| Pocket Robot | Milo | Playful |
| Lavender Laundry | Esme | Artisan |
| Turtle Tidepool | Reef | Coastal |
| Strawberry Stitch | Freya | Artisan |
| Desert Tortoise | Sage | Woodland |
| Origami Crane Wishes | Ren | Artisan |
| Blueberry Breakfast | Felix | Food & Fun |
| Foxglove Fairy Door | Faye | Woodland |
| Polka Dot Puppy | Archie | Playful |
| Magnolia Morning | Grace | Elegant |
| Tiny Train Ticket | Otto | Playful |
| Water Lily Welcome | Nell | Botanical |
| Cocoa Cabin | Oscar | Seasonal |
| Bubblegum Carousel | Daisy | Playful |
| Olive Oil Bambino | Luca | Food & Fun |
| Little Bookbindery | Elliot | Artisan |
| Dandelion Post | Flora | Botanical |
| Koala Eucalyptus Club | Bodhi | Woodland |
| Sugarplum Music Box | Violet | Elegant |
| Tiny Tennis Club | Jasper | Playful |
| Pumpkin Patch Promise | Rowan | Seasonal |
| Seahorse Garden | Marina | Coastal |
| Silk Ribbon Atelier | Anya | Elegant |
| Cloud Nine Airmail | Asher | Celestial |
| Chrysanthemum Tea | Mei | Botanical |
| Maple Mouse House | Pip | Woodland |
| Snowdrop First Light | Alba | Seasonal |
| Confetti Clay Play | Arlo | Modern |
| Pomegranate Blessing | Zara | Elegant |
| Meadow Lamb | Silas | Farm & Garden |
| Peony Parasol | Ada | Elegant |
| Saffron Sunset Camper | Beau | Playful |
| Jasmine Crescent | Inaya | Celestial |
| Little Artichoke | Remy | Farm & Garden |
| Penguin Postcard | Nico | Seasonal |
| Golden Ginkgo | Akira | Botanical |
| Macaron Moonwalk | Cosmo | Celestial |
| Willow Wishing Boat | Elio | Coastal |
