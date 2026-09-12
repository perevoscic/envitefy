# Football template review

Reviewed all 37 football templates on September 12, 2026. The original collection reused one thumbnail image, the published header omitted hero media, several IDs shared a fallback theme, and some labels still referred to gymnastics.

Each design now has its own generated football artwork, palette, display typography and composition. Four responsive hero families provide cinematic overlays, centered posters, editorial spreads and split layouts. Gallery art, editor previews and published event heroes use the same design mapping. Stable IDs preserve saved selections; custom uploaded artwork takes precedence.

| Design | Hero composition | Distinct artwork | WebP size |
| --- | --- | --- | --- |
| Kickoff Editorial | Editorial | Sideline football at dawn | 179 KiB |
| Elite Athlete | Cinematic | Player entering a floodlit stadium | 148 KiB |
| The Bento Box | Split | Football equipment arranged on a studio surface | 224 KiB |
| Team Huddle | Split | A community team huddles with its coach | 192 KiB |
| Varsity Classic | Poster | Vintage football and burgundy helmet | 217 KiB |
| Road to Kickoff | Editorial | Players walking toward a stadium in autumn | 311 KiB |
| Scouting Report | Split | A coach's clipboard, stopwatch and football | 247 KiB |
| Cyber Athlete | Cinematic | A football helmet in a neon arena | 230 KiB |
| Playbook Sketch | Editorial | Hand-drawn football equipment on sketch paper | 409 KiB |
| Sunset Arena | Cinematic | Goalpost beneath an amber sunset | 260 KiB |
| Pop Art | Poster | A pop-art football in flight | 391 KiB |
| Swiss Grid | Editorial | Red football helmet on a white plinth | 131 KiB |
| Art Deco | Poster | An art deco football stadium in gold and black | 280 KiB |
| Concrete Yard | Split | Helmet and cleats on concrete stadium steps | 227 KiB |
| Midnight Frost | Cinematic | Football on frosted turf at night | 191 KiB |
| Grassroots | Editorial | Football on a green community field | 216 KiB |
| Holo Elite | Split | Pearlescent football helmet on a white pedestal | 153 KiB |
| Glitch Sport | Poster | A receiver rendered with red and cyan glitch effects | 210 KiB |
| Field & Form | Split | Layered paper football and flowing field shapes | 259 KiB |
| Pixel Arena | Poster | An isometric pixel-art football stadium | 350 KiB |
| Stadium Study | Editorial | The geometry of a modern football stadium | 335 KiB |
| Noir Silhouette | Cinematic | A player silhouetted in a dark stadium tunnel | 83 KiB |
| Vaporwave Grid | Poster | A football above a neon grid field | 250 KiB |
| Heavy Impact | Poster | A lineman in yellow and charcoal poster art | 377 KiB |
| Tech Blueprint | Editorial | A football stadium drawn as a cobalt blueprint | 397 KiB |
| Neon Rush | Cinematic | A running back sprinting through lime stadium light | 164 KiB |
| Luxe Editorial | Editorial | A vintage football on a stone pedestal | 211 KiB |
| Chalkboard Coach | Split | A chalk football helmet and tactical routes | 309 KiB |
| Championship Lights | Cinematic | A football trophy under championship spotlights | 163 KiB |
| Coach's Notebook | Editorial | A football coach's notebook and whistle | 162 KiB |
| Spring Scrimmage | Split | Illustrated players practicing a spring pass | 158 KiB |
| Booster Club | Poster | Team helmets beneath navy and crimson pennants | 216 KiB |
| Northern Lights | Cinematic | A football field under the northern lights | 275 KiB |
| Sideline Stories | Editorial | A football captain pauses on the sideline | 88 KiB |
| Victory Poster | Poster | A raised football in vintage victory poster art | 439 KiB |
| End Zone Grid | Split | Aerial view of a football end zone and training cones | 318 KiB |
| Away Game | Editorial | Football travel gear beside a team bus window | 129 KiB |

All images were generated with the built-in image_gen tool, then encoded directly to WebP using FFmpeg libwebp quality 85 and compression level 6. Each output retains its original 1536 × 1024 dimensions, passes a full decode check, and has a distinct SHA-256 hash. The 37 matched generated PNG originals were removed after verification. No existing source artwork was deleted.

The full prompt set, final asset paths, dimensions, byte counts and hashes are recorded in [football-template-artwork.json](football-template-artwork.json). Final assets live in `public/images/football/templates/`.

Verification covers all 37 rendered hero mappings, unique media and palettes, legacy default replacement, custom-upload preservation, and foreground/accent contrast of at least 4.5:1 on template surfaces.

Browser review confirmed all 37 desktop gallery images load, the mobile gallery uses two columns without horizontal overflow, mobile hero layouts retain accessible 44px event actions, and switching designs updates the hero, composition and surrounding canvas while preserving event details. All nine focused tests, focused TypeScript and Biome checks pass. The VS Code diagnostics bridge was unavailable in this session.
