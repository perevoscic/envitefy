# Gymnastics full-page designs — September 11, 2026

All 60 current templates now carry their art direction through the full meet program. The former shared tab panel and six light border treatments have been replaced by 60 explicit combinations of page structure, panel silhouette, headings, information cards, navigation, and RSVP placement. No two templates share the same page structure and panel silhouette. Artwork, saved IDs, uploaded image priority, guest actions above the hero, and the shared footer are preserved.

The collection uses 12 page structures, 20 panel silhouettes, eight heading treatments, eight information-card arrangements, four section navigation styles, and four RSVP placements. Choices are assigned explicitly by template ID, never by list position or palette. In-page navigation follows the actual rendered section order; all supplied meet information remains visible, including custom sections. Mobile layouts keep each design's shapes and typography while stacking the content in reading order. Empty content does not create filler panels.

Implementation: `gymnasticsPresentations.ts`, `GymnasticsProgram.tsx`, and `gymnastics-program.module.css` in `src/components/gym-meet-templates/`. Shared block rendering preserves schedules, hotel information, documents, maps, and attendance controls.

## Design inventory

| Template | Page composition | Panel shape | Information cards | RSVP placement |
| --- | --- | --- | --- | --- |
| Airborne Atlas | Asymmetric editorial columns | contour | split | closing |
| Neon Runway | Side titles and horizontal score lanes | cut | lanes | sidebar |
| Petal & Poise | Staggered garden invitations | arch | petals | invitation |
| Copper Grip | Alternating workbench grid | bracket | ledger | sidebar |
| Tidal Tumble | Offset flowing sections | wave | steps | closing |
| Crimson Collegiate | Wide lead and two-column program | pennant | podium | opening |
| Moonbeam Balance | Centered lead and orbiting panels | capsule | split | invitation |
| Citrus Springboard | Uneven festival mosaic | offset | mosaic | opening |
| Monochrome Flight | Magazine title and story columns | ruled | ledger | closing |
| Desert Dismount | Alternating itinerary along a track | stone | steps | sidebar |
| Prism Routine | Large opening spread and paired exhibits | facet | mosaic | opening |
| Maple Medal | Bound two-page scorebook | bound | tickets | closing |
| Electric Orchid | Side titles and horizontal score lanes | frame | mosaic | opening |
| Porcelain Podium | Large opening spread and paired exhibits | double | podium | invitation |
| Rally Pennants | Wide lead and two-column program | ticket | tickets | sidebar |
| Rose Quartz Rise | Staggered garden invitations | facet | split | closing |
| Velocity Blueprint | Alternating workbench grid | frame | lanes | closing |
| Jungle Cartwheel | Alternating itinerary along a track | petal | petals | opening |
| Saffron Salute | Magazine title and story columns | arch | steps | invitation |
| Silver Apparatus | Bound two-page scorebook | bracket | lanes | sidebar |
| Aurora Chalk | Centered lead and orbiting panels | wave | steps | closing |
| Peach Practice | Uneven festival mosaic | scallop | petals | invitation |
| Grandstand Gold | Wide lead and two-column program | double | split | invitation |
| Indigo Ink | Magazine title and story columns | bound | tickets | sidebar |
| Coral Clubhouse | Offset flowing sections | terrace | mosaic | opening |
| Alpine Ascent | Alternating itinerary along a track | cut | lanes | closing |
| Confetti Kip | Uneven festival mosaic | notch | tickets | closing |
| Midnight Marquee | Side titles and horizontal score lanes | ticket | podium | invitation |
| Willow Warmup | Staggered garden invitations | petal | steps | sidebar |
| Studio Arc | Large opening spread and paired exhibits | arch | ledger | closing |
| Cherry Blossom Vault | Staggered garden invitations | scallop | mosaic | opening |
| Oceanic Rings | Centered lead and orbiting panels | oval | petals | sidebar |
| Flame & Focus | Side titles and horizontal score lanes | pennant | steps | closing |
| Lilac Leap | Large opening spread and paired exhibits | capsule | tickets | sidebar |
| Court of Champions | Wide lead and two-column program | frame | ledger | closing |
| Papaya Pop | Uneven festival mosaic | petal | podium | sidebar |
| Obsidian Precision | Magazine title and story columns | bracket | split | opening |
| Bluebird Morning | Offset flowing sections | arch | tickets | invitation |
| Terrazzo Team | Alternating workbench grid | offset | mosaic | opening |
| Amethyst Arena | Centered lead and orbiting panels | facet | podium | opening |
| Golden Hour Gym | Asymmetric editorial columns | arch | steps | invitation |
| Aqua Acrobat | Offset flowing sections | notch | lanes | sidebar |
| Red Clay Rotation | Alternating workbench grid | stone | petals | invitation |
| Starfall Session | Centered lead and orbiting panels | notch | tickets | closing |
| Daisy Daybreak | Staggered garden invitations | oval | podium | invitation |
| Metro Motion | Asymmetric editorial columns | cut | lanes | sidebar |
| Velvet Victory | Large opening spread and paired exhibits | scallop | petals | invitation |
| Mint Condition | Bound two-page scorebook | ruled | split | closing |
| Sunflower Salute | Wide lead and two-column program | arch | steps | opening |
| Polar Parallel | Asymmetric editorial columns | terrace | podium | opening |
| Sienna Scorebook | Bound two-page scorebook | ticket | ledger | opening |
| Bubblegum Bounce | Uneven festival mosaic | capsule | steps | invitation |
| Evergreen Elevation | Alternating itinerary along a track | arch | podium | invitation |
| Cobalt Circuit | Alternating workbench grid | notch | tickets | sidebar |
| Ruby Ribbonline | Magazine title and story columns | pennant | podium | invitation |
| Sandstone Spring | Alternating itinerary along a track | terrace | split | closing |
| Lavender Locker | Bound two-page scorebook | offset | lanes | invitation |
| Solar Somersault | Offset flowing sections | oval | podium | opening |
| Blackberry Beam | Asymmetric editorial columns | bound | tickets | invitation |
| Skyline Sendoff | Side titles and horizontal score lanes | terrace | split | closing |

## Verification

`node --test src/components/gym-meet-templates/collection.test.cjs` checks all 60 renderers, uploaded artwork, attendance states, layout coverage, content retention, in-page anchors, and empty meets. `node scripts/verify-gymnastics-designs.cjs` renders the production components with one consistent local fixture, checks all templates at 1440, 768 and 375px, exercises section navigation and RSVP, checks sparse/empty/long content, and writes screenshots and contact sheets under `tmp/gymnastics-design-verification/review`. The fixture never saves events or drafts.

Final results: 60 distinct measured section geometries at each of 1440, 768 and 375px; no section/card overflow, overlaps, runtime errors, or hydration errors. Section links and RSVP selection, submission, and reset passed for every design at each width. Sparse, empty, and long-title fixtures also passed for the entire collection. All 60 desktop compositions were visually reviewed in five contact sheets, with individual phone details inspected as well.

The eight collection tests and three hotel rendering guards pass. Biome reports no issues in the five changed TypeScript modules; scoped TypeScript diagnostics are clear. The VS Code diagnostics bridge is unavailable in this environment. Broader existing source guards still fail on two gallery expectations that predate the artwork-thumbnail change and three untouched discovery builder expectations for hotel/admission data. Those unrelated guards and data builders were not changed. An anonymous attempt to open the real editor redirects to the landing page, so interactive verification used the production components in the local fixture rather than an authenticated owner session.

Contact sheets: [01–12](../../tmp/gymnastics-design-verification/review/contact-1.png), [13–24](../../tmp/gymnastics-design-verification/review/contact-2.png), [25–36](../../tmp/gymnastics-design-verification/review/contact-3.png), [37–48](../../tmp/gymnastics-design-verification/review/contact-4.png), [49–60](../../tmp/gymnastics-design-verification/review/contact-5.png).
