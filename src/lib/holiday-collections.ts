import type { HolidayCollection } from "./holiday-collection-types";

// Curated sources: scripts/build-holiday-collections.py and scripts/data/holiday-expansion-scenes.json. Dates guide discovery only.
export const HOLIDAY_COLLECTIONS = [
  {
    "id": "new-years-day",
    "name": "New Year’s Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 1,
      "day": 1,
      "duration": 1
    },
    "palettes": [
      "sage",
      "marine",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "new year January brunch fresh start",
    "designs": [
      {
        "slug": "morning-light",
        "name": "Morning Light",
        "scene": "A small breakfast table by a winter window, simple coffee mugs and oranges"
      },
      {
        "slug": "first-walk",
        "name": "First Walk",
        "scene": "A quiet frosty park path in pale morning daylight"
      },
      {
        "slug": "brunch-together",
        "name": "Brunch Together",
        "scene": "A family kitchen table with pancakes, berries and mismatched plates"
      },
      {
        "slug": "fresh-chapter",
        "name": "Fresh Chapter",
        "scene": "An open blank notebook and a plain ceramic mug on a lived-in desk"
      },
      {
        "slug": "winter-kitchen",
        "name": "Winter Kitchen",
        "scene": "A loaf of bread cooling beside a tea towel in an ordinary kitchen"
      },
      {
        "slug": "open-door",
        "name": "Open Door",
        "scene": "A welcoming front porch with a simple evergreen wreath and snow on the steps"
      },
      {
        "slug": "quiet-start",
        "name": "Quiet Start",
        "scene": "A soft wool blanket, closed book and tea beside a window"
      },
      {
        "slug": "neighborhood-morning",
        "name": "Neighborhood Morning",
        "scene": "An empty neighborhood cafe with chairs and natural window light"
      },
      {
        "slug": "new-growth",
        "name": "New Growth",
        "scene": "Small potted herbs on a slightly weathered windowsill"
      },
      {
        "slug": "around-the-table",
        "name": "Around the Table",
        "scene": "A modest lunch table with linen napkins and winter greenery"
      },
      {
        "slug": "frosted-footbridge",
        "name": "Frosted Footbridge",
        "scene": "An empty wooden footbridge over a shallow frozen park stream on the first winter morning of the year. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "january-seed-sort",
        "name": "January Seed Sort",
        "scene": "Loose seeds, plain packets and a blank planting notebook on worn floorboards. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "crocus-promise",
        "name": "Crocus Promise",
        "scene": "Small crocus shoots emerging through old snow beside a garden wall. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "marmalade-peel",
        "name": "Marmalade Peel",
        "scene": "Orange peel drying above a plain kitchen sink with washed preserving jars nearby. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "open-community-room",
        "name": "Open Community Room",
        "scene": "An unlocked neighborhood hall ready for a modest New Year's Day gathering, empty coats on pegs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-harbor-year",
        "name": "Quiet Harbor Year",
        "scene": "Ordinary moored boats and thin January mist over still harbor water. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "rooftop-winter-garden",
        "name": "Rooftop Winter Garden",
        "scene": "A modest apartment rooftop garden with bare planters and melting snow. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "bicycle-ready",
        "name": "Bicycle Ready",
        "scene": "A freshly repaired ordinary bicycle beside a garage door, wool scarf looped over its rack. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "bare-orchard-branches",
        "name": "Bare Orchard Branches",
        "scene": "Bare apple branches against pale January sky with a few weathered fruits. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "doorstep-milk",
        "name": "Doorstep Milk",
        "scene": "A reusable milk bottle and rosemary sprig on a winter doorstep overlooking a quiet street. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "first-evening-windows",
        "name": "First Evening Windows",
        "scene": "Ordinary neighborhood windows glowing beneath a blue winter evening sky. Camera: ordinary eye-level night photography under believable practical light, restrained exposure."
      },
      {
        "slug": "new-year-swim-bench",
        "name": "New Year Swim Bench",
        "scene": "A plain changing-room bench beside an empty community pool, folded towels nearby. Camera: an off-center three-quarter environmental view with natural real-world perspective."
      },
      {
        "slug": "winter-allotment",
        "name": "Winter Allotment",
        "scene": "Empty vegetable allotment paths after rain, newly turned soil and ordinary sheds. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "fresh-year-puzzle",
        "name": "Fresh Year Puzzle",
        "scene": "An unfinished botanical jigsaw spread on a plain rug without lettering. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "rain-boot-row",
        "name": "Rain Boot Row",
        "scene": "Muddy walking boots outside an ordinary home after a first-day nature walk. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "new-leaf-unfurling",
        "name": "New Leaf Unfurling",
        "scene": "One fresh leaf opening on an everyday houseplant in an imperfect terracotta pot. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bakery-opening",
        "name": "Bakery Opening",
        "scene": "A small neighborhood bakery through its open rear door, bread racks and no people. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "seaside-first-walk",
        "name": "Seaside First Walk",
        "scene": "A quiet winter shoreline with modest beach huts and small distant waves. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-after-rain",
        "name": "Courtyard After Rain",
        "scene": "A modest residential courtyard with wet paving and bare potted shrubs. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "repaired-sled",
        "name": "Repaired Sled",
        "scene": "A simple wooden sled with new cotton rope leaning against a weathered shed. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "winter-conservatory",
        "name": "Winter Conservatory",
        "scene": "Ordinary timber roof and fogged conservatory glass with green leaves below. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "trail-thermos",
        "name": "Trail Thermos",
        "scene": "A plain metal thermos on a low stone wall beside a frosty woodland trail. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "morning-laundry",
        "name": "Morning Laundry",
        "scene": "Fresh white linen hanging in an empty laundry room beside a winter window. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "citrus-breakfast-bowl",
        "name": "Citrus Breakfast Bowl",
        "scene": "Clementine segments, walnuts and granola in plain bowls on rumpled cotton. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "new-walking-path",
        "name": "New Walking Path",
        "scene": "A cleared accessible park path with shallow snow banks and wooden handrail. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "mended-wool",
        "name": "Mended Wool",
        "scene": "A visible hand-mended patch in an old wool blanket over an everyday chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "garden-gate-reset",
        "name": "Garden Gate Reset",
        "scene": "A garden gate opening onto newly raked winter beds and a plain watering can. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "lake-reflections",
        "name": "Lake Reflections",
        "scene": "An empty lakeside jetty and ordinary bare trees reflected in January water. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "stairwell-plant-exchange",
        "name": "Stairwell Plant Exchange",
        "scene": "Small unlabelled houseplants left for neighbors on a shared apartment landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "bread-cooling-rack",
        "name": "Bread Cooling Rack",
        "scene": "A homemade seeded loaf cooling beside an ordinary winter kitchen window. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "winter-chimes",
        "name": "Winter Chimes",
        "scene": "A handmade wooden wind chime beneath a porch beam with bare garden behind. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "january-doormat",
        "name": "January Doormat",
        "scene": "A damp coir doormat and evergreen sprig at an ordinary front door. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-yoga-space",
        "name": "Community Yoga Space",
        "scene": "An empty neighborhood exercise room with loosely spaced plain yoga mats. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "repair-resolutions",
        "name": "Repair Resolutions",
        "scene": "A broken wooden toy, simple repair tools and spare cord on a workshop floor. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "icy-birdbath",
        "name": "Icy Birdbath",
        "scene": "A shallow garden birdbath with thawing ice and scattered natural seed husks. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "garden-bulb-roots",
        "name": "Garden Bulb Roots",
        "scene": "Paperwhite roots visible through a reused clear glass jar on a modest sill. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "open-reading-nook",
        "name": "Open Reading Nook",
        "scene": "A home reading alcove through a half-open door, plain blanket and unlettered books. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-canal",
        "name": "Winter Canal",
        "scene": "An empty canal towpath with bare trees and ordinary moored narrowboats. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "snow-melt-geometry",
        "name": "Snow Melt Geometry",
        "scene": "Irregular melting snow across an ordinary empty school playground without markings. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "fresh-curtain-breeze",
        "name": "Fresh Curtain Breeze",
        "scene": "Plain cotton curtain moving beside an open kitchen window on a mild January morning. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "greenhouse-rafters",
        "name": "Greenhouse Rafters",
        "scene": "Practical greenhouse rafters, hanging baskets and real winter condensation. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "library-return-basket",
        "name": "Library Return Basket",
        "scene": "Unlettered books in a plain basket beside a neighborhood library entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-lantern",
        "name": "Neighborhood Lantern",
        "scene": "One ordinary porch lamp lighting a small wet path on New Year's Day evening. Camera: ordinary eye-level night photography under believable practical light, restrained exposure."
      },
      {
        "slug": "first-batch-soup",
        "name": "First Batch Soup",
        "scene": "A simple winter-vegetable soup pot on an ordinary stove, root vegetables nearby. Camera: an off-center three-quarter environmental view with natural real-world perspective."
      },
      {
        "slug": "indoor-garden-start",
        "name": "Indoor Garden Start",
        "scene": "A modest winter greenhouse with seed trays, watering cans and empty aisles. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "blank-year-notebook",
        "name": "Blank Year Notebook",
        "scene": "A blank open notebook, pencil and pressed fern on worn wood. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "beach-pebbles",
        "name": "Beach Pebbles",
        "scene": "Smooth pebbles and washed seaweed at a quiet winter beach edge. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "tea-steam",
        "name": "Tea Steam",
        "scene": "A chipped plain tea mug steaming beside a frosted home window. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "workshop-reopening",
        "name": "Workshop Reopening",
        "scene": "A modest pottery workshop through its open door, clean tools and unfinished bowls. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "first-light-meadow",
        "name": "First Light Meadow",
        "scene": "A frosty community meadow at pale natural dawn with an ordinary fence. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      }
    ]
  },
  {
    "id": "mlk-day",
    "name": "Martin Luther King Jr. Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 1,
      "weekday": 1,
      "occurrence": 3
    },
    "palettes": [
      "marine",
      "ochre",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "MLK Martin Luther King day of service January",
    "designs": [
      {
        "slug": "serve-together",
        "name": "Serve Together",
        "scene": "A community hall table with reusable bags and donated canned food, no readable labels"
      },
      {
        "slug": "shared-library",
        "name": "Shared Library",
        "scene": "A neighborhood little free library filled with well-used books, no readable titles"
      },
      {
        "slug": "helping-hands",
        "name": "Helping Hands",
        "scene": "Clean work gloves and a few hand tools on a park bench"
      },
      {
        "slug": "community-kitchen",
        "name": "Community Kitchen",
        "scene": "Simple soup bowls and bread arranged for a community meal"
      },
      {
        "slug": "open-circle",
        "name": "Open Circle",
        "scene": "A circle of mismatched chairs in a sunlit community room"
      },
      {
        "slug": "growing-hope",
        "name": "Growing Hope",
        "scene": "A community garden bed with young plants and a watering can"
      },
      {
        "slug": "care-packages",
        "name": "Care Packages",
        "scene": "Open cardboard care packages with socks and toiletries without labels"
      },
      {
        "slug": "learning-together",
        "name": "Learning Together",
        "scene": "Stacks of children's books and pencils on a classroom table, no legible titles"
      },
      {
        "slug": "neighborhood-care",
        "name": "Neighborhood Care",
        "scene": "A folded trash picker, gloves and reusable collection sacks at a park entrance"
      },
      {
        "slug": "a-place-for-everyone",
        "name": "A Place for Everyone",
        "scene": "An accessible community center entrance in ordinary winter daylight, no signage"
      },
      {
        "slug": "community-mural-prep",
        "name": "Community Mural Prep",
        "scene": "An empty neighborhood wall with plain primer, paint trays and a safe short ladder for community service. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "winter-care-sorting",
        "name": "Winter Care Sorting",
        "scene": "Clean socks, mittens and unlabelled toiletries sorted into reusable bags. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "accessible-ramp-care",
        "name": "Accessible Ramp Care",
        "scene": "A freshly swept community-center access ramp with a broom beside its handrail. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "repaired-book-spine",
        "name": "Repaired Book Spine",
        "scene": "A repaired clothbound children's book without lettering beside a bookbinding brush. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "food-pantry-ready",
        "name": "Food Pantry Ready",
        "scene": "An ordinary food pantry through its open doorway, plain sacks and unlabelled jars. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "riverbank-cleanup",
        "name": "Riverbank Cleanup",
        "scene": "A quiet riverbank with filled reusable cleanup sacks and a litter picker. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "shared-courtyard-service",
        "name": "Shared Courtyard Service",
        "scene": "A community courtyard with newly planted pots and clean gardening tools. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "bicycle-repair-stand",
        "name": "Bicycle Repair Stand",
        "scene": "An ordinary bicycle in a repair stand beside spare tubes in a community workshop. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "community-hall-lights",
        "name": "Community Hall Lights",
        "scene": "Practical ceiling lamps in an unpretentious hall prepared for a day of service. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "new-native-sapling",
        "name": "New Native Sapling",
        "scene": "A new native sapling and spade beside an ordinary neighborhood path. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-fridge",
        "name": "Community Fridge",
        "scene": "An unbranded shared refrigerator open inside a modest room, plain produce containers. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "school-kit-assembly",
        "name": "School Kit Assembly",
        "scene": "Plain notebooks, pencils and erasers assembled into simple cotton supply pouches. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "fresh-park-bench",
        "name": "Fresh Park Bench",
        "scene": "A repaired wooden park bench beside a small unlabelled wood-finish can. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "mended-backpack",
        "name": "Mended Backpack",
        "scene": "A stitched repair on a plain backpack beside cotton thread and simple needles. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "warming-center-entrance",
        "name": "Warming Center Entrance",
        "scene": "A modest winter warming-center doorway with plain coats and no readable signage. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "community-orchard-care",
        "name": "Community Orchard Care",
        "scene": "Pruned community fruit trees, cut branches and ordinary gardening tools. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "library-donation-landing",
        "name": "Library Donation Landing",
        "scene": "Boxes of unlettered children's books on a modest library stair landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wheelchair-maintenance",
        "name": "Wheelchair Maintenance",
        "scene": "A plain manual wheelchair beside cleaning cloths and hand tools in a repair room. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "new-porch-handrail",
        "name": "New Porch Handrail",
        "scene": "A newly installed simple handrail on an ordinary modest home. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "park-path-clearing",
        "name": "Park Path Clearing",
        "scene": "A broom and gathered leaves beside a recently cleared public path. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-sewing-room",
        "name": "Community Sewing Room",
        "scene": "An empty modest sewing room with ordinary machines and clean clothing for repairs. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "pantry-portions",
        "name": "Pantry Portions",
        "scene": "Plain scoops, lentils and rice portioned into unmarked reusable containers. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "clean-playground-edge",
        "name": "Clean Playground Edge",
        "scene": "A swept playground border with reusable cleanup sacks beside an ordinary fence. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "patched-winter-coat",
        "name": "Patched Winter Coat",
        "scene": "A visible patch in a worn winter coat hanging on a plain wooden peg. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "neighborhood-meal-kitchen",
        "name": "Neighborhood Meal Kitchen",
        "scene": "A practical community kitchen through an open door, soup pots and clean bowls. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "restored-walking-trail",
        "name": "Restored Walking Trail",
        "scene": "A wooded accessible trail with fresh gravel and an ordinary parked wheelbarrow. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "school-garden-renewal",
        "name": "School Garden Renewal",
        "scene": "Repaired school garden beds with plain rain barrels and new compost. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "donation-cart",
        "name": "Donation Cart",
        "scene": "A plain wheeled cart carrying folded blankets along an empty community corridor. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "shelter-repair-rafters",
        "name": "Shelter Repair Rafters",
        "scene": "Fresh timber repairs beneath a modest public picnic shelter. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "community-chalk-supplies",
        "name": "Community Chalk Supplies",
        "scene": "Plain chalk and blank plywood boards beside an empty neighborhood gathering area. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "volunteer-storage-room",
        "name": "Volunteer Storage Room",
        "scene": "Practical community storage with unlabelled tools and clean plain safety vests. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "mending-circle-materials",
        "name": "Mending Circle Materials",
        "scene": "Cotton patches, thread and simple needles loosely arranged on a plain rug. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "new-rain-garden",
        "name": "New Rain Garden",
        "scene": "Fresh native plants and moist soil in a small neighborhood rain garden. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "accessible-door-hardware",
        "name": "Accessible Door Hardware",
        "scene": "Newly fitted accessible door hardware at an ordinary community building. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "book-exchange-shed",
        "name": "Book Exchange Shed",
        "scene": "A small unlettered book-exchange shed open with plain-covered books inside. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "neighbors-garden-rows",
        "name": "Neighbors Garden Rows",
        "scene": "A shared vegetable garden with new compost between beds and a modest handcart. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "hall-coat-collection",
        "name": "Hall Coat Collection",
        "scene": "Clean winter coats hanging along a community hall balcony rail. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "pantry-packing-shelf",
        "name": "Pantry Packing Shelf",
        "scene": "Plain boxes of unlabelled shelf-stable food on an everyday packing shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "repaired-greenhouse-glass",
        "name": "Repaired Greenhouse Glass",
        "scene": "New clear panes in a modest community greenhouse roof with weathered frames. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "service-water-station",
        "name": "Service Water Station",
        "scene": "Plain reusable water bottles beside a simple dispenser in a garden work area. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "shared-computer-lab",
        "name": "Shared Computer Lab",
        "scene": "An empty modest public computer room with dark blank screens and clean desks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "seed-library-refill",
        "name": "Seed Library Refill",
        "scene": "Unlabelled native seed packets and blank cards in a simple wooden drawer. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "crossing-planters",
        "name": "Crossing Planters",
        "scene": "New plain flower planters beside a pedestrian path without roadway lettering. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "restored-chair-joint",
        "name": "Restored Chair Joint",
        "scene": "A repaired wooden chair joint held with ordinary clamps in a community workshop. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "listening-room",
        "name": "Listening Room",
        "scene": "A modest listening room through its doorway, microphone and empty mismatched chairs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "canal-towpath-care",
        "name": "Canal Towpath Care",
        "scene": "A canal towpath with collected reusable litter sacks and ordinary work gloves. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-accessibility",
        "name": "Courtyard Accessibility",
        "scene": "A newly cleared accessible passage through an ordinary community courtyard. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "blanket-folding",
        "name": "Blanket Folding",
        "scene": "Clean blankets stacked on a folding rack beside empty reusable sacks. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "service-welcome-awning",
        "name": "Service Welcome Awning",
        "scene": "A repaired plain awning over a neighborhood service entrance without writing. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "giving-shelf",
        "name": "Giving Shelf",
        "scene": "Unlabelled toiletries and clean towels on a free-supply shelf near an open community door. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "presidents-day",
    "name": "Presidents’ Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 2,
      "weekday": 1,
      "occurrence": 3
    },
    "palettes": [
      "cobalt",
      "slate",
      "ochre"
    ],
    "purpose": "meeting",
    "aliases": "Washington birthday Presidents Day history February",
    "designs": [
      {
        "slug": "history-table",
        "name": "History Table",
        "scene": "A small arrangement of old unlettered books, reading glasses and a desk lamp"
      },
      {
        "slug": "library-afternoon",
        "name": "Library Afternoon",
        "scene": "A neighborhood library history shelf without readable titles"
      },
      {
        "slug": "civic-hall",
        "name": "Civic Hall",
        "scene": "An empty small-town civic meeting room with wooden chairs and daylight"
      },
      {
        "slug": "founding-papers",
        "name": "Founding Papers",
        "scene": "Unmarked aged paper, a simple quill and inkwell on a wooden desk"
      },
      {
        "slug": "museum-visit",
        "name": "Museum Visit",
        "scene": "A quiet historical museum corridor with distant displays, no readable text"
      },
      {
        "slug": "town-square",
        "name": "Town Square",
        "scene": "A traditional American small-town courthouse square in winter"
      },
      {
        "slug": "civic-garden",
        "name": "Civic Garden",
        "scene": "A modest flagpole beside a winter garden outside a town hall"
      },
      {
        "slug": "reading-room",
        "name": "Reading Room",
        "scene": "A wooden reading table with closed books and winter window light"
      },
      {
        "slug": "archive-desk",
        "name": "Archive Desk",
        "scene": "A box of archival folders and cotton handling gloves on a table, no labels"
      },
      {
        "slug": "community-forum",
        "name": "Community Forum",
        "scene": "A lectern and a few rows of chairs in a modest hall, no campaign material"
      },
      {
        "slug": "courthouse-colonnade",
        "name": "Courthouse Colonnade",
        "scene": "Empty stone columns outside a modest American county courthouse in winter without inscriptions. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "archive-folder-repair",
        "name": "Archive Folder Repair",
        "scene": "Plain folders, cotton document tape and a soft brush on an archive work surface. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "town-hall-steps",
        "name": "Town Hall Steps",
        "scene": "Weathered civic stone steps with dry winter leaves and no lettering. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "brass-door-handle",
        "name": "Brass Door Handle",
        "scene": "A worn brass handle on an old civic door with naturally aged timber. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "public-meeting-chamber",
        "name": "Public Meeting Chamber",
        "scene": "An empty small-town council chamber through an open door without readable signs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-civic-square",
        "name": "Winter Civic Square",
        "scene": "A quiet small-town civic square with ordinary winter trees and modest buildings. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "reading-room-windows",
        "name": "Reading Room Windows",
        "scene": "Plain library reading desks beneath tall windows in an ordinary public library. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "printing-press-study",
        "name": "Printing Press Study",
        "scene": "An old hand-operated printing press in a modest workshop, blank paper only. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "civic-clock-tower",
        "name": "Civic Clock Tower",
        "scene": "A modest old civic tower seen upward without visible readable numerals or inscriptions. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "archive-gloves",
        "name": "Archive Gloves",
        "scene": "Cotton gloves on an archive trolley with closed unlettered volumes behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "historical-schoolroom",
        "name": "Historical Schoolroom",
        "scene": "An empty modest old schoolroom with blank slates and ordinary wooden desks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "bookbinding-materials",
        "name": "Bookbinding Materials",
        "scene": "An unlettered cover, linen thread and simple binding tools on worn wood. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "civic-garden-gate",
        "name": "Civic Garden Gate",
        "scene": "A simple iron gate beside bare winter shrubs outside a public building. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "quill-nib",
        "name": "Quill Nib",
        "scene": "A plain quill nib beside dry ink drops and blank cream paper. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "municipal-library",
        "name": "Municipal Library",
        "scene": "A public-library entrance opening onto history shelves without readable titles. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "riverfront-civic-buildings",
        "name": "Riverfront Civic Buildings",
        "scene": "Modest old civic buildings reflected in a slow winter river. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "civic-atrium",
        "name": "Civic Atrium",
        "scene": "A plain old municipal atrium with empty stone floors and worn wooden railings. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-ballot-box",
        "name": "Wooden Ballot Box",
        "scene": "An unlettered historical wooden ballot box beside blank paper, no campaign material. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "library-ceiling-beams",
        "name": "Library Ceiling Beams",
        "scene": "Simple old timber beams inside an ordinary public-history library. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "weathered-civic-lantern",
        "name": "Weathered Civic Lantern",
        "scene": "An old unlit metal lantern beside an ordinary public doorway in winter daylight. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "history-exhibit-room",
        "name": "History Exhibit Room",
        "scene": "An empty modest local-history display of plain objects without readable labels. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "blank-wax-seals",
        "name": "Blank Wax Seals",
        "scene": "Plain wax sealing tools beside blank envelopes and unlettered cream paper. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "museum-courtyard-paving",
        "name": "Museum Courtyard Paving",
        "scene": "Uneven old brick paving and a stone bench in a quiet civic courtyard. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "archive-box-corners",
        "name": "Archive Box Corners",
        "scene": "Worn cloth corners of unlettered archive boxes on practical shelves. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "civic-workshop",
        "name": "Civic Workshop",
        "scene": "A community history workshop through its doorway, blank notebooks and simple chairs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-bandstand",
        "name": "Winter Bandstand",
        "scene": "An empty ordinary bandstand near a small-town civic hall in winter. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "old-town-corner",
        "name": "Old Town Corner",
        "scene": "A modest small-town street corner with ordinary civic buildings and winter trees. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "typesetting-tray",
        "name": "Typesetting Tray",
        "scene": "An old empty wooden type tray beside blank printing blocks without characters. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "civic-bell",
        "name": "Civic Bell",
        "scene": "A plain bronze bell under a modest timber shelter without inscriptions. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "museum-sketch-stool",
        "name": "Museum Sketch Stool",
        "scene": "A plain folding stool and blank sketchpad beside a quiet museum corridor. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "archive-aisle",
        "name": "Archive Aisle",
        "scene": "A practical narrow archive aisle lined with plain unlabelled storage boxes. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "mapmaking-instruments",
        "name": "Mapmaking Instruments",
        "scene": "A brass divider, simple compass and blank map paper on a study surface. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "winter-civic-fountain",
        "name": "Winter Civic Fountain",
        "scene": "A modest public fountain shut down for winter, worn stone and fallen leaves. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "gavel-grain",
        "name": "Gavel Grain",
        "scene": "The natural worn grain of a plain meeting gavel beside blank paper. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "history-reading-alcove",
        "name": "History Reading Alcove",
        "scene": "A quiet library alcove through its doorway, unlettered books and a small lamp. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "brick-municipal-facades",
        "name": "Brick Municipal Facades",
        "scene": "Modest brick public buildings on a quiet winter afternoon without readable signs. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "museum-stairwell",
        "name": "Museum Stairwell",
        "scene": "A simple old museum stairwell with naturally polished worn wooden rails. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "globe-restoration",
        "name": "Globe Restoration",
        "scene": "A plain old globe without readable labels beside conservation brushes. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "civic-skylight",
        "name": "Civic Skylight",
        "scene": "An old frosted skylight above an ordinary municipal entrance hall. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "flag-halyard",
        "name": "Flag Halyard",
        "scene": "A coiled plain halyard at a civic flagpole base with winter garden behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "public-records-counter",
        "name": "Public Records Counter",
        "scene": "An empty public-records room with document trays and closed unlettered ledgers. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "paper-conservation",
        "name": "Paper Conservation",
        "scene": "Cotton weights holding a blank aged sheet beside a soft conservation brush. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "civic-rail-shadows",
        "name": "Civic Rail Shadows",
        "scene": "Natural winter handrail shadows across ordinary worn public-building steps. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "library-card-drawer",
        "name": "Library Card Drawer",
        "scene": "A worn wooden card drawer holding completely blank catalog cards. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "heritage-tool-shed",
        "name": "Heritage Tool Shed",
        "scene": "A modest local-history shed through its open door, plain old tools and shelves. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "modest-city-hall",
        "name": "Modest City Hall",
        "scene": "An ordinary small American city hall beneath a pale winter sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-forum-seating",
        "name": "Community Forum Seating",
        "scene": "Loosely spaced empty chairs in a plain civic forum room. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "brass-reading-lamp",
        "name": "Brass Reading Lamp",
        "scene": "A worn plain brass lamp beside an unlettered clothbound history volume. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "portico-detail",
        "name": "Portico Detail",
        "scene": "Simple weathered timber brackets beneath a modest history-building portico. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "civic-winter-bicycle",
        "name": "Civic Winter Bicycle",
        "scene": "An ordinary bicycle beside a town-library entrance with winter square beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "memorial-day",
    "name": "Memorial Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 5,
      "weekday": 1,
      "occurrence": -1
    },
    "palettes": [
      "slate",
      "marine",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "Memorial Day remembrance honor fallen May",
    "designs": [
      {
        "slug": "quiet-reflection",
        "name": "Quiet Reflection",
        "scene": "A simple remembrance bench with a small bouquet of white flowers in a park"
      },
      {
        "slug": "poppy-garden",
        "name": "Poppy Garden",
        "scene": "Natural red poppies growing unevenly beside a weathered stone path"
      },
      {
        "slug": "wreath-of-remembrance",
        "name": "Wreath of Remembrance",
        "scene": "A modest green remembrance wreath with a narrow red white and blue ribbon on a plain stone wall"
      },
      {
        "slug": "morning-tribute",
        "name": "Morning Tribute",
        "scene": "A small American flag planted beside white daisies in a community memorial garden"
      },
      {
        "slug": "honored-service",
        "name": "Honored Service",
        "scene": "A neatly folded triangular American flag on a wooden table beside white flowers"
      },
      {
        "slug": "gather-in-remembrance",
        "name": "Gather in Remembrance",
        "scene": "Rows of empty folding chairs facing a modest wreath in a green park"
      },
      {
        "slug": "white-roses",
        "name": "White Roses",
        "scene": "A few white roses laid on an uninscribed stone ledge in soft daylight"
      },
      {
        "slug": "peaceful-path",
        "name": "Peaceful Path",
        "scene": "A leafy path leading toward a simple uninscribed community memorial stone"
      },
      {
        "slug": "remembrance-table",
        "name": "Remembrance Table",
        "scene": "A plain white candle, small flower vase and blank guest book on a modest table"
      },
      {
        "slug": "lasting-gratitude",
        "name": "Lasting Gratitude",
        "scene": "A weathered park bench beside irises and a small unobtrusive American flag"
      },
      {
        "slug": "empty-memorial-clearing",
        "name": "Empty Memorial Clearing",
        "scene": "A quiet park clearing with an uninscribed remembrance stone and spring trees. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "white-camellia-offering",
        "name": "White Camellia Offering",
        "scene": "A single white camellia and narrow plain ribbon on an uninscribed stone. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "poppy-seedlings",
        "name": "Poppy Seedlings",
        "scene": "Young red poppies emerging beside a modest remembrance-garden path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "weathered-bronze-edge",
        "name": "Weathered Bronze Edge",
        "scene": "The plain weathered edge of an uninscribed bronze remembrance plaque beside greenery. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "reflection-chapel-door",
        "name": "Reflection Chapel Door",
        "scene": "An empty simple remembrance chapel through its open door without inscriptions. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "flags-across-meadow",
        "name": "Flags Across Meadow",
        "scene": "A restrained distant line of small American flags across a quiet remembrance meadow. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "remembrance-circle",
        "name": "Remembrance Circle",
        "scene": "A modest circular memorial garden with plain stone and natural white flowers. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "empty-ceremony-bench",
        "name": "Empty Ceremony Bench",
        "scene": "A plain empty bench beside a small uninscribed memorial in spring daylight. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "memorial-oak-canopy",
        "name": "Memorial Oak Canopy",
        "scene": "Natural old oak canopy above a quiet modest remembrance garden. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "white-lily-path",
        "name": "White Lily Path",
        "scene": "A single white lily beside a shaded path leading toward an uninscribed stone. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "cemetery-edge",
        "name": "Cemetery Edge",
        "scene": "A respectful distant edge of a modest military cemetery without readable headstones. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "laurel-ribbon",
        "name": "Laurel Ribbon",
        "scene": "Natural laurel sprigs and narrow red white and blue ribbon on plain linen. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "rain-on-memorial-steps",
        "name": "Rain On Memorial Steps",
        "scene": "Fresh rain on plain stone memorial steps without readable inscriptions. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "white-rose-bud",
        "name": "White Rose Bud",
        "scene": "A single white rosebud on a weathered stone ledge. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "remembrance-gate",
        "name": "Remembrance Gate",
        "scene": "An ordinary open garden gate leading into a quiet remembrance grove. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "morning-half-staff",
        "name": "Morning Half Staff",
        "scene": "A modest American flag at half-staff over an ordinary quiet community park. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-tribute",
        "name": "Courtyard Tribute",
        "scene": "A small uninscribed stone and restrained white flower arrangement in a civic courtyard. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "candle-shelter",
        "name": "Candle Shelter",
        "scene": "One plain unlit white candle in an ordinary sheltered remembrance alcove. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "wreath-and-sky",
        "name": "Wreath And Sky",
        "scene": "A modest green wreath beneath a plain timber shelter with spring sky behind. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "stone-basin-petals",
        "name": "Stone Basin Petals",
        "scene": "Fallen white petals beside a simple empty stone garden basin. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "riverside-tribute",
        "name": "Riverside Tribute",
        "scene": "A plain remembrance bench overlooking an ordinary calm river. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "rosemary-bundle",
        "name": "Rosemary Bundle",
        "scene": "Rosemary tied with cotton string beside a completely blank remembrance card. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "grass-and-ribbon",
        "name": "Grass And Ribbon",
        "scene": "Narrow plain patriotic ribbon resting beside grass on a remembrance path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "iris-petal",
        "name": "Iris Petal",
        "scene": "A white iris with naturally imperfect petals beside an uninscribed stone wall. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "civic-hall-silence",
        "name": "Civic Hall Silence",
        "scene": "An empty modest civic hall prepared for a quiet remembrance gathering. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "memorial-avenue",
        "name": "Memorial Avenue",
        "scene": "A tree-lined park avenue with a small distant uninscribed memorial. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "white-flower-beds",
        "name": "White Flower Beds",
        "scene": "Loosely planted white flowers surrounding an unlettered garden stone. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "folded-flag-case",
        "name": "Folded Flag Case",
        "scene": "A correctly triangular folded American flag in a plain case beside white flowers. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "spring-elm-shade",
        "name": "Spring Elm Shade",
        "scene": "An ordinary spring elm branch above a modest remembrance shelter. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "unopened-guest-book",
        "name": "Unopened Guest Book",
        "scene": "A closed unlettered remembrance book beside plain white carnations. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "reflection-pond",
        "name": "Reflection Pond",
        "scene": "A quiet woodland pond beside a modest remembrance garden in natural daylight. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "camellia-petals",
        "name": "Camellia Petals",
        "scene": "Fallen white camellia petals beside a smooth uninscribed grey river stone. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "swept-tribute-paving",
        "name": "Swept Tribute Paving",
        "scene": "A broom beside freshly swept memorial paving with a small white flower vase. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "plain-ribbon-knot",
        "name": "Plain Ribbon Knot",
        "scene": "A narrow red white and blue ribbon knot on a modest natural wreath. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "stone-alcove",
        "name": "Stone Alcove",
        "scene": "A quiet stone remembrance alcove through its plain archway without lettering. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "community-flag-walk",
        "name": "Community Flag Walk",
        "scene": "A modest line of small American flags along a residential remembrance walk. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "empty-garden-benches",
        "name": "Empty Garden Benches",
        "scene": "A few plain empty benches around a small uninscribed garden monument. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "tribute-flower-care",
        "name": "Tribute Flower Care",
        "scene": "A plain watering can beside newly planted white geraniums in a memorial garden. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "dappled-memorial-shade",
        "name": "Dappled Memorial Shade",
        "scene": "Natural spring leaves above a plain uninscribed garden obelisk. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "magnolia-on-stone",
        "name": "Magnolia On Stone",
        "scene": "One white magnolia blossom on a plain sill with quiet garden beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "quiet-honor-hall",
        "name": "Quiet Honor Hall",
        "scene": "An empty modest community honor hall with one unobtrusive American flag. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "cotton-and-laurel",
        "name": "Cotton And Laurel",
        "scene": "Folded plain white cotton beside a laurel branch and unmarked candle holder. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "brick-reflection-walk",
        "name": "Brick Reflection Walk",
        "scene": "Uneven brick paving past ordinary white flowering shrubs in a remembrance garden. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "rain-on-flag-glass",
        "name": "Rain On Flag Glass",
        "scene": "Rain droplets on the plain glass of a modest folded-flag case. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "remembrance-greenhouse",
        "name": "Remembrance Greenhouse",
        "scene": "A small practical greenhouse growing white tribute flowers through its open door. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "memorial-shore",
        "name": "Memorial Shore",
        "scene": "A plain remembrance bench beside an ordinary lake beneath an overcast May sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-laurel-pots",
        "name": "Courtyard Laurel Pots",
        "scene": "Modest laurel pots flanking an uninscribed entrance in a quiet civic courtyard. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "single-carnation",
        "name": "Single Carnation",
        "scene": "One white carnation in a plain bud vase beside an empty chair. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "shelter-rafters",
        "name": "Shelter Rafters",
        "scene": "Simple timber rafters of a modest remembrance shelter with one natural wreath. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "garden-tool-pause",
        "name": "Garden Tool Pause",
        "scene": "Clean pruning shears and white flower cuttings beside a memorial-garden path. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "juneteenth",
    "name": "Juneteenth",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 6,
      "day": 19,
      "duration": 1
    },
    "palettes": [
      "cherry",
      "ochre",
      "evergreen"
    ],
    "purpose": "celebration",
    "aliases": "Juneteenth freedom emancipation June nineteenth",
    "designs": [
      {
        "slug": "community-table",
        "name": "Community Table",
        "scene": "A neighborhood picnic table with red drinks, summer fruit and simple place settings"
      },
      {
        "slug": "freedom-garden",
        "name": "Freedom Garden",
        "scene": "Red hibiscus flowers in a community garden in June daylight"
      },
      {
        "slug": "front-porch-gathering",
        "name": "Front Porch Gathering",
        "scene": "An ordinary welcoming porch with red cushions and a pitcher of iced tea"
      },
      {
        "slug": "neighborhood-picnic",
        "name": "Neighborhood Picnic",
        "scene": "Picnic blankets and baskets under a mature shade tree"
      },
      {
        "slug": "summer-reading",
        "name": "Summer Reading",
        "scene": "Books with unmarked covers and a pitcher of red hibiscus tea on a library table"
      },
      {
        "slug": "shared-recipes",
        "name": "Shared Recipes",
        "scene": "A homemade summer meal with cornbread and greens on a wooden kitchen table"
      },
      {
        "slug": "music-in-the-park",
        "name": "Music in the Park",
        "scene": "A modest outdoor community music stage with an acoustic guitar and empty chairs"
      },
      {
        "slug": "red-velvet",
        "name": "Red Velvet",
        "scene": "A homemade red velvet cake with uneven frosting on a simple serving plate"
      },
      {
        "slug": "community-market",
        "name": "Community Market",
        "scene": "A small outdoor neighborhood market with crafts and summer produce, no labels"
      },
      {
        "slug": "evening-together",
        "name": "Evening Together",
        "scene": "A backyard table with red flowers, watermelon and glasses of iced tea"
      },
      {
        "slug": "neighborhood-pavilion",
        "name": "Neighborhood Pavilion",
        "scene": "An empty neighborhood pavilion prepared with modest red cloth accents for a Juneteenth gathering. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "hibiscus-tea-leaves",
        "name": "Hibiscus Tea Leaves",
        "scene": "Dried hibiscus petals, a plain strainer and fresh strawberries on natural cotton. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "community-garden-rows",
        "name": "Community Garden Rows",
        "scene": "Flourishing collard greens beside an ordinary shared community-garden path in June. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "quilt-stitch",
        "name": "Quilt Stitch",
        "scene": "Hand-stitched red cotton patchwork hanging over an ordinary porch rail. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "open-history-library",
        "name": "Open History Library",
        "scene": "A modest community reading room through its door, unlettered books and simple red flowers. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "summer-neighborhood-street",
        "name": "Summer Neighborhood Street",
        "scene": "An ordinary tree-shaded neighborhood street with restrained red porch ribbons. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-courtyard",
        "name": "Community Courtyard",
        "scene": "A shared courtyard with loosely spaced picnic blankets seen from a real upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "acoustic-music-corner",
        "name": "Acoustic Music Corner",
        "scene": "Unbranded acoustic bass and guitar beside plain community-room chairs. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "red-hibiscus-branch",
        "name": "Red Hibiscus Branch",
        "scene": "Natural red hibiscus against summer sky beside an ordinary community building. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "watermelon-stand",
        "name": "Watermelon Stand",
        "scene": "A modest crate of fresh watermelon beside a community-garden entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "oral-history-booth",
        "name": "Oral History Booth",
        "scene": "An empty modest recording corner with plain microphone, chair and blank notebooks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "strawberry-preserves",
        "name": "Strawberry Preserves",
        "scene": "Fresh strawberries, an unlabelled preserve jar and wooden spoon on plain red cotton. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "sidewalk-chalk-colors",
        "name": "Sidewalk Chalk Colors",
        "scene": "Plain red and yellow chalk sticks beside blank sidewalk paving near a gathering area. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "cornbread-crust",
        "name": "Cornbread Crust",
        "scene": "Homemade skillet cornbread with uneven crust beside an ordinary cotton cloth. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-kitchen-door",
        "name": "Community Kitchen Door",
        "scene": "A practical community kitchen through its back door, summer produce and clean cookware. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "park-music-shelter",
        "name": "Park Music Shelter",
        "scene": "A modest empty music shelter beneath mature summer trees without lettering. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "porch-potluck-setup",
        "name": "Porch Potluck Setup",
        "scene": "A modest residential porch with plain dishes and folded red napkins. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "freedom-reading-shelf",
        "name": "Freedom Reading Shelf",
        "scene": "Unlettered community-history books beside a plain vase of red flowers. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "summer-ribbon-beams",
        "name": "Summer Ribbon Beams",
        "scene": "Plain red fabric ribbons beneath a modest community veranda roof. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "okra-harvest-basket",
        "name": "Okra Harvest Basket",
        "scene": "Fresh okra in a basket at the edge of a productive community garden. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-craft-market",
        "name": "Neighborhood Craft Market",
        "scene": "An empty modest neighborhood craft stall with handmade pottery and plain cloth wrapping. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "red-bean-ingredients",
        "name": "Red Bean Ingredients",
        "scene": "Red beans, rice and chopped summer vegetables in separate plain bowls. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "garden-footpath-blooms",
        "name": "Garden Footpath Blooms",
        "scene": "Red salvia and native flowers growing irregularly beside a community path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "handmade-drum-skin",
        "name": "Handmade Drum Skin",
        "scene": "A plain unbranded hand drum resting on an ordinary community-room chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bakery-window",
        "name": "Bakery Window",
        "scene": "A neighborhood bakery through an open service window, homemade peach cobbler and no lettering. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "lakeside-gathering-space",
        "name": "Lakeside Gathering Space",
        "scene": "An empty ordinary lakeside picnic clearing prepared for a modest Juneteenth gathering. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-art-yard",
        "name": "Community Art Yard",
        "scene": "A practical art courtyard with plain red fabric drying and clean paint supplies. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "heirloom-seed-shelf",
        "name": "Heirloom Seed Shelf",
        "scene": "Unlabelled bean-seed jars on an ordinary community seed-library shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "pecan-shade",
        "name": "Pecan Shade",
        "scene": "A mature pecan canopy above an empty community picnic space. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "red-velvet-slice",
        "name": "Red Velvet Slice",
        "scene": "A homemade red velvet slice on a plain plate with lived-in kitchen beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "basketball-court-break",
        "name": "Basketball Court Break",
        "scene": "An empty neighborhood court with water coolers and a small plain red picnic blanket. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "recipe-blank-cards",
        "name": "Recipe Blank Cards",
        "scene": "Blank recipe cards beside greens, a wooden spoon and plain red tea towel. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "porch-flower-pots",
        "name": "Porch Flower Pots",
        "scene": "Modest red geranium pots along an ordinary neighborhood porch step. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "peach-skin",
        "name": "Peach Skin",
        "scene": "Fresh summer peaches in a rough crate beside an ordinary homemade cobbler dish. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-dance-room",
        "name": "Community Dance Room",
        "scene": "An empty community dance room with plain wood floor and understated red flowers. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "shared-orchard-summer",
        "name": "Shared Orchard Summer",
        "scene": "A community orchard with June greenery and a modest produce-sharing shelter. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "garden-tables-below",
        "name": "Garden Tables Below",
        "scene": "A small garden-meal setup with everyday chairs seen from a library window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-chess-break",
        "name": "Wooden Chess Break",
        "scene": "A well-used chess set beside strawberry water on a shaded ordinary park bench. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "redbud-leaves",
        "name": "Redbud Leaves",
        "scene": "Green redbud leaves above an ordinary community-center walkway in June. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "garden-harvest-tote",
        "name": "Garden Harvest Tote",
        "scene": "A canvas tote filled with summer greens beside a shared garden gate. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "family-sewing-room",
        "name": "Family Sewing Room",
        "scene": "An empty ordinary sewing room with a red patchwork quilt and practical fabric scraps. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "hibiscus-ice",
        "name": "Hibiscus Ice",
        "scene": "Homemade hibiscus-tea ice cubes beside plain tumblers and fresh mint. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "summer-picnic-blanket",
        "name": "Summer Picnic Blanket",
        "scene": "A modest red cotton picnic blanket on uneven grass beneath an ordinary shade tree. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pottery-sharing-bowl",
        "name": "Pottery Sharing Bowl",
        "scene": "An uneven handmade red-glazed bowl beside cherries in a modest community studio. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "welcoming-front-hall",
        "name": "Welcoming Front Hall",
        "scene": "A modest home hall open to summer daylight, red cushions and fresh flowers. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "juneteenth-riverwalk",
        "name": "Juneteenth Riverwalk",
        "scene": "A quiet neighborhood riverwalk with small picnic shelter and restrained red ribbons. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "reading-garden",
        "name": "Reading Garden",
        "scene": "A modest outdoor reading area with unlettered books and plain chairs. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "sweet-potato-baking",
        "name": "Sweet Potato Baking",
        "scene": "Homemade sweet-potato hand pies cooling on an ordinary practical kitchen rack. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "music-shelter-beams",
        "name": "Music Shelter Beams",
        "scene": "Plain timber beams above an acoustic guitar in a modest community shelter. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "neighborhood-bread-basket",
        "name": "Neighborhood Bread Basket",
        "scene": "Homemade rolls at a simple community sharing shelf with June greenery beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "july-fourth",
    "name": "July Fourth",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 7,
      "day": 4,
      "duration": 1
    },
    "palettes": [
      "cobalt",
      "cherry",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "Independence Day 4th July Fourth fourth of July fireworks",
    "designs": [
      {
        "slug": "porch-picnic",
        "name": "Porch Picnic",
        "scene": "A modest porch picnic with faded red white and blue bunting and a pitcher of lemonade"
      },
      {
        "slug": "lakeside-afternoon",
        "name": "Lakeside Afternoon",
        "scene": "A picnic blanket and simple wicker basket beside an ordinary American lake"
      },
      {
        "slug": "backyard-barbecue",
        "name": "Backyard Barbecue",
        "scene": "A backyard charcoal grill and outdoor table with corn on the cob and plain plates"
      },
      {
        "slug": "main-street",
        "name": "Main Street",
        "scene": "Small American flags on a quiet small-town main street in summer daylight"
      },
      {
        "slug": "berry-bowl",
        "name": "Berry Bowl",
        "scene": "Strawberries blueberries and a white ceramic serving bowl on a picnic table"
      },
      {
        "slug": "fireworks-by-the-lake",
        "name": "Fireworks by the Lake",
        "scene": "A few believable distant fireworks above a lake after dusk, restrained exposure"
      },
      {
        "slug": "block-party",
        "name": "Block Party",
        "scene": "Folding tables and chairs being set out on a residential street with understated bunting"
      },
      {
        "slug": "summer-porch",
        "name": "Summer Porch",
        "scene": "Weathered porch chairs and a small American flag beside potted flowers"
      },
      {
        "slug": "picnic-basket",
        "name": "Picnic Basket",
        "scene": "A close view of a picnic basket with a blue cloth, red apples and lemonade"
      },
      {
        "slug": "riverside-gathering",
        "name": "Riverside Gathering",
        "scene": "A riverside picnic shelter with red checked tablecloths and small flags"
      },
      {
        "slug": "riverside-bandstand",
        "name": "Riverside Bandstand",
        "scene": "An empty ordinary riverside bandstand with restrained red white and blue ribbons. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "berry-ice-pops",
        "name": "Berry Ice Pops",
        "scene": "Homemade strawberry-blueberry ice pops on parchment beside a plain white tray. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "parade-street-quiet",
        "name": "Parade Street Quiet",
        "scene": "A quiet small-town street before a neighborhood parade, modest porch flags. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pinwheel-paper",
        "name": "Pinwheel Paper",
        "scene": "A handmade patriotic paper pinwheel with imperfect folds beside a real garden. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-cookout-hall",
        "name": "Community Cookout Hall",
        "scene": "A modest community hall through its rear door, plain cookout supplies and no people. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "lake-firework-reflections",
        "name": "Lake Firework Reflections",
        "scene": "A few believable distant fireworks reflected in an ordinary lake after dusk. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "block-picnic-setup",
        "name": "Block Picnic Setup",
        "scene": "A small residential block picnic with ordinary folding chairs seen from an upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "rowboat-rest",
        "name": "Rowboat Rest",
        "scene": "An ordinary rowboat tied beside a dock with one small unobtrusive American flag. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "porch-bunting",
        "name": "Porch Bunting",
        "scene": "Faded red white and blue bunting beneath a weathered porch roof. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "watermelon-cooler",
        "name": "Watermelon Cooler",
        "scene": "A plain metal cooler with watermelon slices beside a modest backyard picnic area. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "town-park-gazebo",
        "name": "Town Park Gazebo",
        "scene": "An empty modest gazebo with plain patriotic ribbons and ordinary summer trees. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "cherry-pie-stars",
        "name": "Cherry Pie Stars",
        "scene": "A homemade cherry pie with simple pastry stars and uneven crust on worn wood. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "lawn-ring-toss",
        "name": "Lawn Ring Toss",
        "scene": "A plain wooden ring-toss game on uneven grass beside ordinary folding chairs. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "lemonade-condensation",
        "name": "Lemonade Condensation",
        "scene": "A plain glass lemonade pitcher with real condensation beside faded blue cotton. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "lakeside-cabin-door",
        "name": "Lakeside Cabin Door",
        "scene": "A modest cabin doorway opening toward a simple picnic area and restrained flags. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "harbor-sailboats",
        "name": "Harbor Sailboats",
        "scene": "Ordinary small sailboats in a working summer harbor with a few modest American flags. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "pool-picnic-deck",
        "name": "Pool Picnic Deck",
        "scene": "An empty modest community-pool picnic area with plain red and blue towels. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-croquet-set",
        "name": "Wooden Croquet Set",
        "scene": "A worn unbranded croquet set leaning against an ordinary backyard fence. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "summer-flagpole",
        "name": "Summer Flagpole",
        "scene": "A modest American flag on a neighborhood flagpole against pale summer sky. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "berry-shortcake-serving",
        "name": "Berry Shortcake Serving",
        "scene": "Homemade berry shortcake beside plain white plates with an everyday picnic behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "backyard-grill-corner",
        "name": "Backyard Grill Corner",
        "scene": "A modest backyard charcoal grill beside fresh corn and plain blue dishes. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "paper-fan-craft",
        "name": "Paper Fan Craft",
        "scene": "Unlettered patriotic paper fans, cotton twine and simple scissors on a craft mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "basket-in-grass",
        "name": "Basket In Grass",
        "scene": "A plain wicker picnic basket with red cotton cloth on ordinary lakeside grass. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "corn-silk",
        "name": "Corn Silk",
        "scene": "Fresh pale corn silk and husks beside an ordinary metal grill tray. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "open-barn-picnic",
        "name": "Open Barn Picnic",
        "scene": "A modest open-sided barn prepared for a simple July Fourth community picnic. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "town-water-tower",
        "name": "Town Water Tower",
        "scene": "An ordinary small-town water tower beyond a quiet street with flags, no readable lettering. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "garden-potluck-corner",
        "name": "Garden Potluck Corner",
        "scene": "A small backyard potluck with mismatched plain dishes seen from a real upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "fishing-dock-chairs",
        "name": "Fishing Dock Chairs",
        "scene": "Two ordinary folding chairs and a plain cooler on a modest lake dock. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "porch-string-lights",
        "name": "Porch String Lights",
        "scene": "One restrained strand of warm bulbs beneath an ordinary porch roof at blue hour. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "tomato-salad-bowl",
        "name": "Tomato Salad Bowl",
        "scene": "Homemade tomato salad in a plain bowl with an everyday backyard garden beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "beach-picnic-shelter",
        "name": "Beach Picnic Shelter",
        "scene": "An empty modest beach shelter with plain red and blue cotton napkins. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "ice-cream-sandwiches",
        "name": "Ice Cream Sandwiches",
        "scene": "Homemade ice-cream sandwiches and blueberries on plain unlettered parchment. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "sidewalk-flags",
        "name": "Sidewalk Flags",
        "scene": "A modest line of small American flags beside an ordinary neighborhood sidewalk. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "red-cotton-stitching",
        "name": "Red Cotton Stitching",
        "scene": "Visible stitching in faded red cotton bunting on a weathered porch rail. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "firehouse-picnic-bay",
        "name": "Firehouse Picnic Bay",
        "scene": "An empty modest firehouse bay prepared for a community picnic without readable branding. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "river-bridge-evening",
        "name": "River Bridge Evening",
        "scene": "A small ordinary river bridge with modest flags and restrained evening reflections. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "cabin-yard-games",
        "name": "Cabin Yard Games",
        "scene": "A modest cabin yard with plain horseshoe game and picnic blanket viewed from a loft. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "garden-hose-break",
        "name": "Garden Hose Break",
        "scene": "An ordinary coiled garden hose beside a plain lemonade jug on a shaded step. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "maple-picnic-canopy",
        "name": "Maple Picnic Canopy",
        "scene": "Natural summer maple leaves above a modest neighborhood picnic space. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "peach-cobbler-spoon",
        "name": "Peach Cobbler Spoon",
        "scene": "A plain serving spoon beside homemade peach cobbler with summer porch beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "distant-celebration-light",
        "name": "Distant Celebration Light",
        "scene": "A few restrained distant fireworks above a quiet neighborhood garden, realistic night exposure. Camera: ordinary eye-level night photography under believable practical light, restrained exposure."
      },
      {
        "slug": "fabric-bunting-mending",
        "name": "Fabric Bunting Mending",
        "scene": "Faded patriotic cloth, cotton thread and sewing scissors on an ordinary floor mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "empty-canoe-landing",
        "name": "Empty Canoe Landing",
        "scene": "An ordinary canoe on a muddy lake landing beside a plain blue dry bag. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pickle-jar",
        "name": "Pickle Jar",
        "scene": "An unlabelled homemade pickle jar beside fresh dill and a rumpled red tea towel. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-garden-feast",
        "name": "Community Garden Feast",
        "scene": "A modest garden entrance opening toward ordinary picnic benches and plain red cloths. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "field-fireworks",
        "name": "Field Fireworks",
        "scene": "A few restrained distant fireworks over an ordinary community field, no fantasy sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "neighborhood-porch-view",
        "name": "Neighborhood Porch View",
        "scene": "Plain porch chairs and a small flag viewed from an ordinary upper balcony. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "hand-crank-ice-cream",
        "name": "Hand Crank Ice Cream",
        "scene": "A plain hand-crank ice-cream maker beside a simple outdoor ice bucket. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "american-elm-avenue",
        "name": "American Elm Avenue",
        "scene": "Ordinary elms over a quiet small-town avenue with modest patriotic ribbons. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "summer-berry-picking",
        "name": "Summer Berry Picking",
        "scene": "A basket of strawberries and blueberries at an ordinary garden gate with picnic preparations beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "labor-day",
    "name": "Labor Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 9,
      "weekday": 1,
      "occurrence": 1
    },
    "palettes": [
      "terracotta",
      "marine",
      "olive"
    ],
    "purpose": "celebration",
    "aliases": "Labor Day workers September long weekend",
    "designs": [
      {
        "slug": "community-picnic",
        "name": "Community Picnic",
        "scene": "A modest late-summer community picnic table in the shade"
      },
      {
        "slug": "workshop-break",
        "name": "Workshop Break",
        "scene": "Worn work gloves and a plain lunch box on a workshop bench"
      },
      {
        "slug": "end-of-summer",
        "name": "End of Summer",
        "scene": "Empty lawn chairs beside a garden with late-summer flowers"
      },
      {
        "slug": "neighborhood-cookout",
        "name": "Neighborhood Cookout",
        "scene": "A backyard table with grilled vegetables and simple plates"
      },
      {
        "slug": "lakeside-weekend",
        "name": "Lakeside Weekend",
        "scene": "A small canoe resting beside a calm late-summer lake"
      },
      {
        "slug": "shared-lunch",
        "name": "Shared Lunch",
        "scene": "Lunch containers and mugs on a break-room table without brand labels"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A table under a backyard tree with pears and simple linen napkins"
      },
      {
        "slug": "local-makers",
        "name": "Local Makers",
        "scene": "A modest craft market table with handmade bowls and baskets"
      },
      {
        "slug": "trail-day",
        "name": "Trail Day",
        "scene": "A quiet wooded trailhead with a backpack and sturdy walking shoes"
      },
      {
        "slug": "front-porch-rest",
        "name": "Front Porch Rest",
        "scene": "A simple porch swing with a folded cotton blanket in afternoon shade"
      },
      {
        "slug": "empty-makers-yard",
        "name": "Empty Makers Yard",
        "scene": "A modest shared makers courtyard with ordinary handmade furniture and practical benches. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "cobbler-repair-kit",
        "name": "Cobbler Repair Kit",
        "scene": "Leather offcuts, worn shoe-repair tools and a repaired work boot on a workshop mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "canal-towpath-rest",
        "name": "Canal Towpath Rest",
        "scene": "A canvas lunch bag beside a quiet late-summer canal towpath. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pottery-impressions",
        "name": "Pottery Impressions",
        "scene": "Fresh finger impressions in an unfinished clay bowl on a practical shelf, no hands. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "workshop-open-door",
        "name": "Workshop Open Door",
        "scene": "An empty community workshop through its doorway, useful tools on plain shelves. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "orchard-packing-shed",
        "name": "Orchard Packing Shed",
        "scene": "A modest late-summer packing shed with plain empty fruit crates. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "shared-garden-harvest",
        "name": "Shared Garden Harvest",
        "scene": "An ordinary community garden after harvest with plain produce crates. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "carpentry-bench",
        "name": "Carpentry Bench",
        "scene": "A modest workbench with a partly repaired chair and ordinary hand tools. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "workshop-rooflight",
        "name": "Workshop Rooflight",
        "scene": "A plain workshop rooflight above practical worn timber rafters. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "resting-tool-belt",
        "name": "Resting Tool Belt",
        "scene": "A worn tool belt on a low wall with a quiet ordinary neighborhood beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "pool-closing-season",
        "name": "Pool Closing Season",
        "scene": "An empty modest community-pool picnic area with folded chairs at summer's end. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "weaver-loom-details",
        "name": "Weaver Loom Details",
        "scene": "A plain small loom with half-woven natural cotton and loose yarn. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "work-gloves-on-dock",
        "name": "Work Gloves On Dock",
        "scene": "Worn work gloves on a simple dock plank beside an ordinary lake. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "seam-repair",
        "name": "Seam Repair",
        "scene": "A repaired seam in a plain work apron hanging by an ordinary laundry sink. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "neighborhood-repair-cafe",
        "name": "Neighborhood Repair Cafe",
        "scene": "An empty repair cafe through its doorway, lamp and simple tools awaiting repair. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "farm-market-break",
        "name": "Farm Market Break",
        "scene": "An empty modest roadside stand with plain late-summer vegetable crates and no signs. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-holiday-supper",
        "name": "Courtyard Holiday Supper",
        "scene": "A shared residential courtyard with an ordinary picnic setup beneath late-summer trees. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "metalworker-apron",
        "name": "Metalworker Apron",
        "scene": "A worn plain leather apron beside a modest quiet metalworking bench, no sparks. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "work-shirt-laundry",
        "name": "Work Shirt Laundry",
        "scene": "Clean plain cotton work shirts drying on an ordinary garden clothesline. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "homemade-lunchbox",
        "name": "Homemade Lunchbox",
        "scene": "A plain lunch tin with sandwiches and a pear beside a workshop doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-tool-library",
        "name": "Neighborhood Tool Library",
        "scene": "A modest unlettered tool-sharing shed with practical ordinary hand tools. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "basket-making",
        "name": "Basket Making",
        "scene": "A partly woven willow basket, loose reeds and plain pegs on a work mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "trailhead-boots",
        "name": "Trailhead Boots",
        "scene": "Ordinary walking boots and a plain daypack beside a late-summer trailhead. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "sawdust-curl",
        "name": "Sawdust Curl",
        "scene": "Natural curled shavings beside a plain hand plane on a worn bench. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "pottery-kiln-room",
        "name": "Pottery Kiln Room",
        "scene": "An empty practical kiln room through its doorway, handmade bowls on simple shelves. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "lakeside-picnic-end",
        "name": "Lakeside Picnic End",
        "scene": "Empty lawn chairs beside a modest lake picnic shelter in late-summer daylight. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "cooperative-apron-laundry",
        "name": "Cooperative Apron Laundry",
        "scene": "Plain aprons drying across a modest workshop courtyard viewed from an upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "florist-bucket",
        "name": "Florist Bucket",
        "scene": "An ordinary galvanized dahlia bucket beside practical pruning shears. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "restored-porch-beams",
        "name": "Restored Porch Beams",
        "scene": "Plain repaired timber porch beams above an ordinary modest home. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "tomato-harvest-tote",
        "name": "Tomato Harvest Tote",
        "scene": "A canvas tote of late-summer tomatoes beside a quiet allotment gate. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "clean-community-kitchen",
        "name": "Clean Community Kitchen",
        "scene": "A practical community kitchen after lunch, plain bowls drying on ordinary racks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "sewing-machine-care",
        "name": "Sewing Machine Care",
        "scene": "An unbranded sewing machine beside a neatly repaired cotton work shirt. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "camp-chair-shade",
        "name": "Camp Chair Shade",
        "scene": "A plain folding chair under a late-summer tree beside an unbranded thermos. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "handmade-mug",
        "name": "Handmade Mug",
        "scene": "An unfinished handmade clay mug without any lettering on a rough studio shelf. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bakery-rest-door",
        "name": "Bakery Rest Door",
        "scene": "A neighborhood bakery through its back door, plain baking trays cooling. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-working-harbor",
        "name": "Quiet Working Harbor",
        "scene": "An ordinary modest harbor with moored boats and empty late-summer docks. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "garden-hammock",
        "name": "Garden Hammock",
        "scene": "A simple unoccupied cotton hammock in an ordinary backyard seen from an upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "pannier-repair",
        "name": "Pannier Repair",
        "scene": "A repaired canvas bicycle pannier beside an ordinary neighborhood bicycle. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "late-summer-sunflower",
        "name": "Late Summer Sunflower",
        "scene": "A naturally drooping sunflower seed head above a weathered garden fence. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "break-room-mug",
        "name": "Break Room Mug",
        "scene": "A plain mug on a worn sill with an empty practical workshop behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "rural-picnic-pavilion",
        "name": "Rural Picnic Pavilion",
        "scene": "An empty modest rural pavilion with ordinary mismatched benches and no banners. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "leather-patch-work",
        "name": "Leather Patch Work",
        "scene": "Canvas patches, leather strips and strong cotton thread on a worn sewing mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "harvest-crate-rest",
        "name": "Harvest Crate Rest",
        "scene": "A weathered crate of squash beside an ordinary late-summer garden path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "paintbrush-cleaning",
        "name": "Paintbrush Cleaning",
        "scene": "Clean worn paintbrushes drying over a plain utility sink. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-boathouse",
        "name": "Community Boathouse",
        "scene": "An empty modest boathouse through its door with ordinary paddles on plain racks. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "late-summer-hay-meadow",
        "name": "Late Summer Hay Meadow",
        "scene": "A quiet cut hay meadow and modest barn beneath a pale ordinary sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "shared-roof-garden",
        "name": "Shared Roof Garden",
        "scene": "A modest apartment roof garden with ordinary chairs and late-summer planters. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "lunch-break-stools",
        "name": "Lunch Break Stools",
        "scene": "Mismatched workshop stools beside a plain coffee flask on a practical counter. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "quiet-harbor-rigging",
        "name": "Quiet Harbor Rigging",
        "scene": "Ordinary stationary harbor-crane rigging against pale sky, no people. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "mending-basket-rest",
        "name": "Mending Basket Rest",
        "scene": "A plain mending basket beside an open garden door with a quiet porch beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "columbus-day",
    "name": "Columbus Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 10,
      "weekday": 1,
      "occurrence": 2
    },
    "palettes": [
      "marine",
      "cocoa",
      "slate"
    ],
    "purpose": "meeting",
    "aliases": "Columbus Day October maritime history",
    "designs": [
      {
        "slug": "maritime-museum",
        "name": "Maritime Museum",
        "scene": "A small wooden sailing ship model on a maritime museum table"
      },
      {
        "slug": "harbor-history",
        "name": "Harbor History",
        "scene": "An old working harbor with weathered wooden docks under an overcast sky"
      },
      {
        "slug": "nautical-study",
        "name": "Nautical Study",
        "scene": "An unmarked compass, plain paper and rope on a wooden study table"
      },
      {
        "slug": "sailcloth",
        "name": "Sailcloth",
        "scene": "Folded natural sailcloth and weathered marine rope in soft light"
      },
      {
        "slug": "history-workshop",
        "name": "History Workshop",
        "scene": "A classroom table with unlabelled historical books and blank paper"
      },
      {
        "slug": "coastal-archive",
        "name": "Coastal Archive",
        "scene": "A quiet coastal archive room with closed document boxes without labels"
      },
      {
        "slug": "harbor-walk",
        "name": "Harbor Walk",
        "scene": "An ordinary waterfront path with small sailing boats in the distance"
      },
      {
        "slug": "museum-courtyard",
        "name": "Museum Courtyard",
        "scene": "A simple brick museum courtyard with wooden benches"
      },
      {
        "slug": "navigation-desk",
        "name": "Navigation Desk",
        "scene": "A traditional brass compass and closed journal beside a window"
      },
      {
        "slug": "community-discussion",
        "name": "Community Discussion",
        "scene": "A circle of chairs and a few plain books in a local history room"
      },
      {
        "slug": "boatbuilding-shed",
        "name": "Boatbuilding Shed",
        "scene": "An empty modest boatbuilding shed with unfinished wooden hull and ordinary hand tools. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "blank-navigation-chart",
        "name": "Blank Navigation Chart",
        "scene": "Unmarked cream chart paper beside a plain compass, dividers and marine rope. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "harbor-steps",
        "name": "Harbor Steps",
        "scene": "Weathered harbor steps descending to ordinary still water with natural algae. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "sail-stitch",
        "name": "Sail Stitch",
        "scene": "Visible repair stitching in natural sailcloth beside worn cotton thread. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "maritime-archive-door",
        "name": "Maritime Archive Door",
        "scene": "A modest maritime archive through its doorway, plain unlabelled folders and boxes. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "working-coastal-harbor",
        "name": "Working Coastal Harbor",
        "scene": "An ordinary coastal harbor with modest fishing boats beneath overcast October sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "small-dry-dock",
        "name": "Small Dry Dock",
        "scene": "A plain boat in a modest dry dock seen from a nearby upper walkway. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-pulley",
        "name": "Wooden Pulley",
        "scene": "An old plain marine pulley hanging beside weathered rope in a practical shed. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "sail-loft-rafters",
        "name": "Sail Loft Rafters",
        "scene": "Simple timber rafters above folded natural sailcloth in an ordinary sail loft. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "tide-pool-study",
        "name": "Tide Pool Study",
        "scene": "Ordinary shells and pebbles beside a blank field notebook at a quiet coastal wall. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "coastal-education-room",
        "name": "Coastal Education Room",
        "scene": "An empty modest coastal classroom with plain globe and unlettered reading materials. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "rope-knot-study",
        "name": "Rope Knot Study",
        "scene": "Simple practice sailing knots made with natural rope on an unmarked board. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "pebble-harbor-beach",
        "name": "Pebble Harbor Beach",
        "scene": "A quiet pebble beach beside an old working harbor wall. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "brass-compass-wear",
        "name": "Brass Compass Wear",
        "scene": "Natural patina on a plain brass compass case without readable markings. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "boatyard-gate",
        "name": "Boatyard Gate",
        "scene": "An ordinary open boatyard gate framing small weathered sailboats on stands. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "low-tide-moorings",
        "name": "Low Tide Moorings",
        "scene": "Wooden mooring posts exposed in an ordinary modest estuary at low tide. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "museum-model-courtyard",
        "name": "Museum Model Courtyard",
        "scene": "A plain wooden boat model in a modest museum courtyard seen from an upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "sail-repair-bench",
        "name": "Sail Repair Bench",
        "scene": "Folded plain sailcloth and simple repair needles on an ordinary sailmaker bench. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "harbor-bell-shelter",
        "name": "Harbor Bell Shelter",
        "scene": "A plain old harbor bell beneath a weathered timber shelter without lettering. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "driftwood-history-walk",
        "name": "Driftwood History Walk",
        "scene": "Natural driftwood on a low coastal wall with an ordinary maritime walkway beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-history-circle",
        "name": "Community History Circle",
        "scene": "An empty modest history-discussion room with plain chairs, no celebratory colonial symbols. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "ship-model-parts",
        "name": "Ship Model Parts",
        "scene": "Unpainted model-boat parts, cotton cord and a numberless ruler on plain paper. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "old-dock-planks",
        "name": "Old Dock Planks",
        "scene": "Uneven weathered dock boards beside a plain coiled rope and calm water. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "parchment-fiber",
        "name": "Parchment Fiber",
        "scene": "Honest blank aged-paper texture beside an ordinary quill and plain ink pot. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "coastal-workshop-door",
        "name": "Coastal Workshop Door",
        "scene": "An empty modest coastal craft workshop through its door with plain wood and rope. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "harbor-breakwater",
        "name": "Harbor Breakwater",
        "scene": "An ordinary stone breakwater with modest fishing boats beneath pale October sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "fishing-net-loft",
        "name": "Fishing Net Loft",
        "scene": "Plain repaired nets hanging in an ordinary maritime loft seen from an upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "rowing-oar-rack",
        "name": "Rowing Oar Rack",
        "scene": "Worn wooden oars in a practical unlettered boathouse rack. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "lighthouse-stairwell",
        "name": "Lighthouse Stairwell",
        "scene": "A modest old lighthouse stairwell without labels or dramatic light beams. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "archive-handling-gloves",
        "name": "Archive Handling Gloves",
        "scene": "Cotton gloves on a plain trolley with practical maritime archive shelves behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "small-harbor-library",
        "name": "Small Harbor Library",
        "scene": "A modest harbor-town reading room with plain globe and unlettered books. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "boat-timber-rings",
        "name": "Boat Timber Rings",
        "scene": "Natural boatbuilding timber offcuts beside plain sandpaper on a worn bench. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "coastal-path-fence",
        "name": "Coastal Path Fence",
        "scene": "A weathered fence beside an ordinary coastal path with natural autumn grasses. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "rope-fibers",
        "name": "Rope Fibers",
        "scene": "Frayed natural cotton marine-rope fibers beside a plain wooden cleat. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "museum-boathouse-door",
        "name": "Museum Boathouse Door",
        "scene": "A modest museum boathouse through its door, simple unpainted wooden boats. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "estuary-autumn",
        "name": "Estuary Autumn",
        "scene": "A quiet ordinary estuary with reeds, modest docks and pale autumn cloud. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "harborside-courtyard",
        "name": "Harborside Courtyard",
        "scene": "A modest harborside courtyard with plain benches and unlettered museum crates. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "compass-workshop",
        "name": "Compass Workshop",
        "scene": "Small unmarked brass compass parts being assembled on a plain workshop mat, no hands. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "sail-mast-rigging",
        "name": "Sail Mast Rigging",
        "scene": "Ordinary small-boat rigging against a pale sky in a working harbor. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "blank-sea-journal",
        "name": "Blank Sea Journal",
        "scene": "A blank waterproof journal and pencil on an old seawall with quiet harbor beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "school-maritime-workshop",
        "name": "School Maritime Workshop",
        "scene": "An empty classroom with plain maritime models and blank paper for a history workshop. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "shell-sorting-tray",
        "name": "Shell Sorting Tray",
        "scene": "Ordinary coastal shells in an unlabelled wooden tray beside a simple hand lens. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "boat-ramp-puddles",
        "name": "Boat Ramp Puddles",
        "scene": "Small rain puddles on a modest boat ramp with ordinary boats behind. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "wooden-hull-pegs",
        "name": "Wooden Hull Pegs",
        "scene": "Natural wooden pegs and worn plank joins in a modest traditional boat hull. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "coastal-archive-window",
        "name": "Coastal Archive Window",
        "scene": "A plain maritime archive workroom through an open window with folders and gloves. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "harbor-rain",
        "name": "Harbor Rain",
        "scene": "An ordinary working harbor beneath gentle October rain, small weathered boats. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "boat-yard-shadows",
        "name": "Boat Yard Shadows",
        "scene": "Natural shadows of boat stands across a practical modest yard. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "canvas-sea-bag",
        "name": "Canvas Sea Bag",
        "scene": "A plain canvas sea bag beside an old bench in an ordinary boathouse. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "museum-lantern",
        "name": "Museum Lantern",
        "scene": "An unlit plain maritime lantern beneath a simple museum porch beam. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "history-notebook",
        "name": "History Notebook",
        "scene": "A blank notebook beside a wooden boat model with an ordinary community history room beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "veterans-day",
    "name": "Veterans Day",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 11,
      "day": 11,
      "duration": 1
    },
    "palettes": [
      "slate",
      "cobalt",
      "evergreen"
    ],
    "purpose": "volunteers",
    "aliases": "Veterans Day November veterans appreciation service",
    "designs": [
      {
        "slug": "with-gratitude",
        "name": "With Gratitude",
        "scene": "A modest bouquet and small American flag on a community welcome table"
      },
      {
        "slug": "community-breakfast",
        "name": "Community Breakfast",
        "scene": "A simple breakfast table with coffee cups and plain pastries in a community hall"
      },
      {
        "slug": "service-stories",
        "name": "Service Stories",
        "scene": "An empty chair, blank notebook and microphone at a local oral-history event"
      },
      {
        "slug": "honor-garden",
        "name": "Honor Garden",
        "scene": "Autumn flowers and a small flag near an uninscribed park memorial"
      },
      {
        "slug": "welcome-home",
        "name": "Welcome Home",
        "scene": "A neighborhood porch with a simple American flag and autumn mums"
      },
      {
        "slug": "shared-coffee",
        "name": "Shared Coffee",
        "scene": "Plain coffee mugs and cookies on a veterans community center table, no labels"
      },
      {
        "slug": "quiet-tribute",
        "name": "Quiet Tribute",
        "scene": "A wreath of autumn leaves with a narrow patriotic ribbon against brick"
      },
      {
        "slug": "gather-to-honor",
        "name": "Gather to Honor",
        "scene": "Rows of chairs in a small-town hall with a single flag at the side"
      },
      {
        "slug": "letters-of-thanks",
        "name": "Letters of Thanks",
        "scene": "Unmarked envelopes and pencils on a volunteer packing table"
      },
      {
        "slug": "november-reflection",
        "name": "November Reflection",
        "scene": "A park bench with a small bouquet on a soft overcast November day"
      },
      {
        "slug": "veterans-garden-entrance",
        "name": "Veterans Garden Entrance",
        "scene": "A modest veterans community-garden entrance with autumn flowers and no readable signs. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "thank-you-materials",
        "name": "Thank You Materials",
        "scene": "Blank cards, plain envelopes and pencils on a simple cotton cloth. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "autumn-flag-path",
        "name": "Autumn Flag Path",
        "scene": "A modest line of small American flags beside an ordinary autumn community path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "service-quilt-patch",
        "name": "Service Quilt Patch",
        "scene": "Visible mending in a plain blue quilt folded over a community-center chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "veterans-lounge-door",
        "name": "Veterans Lounge Door",
        "scene": "An empty modest veterans lounge through its doorway, ordinary chairs and coffee supplies. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "november-civic-flag",
        "name": "November Civic Flag",
        "scene": "A modest American flag outside an ordinary community building under pale November sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-breakfast-hall",
        "name": "Community Breakfast Hall",
        "scene": "Plain empty breakfast settings in a modest hall viewed from an upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "oral-history-microphone",
        "name": "Oral History Microphone",
        "scene": "A plain microphone beside an empty chair and blank story notebook. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "porch-flag-bracket",
        "name": "Porch Flag Bracket",
        "scene": "A modest American flag bracket on a weathered porch beneath autumn leaves. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "care-parcel-basket",
        "name": "Care Parcel Basket",
        "scene": "Plain care parcels and clean socks beside a modest community-center entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "accessible-garden-beds",
        "name": "Accessible Garden Beds",
        "scene": "Accessible raised beds with autumn herbs in an ordinary veterans community garden. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "coffee-biscuit-sharing",
        "name": "Coffee Biscuit Sharing",
        "scene": "Homemade oatmeal biscuits and plain cups beside folded cotton napkins. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "honor-bench-leaves",
        "name": "Honor Bench Leaves",
        "scene": "Natural November leaves beside a plain empty community honor bench. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "handmade-card-edges",
        "name": "Handmade Card Edges",
        "scene": "Completely blank handmade cards with uneven paper edges beside simple pencils. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "workshop-access",
        "name": "Workshop Access",
        "scene": "An empty accessible community workshop through its door, plain tools and benches. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "autumn-honor-grove",
        "name": "Autumn Honor Grove",
        "scene": "Ordinary deciduous trees around an uninscribed stone in a modest honor grove. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "hall-conversation-circle",
        "name": "Hall Conversation Circle",
        "scene": "Loose empty chairs in a plain discussion space seen from a real balcony. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "plain-service-cloth",
        "name": "Plain Service Cloth",
        "scene": "Unbadged navy fabric folded beside a mending basket, no invented insignia. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "november-maple",
        "name": "November Maple",
        "scene": "Natural maple branches above a modest community-center veranda. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "donated-books",
        "name": "Donated Books",
        "scene": "Unlettered books in a plain donation box beside a community reading corner. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "veterans-meal-kitchen",
        "name": "Veterans Meal Kitchen",
        "scene": "An empty practical community kitchen preparing a simple appreciation meal. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "plain-ribbon-pins",
        "name": "Plain Ribbon Pins",
        "scene": "Red white and blue cotton ribbon beside safety pins, no medals or insignia. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "accessible-garden-walk",
        "name": "Accessible Garden Walk",
        "scene": "A modest accessible garden path with wet leaves and plain handrail. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "wooden-cane-handle",
        "name": "Wooden Cane Handle",
        "scene": "A worn plain cane handle resting against an ordinary community-room chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "oral-history-library",
        "name": "Oral History Library",
        "scene": "A modest oral-history reading room through its doorway with books and blank paper. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "community-november-porch",
        "name": "Community November Porch",
        "scene": "A quiet ordinary porch with a small flag and autumn potted flowers. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "care-package-sorting",
        "name": "Care Package Sorting",
        "scene": "Plain care bags sorted loosely across a modest community-hall floor. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "coffee-trolley",
        "name": "Coffee Trolley",
        "scene": "A plain community coffee trolley with mismatched mugs and homemade loaf cake. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "honor-hall-rafters",
        "name": "Honor Hall Rafters",
        "scene": "Practical timber rafters in a modest honor hall with one unobtrusive flag. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "garden-chrysanthemum",
        "name": "Garden Chrysanthemum",
        "scene": "A modest chrysanthemum pot beside a simple bench in a community garden. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-repair-circle",
        "name": "Community Repair Circle",
        "scene": "An empty ordinary repair workshop with practical tools and plain chairs for veterans. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "blank-story-notebooks",
        "name": "Blank Story Notebooks",
        "scene": "Blank small notebooks and pencils loosely arranged for an oral-history workshop. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "tribute-steps",
        "name": "Tribute Steps",
        "scene": "Plain stone steps outside a community honor garden with a restrained wreath. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "flag-case-joinery",
        "name": "Flag Case Joinery",
        "scene": "Natural wooden joinery in a modest triangular flag case beside white flowers. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "veterans-pantry-door",
        "name": "Veterans Pantry Door",
        "scene": "A practical community pantry through its door, plain jars and unlabelled produce crates. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "library-honor-window",
        "name": "Library Honor Window",
        "scene": "A modest public-library window with autumn flowers and one small American flag. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-conversation",
        "name": "Courtyard Conversation",
        "scene": "Empty ordinary chairs in a quiet community courtyard seen from an upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "accessible-craft-station",
        "name": "Accessible Craft Station",
        "scene": "A modest accessible craft bench with plain wooden pieces and hand tools. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "bare-birch-honor-garden",
        "name": "Bare Birch Honor Garden",
        "scene": "Natural bare birch branches above an ordinary November honor garden. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "breakfast-muffins",
        "name": "Breakfast Muffins",
        "scene": "Homemade bran muffins in a plain basket beside an ordinary hall breakfast station. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-music-room",
        "name": "Community Music Room",
        "scene": "An empty modest music room with acoustic guitar and plain appreciation-gathering chairs. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "coat-repair",
        "name": "Coat Repair",
        "scene": "A plain winter jacket, cotton patches and simple sewing tools on a work mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "november-rain-paving",
        "name": "November Rain Paving",
        "scene": "Gentle rain on plain paving outside an ordinary veterans community building. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "wreath-texture",
        "name": "Wreath Texture",
        "scene": "Natural autumn leaves tied with narrow plain patriotic ribbon on a modest wreath. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "shared-reading-nook",
        "name": "Shared Reading Nook",
        "scene": "An empty ordinary reading nook through a doorway, plain chairs and unlettered books. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "lake-honor-bench",
        "name": "Lake Honor Bench",
        "scene": "A modest uninscribed honor bench beside an ordinary November lake. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-coat-rail",
        "name": "Community Coat Rail",
        "scene": "Clean winter coats along a plain community hall rail viewed from an upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "recording-headphones",
        "name": "Recording Headphones",
        "scene": "Unbranded headphones beside an audio recorder and completely blank notes. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "courtyard-shelter",
        "name": "Courtyard Shelter",
        "scene": "A modest practical shelter roof over a quiet veterans community courtyard. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "letters-ready",
        "name": "Letters Ready",
        "scene": "Plain sealed envelopes and a small aster bouquet beside an open community door. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "thanksgiving",
    "name": "Thanksgiving",
    "kind": "Federal holidays",
    "date": {
      "kind": "weekday",
      "month": 11,
      "weekday": 4,
      "occurrence": 4
    },
    "palettes": [
      "cider",
      "olive",
      "terracotta"
    ],
    "purpose": "potluck",
    "aliases": "Thanksgiving November gratitude turkey feast",
    "designs": [
      {
        "slug": "harvest-supper",
        "name": "Harvest Supper",
        "scene": "A modest family table with roast vegetables, bread and autumn flowers"
      },
      {
        "slug": "kitchen-preparations",
        "name": "Kitchen Preparations",
        "scene": "Homemade pies cooling on a worn kitchen counter"
      },
      {
        "slug": "gather-round",
        "name": "Gather Round",
        "scene": "A simple dining table with mismatched chairs and linen napkins"
      },
      {
        "slug": "autumn-pantry",
        "name": "Autumn Pantry",
        "scene": "Squash, apples and a loaf of bread in an ordinary kitchen"
      },
      {
        "slug": "passing-the-plate",
        "name": "Passing the Plate",
        "scene": "A serving platter of roast turkey and simple side dishes on a table"
      },
      {
        "slug": "grateful-garden",
        "name": "Grateful Garden",
        "scene": "A small arrangement of seasonal leaves and mums in a ceramic jug"
      },
      {
        "slug": "pie-social",
        "name": "Pie Social",
        "scene": "Three homemade pies with imperfect crusts on a community table"
      },
      {
        "slug": "country-table",
        "name": "Country Table",
        "scene": "A farmhouse kitchen table with plain plates and a pumpkin centerpiece"
      },
      {
        "slug": "neighborly-feast",
        "name": "Neighborly Feast",
        "scene": "Potluck dishes in everyday serving bowls on folding tables"
      },
      {
        "slug": "candlelit-supper",
        "name": "Candlelit Supper",
        "scene": "A modest dining room with a few white candles and fall foliage, natural low light"
      },
      {
        "slug": "orchard-harvest-wagon",
        "name": "Orchard Harvest Wagon",
        "scene": "A wooden harvest wagon with squash and late apples beside an ordinary autumn orchard. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "cranberry-preparation",
        "name": "Cranberry Preparation",
        "scene": "Cranberries and sliced oranges beside a plain saucepan of homemade sauce. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "pumpkin-vine-end",
        "name": "Pumpkin Vine End",
        "scene": "An irregular pumpkin among dry vines and leaves in a real backyard garden. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "flaky-pie-edge",
        "name": "Flaky Pie Edge",
        "scene": "Uneven homemade apple-pie crust cooling beside an ordinary kitchen window. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "family-kitchen-welcome",
        "name": "Family Kitchen Welcome",
        "scene": "A lived-in kitchen through its open doorway, roast vegetables and ordinary dishes. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "autumn-farm-lane",
        "name": "Autumn Farm Lane",
        "scene": "A quiet ordinary lane beside a modest produce shed under November cloud. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-harvest-meal",
        "name": "Courtyard Harvest Meal",
        "scene": "A modest courtyard harvest-meal setup seen from a real upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "dinner-dough-rising",
        "name": "Dinner Dough Rising",
        "scene": "Plain roll dough rising beneath cotton cloth on an ordinary kitchen shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "oak-leaves-above-porch",
        "name": "Oak Leaves Above Porch",
        "scene": "Natural russet oak leaves above a weathered porch and modest harvest basket. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "gratitude-notebook",
        "name": "Gratitude Notebook",
        "scene": "A blank notebook beside a pear and autumn leaf with a lived-in home beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-food-pantry",
        "name": "Community Food Pantry",
        "scene": "A practical pantry with plain harvest produce crates for Thanksgiving sharing. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "pecan-shells",
        "name": "Pecan Shells",
        "scene": "Pecan halves, shells and a worn nutcracker beside plain parchment. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "mushroom-garden-edge",
        "name": "Mushroom Garden Edge",
        "scene": "Natural small autumn mushrooms beside a weathered vegetable-garden fence. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "cranberry-steam",
        "name": "Cranberry Steam",
        "scene": "Realistic steam from a small cranberry saucepan on an ordinary stove. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "potting-shed-harvest",
        "name": "Potting Shed Harvest",
        "scene": "A modest garden shed through its open door with squash and simple tools. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "orchard-remains",
        "name": "Orchard Remains",
        "scene": "A quiet orchard row with remaining apples and ordinary picking ladders. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "apartment-potluck-arrival",
        "name": "Apartment Potluck Arrival",
        "scene": "Plain covered homemade dishes near an apartment entrance viewed from a stair landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "casserole-carrier",
        "name": "Casserole Carrier",
        "scene": "A quilted plain carrier holding a homemade vegetable casserole on an everyday bench. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "dry-corn-stalks",
        "name": "Dry Corn Stalks",
        "scene": "Drying corn beside a modest farm shed beneath pale autumn sky. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "sage-gathering",
        "name": "Sage Gathering",
        "scene": "Fresh sage and plain garden shears beside an ordinary kitchen-garden path. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-baking-stall",
        "name": "Neighborhood Baking Stall",
        "scene": "An empty modest community baking stall with homemade pies and no labels. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "roasted-roots",
        "name": "Roasted Roots",
        "scene": "Irregular roasted carrots, parsnips and beets in a worn plain roasting pan. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "chestnut-walk",
        "name": "Chestnut Walk",
        "scene": "Fallen chestnuts and leaves beside a quiet ordinary neighborhood path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "mended-linen",
        "name": "Mended Linen",
        "scene": "A repaired old linen napkin beside a plain plate and autumn sprig. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "before-dinner",
        "name": "Before Dinner",
        "scene": "A modest dining room through an open doorway with mismatched chairs and empty settings. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "november-riverbank",
        "name": "November Riverbank",
        "scene": "An ordinary riverbank with autumn reeds and a modest picnic shelter. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "holiday-kitchen-overview",
        "name": "Holiday Kitchen Overview",
        "scene": "A practical lived-in kitchen with several plain cooking preparations seen from an upper doorway. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "harvest-pantry-shelf",
        "name": "Harvest Pantry Shelf",
        "scene": "A plain basket of late pears and apples on an ordinary pantry shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "gourd-garland",
        "name": "Gourd Garland",
        "scene": "A modest handmade dried-gourd garland beneath a plain porch beam. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "pumpkin-soup-ladle",
        "name": "Pumpkin Soup Ladle",
        "scene": "A plain ladle beside homemade pumpkin soup with an everyday kitchen beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-orchard-sharing",
        "name": "Community Orchard Sharing",
        "scene": "A modest orchard sharing station with unlabelled apples and squash. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "homemade-butter",
        "name": "Homemade Butter",
        "scene": "A homemade butter pat, flaky dinner rolls and plain cotton on worn wood. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "wet-garden-boots",
        "name": "Wet Garden Boots",
        "scene": "Muddy boots beside freshly harvested roots on an ordinary back step. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pie-steam-window",
        "name": "Pie Steam Window",
        "scene": "Realistic steam from a homemade pie beside a slightly fogged window. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "open-pantry",
        "name": "Open Pantry",
        "scene": "An ordinary pantry doorway framing plain preserves, nuts and unlabelled food jars. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "farmstead-evening",
        "name": "Farmstead Evening",
        "scene": "An ordinary farmstead with restrained warm windows on a cloudy November evening. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "urban-harvest-garden",
        "name": "Urban Harvest Garden",
        "scene": "A modest rooftop vegetable garden after harvest seen from a real upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "cornbread-skillet",
        "name": "Cornbread Skillet",
        "scene": "Homemade cornbread cooling in a plain cast-iron skillet on an ordinary stove. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "november-beech",
        "name": "November Beech",
        "scene": "Natural copper beech leaves above a modest home garden. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "autumn-flower-bucket",
        "name": "Autumn Flower Bucket",
        "scene": "Cut chrysanthemums beside a kitchen door with meal preparations beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "bread-workshop",
        "name": "Bread Workshop",
        "scene": "An empty modest community bread workshop with dough bowls and practical racks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "apple-peeling-spiral",
        "name": "Apple Peeling Spiral",
        "scene": "A curled apple peel, plain peeler and homemade filling on a practical board. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "harvest-crate-corner",
        "name": "Harvest Crate Corner",
        "scene": "A crate of muddy carrots and beets beside a weathered garden wall. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "honey-baked-pear",
        "name": "Honey Baked Pear",
        "scene": "A homemade baked pear with honey on an ordinary ceramic plate. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-supper-entrance",
        "name": "Community Supper Entrance",
        "scene": "A modest empty supper room through its door, plain warm dishes and simple chairs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "hillside-orchard-november",
        "name": "Hillside Orchard November",
        "scene": "A small ordinary hillside orchard with bare branches and late autumn ground cover. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "back-porch-potluck",
        "name": "Back Porch Potluck",
        "scene": "Covered homemade dishes on a modest porch seen from an upper home window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "leftover-parcels",
        "name": "Leftover Parcels",
        "scene": "Plain reusable leftover containers beside a folded cotton carrier bag. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "drying-kitchen-herbs",
        "name": "Drying Kitchen Herbs",
        "scene": "Small plain sage and thyme bundles beneath an ordinary kitchen beam. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "neighbor-bread-gift",
        "name": "Neighbor Bread Gift",
        "scene": "A homemade loaf wrapped in cloth beside a doorway overlooking a quiet autumn street. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "christmas",
    "name": "Christmas",
    "kind": "Federal holidays",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 25,
      "duration": 1
    },
    "palettes": [
      "evergreen",
      "cherry",
      "cocoa"
    ],
    "purpose": "celebration",
    "aliases": "Christmas Xmas December holiday Christmas Eve",
    "designs": [
      {
        "slug": "evergreen-kitchen",
        "name": "Evergreen Kitchen",
        "scene": "A little evergreen branch beside homemade cookies in a lived-in kitchen"
      },
      {
        "slug": "front-door-welcome",
        "name": "Front Door Welcome",
        "scene": "A simple real evergreen wreath on a weathered front door"
      },
      {
        "slug": "family-table",
        "name": "Family Table",
        "scene": "A modest Christmas meal table with red napkins and pine sprigs"
      },
      {
        "slug": "wrapped-with-care",
        "name": "Wrapped with Care",
        "scene": "A few gifts wrapped in kraft paper with cotton ribbon on a wooden table"
      },
      {
        "slug": "neighborhood-lights",
        "name": "Neighborhood Lights",
        "scene": "An ordinary residential porch with a restrained string of warm lights at dusk"
      },
      {
        "slug": "cookie-afternoon",
        "name": "Cookie Afternoon",
        "scene": "Homemade gingerbread cookies with imperfect icing on a baking tray"
      },
      {
        "slug": "winter-window",
        "name": "Winter Window",
        "scene": "A small real Christmas tree by a window with simple handmade ornaments"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Folding tables prepared for a community Christmas meal with subtle greenery"
      },
      {
        "slug": "quiet-christmas",
        "name": "Quiet Christmas",
        "scene": "A wooden church pew with evergreen decoration and soft daylight"
      },
      {
        "slug": "cozy-gathering",
        "name": "Cozy Gathering",
        "scene": "A lived-in sitting room with a small tree, wool blankets and a simple tea tray"
      },
      {
        "slug": "neighborhood-fir-lot",
        "name": "Neighborhood Fir Lot",
        "scene": "A modest local Christmas-tree lot with uneven real firs and no readable signs. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "orange-garland-materials",
        "name": "Orange Garland Materials",
        "scene": "Dried orange slices, cinnamon and cotton twine loosely arranged on plain paper. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "snowy-door-boots",
        "name": "Snowy Door Boots",
        "scene": "Ordinary winter boots beside a modest evergreen doorstep wreath on fresh snow. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "wooden-ornament-grain",
        "name": "Wooden Ornament Grain",
        "scene": "An imperfect wooden star tied with cotton cord against real fir needles. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "village-church-door",
        "name": "Village Church Door",
        "scene": "An empty modest church through its door with restrained evergreen greenery. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-snow-street",
        "name": "Quiet Snow Street",
        "scene": "A snowy residential street with a few modest warm porch lights at blue hour. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-christmas-tree",
        "name": "Courtyard Christmas Tree",
        "scene": "A small real tree in a shared courtyard seen from an upper apartment window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "stocking-mending",
        "name": "Stocking Mending",
        "scene": "A worn wool stocking beside a visible repair and ordinary sewing basket, no hands. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "porch-evergreen",
        "name": "Porch Evergreen",
        "scene": "Restrained evergreen sprigs beneath a simple weathered porch beam. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "cookie-delivery-basket",
        "name": "Cookie Delivery Basket",
        "scene": "Homemade shortbread wrapped in plain cloth beside a quiet neighborhood doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-wrapping-room",
        "name": "Community Wrapping Room",
        "scene": "An empty modest gift-wrapping room with plain paper and ordinary boxes. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "cranberry-popcorn-thread",
        "name": "Cranberry Popcorn Thread",
        "scene": "Cranberries and popcorn partly threaded on cotton string over plain cloth. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "fir-needles-on-steps",
        "name": "Fir Needles On Steps",
        "scene": "Fallen real fir needles beside an ordinary front step and one small gift. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "frosted-window-sprig",
        "name": "Frosted Window Sprig",
        "scene": "Real kitchen-window frost beside a small plain evergreen branch. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bakery-christmas-morning",
        "name": "Bakery Christmas Morning",
        "scene": "A modest bakery through its open service door with homemade fruit bread and no text. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-rooftops",
        "name": "Winter Rooftops",
        "scene": "Ordinary snow-dusted rooftops and modest Christmas window lights at dusk. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "apartment-tree-corner",
        "name": "Apartment Tree Corner",
        "scene": "A small real fir beside ordinary furniture viewed from a simple mezzanine. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "paper-star-lantern",
        "name": "Paper Star Lantern",
        "scene": "A handmade cream paper star lantern beside a window under realistic practical light. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "chapel-timber",
        "name": "Chapel Timber",
        "scene": "Plain timber rafters of a modest chapel with restrained real greenery below. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "knitted-gift-scarf",
        "name": "Knitted Gift Scarf",
        "scene": "A handmade wool scarf in plain paper beside a lived-in home entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-coat-drive",
        "name": "Community Coat Drive",
        "scene": "A modest community coat collection with clean winter coats and a small fir sprig. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "homemade-mince-pies",
        "name": "Homemade Mince Pies",
        "scene": "Uneven homemade mince pies beside plain parchment and a kitchen cloth. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "sled-at-gate",
        "name": "Sled At Gate",
        "scene": "A wooden sled beside a snow-covered garden gate with a modest evergreen wreath. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pinecone-cotton-knot",
        "name": "Pinecone Cotton Knot",
        "scene": "Plain cotton string around a natural pinecone ornament against a real branch. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "winter-pottery-studio",
        "name": "Winter Pottery Studio",
        "scene": "A modest pottery studio through its door with handmade unlettered gift mugs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "village-footbridge-lights",
        "name": "Village Footbridge Lights",
        "scene": "An ordinary small footbridge with one restrained strand of warm bulbs at dusk. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "hall-christmas-tree",
        "name": "Hall Christmas Tree",
        "scene": "A modest community hall with one small tree and loosely spaced plain chairs. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "fruit-bread-cooling",
        "name": "Fruit Bread Cooling",
        "scene": "Homemade fruit bread on an ordinary kitchen shelf beside a plain tea towel. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "snow-laden-fir",
        "name": "Snow Laden Fir",
        "scene": "Natural fir branches carrying uneven snow against a pale winter sky. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "christmas-morning-mittens",
        "name": "Christmas Morning Mittens",
        "scene": "Plain wool mittens on a snowy porch rail with ordinary homes beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "simple-nativity-shelf",
        "name": "Simple Nativity Shelf",
        "scene": "A modest traditional wooden nativity with simple nonportrait figures on a plain home shelf. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "paper-chain-making",
        "name": "Paper Chain Making",
        "scene": "Plain cream and red paper strips partly linked beside a simple glue pot. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "winter-bird-seed",
        "name": "Winter Bird Seed",
        "scene": "An unlabelled seed bag beside a modest garden feeder under light snow. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "gingerbread-texture",
        "name": "Gingerbread Texture",
        "scene": "Homemade gingerbread stars with uneven surfaces and restrained white icing. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "family-pantry-gifts",
        "name": "Family Pantry Gifts",
        "scene": "An open ordinary pantry with baking ingredients and small plain wrapped gifts. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "snowy-allotment",
        "name": "Snowy Allotment",
        "scene": "A snow-dusted allotment with one modest wreath on a weathered shed door. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "porch-gift-collection",
        "name": "Porch Gift Collection",
        "scene": "Plain wrapped neighbor gifts and evergreen branch on a sheltered porch. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "brass-bell-ribbon",
        "name": "Brass Bell Ribbon",
        "scene": "One simple brass bell tied with red cotton beside a worn wooden door. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "neighborhood-window-stars",
        "name": "Neighborhood Window Stars",
        "scene": "A few handmade paper stars inside an ordinary upstairs window at realistic evening exposure. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "orange-pomander-bowl",
        "name": "Orange Pomander Bowl",
        "scene": "Homemade orange pomanders in a plain bowl with a lived-in winter kitchen beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "quiet-christmas-veranda",
        "name": "Quiet Christmas Veranda",
        "scene": "A modest veranda with one ordinary warm porch lamp and small real tree. Camera: ordinary eye-level night photography under believable practical light, restrained exposure."
      },
      {
        "slug": "beeswax-candle-making",
        "name": "Beeswax Candle Making",
        "scene": "Plain beeswax sheets, cotton wicks and handmade unlit candles on a craft mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "practical-tree-stand",
        "name": "Practical Tree Stand",
        "scene": "A real tree in a practical stand with fallen needles and two plain gifts. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "wool-stocking-stitches",
        "name": "Wool Stocking Stitches",
        "scene": "Worn wool stitches in a handmade stocking hanging from an ordinary peg. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-holiday-kitchen",
        "name": "Community Holiday Kitchen",
        "scene": "An empty practical community kitchen through its doorway preparing a modest Christmas meal. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-station-wreath",
        "name": "Winter Station Wreath",
        "scene": "An ordinary small-town rail platform in light snow with one modest wreath, no signs. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "shared-stair-greenery",
        "name": "Shared Stair Greenery",
        "scene": "Restrained evergreen sprigs along a shared apartment stairwell viewed from an upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "record-player-carol",
        "name": "Record Player Carol",
        "scene": "An ordinary unbranded record player with blank sleeve beside a fir sprig and plain mug. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "snowy-garden-lantern",
        "name": "Snowy Garden Lantern",
        "scene": "A plain unlit lantern beneath snow-dusted branches with a modest home behind. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "handmade-toy-gift",
        "name": "Handmade Toy Gift",
        "scene": "A simple unfinished wooden toy wrapped in cloth beside a practical winter workshop door. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "new-years-eve",
    "name": "New Year’s Eve",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 31,
      "duration": 1
    },
    "palettes": [
      "midnight",
      "ochre",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "NYE New Years Eve countdown December",
    "designs": [
      {
        "slug": "small-celebration",
        "name": "Small Celebration",
        "scene": "A few sparkling cider glasses and simple gold paper streamers on a dining table"
      },
      {
        "slug": "city-window",
        "name": "City Window",
        "scene": "A quiet apartment dinner setting beside a window overlooking ordinary city lights"
      },
      {
        "slug": "midnight-table",
        "name": "Midnight Table",
        "scene": "A modest evening table with candles, snacks and dark linen"
      },
      {
        "slug": "paper-confetti",
        "name": "Paper Confetti",
        "scene": "A handful of handmade paper confetti and plain party hats on a wooden table"
      },
      {
        "slug": "kitchen-toast",
        "name": "Kitchen Toast",
        "scene": "Sparkling cider and citrus slices on a lived-in kitchen counter"
      },
      {
        "slug": "evening-supper",
        "name": "Evening Supper",
        "scene": "A small dinner gathering setup with plain dishes and winter flowers"
      },
      {
        "slug": "record-night",
        "name": "Record Night",
        "scene": "A turntable, records with blank sleeves and a small snack bowl"
      },
      {
        "slug": "winter-terrace",
        "name": "Winter Terrace",
        "scene": "Two outdoor chairs, wool throws and string lights on a small terrace"
      },
      {
        "slug": "golden-pears",
        "name": "Golden Pears",
        "scene": "Pears, nuts and simple glassware on a winter supper table"
      },
      {
        "slug": "after-dark",
        "name": "After Dark",
        "scene": "A small neighborhood cafe ready for an evening gathering, soft realistic lighting"
      },
      {
        "slug": "rooftop-supper",
        "name": "Rooftop Supper",
        "scene": "A modest empty rooftop supper setup with plain blankets and ordinary city lights at blue hour. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "citrus-ice-cubes",
        "name": "Citrus Ice Cubes",
        "scene": "Homemade citrus ice cubes, plain glasses and cotton napkins on a dark tray. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "wet-city-doorstep",
        "name": "Wet City Doorstep",
        "scene": "An ordinary wet doorstep reflecting restrained household lights on New Year's Eve. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "paper-crown-fold",
        "name": "Paper Crown Fold",
        "scene": "Imperfect folded edges of a handmade plain gold crown beside a kitchen window. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-game-room",
        "name": "Community Game Room",
        "scene": "An empty modest game room through its door with wooden games and simple snacks. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "distant-neighborhood-fireworks",
        "name": "Distant Neighborhood Fireworks",
        "scene": "A few believable distant fireworks above ordinary rooftops at restrained night exposure. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-evening-lights",
        "name": "Courtyard Evening Lights",
        "scene": "A modest shared courtyard with ordinary chairs and one short light strand. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "sparkling-cider-bottle",
        "name": "Sparkling Cider Bottle",
        "scene": "An unlabelled sparkling-cider bottle beside simple glasses in an ordinary kitchen. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "winter-balcony-lantern",
        "name": "Winter Balcony Lantern",
        "scene": "A plain practical lantern beneath a modest balcony roof at blue hour. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "midnight-bread-basket",
        "name": "Midnight Bread Basket",
        "scene": "Homemade bread beside plain dark cotton with a small apartment supper space beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "music-rehearsal-room",
        "name": "Music Rehearsal Room",
        "scene": "An empty community music room with ordinary keyboard and guitar before an evening gathering. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "savory-crackers",
        "name": "Savory Crackers",
        "scene": "Homemade seeded crackers beside a plain cheese dish and fresh pear slices. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "terrace-slippers",
        "name": "Terrace Slippers",
        "scene": "Wool slippers beside a weathered terrace door with quiet night lights beyond. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "winter-window-condensation",
        "name": "Winter Window Condensation",
        "scene": "Real condensation on an apartment window beside a plain sparkling-water glass. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "neighborhood-cafe-evening",
        "name": "Neighborhood Cafe Evening",
        "scene": "A modest unbranded cafe through its doorway with ordinary warm practical lights. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-river-lights",
        "name": "Quiet River Lights",
        "scene": "Ordinary window lights reflected in a calm winter river without spectacular skyline. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "living-room-games",
        "name": "Living Room Games",
        "scene": "A modest living room with a plain board game and floor cushions. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "fondue-supper",
        "name": "Fondue Supper",
        "scene": "A simple fondue pot beside bread cubes and ordinary forks in a small kitchen. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "paper-garland-ceiling",
        "name": "Paper Garland Ceiling",
        "scene": "Restrained handmade gold paper garland beneath an ordinary living-room ceiling. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "winter-coat-pegs",
        "name": "Winter Coat Pegs",
        "scene": "Ordinary coats beside a modest hallway opening toward a small evening gathering space. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "home-dance-corner",
        "name": "Home Dance Corner",
        "scene": "An empty modest living room with furniture pushed back and ordinary radio. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "origami-stars",
        "name": "Origami Stars",
        "scene": "Handmade paper stars, loose gold paper and simple scissors on a worn mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "garden-path-evening",
        "name": "Garden Path Evening",
        "scene": "A modest wet garden path lit by two ordinary practical lamps at night. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "pear-and-walnut",
        "name": "Pear And Walnut",
        "scene": "A freshly cut pear and walnuts beside a plain evening plate. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "quiet-reading-gathering",
        "name": "Quiet Reading Gathering",
        "scene": "An empty reading room through a doorway with unlettered books and plain mugs. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "last-train-platform",
        "name": "Last Train Platform",
        "scene": "A quiet small-town rail platform on winter evening without readable signs or people. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "balcony-snack-setup",
        "name": "Balcony Snack Setup",
        "scene": "Plain snacks and ordinary chairs on a modest apartment balcony. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "turntable-needle",
        "name": "Turntable Needle",
        "scene": "An unbranded turntable playing an unlettered record beside an ordinary lamp. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "bare-branch-night",
        "name": "Bare Branch Night",
        "scene": "Winter branches above modest ordinary residential window lights at night. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "paper-favor-parcels",
        "name": "Paper Favor Parcels",
        "scene": "Plain small gift parcels beside an apartment doorway under realistic warm light. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-puzzle-room",
        "name": "Community Puzzle Room",
        "scene": "A modest empty community room with unfinished jigsaw and ordinary chairs. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "soft-pretzel-baking",
        "name": "Soft Pretzel Baking",
        "scene": "Homemade pretzels and coarse salt on plain parchment beside mustard. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "lakeside-winter-firepit",
        "name": "Lakeside Winter Firepit",
        "scene": "An unlit ordinary firepit beside a quiet winter lake and empty chairs. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "candle-wax-drips",
        "name": "Candle Wax Drips",
        "scene": "Real dripped wax on a simple candle holder beside a modest supper setting. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "kitchen-toast-preparation",
        "name": "Kitchen Toast Preparation",
        "scene": "An ordinary kitchen through its door, plain citrus water and simple homemade snacks. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-harbor-midnight",
        "name": "Quiet Harbor Midnight",
        "scene": "A modest working harbor at night with ordinary practical lights, no dramatic fireworks. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "shared-hall-seating",
        "name": "Shared Hall Seating",
        "scene": "Loose plain chairs in a community hall viewed from an upper landing before a gathering. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "blank-wishes",
        "name": "Blank Wishes",
        "scene": "Completely blank folded wish cards and plain pencils standing in an ordinary ceramic cup. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "window-paper-fans",
        "name": "Window Paper Fans",
        "scene": "Modest handmade paper fans inside an ordinary winter window at dusk. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "cocoa-tray",
        "name": "Cocoa Tray",
        "scene": "Homemade cocoa on a plain tray beside a quiet veranda with folded blankets. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "porch-lantern-gathering",
        "name": "Porch Lantern Gathering",
        "scene": "A modest empty porch lit by one ordinary lamp and restrained warm bulbs. Camera: ordinary eye-level night photography under believable practical light, restrained exposure."
      },
      {
        "slug": "chocolate-bark",
        "name": "Chocolate Bark",
        "scene": "Homemade dark-chocolate bark with nuts on plain parchment beside a small knife. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "snowy-gate-night",
        "name": "Snowy Gate Night",
        "scene": "A simple snowy front gate beside ordinary warm residential lights on New Year's Eve. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "sparkling-water-bubbles",
        "name": "Sparkling Water Bubbles",
        "scene": "Natural bubbles in plain sparkling water beside sliced lemon and dark linen. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "conservatory-supper",
        "name": "Conservatory Supper",
        "scene": "A modest conservatory through its door with ordinary supper chairs and practical lamplight. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "town-tower-silhouette",
        "name": "Town Tower Silhouette",
        "scene": "A distant ordinary civic-tower silhouette at night without readable numerals or fantasy sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "apartment-neighbor-gifts",
        "name": "Apartment Neighbor Gifts",
        "scene": "Plain neighbor gifts beside an apartment entrance seen from a stair landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "domino-endgame",
        "name": "Domino Endgame",
        "scene": "An unfinished wooden domino game beside plain cups and a small nut bowl. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "cafe-pendant-lights",
        "name": "Cafe Pendant Lights",
        "scene": "Ordinary warm pendant lamps inside a modest cafe prepared for New Year's Eve. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "first-morning-shoes",
        "name": "First Morning Shoes",
        "scene": "Plain walking shoes at a winter doorstep with quiet late-night household light behind. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "valentines-day",
    "name": "Valentine’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 2,
      "day": 14,
      "duration": 1
    },
    "palettes": [
      "rose",
      "cherry",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "Valentines Galentines February friendship love",
    "designs": [
      {
        "slug": "paper-hearts",
        "name": "Paper Hearts",
        "scene": "Hand-cut paper hearts, scissors and twine on a classroom craft table"
      },
      {
        "slug": "garden-roses",
        "name": "Garden Roses",
        "scene": "A few natural pink roses in a chipped ceramic vase by a window"
      },
      {
        "slug": "coffee-for-two",
        "name": "Coffee for Two",
        "scene": "Two coffee cups and a small pastry on a neighborhood cafe table"
      },
      {
        "slug": "friendship-table",
        "name": "Friendship Table",
        "scene": "A modest tea table with berries and mismatched pink plates"
      },
      {
        "slug": "cookie-exchange",
        "name": "Cookie Exchange",
        "scene": "Homemade heart-shaped cookies on parchment, slightly uneven icing"
      },
      {
        "slug": "letters-and-flowers",
        "name": "Letters and Flowers",
        "scene": "Blank envelopes and a small bunch of tulips on a wooden desk"
      },
      {
        "slug": "winter-picnic",
        "name": "Winter Picnic",
        "scene": "A basket with a red checked cloth and simple homemade treats"
      },
      {
        "slug": "sweet-workshop",
        "name": "Sweet Workshop",
        "scene": "Bowls of icing and plain cupcakes on a community baking table"
      },
      {
        "slug": "pink-tulips",
        "name": "Pink Tulips",
        "scene": "An informal bunch of pink tulips in a glass jar in daylight"
      },
      {
        "slug": "shared-dessert",
        "name": "Shared Dessert",
        "scene": "A homemade chocolate cake and two forks on a simple kitchen table"
      },
      {
        "slug": "winter-rose-greenhouse",
        "name": "Winter Rose Greenhouse",
        "scene": "A modest greenhouse with naturally growing pink roses and practical garden paths. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "pressed-flower-letter",
        "name": "Pressed Flower Letter",
        "scene": "A blank cream card beside pressed petals, cotton ribbon and plain pencil. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "heart-leaf-garden",
        "name": "Heart Leaf Garden",
        "scene": "Natural heart-shaped cyclamen leaves beside a weathered garden wall. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "raspberry-filling",
        "name": "Raspberry Filling",
        "scene": "A homemade raspberry tart with uneven pastry beside an ordinary kitchen cloth. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "friendship-bookshop",
        "name": "Friendship Bookshop",
        "scene": "A modest unbranded bookshop nook through its door, pink flowers and unlettered books. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-seaside-pair",
        "name": "Winter Seaside Pair",
        "scene": "Two empty ordinary benches overlooking a quiet February beach. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-pink-flowers",
        "name": "Courtyard Pink Flowers",
        "scene": "Potted pink cyclamen in a residential courtyard seen from an upstairs window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "knitted-scarf-gift",
        "name": "Knitted Scarf Gift",
        "scene": "A handmade rose wool scarf beside a completely blank gift card. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "paper-heart-window",
        "name": "Paper Heart Window",
        "scene": "A few handmade plain paper hearts inside an ordinary winter window. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "tulip-delivery-basket",
        "name": "Tulip Delivery Basket",
        "scene": "Informal tulips in a plain basket beside a modest neighborhood doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "friendship-workshop",
        "name": "Friendship Workshop",
        "scene": "An empty community room with practical sewing supplies and simple friendship bracelets. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "chocolate-strawberries",
        "name": "Chocolate Strawberries",
        "scene": "Homemade chocolate-dipped strawberries on plain parchment without elaborate styling. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "rose-pruning-basket",
        "name": "Rose Pruning Basket",
        "scene": "Fresh rose prunings, ordinary gloves and a basket on damp garden ground. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "clay-heart-ornament",
        "name": "Clay Heart Ornament",
        "scene": "An imperfect handmade clay heart drying beside an ordinary pottery bowl. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "sweet-bakery-window",
        "name": "Sweet Bakery Window",
        "scene": "A modest bakery through its service window with homemade heart biscuits and no text. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "snowy-park-benches",
        "name": "Snowy Park Benches",
        "scene": "Empty ordinary park benches beside bare February trees and thin snow. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "balcony-tea",
        "name": "Balcony Tea",
        "scene": "Two plain teacups on a modest balcony seen from a real upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "ribbon-gift-sewing",
        "name": "Ribbon Gift Sewing",
        "scene": "Cotton ribbon partly sewn onto a handmade fabric gift pouch, no hands. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "first-cherry-blossom",
        "name": "First Cherry Blossom",
        "scene": "One early pink blossom on a natural bare cherry branch against pale winter sky. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "kindness-parcels",
        "name": "Kindness Parcels",
        "scene": "Small plain wrapped treats beside a doorway overlooking a quiet residential street. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-flower-room",
        "name": "Community Flower Room",
        "scene": "An empty modest flower workspace with informal bouquets and practical buckets. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "friendship-threads",
        "name": "Friendship Threads",
        "scene": "Half-finished cotton bracelets and loose rose red and cream threads on a mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "wet-garden-lantern",
        "name": "Wet Garden Lantern",
        "scene": "An ordinary unlit lantern beside fallen rose petals on wet paving. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "homemade-truffles",
        "name": "Homemade Truffles",
        "scene": "Uneven homemade cocoa-dusted chocolate truffles in a plain shallow bowl. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "conservatory-tea-nook",
        "name": "Conservatory Tea Nook",
        "scene": "A modest tea nook through its doorway, mismatched cups and winter potted plants. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "neighborhood-flower-stall",
        "name": "Neighborhood Flower Stall",
        "scene": "An empty modest flower stall with ordinary tulip buckets and no labels. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "home-baking-racks",
        "name": "Home Baking Racks",
        "scene": "A lived-in kitchen with homemade Valentine baking on ordinary cooling racks. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "hand-sewn-cushion",
        "name": "Hand Sewn Cushion",
        "scene": "A handmade pink cotton cushion with visible stitches on a wooden chair. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "sweet-pea-tendrils",
        "name": "Sweet Pea Tendrils",
        "scene": "Real sweet-pea tendrils inside a modest greenhouse against fogged winter glass. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "blank-postcards",
        "name": "Blank Postcards",
        "scene": "Blank pink postcards beside a plain mail slot in an ordinary hallway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "shared-repair-space",
        "name": "Shared Repair Space",
        "scene": "An empty modest repair workshop with two stools and a partly repaired chair. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "rosewater-biscuit-dough",
        "name": "Rosewater Biscuit Dough",
        "scene": "Biscuit dough, simple heart cutter and loose flour on a practical board. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "front-step-posy",
        "name": "Front Step Posy",
        "scene": "An informal paper-wrapped bouquet on an ordinary weathered doorstep. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "raspberry-jam",
        "name": "Raspberry Jam",
        "scene": "An unlabelled homemade raspberry-jam jar beside a simple spreading knife. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "library-kindness-shelf",
        "name": "Library Kindness Shelf",
        "scene": "An ordinary library entrance framing unlettered books and plain flower jars. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "winter-orchard-gate",
        "name": "Winter Orchard Gate",
        "scene": "A simple gate beside a bare orchard with restrained plain red ribbon. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-quilt",
        "name": "Courtyard Quilt",
        "scene": "A rose-colored patchwork quilt airing over an ordinary courtyard rail seen from above. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-keepsake-box",
        "name": "Wooden Keepsake Box",
        "scene": "A small plain handmade wooden box beside an unlettered cream card. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "pink-window-curtain",
        "name": "Pink Window Curtain",
        "scene": "Plain pink cotton curtain moving beside a real winter window. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "lemon-tea-loaf",
        "name": "Lemon Tea Loaf",
        "scene": "A homemade lemon loaf on a plain plate with a lived-in kitchen beyond. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "garden-welcome",
        "name": "Garden Welcome",
        "scene": "A modest community-garden entrance with early spring flowers and ordinary empty benches. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "petal-paper-making",
        "name": "Petal Paper Making",
        "scene": "Homemade pink paper with embedded petals beside a plain wooden paper frame. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "cyclamen-raindrops",
        "name": "Cyclamen Raindrops",
        "scene": "Natural rain droplets on low pink cyclamen beside an ordinary brick path. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "sewn-heart-patch",
        "name": "Sewn Heart Patch",
        "scene": "A small handmade heart-shaped cotton patch sewn onto a plain tote bag. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "music-room-duet",
        "name": "Music Room Duet",
        "scene": "An empty modest music room through its door with guitar and small keyboard. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "coastal-winter-cafe",
        "name": "Coastal Winter Cafe",
        "scene": "An ordinary small coastal cafe exterior on a pale February day without branding. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "home-dessert-nook",
        "name": "Home Dessert Nook",
        "scene": "A modest dessert nook with two mismatched chairs viewed from a real upper landing. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "knotted-cotton-bracelet",
        "name": "Knotted Cotton Bracelet",
        "scene": "A simple knotted rose-cotton bracelet beside plain gift paper and blank card. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "potted-jasmine",
        "name": "Potted Jasmine",
        "scene": "Natural pale-pink jasmine buds climbing in a modest home conservatory. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "sharing-cookie-tin",
        "name": "Sharing Cookie Tin",
        "scene": "A tin of homemade heart biscuits beside a quiet neighborhood front door. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "st-patricks-day",
    "name": "St. Patrick’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 3,
      "day": 17,
      "duration": 1
    },
    "palettes": [
      "moss",
      "evergreen",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Saint Patricks Irish March shamrock",
    "designs": [
      {
        "slug": "green-table",
        "name": "Green Table",
        "scene": "A casual table with a green linen runner and small potted shamrocks"
      },
      {
        "slug": "soda-bread",
        "name": "Soda Bread",
        "scene": "A homemade loaf of Irish soda bread and butter in an ordinary kitchen"
      },
      {
        "slug": "spring-clover",
        "name": "Spring Clover",
        "scene": "Close view of real clover growing beside a weathered stone wall"
      },
      {
        "slug": "neighborhood-supper",
        "name": "Neighborhood Supper",
        "scene": "A modest community supper table with green napkins and plain dishes"
      },
      {
        "slug": "irish-tea",
        "name": "Irish Tea",
        "scene": "A pot of tea and simple biscuits beside a green wool scarf"
      },
      {
        "slug": "music-evening",
        "name": "Music Evening",
        "scene": "An acoustic fiddle and a small wooden flute on a chair in a community room"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple outdoor table beside early spring greenery"
      },
      {
        "slug": "paper-garland",
        "name": "Paper Garland",
        "scene": "Handmade green paper garlands above a classroom craft table"
      },
      {
        "slug": "pot-of-clover",
        "name": "Pot of Clover",
        "scene": "A terracotta pot of shamrocks on a kitchen windowsill"
      },
      {
        "slug": "local-gathering",
        "name": "Local Gathering",
        "scene": "An ordinary cozy cafe corner with subtle green decorations, no alcohol branding"
      },
      {
        "slug": "community-music-hall",
        "name": "Community Music Hall",
        "scene": "An empty modest music hall with fiddle, wooden flute and restrained green cotton. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "soda-bread-ingredients",
        "name": "Soda Bread Ingredients",
        "scene": "Flour, raisins and plain buttermilk bowl beside a wooden spoon. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "clover-stone-path",
        "name": "Clover Stone Path",
        "scene": "Real three-leaf clover growing between old garden stones after spring rain. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "green-wool-stitch",
        "name": "Green Wool Stitch",
        "scene": "Uneven stitches in a handmade green scarf over an ordinary chair rail. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "neighborhood-tea-room",
        "name": "Neighborhood Tea Room",
        "scene": "A modest unbranded tea room through its door, plain cups and homemade scones. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "rainy-green-hills",
        "name": "Rainy Green Hills",
        "scene": "Ordinary green pastoral hills and stone walls beneath pale March cloud. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-shamrock-pots",
        "name": "Courtyard Shamrock Pots",
        "scene": "Potted shamrocks in a plain courtyard seen from an upper window. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "bodhran-rest",
        "name": "Bodhran Rest",
        "scene": "A plain unbranded bodhran drum beside an ordinary community-room chair. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "budding-ash-branch",
        "name": "Budding Ash Branch",
        "scene": "Early ash buds above a weathered stone wall against overcast spring sky. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "oatcake-basket",
        "name": "Oatcake Basket",
        "scene": "Homemade oatcakes in a plain basket beside a modest tea-room doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-supper-kitchen",
        "name": "Community Supper Kitchen",
        "scene": "An empty practical community kitchen with soup pots and plain green towels. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "paper-shamrocks",
        "name": "Paper Shamrocks",
        "scene": "Hand-cut green paper shamrocks, scissors and string on an ordinary craft mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "rain-boot-clover",
        "name": "Rain Boot Clover",
        "scene": "Muddy wellington boots beside a naturally clover-covered garden edge. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "potato-bread-crust",
        "name": "Potato Bread Crust",
        "scene": "Uneven homemade potato-bread crust beside a plain linen towel. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "spring-garden-gate",
        "name": "Spring Garden Gate",
        "scene": "An open ordinary garden gate framing spring greenery and potted clover. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "village-stone-bridge",
        "name": "Village Stone Bridge",
        "scene": "A small ordinary stone bridge over a gentle stream in green March countryside. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "library-music-corner",
        "name": "Library Music Corner",
        "scene": "A modest library gathering corner with plain acoustic instruments. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "tin-whistle-case",
        "name": "Tin Whistle Case",
        "scene": "A plain tin whistle beside a cloth pouch and wooden stand without notation. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "green-paper-fans",
        "name": "Green Paper Fans",
        "scene": "Handmade plain green paper fans beneath an ordinary community veranda. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "irish-apple-cake",
        "name": "Irish Apple Cake",
        "scene": "Homemade apple cake on a plain plate beside an ordinary rainy kitchen window. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "local-seed-swap",
        "name": "Local Seed Swap",
        "scene": "A modest seed-swap setup with unlabelled packets and potted shamrocks. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "green-cotton-mending",
        "name": "Green Cotton Mending",
        "scene": "Green scraps, thread and a mended plain tote bag on a work surface. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "mossy-garden-steps",
        "name": "Mossy Garden Steps",
        "scene": "Real moss on old stone steps beside fresh spring clover. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "teapot-steam",
        "name": "Teapot Steam",
        "scene": "A plain ceramic teapot steaming beside ordinary green wool. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-dance-room",
        "name": "Community Dance Room",
        "scene": "An empty modest dance room through its doorway, plain floor and simple fiddle case. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "spring-canal-walk",
        "name": "Spring Canal Walk",
        "scene": "An ordinary quiet canal towpath with green grass and modest stone bridges. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "small-home-supper",
        "name": "Small Home Supper",
        "scene": "A simple supper setup with plain green napkins seen from an upper doorway. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "butter-crock",
        "name": "Butter Crock",
        "scene": "A plain butter crock beside sliced soda bread on an ordinary kitchen shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "willow-catkins",
        "name": "Willow Catkins",
        "scene": "Natural willow catkins above a modest stream beside an ordinary garden. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "rainy-picnic-thermos",
        "name": "Rainy Picnic Thermos",
        "scene": "A plain tea thermos beside a green checked cloth under a modest shelter. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-pottery",
        "name": "Neighborhood Pottery",
        "scene": "An empty practical studio with handmade green-glazed mugs and ordinary tools. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "colcannon-preparation",
        "name": "Colcannon Preparation",
        "scene": "Mashed potatoes, fresh cabbage and plain utensils for homemade colcannon. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "potted-clover",
        "name": "Potted Clover",
        "scene": "A terracotta shamrock pot on wet paving beside a modest home entrance. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "fiddle-scroll",
        "name": "Fiddle Scroll",
        "scene": "A worn unbranded fiddle scroll against an ordinary community-room background. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bookshop-tea-alcove",
        "name": "Bookshop Tea Alcove",
        "scene": "A modest tea alcove through its doorway, unlettered books and plain green cups. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "meadow-gate-march",
        "name": "Meadow Gate March",
        "scene": "An ordinary wooden gate opening onto green meadow under pale spring cloud. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "school-craft-corner",
        "name": "School Craft Corner",
        "scene": "A modest school craft area with simple green paper decorations. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "knitted-tea-cozy",
        "name": "Knitted Tea Cozy",
        "scene": "A handmade green wool tea cozy beside ordinary scones and plain china. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "greenhouse-ivy",
        "name": "Greenhouse Ivy",
        "scene": "Natural ivy climbing a modest greenhouse's ordinary timber frame. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "seed-basket",
        "name": "Seed Basket",
        "scene": "A small basket of plain packets and potted shamrocks beside a community garden gate. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-reading-room",
        "name": "Community Reading Room",
        "scene": "An empty modest reading room with unlettered books and a small clover pot. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "shamrock-biscuits",
        "name": "Shamrock Biscuits",
        "scene": "Homemade shamrock biscuits with restrained green icing on plain parchment. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "streamside-ferns",
        "name": "Streamside Ferns",
        "scene": "Real young ferns beside an ordinary shallow stream and stone wall. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "handwoven-wool",
        "name": "Handwoven Wool",
        "scene": "Unfinished green wool weaving with irregular fibers beside a plain wooden loom. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "home-baking-door",
        "name": "Home Baking Door",
        "scene": "A lived-in kitchen through its doorway with homemade brown bread and plain tea tray. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "coastal-field-walls",
        "name": "Coastal Field Walls",
        "scene": "Ordinary green coastal fields divided by stone walls under pale March sky. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-music-rehearsal",
        "name": "Courtyard Music Rehearsal",
        "scene": "Empty chairs and modest acoustic instruments in a sheltered courtyard. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "ribbon-rosette-spools",
        "name": "Ribbon Rosette Spools",
        "scene": "Green cotton ribbon spools beside paper rosettes and simple scissors. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "clover-window-sill",
        "name": "Clover Window Sill",
        "scene": "A real potted shamrock on a slightly weathered kitchen windowsill. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "supper-sharing-parcel",
        "name": "Supper Sharing Parcel",
        "scene": "A reusable container of homemade vegetable stew beside a community-hall entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "mardi-gras",
    "name": "Mardi Gras",
    "kind": "Celebrations",
    "date": {
      "kind": "easter",
      "offset": -47
    },
    "palettes": [
      "plum",
      "evergreen",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Mardi Gras Fat Tuesday carnival",
    "designs": [
      {
        "slug": "king-cake",
        "name": "King Cake",
        "scene": "A homemade ring-shaped king cake with modest purple green and gold sugar"
      },
      {
        "slug": "paper-carnival",
        "name": "Paper Carnival",
        "scene": "Handmade purple green and gold paper garlands on a community table"
      },
      {
        "slug": "brass-afternoon",
        "name": "Brass Afternoon",
        "scene": "An unbranded brass trumpet on a worn wooden chair beside a window"
      },
      {
        "slug": "porch-colors",
        "name": "Porch Colors",
        "scene": "A modest neighborhood porch with a few purple green and gold ribbons"
      },
      {
        "slug": "carnival-table",
        "name": "Carnival Table",
        "scene": "Plain plates, a simple cake and folded colorful napkins for a small gathering"
      },
      {
        "slug": "handmade-masks",
        "name": "Handmade Masks",
        "scene": "Simple paper carnival masks and craft supplies without faces"
      },
      {
        "slug": "neighborhood-music",
        "name": "Neighborhood Music",
        "scene": "A small outdoor music setup with drums and brass instruments, no people"
      },
      {
        "slug": "ribbon-workshop",
        "name": "Ribbon Workshop",
        "scene": "Spools of colored ribbon and scissors on a craft table"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Everyday serving dishes on a table with understated carnival decorations"
      },
      {
        "slug": "courtyard-gathering",
        "name": "Courtyard Gathering",
        "scene": "A modest brick courtyard with folding chairs and small paper lanterns"
      },
      {
        "slug": "neighborhood-brass-room",
        "name": "Neighborhood Brass Room",
        "scene": "An empty modest brass-rehearsal room with plain chairs and ordinary instruments. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "king-cake-dough",
        "name": "King Cake Dough",
        "scene": "A homemade dough ring beside purple green and gold sugar in plain bowls. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "courtyard-confetti",
        "name": "Courtyard Confetti",
        "scene": "A little handmade colored-paper confetti on ordinary wet brick courtyard paving. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "trombone-brass-wear",
        "name": "Trombone Brass Wear",
        "scene": "Worn natural brass on an unbranded trombone beside an ordinary chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-costume-room",
        "name": "Community Costume Room",
        "scene": "An empty costume workroom through its door, plain fabrics and simple paper masks. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "brick-neighborhood-balconies",
        "name": "Brick Neighborhood Balconies",
        "scene": "Ordinary modest brick balconies with restrained purple green and gold ribbons. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "courtyard-gathering-setup",
        "name": "Courtyard Gathering Setup",
        "scene": "A modest courtyard with loose chairs and simple colored paper fans. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "beignet-cooling",
        "name": "Beignet Cooling",
        "scene": "Homemade beignets cooling beside plain coffee in an everyday kitchen. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "carnival-ribbon-canopy",
        "name": "Carnival Ribbon Canopy",
        "scene": "A few plain purple green and gold ribbons beneath an ordinary porch roof. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "gumbo-sharing-container",
        "name": "Gumbo Sharing Container",
        "scene": "A reusable homemade vegetable-gumbo container beside a modest community doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-paper-workshop",
        "name": "Community Paper Workshop",
        "scene": "An empty practical craft room with paper rosettes and ordinary tools. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "carnival-mask-materials",
        "name": "Carnival Mask Materials",
        "scene": "Simple card masks, plain purple paper and string on a craft mat. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "tuba-case-rest",
        "name": "Tuba Case Rest",
        "scene": "An unbranded tuba case beside a modest rehearsal-room entrance. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "sugar-cake-crust",
        "name": "Sugar Cake Crust",
        "scene": "Purple green and gold sugar on uneven homemade king-cake crust. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "courtyard-music-door",
        "name": "Courtyard Music Door",
        "scene": "A modest music room through a courtyard door, plain drums and brass instruments. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "quiet-carnival-street",
        "name": "Quiet Carnival Street",
        "scene": "An ordinary empty street with restrained handmade carnival porch ribbons. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "kitchen-carnival-prep",
        "name": "Kitchen Carnival Prep",
        "scene": "A practical community kitchen with plain pots and modest homemade carnival food. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "paper-lantern-assembly",
        "name": "Paper Lantern Assembly",
        "scene": "A handmade purple lantern frame beside cotton string and unlettered paper. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "brass-room-ceiling",
        "name": "Brass Room Ceiling",
        "scene": "Practical ceiling lamps above ordinary instruments without theatrical lighting. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "praline-parcel",
        "name": "Praline Parcel",
        "scene": "Homemade pralines in a plain bag beside an ordinary kitchen doorway. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "neighborhood-sewing-studio",
        "name": "Neighborhood Sewing Studio",
        "scene": "An empty modest studio with purple green and gold cotton and practical machines. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "ribbon-rosette-weaving",
        "name": "Ribbon Rosette Weaving",
        "scene": "Plain ribbons partly woven into simple rosettes beside ordinary scissors. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "rainy-carnival-step",
        "name": "Rainy Carnival Step",
        "scene": "A weathered step with simple colored paper fan and natural rain droplets. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "clarinet-keys",
        "name": "Clarinet Keys",
        "scene": "Worn keys on a plain unbranded clarinet inside an ordinary open case. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "community-supper-hall",
        "name": "Community Supper Hall",
        "scene": "An empty supper hall through its door, plain bowls and small colored decorations. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "riverside-carnival-lights",
        "name": "Riverside Carnival Lights",
        "scene": "An ordinary riverside neighborhood at blue hour with practical lights and restrained ribbons. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "balcony-craft-drying",
        "name": "Balcony Craft Drying",
        "scene": "Handmade colored-paper decorations drying across a modest courtyard viewed from above. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "wooden-drumsticks",
        "name": "Wooden Drumsticks",
        "scene": "Worn plain drumsticks beside an ordinary practice drum in a community corner. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "garden-paper-fans",
        "name": "Garden Paper Fans",
        "scene": "A few handmade colored fans beneath a modest garden shelter. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "coffee-and-beignets",
        "name": "Coffee And Beignets",
        "scene": "Plain coffee and homemade beignets beside an ordinary rainy neighborhood window. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "community-music-storage",
        "name": "Community Music Storage",
        "scene": "A practical instrument room with ordinary brass instruments and plain cloths. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "felt-carnival-shapes",
        "name": "Felt Carnival Shapes",
        "scene": "Plain colored felt shapes beside cotton thread and sewing scissors. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "sidewalk-ribbon-ends",
        "name": "Sidewalk Ribbon Ends",
        "scene": "Short colored ribbon offcuts beside a weathered porch post on ordinary paving. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "mask-paper-texture",
        "name": "Mask Paper Texture",
        "scene": "An imperfect cut edge of a simple paper mask without faces or embellishment. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "king-cake-kitchen",
        "name": "King Cake Kitchen",
        "scene": "A lived-in kitchen through its doorway with homemade king cake and mixing bowls. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "garden-carnival-pavilion",
        "name": "Garden Carnival Pavilion",
        "scene": "An empty modest pavilion with restrained paper garlands beneath pale winter cloud. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "rehearsal-chair-circle",
        "name": "Rehearsal Chair Circle",
        "scene": "Empty plain chairs and acoustic instruments in a modest rehearsal room. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "cotton-costume-apron",
        "name": "Cotton Costume Apron",
        "scene": "A handmade purple apron hanging beside plain green and gold cotton. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "courtyard-lanterns",
        "name": "Courtyard Lanterns",
        "scene": "Ordinary muted carnival-color lanterns above a modest brick courtyard. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "sweet-bread-parcel",
        "name": "Sweet Bread Parcel",
        "scene": "A plain paper parcel of homemade sweet bread beside a community entrance. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      },
      {
        "slug": "school-carnival-workshop",
        "name": "School Carnival Workshop",
        "scene": "An empty modest school craft room with simple unlettered carnival materials. Camera: a broad eye-level environmental view, real surroundings and deep natural focus."
      },
      {
        "slug": "savory-hand-pies",
        "name": "Savory Hand Pies",
        "scene": "Homemade savory hand pies on parchment beside a modest purple cotton napkin. Camera: true overhead, straight down, honest texture and organic irregular spacing."
      },
      {
        "slug": "porch-purple-flowers",
        "name": "Porch Purple Flowers",
        "scene": "Ordinary purple flower pots beside a modest porch with small green and gold ribbon. Camera: very low near ground level, with a clearly visible real background."
      },
      {
        "slug": "bass-drum-skin",
        "name": "Bass Drum Skin",
        "scene": "Worn natural skin on an unbranded bass drum beside an ordinary wooden chair. Camera: a close documentary detail retaining legible surrounding context, no excessive bokeh."
      },
      {
        "slug": "bakery-back-door",
        "name": "Bakery Back Door",
        "scene": "A neighborhood bakery through its back door with homemade carnival rolls and no branding. Camera: through an ordinary open doorway or gate, framing the complete real scene."
      },
      {
        "slug": "small-courtyard-dusk",
        "name": "Small Courtyard Dusk",
        "scene": "A quiet modest courtyard at dusk with a few handmade paper decorations. Camera: a restrained long-lens view from a genuine distance, compressing the setting layers."
      },
      {
        "slug": "community-craft-floor",
        "name": "Community Craft Floor",
        "scene": "Plain craft baskets and colored paper materials loosely arranged in a modest studio. Camera: a high oblique view from a believable upper window or small lookout."
      },
      {
        "slug": "green-gold-thread",
        "name": "Green Gold Thread",
        "scene": "Green and gold cotton thread beside a simple purple fabric pouch on a sewing shelf. Camera: side-on at human scale, emphasizing profile and actual setting depth."
      },
      {
        "slug": "weathered-porch-brackets",
        "name": "Weathered Porch Brackets",
        "scene": "Weathered porch brackets with a few restrained purple green and gold ribbons. Camera: look upward from a natural standing position with realistic perspective."
      },
      {
        "slug": "carnival-cleanup-basket",
        "name": "Carnival Cleanup Basket",
        "scene": "A basket of reusable colored decorations beside an ordinary courtyard after a gathering. Camera: a near foreground detail leads toward a legible wider setting, moderate depth of field."
      }
    ]
  },
  {
    "id": "easter",
    "name": "Easter",
    "kind": "Celebrations",
    "date": {
      "kind": "easter"
    },
    "palettes": [
      "lavender",
      "sage",
      "apricot"
    ],
    "purpose": "celebration",
    "aliases": "Easter Sunday spring egg hunt",
    "designs": [
      {
        "slug": "garden-egg-hunt",
        "name": "Garden Egg Hunt",
        "scene": "A few naturally dyed eggs partly hidden in uneven spring grass"
      },
      {
        "slug": "spring-basket",
        "name": "Spring Basket",
        "scene": "A wicker basket with softly colored eggs and a simple linen cloth"
      },
      {
        "slug": "easter-brunch",
        "name": "Easter Brunch",
        "scene": "A modest brunch table with daffodils, bread and boiled eggs"
      },
      {
        "slug": "quiet-morning",
        "name": "Quiet Morning",
        "scene": "White lilies beside a plain wooden cross in a softly lit church alcove"
      },
      {
        "slug": "painted-eggs",
        "name": "Painted Eggs",
        "scene": "Hand-painted eggs with imperfect marks drying on a kitchen table"
      },
      {
        "slug": "garden-table",
        "name": "Garden Table",
        "scene": "A simple outdoor spring table with tulips and pale napkins"
      },
      {
        "slug": "spring-baking",
        "name": "Spring Baking",
        "scene": "Homemade hot cross buns on a cooling rack in a kitchen"
      },
      {
        "slug": "daffodil-path",
        "name": "Daffodil Path",
        "scene": "Daffodils growing beside a weathered garden gate"
      },
      {
        "slug": "community-hunt",
        "name": "Community Hunt",
        "scene": "Small baskets and a few scattered pastel eggs in a neighborhood park"
      },
      {
        "slug": "family-lunch",
        "name": "Family Lunch",
        "scene": "A modest family lunch setting with spring greenery and plain white plates"
      },
      {
        "slug": "meadow-sunrise",
        "name": "Meadow Sunrise",
        "scene": "A rabbit pauses among dew-covered daisies at sunrise, photographed at grass height with distant hills dissolving into mist"
      },
      {
        "slug": "bell-tower-morning",
        "name": "Bell Tower Morning",
        "scene": "An old church bell tower rises above flowering street trees, low architectural angle against a pale Easter morning sky"
      },
      {
        "slug": "orchard-egg-hunt",
        "name": "Orchard Egg Hunt",
        "scene": "Children in ordinary spring clothes search beneath blooming apple trees, wide candid composition with baskets small in the frame"
      },
      {
        "slug": "chick-at-the-fence",
        "name": "Chick at the Fence",
        "scene": "A newly hatched chick peeks through a weathered farm fence, intimate eye-level detail with natural straw behind it"
      },
      {
        "slug": "rain-on-the-tulips",
        "name": "Rain on the Tulips",
        "scene": "Raindrops gather on closed yellow tulips outside a garden gate, tight side-lit botanical photograph after a spring shower"
      },
      {
        "slug": "easter-bonnet-parade",
        "name": "Easter Bonnet Parade",
        "scene": "Handmade floral bonnets move through a small neighborhood parade, rear three-quarter street view with joyful spring color"
      },
      {
        "slug": "stone-chapel-door",
        "name": "Stone Chapel Door",
        "scene": "A wooden chapel door stands open onto a sunlit spring garden, photographed from the dim stone vestibule"
      },
      {
        "slug": "daffodil-riverbank",
        "name": "Daffodil Riverbank",
        "scene": "A winding riverbank lined with daffodils and old willows, elevated landscape view with one distant footbridge"
      },
      {
        "slug": "painted-egg-mobile",
        "name": "Painted Egg Mobile",
        "scene": "Painted wooden eggs hang at different heights from a real budding branch outdoors, upward view into a blue spring sky"
      },
      {
        "slug": "bunny-burrow",
        "name": "Bunny Burrow",
        "scene": "Two rabbit ears appear at the entrance of a natural grassy burrow, low telephoto view with rich earth texture"
      },
      {
        "slug": "sunrise-gathering",
        "name": "Sunrise Gathering",
        "scene": "A modest Easter sunrise gathering on a grassy hillside, distant silhouettes facing the first light without identifiable faces"
      },
      {
        "slug": "lamb-in-the-orchard",
        "name": "Lamb in the Orchard",
        "scene": "A young lamb walks through fallen cherry petals, animal-eye-level photograph with an old orchard gate behind it"
      },
      {
        "slug": "pastel-kite",
        "name": "Pastel Kite",
        "scene": "A pale coral kite floats over an Easter picnic field, wide sky-heavy composition with its string leading to a small child below"
      },
      {
        "slug": "eggshell-seedlings",
        "name": "Eggshell Seedlings",
        "scene": "A row of eggshell planters holds tiny new seedlings on an outdoor potting ledge, close oblique view of roots and cracked shells"
      },
      {
        "slug": "spring-footbridge",
        "name": "Spring Footbridge",
        "scene": "A small wooden bridge crosses a stream under white blossom, framed through a foreground willow branch"
      },
      {
        "slug": "churchyard-blossoms",
        "name": "Churchyard Blossoms",
        "scene": "Pink petals collect around an old stone churchyard path, downward view with soft shoes passing at the edge"
      },
      {
        "slug": "carrot-harvest",
        "name": "Carrot Harvest",
        "scene": "A gardener lifts a bunch of muddy carrots from a raised bed, close candid view of hands, soil and feathery leaves"
      },
      {
        "slug": "easter-window-light",
        "name": "Easter Window Light",
        "scene": "A stained-glass church window casts soft colored light across an empty aisle, long interior perspective with quiet atmosphere"
      },
      {
        "slug": "basket-on-the-bicycle",
        "name": "Basket on the Bicycle",
        "scene": "A wicker bicycle basket carries spring flowers and a few painted eggs, cropped street-level view beside a stone wall"
      },
      {
        "slug": "pond-ducklings",
        "name": "Pond Ducklings",
        "scene": "A line of ducklings makes tiny ripples across a spring pond, high-angle wildlife photograph with reflected willow green"
      },
      {
        "slug": "ribboned-garden-arch",
        "name": "Ribboned Garden Arch",
        "scene": "Pale ribbons flutter from a simple garden arch above a path of blossoms, symmetrical approach view without staged furniture"
      },
      {
        "slug": "easter-sand-sculpture",
        "name": "Easter Sand Sculpture",
        "scene": "A small rabbit-shaped sand sculpture stands on a quiet beach, low seaward angle with real tide marks and morning clouds"
      },
      {
        "slug": "chocolate-hare-detail",
        "name": "Chocolate Hare Detail",
        "scene": "A single artisan chocolate hare with a broken ear and visible chocolate texture, dark close-up with natural window edge light"
      },
      {
        "slug": "hyacinth-steps",
        "name": "Hyacinth Steps",
        "scene": "Terracotta pots of purple hyacinths climb a worn outdoor staircase, diagonal architectural composition with weathered stone"
      },
      {
        "slug": "petal-confetti",
        "name": "Petal Confetti",
        "scene": "A child tosses fallen pink petals upward under a blossom tree, candid waist-height capture with petals frozen in sunlight"
      },
      {
        "slug": "springtime-train",
        "name": "Springtime Train",
        "scene": "A small heritage train passes an embankment covered in spring flowers, wide environmental photograph from across the meadow"
      },
      {
        "slug": "woven-willow-nest",
        "name": "Woven Willow Nest",
        "scene": "A nest of naturally woven willow holds three speckled eggs in a hedge, careful close detail without disturbing wildlife"
      },
      {
        "slug": "easter-service-coats",
        "name": "Easter Service Coats",
        "scene": "Spring coats and simple straw hats hang beside an open chapel doorway, human-scale interior view toward bright outdoor light"
      },
      {
        "slug": "bluebell-trail",
        "name": "Bluebell Trail",
        "scene": "A narrow trail disappears through a bluebell woodland, ground-level leading lines beneath fresh green leaves"
      },
      {
        "slug": "hidden-garden-egg",
        "name": "Hidden Garden Egg",
        "scene": "One small painted egg rests in the fork of an old apple tree, upward close view with blossom and rough bark"
      },
      {
        "slug": "puppy-with-ribbon",
        "name": "Puppy with Ribbon",
        "scene": "A muddy-pawed puppy wears a loose pale yellow ribbon while exploring spring grass, playful eye-level candid photograph"
      },
      {
        "slug": "easter-courtyard-fountain",
        "name": "Easter Courtyard Fountain",
        "scene": "A modest courtyard fountain is surrounded by lilies in pots, wide view through an iron gate in early morning light"
      },
      {
        "slug": "windy-hill-cross",
        "name": "Windy Hill Cross",
        "scene": "A simple unadorned wooden cross stands on a grassy hill above a distant village, respectful wide landscape at dawn"
      },
      {
        "slug": "spring-umbrellas",
        "name": "Spring Umbrellas",
        "scene": "Three pastel umbrellas lean open beside rain-darkened garden steps, overhead geometric composition with scattered petals"
      },
      {
        "slug": "bees-in-the-blossom",
        "name": "Bees in the Blossom",
        "scene": "Honeybees visit a cluster of flowering pear branches, macro photograph with pale cream blossoms and a soft blue background"
      },
      {
        "slug": "petal-boat",
        "name": "Petal Boat",
        "scene": "A tiny folded paper boat carrying one painted egg floats along a shallow garden rill, water-level close composition"
      },
      {
        "slug": "garden-maze-hunt",
        "name": "Garden Maze Hunt",
        "scene": "An Easter egg hunt unfolds inside a low clipped hedge maze, high oblique view showing its winding paths"
      },
      {
        "slug": "little-boots",
        "name": "Little Boots",
        "scene": "Muddy yellow rain boots stand beside a small basket on a garden path, low close photograph with tulips rising behind them"
      },
      {
        "slug": "easter-choir-rehearsal",
        "name": "Easter Choir Rehearsal",
        "scene": "An empty rehearsal room holds music stands and pale choir robes, doorway composition in soft morning light with no readable notation"
      },
      {
        "slug": "lilies-by-the-window",
        "name": "Lilies by the Window",
        "scene": "White Easter lilies reach toward a tall open window, upward close composition emphasizing translucent petals"
      },
      {
        "slug": "beach-pebble-eggs",
        "name": "Beach Pebble Eggs",
        "scene": "Oval seaside pebbles painted with subtle spring colors lie along a wet shoreline, overhead view with a retreating wave"
      },
      {
        "slug": "hare-on-the-ridge",
        "name": "Hare on the Ridge",
        "scene": "A real hare stands alert on a green ridge at golden hour, long-lens wildlife view with distant patchwork fields"
      },
      {
        "slug": "community-flower-cross",
        "name": "Community Flower Cross",
        "scene": "Fresh spring flowers cover a freestanding community church cross outdoors, full-height photograph against a simple brick wall"
      },
      {
        "slug": "blossom-picnic-blanket",
        "name": "Blossom Picnic Blanket",
        "scene": "An empty checked blanket lies beneath a flowering tree with a book and fallen petals, high wide view with generous spring grass"
      },
      {
        "slug": "easter-porch-swing",
        "name": "Easter Porch Swing",
        "scene": "A porch swing draped with a light quilt holds a small flower basket, side view with moving blossom shadows"
      },
      {
        "slug": "spring-butterfly-house",
        "name": "Spring Butterfly House",
        "scene": "A butterfly rests on a child's empty wicker basket in a glasshouse, close focus with lush plants and condensation behind it"
      },
      {
        "slug": "birdhouse-welcome",
        "name": "Birdhouse Welcome",
        "scene": "A small unpainted birdhouse hangs among budding branches with one bird arriving, upward telephoto capture in fresh daylight"
      },
      {
        "slug": "egg-rolling-slope",
        "name": "Egg Rolling Slope",
        "scene": "Colorful hard-boiled eggs roll down a grassy slope toward laughing children, low action photograph with believable motion"
      },
      {
        "slug": "quiet-easter-harbor",
        "name": "Quiet Easter Harbor",
        "scene": "Fishing boats sit in a pastel dawn harbor beside blooming window boxes, broad waterfront view with calm reflected color"
      },
      {
        "slug": "after-the-hunt",
        "name": "After the Hunt",
        "scene": "A line of small muddy footprints leads past empty baskets to an open garden gate, downward environmental view after an Easter hunt"
      }
    ]
  },
  {
    "id": "mothers-day",
    "name": "Mother’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 5,
      "weekday": 0,
      "occurrence": 2
    },
    "palettes": [
      "rose",
      "sage",
      "lavender"
    ],
    "purpose": "celebration",
    "aliases": "Mothers Day mom mum May brunch",
    "designs": [
      {
        "slug": "garden-brunch",
        "name": "Garden Brunch",
        "scene": "A small garden table with tea, toast and an informal bouquet"
      },
      {
        "slug": "peony-morning",
        "name": "Peony Morning",
        "scene": "A few peonies in a glass jar on a kitchen windowsill"
      },
      {
        "slug": "breakfast-tray",
        "name": "Breakfast Tray",
        "scene": "A simple breakfast tray with coffee and homemade toast"
      },
      {
        "slug": "tea-together",
        "name": "Tea Together",
        "scene": "Mismatched teacups and a homemade cake on a dining table"
      },
      {
        "slug": "handmade-bouquet",
        "name": "Handmade Bouquet",
        "scene": "An informal bunch of garden flowers tied with plain string"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "A modest kitchen counter with a mixing bowl and a fresh cake"
      },
      {
        "slug": "porch-afternoon",
        "name": "Porch Afternoon",
        "scene": "Two porch chairs and a small vase of spring flowers"
      },
      {
        "slug": "garden-walk",
        "name": "Garden Walk",
        "scene": "A quiet garden path lined with irises and green foliage"
      },
      {
        "slug": "crafted-with-love",
        "name": "Crafted with Love",
        "scene": "Blank folded cards, colored pencils and pressed flowers on a table"
      },
      {
        "slug": "sunday-lunch",
        "name": "Sunday Lunch",
        "scene": "A simple lunch table with cloth napkins and natural garden cuttings"
      },
      {
        "slug": "three-generations-walking",
        "name": "Three Generations Walking",
        "scene": "Three generations walk arm in arm along a coastal path, candid wide photograph from behind with wind moving their coats"
      },
      {
        "slug": "peony-unfolding",
        "name": "Peony Unfolding",
        "scene": "A single peony opens in a garden after rain, macro side view of layered petals and droplets without a vase"
      },
      {
        "slug": "morning-swim-together",
        "name": "Morning Swim Together",
        "scene": "A mother and adult daughter stand beside a quiet outdoor pool at sunrise, distant environmental photograph with clear reflections"
      },
      {
        "slug": "the-old-photo-album",
        "name": "The Old Photo Album",
        "scene": "Hands of two generations turn a worn family photo album on a lap, intimate overhead detail with photographs indistinct"
      },
      {
        "slug": "garden-gate-welcome",
        "name": "Garden Gate Welcome",
        "scene": "A child holds a small bunch of wildflowers behind their back while waiting at a garden gate, candid low-angle view"
      },
      {
        "slug": "a-day-on-the-water",
        "name": "A Day on the Water",
        "scene": "A mother and child paddle a small canoe across a calm lake, high distant view with reeds and soft mountain reflections"
      },
      {
        "slug": "rose-arbor-stroll",
        "name": "Rose Arbor Stroll",
        "scene": "Two women walk beneath a climbing-rose arch in a public garden, long-lens view framed by blossoms"
      },
      {
        "slug": "first-bicycle-ride",
        "name": "First Bicycle Ride",
        "scene": "A mother steadies a child learning to ride a bicycle along a park path, low side-on action photograph in afternoon sun"
      },
      {
        "slug": "dancing-in-the-sitting-room",
        "name": "Dancing in the Sitting Room",
        "scene": "A mother dances barefoot with a small child in an ordinary sitting room, doorway view with warm window light"
      },
      {
        "slug": "orchid-at-dawn",
        "name": "Orchid at Dawn",
        "scene": "A purple orchid blooms against a misted greenhouse pane, elegant close botanical photograph with soft morning backlight"
      },
      {
        "slug": "shared-headphones",
        "name": "Shared Headphones",
        "scene": "A mother and teenager share headphones on a railway platform bench, candid medium view with the train softly blurred"
      },
      {
        "slug": "a-window-hug",
        "name": "A Window Hug",
        "scene": "A child hugs a mother silhouetted in a bright upstairs window, respectful exterior street view with spring branches"
      },
      {
        "slug": "wildflower-hill",
        "name": "Wildflower Hill",
        "scene": "A family climbs a wildflower-covered hillside with a picnic blanket over one shoulder, expansive landscape from below"
      },
      {
        "slug": "handwritten-envelope",
        "name": "Handwritten Envelope",
        "scene": "A small unlettered envelope tucked into a well-worn handbag beside a single tulip, intimate top-down personal detail"
      },
      {
        "slug": "pottery-wheel-lesson",
        "name": "Pottery Wheel Lesson",
        "scene": "A mother and adult child shape one clay bowl together on a pottery wheel, close candid view of clay-covered hands"
      },
      {
        "slug": "shelter-dog-walk",
        "name": "Shelter Dog Walk",
        "scene": "A mother and daughter walk an adopted dog through a leafy neighborhood, low street view with the dog's happy movement"
      },
      {
        "slug": "rooftop-sunset",
        "name": "Rooftop Sunset",
        "scene": "Two generations share a quiet rooftop sunset beside container plants, wide composition with the city far below"
      },
      {
        "slug": "theatre-evening",
        "name": "Theatre Evening",
        "scene": "A mother and daughter in ordinary evening clothes climb the steps of a neighborhood theatre, candid rear view under warm lights"
      },
      {
        "slug": "grandmother-s-greenhouse",
        "name": "Grandmother's Greenhouse",
        "scene": "An older woman tends hanging plants in her small greenhouse, wide portrait through an open doorway with honest lived-in details"
      },
      {
        "slug": "sea-glass-collection",
        "name": "Sea Glass Collection",
        "scene": "Two hands of different ages compare pieces of sea glass over wet sand, close waterline view with a small breaking wave"
      },
      {
        "slug": "trailside-rest",
        "name": "Trailside Rest",
        "scene": "A mother and child rest on a fallen log during a woodland hike, environmental profile with shafts of natural light"
      },
      {
        "slug": "violin-duet",
        "name": "Violin Duet",
        "scene": "A mother and child rehearse a violin duet in a sunlit room, side view emphasizing their instruments and shared concentration"
      },
      {
        "slug": "rainy-day-shelter",
        "name": "Rainy Day Shelter",
        "scene": "A mother holds an umbrella over a child at a rainy bus stop, low candid street photograph with puddle reflections"
      },
      {
        "slug": "flower-market-outing",
        "name": "Flower Market Outing",
        "scene": "Two women browse wrapped stems at a neighborhood flower market, wide aisle composition with colorful flowers and no legible signs"
      },
      {
        "slug": "reading-on-the-hammock",
        "name": "Reading on the Hammock",
        "scene": "A mother reads to a child in a backyard hammock, photograph through soft foreground leaves with real spring light"
      },
      {
        "slug": "cherry-tree-embrace",
        "name": "Cherry Tree Embrace",
        "scene": "Two generations embrace beneath an old flowering cherry tree, distant full-body photograph with petals across the grass"
      },
      {
        "slug": "tide-pool-discovery",
        "name": "Tide Pool Discovery",
        "scene": "A mother kneels beside a child discovering a shallow tide pool, high oblique coastal view with tiny marine plants"
      },
      {
        "slug": "the-garden-apron",
        "name": "The Garden Apron",
        "scene": "A weathered gardening apron hangs on a gate beside freshly pulled radishes, close textural photograph in dappled sunlight"
      },
      {
        "slug": "station-reunion",
        "name": "Station Reunion",
        "scene": "An adult child greets their mother with a hug at a small train station, candid side view with luggage and natural motion"
      },
      {
        "slug": "painted-family-portrait",
        "name": "Painted Family Portrait",
        "scene": "A child's original abstract family painting dries on an easel in a sunny corner, eye-level still life with no readable writing"
      },
      {
        "slug": "a-shared-climb",
        "name": "A Shared Climb",
        "scene": "A mother and teenager reach the top of an indoor climbing wall together, low vertical photograph showing ropes and open space"
      },
      {
        "slug": "magnolia-branch",
        "name": "Magnolia Branch",
        "scene": "White magnolia blossoms extend across a weathered pink wall, spare architectural close view with strong spring shadows"
      },
      {
        "slug": "picnic-by-the-river",
        "name": "Picnic by the River",
        "scene": "A mother and grown children share an informal riverside picnic on grass, distant candid view framed by tall reeds"
      },
      {
        "slug": "coffee-shop-conversation",
        "name": "Coffee Shop Conversation",
        "scene": "Two generations talk across a small cafe window, photographed from the rainy pavement with layered reflections"
      },
      {
        "slug": "quilt-in-the-garden",
        "name": "Quilt in the Garden",
        "scene": "A handmade family quilt hangs from an outdoor washing line, low wide view with spring wind and blue sky"
      },
      {
        "slug": "saturday-bookshop",
        "name": "Saturday Bookshop",
        "scene": "A mother and child browse a narrow secondhand bookshop, rear aisle view with all book titles indistinct"
      },
      {
        "slug": "homecoming-footsteps",
        "name": "Homecoming Footsteps",
        "scene": "A small child's shoes run toward a pair of adult shoes at an open front door, low candid close view"
      },
      {
        "slug": "peach-blossom-bench",
        "name": "Peach Blossom Bench",
        "scene": "A quiet garden bench sits beneath a peach tree covered in pink blossom, wide tranquil composition in early morning haze"
      },
      {
        "slug": "city-bike-ride",
        "name": "City Bike Ride",
        "scene": "A mother and adult daughter ride upright bicycles beside a canal, side-on street photograph with soft spring reflections"
      },
      {
        "slug": "grandmother-s-hands",
        "name": "Grandmother's Hands",
        "scene": "An older woman's hands gently braid a child's hair, intimate close profile in honest natural light"
      },
      {
        "slug": "the-small-green-gift",
        "name": "The Small Green Gift",
        "scene": "A child offers a young potted lemon tree to their mother on a front step, candid waist-height photograph"
      },
      {
        "slug": "shared-binoculars",
        "name": "Shared Binoculars",
        "scene": "A mother points out birds while a child uses binoculars in a wetland hide, interior view through the observation opening"
      },
      {
        "slug": "sunflower-path",
        "name": "Sunflower Path",
        "scene": "Two women walk down a path between tall sunflowers, long perspective photographed at shoulder height"
      },
      {
        "slug": "everyday-hero-cape",
        "name": "Everyday Hero Cape",
        "scene": "A child gives their smiling mother a homemade cloth cape in an ordinary hallway, playful candid view through a doorway"
      },
      {
        "slug": "a-letter-by-the-sea",
        "name": "A Letter by the Sea",
        "scene": "A woman reads a folded unlettered sheet on a quiet seaside bench, broad profile composition with the horizon beyond"
      },
      {
        "slug": "evening-lantern-walk",
        "name": "Evening Lantern Walk",
        "scene": "A mother and child walk home carrying a single paper lantern at dusk, wide street photograph with subtle warm light"
      },
      {
        "slug": "apple-tree-planting",
        "name": "Apple Tree Planting",
        "scene": "Three generations plant a young apple tree in a backyard, documentary high angle with soil, roots and shared work visible"
      },
      {
        "slug": "a-mother-bird-s-nest",
        "name": "A Mother Bird's Nest",
        "scene": "A songbird shelters nestlings in a hedge nest, careful distant telephoto view with green spring bokeh"
      },
      {
        "slug": "open-studio-visit",
        "name": "Open Studio Visit",
        "scene": "A mother visits an adult child's light-filled art studio, wide doorway view with original canvases turned away"
      },
      {
        "slug": "the-long-goodbye",
        "name": "The Long Goodbye",
        "scene": "A mother waves from a front doorway as an adult child leaves with a suitcase, tender wide candid composition at golden hour"
      }
    ]
  },
  {
    "id": "fathers-day",
    "name": "Father’s Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 6,
      "weekday": 0,
      "occurrence": 3
    },
    "palettes": [
      "marine",
      "moss",
      "cocoa"
    ],
    "purpose": "celebration",
    "aliases": "Fathers Day dad June",
    "designs": [
      {
        "slug": "backyard-lunch",
        "name": "Backyard Lunch",
        "scene": "A modest backyard table with sandwiches and a pitcher of iced tea"
      },
      {
        "slug": "workshop-morning",
        "name": "Workshop Morning",
        "scene": "A small woodworking bench with worn hand tools and a coffee cup"
      },
      {
        "slug": "trail-together",
        "name": "Trail Together",
        "scene": "Walking boots and a daypack beside a wooded trail"
      },
      {
        "slug": "coffee-break",
        "name": "Coffee Break",
        "scene": "A plain coffee mug and folded newspaper without readable text on a porch"
      },
      {
        "slug": "lakeside-day",
        "name": "Lakeside Day",
        "scene": "A small fishing tackle box and folding chair beside a quiet lake"
      },
      {
        "slug": "family-cookout",
        "name": "Family Cookout",
        "scene": "An ordinary charcoal grill with vegetables beside a picnic table"
      },
      {
        "slug": "garden-time",
        "name": "Garden Time",
        "scene": "Work gloves, pruning shears and a terracotta pot on a garden bench"
      },
      {
        "slug": "sunday-pancakes",
        "name": "Sunday Pancakes",
        "scene": "Homemade pancakes and berries on a simple kitchen table"
      },
      {
        "slug": "game-afternoon",
        "name": "Game Afternoon",
        "scene": "A worn baseball glove and plain ball on grass beside a picnic basket"
      },
      {
        "slug": "front-porch",
        "name": "Front Porch",
        "scene": "Two weathered porch chairs and a small table with lemonade"
      },
      {
        "slug": "first-cast",
        "name": "First Cast",
        "scene": "A father helps a child cast a fishing line from a quiet riverbank, low side view with morning mist over the water"
      },
      {
        "slug": "workshop-restoration",
        "name": "Workshop Restoration",
        "scene": "A father and adult child restore an old wooden chair in an open garage, wide doorway view with realistic tools and sawdust"
      },
      {
        "slug": "forest-trail-companions",
        "name": "Forest Trail Companions",
        "scene": "Two generations hike beneath towering redwoods, low wide landscape with both people small among the trees"
      },
      {
        "slug": "backyard-astronomy",
        "name": "Backyard Astronomy",
        "scene": "A father and child look through a telescope in a dark backyard, realistic night photograph with subtle stars and a soft porch light"
      },
      {
        "slug": "the-bicycle-lesson",
        "name": "The Bicycle Lesson",
        "scene": "A father runs beside a child on a small bicycle, low tracking view with a sunlit park path leading ahead"
      },
      {
        "slug": "grandfather-s-model-train",
        "name": "Grandfather's Model Train",
        "scene": "An older man shows a child an unbranded model railway in a modest spare room, candid wide view with careful handmade scenery"
      },
      {
        "slug": "morning-surf-check",
        "name": "Morning Surf Check",
        "scene": "A father and teenager carry surfboards toward a quiet beach, distant rear view from a sand dune at dawn"
      },
      {
        "slug": "shared-garden-rows",
        "name": "Shared Garden Rows",
        "scene": "A father and child weed a vegetable plot side by side, high oblique view showing neat rows and muddy knees"
      },
      {
        "slug": "the-chess-pause",
        "name": "The Chess Pause",
        "scene": "An older father and adult child consider a chess position on a park bench, intimate side view with the pieces in foreground"
      },
      {
        "slug": "little-league-fence",
        "name": "Little League Fence",
        "scene": "A father watches a child practicing baseball through a chain-link fence, layered telephoto composition in late afternoon light"
      },
      {
        "slug": "old-guitar-lesson",
        "name": "Old Guitar Lesson",
        "scene": "Two generations share a guitar lesson on back steps, close candid view of hands and an old acoustic instrument"
      },
      {
        "slug": "the-sunday-car-wash",
        "name": "The Sunday Car Wash",
        "scene": "A father and child wash an ordinary family car in a driveway, low action view with water droplets frozen in sunlight"
      },
      {
        "slug": "canoe-at-the-landing",
        "name": "Canoe at the Landing",
        "scene": "A father lifts a canoe onto a grassy lakeshore while a child holds the paddles, wide environmental photograph"
      },
      {
        "slug": "walking-the-rescue-dog",
        "name": "Walking the Rescue Dog",
        "scene": "A grandfather and teenager walk a gray-muzzled dog beneath autumn-colored park trees, low candid path view"
      },
      {
        "slug": "the-tie-collection",
        "name": "The Tie Collection",
        "scene": "A child's small hand selects an old patterned tie from a wardrobe, close oblique personal detail with soft morning light"
      },
      {
        "slug": "father-s-day-balloon-ride",
        "name": "Father's Day Balloon Ride",
        "scene": "Two generations stand in the basket of a landed hot-air balloon, wide ground-level photograph with the colorful canopy rising behind them"
      },
      {
        "slug": "repairing-the-old-fence",
        "name": "Repairing the Old Fence",
        "scene": "A father and adult child repair one section of a weathered garden fence, documentary side view with new wood contrasting the old"
      },
      {
        "slug": "sunrise-on-the-golf-course",
        "name": "Sunrise on the Golf Course",
        "scene": "A father and daughter walk with golf bags across a misty course, distant silhouette composition with long shadows"
      },
      {
        "slug": "the-proud-sideline",
        "name": "The Proud Sideline",
        "scene": "A father cheers from the edge of a neighborhood soccer field, candid medium view with the child distant in the game"
      },
      {
        "slug": "river-stones",
        "name": "River Stones",
        "scene": "A father shows a child how to skip flat stones across a river, low waterline photograph catching the first splash"
      },
      {
        "slug": "shared-motorcycle-project",
        "name": "Shared Motorcycle Project",
        "scene": "A father and adult daughter inspect an old unbranded motorcycle in a small garage, three-quarter environmental view"
      },
      {
        "slug": "the-treehouse-ladder",
        "name": "The Treehouse Ladder",
        "scene": "A father steadies a ladder while a child climbs into a modest backyard treehouse, upward wide view through green leaves"
      },
      {
        "slug": "a-day-at-the-museum",
        "name": "A Day at the Museum",
        "scene": "A grandfather and child look up at a large fossil skeleton in a museum, low architectural view with no readable displays"
      },
      {
        "slug": "rainy-stadium-walk",
        "name": "Rainy Stadium Walk",
        "scene": "A father and child share an umbrella outside a neighborhood sports stadium, street-level view with wet paving reflections"
      },
      {
        "slug": "boots-at-the-trailhead",
        "name": "Boots at the Trailhead",
        "scene": "A large pair and a small pair of muddy hiking boots sit beside a folded trail map without labels, overhead view on a stone step"
      },
      {
        "slug": "teaching-a-knot",
        "name": "Teaching a Knot",
        "scene": "A father's weathered hands teach a child a simple rope knot on a sailing dock, close detail with water behind them"
      },
      {
        "slug": "the-new-dad",
        "name": "The New Dad",
        "scene": "A father cradles a sleeping baby near an open window, quiet profile photograph with soft daylight and no staged props"
      },
      {
        "slug": "mountain-bike-rest",
        "name": "Mountain Bike Rest",
        "scene": "A father and teenager rest beside mountain bikes at a forest overlook, expansive landscape with the trail receding below"
      },
      {
        "slug": "early-morning-row",
        "name": "Early Morning Row",
        "scene": "Two generations row a small boat across still water, high distant photograph with clean concentric ripples"
      },
      {
        "slug": "an-ordinary-hero",
        "name": "An Ordinary Hero",
        "scene": "A child wears oversized work gloves beside a father repairing a garden gate, candid knee-height view"
      },
      {
        "slug": "the-barbershop-visit",
        "name": "The Barbershop Visit",
        "scene": "A grandfather and grandson sit in neighboring barbershop chairs, view through the shop window with reflections and no signage"
      },
      {
        "slug": "campfire-stories",
        "name": "Campfire Stories",
        "scene": "A father and children sit around a small safe campsite fire, wide realistic night photograph with the tents dim in the distance"
      },
      {
        "slug": "the-worn-baseball-glove",
        "name": "The Worn Baseball Glove",
        "scene": "A weathered leather glove holds a baseball on a sun-bleached bleacher, close side-lit photograph with an empty field beyond"
      },
      {
        "slug": "coastal-train-outing",
        "name": "Coastal Train Outing",
        "scene": "A father and child watch the sea from a heritage train window, interior candid view with landscape motion outside"
      },
      {
        "slug": "skate-park-encouragement",
        "name": "Skate Park Encouragement",
        "scene": "A father offers a hand to a child learning to skateboard on a small ramp, low wide action photograph"
      },
      {
        "slug": "garden-hammock-nap",
        "name": "Garden Hammock Nap",
        "scene": "A father and toddler nap in a shaded backyard hammock, distant photograph through soft foreground leaves"
      },
      {
        "slug": "the-old-film-camera",
        "name": "The Old Film Camera",
        "scene": "An adult child examines an inherited unbranded film camera with their father, close view of hands and textured camera body"
      },
      {
        "slug": "working-on-the-boat",
        "name": "Working on the Boat",
        "scene": "Two generations paint a small wooden boat on a lakeshore, broad side view with paint-marked clothes and a quiet dock"
      },
      {
        "slug": "the-finish-line-hug",
        "name": "The Finish Line Hug",
        "scene": "A child hugs a father after a local fun run, candid street photograph with runners blurred behind and no readable race numbers"
      },
      {
        "slug": "kite-on-the-headland",
        "name": "Kite on the Headland",
        "scene": "A father and child fly a handmade kite above a windy coastal headland, huge sky composition from a low angle"
      },
      {
        "slug": "a-shared-book",
        "name": "A Shared Book",
        "scene": "A grandfather reads with a child in a sunlit library alcove, side view with book pages indistinct"
      },
      {
        "slug": "sunrise-breakfast-delivery",
        "name": "Sunrise Breakfast Delivery",
        "scene": "A child carries a small breakfast tray down a hallway toward a father's open bedroom door, candid rear view"
      },
      {
        "slug": "the-bowling-release",
        "name": "The Bowling Release",
        "scene": "A father and daughter release bowling balls side by side at a small local alley, low rear action photograph"
      },
      {
        "slug": "wildlife-lookout",
        "name": "Wildlife Lookout",
        "scene": "A father and child use binoculars from a wooden wildlife hide, inside-to-outside composition over a wetland"
      },
      {
        "slug": "the-anniversary-sapling",
        "name": "The Anniversary Sapling",
        "scene": "A father and adult child stand beside a young tree they planted in a backyard, wide quiet portrait with room for its growing canopy"
      },
      {
        "slug": "restoring-the-radio",
        "name": "Restoring the Radio",
        "scene": "An older father repairs an unbranded vintage radio while an adult child watches, close environmental view beside an open workshop window"
      },
      {
        "slug": "the-city-ferry",
        "name": "The City Ferry",
        "scene": "A father and child stand at the bow rail of a small city ferry, wide rear view into cool morning harbor light"
      },
      {
        "slug": "building-a-snow-fort",
        "name": "Building a Snow Fort",
        "scene": "A father and child make a small snow fort on a winter visit, low documentary view with real loose snow and mittens"
      },
      {
        "slug": "the-long-phone-call",
        "name": "The Long Phone Call",
        "scene": "An adult child smiles during a phone call beside a quiet bus window, candid profile with an unreadable screen and moving city reflections"
      },
      {
        "slug": "hand-in-hand",
        "name": "Hand in Hand",
        "scene": "A small child's hand holds a father's larger hand while walking along a beach, close waist-height photograph with waves at the edge"
      }
    ]
  },
  {
    "id": "earth-day",
    "name": "Earth Day",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 4,
      "day": 22,
      "duration": 1
    },
    "palettes": [
      "sage",
      "moss",
      "teal"
    ],
    "purpose": "volunteers",
    "aliases": "Earth Day April environment cleanup planet",
    "designs": [
      {
        "slug": "seedling-morning",
        "name": "Seedling Morning",
        "scene": "Young seedlings in reused pots on a community greenhouse bench"
      },
      {
        "slug": "park-cleanup",
        "name": "Park Cleanup",
        "scene": "Reusable litter bags and work gloves beside a park path"
      },
      {
        "slug": "garden-tools",
        "name": "Garden Tools",
        "scene": "Used hand tools and soil on a garden table"
      },
      {
        "slug": "river-care",
        "name": "River Care",
        "scene": "A clean riverbank with a trash picker and reusable sack"
      },
      {
        "slug": "native-flowers",
        "name": "Native Flowers",
        "scene": "A patch of native wildflowers growing naturally in a neighborhood garden"
      },
      {
        "slug": "compost-corner",
        "name": "Compost Corner",
        "scene": "A small backyard compost bin beside a vegetable bed"
      },
      {
        "slug": "repair-together",
        "name": "Repair Together",
        "scene": "A community repair table with a lamp, basic tools and mending supplies"
      },
      {
        "slug": "plant-swap",
        "name": "Plant Swap",
        "scene": "A modest table of assorted potted plants at a neighborhood plant swap"
      },
      {
        "slug": "tree-day",
        "name": "Tree Day",
        "scene": "A small sapling and a spade beside a freshly dug garden hole"
      },
      {
        "slug": "reuse-workshop",
        "name": "Reuse Workshop",
        "scene": "Glass jars and fabric scraps on an ordinary community craft table"
      },
      {
        "slug": "mangrove-nursery",
        "name": "Mangrove Nursery",
        "scene": "Volunteers carry young mangrove plants through shallow coastal water, wide water-level documentary view with reflected roots"
      },
      {
        "slug": "city-rooftop-garden",
        "name": "City Rooftop Garden",
        "scene": "A productive roof garden stretches across an ordinary city building, elevated architectural photograph with the skyline beyond"
      },
      {
        "slug": "turtle-release",
        "name": "Turtle Release",
        "scene": "A tiny sea turtle crosses damp sand toward the ocean, low close wildlife view with a broad natural horizon"
      },
      {
        "slug": "repair-cafe",
        "name": "Repair Cafe",
        "scene": "A volunteer repairs a broken household fan in a neighborhood repair cafe, candid side view with tools and an attentive visitor"
      },
      {
        "slug": "river-cleanup-canoe",
        "name": "River Cleanup Canoe",
        "scene": "Two volunteers collect floating litter from a canoe on a city river, high oblique view with restrained realistic detail"
      },
      {
        "slug": "pollinator-highway",
        "name": "Pollinator Highway",
        "scene": "A strip of native flowers grows along an urban sidewalk with bees moving through it, ground-level leading-line photograph"
      },
      {
        "slug": "community-solar",
        "name": "Community Solar",
        "scene": "Workers inspect a modest solar installation on a community building, wide rooftop view under clear daylight"
      },
      {
        "slug": "sapling-in-burned-ground",
        "name": "Sapling in Burned Ground",
        "scene": "A young green sapling emerges from a recovering burned forest floor, low close photograph with distant charred trunks"
      },
      {
        "slug": "wetland-boardwalk",
        "name": "Wetland Boardwalk",
        "scene": "A timber boardwalk winds through a healthy wetland at dawn, wide architectural landscape with birds small in the sky"
      },
      {
        "slug": "bottle-refill-stop",
        "name": "Bottle Refill Stop",
        "scene": "A commuter fills a reusable bottle at an outdoor public fountain, close candid view with a bicycle wheel at the edge"
      },
      {
        "slug": "compost-in-motion",
        "name": "Compost in Motion",
        "scene": "A gardener turns dark compost with a fork in a community garden, low detail photograph with real steam and plant scraps"
      },
      {
        "slug": "urban-fox-crossing",
        "name": "Urban Fox Crossing",
        "scene": "A fox crosses a quiet city greenway at dawn, low telephoto view with ordinary apartments in soft background"
      },
      {
        "slug": "wind-over-the-fields",
        "name": "Wind over the Fields",
        "scene": "Wind turbines turn above working farmland under a changing sky, distant landscape with small human scale"
      },
      {
        "slug": "the-reuse-library",
        "name": "The Reuse Library",
        "scene": "Neighbors browse a community tool-lending library, wide interior aisle view with unbranded tools and no readable labels"
      },
      {
        "slug": "coral-nursery",
        "name": "Coral Nursery",
        "scene": "A diver tends a real coral restoration nursery in clear shallow water, underwater environmental photograph with natural blue light"
      },
      {
        "slug": "creek-water-test",
        "name": "Creek Water Test",
        "scene": "A volunteer tests creek water with a simple sample bottle, close candid view at stream level with an unmarked field notebook"
      },
      {
        "slug": "rain-garden",
        "name": "Rain Garden",
        "scene": "Rainwater drains from a street into a planted urban rain garden, low rainy-day photograph with green grasses and wet stone"
      },
      {
        "slug": "bird-safe-window",
        "name": "Bird-Safe Window",
        "scene": "A small songbird perches on a twig outside a window fitted with visible safety dots, respectful telephoto view"
      },
      {
        "slug": "mending-the-jacket",
        "name": "Mending the Jacket",
        "scene": "Hands repair a torn outdoor jacket with a visible fabric patch, close detail on a lap beside a sunlit window"
      },
      {
        "slug": "bicycle-commuter-wave",
        "name": "Bicycle Commuter Wave",
        "scene": "A group of everyday cyclists moves through a protected city lane, wide street-level photograph with normal traffic beyond"
      },
      {
        "slug": "forest-canopy-light",
        "name": "Forest Canopy Light",
        "scene": "Sunlight filters through a healthy mixed forest canopy, upward wide-angle photograph with diverse leaves and branches"
      },
      {
        "slug": "plastic-free-market",
        "name": "Plastic-Free Market",
        "scene": "Shoppers use reusable containers at an ordinary farmers market, wide candid aisle view with no brand labels"
      },
      {
        "slug": "oyster-reef-restoration",
        "name": "Oyster Reef Restoration",
        "scene": "Volunteers lower oyster shells into a shallow coastal restoration site, water-level documentary composition"
      },
      {
        "slug": "school-garden-harvest",
        "name": "School Garden Harvest",
        "scene": "Children harvest radishes from a school garden bed, low candid photograph of hands, leaves and real soil"
      },
      {
        "slug": "the-moss-microforest",
        "name": "The Moss Microforest",
        "scene": "Tiny ferns and moss grow on a fallen log, macro landscape with dew and rich ecological texture"
      },
      {
        "slug": "community-tree-watering",
        "name": "Community Tree Watering",
        "scene": "A neighbor waters a newly planted street tree from a reused bucket, wide urban environmental photograph"
      },
      {
        "slug": "wildlife-overpass",
        "name": "Wildlife Overpass",
        "scene": "A planted wildlife crossing spans a highway in green countryside, elevated landscape photograph with traffic small below"
      },
      {
        "slug": "shorebird-footprints",
        "name": "Shorebird Footprints",
        "scene": "Fine shorebird tracks cross a clean tidal mudflat, downward abstract photograph with one distant wading bird"
      },
      {
        "slug": "textile-swap-rail",
        "name": "Textile Swap Rail",
        "scene": "Neighbors browse a clothing-swap rail in an outdoor courtyard, candid medium view with mixed ordinary garments"
      },
      {
        "slug": "rain-barrel-detail",
        "name": "Rain Barrel Detail",
        "scene": "Rainwater flows from a downspout into a working garden rain barrel, close side view during a gentle shower"
      },
      {
        "slug": "the-dark-sky-meadow",
        "name": "The Dark Sky Meadow",
        "scene": "A clear natural night sky stretches above a protected meadow, realistic wide photograph with subtle stars and no artificial glow"
      },
      {
        "slug": "native-seed-collection",
        "name": "Native Seed Collection",
        "scene": "A conservationist gathers seeds from a dry native grass head, close hand detail with a healthy prairie behind"
      },
      {
        "slug": "urban-beehive",
        "name": "Urban Beehive",
        "scene": "A beekeeper inspects a rooftop hive with the city distant beyond, side environmental portrait with correct protective clothing"
      },
      {
        "slug": "eelgrass-meadow",
        "name": "Eelgrass Meadow",
        "scene": "A small fish moves through underwater eelgrass, water-level aquatic photograph with natural shafts of sunlight"
      },
      {
        "slug": "creek-daylighting",
        "name": "Creek Daylighting",
        "scene": "A restored urban creek runs openly between planted banks and apartment buildings, wide pedestrian-height photograph"
      },
      {
        "slug": "upcycled-playground",
        "name": "Upcycled Playground",
        "scene": "Children play on a community playground built with reused timber and tires, wide documentary photograph in natural afternoon light"
      },
      {
        "slug": "seedling-through-asphalt",
        "name": "Seedling through Asphalt",
        "scene": "A small wild plant grows through a crack in old asphalt, low macro photograph with genuine grit and texture"
      },
      {
        "slug": "the-electric-bus-stop",
        "name": "The Electric Bus Stop",
        "scene": "Passengers board an ordinary electric city bus beside leafy street trees, broad street view with all logos and signs unreadable"
      },
      {
        "slug": "rewilded-orchard",
        "name": "Rewilded Orchard",
        "scene": "An old fruit orchard is allowed to grow with native grasses and wildflowers, wide golden-hour landscape"
      },
      {
        "slug": "citizen-bird-count",
        "name": "Citizen Bird Count",
        "scene": "Volunteers watch birds from a public wetland platform with binoculars, distant candid view through reeds"
      },
      {
        "slug": "zero-waste-lunch",
        "name": "Zero-Waste Lunch",
        "scene": "A reusable lunch box with fruit, bread and a cloth napkin rests on a park bench, overhead personal still life without packaging"
      },
      {
        "slug": "mountain-stream-source",
        "name": "Mountain Stream Source",
        "scene": "Clear water spills from a mountain snowfield into a rocky stream, low wide landscape with believable scale"
      },
      {
        "slug": "green-wall-courtyard",
        "name": "Green Wall Courtyard",
        "scene": "A living planted wall cools a modest urban courtyard, tall architectural photograph with a person small at its base"
      },
      {
        "slug": "the-repairable-toy",
        "name": "The Repairable Toy",
        "scene": "A child watches a volunteer replace the wheel on a wooden toy, close candid view emphasizing reuse rather than new purchase"
      },
      {
        "slug": "beach-cleanup-line",
        "name": "Beach Cleanup Line",
        "scene": "Volunteers spread out along a windswept beach carrying reusable collection sacks, long wide coastal composition"
      },
      {
        "slug": "mushroom-after-rain",
        "name": "Mushroom After Rain",
        "scene": "A cluster of small mushrooms grows beside fallen leaves after rain, ground-level close photograph with natural soft light"
      },
      {
        "slug": "shared-orchard-ladder",
        "name": "Shared Orchard Ladder",
        "scene": "Neighbors pick fruit from a community orchard using one sturdy ladder, wide candid view through branches"
      },
      {
        "slug": "the-return-of-the-otter",
        "name": "The Return of the Otter",
        "scene": "An otter surfaces in a recovering river beside green banks, low telephoto wildlife photograph with honest water texture"
      },
      {
        "slug": "community-energy-window",
        "name": "Community Energy Window",
        "scene": "A resident opens a window in a modest energy-efficient home with exterior shading and plants, quiet architectural side view"
      },
      {
        "slug": "one-healthy-planet",
        "name": "One Healthy Planet",
        "scene": "Earth's curved blue horizon seen from a scientifically plausible low orbit, restrained documentary space photograph with clouds and no fantasy effects"
      }
    ]
  },
  {
    "id": "cinco-de-mayo",
    "name": "Cinco de Mayo",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 5,
      "day": 5,
      "duration": 1
    },
    "palettes": [
      "terracotta",
      "cherry",
      "teal"
    ],
    "purpose": "celebration",
    "aliases": "Cinco de Mayo May fifth Mexican culture Puebla",
    "designs": [
      {
        "slug": "community-table",
        "name": "Community Table",
        "scene": "A modest Mexican community meal table with handmade tortillas and colorful cloth napkins"
      },
      {
        "slug": "paper-banners",
        "name": "Paper Banners",
        "scene": "A few papel picado banners above a simple courtyard gathering"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "Homemade tamales on a ceramic plate in a lived-in kitchen"
      },
      {
        "slug": "puebla-ceramics",
        "name": "Puebla Ceramics",
        "scene": "A few hand-painted ceramic bowls on a rustic kitchen shelf"
      },
      {
        "slug": "courtyard-lunch",
        "name": "Courtyard Lunch",
        "scene": "A small courtyard table with flowers, plain plates and fresh lime water"
      },
      {
        "slug": "cooking-together",
        "name": "Cooking Together",
        "scene": "A bowl of masa, rolling pin and simple cooking utensils on a worktop"
      },
      {
        "slug": "flower-market",
        "name": "Flower Market",
        "scene": "A modest market bucket of colorful fresh flowers beside simple woven baskets"
      },
      {
        "slug": "shared-recipes",
        "name": "Shared Recipes",
        "scene": "Everyday serving dishes with beans, rice and tortillas on a table"
      },
      {
        "slug": "music-gathering",
        "name": "Music Gathering",
        "scene": "An acoustic guitar beside chairs in a modest community room"
      },
      {
        "slug": "neighborhood-celebration",
        "name": "Neighborhood Celebration",
        "scene": "A residential courtyard with a small number of paper banners and folding chairs"
      },
      {
        "slug": "puebla-morning",
        "name": "Puebla Morning",
        "scene": "A quiet street of colorful Puebla facades opens toward distant church towers, wide architectural photograph in early May light"
      },
      {
        "slug": "talavera-courtyard",
        "name": "Talavera Courtyard",
        "scene": "Blue-and-white Talavera tile surrounds a small courtyard fountain, low oblique photograph emphasizing real ceramic texture"
      },
      {
        "slug": "mariachi-arrival",
        "name": "Mariachi Arrival",
        "scene": "Musicians carrying unbranded mariachi instruments walk into a neighborhood plaza, candid rear view with warm late-afternoon light"
      },
      {
        "slug": "paper-banners-above",
        "name": "Paper Banners Above",
        "scene": "Rows of colorful papel picado cross a narrow street, upward photograph with real cut-paper shadows against blue sky"
      },
      {
        "slug": "puebla-hillside",
        "name": "Puebla Hillside",
        "scene": "Puebla's tiled domes and colorful rooftops spread beneath distant hills, elevated cityscape with clear natural daylight"
      },
      {
        "slug": "folklorico-skirt-in-motion",
        "name": "Folklorico Skirt in Motion",
        "scene": "A dancer turns in a full colorful folklorico skirt at a community celebration, low action photograph with believable fabric movement"
      },
      {
        "slug": "market-flower-bundles",
        "name": "Market Flower Bundles",
        "scene": "Armfuls of marigolds and bright local flowers fill a neighborhood flower stall, close side view with no readable labels"
      },
      {
        "slug": "clay-water-jars",
        "name": "Clay Water Jars",
        "scene": "Handmade terracotta water jars stand beside a weathered courtyard wall, low textural photograph in angled sunlight"
      },
      {
        "slug": "street-guitar-duet",
        "name": "Street Guitar Duet",
        "scene": "Two guitarists rehearse beneath an old arcade, candid wide photograph through a foreground arch"
      },
      {
        "slug": "chiles-at-the-market",
        "name": "Chiles at the Market",
        "scene": "Fresh poblano chiles pile in shallow produce crates, overhead documentary detail with rich natural green skins"
      },
      {
        "slug": "festival-footsteps",
        "name": "Festival Footsteps",
        "scene": "Embroidered skirts and polished shoes move across old plaza paving, low cropped action photograph without faces"
      },
      {
        "slug": "puebla-tile-stair",
        "name": "Puebla Tile Stair",
        "scene": "A staircase faced with traditional Puebla tile climbs between warm plaster walls, upward architectural composition"
      },
      {
        "slug": "community-soccer-match",
        "name": "Community Soccer Match",
        "scene": "Families watch an informal neighborhood soccer match near subtle May celebration banners, wide candid park photograph"
      },
      {
        "slug": "agave-after-rain",
        "name": "Agave after Rain",
        "scene": "Rain beads along the sculptural leaves of an agave growing beside a stone path, close botanical view with natural blue-green tones"
      },
      {
        "slug": "trumpet-warmup",
        "name": "Trumpet Warmup",
        "scene": "A musician warms up a brass trumpet in a quiet side street, intimate profile photograph with the horn catching afternoon light"
      },
      {
        "slug": "courtyard-dance-rehearsal",
        "name": "Courtyard Dance Rehearsal",
        "scene": "A small dance group rehearses in a real community courtyard, wide view from an upper balcony with colorful skirts in motion"
      },
      {
        "slug": "handmade-pinwheel",
        "name": "Handmade Pinwheel",
        "scene": "A child holds a bright paper pinwheel against a blue May sky, low candid close view with no costume stereotypes"
      },
      {
        "slug": "the-decorated-bicycle",
        "name": "The Decorated Bicycle",
        "scene": "A bicycle with simple ribbons and a flower basket leans against a colorful Puebla wall, side-on street photograph"
      },
      {
        "slug": "stone-arcade-shade",
        "name": "Stone Arcade Shade",
        "scene": "Long stone arches frame a sunlit Mexican plaza with ordinary pedestrians, deep architectural perspective"
      },
      {
        "slug": "fresh-lime-stand",
        "name": "Fresh Lime Stand",
        "scene": "A vendor sorts fresh limes at a local produce stand, close candid view of hands and fruit without labels"
      },
      {
        "slug": "papel-picado-shadows",
        "name": "Papel Picado Shadows",
        "scene": "Cut-paper banner shadows fall across a pale courtyard wall, spare abstract photograph with one real paper edge visible"
      },
      {
        "slug": "family-plaza-walk",
        "name": "Family Plaza Walk",
        "scene": "A family walks across a neighborhood plaza during a modest Cinco de Mayo gathering, distant candid view from behind"
      },
      {
        "slug": "woven-basket-stall",
        "name": "Woven Basket Stall",
        "scene": "Handwoven baskets hang outside a small artisan shop, oblique street detail with worn plaster and natural afternoon shade"
      },
      {
        "slug": "historic-fort-exterior",
        "name": "Historic Fort Exterior",
        "scene": "A respectful wide view of a historic Puebla fort exterior and open grounds, no battle reenactment or invented signage"
      },
      {
        "slug": "puebla-from-the-bell-tower",
        "name": "Puebla from the Bell Tower",
        "scene": "A rooftop view across Puebla's red, ochre and blue buildings, architectural wide composition with hazy volcanic landscape far away"
      },
      {
        "slug": "mexican-folk-violin",
        "name": "Mexican Folk Violin",
        "scene": "A violin case opens beside a musician's chair under an arcade, close low view of worn wood and bow hair"
      },
      {
        "slug": "plaza-lantern-night",
        "name": "Plaza Lantern Night",
        "scene": "Warm lanterns illuminate a small plaza after a community performance, realistic wide night photograph with restrained color"
      },
      {
        "slug": "hibiscus-drink-stand",
        "name": "Hibiscus Drink Stand",
        "scene": "A clear glass dispenser of deep red hibiscus drink stands at an ordinary outdoor stall, close side-lit detail with no branding"
      },
      {
        "slug": "colorful-rebozo",
        "name": "Colorful Rebozo",
        "scene": "A richly woven rebozo drapes over a simple courtyard chair, textural close photograph with the weave in natural focus"
      },
      {
        "slug": "children-s-dance-shoes",
        "name": "Children's Dance Shoes",
        "scene": "Small dance shoes wait beside folded colorful practice skirts in a community hall, low doorway photograph"
      },
      {
        "slug": "puebla-rooftop-garden",
        "name": "Puebla Rooftop Garden",
        "scene": "Potted herbs and flowers grow on a modest Puebla rooftop with tiled domes distant beyond, wide late-afternoon view"
      },
      {
        "slug": "brass-reflections",
        "name": "Brass Reflections",
        "scene": "A musician's brass instrument reflects fragments of a colorful plaza, tight abstract close-up without readable marks"
      },
      {
        "slug": "clay-pottery-wheel",
        "name": "Clay Pottery Wheel",
        "scene": "A Puebla potter forms a clay vessel at a traditional wheel, close candid side view of hands and wet clay"
      },
      {
        "slug": "community-banner-raising",
        "name": "Community Banner Raising",
        "scene": "Neighbors raise simple papel picado across a local courtyard before a gathering, wide candid view from ground level"
      },
      {
        "slug": "the-plaza-ice-cart",
        "name": "The Plaza Ice Cart",
        "scene": "A small unbranded ice-cream cart crosses a sunny plaza, candid street view with colorful architecture behind it"
      },
      {
        "slug": "lime-blossom",
        "name": "Lime Blossom",
        "scene": "White blossoms and tiny limes grow on a patio lime tree, macro botanical photograph with dappled May light"
      },
      {
        "slug": "balcony-musicians",
        "name": "Balcony Musicians",
        "scene": "A small ensemble rehearses on a colorful residential balcony, upward street photograph with hanging plants"
      },
      {
        "slug": "puebla-blue-door",
        "name": "Puebla Blue Door",
        "scene": "An old blue wooden door sits within a hand-painted tile surround, straight-on architectural portrait with worn authentic texture"
      },
      {
        "slug": "salsa-garden",
        "name": "Salsa Garden",
        "scene": "Tomatoes, cilantro and chiles grow in a modest courtyard garden, low environmental photograph through the leaves"
      },
      {
        "slug": "neighborhood-evening-dance",
        "name": "Neighborhood Evening Dance",
        "scene": "Neighbors dance in a modest courtyard under warm string lights, realistic candid wide photograph at dusk"
      },
      {
        "slug": "festival-ribbon-detail",
        "name": "Festival Ribbon Detail",
        "scene": "A dancer ties a bright ribbon at the end of a braid before a performance, close candid photograph without staged costume excess"
      },
      {
        "slug": "cornfield-in-may",
        "name": "Cornfield in May",
        "scene": "Young corn grows in neat rows outside a small Mexican town, low landscape with ordinary homes and hills in the distance"
      },
      {
        "slug": "talavera-window-box",
        "name": "Talavera Window Box",
        "scene": "A hand-painted Talavera planter holds red geraniums beneath a street window, close three-quarter architectural detail"
      },
      {
        "slug": "a-quiet-puebla-passage",
        "name": "A Quiet Puebla Passage",
        "scene": "A narrow shaded passage leads from a busy street into a peaceful courtyard, deep doorway framing with warm plaster colors"
      },
      {
        "slug": "shared-community-mural",
        "name": "Shared Community Mural",
        "scene": "Neighbors paint an original abstract community mural in a side street, candid wide view without copied imagery or slogans"
      },
      {
        "slug": "acoustic-plaza-circle",
        "name": "Acoustic Plaza Circle",
        "scene": "A small informal circle of musicians plays in a public plaza, distant high-angle photograph with ordinary onlookers"
      },
      {
        "slug": "tortilla-press-in-use",
        "name": "Tortilla Press in Use",
        "scene": "A cook presses one fresh tortilla at an open-air community stall, intimate hand detail with real corn dough texture"
      },
      {
        "slug": "evening-tile-reflections",
        "name": "Evening Tile Reflections",
        "scene": "Rain-darkened tile paving reflects colorful papel picado after a May shower, ground-level photograph with soft plaza lights"
      },
      {
        "slug": "puebla-flower-arch",
        "name": "Puebla Flower Arch",
        "scene": "A modest fresh-flower arch stands at the entrance of a neighborhood cultural gathering, wide doorway view without text"
      },
      {
        "slug": "last-song-at-dusk",
        "name": "Last Song at Dusk",
        "scene": "A lone guitarist packs an instrument after a community celebration, wide silhouette against a quiet blue-hour plaza"
      }
    ]
  },
  {
    "id": "halloween",
    "name": "Halloween",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 10,
      "day": 31,
      "duration": 1
    },
    "palettes": [
      "terracotta",
      "plum",
      "midnight"
    ],
    "purpose": "celebration",
    "aliases": "Halloween October spooky costumes trick or treat",
    "designs": [
      {
        "slug": "pumpkin-porch",
        "name": "Pumpkin Porch",
        "scene": "Two imperfectly carved pumpkins on an ordinary weathered porch in overcast daylight"
      },
      {
        "slug": "friendly-ghosts",
        "name": "Friendly Ghosts",
        "scene": "Handmade white paper ghosts hanging above a simple classroom table"
      },
      {
        "slug": "autumn-doorstep",
        "name": "Autumn Doorstep",
        "scene": "An ordinary front step with one pumpkin and a pot of mums"
      },
      {
        "slug": "cookie-monsters",
        "name": "Cookie Monsters",
        "scene": "Homemade Halloween cookies with slightly uneven icing on a kitchen tray"
      },
      {
        "slug": "neighborhood-night",
        "name": "Neighborhood Night",
        "scene": "A real residential sidewalk at blue hour with a few modest porch decorations"
      },
      {
        "slug": "paper-bats",
        "name": "Paper Bats",
        "scene": "Hand-cut black paper bats and scissors on a family craft table"
      },
      {
        "slug": "pumpkin-workshop",
        "name": "Pumpkin Workshop",
        "scene": "Partly carved pumpkins and ordinary carving tools on a covered outdoor table"
      },
      {
        "slug": "harvest-treats",
        "name": "Harvest Treats",
        "scene": "Bowls of wrapped unbranded sweets on a small Halloween welcome table"
      },
      {
        "slug": "cozy-spooky",
        "name": "Cozy Spooky",
        "scene": "A small living room with a few paper decorations and orange cushions"
      },
      {
        "slug": "lantern-walk",
        "name": "Lantern Walk",
        "scene": "A couple of simple pumpkin lanterns beside a garden path at dusk"
      },
      {
        "slug": "lantern-workshop",
        "name": "Lantern Workshop",
        "scene": "A few handmade paper jack-o-lantern lanterns, orange tissue paper, safety scissors and glue sticks on a scratched community craft table beside a window"
      },
      {
        "slug": "library-after-dark",
        "name": "Library After Dark",
        "scene": "A neighborhood library reading corner with unlettered mystery books, a small uncarved pumpkin and a handmade black paper cat beside an ordinary desk lamp"
      },
      {
        "slug": "costume-repair-table",
        "name": "Costume Repair Table",
        "scene": "An unfinished child's felt owl costume, cotton thread, fabric scraps and rounded sewing scissors on a worn kitchen table with a small pumpkin in late October daylight"
      },
      {
        "slug": "spiderweb-biscuits",
        "name": "Spiderweb Biscuits",
        "scene": "Homemade dark cocoa spiderweb biscuits with uneven white icing cooling beside a chipped ceramic mixing bowl in an ordinary home kitchen, with a folded orange tea towel"
      },
      {
        "slug": "porch-treat-shelf",
        "name": "Porch Treat Shelf",
        "scene": "A small weathered porch shelf holding mismatched bowls of wrapped unbranded Halloween sweets, one unlit carved pumpkin and fallen maple leaves in soft overcast October daylight"
      },
      {
        "slug": "owl-mask-making-window-workshop",
        "name": "Owl Mask Making — Window Workshop",
        "scene": "Simple handmade owl masks made from plain brown card beside feathers cut from paper. The specific setting is a scratched community craft table beside a window in October; make the surrounding location clearly visible while retaining the subject as the main focus"
      },
      {
        "slug": "apple-cider-donuts-window-workshop",
        "name": "Apple Cider Donuts — Window Workshop",
        "scene": "Homemade apple cider doughnuts beside cinnamon sugar and a small white serving plate. The specific setting is a scratched community craft table beside a window in October; make the surrounding location clearly visible while retaining the subject as the main focus"
      },
      {
        "slug": "rainy-trick-or-treat-lane",
        "name": "Rainy Trick-or-Treat Lane",
        "scene": "Ground-level view just above a rain puddle on an empty residential lane, a single carved pumpkin glowing naturally in a distant doorway reflected upside down in the foreground water; October leaves along the curb, realistic blue-hour exposure"
      },
      {
        "slug": "raven-weather-vane",
        "name": "Raven Weather Vane",
        "scene": "Steep upward view of an old black iron raven weather vane silhouetted against an overcast October sky on a modest barn roof, a short loose strand of faded orange bunting lower in the frame, strong open sky"
      },
      {
        "slug": "cornfield-at-blue-hour",
        "name": "Cornfield at Blue Hour",
        "scene": "Wide view from inside a tall corn maze looking along a narrow turning footpath toward a tiny practical string-light entrance, dry stalks framing the sides, believable cool early-evening sky without fog effects"
      },
      {
        "slug": "vintage-costume-rail",
        "name": "Vintage Costume Rail",
        "scene": "Straight-on photograph in an empty small theater wardrobe aisle, a rail of handmade velvet capes, striped stockings and one felt witch hat against a plain plaster wall; no masks, no tabletop, modest practical light"
      },
      {
        "slug": "candy-color-wheel",
        "name": "Candy Color Wheel",
        "scene": "True vertical overhead photograph of scattered unbranded orange, purple and black wrapped Halloween sweets on dark slate, loose curved bands of color with visible gaps and irregular spacing, crisp graphic natural window light"
      },
      {
        "slug": "library-spiral-stair",
        "name": "Library Spiral Stair",
        "scene": "High-angle view through the curved wooden banister of a modest library stairwell, a few paper bats hanging at different heights and a small orange paper lantern on the bottom step; no craft table or book stack in foreground"
      },
      {
        "slug": "little-woodland-door",
        "name": "Little Woodland Door",
        "scene": "Close ground-level photograph of a tiny handmade wooden fairy door propped against the exposed roots of an ordinary oak, acorn caps and one tiny clay pumpkin among real moss and October leaves, no fantasy lighting"
      },
      {
        "slug": "window-silhouette",
        "name": "Window Silhouette",
        "scene": "Oblique interior view toward a tall frosted window with one handmade paper witch silhouette and bare branches visible outside, soft gray late-afternoon light, most of the frame is quiet textured glass rather than a staged table"
      },
      {
        "slug": "cat-among-leaves",
        "name": "Cat Among Leaves",
        "scene": "Low eye-level photograph of one ordinary black cat looking sideways from a bed of fallen maple leaves near a small uncarved pumpkin, a quiet autumn garden behind it, anatomically natural animal and restrained daylight"
      },
      {
        "slug": "skate-park-lanterns",
        "name": "Skate Park Lanterns",
        "scene": "Wide low viewpoint across an empty concrete skate bowl at dusk, three small orange battery paper lanterns resting safely on the upper rim and fallen leaves in a corner, practical lights in the distant neighborhood"
      },
      {
        "slug": "railway-arch-lights",
        "name": "Railway Arch Lights",
        "scene": "Long diagonal view under a disused red-brick pedestrian railway arch with restrained orange paper lanterns hung along one side for a neighborhood Halloween walk, empty wet pavement, realistic overcast afternoon"
      },
      {
        "slug": "bobbing-apple-basin",
        "name": "Bobbing Apple Basin",
        "scene": "Top-down close view of red apples floating at irregular distances in an old galvanized tub of clear water outdoors, small pumpkin and autumn leaves barely entering a corner, honest water reflections and no hands"
      },
      {
        "slug": "toadstool-trail",
        "name": "Toadstool Trail",
        "scene": "Boot-height view along an ordinary woodland path with handmade red-and-white paper toadstools placed beside the trail for a small Halloween story walk, natural leaf litter and no fantasy glow or staged table"
      },
      {
        "slug": "autumn-observatory",
        "name": "Autumn Observatory",
        "scene": "Wide side view of a modest backyard telescope pointed toward an October crescent moon, a folded black cape over a spare chair and a small pumpkin beside the tripod, believable neighborhood night photography"
      },
      {
        "slug": "felt-monster-mobile",
        "name": "Felt Monster Mobile",
        "scene": "Upward close view of a handmade hanging mobile of small mismatched felt monsters turning gently below a plain porch ceiling, visible stitching and cotton loops, blue sky and autumn branches behind it"
      },
      {
        "slug": "creek-footbridge",
        "name": "Creek Footbridge",
        "scene": "Long view across a narrow weathered footbridge over an ordinary creek, a few paper jack-o-lantern bags along the handrail and yellow leaves floating below, soft morning mist restricted to natural water vapor"
      },
      {
        "slug": "neighborhood-cinema",
        "name": "Neighborhood Cinema",
        "scene": "Wide centered view down the aisle of an empty small neighborhood cinema prepared for a Halloween film evening, a few orange seat ribbons and a single pumpkin beside the blank dark screen, modest working wall lights"
      },
      {
        "slug": "greenhouse-nightfall",
        "name": "Greenhouse Nightfall",
        "scene": "View from outside through slightly wet greenhouse glass toward climbing plants, one hanging orange paper lantern and a plain terracotta pumpkin pot, layered reflections of real autumn branches at early dusk"
      },
      {
        "slug": "bicycle-treat-delivery",
        "name": "Bicycle Treat Delivery",
        "scene": "Tight side photograph of the woven basket and front wheel of an old bicycle leaning against a brick wall, basket holding plain paper treat bags and a short black-and-orange ribbon, low afternoon daylight"
      },
      {
        "slug": "patchwork-ghost-quilt",
        "name": "Patchwork Ghost Quilt",
        "scene": "True overhead view of an imperfect handmade black-and-cream patchwork quilt with small simple ghost shapes spread over pale floorboards, one orange thread spool at the edge, soft natural light and no table"
      },
      {
        "slug": "crooked-garden-gate",
        "name": "Crooked Garden Gate",
        "scene": "Low oblique photograph of a weathered wrought-iron garden gate ajar, bare curling vines and one frayed black ribbon tied to the latch, distant porch pumpkin out of focus but recognizable, ordinary cloudy October day"
      },
      {
        "slug": "cider-mill-wheel",
        "name": "Cider Mill Wheel",
        "scene": "Wide three-quarter view of a small working waterwheel beside an old cider mill, empty apple crates and a modest jack-o-lantern beside the entrance, honest flowing water and soft overcast autumn light"
      },
      {
        "slug": "coastal-halloween",
        "name": "Coastal Halloween",
        "scene": "Distant landscape photograph of a small coastal lighthouse and weathered keeper cottage on a rocky October coast, a tiny restrained orange Halloween garland at the cottage doorway, natural gray sea and wide open sky"
      },
      {
        "slug": "ceramic-ghost-study",
        "name": "Ceramic Ghost Study",
        "scene": "Macro three-quarter photograph of one small handmade white ceramic ghost bell hanging from rough twine beside a brick wall, tiny uneven glaze marks and an orange fallen leaf below, quiet daylight with no other decorations"
      },
      {
        "slug": "orange-vinyl-evening",
        "name": "Orange Vinyl Evening",
        "scene": "Close oblique view of a translucent orange vinyl record on a modest unbranded turntable in a small music room, black paper bat sleeve leaning against the wall without lettering, believable warm practical lamplight"
      },
      {
        "slug": "shadow-puppet-screen",
        "name": "Shadow Puppet Screen",
        "scene": "Side view of a small homemade paper shadow theater with a simple black cat and crescent-moon silhouette projected by a visible ordinary desk lamp onto cotton fabric, empty reading room and no human figures"
      },
      {
        "slug": "halloween-bowling-night",
        "name": "Halloween Bowling Night",
        "scene": "Wide low camera view down an empty vintage bowling lane with restrained orange-and-black paper garlands above the seating area, plain unnumbered pins in the distance and no signs, realistic fluorescent practical lighting"
      },
      {
        "slug": "chocolate-bark-fractures",
        "name": "Chocolate Bark Fractures",
        "scene": "Extreme close-up of uneven dark chocolate bark with orange candy fragments and small white candy eyes scattered through it on parchment, crisp food textures and limited natural sidelight, no cookies or staged kitchen backdrop"
      },
      {
        "slug": "black-ribbon-wreath",
        "name": "Black Ribbon Wreath",
        "scene": "Close side-angle photograph of a handmade wreath of loosely knotted matte black cotton ribbons on an old cream door, one little orange wooden bead and visible fabric fraying, soft fall daylight and generous blank door area"
      },
      {
        "slug": "rooftop-broom-rest",
        "name": "Rooftop Broom Rest",
        "scene": "Low-angle architectural photograph of a modest brick roof terrace, one weathered straw broom leaning against a chimney and a small orange enamel bucket, October clouds and distant rooftops, no flying objects or people"
      },
      {
        "slug": "miniature-haunted-village",
        "name": "Miniature Haunted Village",
        "scene": "High diagonal photograph of an uneven handmade cardboard Halloween village on a low window ledge, small dark houses with warm battery tea lights inside and a few paper bare trees, visible ordinary craft materials and no fantasy landscape"
      },
      {
        "slug": "hay-bale-passage",
        "name": "Hay Bale Passage",
        "scene": "Wide view through a short safe tunnel made from stacked straw bales at a small farm's Halloween walk, one plain orange lantern beyond the far opening and daylight showing real straw texture, no people or signage"
      },
      {
        "slug": "foggy-orchard-lane",
        "name": "Foggy Orchard Lane",
        "scene": "Very low landscape photograph along a rutted orchard lane between old apple trees, a single wooden wagon with pumpkins far in the middle distance and light natural morning fog, irregular fallen apples close to the lens"
      },
      {
        "slug": "orange-umbrella-courtyard",
        "name": "Orange Umbrella Courtyard",
        "scene": "High-angle architectural view into an empty small brick courtyard after rain, several closed plain orange umbrellas leaning in a metal stand and a modest carved pumpkin on a step, wet geometric paving and quiet natural light"
      },
      {
        "slug": "pumpkin-peel-ribbons",
        "name": "Pumpkin Peel Ribbons",
        "scene": "Macro side view of curled pumpkin peel and a few clean seeds scattered irregularly on dark stone beside a small carving tool, the orange curls dominate the composition with a pumpkin edge barely visible, no whole carved faces"
      },
      {
        "slug": "midnight-bookbinding",
        "name": "Midnight Bookbinding",
        "scene": "Overhead photograph of a small hand-bound blank black-paper booklet, cotton binding thread and simple crescent-shaped paper cutouts on pale linen, one orange pencil unlettered, precise natural sidelight with strong negative space"
      },
      {
        "slug": "corn-husk-dragon",
        "name": "Corn Husk Dragon",
        "scene": "Eye-level close photograph of one small handmade dragon assembled from dry corn husks and twine perched on a rough garden fence for Halloween, real folded plant textures and autumn foliage behind it, no fantasy creature rendering"
      },
      {
        "slug": "empty-fairground-wheel",
        "name": "Empty Fairground Wheel",
        "scene": "Wide distant photograph of a modest empty fairground at early October dusk, a small Ferris wheel with restrained practical amber bulbs, pumpkins beside the ticket hut without lettering, believable neighborhood scale and no crowds"
      },
      {
        "slug": "porch-hammock-october",
        "name": "Porch Hammock October",
        "scene": "Side-on architectural view of an empty porch hammock carrying a rumpled black-and-orange woven blanket, a paper jack-o-lantern hanging safely from a nearby post, falling autumn leaves and unpolished afternoon daylight"
      },
      {
        "slug": "mossy-stone-steps",
        "name": "Mossy Stone Steps",
        "scene": "Ground-level diagonal view up old mossy stone garden steps with one soft felt witch hat resting on the top landing and a few ordinary battery tea lights safely tucked at the sides, damp October textures and natural gray daylight"
      },
      {
        "slug": "candy-wrapper-in-the-wind",
        "name": "Candy Wrapper in the Wind",
        "scene": "Curb-height documentary photograph of one plain orange sweet wrapper caught lightly against a chain-link fence among a few dry maple leaves, a distant small porch pumpkin providing Halloween context, clear realistic wind-blown texture"
      },
      {
        "slug": "harvest-corn-detail",
        "name": "Harvest Corn Detail",
        "scene": "Macro photograph of the irregular kernels of a dark purple heirloom corn cob with dry husks, a small paper bat hanging softly out of focus behind it in an ordinary harvest shed, realistic autumn light and no table arrangement"
      },
      {
        "slug": "halloween-chessboard",
        "name": "Halloween Chessboard",
        "scene": "True vertical overhead photograph of a worn chessboard on a stone park game table with mismatched black and burnt-orange pieces partway through a game, a tiny felt witch hat beside the board and scattered October leaves, no people"
      }
    ]
  },
  {
    "id": "indigenous-peoples-day",
    "name": "Indigenous Peoples’ Day",
    "kind": "Celebrations",
    "date": {
      "kind": "weekday",
      "month": 10,
      "weekday": 1,
      "occurrence": 2
    },
    "palettes": [
      "terracotta",
      "moss",
      "cocoa"
    ],
    "purpose": "meeting",
    "aliases": "Indigenous Peoples Day October Native community",
    "designs": [
      {
        "slug": "community-learning",
        "name": "Community Learning",
        "scene": "A welcoming community reading table with unlettered books and simple flowers"
      },
      {
        "slug": "land-and-water",
        "name": "Land and Water",
        "scene": "A natural river bend with native trees in ordinary autumn daylight"
      },
      {
        "slug": "native-garden",
        "name": "Native Garden",
        "scene": "A community garden with native plants, no ceremonial objects"
      },
      {
        "slug": "shared-conversation",
        "name": "Shared Conversation",
        "scene": "A circle of chairs in a simple community room with daylight"
      },
      {
        "slug": "local-voices",
        "name": "Local Voices",
        "scene": "A microphone and empty chair at a small community storytelling event"
      },
      {
        "slug": "stewardship-day",
        "name": "Stewardship Day",
        "scene": "Gardening gloves and a sapling beside a community planting site"
      },
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "Locally grown squash and corn in a simple woven basket, no sacred imagery"
      },
      {
        "slug": "neighborhood-gathering",
        "name": "Neighborhood Gathering",
        "scene": "A modest outdoor community table in the shade of mature trees"
      },
      {
        "slug": "living-landscape",
        "name": "Living Landscape",
        "scene": "A quiet woodland path with natural autumn undergrowth"
      },
      {
        "slug": "learning-circle",
        "name": "Learning Circle",
        "scene": "Blank paper and pencils on a community workshop table, no invented tribal patterns"
      },
      {
        "slug": "river-guardians",
        "name": "River Guardians",
        "scene": "Contemporary Indigenous community volunteers monitor a clean river from a small research boat, wide documentary view with ordinary field gear"
      },
      {
        "slug": "community-radio",
        "name": "Community Radio",
        "scene": "An Indigenous radio presenter works in a modest local studio, candid side portrait with an unreadable console and natural window light"
      },
      {
        "slug": "restored-wetland",
        "name": "Restored Wetland",
        "scene": "A healthy restored wetland opens beneath a broad autumn sky, elevated landscape with a small community boardwalk"
      },
      {
        "slug": "urban-gathering-place",
        "name": "Urban Gathering Place",
        "scene": "A contemporary Indigenous community center opens onto a welcoming city courtyard, wide architectural photograph with ordinary visitors"
      },
      {
        "slug": "seed-sovereignty",
        "name": "Seed Sovereignty",
        "scene": "A community gardener holds a handful of diverse heirloom corn seeds above a growing plot, close documentary detail without ceremonial props"
      },
      {
        "slug": "language-circle",
        "name": "Language Circle",
        "scene": "A small intergenerational language-learning circle meets in a bright community room, wide doorway view with all written material indistinct"
      },
      {
        "slug": "coastal-stewardship",
        "name": "Coastal Stewardship",
        "scene": "Volunteers check tide-pool health along a rocky Pacific coast, water-level environmental photograph with practical outdoor clothing"
      },
      {
        "slug": "the-young-filmmaker",
        "name": "The Young Filmmaker",
        "scene": "A young Indigenous filmmaker records an interview in a modern community studio, candid profile with original equipment and no readable displays"
      },
      {
        "slug": "restoring-a-canoe",
        "name": "Restoring a Canoe",
        "scene": "Community boatbuilders repair a practical wooden canoe beside a working waterfront, wide side view emphasizing shared contemporary skill"
      },
      {
        "slug": "city-skate-park",
        "name": "City Skate Park",
        "scene": "Indigenous teenagers practice skateboarding at a neighborhood park, low action photograph with ordinary streetwear and no identity stereotypes"
      },
      {
        "slug": "autumn-oak-woodland",
        "name": "Autumn Oak Woodland",
        "scene": "Sunlight crosses an old oak woodland and native grass understory, low wide landscape with natural ecological variety"
      },
      {
        "slug": "community-health-visit",
        "name": "Community Health Visit",
        "scene": "A local Indigenous health worker greets a family outside a modern clinic, candid wide view with no readable signage"
      },
      {
        "slug": "the-native-plant-nursery",
        "name": "The Native Plant Nursery",
        "scene": "Rows of locally appropriate native seedlings grow at a community nursery, ground-level leading lines with a gardener working in the distance"
      },
      {
        "slug": "an-elder-s-story",
        "name": "An Elder's Story",
        "scene": "An elder and a teenager share a quiet conversation on a shaded community porch, respectful candid side view without invented regalia"
      },
      {
        "slug": "coastal-kelp-forest",
        "name": "Coastal Kelp Forest",
        "scene": "A clear underwater kelp forest sways around small fish, natural aquatic photograph emphasizing healthy coastal habitat"
      },
      {
        "slug": "contemporary-mural",
        "name": "Contemporary Mural",
        "scene": "A community artist paints an original non-sacred abstract mural on a city wall, candid wide photograph without copied cultural symbols"
      },
      {
        "slug": "museum-futures",
        "name": "Museum Futures",
        "scene": "A young curator handles an ordinary contemporary ceramic artwork in a community museum, close documentary detail with no sacred objects"
      },
      {
        "slug": "night-sky-watch",
        "name": "Night Sky Watch",
        "scene": "Community members watch a realistic autumn night sky from a grassy hill, distant silhouettes and subtle stars without invented constellations"
      },
      {
        "slug": "camas-meadow",
        "name": "Camas Meadow",
        "scene": "A restored meadow of blue camas flowers stretches toward distant woodland, low botanical landscape with accurate natural flowers"
      },
      {
        "slug": "community-food-co-op",
        "name": "Community Food Co-op",
        "scene": "Neighbors carry fresh produce out of a small community-owned food co-op, wide candid street photograph with no readable branding"
      },
      {
        "slug": "the-documentary-photographer",
        "name": "The Documentary Photographer",
        "scene": "An Indigenous photographer takes a portrait outside a contemporary urban cultural center, environmental rear view with ordinary clothing"
      },
      {
        "slug": "salmon-stream",
        "name": "Salmon Stream",
        "scene": "A salmon moves through a clear shallow stream below autumn leaves, low water-level wildlife photograph with believable scale"
      },
      {
        "slug": "library-discovery",
        "name": "Library Discovery",
        "scene": "A child and adult browse a contemporary Indigenous literature shelf, candid aisle view with book covers and titles unreadable"
      },
      {
        "slug": "land-restoration-day",
        "name": "Land Restoration Day",
        "scene": "Volunteers remove invasive plants from a riverbank restoration site, high oblique documentary view with mixed ages and practical tools"
      },
      {
        "slug": "the-modern-workshop",
        "name": "The Modern Workshop",
        "scene": "A contemporary furniture maker shapes a clean timber joint in a modest workshop, close view of hands and wood grain"
      },
      {
        "slug": "school-community-garden",
        "name": "School Community Garden",
        "scene": "Children water native plants in a school garden courtyard, low candid view without costume or ceremonial imagery"
      },
      {
        "slug": "a-coastal-footpath",
        "name": "A Coastal Footpath",
        "scene": "A narrow footpath follows a wild coastal bluff above gray-blue water, wide landscape through wind-bent grass"
      },
      {
        "slug": "youth-basketball",
        "name": "Youth Basketball",
        "scene": "A contemporary Indigenous youth basketball team practices in an ordinary community gym, low wide action photograph without readable uniforms"
      },
      {
        "slug": "oral-history-recording",
        "name": "Oral History Recording",
        "scene": "An elder speaks into a simple microphone while a young archivist listens, intimate side portrait in a quiet modern room"
      },
      {
        "slug": "community-orchard",
        "name": "Community Orchard",
        "scene": "Families harvest fruit in a shared orchard on an autumn afternoon, distant candid view through branches"
      },
      {
        "slug": "a-working-harbor",
        "name": "A Working Harbor",
        "scene": "Small fishing boats return to a contemporary Indigenous coastal community harbor, wide blue-hour photograph with realistic working details"
      },
      {
        "slug": "native-pollinator-patch",
        "name": "Native Pollinator Patch",
        "scene": "Butterflies and bees visit a dense native flower patch beside a community center, close botanical photograph with modern architecture softly behind"
      },
      {
        "slug": "the-student-scientist",
        "name": "The Student Scientist",
        "scene": "A young Indigenous scientist examines a water sample in a modern field station, candid medium view with labels unreadable"
      },
      {
        "slug": "allotment-after-rain",
        "name": "Allotment After Rain",
        "scene": "Rain beads on young vegetables in a community growing plot, ground-level photograph with real soil and reused watering cans"
      },
      {
        "slug": "a-city-bicycle-ride",
        "name": "A City Bicycle Ride",
        "scene": "An Indigenous parent and teenager ride bicycles along a river greenway, wide side-on urban photograph in ordinary clothing"
      },
      {
        "slug": "community-film-night",
        "name": "Community Film Night",
        "scene": "A contemporary community hall prepares for a local film screening, rear wide view with a blank screen and simple chairs"
      },
      {
        "slug": "restored-prairie",
        "name": "Restored Prairie",
        "scene": "Tall native prairie grasses catch low autumn sunlight, wide landscape with one small person walking an established path"
      },
      {
        "slug": "a-ceramic-artist",
        "name": "A Ceramic Artist",
        "scene": "A contemporary Indigenous ceramic artist examines a finished original bowl in a bright studio, close candid view without copied motifs"
      },
      {
        "slug": "cedar-grove-walk",
        "name": "Cedar Grove Walk",
        "scene": "Two generations walk through a mature cedar grove on a maintained trail, distant respectful environmental photograph"
      },
      {
        "slug": "community-solar-roof",
        "name": "Community Solar Roof",
        "scene": "A community-owned building has a working solar roof above a green courtyard, elevated architectural photograph"
      },
      {
        "slug": "the-young-cellist",
        "name": "The Young Cellist",
        "scene": "A young Indigenous musician practices cello in a modern community arts room, candid side view with no ceremonial staging"
      },
      {
        "slug": "wild-rice-waterways",
        "name": "Wild Rice Waterways",
        "scene": "A canoe moves slowly through a natural wild-rice wetland, distant elevated landscape without depicting undocumented ceremonial practices"
      },
      {
        "slug": "accessible-nature-walk",
        "name": "Accessible Nature Walk",
        "scene": "A community group follows an accessible boardwalk through a nature reserve, wide candid photograph with mixed ages and ordinary mobility aids"
      },
      {
        "slug": "an-open-door",
        "name": "An Open Door",
        "scene": "The glass doors of a modern Indigenous cultural center stand open to a busy neighborhood, street-level architectural photograph with signage unreadable"
      },
      {
        "slug": "the-repair-collective",
        "name": "The Repair Collective",
        "scene": "Young community members repair bicycles in a shared workshop, candid wide photograph with practical tools and ordinary clothes"
      },
      {
        "slug": "autumn-river-reflections",
        "name": "Autumn River Reflections",
        "scene": "Orange and yellow leaves reflect in a broad healthy river, low quiet landscape with natural ripples"
      },
      {
        "slug": "a-classroom-partnership",
        "name": "A Classroom Partnership",
        "scene": "An Indigenous educator helps students examine local plant specimens in an ordinary classroom, close candid view with no readable labels"
      },
      {
        "slug": "community-market-morning",
        "name": "Community Market Morning",
        "scene": "Contemporary artists and growers set up a small community market outdoors, wide documentary view with original crafts and no copied sacred motifs"
      },
      {
        "slug": "the-next-generation",
        "name": "The Next Generation",
        "scene": "A teenager helps an elder cross a quiet neighborhood street toward a community gathering, distant candid view at golden hour"
      },
      {
        "slug": "land-and-water-together",
        "name": "Land and Water Together",
        "scene": "A forested headland meets a river estuary at dawn, sweeping landscape emphasizing living land and water without invented cultural symbols"
      }
    ]
  },
  {
    "id": "day-of-the-dead",
    "name": "Día de los Muertos",
    "kind": "Celebrations",
    "date": {
      "kind": "fixed",
      "month": 11,
      "day": 1,
      "duration": 2
    },
    "palettes": [
      "ochre",
      "plum",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "Dia de los Muertos Day of the Dead November remembrance",
    "designs": [
      {
        "slug": "marigold-morning",
        "name": "Marigold Morning",
        "scene": "Fresh orange marigolds in an ordinary ceramic vase beside a window"
      },
      {
        "slug": "remembrance-table",
        "name": "Remembrance Table",
        "scene": "A small respectful home ofrenda with marigolds and candles, no invented portraits"
      },
      {
        "slug": "pan-de-muerto",
        "name": "Pan de Muerto",
        "scene": "Homemade pan de muerto on a plain plate with a few marigolds nearby"
      },
      {
        "slug": "paper-flowers",
        "name": "Paper Flowers",
        "scene": "Tissue paper marigolds and simple craft supplies on a table"
      },
      {
        "slug": "courtyard-marigolds",
        "name": "Courtyard Marigolds",
        "scene": "Pots of marigolds in a modest residential courtyard"
      },
      {
        "slug": "shared-memories",
        "name": "Shared Memories",
        "scene": "A blank photo frame, simple candle and small marigold bouquet on a table"
      },
      {
        "slug": "candle-and-petals",
        "name": "Candle and Petals",
        "scene": "A single candle in a plain holder beside scattered marigold petals"
      },
      {
        "slug": "community-workshop",
        "name": "Community Workshop",
        "scene": "A modest table with paper flower supplies and unpainted craft objects"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "Homemade bread and a pot of hot chocolate in a lived-in Mexican kitchen"
      },
      {
        "slug": "flower-path",
        "name": "Flower Path",
        "scene": "A short simple line of marigold petals leading to a modest decorated doorway"
      },
      {
        "slug": "marigold-path-at-dawn",
        "name": "Marigold Path at Dawn",
        "scene": "A path of fresh marigold petals leads through an open courtyard doorway at dawn, low leading-line photograph with warm natural color"
      },
      {
        "slug": "ofrenda-by-the-window",
        "name": "Ofrenda by the Window",
        "scene": "A modest family ofrenda with marigolds, candles and indistinct framed photographs stands beside a bright window, respectful wide interior view"
      },
      {
        "slug": "the-pan-de-muerto-baker",
        "name": "The Pan de Muerto Baker",
        "scene": "A baker lifts freshly baked pan de muerto from an old oven, close candid view with flour, warm bread and real heat"
      },
      {
        "slug": "cemetery-candle-walk",
        "name": "Cemetery Candle Walk",
        "scene": "Families walk quietly along a candlelit cemetery path during remembrance, distant respectful night photograph without legible gravestones"
      },
      {
        "slug": "papel-picado-sky",
        "name": "Papel Picado Sky",
        "scene": "Traditional cut-paper banners move above a Mexican courtyard, upward photograph against a deep blue late-afternoon sky"
      },
      {
        "slug": "remembering-the-musician",
        "name": "Remembering the Musician",
        "scene": "A worn guitar rests beside a single framed indistinct photograph and marigolds, close side-lit personal memorial without spectacle"
      },
      {
        "slug": "marigold-harvest",
        "name": "Marigold Harvest",
        "scene": "A grower gathers bright marigolds in a field at sunrise, wide low documentary photograph with rows of flowers receding"
      },
      {
        "slug": "the-family-photograph",
        "name": "The Family Photograph",
        "scene": "An adult's hands gently clean an old framed family photograph, intimate overhead detail with the image intentionally indistinct"
      },
      {
        "slug": "candlelit-canal",
        "name": "Candlelit Canal",
        "scene": "A small boat carrying flowers passes along a quiet canal at dusk, water-level photograph with warm lantern reflections"
      },
      {
        "slug": "paper-skeleton-workshop",
        "name": "Paper Skeleton Workshop",
        "scene": "An artisan assembles one playful paper skeleton in an open neighborhood workshop, candid side view with paper scraps and no Halloween props"
      },
      {
        "slug": "the-flower-bicycle",
        "name": "The Flower Bicycle",
        "scene": "A bicycle carries bundles of fresh marigolds through a quiet town street, side-on candid photograph with old plaster walls"
      },
      {
        "slug": "courtyard-remembrance",
        "name": "Courtyard Remembrance",
        "scene": "A family gathers quietly around a modest courtyard ofrenda at blue hour, wide view through an open wooden doorway"
      },
      {
        "slug": "sugar-skull-artisan",
        "name": "Sugar Skull Artisan",
        "scene": "An artisan decorates a single handmade sugar skull with modest colored icing, close hand detail with real sugar texture"
      },
      {
        "slug": "the-empty-chair",
        "name": "The Empty Chair",
        "scene": "An empty wooden chair with a folded shawl and marigold stem faces a sunlit doorway, spare respectful environmental photograph"
      },
      {
        "slug": "a-rooftop-candle",
        "name": "A Rooftop Candle",
        "scene": "A sheltered candle and small cluster of marigolds glow on a rooftop ledge overlooking a town at dusk, wide cityscape"
      },
      {
        "slug": "cempasuchil-detail",
        "name": "Cempasuchil Detail",
        "scene": "A fresh marigold blossom is shown in extreme botanical close-up with natural petal texture and warm afternoon light"
      },
      {
        "slug": "the-return-home",
        "name": "The Return Home",
        "scene": "Family members carrying flowers arrive at an old front doorway, candid rear view with ordinary clothing and gentle evening light"
      },
      {
        "slug": "community-mural-of-memory",
        "name": "Community Mural of Memory",
        "scene": "An artist paints an original abstract mural about family memory on a neighborhood wall, wide candid view without copied artwork or text"
      },
      {
        "slug": "the-bread-basket",
        "name": "The Bread Basket",
        "scene": "A vendor carries a wicker basket of pan de muerto through an outdoor market, waist-height documentary photograph"
      },
      {
        "slug": "lanterns-in-the-passage",
        "name": "Lanterns in the Passage",
        "scene": "Small warm lanterns illuminate a narrow stone passage leading to a flower-filled courtyard, deep realistic night perspective"
      },
      {
        "slug": "a-grandmother-s-shawl",
        "name": "A Grandmother's Shawl",
        "scene": "A colorful woven shawl drapes over a familiar armchair beside a small framed photograph, close textural interior view"
      },
      {
        "slug": "marigold-garland-makers",
        "name": "Marigold Garland Makers",
        "scene": "Neighbors string a fresh marigold garland outdoors, close candid hands with flowers cascading into the foreground"
      },
      {
        "slug": "town-square-remembrance",
        "name": "Town Square Remembrance",
        "scene": "A modest community remembrance installation fills one corner of a town square, elevated wide view with ordinary visitors"
      },
      {
        "slug": "the-candle-maker",
        "name": "The Candle Maker",
        "scene": "An artisan pours one simple remembrance candle in a small workshop, side-lit close photograph with natural wax texture"
      },
      {
        "slug": "small-shoes-remembered",
        "name": "Small Shoes Remembered",
        "scene": "A pair of tiny worn shoes rests beside flowers and an indistinct family photograph, intimate respectful close view without theatrical sadness"
      },
      {
        "slug": "flower-stall-before-sunset",
        "name": "Flower Stall before Sunset",
        "scene": "Bundles of marigolds, chrysanthemums and greenery fill a local flower stall, wide aisle photograph with no readable labels"
      },
      {
        "slug": "the-storyteller-s-corner",
        "name": "The Storyteller's Corner",
        "scene": "An older family member tells a story to children beside a modest ofrenda, distant candid view through a room doorway"
      },
      {
        "slug": "remembrance-on-the-water",
        "name": "Remembrance on the Water",
        "scene": "Loose marigold petals drift on calm water near a stone bank, low abstract photograph with soft reflected candlelight"
      },
      {
        "slug": "clay-incense-vessel",
        "name": "Clay Incense Vessel",
        "scene": "A simple handmade clay incense vessel releases a small thread of smoke near marigolds, intimate side-lit detail without invented ritual symbols"
      },
      {
        "slug": "a-doorway-of-flowers",
        "name": "A Doorway of Flowers",
        "scene": "A modest stone doorway is framed with fresh marigolds for a family remembrance gathering, straight-on architectural photograph"
      },
      {
        "slug": "the-village-brass-band",
        "name": "The Village Brass Band",
        "scene": "A small local brass band carries instruments along a town street before a remembrance gathering, candid rear three-quarter view"
      },
      {
        "slug": "candle-reflections-in-glass",
        "name": "Candle Reflections in Glass",
        "scene": "A cluster of simple vigil candles reflects in a rain-darkened window, close atmospheric night photograph with realistic flame size"
      },
      {
        "slug": "the-remembered-gardener",
        "name": "The Remembered Gardener",
        "scene": "A weathered watering can and old gardening gloves sit beside a few marigolds and an indistinct photograph, personal memorial detail"
      },
      {
        "slug": "cemetery-flowers-after-rain",
        "name": "Cemetery Flowers after Rain",
        "scene": "Fresh flowers stand beside an uninscribed stone grave marker after a gentle shower, respectful low photograph with no legible names"
      },
      {
        "slug": "the-family-recipe-book",
        "name": "The Family Recipe Book",
        "scene": "A worn recipe notebook with unreadable pages lies open beside a small flower and old kitchen apron, close personal remembrance detail"
      },
      {
        "slug": "marigold-archway",
        "name": "Marigold Archway",
        "scene": "A community-built marigold arch stands in a sunny public courtyard, wide low-angle photograph with ordinary people small beyond"
      },
      {
        "slug": "the-last-train-home",
        "name": "The Last Train Home",
        "scene": "A traveler carries a bouquet and small bag along a station platform on the way to a family gathering, candid wide photograph"
      },
      {
        "slug": "paper-cut-shadow",
        "name": "Paper Cut Shadow",
        "scene": "A cut-paper skull silhouette casts a delicate shadow on a sunlit plaster wall, close abstract view of handmade paper rather than a costume"
      },
      {
        "slug": "remembering-the-dancer",
        "name": "Remembering the Dancer",
        "scene": "Worn dance shoes and a folded embroidered skirt rest beside marigolds and an indistinct photograph, close side-lit personal memorial"
      },
      {
        "slug": "the-courtyard-violinist",
        "name": "The Courtyard Violinist",
        "scene": "A violinist plays quietly beside a family courtyard ofrenda, distant respectful view framed through foliage"
      },
      {
        "slug": "bread-cooling-rack",
        "name": "Bread Cooling Rack",
        "scene": "Different homemade pan de muerto loaves cool on a worn bakery rack, low angled documentary photograph with visible flour and crust"
      },
      {
        "slug": "a-child-s-offering",
        "name": "A Child's Offering",
        "scene": "A child's hands place a simple handmade drawing beside family flowers, close candid view with the drawing abstract and unlettered"
      },
      {
        "slug": "remembrance-from-the-balcony",
        "name": "Remembrance from the Balcony",
        "scene": "A balcony view looks down onto neighbors sharing flowers in a small courtyard, high documentary composition at golden hour"
      },
      {
        "slug": "marigold-field-at-nightfall",
        "name": "Marigold Field at Nightfall",
        "scene": "A flower field glows orange beneath a fading blue sky, broad landscape with a single grower walking toward a shed"
      },
      {
        "slug": "the-worn-family-trunk",
        "name": "The Worn Family Trunk",
        "scene": "A small old trunk opens to reveal family keepsakes and indistinct photographs, overhead personal detail with one marigold stem"
      },
      {
        "slug": "a-quiet-chapel-entrance",
        "name": "A Quiet Chapel Entrance",
        "scene": "Fresh flowers and restrained candles mark a small chapel entrance during remembrance, wide evening architectural photograph"
      },
      {
        "slug": "the-flower-boat-landing",
        "name": "The Flower Boat Landing",
        "scene": "A wooden landing holds baskets of marigolds beside a moored small boat, low waterline photograph at sunrise"
      },
      {
        "slug": "remembering-the-reader",
        "name": "Remembering the Reader",
        "scene": "A worn pair of reading glasses and closed books sit beside an indistinct photograph and a few fresh flowers, quiet close detail"
      },
      {
        "slug": "dawn-after-remembrance",
        "name": "Dawn after Remembrance",
        "scene": "The last candles fade in a courtyard ofrenda as pale morning light enters, wide peaceful interior-to-exterior composition"
      },
      {
        "slug": "home-lights-of-memory",
        "name": "Home Lights of Memory",
        "scene": "Warm windows shine across a quiet Mexican town hillside at blue hour, expansive cityscape with subtle distant marigold decorations"
      }
    ]
  },
  {
    "id": "lunar-new-year",
    "name": "Lunar New Year",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "chinese",
      "month": "1",
      "day": 1,
      "duration": 15,
      "eve": false
    },
    "palettes": [
      "cherry",
      "ochre",
      "plum"
    ],
    "purpose": "celebration",
    "aliases": "Lunar Chinese Korean Vietnamese New Year Tet Seollal",
    "designs": [
      {
        "slug": "red-lanterns",
        "name": "Red Lanterns",
        "scene": "Two simple red paper lanterns above a modest neighborhood courtyard"
      },
      {
        "slug": "mandarin-table",
        "name": "Mandarin Table",
        "scene": "A bowl of mandarins and a few plain red envelopes on a wooden table"
      },
      {
        "slug": "family-dumplings",
        "name": "Family Dumplings",
        "scene": "Handmade dumplings being prepared on a kitchen worktop, no hands visible"
      },
      {
        "slug": "spring-branches",
        "name": "Spring Branches",
        "scene": "A few flowering plum branches in a simple ceramic vase"
      },
      {
        "slug": "tea-and-fruit",
        "name": "Tea and Fruit",
        "scene": "A small teapot, everyday cups and citrus fruit on a family table"
      },
      {
        "slug": "paper-workshop",
        "name": "Paper Workshop",
        "scene": "Red paper, scissors and string on a community craft table, no text"
      },
      {
        "slug": "courtyard-welcome",
        "name": "Courtyard Welcome",
        "scene": "A modest doorway with simple red decorations and potted plants"
      },
      {
        "slug": "shared-supper",
        "name": "Shared Supper",
        "scene": "A family reunion meal with everyday dishes and red cloth napkins"
      },
      {
        "slug": "lantern-afternoon",
        "name": "Lantern Afternoon",
        "scene": "Paper lanterns resting on a community hall table before a gathering"
      },
      {
        "slug": "new-year-kitchen",
        "name": "New Year Kitchen",
        "scene": "A tray of rice cakes and a plain red cloth in a lived-in kitchen"
      },
      {
        "slug": "lion-dance-leap",
        "name": "Lion Dance Leap",
        "scene": "A traditional Chinese lion dance team performs a lively leap in a community plaza, low wide action photograph with realistic movement"
      },
      {
        "slug": "red-door-morning",
        "name": "Red Door Morning",
        "scene": "A weathered red doorway opens onto a sunlit courtyard with modest Lunar New Year decorations, straight-on architectural photograph"
      },
      {
        "slug": "plum-blossom-snow",
        "name": "Plum Blossom Snow",
        "scene": "Pink plum blossoms emerge above a light dusting of snow, close botanical view with cool winter backlight"
      },
      {
        "slug": "train-station-reunion",
        "name": "Train Station Reunion",
        "scene": "A family embraces at a busy railway station during the Lunar New Year travel season, candid side view with luggage and no readable signs"
      },
      {
        "slug": "lantern-river-night",
        "name": "Lantern River Night",
        "scene": "Red lanterns reflect in a calm canal beside old buildings, realistic wide night photograph with restrained warm light"
      },
      {
        "slug": "tangerine-tree",
        "name": "Tangerine Tree",
        "scene": "A small fruiting tangerine tree stands at a home entrance, low botanical photograph emphasizing glossy leaves and ripe orange fruit"
      },
      {
        "slug": "the-dumpling-fold",
        "name": "The Dumpling Fold",
        "scene": "Two generations fold dumplings together, close candid hand detail with flour and unbranded ingredients"
      },
      {
        "slug": "dragon-dance-street",
        "name": "Dragon Dance Street",
        "scene": "A long festival dragon moves through a neighborhood street, elevated wide photograph showing coordinated performers and ordinary spectators"
      },
      {
        "slug": "korean-new-year-bow",
        "name": "Korean New Year Bow",
        "scene": "A Korean family exchanges a respectful New Year bow in a simple contemporary home, distant candid interior photograph without exaggerated costume"
      },
      {
        "slug": "peach-blossom-market",
        "name": "Peach Blossom Market",
        "scene": "Vietnamese Tet shoppers carry peach blossom branches through a local flower market, wide candid street photograph"
      },
      {
        "slug": "firework-over-the-harbor",
        "name": "Firework over the Harbor",
        "scene": "A restrained Lunar New Year fireworks display rises above a real harbor skyline, distant wide photograph with believable exposure"
      },
      {
        "slug": "the-family-red-envelope",
        "name": "The Family Red Envelope",
        "scene": "An older hand offers a plain red envelope to a child's hands, intimate close photograph with no printed characters"
      },
      {
        "slug": "courtyard-sweeping",
        "name": "Courtyard Sweeping",
        "scene": "A resident sweeps an ordinary courtyard before Lunar New Year, wide doorway view in clean winter sunlight"
      },
      {
        "slug": "temple-roof-lanterns",
        "name": "Temple Roof Lanterns",
        "scene": "Modest red lanterns hang beneath the eaves of a real East Asian temple courtyard, upward architectural view without invented sacred symbols"
      },
      {
        "slug": "winter-flower-train",
        "name": "Winter Flower Train",
        "scene": "Travelers carry flowering branches aboard an ordinary suburban train, candid aisle photograph with faces small and signs unreadable"
      },
      {
        "slug": "pomegranate-detail",
        "name": "Pomegranate Detail",
        "scene": "A freshly opened pomegranate lies beside one plain red envelope, overhead still life on a neutral stone ledge with rich natural seeds"
      },
      {
        "slug": "night-market-steam",
        "name": "Night Market Steam",
        "scene": "Steam rises from a dumpling stall in a crowded Lunar New Year night market, street-level documentary photograph with no readable branding"
      },
      {
        "slug": "the-family-portrait-setup",
        "name": "The Family Portrait Setup",
        "scene": "Three generations arrange themselves for an informal New Year family photograph in a living room, candid wide view with ordinary clothing"
      },
      {
        "slug": "kumquat-street",
        "name": "Kumquat Street",
        "scene": "Rows of real kumquat trees brighten a neighborhood street before Tet, low leading-line photograph with natural green and orange color"
      },
      {
        "slug": "lantern-maker-s-window",
        "name": "Lantern Maker's Window",
        "scene": "An artisan repairs one traditional paper lantern beside a window, close side view showing bamboo ribs and paper texture"
      },
      {
        "slug": "new-year-s-ferry",
        "name": "New Year's Ferry",
        "scene": "Families with flowers and small gifts ride a city ferry at dawn, wide rear view with a real harbor horizon"
      },
      {
        "slug": "snowy-village-gate",
        "name": "Snowy Village Gate",
        "scene": "A modest village gate decorated with simple red lanterns stands in fresh winter snow, wide landscape photograph with no readable text"
      },
      {
        "slug": "the-tea-greeting",
        "name": "The Tea Greeting",
        "scene": "An adult pours tea for an older relative during a New Year visit, close candid view of hands and plain ceramic cups"
      },
      {
        "slug": "chinese-opera-rehearsal",
        "name": "Chinese Opera Rehearsal",
        "scene": "A community opera performer rehearses on a small stage before a holiday program, wide side view with respectful costume detail and no spectacle excess"
      },
      {
        "slug": "spring-festival-train-window",
        "name": "Spring Festival Train Window",
        "scene": "A child looks through a train window at passing winter countryside while holding a plain red envelope, quiet candid profile"
      },
      {
        "slug": "vietnamese-yellow-apricot",
        "name": "Vietnamese Yellow Apricot",
        "scene": "Yellow apricot blossoms fill a Tet flower market corner, close botanical photograph with ordinary shoppers softly behind"
      },
      {
        "slug": "the-drumbeat",
        "name": "The Drumbeat",
        "scene": "Hands strike a large festival drum beside a lion dance performance, tight action photograph with realistic wood and drum skin texture"
      },
      {
        "slug": "family-shrine-flowers",
        "name": "Family Shrine Flowers",
        "scene": "Fresh flowers and fruit are arranged respectfully at a modest Vietnamese family remembrance area, wide interior view with no invented inscriptions"
      },
      {
        "slug": "lunar-new-year-skates",
        "name": "Lunar New Year Skates",
        "scene": "Children skate on a small public winter rink beneath modest red lantern decorations, wide candid photograph at blue hour"
      },
      {
        "slug": "the-open-gate",
        "name": "The Open Gate",
        "scene": "A carved wooden courtyard gate stands open to arriving relatives carrying small gifts, deep doorway composition in morning light"
      },
      {
        "slug": "rice-cake-preparation",
        "name": "Rice Cake Preparation",
        "scene": "Korean family members slice plain white tteok for a New Year meal, close candid hand detail in an ordinary home"
      },
      {
        "slug": "blossom-bicycle",
        "name": "Blossom Bicycle",
        "scene": "A bicycle carries a large branch of pink peach blossoms through a quiet Vietnamese street, side-on candid photograph"
      },
      {
        "slug": "festival-confetti-street",
        "name": "Festival Confetti Street",
        "scene": "Red paper confetti lies on a street after a community performance, ground-level photograph with festival activity distant beyond"
      },
      {
        "slug": "the-new-coat",
        "name": "The New Coat",
        "scene": "A parent fastens a child's simple red winter coat before a family New Year visit, close candid doorway photograph"
      },
      {
        "slug": "lanterns-across-the-bridge",
        "name": "Lanterns across the Bridge",
        "scene": "A small pedestrian bridge is lined with restrained red lanterns, long perspective photograph at dusk with soft water reflections"
      },
      {
        "slug": "calligraphy-brush-detail",
        "name": "Calligraphy Brush Detail",
        "scene": "A calligrapher's hand moves a brush over red paper with the marks cropped and unreadable, close textural photograph"
      },
      {
        "slug": "the-reunion-staircase",
        "name": "The Reunion Staircase",
        "scene": "Relatives carrying bags and flowers climb the stairs of a modest apartment building, candid upward architectural view"
      },
      {
        "slug": "new-year-park-walk",
        "name": "New Year Park Walk",
        "scene": "Three generations walk through a city park decorated for Lunar New Year, distant candid view with bare winter branches"
      },
      {
        "slug": "the-citrus-seller",
        "name": "The Citrus Seller",
        "scene": "A vendor sorts fresh citrus in wooden crates at a holiday market, close documentary view with natural fruit color"
      },
      {
        "slug": "paper-cut-window",
        "name": "Paper Cut Window",
        "scene": "A simple original red paper-cut decoration catches light on an apartment window, close view with a real city outside"
      },
      {
        "slug": "rooftop-lantern-glow",
        "name": "Rooftop Lantern Glow",
        "scene": "A family watches neighborhood lanterns from a modest rooftop, wide realistic night photograph with the skyline distant"
      },
      {
        "slug": "the-neighborhood-drummers",
        "name": "The Neighborhood Drummers",
        "scene": "A small community percussion group rehearses before a Lunar New Year gathering, candid wide view in an ordinary hall"
      },
      {
        "slug": "the-fish-pond",
        "name": "The Fish Pond",
        "scene": "Bright koi glide beneath floating winter blossom petals in a courtyard pond, overhead wildlife photograph with natural ripples"
      },
      {
        "slug": "tet-flower-delivery",
        "name": "Tet Flower Delivery",
        "scene": "A small unbranded delivery cart carries pots of chrysanthemums through a Vietnamese neighborhood, wide street photograph"
      },
      {
        "slug": "grandfather-s-story",
        "name": "Grandfather's Story",
        "scene": "An older family member tells a story while children listen during a New Year visit, candid profile grouping beside a bright window"
      },
      {
        "slug": "spring-festival-umbrellas",
        "name": "Spring Festival Umbrellas",
        "scene": "Rain beads on red umbrellas outside a community Lunar New Year gathering, high oblique street photograph with wet reflections"
      },
      {
        "slug": "the-first-blossoms",
        "name": "The First Blossoms",
        "scene": "A single flowering branch emerges from an old courtyard wall, spare close botanical composition in cool winter sun"
      },
      {
        "slug": "lion-head-rest",
        "name": "Lion Head Rest",
        "scene": "A handmade lion dance head rests backstage beside folded fabric and a drum, close environmental photograph with no performers wearing it"
      },
      {
        "slug": "quiet-after-the-festival",
        "name": "Quiet after the Festival",
        "scene": "A lantern-lit old street settles after the evening celebrations, wide blue-hour photograph with a resident closing a small shop"
      },
      {
        "slug": "the-dawn-reunion",
        "name": "The Dawn Reunion",
        "scene": "A family steps through an open front door into a sunlit courtyard together, candid rear view expressing arrival and a fresh beginning"
      }
    ]
  },
  {
    "id": "passover",
    "name": "Passover",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Nisan",
      "day": 15,
      "duration": 8,
      "eve": true
    },
    "palettes": [
      "marine",
      "sage",
      "ochre"
    ],
    "purpose": "potluck",
    "aliases": "Passover Pesach seder spring",
    "designs": [
      {
        "slug": "seder-table",
        "name": "Seder Table",
        "scene": "A modest Passover table with matzah, plain plates and a simple wine cup"
      },
      {
        "slug": "matzah-and-linen",
        "name": "Matzah and Linen",
        "scene": "Matzah on a ceramic plate beside a folded linen cloth"
      },
      {
        "slug": "spring-welcome",
        "name": "Spring Welcome",
        "scene": "A simple vase of spring flowers beside a Passover table setting"
      },
      {
        "slug": "family-kitchen",
        "name": "Family Kitchen",
        "scene": "A bowl of charoset and matzah on an ordinary kitchen counter"
      },
      {
        "slug": "quiet-preparation",
        "name": "Quiet Preparation",
        "scene": "Plain dishes, parsley and a small saltwater bowl on a wooden table"
      },
      {
        "slug": "community-seder",
        "name": "Community Seder",
        "scene": "Long tables in a modest community room prepared with matzah and simple dishes"
      },
      {
        "slug": "silver-cup",
        "name": "Silver Cup",
        "scene": "A simple silver kiddush cup beside matzah on a linen cloth"
      },
      {
        "slug": "spring-window",
        "name": "Spring Window",
        "scene": "A small bunch of tulips and a matzah plate beside a kitchen window"
      },
      {
        "slug": "gather-together",
        "name": "Gather Together",
        "scene": "A home dining table with mismatched chairs, matzah and plain glassware"
      },
      {
        "slug": "shared-traditions",
        "name": "Shared Traditions",
        "scene": "A small covered matzah plate and two plain candles on a sideboard"
      },
      {
        "slug": "matzah-texture",
        "name": "Matzah Texture",
        "scene": "A single piece of handmade matzah in extreme close detail, side-lit to reveal uneven bubbles and toasted edges"
      },
      {
        "slug": "spring-seder-garden",
        "name": "Spring Seder Garden",
        "scene": "A modest outdoor seder beneath a flowering tree, wide garden view with simple ritual objects and no readable text"
      },
      {
        "slug": "four-cups-in-window-light",
        "name": "Four Cups in Window Light",
        "scene": "Four simple wine cups catch window light on white linen, high oblique photograph with gentle natural reflections"
      },
      {
        "slug": "the-hidden-afikoman",
        "name": "The Hidden Afikoman",
        "scene": "A child discovers a cloth-wrapped afikoman tucked beside books on a low shelf, candid child-height view with unreadable titles"
      },
      {
        "slug": "jerusalem-spring-stone",
        "name": "Jerusalem Spring Stone",
        "scene": "Pale stone steps climb through a quiet Jerusalem courtyard with spring flowers, low architectural view in morning light"
      },
      {
        "slug": "the-seder-plate",
        "name": "The Seder Plate",
        "scene": "A correctly arranged traditional seder plate holds its distinct symbolic foods, overhead photograph without labels or inscriptions"
      },
      {
        "slug": "opening-the-door",
        "name": "Opening the Door",
        "scene": "A family opens a front door during a seder evening, respectful wide interior-to-exterior view with warm household light"
      },
      {
        "slug": "desert-journey-path",
        "name": "Desert Journey Path",
        "scene": "A narrow path winds through a real stony desert at sunrise, expansive low landscape suggesting a long journey without reenactment"
      },
      {
        "slug": "the-haggadah-cover",
        "name": "The Haggadah Cover",
        "scene": "A well-used closed Haggadah with an unlettered cloth cover rests on an armchair, close textural photograph"
      },
      {
        "slug": "spring-river-reeds",
        "name": "Spring River Reeds",
        "scene": "Young reeds grow along a clear spring riverbank, water-level photograph with fresh green leaves and soft distant hills"
      },
      {
        "slug": "matzah-bakery",
        "name": "Matzah Bakery",
        "scene": "A baker removes thin matzah from a traditional oven using a long peel, wide candid side view with realistic flour and heat"
      },
      {
        "slug": "family-questions",
        "name": "Family Questions",
        "scene": "A child speaks while older relatives listen during a family seder, distant candid doorway view with all text indistinct"
      },
      {
        "slug": "parsley-in-the-garden",
        "name": "Parsley in the Garden",
        "scene": "Fresh parsley grows in a terracotta planter beside an old stone wall, close botanical view with dew on the leaves"
      },
      {
        "slug": "the-saltwater-bowl",
        "name": "The Saltwater Bowl",
        "scene": "One small plain bowl of saltwater stands beside a sprig of parsley, low close composition with gentle reflections"
      },
      {
        "slug": "spring-synagogue-entrance",
        "name": "Spring Synagogue Entrance",
        "scene": "Open doors of a modest synagogue welcome spring daylight, wide architectural photograph without readable signage"
      },
      {
        "slug": "the-journey-bag",
        "name": "The Journey Bag",
        "scene": "A plain cloth travel bag and walking staff rest beside a sunlit stone threshold, spare still life without costume staging"
      },
      {
        "slug": "horseradish-root",
        "name": "Horseradish Root",
        "scene": "A freshly cut horseradish root lies on a plain wooden board, close macro photograph revealing fibrous pale texture"
      },
      {
        "slug": "community-seder-hall",
        "name": "Community Seder Hall",
        "scene": "Volunteers prepare an accessible community hall for a seder, elevated wide view with ordinary folding chairs and simple settings"
      },
      {
        "slug": "almond-blossom-hillside",
        "name": "Almond Blossom Hillside",
        "scene": "Almond trees bloom across a rocky spring hillside, low wide landscape with pale flowers against a soft blue sky"
      },
      {
        "slug": "the-matzah-cover",
        "name": "The Matzah Cover",
        "scene": "An unlettered hand-stitched matzah cover lies partly open, close fabric detail with a corner of matzah visible"
      },
      {
        "slug": "shared-reading",
        "name": "Shared Reading",
        "scene": "Two generations follow an unreadable Haggadah page together, intimate candid view of hands and attentive profiles"
      },
      {
        "slug": "a-cup-for-elijah",
        "name": "A Cup for Elijah",
        "scene": "A single special wine cup stands near an open window during seder, close side-lit photograph with a quiet night outside"
      },
      {
        "slug": "spring-courtyard-arrival",
        "name": "Spring Courtyard Arrival",
        "scene": "Relatives carrying small bags and flowers arrive for seder, candid rear view through a courtyard gate"
      },
      {
        "slug": "the-charoset-bowl",
        "name": "The Charoset Bowl",
        "scene": "A small bowl of visibly chopped apples, nuts and cinnamon, overhead food detail with a simple spoon and no decorative abundance"
      },
      {
        "slug": "distant-desert-mountains",
        "name": "Distant Desert Mountains",
        "scene": "Layers of real desert mountains recede into a pale sunrise, wide landscape with a narrow dry valley leading forward"
      },
      {
        "slug": "the-extra-place",
        "name": "The Extra Place",
        "scene": "An extra place is set at a modest family seder for an absent loved one, quiet side view with a folded napkin and simple cup"
      },
      {
        "slug": "the-afikoman-search",
        "name": "The Afikoman Search",
        "scene": "Children search an ordinary sitting room for the afikoman, wide candid view with believable household details"
      },
      {
        "slug": "spring-stream-crossing",
        "name": "Spring Stream Crossing",
        "scene": "A small stone footbridge spans a clear stream beneath new leaves, low wide photograph evoking passage into spring"
      },
      {
        "slug": "the-bitter-greens",
        "name": "The Bitter Greens",
        "scene": "Fresh bitter greens and a plain ceramic bowl in close botanical detail, natural side light with real leaf texture"
      },
      {
        "slug": "night-at-the-door",
        "name": "Night at the Door",
        "scene": "Warm light spills from an open family doorway into a quiet night street, wide architectural photograph with a simple spring branch"
      },
      {
        "slug": "the-passover-visitor",
        "name": "The Passover Visitor",
        "scene": "An older relative is greeted with an embrace at a home entrance before seder, candid side view with ordinary clothes"
      },
      {
        "slug": "folded-linen",
        "name": "Folded Linen",
        "scene": "A stack of carefully folded white seder linens rests on a wooden chair, close overhead textural photograph"
      },
      {
        "slug": "spring-sheep-pasture",
        "name": "Spring Sheep Pasture",
        "scene": "A flock of sheep grazes a green rocky hillside under spring clouds, expansive landscape without sacrificial imagery"
      },
      {
        "slug": "the-handmade-cup",
        "name": "The Handmade Cup",
        "scene": "A handmade ceramic wine cup rests on an old stone windowsill, low close photograph with blossom outside"
      },
      {
        "slug": "before-the-seder",
        "name": "Before the Seder",
        "scene": "A family pauses together at a sunny window before their evening gathering, distant candid interior view with understated preparation"
      },
      {
        "slug": "matzah-ball-soup",
        "name": "Matzah Ball Soup",
        "scene": "One simple bowl of matzah ball soup with fresh dill, low side angle in honest natural home light"
      },
      {
        "slug": "the-open-gate-to-spring",
        "name": "The Open Gate to Spring",
        "scene": "An old garden gate opens onto a path of spring flowers, deep architectural composition in morning light"
      },
      {
        "slug": "passover-park-walk",
        "name": "Passover Park Walk",
        "scene": "A family carries matzah and fruit while walking in a spring park during the holiday, wide candid rear view"
      },
      {
        "slug": "the-seder-song",
        "name": "The Seder Song",
        "scene": "Relatives sing together during seder with simple cups and matzah visible, respectful distant view from the adjoining room"
      },
      {
        "slug": "wildflowers-among-stone",
        "name": "Wildflowers among Stone",
        "scene": "Small red and yellow wildflowers grow between pale limestone rocks, ground-level macro landscape in spring sunlight"
      },
      {
        "slug": "a-grandparent-s-place",
        "name": "A Grandparent's Place",
        "scene": "An older adult's reading glasses rest on a closed Haggadah beside a plain chair, close personal detail without readable words"
      },
      {
        "slug": "the-community-welcome",
        "name": "The Community Welcome",
        "scene": "A volunteer welcomes a newcomer into a modest community seder hall, candid doorway view with warm inclusive atmosphere"
      },
      {
        "slug": "fresh-beetroot",
        "name": "Fresh Beetroot",
        "scene": "A cut beetroot and fresh greens rest in a plain bowl as a vegetarian seder option, overhead photograph with natural deep red color"
      },
      {
        "slug": "spring-night-walk",
        "name": "Spring Night Walk",
        "scene": "Two generations walk a quiet neighborhood path after seder, distant realistic night photograph under ordinary street lamps"
      },
      {
        "slug": "the-last-matzah-crumb",
        "name": "The Last Matzah Crumb",
        "scene": "A child's hand reaches for a small piece of matzah beside an empty plate, candid close detail with real crumbs"
      },
      {
        "slug": "stone-arch-and-sky",
        "name": "Stone Arch and Sky",
        "scene": "A weathered stone arch frames clear spring sky and a distant hillside, low upward architectural photograph"
      },
      {
        "slug": "a-simple-flower-welcome",
        "name": "A Simple Flower Welcome",
        "scene": "A few modest spring flowers stand by a home entrance before seder, close environmental photograph without elaborate styling"
      },
      {
        "slug": "the-returning-family",
        "name": "The Returning Family",
        "scene": "A family walks toward a brightly lit home across a quiet spring street, wide blue-hour photograph with lived-in surroundings"
      },
      {
        "slug": "desert-stars",
        "name": "Desert Stars",
        "scene": "A scientifically plausible night sky stretches above a real desert ridge, restrained wide landscape with a faint foreground path"
      },
      {
        "slug": "morning-after-seder",
        "name": "Morning after Seder",
        "scene": "Morning light fills a quiet room with stacked Haggadot, simple cups and folded linens, wide peaceful view after the gathering"
      }
    ]
  },
  {
    "id": "rosh-hashanah",
    "name": "Rosh Hashanah",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 1,
      "duration": 2,
      "eve": true
    },
    "palettes": [
      "ochre",
      "sage",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "Rosh Hashanah Jewish New Year apples honey",
    "designs": [
      {
        "slug": "apples-and-honey",
        "name": "Apples and Honey",
        "scene": "A sliced apple and a small honey jar on a simple wooden table"
      },
      {
        "slug": "round-challah",
        "name": "Round Challah",
        "scene": "A homemade round challah on a linen cloth in a kitchen"
      },
      {
        "slug": "sweet-beginning",
        "name": "Sweet Beginning",
        "scene": "A modest holiday table with apples, honey and ordinary plates"
      },
      {
        "slug": "autumn-orchard",
        "name": "Autumn Orchard",
        "scene": "A real apple orchard in soft overcast early-autumn daylight"
      },
      {
        "slug": "pomegranate-table",
        "name": "Pomegranate Table",
        "scene": "A few pomegranates and a ceramic bowl on a kitchen table"
      },
      {
        "slug": "family-gathering",
        "name": "Family Gathering",
        "scene": "A home dining table with round challah and seasonal flowers"
      },
      {
        "slug": "honey-cake",
        "name": "Honey Cake",
        "scene": "A homemade honey cake with an imperfect crust on a plain plate"
      },
      {
        "slug": "quiet-reflection",
        "name": "Quiet Reflection",
        "scene": "A simple bench beside a gentle stream in early autumn"
      },
      {
        "slug": "community-welcome",
        "name": "Community Welcome",
        "scene": "A community hall table with apples, honey and plain serving dishes"
      },
      {
        "slug": "golden-kitchen",
        "name": "Golden Kitchen",
        "scene": "Apples in a basket beside a jar of honey on a lived-in kitchen counter"
      },
      {
        "slug": "honey-drip",
        "name": "Honey Drip",
        "scene": "A thin stream of honey falls from a wooden dipper into a ceramic bowl, macro side view in natural amber light"
      },
      {
        "slug": "orchard-path",
        "name": "Orchard Path",
        "scene": "A path winds through a real apple orchard at early-autumn dawn, low wide landscape with mist and fruiting branches"
      },
      {
        "slug": "the-shofar",
        "name": "The Shofar",
        "scene": "A natural ram's-horn shofar rests on plain linen, close side-lit photograph showing its curved horn texture"
      },
      {
        "slug": "golden-spiral-challah",
        "name": "Golden Spiral Challah",
        "scene": "One homemade round challah cools on a wire rack, low close photograph with natural crust and no excessive styling"
      },
      {
        "slug": "pomegranate-jewels",
        "name": "Pomegranate Jewels",
        "scene": "One split pomegranate reveals fresh jewel-like seeds, overhead macro photograph on a pale stone ledge"
      },
      {
        "slug": "family-new-year-walk",
        "name": "Family New Year Walk",
        "scene": "Three generations walk through a city park at the start of autumn, distant candid view with warm low sunlight"
      },
      {
        "slug": "synagogue-welcome",
        "name": "Synagogue Welcome",
        "scene": "Open synagogue doors lead from a sunlit street into a quiet foyer, architectural wide photograph without readable signs"
      },
      {
        "slug": "apple-picking-reach",
        "name": "Apple Picking Reach",
        "scene": "A child's hand reaches for a ripe apple on a low branch, close candid view with real leaves and morning dew"
      },
      {
        "slug": "the-plain-greeting-card",
        "name": "The Plain Greeting Card",
        "scene": "An unlettered handmade New Year card lies beside a tiny autumn sprig, spare overhead personal still life"
      },
      {
        "slug": "riverbank-reflection",
        "name": "Riverbank Reflection",
        "scene": "A quiet group stands respectfully beside an autumn river, distant wide composition suggesting reflection without detailed ritual staging"
      },
      {
        "slug": "golden-pear-orchard",
        "name": "Golden Pear Orchard",
        "scene": "Ripe pears hang above an old orchard ladder, upward botanical photograph with early-autumn sky behind"
      },
      {
        "slug": "the-grandparent-s-hug",
        "name": "The Grandparent's Hug",
        "scene": "An older adult embraces a visiting grandchild at an apartment doorway, candid side view with small holiday gifts"
      },
      {
        "slug": "two-candle-flames",
        "name": "Two Candle Flames",
        "scene": "Two holiday candles glow beside a window at dusk, close photograph with realistic flames and a darkening autumn garden"
      },
      {
        "slug": "the-new-fruit",
        "name": "The New Fruit",
        "scene": "A freshly cut fig and its green leaves rest on a simple plate, macro photograph with rich real fruit texture"
      },
      {
        "slug": "autumn-courtyard",
        "name": "Autumn Courtyard",
        "scene": "Yellow leaves gather in a quiet synagogue courtyard, high oblique architectural view with warm stone and an open passage"
      },
      {
        "slug": "the-honeycomb-frame",
        "name": "The Honeycomb Frame",
        "scene": "A beekeeper inspects a honeycomb frame outdoors, close candid view with protective clothing and bees in focus"
      },
      {
        "slug": "autumn-market-choice",
        "name": "Autumn Market Choice",
        "scene": "A shopper chooses ripe apples at an ordinary autumn produce market, candid side view without readable labels"
      },
      {
        "slug": "the-tallit-bag",
        "name": "The Tallit Bag",
        "scene": "A simple unlettered prayer-shawl bag rests on a wooden synagogue seat, close textural photograph in morning light"
      },
      {
        "slug": "a-new-year-s-visit",
        "name": "A New Year's Visit",
        "scene": "Relatives carry a small bouquet and a covered homemade loaf up an apartment staircase, candid rear view"
      },
      {
        "slug": "september-lake",
        "name": "September Lake",
        "scene": "A calm lake reflects the first yellow autumn trees, water-level landscape with one quiet path along the shore"
      },
      {
        "slug": "the-pomegranate-tree",
        "name": "The Pomegranate Tree",
        "scene": "A ripe pomegranate hangs among green leaves in an autumn garden, upward close botanical composition"
      },
      {
        "slug": "community-holiday-baking",
        "name": "Community Holiday Baking",
        "scene": "Volunteers braid round challah in a modest community bakery before the holiday, close hand detail with flour and dough"
      },
      {
        "slug": "shofar-in-the-hall",
        "name": "Shofar in the Hall",
        "scene": "A community member holds a shofar near a bright synagogue window, respectful environmental portrait without spectacle"
      },
      {
        "slug": "apples-by-the-school-gate",
        "name": "Apples by the School Gate",
        "scene": "Children carrying small apple bags leave a community holiday-learning event, low candid street view without readable signs"
      },
      {
        "slug": "the-quiet-reading-chair",
        "name": "The Quiet Reading Chair",
        "scene": "A worn armchair holds a closed unlettered prayer book and reading glasses, soft side-lit interior photograph"
      },
      {
        "slug": "autumn-footbridge",
        "name": "Autumn Footbridge",
        "scene": "A small footbridge crosses a stream beneath gold leaves, long architectural perspective in early morning haze"
      },
      {
        "slug": "a-sweet-new-beginning",
        "name": "A Sweet New Beginning",
        "scene": "An adult helps a child dip an apple slice into honey, intimate candid hand detail with ordinary plates"
      },
      {
        "slug": "the-pantry-gift",
        "name": "The Pantry Gift",
        "scene": "A volunteer delivers a bag of holiday food to a neighbor's doorstep, candid wide view with private labels hidden"
      },
      {
        "slug": "fresh-dates",
        "name": "Fresh Dates",
        "scene": "A cluster of ripe dates rests on a plain woven tray, close low food photograph with natural warm color"
      },
      {
        "slug": "the-stained-glass-reflection",
        "name": "The Stained Glass Reflection",
        "scene": "Colored light from a synagogue window crosses an empty aisle, low interior perspective with calm autumn atmosphere"
      },
      {
        "slug": "new-year-s-bicycle-ride",
        "name": "New Year's Bicycle Ride",
        "scene": "A family cycles slowly along a leafy riverside path during the holiday season, broad candid landscape"
      },
      {
        "slug": "the-orchard-bench",
        "name": "The Orchard Bench",
        "scene": "A weathered bench sits beneath a fruit-heavy apple tree, wide environmental photograph with fallen leaves and dappled light"
      },
      {
        "slug": "the-covered-loaf",
        "name": "The Covered Loaf",
        "scene": "A round challah sits beneath an unlettered cloth cover, close angled photograph revealing part of its spiral form"
      },
      {
        "slug": "the-evening-arrival",
        "name": "The Evening Arrival",
        "scene": "Neighbors arrive at a modest synagogue entrance at blue hour, distant architectural view with warm interior light"
      },
      {
        "slug": "autumn-seed-head",
        "name": "Autumn Seed Head",
        "scene": "A dried sunflower head catches low golden light in a community garden, close botanical photograph of the turning season"
      },
      {
        "slug": "a-family-recipe-remembered",
        "name": "A Family Recipe Remembered",
        "scene": "An older adult shows a younger relative an unreadable handwritten recipe beside fresh apples, candid personal detail"
      },
      {
        "slug": "the-market-flower-cart",
        "name": "The Market Flower Cart",
        "scene": "An unbranded cart carries chrysanthemums through an autumn street market, wide street-level photograph"
      },
      {
        "slug": "the-shared-umbrella",
        "name": "The Shared Umbrella",
        "scene": "Two generations share an umbrella on the way to a holiday visit, low rainy-day street photograph with warm window reflections"
      },
      {
        "slug": "honey-in-the-sun",
        "name": "Honey in the Sun",
        "scene": "A small unmarked honey jar glows on a windowsill beside a living potted herb, tight natural-light composition"
      },
      {
        "slug": "the-open-prayer-book",
        "name": "The Open Prayer Book",
        "scene": "A prayer book with text indistinct rests on a synagogue lectern, oblique interior photograph with empty seats beyond"
      },
      {
        "slug": "a-year-of-growth",
        "name": "A Year of Growth",
        "scene": "A young fruit tree grows beside an older orchard tree, low wide garden photograph with rich soil and new leaves"
      },
      {
        "slug": "the-first-yellow-leaf",
        "name": "The First Yellow Leaf",
        "scene": "A yellow leaf floats on a still pond beneath reflected autumn branches, spare overhead natural photograph"
      },
      {
        "slug": "children-s-new-year-art",
        "name": "Children's New Year Art",
        "scene": "Original abstract apple-and-honey paintings dry on an easel after a community session, candid side view without text"
      },
      {
        "slug": "the-dinner-doorway",
        "name": "The Dinner Doorway",
        "scene": "A modest holiday meal is glimpsed through an open dining-room doorway, wide candid view with simple round bread and flowers"
      },
      {
        "slug": "after-the-rain",
        "name": "After the Rain",
        "scene": "Raindrops shine on red apples hanging over a wet garden path, low botanical photograph under soft overcast light"
      },
      {
        "slug": "the-welcome-seat",
        "name": "The Welcome Seat",
        "scene": "A person makes room for an arriving neighbor on a synagogue bench, candid waist-height photograph with ordinary respectful details"
      },
      {
        "slug": "autumn-hilltop",
        "name": "Autumn Hilltop",
        "scene": "A golden hillside path opens toward a distant town under a pale morning sky, expansive landscape suggesting a fresh year"
      },
      {
        "slug": "the-new-notebook",
        "name": "The New Notebook",
        "scene": "A closed plain notebook and pencil rest on a park bench beside one fallen leaf, close personal still life without writing"
      },
      {
        "slug": "the-family-phone-call",
        "name": "The Family Phone Call",
        "scene": "An older adult smiles during a holiday video call by a bright window, candid profile with screen turned away"
      },
      {
        "slug": "a-quiet-new-year-night",
        "name": "A Quiet New Year Night",
        "scene": "Warm home windows reflect in a calm autumn street after evening visits, wide realistic night photograph with restrained light"
      }
    ]
  },
  {
    "id": "yom-kippur",
    "name": "Yom Kippur",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 10,
      "duration": 1,
      "eve": true
    },
    "palettes": [
      "slate",
      "marine",
      "sage"
    ],
    "purpose": "meeting",
    "aliases": "Yom Kippur Day of Atonement reflection",
    "designs": [
      {
        "slug": "quiet-candle",
        "name": "Quiet Candle",
        "scene": "A single plain white memorial candle on an uncluttered wooden table"
      },
      {
        "slug": "reflection-garden",
        "name": "Reflection Garden",
        "scene": "A quiet garden bench beside white autumn flowers"
      },
      {
        "slug": "open-door",
        "name": "Open Door",
        "scene": "A simple synagogue entrance in soft daylight, no readable signage"
      },
      {
        "slug": "still-water",
        "name": "Still Water",
        "scene": "A calm pond bordered by autumn reeds under an overcast sky"
      },
      {
        "slug": "white-linen",
        "name": "White Linen",
        "scene": "A neatly folded white linen cloth beside a plain candle holder"
      },
      {
        "slug": "community-space",
        "name": "Community Space",
        "scene": "A modest quiet room with rows of wooden chairs and natural light"
      },
      {
        "slug": "autumn-light",
        "name": "Autumn Light",
        "scene": "Soft daylight falling across an empty wooden bench and pale wall"
      },
      {
        "slug": "peaceful-path",
        "name": "Peaceful Path",
        "scene": "A quiet tree-lined path with scattered early autumn leaves"
      },
      {
        "slug": "gather-in-reflection",
        "name": "Gather in Reflection",
        "scene": "A circle of empty chairs in a calm community room"
      },
      {
        "slug": "evening-candle",
        "name": "Evening Candle",
        "scene": "One simple white candle glowing beside a window at dusk, realistic exposure"
      },
      {
        "slug": "white-linen-light",
        "name": "White Linen Light",
        "scene": "A plain white garment hangs near an open window, close side-lit photograph of soft linen folds and a quiet autumn sky"
      },
      {
        "slug": "the-empty-sanctuary",
        "name": "The Empty Sanctuary",
        "scene": "An empty modest synagogue sanctuary awaits the day, long symmetrical interior perspective in soft natural light"
      },
      {
        "slug": "one-memorial-flame",
        "name": "One Memorial Flame",
        "scene": "One sheltered memorial candle glows against a dark quiet background, intimate close photograph with a realistic small flame"
      },
      {
        "slug": "the-stone-threshold",
        "name": "The Stone Threshold",
        "scene": "An old stone threshold leads into a peaceful synagogue foyer, low architectural composition with morning light across the floor"
      },
      {
        "slug": "reflection-by-the-sea",
        "name": "Reflection by the Sea",
        "scene": "A solitary figure stands on a quiet shore looking to the horizon, distant respectful wide photograph without theatrical gestures"
      },
      {
        "slug": "the-folded-tallit",
        "name": "The Folded Tallit",
        "scene": "A folded prayer shawl rests on a plain wooden seat, close textural view with subtle stripes and no readable text"
      },
      {
        "slug": "autumn-silence",
        "name": "Autumn Silence",
        "scene": "A narrow path crosses quiet autumn woodland, ground-level leading lines beneath softly falling leaves"
      },
      {
        "slug": "canvas-shoes",
        "name": "Canvas Shoes",
        "scene": "A clean pair of simple canvas shoes waits beside a home doorway, low close photograph in gentle morning light"
      },
      {
        "slug": "open-hands",
        "name": "Open Hands",
        "scene": "Relaxed open hands rest on a lap during quiet reflection, intimate overhead photograph with plain white fabric and natural skin detail"
      },
      {
        "slug": "the-closed-machzor",
        "name": "The Closed Machzor",
        "scene": "A worn prayer book with an unlettered cover rests beside reading glasses, quiet close photograph without food or decorations"
      },
      {
        "slug": "synagogue-window",
        "name": "Synagogue Window",
        "scene": "A tall plain synagogue window admits a shaft of soft light into a calm interior, upward architectural photograph"
      },
      {
        "slug": "the-listening-bench",
        "name": "The Listening Bench",
        "scene": "An empty park bench faces a still lake beneath early-autumn trees, broad quiet landscape with generous open space"
      },
      {
        "slug": "before-sunset",
        "name": "Before Sunset",
        "scene": "A family in simple light clothing walks toward a neighborhood synagogue before sunset, distant candid rear view"
      },
      {
        "slug": "stone-and-shadow",
        "name": "Stone and Shadow",
        "scene": "A narrow band of afternoon light crosses a pale stone wall, spare abstract architectural photograph with calm natural texture"
      },
      {
        "slug": "the-quiet-courtyard",
        "name": "The Quiet Courtyard",
        "scene": "A modest synagogue courtyard sits still under an olive tree, high oblique view with fallen leaves and an open passage"
      },
      {
        "slug": "a-shared-pause",
        "name": "A Shared Pause",
        "scene": "Two adults sit quietly together on a garden bench, distant candid view from behind without food or festive objects"
      },
      {
        "slug": "white-flowers-in-the-garden",
        "name": "White Flowers in the Garden",
        "scene": "Natural white flowers bloom beside a stone path, close botanical view with dew and soft autumn light"
      },
      {
        "slug": "the-open-door-to-light",
        "name": "The Open Door to Light",
        "scene": "A dark interior doorway frames a bright quiet garden, deep architectural photograph with a gentle sense of openness"
      },
      {
        "slug": "prayer-at-a-distance",
        "name": "Prayer at a Distance",
        "scene": "A small congregation is seen respectfully from the rear of a modest sanctuary, wide distant composition without identifiable faces or readable pages"
      },
      {
        "slug": "a-leaf-on-water",
        "name": "A Leaf on Water",
        "scene": "One pale leaf floats on a still pool reflecting an autumn sky, sparse overhead natural photograph"
      },
      {
        "slug": "the-white-curtain",
        "name": "The White Curtain",
        "scene": "A plain white curtain moves gently beside an open window, close atmospheric photograph with soft natural shadows"
      },
      {
        "slug": "the-riverside-walk",
        "name": "The Riverside Walk",
        "scene": "A quiet figure walks along an autumn riverbank path, distant wide landscape suggesting introspection"
      },
      {
        "slug": "quiet-synagogue-alcove",
        "name": "Quiet Synagogue Alcove",
        "scene": "A simple synagogue alcove holds one wooden chair and a small window, restrained interior photograph without mixed religious symbols"
      },
      {
        "slug": "an-elder-s-hand",
        "name": "An Elder's Hand",
        "scene": "A younger adult gently holds an elder's hand during a quiet visit, intimate close detail in plain natural light"
      },
      {
        "slug": "the-long-aisle",
        "name": "The Long Aisle",
        "scene": "A side aisle of a modest synagogue leads toward a soft-lit doorway, low architectural perspective with worn timber and pale walls"
      },
      {
        "slug": "after-the-storm",
        "name": "After the Storm",
        "scene": "Calm light emerges through clouds above a quiet coastline, expansive realistic landscape with a level horizon"
      },
      {
        "slug": "simple-white-kippah",
        "name": "Simple White Kippah",
        "scene": "A plain white kippah rests beside a folded prayer shawl on an ordinary wooden shelf, close respectful still life"
      },
      {
        "slug": "the-unused-phone",
        "name": "The Unused Phone",
        "scene": "A dark unlit phone rests face down beside a closed notebook on a windowsill, spare personal detail suggesting a pause from distraction"
      },
      {
        "slug": "a-quiet-orchard",
        "name": "A Quiet Orchard",
        "scene": "An empty orchard path lies under early-autumn mist, wide landscape without a harvest feast or people at work"
      },
      {
        "slug": "the-neighbor-s-embrace",
        "name": "The Neighbor's Embrace",
        "scene": "Neighbors share a gentle embrace outside a home before the day begins, candid medium view with understated clothes"
      },
      {
        "slug": "evening-sanctuary-lights",
        "name": "Evening Sanctuary Lights",
        "scene": "Warm interior light glows through synagogue windows at dusk, wide exterior architectural photograph of a quiet street"
      },
      {
        "slug": "the-smooth-river-stone",
        "name": "The Smooth River Stone",
        "scene": "One smooth pale stone rests at the edge of clear moving water, low close photograph with natural texture"
      },
      {
        "slug": "the-white-ark-curtain",
        "name": "The White Ark Curtain",
        "scene": "An unlettered white Torah-ark curtain is seen from a respectful distance, quiet frontal synagogue interior photograph"
      },
      {
        "slug": "a-path-through-reeds",
        "name": "A Path through Reeds",
        "scene": "A narrow boardwalk passes through still reeds under a pale sky, low wide photograph with restrained autumn color"
      },
      {
        "slug": "the-empty-writing-page",
        "name": "The Empty Writing Page",
        "scene": "A blank notebook and unused pencil lie together before the holy day, overhead personal still life without food"
      },
      {
        "slug": "sunlight-on-the-steps",
        "name": "Sunlight on the Steps",
        "scene": "Late-afternoon light crosses empty stone synagogue steps, low architectural detail with long calm shadows"
      },
      {
        "slug": "the-sheltered-olive-tree",
        "name": "The Sheltered Olive Tree",
        "scene": "An old olive tree grows in a small walled courtyard, upward botanical photograph with silver-green leaves against sky"
      },
      {
        "slug": "a-family-s-quiet-moment",
        "name": "A Family's Quiet Moment",
        "scene": "A family in plain light clothing stands together by a window before leaving home, distant candid interior composition"
      },
      {
        "slug": "the-closed-gate",
        "name": "The Closed Gate",
        "scene": "A simple garden gate rests closed beside pale autumn grasses, straight-on quiet detail suggesting a day set apart"
      },
      {
        "slug": "the-prayer-book-shelf",
        "name": "The Prayer Book Shelf",
        "scene": "Prayer books with unreadable spines stand on a synagogue shelf, close oblique photograph of worn cloth bindings"
      },
      {
        "slug": "a-still-harbor",
        "name": "A Still Harbor",
        "scene": "Empty mooring ropes hang over calm harbor water under a muted dawn sky, wide atmospheric photograph without festive boats"
      },
      {
        "slug": "the-soft-wool-shawl",
        "name": "The Soft Wool Shawl",
        "scene": "A plain wool shawl drapes over an empty chair, close tactile photograph in filtered daylight"
      },
      {
        "slug": "cloud-reflection",
        "name": "Cloud Reflection",
        "scene": "A clear shallow pool reflects slow white clouds and one bare branch, overhead natural photograph with restrained color"
      },
      {
        "slug": "the-courtyard-passage",
        "name": "The Courtyard Passage",
        "scene": "A person in simple white clothing walks through a shaded synagogue passage, distant rear architectural composition"
      },
      {
        "slug": "nightfall-over-the-town",
        "name": "Nightfall over the Town",
        "scene": "A calm town skyline sits under a deep blue evening sky, realistic wide photograph with a few warm home lights"
      },
      {
        "slug": "the-last-sunbeam",
        "name": "The Last Sunbeam",
        "scene": "One final sunbeam touches an empty wooden synagogue bench, close interior photograph with soft natural falloff"
      },
      {
        "slug": "the-quiet-garden-wall",
        "name": "The Quiet Garden Wall",
        "scene": "Ivy and a few white blooms grow against an old garden wall, low botanical photograph in gentle overcast light"
      },
      {
        "slug": "holding-space",
        "name": "Holding Space",
        "scene": "An empty chair stands beside an open doorway during a quiet home visit, wide interior composition with calm natural colors"
      },
      {
        "slug": "the-evening-walk-home",
        "name": "The Evening Walk Home",
        "scene": "Two generations walk home along a quiet street after dark, distant realistic night photograph under ordinary street lamps"
      },
      {
        "slug": "a-new-morning",
        "name": "A New Morning",
        "scene": "Dawn light spreads across a still field beyond a simple open gate, wide landscape suggesting renewal without celebration or food"
      }
    ]
  },
  {
    "id": "sukkot",
    "name": "Sukkot",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Tishri",
      "day": 15,
      "duration": 7,
      "eve": true
    },
    "palettes": [
      "olive",
      "cider",
      "sage"
    ],
    "purpose": "potluck",
    "aliases": "Sukkot sukkah harvest Jewish fall",
    "designs": [
      {
        "slug": "garden-sukkah",
        "name": "Garden Sukkah",
        "scene": "A modest backyard sukkah with a branch-covered roof and a simple table"
      },
      {
        "slug": "harvest-basket",
        "name": "Harvest Basket",
        "scene": "An etrog citron and seasonal fruit in a plain basket on a table"
      },
      {
        "slug": "under-the-branches",
        "name": "Under the Branches",
        "scene": "A small family table inside a simple sukkah, leafy roof visible"
      },
      {
        "slug": "paper-chains",
        "name": "Paper Chains",
        "scene": "Handmade paper chains decorating a modest outdoor sukkah"
      },
      {
        "slug": "autumn-welcome",
        "name": "Autumn Welcome",
        "scene": "A simple sukkah entrance with potted plants and seasonal fruit"
      },
      {
        "slug": "shared-supper",
        "name": "Shared Supper",
        "scene": "Everyday dishes and bread on a table beneath a leafy sukkah roof"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "Folding chairs around a modest table inside a backyard sukkah"
      },
      {
        "slug": "harvest-kitchen",
        "name": "Harvest Kitchen",
        "scene": "Pomegranates, apples and squash on a lived-in kitchen counter"
      },
      {
        "slug": "afternoon-shade",
        "name": "Afternoon Shade",
        "scene": "Sunlight filtered through natural branches above a simple outdoor table"
      },
      {
        "slug": "community-sukkah",
        "name": "Community Sukkah",
        "scene": "A modest community sukkah with folding tables and restrained decorations"
      },
      {
        "slug": "under-the-branch-roof",
        "name": "Under the Branch Roof",
        "scene": "Sunlight filters through a sukkah roof of natural branches, upward close photograph with small patches of blue sky visible"
      },
      {
        "slug": "the-etrog",
        "name": "The Etrog",
        "scene": "One fresh yellow etrog rests in an open simple protective box, macro side view showing its distinctive dimpled skin"
      },
      {
        "slug": "courtyard-sukkah",
        "name": "Courtyard Sukkah",
        "scene": "A modest family sukkah stands in an ordinary apartment courtyard, wide architectural photograph through an open gate"
      },
      {
        "slug": "the-lulav-bundle",
        "name": "The Lulav Bundle",
        "scene": "A correctly assembled lulav with myrtle and willow is held upright beside an etrog, respectful close view in natural daylight"
      },
      {
        "slug": "harvest-orchard-path",
        "name": "Harvest Orchard Path",
        "scene": "A path winds between fruit-heavy autumn orchard trees, low wide landscape with a weathered harvest basket at the edge"
      },
      {
        "slug": "building-together",
        "name": "Building Together",
        "scene": "Neighbors assemble the wooden frame of a community sukkah before the holiday, candid low-angle photograph with practical tools"
      },
      {
        "slug": "the-paper-chain",
        "name": "The Paper Chain",
        "scene": "Children's handmade paper chains hang inside a simple sukkah, close upward view with branch-roof shadows and no readable writing"
      },
      {
        "slug": "an-open-welcome",
        "name": "An Open Welcome",
        "scene": "A family welcomes a visitor through the open side of a garden sukkah, candid rear three-quarter view in warm autumn light"
      },
      {
        "slug": "palm-leaf-detail",
        "name": "Palm Leaf Detail",
        "scene": "A single natural palm leaf casts a long shadow across a pale courtyard wall, spare botanical close photograph"
      },
      {
        "slug": "the-rooftop-sukkah",
        "name": "The Rooftop Sukkah",
        "scene": "A modest rooftop sukkah overlooks ordinary city apartments, wide elevated architectural photograph at golden hour"
      },
      {
        "slug": "autumn-grapevine",
        "name": "Autumn Grapevine",
        "scene": "Ripe grapes and yellowing leaves hang over a garden path, close botanical view with soft early-autumn backlight"
      },
      {
        "slug": "the-small-builder",
        "name": "The Small Builder",
        "scene": "A child helps carry a short plank to adults building a sukkah, candid child-height photograph in an ordinary backyard"
      },
      {
        "slug": "stars-through-the-roof",
        "name": "Stars through the Roof",
        "scene": "A realistic night sky is glimpsed through gaps in a natural branch sukkah roof, restrained upward photograph with subtle stars"
      },
      {
        "slug": "the-community-invitation",
        "name": "The Community Invitation",
        "scene": "A neighbor gestures warmly toward an open community sukkah, wide candid view without readable signs or staged grandeur"
      },
      {
        "slug": "willow-by-the-water",
        "name": "Willow by the Water",
        "scene": "Willow branches bend over a quiet stream in autumn, low water-level landscape with natural reflected green"
      },
      {
        "slug": "the-harvest-crate",
        "name": "The Harvest Crate",
        "scene": "A crate of freshly gathered squash, figs and apples rests on garden soil, overhead documentary photograph with real dirt and leaves"
      },
      {
        "slug": "morning-in-the-sukkah",
        "name": "Morning in the Sukkah",
        "scene": "A child reads an unlettered book inside a simple sunny sukkah, candid side view with branch shadows on the walls"
      },
      {
        "slug": "myrtle-leaves",
        "name": "Myrtle Leaves",
        "scene": "Glossy myrtle leaves show tiny dew droplets, macro botanical photograph with accurate leaf texture and natural green color"
      },
      {
        "slug": "the-accessible-sukkah",
        "name": "The Accessible Sukkah",
        "scene": "A community sukkah has a broad level entrance and room for ordinary mobility aids, wide welcoming architectural photograph"
      },
      {
        "slug": "autumn-rain-pause",
        "name": "Autumn Rain Pause",
        "scene": "Rain beads on the edge of a sukkah's simple exterior wall after a shower, close side photograph with wet garden paving"
      },
      {
        "slug": "the-shared-harvest",
        "name": "The Shared Harvest",
        "scene": "Neighbors carry fresh vegetables toward a community gathering during the holiday, distant candid path view under autumn trees"
      },
      {
        "slug": "the-pomegranate-branch",
        "name": "The Pomegranate Branch",
        "scene": "A ripe pomegranate hangs beside yellowing leaves in an autumn garden, upward close botanical view"
      },
      {
        "slug": "reading-beneath-the-roof",
        "name": "Reading beneath the Roof",
        "scene": "Two generations read together on a bench inside a sukkah, intimate candid profile with all book text indistinct"
      },
      {
        "slug": "the-garden-lantern",
        "name": "The Garden Lantern",
        "scene": "One modest sheltered lantern lights the entrance to a garden sukkah at dusk, wide realistic evening photograph"
      },
      {
        "slug": "the-wooden-joint",
        "name": "The Wooden Joint",
        "scene": "Hands secure a plain wooden corner joint while building a sukkah before the holiday, close practical detail with sawdust"
      },
      {
        "slug": "the-fig-tree",
        "name": "The Fig Tree",
        "scene": "A fig tree spreads over a sunlit courtyard with a simple sukkah visible in the distance, low wide botanical composition"
      },
      {
        "slug": "children-s-harvest-art",
        "name": "Children's Harvest Art",
        "scene": "Original unlettered drawings of fruit hang from clips inside a sukkah, close candid view with a child arranging one sheet"
      },
      {
        "slug": "the-open-side",
        "name": "The Open Side",
        "scene": "A simple sukkah opens directly onto an autumn garden, deep inside-to-outside composition with no elaborate staged meal"
      },
      {
        "slug": "the-orchard-ladder",
        "name": "The Orchard Ladder",
        "scene": "A worn wooden ladder leans against a pear tree in an autumn orchard, low architectural landscape with fallen leaves"
      },
      {
        "slug": "carrying-the-four-species",
        "name": "Carrying the Four Species",
        "scene": "An adult carries a lulav bundle and etrog case along a quiet street, respectful waist-height candid photograph"
      },
      {
        "slug": "the-balcony-shelter",
        "name": "The Balcony Shelter",
        "scene": "A small sukkah fits on an ordinary apartment balcony, upward urban architectural photograph with real neighboring windows"
      },
      {
        "slug": "the-autumn-breeze",
        "name": "The Autumn Breeze",
        "scene": "Light cloth walls of a garden sukkah move in a gentle breeze, close atmospheric photograph with warm natural shadows"
      },
      {
        "slug": "a-new-neighbor",
        "name": "A New Neighbor",
        "scene": "A family makes room on a sukkah bench for a newly arriving neighbor, candid wide view with ordinary clothes"
      },
      {
        "slug": "the-woven-basket",
        "name": "The Woven Basket",
        "scene": "A handmade basket holds freshly picked dates and figs beside a garden gate, low close photograph with rich natural fruit texture"
      },
      {
        "slug": "sukkah-in-the-schoolyard",
        "name": "Sukkah in the Schoolyard",
        "scene": "A modest schoolyard sukkah stands beside ordinary play equipment, wide environmental photograph with children small in the distance"
      },
      {
        "slug": "the-quiet-etrog-orchard",
        "name": "The Quiet Etrog Orchard",
        "scene": "Real etrog trees grow in neat rows beneath an autumn sky, low landscape with yellow fruit visible among the leaves"
      },
      {
        "slug": "branch-roof-makers",
        "name": "Branch Roof Makers",
        "scene": "Adults lay natural branches across a sukkah frame before the holiday, upward documentary photograph with clear safe working positions"
      },
      {
        "slug": "the-holiday-walk",
        "name": "The Holiday Walk",
        "scene": "Three generations walk between neighboring courtyard sukkahs, distant candid street view in soft afternoon light"
      },
      {
        "slug": "the-autumn-moon",
        "name": "The Autumn Moon",
        "scene": "A realistic moon rises above a low garden sukkah roof, wide blue-hour landscape with restrained exposure"
      },
      {
        "slug": "harvest-sunflower",
        "name": "Harvest Sunflower",
        "scene": "A mature sunflower bends above an autumn garden plot, close botanical view with a simple sukkah far behind"
      },
      {
        "slug": "the-community-music-circle",
        "name": "The Community Music Circle",
        "scene": "Friends sing together seated inside a spacious community sukkah, distant doorway view without amplified performance staging"
      },
      {
        "slug": "the-simple-bench",
        "name": "The Simple Bench",
        "scene": "A plain wooden bench holds a folded shawl beside an open sukkah wall, close personal detail in morning sunlight"
      },
      {
        "slug": "leaves-across-the-path",
        "name": "Leaves across the Path",
        "scene": "Gold leaves collect along a stone path leading to a backyard sukkah, ground-level leading-line photograph"
      },
      {
        "slug": "the-living-wall",
        "name": "The Living Wall",
        "scene": "Climbing vines grow beside a sukkah wall in a small courtyard, close botanical view with woven branch shadows"
      },
      {
        "slug": "a-child-s-first-visit",
        "name": "A Child's First Visit",
        "scene": "An adult guides a curious child through a community sukkah entrance, candid low-angle view with warm welcoming light"
      },
      {
        "slug": "the-harvest-market-cart",
        "name": "The Harvest Market Cart",
        "scene": "A small unbranded cart carries autumn produce past a community sukkah, wide neighborhood street photograph"
      },
      {
        "slug": "the-quiet-study-hour",
        "name": "The Quiet Study Hour",
        "scene": "An older adult sits with an unreadable book in a peaceful sukkah corner, respectful side portrait with filtered daylight"
      },
      {
        "slug": "an-urban-autumn-garden",
        "name": "An Urban Autumn Garden",
        "scene": "A garden sukkah sits among raised vegetable beds and ordinary city buildings, elevated wide photograph showing its practical setting"
      },
      {
        "slug": "the-last-evening-glow",
        "name": "The Last Evening Glow",
        "scene": "Warm light fills a modest sukkah as dusk settles over a quiet backyard, broad exterior photograph with realistic soft illumination"
      },
      {
        "slug": "sky-beyond-the-branches",
        "name": "Sky beyond the Branches",
        "scene": "The morning sky opens through a natural sukkah roof after a cool autumn night, upward photograph emphasizing fresh light and honest texture"
      }
    ]
  },
  {
    "id": "hanukkah",
    "name": "Hanukkah",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "hebrew",
      "month": "Kislev",
      "day": 25,
      "duration": 8,
      "eve": true
    },
    "palettes": [
      "marine",
      "cobalt",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Hanukkah Chanukah festival lights dreidel",
    "designs": [
      {
        "slug": "window-lights",
        "name": "Window Lights",
        "scene": "A simple nine-branched hanukkiah on a windowsill, eight equal-height candle holders and one elevated central shamash, natural home setting"
      },
      {
        "slug": "latke-kitchen",
        "name": "Latke Kitchen",
        "scene": "Homemade latkes and applesauce on plain plates in an ordinary kitchen"
      },
      {
        "slug": "dreidel-afternoon",
        "name": "Dreidel Afternoon",
        "scene": "A few plain wooden dreidels beside chocolate coins on a table, no readable lettering"
      },
      {
        "slug": "family-table",
        "name": "Family Table",
        "scene": "A modest holiday supper table with blue napkins and simple flowers"
      },
      {
        "slug": "sufganiyot",
        "name": "Sufganiyot",
        "scene": "Homemade jelly doughnuts with uneven powdered sugar on a plain serving plate"
      },
      {
        "slug": "blue-and-linen",
        "name": "Blue and Linen",
        "scene": "A table setting with blue cloth napkins, ordinary plates and beeswax candles"
      },
      {
        "slug": "community-supper",
        "name": "Community Supper",
        "scene": "Folding tables prepared for a community Hanukkah meal with subtle blue decorations"
      },
      {
        "slug": "handmade-stars",
        "name": "Handmade Stars",
        "scene": "Paper star decorations and craft supplies on a family table"
      },
      {
        "slug": "winter-welcome",
        "name": "Winter Welcome",
        "scene": "A modest doorway with blue paper decorations and a small winter plant"
      },
      {
        "slug": "kitchen-gathering",
        "name": "Kitchen Gathering",
        "scene": "A well-used kitchen counter with dough, jam and a tray of doughnuts"
      },
      {
        "slug": "the-window-hanukkiah",
        "name": "The Window Hanukkiah",
        "scene": "A nine-branch Hanukkah menorah with eight candle positions and a distinct shamash stands at a window, close side view in winter blue light"
      },
      {
        "slug": "snowy-neighborhood-walk",
        "name": "Snowy Neighborhood Walk",
        "scene": "A family carries a small gift bag along a snowy neighborhood street during Hanukkah, distant candid rear view at dusk"
      },
      {
        "slug": "dreidel-in-motion",
        "name": "Dreidel in Motion",
        "scene": "A plain wooden dreidel spins on a worn floor beside a child's hand, low close action photograph with believable motion blur"
      },
      {
        "slug": "the-latke-pan",
        "name": "The Latke Pan",
        "scene": "Golden potato latkes fry in an ordinary cast-iron pan, close angled food photograph with real crisp edges and restrained steam"
      },
      {
        "slug": "winter-synagogue-courtyard",
        "name": "Winter Synagogue Courtyard",
        "scene": "A modest synagogue courtyard lies beneath fresh snow, wide architectural photograph with warm doorway light and no readable signs"
      },
      {
        "slug": "the-shamash-flame",
        "name": "The Shamash Flame",
        "scene": "A hand uses a shamash to light a candle on a correctly formed nine-branch hanukkiah, intimate close photograph with realistic flame size"
      },
      {
        "slug": "sufganiyot-bakery",
        "name": "Sufganiyot Bakery",
        "scene": "A baker dusts fresh jam-filled sufganiyot in a small neighborhood bakery, candid side view with flour and soft window light"
      },
      {
        "slug": "the-grandparent-visit",
        "name": "The Grandparent Visit",
        "scene": "A child hugs an older relative at a winter doorway before a Hanukkah gathering, candid medium photograph with ordinary coats"
      },
      {
        "slug": "blue-hour-canal",
        "name": "Blue Hour Canal",
        "scene": "A quiet winter canal reflects warm home windows and a distant Hanukkah display, broad water-level cityscape at blue hour"
      },
      {
        "slug": "the-gelt-pouch",
        "name": "The Gelt Pouch",
        "scene": "A small cloth pouch spills a few foil-wrapped chocolate coins onto a plain bench, overhead close detail without brands or writing"
      },
      {
        "slug": "family-candle-shadows",
        "name": "Family Candle Shadows",
        "scene": "A family stands together near candlelight, photographed as soft shadows on a living-room wall with no exaggerated flames"
      },
      {
        "slug": "the-community-choir",
        "name": "The Community Choir",
        "scene": "A small community choir rehearses Hanukkah songs in an ordinary hall, wide rear view with sheet music indistinct"
      },
      {
        "slug": "the-handmade-gift",
        "name": "The Handmade Gift",
        "scene": "A child offers a small unlettered handmade gift to a grandparent, candid close view of hands and simple wrapping"
      },
      {
        "slug": "winter-bookshop-visit",
        "name": "Winter Bookshop Visit",
        "scene": "Two generations browse a neighborhood bookshop before a holiday gathering, wide aisle photograph with all titles unreadable"
      },
      {
        "slug": "the-snow-lantern-path",
        "name": "The Snow Lantern Path",
        "scene": "A path through a snowy garden leads toward a warmly lit family home, low wide winter photograph with subtle porch lights"
      },
      {
        "slug": "the-olive-oil-bottle",
        "name": "The Olive Oil Bottle",
        "scene": "A small unmarked bottle of olive oil catches window light beside an olive sprig, spare close still life on a stone ledge"
      },
      {
        "slug": "hanukkah-in-the-city",
        "name": "Hanukkah in the City",
        "scene": "A real city street has a modest public Hanukkah display among ordinary winter shops, wide rainy-night photograph with signs unreadable"
      },
      {
        "slug": "the-dreidel-lesson",
        "name": "The Dreidel Lesson",
        "scene": "An older adult teaches a child a dreidel game on a living-room rug, candid overhead view with a few simple game pieces"
      },
      {
        "slug": "winter-conservatory",
        "name": "Winter Conservatory",
        "scene": "A family walks through a bright plant-filled conservatory during the holiday season, distant candid photograph with winter snow outside"
      },
      {
        "slug": "the-violin-tune",
        "name": "The Violin Tune",
        "scene": "A young musician rehearses a Hanukkah tune on violin beside a winter window, candid profile with no readable notation"
      },
      {
        "slug": "the-neighborhood-delivery",
        "name": "The Neighborhood Delivery",
        "scene": "Volunteers carry modest holiday food bags to a neighbor's doorstep, wide candid street photograph in ordinary winter clothes"
      },
      {
        "slug": "snow-on-the-olive-tree",
        "name": "Snow on the Olive Tree",
        "scene": "A potted olive tree dusted with a little snow stands beside a sheltered doorway, close botanical photograph with believable winter light"
      },
      {
        "slug": "the-eight-night-notebook",
        "name": "The Eight-Night Notebook",
        "scene": "A child's blank holiday sketchbook shows original abstract candle drawings without text, overhead close detail beside plain crayons"
      },
      {
        "slug": "the-skating-outing",
        "name": "The Skating Outing",
        "scene": "A family skates together on a small neighborhood winter rink, low candid action photograph with a modest Hanukkah banner blurred beyond"
      },
      {
        "slug": "window-reflections",
        "name": "Window Reflections",
        "scene": "A correctly formed hanukkiah reflects in a dark winter window beside distant city lights, tight atmospheric photograph with realistic candle exposure"
      },
      {
        "slug": "the-pottery-gift",
        "name": "The Pottery Gift",
        "scene": "An artisan holds an original small ceramic bowl made as a holiday gift, candid studio close view without repeated candle subjects"
      },
      {
        "slug": "the-warm-scarf",
        "name": "The Warm Scarf",
        "scene": "A hand-knitted blue scarf hangs over a child's winter coat beside the front door, intimate textural photograph"
      },
      {
        "slug": "community-hall-arrival",
        "name": "Community Hall Arrival",
        "scene": "Families arrive at a modest community Hanukkah gathering carrying coats and small bags, candid doorway view with warm interior light"
      },
      {
        "slug": "the-applesauce-bowl",
        "name": "The Applesauce Bowl",
        "scene": "A simple bowl of homemade applesauce accompanies a few latkes, close overhead food photograph without elaborate styling"
      },
      {
        "slug": "snowy-rooftop-view",
        "name": "Snowy Rooftop View",
        "scene": "A row of ordinary apartment rooftops lies under snow at dusk, wide cityscape with a few tiny candlelit windows"
      },
      {
        "slug": "the-family-song",
        "name": "The Family Song",
        "scene": "Relatives sing together in an ordinary living room after lighting candles, respectful distant view from the hallway"
      },
      {
        "slug": "the-gift-of-books",
        "name": "The Gift of Books",
        "scene": "A pair of hands wraps an unlettered cloth-covered book in plain paper, intimate overhead personal detail"
      },
      {
        "slug": "winter-harbor-lights",
        "name": "Winter Harbor Lights",
        "scene": "Warm harbor lights reflect on dark water during a Hanukkah-season evening walk, broad realistic night landscape"
      },
      {
        "slug": "the-child-s-clay-dreidel",
        "name": "The Child's Clay Dreidel",
        "scene": "A child's slightly uneven handmade clay dreidel dries on a windowsill, macro photograph with fingerprints and winter light"
      },
      {
        "slug": "a-place-for-everyone",
        "name": "A Place for Everyone",
        "scene": "Neighbors make room for a newcomer at a community holiday gathering, candid wide interior view emphasizing ordinary welcome"
      },
      {
        "slug": "the-brass-polish",
        "name": "The Brass Polish",
        "scene": "Hands polish an unlit correctly formed nine-branch hanukkiah before the holiday, close practical detail with worn metal texture"
      },
      {
        "slug": "snowy-forest-outing",
        "name": "Snowy Forest Outing",
        "scene": "Two generations walk a quiet snow-covered woodland trail during the holiday, distant rear view with warm coats and tall trees"
      },
      {
        "slug": "the-paper-star-mobile",
        "name": "The Paper Star Mobile",
        "scene": "Original folded blue-and-white paper stars hang near a winter window, upward close photograph with handmade paper texture"
      },
      {
        "slug": "the-music-case",
        "name": "The Music Case",
        "scene": "A worn clarinet case opens beside an ordinary community-stage chair before a holiday concert, low close environmental photograph"
      },
      {
        "slug": "the-long-distance-greeting",
        "name": "The Long-Distance Greeting",
        "scene": "A family smiles during a Hanukkah video call, candid side view with screen turned away and warm home light"
      },
      {
        "slug": "the-winter-flower-gift",
        "name": "The Winter Flower Gift",
        "scene": "A modest pot of white cyclamen is carried up apartment steps for a holiday visit, low candid photograph with snowy boots"
      },
      {
        "slug": "the-community-coat-drive",
        "name": "The Community Coat Drive",
        "scene": "Volunteers sort warm coats before a holiday donation delivery, wide candid view in an ordinary hall without readable labels"
      },
      {
        "slug": "the-first-snowball",
        "name": "The First Snowball",
        "scene": "A child offers a small snowball to a laughing parent outside a family gathering, candid low-angle action photograph"
      },
      {
        "slug": "the-quiet-reading-nook",
        "name": "The Quiet Reading Nook",
        "scene": "A child reads an unlettered book beneath a blue blanket in a window seat, intimate profile with snowy branches outside"
      },
      {
        "slug": "the-public-candle-gathering",
        "name": "The Public Candle Gathering",
        "scene": "A small community gathers around a correctly formed large nine-branch Hanukkah menorah outdoors, distant respectful blue-hour photograph"
      },
      {
        "slug": "the-cookie-shapes",
        "name": "The Cookie Shapes",
        "scene": "Simple homemade dreidel-shaped cookies cool on a wire rack, close side-lit food photograph with honest imperfect icing"
      },
      {
        "slug": "the-open-apartment-door",
        "name": "The Open Apartment Door",
        "scene": "Warm light spills from an open apartment into a dim winter stairwell as relatives arrive, architectural wide photograph"
      },
      {
        "slug": "the-last-night-candles",
        "name": "The Last Night Candles",
        "scene": "All eight candles and the shamash burn on a correctly formed nine-branch hanukkiah on the final night, spare frontal photograph without additional candleholders"
      },
      {
        "slug": "winter-morning-after-the-visit",
        "name": "Winter Morning after the Visit",
        "scene": "Small boots and adult shoes line a home entrance after a family gathering, low quiet photograph with snow melting on the mat"
      },
      {
        "slug": "a-street-of-warm-windows",
        "name": "A Street of Warm Windows",
        "scene": "A quiet winter residential street glows with varied warm windows after a Hanukkah evening, wide realistic night photograph with subtle snow"
      }
    ]
  },
  {
    "id": "kwanzaa",
    "name": "Kwanzaa",
    "kind": "Religious & cultural",
    "date": {
      "kind": "fixed",
      "month": 12,
      "day": 26,
      "duration": 7
    },
    "palettes": [
      "evergreen",
      "cherry",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Kwanzaa December January community harvest",
    "designs": [
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "A simple woven mat with corn, fruit and a plain wooden bowl on a family table"
      },
      {
        "slug": "seven-candles",
        "name": "Seven Candles",
        "scene": "A simple kinara with exactly seven candles, three red on the left, one black in the center and three green on the right, on a modest table"
      },
      {
        "slug": "community-gathering",
        "name": "Community Gathering",
        "scene": "A modest community table with red green and black cloth napkins"
      },
      {
        "slug": "shared-fruit",
        "name": "Shared Fruit",
        "scene": "A basket of oranges, apples and corn on an ordinary wooden table"
      },
      {
        "slug": "family-meal",
        "name": "Family Meal",
        "scene": "A home meal setting with greens, bread and everyday serving dishes"
      },
      {
        "slug": "handmade-gifts",
        "name": "Handmade Gifts",
        "scene": "A few small gifts wrapped in plain kraft paper with red and green ribbon"
      },
      {
        "slug": "story-circle",
        "name": "Story Circle",
        "scene": "A circle of chairs with a small table of unlettered books in a community room"
      },
      {
        "slug": "woven-textures",
        "name": "Woven Textures",
        "scene": "A natural woven mat and plain ceramic cup beside seasonal fruit"
      },
      {
        "slug": "neighborhood-supper",
        "name": "Neighborhood Supper",
        "scene": "Folding tables set for a community supper with restrained red and green decorations"
      },
      {
        "slug": "growing-community",
        "name": "Growing Community",
        "scene": "A basket of harvest produce beside potted plants on a simple porch"
      },
      {
        "slug": "the-kinara",
        "name": "The Kinara",
        "scene": "A seven-candle kinara holds a black center candle, three red candles on the viewer's left and three green on the right, close frontal photograph on a woven mat"
      },
      {
        "slug": "community-drumming-circle",
        "name": "Community Drumming Circle",
        "scene": "A Black community drumming circle rehearses in an ordinary neighborhood hall, wide candid photograph with real instruments and no costume stereotypes"
      },
      {
        "slug": "the-woven-mkeka",
        "name": "The Woven Mkeka",
        "scene": "A handwoven mkeka mat is shown in close textural detail with natural fibers and warm side light"
      },
      {
        "slug": "harvest-basket",
        "name": "Harvest Basket",
        "scene": "Fresh squash, corn and fruit fill one modest harvest basket, overhead documentary photograph on a plain woven mat"
      },
      {
        "slug": "family-candle-moment",
        "name": "Family Candle Moment",
        "scene": "A Black family gathers quietly around a correctly formed seven-candle kinara, distant candid interior view with warm natural light"
      },
      {
        "slug": "the-unity-cup",
        "name": "The Unity Cup",
        "scene": "A simple handmade unity cup rests beside a woven mat, close low photograph showing clay texture without invented symbols"
      },
      {
        "slug": "the-community-book-gift",
        "name": "The Community Book Gift",
        "scene": "An adult gives a child an unlettered cloth-covered book as a Kwanzaa gift, intimate candid view of hands"
      },
      {
        "slug": "neighborhood-mural-day",
        "name": "Neighborhood Mural Day",
        "scene": "Black neighbors paint an original abstract community mural before a Kwanzaa gathering, wide street photograph without copied artwork or slogans"
      },
      {
        "slug": "the-corn-ear",
        "name": "The Corn Ear",
        "scene": "One ear of dried corn rests on a plain woven mat, macro side view showing real kernels and natural husk texture"
      },
      {
        "slug": "the-open-community-door",
        "name": "The Open Community Door",
        "scene": "A contemporary Black cultural center opens its doors for a modest Kwanzaa gathering, wide architectural view with signs unreadable"
      },
      {
        "slug": "intergenerational-story",
        "name": "Intergenerational Story",
        "scene": "An older Black adult tells a family story to children in an ordinary living room, candid side view with warm window light"
      },
      {
        "slug": "the-handmade-bowl",
        "name": "The Handmade Bowl",
        "scene": "A Black ceramic artist holds a finished original bowl made as a holiday gift, close environmental photograph in a bright studio"
      },
      {
        "slug": "the-neighborhood-garden",
        "name": "The Neighborhood Garden",
        "scene": "Families tend a shared community garden before a holiday gathering, elevated wide view showing cooperative work and ordinary tools"
      },
      {
        "slug": "red-black-green-fabric",
        "name": "Red Black Green Fabric",
        "scene": "Folded red, black and green cotton fabric lies over a plain chair, close textural photograph without invented cultural patterns"
      },
      {
        "slug": "the-family-album",
        "name": "The Family Album",
        "scene": "Two generations turn a worn family photo album on a lap, intimate overhead detail with photographs indistinct"
      },
      {
        "slug": "the-spoken-word-stage",
        "name": "The Spoken Word Stage",
        "scene": "A young Black poet rehearses on a small community stage, wide side photograph with no readable lyrics or copied artwork"
      },
      {
        "slug": "community-market",
        "name": "Community Market",
        "scene": "Black local makers and growers set up a modest outdoor community market, wide candid aisle view without brands or signs"
      },
      {
        "slug": "the-child-s-handmade-gift",
        "name": "The Child's Handmade Gift",
        "scene": "A child wraps an original handmade toy in plain paper for a Kwanzaa gift, close candid hand detail"
      },
      {
        "slug": "winter-walk-together",
        "name": "Winter Walk Together",
        "scene": "A Black family walks arm in arm through a winter park on the way to a holiday visit, distant candid rear view"
      },
      {
        "slug": "the-first-candle",
        "name": "The First Candle",
        "scene": "The single black center candle burns in a correctly arranged seven-candle kinara, intimate close photograph with the red and green candles unlit"
      },
      {
        "slug": "the-shared-repair",
        "name": "The Shared Repair",
        "scene": "Neighbors repair a bicycle together in a community workshop before a gathering, candid low-angle photograph with practical tools"
      },
      {
        "slug": "the-harvest-squash",
        "name": "The Harvest Squash",
        "scene": "A cut winter squash and intact corn husks rest beside a simple woven basket, overhead close photograph with rich natural color"
      },
      {
        "slug": "dance-rehearsal",
        "name": "Dance Rehearsal",
        "scene": "A contemporary Black community dance group rehearses in an ordinary hall, low wide action photograph without stereotyped costume staging"
      },
      {
        "slug": "the-welcome-embrace",
        "name": "The Welcome Embrace",
        "scene": "Relatives greet with an embrace at a winter doorway before a Kwanzaa gathering, candid side photograph with ordinary coats"
      },
      {
        "slug": "the-youth-photographer",
        "name": "The Youth Photographer",
        "scene": "A young Black photographer documents a neighborhood arts project, candid environmental portrait with original work and no readable display"
      },
      {
        "slug": "the-family-purpose-circle",
        "name": "The Family Purpose Circle",
        "scene": "A family sits in a small conversation circle during a Kwanzaa evening, wide doorway view with a restrained kinara in the background"
      },
      {
        "slug": "the-quilter-s-hands",
        "name": "The Quilter's Hands",
        "scene": "An older Black artisan sews an original geometric quilt, close hand detail with no copied or invented sacred motifs"
      },
      {
        "slug": "community-food-delivery",
        "name": "Community Food Delivery",
        "scene": "Volunteers carry fresh produce and pantry food to a neighbor's home during Kwanzaa week, wide candid street photograph"
      },
      {
        "slug": "the-winter-window",
        "name": "The Winter Window",
        "scene": "A modest correctly arranged kinara is seen from outside a warm home window at blue hour, wide residential architectural photograph"
      },
      {
        "slug": "the-young-musician",
        "name": "The Young Musician",
        "scene": "A child practices cello in a bright community arts room before a holiday program, candid side view with no readable notation"
      },
      {
        "slug": "the-seed-gift",
        "name": "The Seed Gift",
        "scene": "A small cloth bag of vegetable seeds is offered beside a living seedling as a practical handmade gift, close overhead photograph without text"
      },
      {
        "slug": "the-community-library",
        "name": "The Community Library",
        "scene": "Black families browse a neighborhood community library during Kwanzaa week, wide aisle photograph with all book titles indistinct"
      },
      {
        "slug": "the-shared-meal-welcome",
        "name": "The Shared Meal Welcome",
        "scene": "A host welcomes a newcomer to a modest Kwanzaa community meal, candid doorway view with ordinary seating and inclusive atmosphere"
      },
      {
        "slug": "the-woodcarver-s-studio",
        "name": "The Woodcarver's Studio",
        "scene": "A Black woodworker shapes an original simple wooden cup in a modern workshop, close practical photograph without copied cultural symbols"
      },
      {
        "slug": "the-neighborhood-orchestra",
        "name": "The Neighborhood Orchestra",
        "scene": "A small community ensemble rehearses before a Kwanzaa program, wide candid hall view with ordinary clothing"
      },
      {
        "slug": "the-seven-candle-shadows",
        "name": "The Seven Candle Shadows",
        "scene": "A correctly formed kinara casts seven distinct candle shadows on a plain wall, spare side-lit photograph with honest geometry"
      },
      {
        "slug": "the-children-s-art-wall",
        "name": "The Children's Art Wall",
        "scene": "Original unlettered children's paintings about family and community hang in a hall, candid close view with one child adding a new sheet"
      },
      {
        "slug": "the-shared-orchard",
        "name": "The Shared Orchard",
        "scene": "Neighbors harvest fruit together in a community orchard, wide documentary photograph through branches with diverse ages"
      },
      {
        "slug": "the-homecoming-stair",
        "name": "The Homecoming Stair",
        "scene": "An adult child carries a small handmade gift up an apartment staircase for a Kwanzaa visit, low candid rear view"
      },
      {
        "slug": "the-basket-weaver",
        "name": "The Basket Weaver",
        "scene": "A Black artisan weaves a practical basket in a sunlit contemporary studio, close hand detail with natural fiber texture"
      },
      {
        "slug": "the-community-garden-gate",
        "name": "The Community Garden Gate",
        "scene": "A hand-painted unlettered garden gate opens toward shared growing beds, architectural wide photograph with neighbors small beyond"
      },
      {
        "slug": "the-family-recipe",
        "name": "The Family Recipe",
        "scene": "An older Black adult teaches a younger relative a familiar family recipe in an ordinary home, close candid hand detail without a staged banquet"
      },
      {
        "slug": "the-local-shop-visit",
        "name": "The Local Shop Visit",
        "scene": "A family browses a Black-owned neighborhood maker shop during Kwanzaa week, candid wide view with unbranded original goods"
      },
      {
        "slug": "the-story-quilt",
        "name": "The Story Quilt",
        "scene": "An original family quilt hangs on a plain community-hall wall beside an empty storytelling chair, wide quiet photograph without text"
      },
      {
        "slug": "the-shared-chess-lesson",
        "name": "The Shared Chess Lesson",
        "scene": "An older Black adult teaches children chess at a community center, candid high-angle view with real pieces and ordinary surroundings"
      },
      {
        "slug": "the-final-night-kinara",
        "name": "The Final Night Kinara",
        "scene": "All seven candles burn in a correctly arranged kinara on the final evening, close low photograph with one black center, three red left and three green right"
      },
      {
        "slug": "the-youth-gardeners",
        "name": "The Youth Gardeners",
        "scene": "Teenagers water a young tree planted for their community, low documentary photograph emphasizing shared care and real soil"
      },
      {
        "slug": "the-gratitude-gesture",
        "name": "The Gratitude Gesture",
        "scene": "A child offers an elder a small bowl of fresh fruit during a family gathering, close candid view of hands and gentle expressions"
      },
      {
        "slug": "the-evening-walk-home",
        "name": "The Evening Walk Home",
        "scene": "Two generations leave a Kwanzaa community gathering along a quiet winter street, wide realistic night photograph with warm doorway light"
      },
      {
        "slug": "the-next-year-s-sapling",
        "name": "The Next Year's Sapling",
        "scene": "A young potted fruit tree stands beside a community-center window at dawn, low botanical photograph suggesting shared work and future growth"
      }
    ]
  },
  {
    "id": "ramadan",
    "name": "Ramadan",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "9",
      "day": 1,
      "duration": 30,
      "eve": true
    },
    "palettes": [
      "teal",
      "ochre",
      "midnight"
    ],
    "purpose": "potluck",
    "aliases": "Ramadan Ramazan iftar suhoor community",
    "designs": [
      {
        "slug": "dates-and-water",
        "name": "Dates and Water",
        "scene": "A small bowl of dates and two glasses of water on a modest iftar table"
      },
      {
        "slug": "evening-welcome",
        "name": "Evening Welcome",
        "scene": "A simple metal lantern beside a doorway at realistic dusk"
      },
      {
        "slug": "community-iftar",
        "name": "Community Iftar",
        "scene": "Long tables in a modest community hall prepared with dates and water"
      },
      {
        "slug": "shared-soup",
        "name": "Shared Soup",
        "scene": "Plain bowls of soup and bread on a family table after sunset"
      },
      {
        "slug": "quiet-lantern",
        "name": "Quiet Lantern",
        "scene": "An ordinary metal lantern on a wooden windowsill in soft daylight"
      },
      {
        "slug": "family-preparation",
        "name": "Family Preparation",
        "scene": "A kitchen counter with fresh dates, bread and simple serving dishes"
      },
      {
        "slug": "tea-after-sunset",
        "name": "Tea After Sunset",
        "scene": "A small tea tray beside a window at blue hour"
      },
      {
        "slug": "neighborhood-table",
        "name": "Neighborhood Table",
        "scene": "A modest outdoor meal table with dates and pitchers of water"
      },
      {
        "slug": "giving-together",
        "name": "Giving Together",
        "scene": "Plain food packages and reusable bags on a community donation table"
      },
      {
        "slug": "evening-courtyard",
        "name": "Evening Courtyard",
        "scene": "A small residential courtyard with simple chairs and one lantern at dusk"
      },
      {
        "slug": "crescent-above-the-rooftops",
        "name": "Crescent Above the Rooftops",
        "scene": "Wide rooftop view of an ordinary neighborhood beneath a slender natural crescent at blue hour"
      },
      {
        "slug": "before-the-first-tram",
        "name": "Before the First Tram",
        "scene": "Ground-level view along a quiet tram platform just before dawn, city windows still illuminated"
      },
      {
        "slug": "courtyard-water",
        "name": "Courtyard Water",
        "scene": "Eye-level view of a tiled courtyard fountain reflecting warm Ramadan evening lights"
      },
      {
        "slug": "iftar-under-the-trees",
        "name": "Iftar Under the Trees",
        "scene": "Elevated view of long community iftar cloths arranged beneath mature park trees before guests arrive"
      },
      {
        "slug": "the-date-grove",
        "name": "The Date Grove",
        "scene": "Low-angle view into a real date-palm grove with heavy fruit clusters and dappled daylight"
      },
      {
        "slug": "bread-from-the-oven",
        "name": "Bread from the Oven",
        "scene": "Close view of fresh flatbread emerging beside the mouth of a small neighborhood bakery oven"
      },
      {
        "slug": "lantern-street",
        "name": "Lantern Street",
        "scene": "Wide street-level view of a pedestrian lane with restrained Ramadan lanterns at natural dusk"
      },
      {
        "slug": "water-for-everyone",
        "name": "Water for Everyone",
        "scene": "Overhead view of sealed drinking-water cartons and reusable cups at an outdoor iftar distribution point"
      },
      {
        "slug": "quiet-prayer-hall",
        "name": "Quiet Prayer Hall",
        "scene": "Symmetrical wide view of an empty contemporary mosque prayer hall, respectful and without readable inscriptions"
      },
      {
        "slug": "moonlit-harbor",
        "name": "Moonlit Harbor",
        "scene": "Long-lens view across a working harbor toward a modest illuminated mosque and natural evening sky"
      },
      {
        "slug": "evening-soup",
        "name": "Evening Soup",
        "scene": "Overhead view of a single bowl of lentil soup with lemon on a plain stone serving counter"
      },
      {
        "slug": "giving-pantry",
        "name": "Giving Pantry",
        "scene": "Wide view of carefully stocked community food-donation shelves without readable packaging"
      },
      {
        "slug": "suhoor-window",
        "name": "Suhoor Window",
        "scene": "Side view of a simple predawn breakfast beside a high-rise apartment window overlooking sleeping streets"
      },
      {
        "slug": "geometric-glass",
        "name": "Geometric Glass",
        "scene": "Macro view of colored geometric window glass casting Ramadan evening light across a plaster wall"
      },
      {
        "slug": "shoes-at-the-entrance",
        "name": "Shoes at the Entrance",
        "scene": "Ground-level view of orderly shoe shelves outside a quiet neighborhood prayer space"
      },
      {
        "slug": "the-delivery-bicycle",
        "name": "The Delivery Bicycle",
        "scene": "Eye-level view of a cargo bicycle carrying sealed iftar meal bags outside a community center"
      },
      {
        "slug": "palm-shadows",
        "name": "Palm Shadows",
        "scene": "High-angle view of late-afternoon palm shadows crossing an empty courtyard prepared for evening gathering"
      },
      {
        "slug": "dates-on-the-branch",
        "name": "Dates on the Branch",
        "scene": "Botanical close-up of ripe dates attached to their living palm stem, natural irregular fruit"
      },
      {
        "slug": "tea-steam",
        "name": "Tea Steam",
        "scene": "Tight side view of steam rising from a small glass of mint tea against an out-of-focus blue evening"
      },
      {
        "slug": "rugs-in-the-courtyard",
        "name": "Rugs in the Courtyard",
        "scene": "Elevated view of rolled prayer rugs neatly stored beside the entrance to a community courtyard"
      },
      {
        "slug": "night-market-awning",
        "name": "Night Market Awning",
        "scene": "Wide view beneath fabric awnings at a quiet Ramadan night-market aisle before opening"
      },
      {
        "slug": "the-porridge-pot",
        "name": "The Porridge Pot",
        "scene": "Waist-level view of a large covered porridge pot and ladle at an outdoor community meal shelter"
      },
      {
        "slug": "blue-hour-minaret",
        "name": "Blue Hour Minaret",
        "scene": "Architectural low-angle view of a modest minaret rising above a contemporary residential street at blue hour"
      },
      {
        "slug": "charity-collection",
        "name": "Charity Collection",
        "scene": "Frontal close view of unmarked donation envelopes beside a secure community collection box"
      },
      {
        "slug": "an-evening-bus-ride",
        "name": "An Evening Bus Ride",
        "scene": "View from inside an empty city bus toward lantern-lit streets on the way to an iftar gathering"
      },
      {
        "slug": "fruit-for-sharing",
        "name": "Fruit for Sharing",
        "scene": "Overhead view of watermelon wedges, oranges and plain plates at an outdoor iftar buffet"
      },
      {
        "slug": "courtyard-arches",
        "name": "Courtyard Arches",
        "scene": "Wide architectural view through a sequence of plain arches into a softly lit Ramadan gathering courtyard"
      },
      {
        "slug": "rain-before-iftar",
        "name": "Rain Before Iftar",
        "scene": "Ground-level view of rain reflections beneath a community center entrance with warm windows at dusk"
      },
      {
        "slug": "dawn-at-the-pier",
        "name": "Dawn at the Pier",
        "scene": "Wide coastal view of an empty pier and pale predawn horizon during Ramadan"
      },
      {
        "slug": "the-volunteer-aprons",
        "name": "The Volunteer Aprons",
        "scene": "Close view of clean folded aprons hanging from hooks beside a community meal distribution hatch"
      },
      {
        "slug": "a-glass-of-water",
        "name": "A Glass of Water",
        "scene": "Macro view of condensation on a clear drinking glass beside one date on cool limestone"
      },
      {
        "slug": "garden-gathering-circle",
        "name": "Garden Gathering Circle",
        "scene": "Elevated view of low cushions arranged in a quiet community garden for an evening Ramadan gathering"
      },
      {
        "slug": "city-after-sunset",
        "name": "City After Sunset",
        "scene": "Wide elevated view of a real urban square coming alight after sunset, restrained Ramadan decorations"
      },
      {
        "slug": "vermicelli-at-dawn",
        "name": "Vermicelli at Dawn",
        "scene": "Overhead view of a small vermicelli breakfast bowl and milk pitcher on a simple metal breakfast tray"
      },
      {
        "slug": "olive-tree-courtyard",
        "name": "Olive Tree Courtyard",
        "scene": "Eye-level view of an old olive tree in a courtyard with a few hanging lanterns"
      },
      {
        "slug": "lantern-repair",
        "name": "Lantern Repair",
        "scene": "Close view of a single dented brass lantern with its small replacement glass panes on a cloth"
      },
      {
        "slug": "bread-delivery-crates",
        "name": "Bread Delivery Crates",
        "scene": "Ground-level view of stacked fresh-bread crates beside a neighborhood bakery door before sunset"
      },
      {
        "slug": "shelter-of-light",
        "name": "Shelter of Light",
        "scene": "Wide view of a simple park pavilion illuminated for a community Ramadan meal after dark"
      },
      {
        "slug": "quiet-reading-niche",
        "name": "Quiet Reading Niche",
        "scene": "Eye-level view of a respectful empty reading niche with an unlettered closed book and soft natural light"
      },
      {
        "slug": "meal-bags-at-the-door",
        "name": "Meal Bags at the Door",
        "scene": "Low-angle view of neatly packed charitable meal bags waiting at a community center's delivery entrance"
      },
      {
        "slug": "courtyard-citrus-tree",
        "name": "Courtyard Citrus Tree",
        "scene": "Botanical close-up of oranges on a living courtyard tree with evening gathering lights distant behind"
      },
      {
        "slug": "ramadan-apartment-balcony",
        "name": "Ramadan Apartment Balcony",
        "scene": "Wide view of a small lived-in balcony with two chairs and one restrained lantern at dusk"
      },
      {
        "slug": "the-wash-basin",
        "name": "The Wash Basin",
        "scene": "Architectural detail of a clean empty washing area near a prayer hall, no people or readable signs"
      },
      {
        "slug": "cooling-sweets",
        "name": "Cooling Sweets",
        "scene": "Close view of a few handmade syrup pastries on a bakery cooling rack, imperfect golden texture"
      },
      {
        "slug": "riverfront-evening",
        "name": "Riverfront Evening",
        "scene": "Wide riverside view of a community gathering pavilion reflected in calm water after sunset"
      },
      {
        "slug": "white-cloth-in-the-breeze",
        "name": "White Cloth in the Breeze",
        "scene": "Side view of freshly washed iftar linens drying on a courtyard line in afternoon shade"
      },
      {
        "slug": "rice-for-the-neighbors",
        "name": "Rice for the Neighbors",
        "scene": "Overhead view of sealed plain rice sacks arranged for charitable distribution on a clean warehouse floor"
      },
      {
        "slug": "the-last-sunbeam",
        "name": "The Last Sunbeam",
        "scene": "Ground-level view of a single sunbeam crossing an empty courtyard as its lanterns begin to glow"
      },
      {
        "slug": "an-open-community-door",
        "name": "An Open Community Door",
        "scene": "Eye-level view through an open community-center door into a welcoming Ramadan meal space"
      },
      {
        "slug": "dawn-on-the-hills",
        "name": "Dawn on the Hills",
        "scene": "Wide view of a hillside neighborhood and fading stars above a mosque roof before sunrise"
      }
    ]
  },
  {
    "id": "eid-al-fitr",
    "name": "Eid al-Fitr",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "10",
      "day": 1,
      "duration": 3,
      "eve": true
    },
    "palettes": [
      "teal",
      "rose",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Eid al Fitr Eid ul Fitr celebration end Ramadan",
    "designs": [
      {
        "slug": "morning-sweets",
        "name": "Morning Sweets",
        "scene": "Homemade Eid pastries and a small teapot on a family table"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A modest welcoming doorway with flowers and simple paper decorations"
      },
      {
        "slug": "family-brunch",
        "name": "Family Brunch",
        "scene": "A home brunch table with plain dishes, fruit and tea"
      },
      {
        "slug": "gift-envelopes",
        "name": "Gift Envelopes",
        "scene": "Plain colored gift envelopes and small wrapped presents on a wooden table"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple garden table with flowers and a tea tray"
      },
      {
        "slug": "community-lunch",
        "name": "Community Lunch",
        "scene": "Long tables in a community hall with everyday serving dishes"
      },
      {
        "slug": "sweet-exchange",
        "name": "Sweet Exchange",
        "scene": "A plate of homemade date-filled cookies wrapped for sharing"
      },
      {
        "slug": "spring-flowers",
        "name": "Spring Flowers",
        "scene": "An informal bouquet and a small dish of sweets beside a window"
      },
      {
        "slug": "tea-together",
        "name": "Tea Together",
        "scene": "Ordinary teacups and pastries on a modest living-room table"
      },
      {
        "slug": "neighborhood-welcome",
        "name": "Neighborhood Welcome",
        "scene": "A residential courtyard with folding chairs and subtle festive decorations"
      },
      {
        "slug": "eid-morning-square",
        "name": "Eid Morning Square",
        "scene": "Wide view of a sunlit neighborhood square prepared for Eid with simple bunting and open walking space"
      },
      {
        "slug": "new-shoes-by-the-door",
        "name": "New Shoes by the Door",
        "scene": "Ground-level close view of a child's polished shoes beside an adult pair at a welcoming Eid doorway"
      },
      {
        "slug": "sweets-in-the-bakery",
        "name": "Sweets in the Bakery",
        "scene": "Eye-level view of a small bakery display filled with several different handmade Eid sweets"
      },
      {
        "slug": "garden-prayer-gathering",
        "name": "Garden Prayer Gathering",
        "scene": "Elevated view of an empty outdoor prayer gathering area arranged respectfully on a clean green lawn"
      },
      {
        "slug": "a-gift-of-color",
        "name": "A Gift of Color",
        "scene": "Overhead view of three differently wrapped Eid gifts with fabric bows on a bright tiled floor"
      },
      {
        "slug": "eid-at-the-seafront",
        "name": "Eid at the Seafront",
        "scene": "Wide coastal view of a promenade with restrained festive lights and a clear morning horizon"
      },
      {
        "slug": "henna-and-ribbon",
        "name": "Henna and Ribbon",
        "scene": "Close view of a sealed henna cone, plain ribbon and small floral accessory in a shallow ceramic dish"
      },
      {
        "slug": "family-car-ready",
        "name": "Family Car Ready",
        "scene": "Rear view into a car packed with an Eid gift bag, fresh flowers and a folded picnic blanket"
      },
      {
        "slug": "morning-mosque-steps",
        "name": "Morning Mosque Steps",
        "scene": "Low-angle architectural view of empty mosque steps in fresh daylight, respectful and without readable inscriptions"
      },
      {
        "slug": "the-semolina-cookies",
        "name": "The Semolina Cookies",
        "scene": "Macro view of handmade molded semolina cookies with visible crumb texture on a cooling rack"
      },
      {
        "slug": "ferris-wheel-morning",
        "name": "Ferris Wheel Morning",
        "scene": "Wide view of a modest neighborhood fairground wheel and colorful Eid decorations before opening"
      },
      {
        "slug": "perfume-for-the-day",
        "name": "Perfume for the Day",
        "scene": "Close view of a small unbranded perfume bottle and a folded fresh scarf beside a mirror"
      },
      {
        "slug": "citrus-courtyard",
        "name": "Citrus Courtyard",
        "scene": "Eye-level view of a courtyard citrus tree shading a small Eid breakfast seating area"
      },
      {
        "slug": "eid-puppet-booth",
        "name": "Eid Puppet Booth",
        "scene": "Eye-level view of an original handmade puppet booth with bright fabric and plain visitor benches at an Eid community fair"
      },
      {
        "slug": "trays-for-the-neighbors",
        "name": "Trays for the Neighbors",
        "scene": "Waist-level view of covered sweet trays waiting beside an apartment corridor's open door"
      },
      {
        "slug": "eid-flower-stall",
        "name": "Eid Flower Stall",
        "scene": "Wide street-level view of buckets of fresh flowers at a small neighborhood market during Eid morning"
      },
      {
        "slug": "vermicelli-celebration",
        "name": "Vermicelli Celebration",
        "scene": "Close overhead view of festive milk vermicelli with nuts in one simple serving bowl"
      },
      {
        "slug": "kites-above-the-park",
        "name": "Kites Above the Park",
        "scene": "Low-angle view of bright kites hanging at a park welcome shelter during an Eid family outing"
      },
      {
        "slug": "the-welcome-mat",
        "name": "The Welcome Mat",
        "scene": "Ground-level view of a freshly swept doorstep with a flower garland and a pair of visiting shoes"
      },
      {
        "slug": "courtyard-bubble-wands",
        "name": "Courtyard Bubble Wands",
        "scene": "Overhead view of unbranded bubble wands and small outdoor toys in an Eid picnic basket"
      },
      {
        "slug": "eid-lantern-walk",
        "name": "Eid Lantern Walk",
        "scene": "Wide view of a pedestrian path strung with modest lights at the start of an Eid evening"
      },
      {
        "slug": "freshly-pressed-clothes",
        "name": "Freshly Pressed Clothes",
        "scene": "Eye-level view of a plain formal outfit hanging from a wardrobe door, ready for Eid morning"
      },
      {
        "slug": "the-rose-milk-jug",
        "name": "The Rose Milk Jug",
        "scene": "Tight side view of pale rose milk in a clear glass pitcher on a cool marble ledge"
      },
      {
        "slug": "lawn-game-circle",
        "name": "Lawn Game Circle",
        "scene": "Elevated view of simple ring-toss equipment arranged for an Eid family gathering in a park"
      },
      {
        "slug": "a-basket-of-oranges",
        "name": "A Basket of Oranges",
        "scene": "Low close view of bright oranges tucked into an Eid visiting basket beside a front gate"
      },
      {
        "slug": "community-courtyard-lunch",
        "name": "Community Courtyard Lunch",
        "scene": "Wide view of long outdoor tables set for an Eid community lunch beneath shade sails"
      },
      {
        "slug": "sandalwood-box",
        "name": "Sandalwood Box",
        "scene": "Macro view of a carved wooden keepsake box with a small satin-lined Eid gift inside"
      },
      {
        "slug": "the-ferry-visit",
        "name": "The Ferry Visit",
        "scene": "Wide view from a ferry deck toward a waterfront neighborhood on a bright Eid morning"
      },
      {
        "slug": "pistachio-pastries",
        "name": "Pistachio Pastries",
        "scene": "Close view of pistachio-filled pastries resting in a bakery case beside plain paper sweet bags"
      },
      {
        "slug": "balloon-doorway",
        "name": "Balloon Doorway",
        "scene": "Eye-level view of an ordinary apartment doorway with a small cluster of Eid balloons and no lettering"
      },
      {
        "slug": "library-eid-corner",
        "name": "Library Eid Corner",
        "scene": "Wide view of a public-library alcove prepared for an Eid community gathering without readable book titles"
      },
      {
        "slug": "a-simple-gold-bracelet",
        "name": "A Simple Gold Bracelet",
        "scene": "Overhead view of a small gold bracelet resting in an open plain gift box on soft fabric"
      },
      {
        "slug": "the-garden-swing",
        "name": "The Garden Swing",
        "scene": "Low-angle view of an empty garden swing with a festive cushion and light Eid ribbons"
      },
      {
        "slug": "tea-on-the-veranda",
        "name": "Tea on the Veranda",
        "scene": "Side view of a small tea service on a shaded veranda with an open garden beyond"
      },
      {
        "slug": "eid-football-picnic",
        "name": "Eid Football Picnic",
        "scene": "Wide view of a plain football and picnic cooler beside an empty neighborhood playing field"
      },
      {
        "slug": "a-new-bicycle-bell",
        "name": "A New Bicycle Bell",
        "scene": "Macro view of a bicycle bell tied with a small gift ribbon for an Eid surprise"
      },
      {
        "slug": "sweet-delivery-route",
        "name": "Sweet Delivery Route",
        "scene": "Eye-level view of a wheeled shopping trolley holding covered sweet parcels at an apartment lift"
      },
      {
        "slug": "spring-blossom-walk",
        "name": "Spring Blossom Walk",
        "scene": "Wide view of an empty blossom-lined park path prepared for an Eid family day outside"
      },
      {
        "slug": "the-shared-breakfast",
        "name": "The Shared Breakfast",
        "scene": "Overhead view of bread, eggs, olives and fruit arranged for a modest Eid breakfast"
      },
      {
        "slug": "soft-toy-gift",
        "name": "Soft Toy Gift",
        "scene": "Close view of a new unbranded plush rabbit peeking from an open paper gift bag"
      },
      {
        "slug": "eid-community-hall",
        "name": "Eid Community Hall",
        "scene": "Wide architectural view of a modest hall with colorful ceiling ribbons and many empty welcoming seats"
      },
      {
        "slug": "the-fresh-haircut-kit",
        "name": "The Fresh Haircut Kit",
        "scene": "Overhead view of clean combs and a towel beside a barbershop chair before Eid opening"
      },
      {
        "slug": "seaside-ice-cream",
        "name": "Seaside Ice Cream",
        "scene": "Close view of two plain ice-cream cones resting in a holder at a seaside kiosk during Eid"
      },
      {
        "slug": "flowers-on-the-landing",
        "name": "Flowers on the Landing",
        "scene": "Eye-level view of a fresh bouquet beside an open stairwell window in a family apartment building"
      },
      {
        "slug": "an-evening-rooftop",
        "name": "An Evening Rooftop",
        "scene": "Wide view of a rooftop seating area prepared for Eid visiting, city lights beyond"
      },
      {
        "slug": "children-s-craft-garland",
        "name": "Children's Craft Garland",
        "scene": "Close view of irregular paper decorations drying on a line at an Eid community craft session"
      },
      {
        "slug": "the-visiting-basket",
        "name": "The Visiting Basket",
        "scene": "Overhead view inside a woven visiting basket containing dates, flowers and a small unmarked gift"
      },
      {
        "slug": "a-quiet-fountain",
        "name": "A Quiet Fountain",
        "scene": "Ground-level view of an outdoor fountain reflecting simple festive Eid bunting in afternoon light"
      },
      {
        "slug": "homecoming-suitcases",
        "name": "Homecoming Suitcases",
        "scene": "Eye-level view of two travel cases and an Eid gift bag just inside a welcoming family doorway"
      },
      {
        "slug": "eid-under-the-stars",
        "name": "Eid Under the Stars",
        "scene": "Wide view of a community garden with restrained warm lights beneath a natural night sky"
      }
    ]
  },
  {
    "id": "eid-al-adha",
    "name": "Eid al-Adha",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "islamic-umalqura",
      "month": "12",
      "day": 10,
      "duration": 4,
      "eve": true
    },
    "palettes": [
      "olive",
      "ochre",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "Eid al Adha Eid ul Adha community sharing",
    "designs": [
      {
        "slug": "shared-table",
        "name": "Shared Table",
        "scene": "A modest family Eid meal with rice, vegetables and ordinary serving dishes"
      },
      {
        "slug": "giving-day",
        "name": "Giving Day",
        "scene": "Plain food parcels and reusable bags on a community distribution table"
      },
      {
        "slug": "garden-lunch",
        "name": "Garden Lunch",
        "scene": "A simple outdoor lunch table with fresh flowers and plain plates"
      },
      {
        "slug": "family-welcome",
        "name": "Family Welcome",
        "scene": "A modest doorway with a small flower arrangement and simple festive ribbons"
      },
      {
        "slug": "tea-and-dates",
        "name": "Tea and Dates",
        "scene": "A small tea tray and dates on a lived-in dining table"
      },
      {
        "slug": "community-meal",
        "name": "Community Meal",
        "scene": "Folding tables prepared for a community lunch with understated decoration"
      },
      {
        "slug": "wrapped-with-care",
        "name": "Wrapped with Care",
        "scene": "A few small gifts in plain paper on a wooden sideboard"
      },
      {
        "slug": "kitchen-preparations",
        "name": "Kitchen Preparations",
        "scene": "Everyday pots and fresh ingredients in a family kitchen"
      },
      {
        "slug": "neighborly-sharing",
        "name": "Neighborly Sharing",
        "scene": "Covered food containers ready to share on a plain kitchen counter"
      },
      {
        "slug": "courtyard-together",
        "name": "Courtyard Together",
        "scene": "A modest courtyard with chairs, a simple table and potted greenery"
      },
      {
        "slug": "morning-at-the-farm-gate",
        "name": "Morning at the Farm Gate",
        "scene": "Wide view of a clean countryside farm gate with sheep grazing peacefully beyond, no slaughter imagery"
      },
      {
        "slug": "the-sharing-depot",
        "name": "The Sharing Depot",
        "scene": "Eye-level view of plain sealed food parcels arranged for Eid charitable distribution in a neighborhood depot"
      },
      {
        "slug": "eid-prayer-courtyard",
        "name": "Eid Prayer Courtyard",
        "scene": "Elevated architectural view of a quiet empty prayer courtyard in early morning, respectful and unlettered"
      },
      {
        "slug": "a-woolly-lamb",
        "name": "A Woolly Lamb",
        "scene": "Close eye-level view of a healthy lamb standing in a green pasture with its flock distant behind"
      },
      {
        "slug": "gift-basket-at-the-gate",
        "name": "Gift Basket at the Gate",
        "scene": "Ground-level view of a woven basket of fruit and a wrapped gift beside a neighbor's garden gate"
      },
      {
        "slug": "community-serving-line",
        "name": "Community Serving Line",
        "scene": "Wide view of covered food warmers and clean plates at an outdoor Eid meal shelter before service"
      },
      {
        "slug": "a-mountain-picnic",
        "name": "A Mountain Picnic",
        "scene": "Wide elevated view of an empty family picnic spot overlooking low mountains during Eid"
      },
      {
        "slug": "rose-petal-tea",
        "name": "Rose Petal Tea",
        "scene": "Macro view of dried rose petals floating in a clear tea glass on a stone windowsill"
      },
      {
        "slug": "the-volunteer-van",
        "name": "The Volunteer Van",
        "scene": "Rear view into a clean van loaded with plain insulated food crates outside a community center"
      },
      {
        "slug": "new-eid-clothes",
        "name": "New Eid Clothes",
        "scene": "Eye-level view of fresh formal clothes hanging against an open wardrobe with a small gift beside them"
      },
      {
        "slug": "the-water-bowls",
        "name": "The Water Bowls",
        "scene": "Ground-level view of clean animal water bowls and peacefully resting sheep in shaded pasture"
      },
      {
        "slug": "a-shared-rice-platter",
        "name": "A Shared Rice Platter",
        "scene": "Overhead view of a generous rice-and-vegetable platter with simple serving utensils on a woven floor mat"
      },
      {
        "slug": "courtyard-welcome",
        "name": "Courtyard Welcome",
        "scene": "Wide view through a modest doorway into a courtyard prepared for family Eid visiting"
      },
      {
        "slug": "an-open-donation-box",
        "name": "An Open Donation Box",
        "scene": "Close view of plain envelopes and a secure charitable collection box on a clean community counter"
      },
      {
        "slug": "children-s-gift-parcels",
        "name": "Children's Gift Parcels",
        "scene": "Overhead view of small differently wrapped Eid gifts arranged on a colorful woven rug"
      },
      {
        "slug": "park-barbecue-shelter",
        "name": "Park Barbecue Shelter",
        "scene": "Wide view of a clean covered park barbecue area prepared for an Eid gathering, no people"
      },
      {
        "slug": "a-family-journey",
        "name": "A Family Journey",
        "scene": "View through a parked car's open window toward a countryside road and an Eid visiting basket"
      },
      {
        "slug": "the-goat-on-the-hill",
        "name": "The Goat on the Hill",
        "scene": "Low-angle view of a healthy goat standing on a rocky green slope under an ordinary summer sky"
      },
      {
        "slug": "date-orchard-path",
        "name": "Date Orchard Path",
        "scene": "Wide eye-level view down a real date orchard path with harvest baskets beside the trees"
      },
      {
        "slug": "fresh-bread-rounds",
        "name": "Fresh Bread Rounds",
        "scene": "Close view of warm round flatbreads cooling beside the opening of a neighborhood oven"
      },
      {
        "slug": "the-courtyard-rug",
        "name": "The Courtyard Rug",
        "scene": "Elevated view of a freshly cleaned patterned rug drying over a courtyard rail in bright Eid morning light"
      },
      {
        "slug": "flowers-for-the-visit",
        "name": "Flowers for the Visit",
        "scene": "Close view of loose white flowers wrapped in plain paper beside a front-door step"
      },
      {
        "slug": "eid-community-garden",
        "name": "Eid Community Garden",
        "scene": "Wide view of garden benches and shade sails arranged for a small Eid community gathering"
      },
      {
        "slug": "clean-hands-station",
        "name": "Clean Hands Station",
        "scene": "Frontal view of an outdoor handwashing point beside a community Eid meal pavilion"
      },
      {
        "slug": "spiced-chickpea-bowl",
        "name": "Spiced Chickpea Bowl",
        "scene": "Overhead view of chickpeas and fresh herbs in a single ceramic bowl on a simple serving tray"
      },
      {
        "slug": "a-new-football",
        "name": "A New Football",
        "scene": "Ground-level view of an unbranded football tied with a small gift ribbon beside children's trainers"
      },
      {
        "slug": "quiet-mosque-arcade",
        "name": "Quiet Mosque Arcade",
        "scene": "Wide architectural view along an empty mosque arcade in morning shade, no readable sacred text"
      },
      {
        "slug": "the-parcel-trolley",
        "name": "The Parcel Trolley",
        "scene": "Side view of a hand trolley holding sealed charitable food boxes at an apartment building entrance"
      },
      {
        "slug": "an-orchard-lunch",
        "name": "An Orchard Lunch",
        "scene": "Elevated view of a simple picnic blanket and covered lunch dishes beneath an old fruit tree"
      },
      {
        "slug": "eid-gift-bracelet",
        "name": "Eid Gift Bracelet",
        "scene": "Macro view of a simple bracelet in a small open gift box on deep green fabric"
      },
      {
        "slug": "the-veterinary-shed",
        "name": "The Veterinary Shed",
        "scene": "Wide view of a tidy farm care shed with clean feed and water equipment, healthy animals distant outside"
      },
      {
        "slug": "a-bowl-of-pomegranates",
        "name": "A Bowl of Pomegranates",
        "scene": "Overhead view of whole pomegranates and one cut fruit on a cool stone serving ledge"
      },
      {
        "slug": "shelves-of-welcome",
        "name": "Shelves of Welcome",
        "scene": "Eye-level view of extra cups, plates and clean serving cloths stacked for an Eid gathering"
      },
      {
        "slug": "garden-lantern-evening",
        "name": "Garden Lantern Evening",
        "scene": "Low-angle view of restrained lanterns suspended among real garden branches at natural dusk"
      },
      {
        "slug": "the-picnic-boat",
        "name": "The Picnic Boat",
        "scene": "Wide view of a moored small rowing boat with a covered Eid picnic basket inside"
      },
      {
        "slug": "a-peaceful-flock",
        "name": "A Peaceful Flock",
        "scene": "Long-lens view of a small sheep flock crossing an open pasture in cool morning light"
      },
      {
        "slug": "children-s-story-nook",
        "name": "Children's Story Nook",
        "scene": "Eye-level view of floor cushions and unlettered closed picture books prepared for an Eid family visit"
      },
      {
        "slug": "eid-food-bank-freezer",
        "name": "Eid Food Bank Freezer",
        "scene": "Wide view of a clean community food-bank cold room containing sealed unlabelled food containers"
      },
      {
        "slug": "a-cooling-courtyard",
        "name": "A Cooling Courtyard",
        "scene": "Ground-level view of water from a simple courtyard fountain catching sunlight beside Eid visiting seats"
      },
      {
        "slug": "the-saffron-milk-glass",
        "name": "The Saffron Milk Glass",
        "scene": "Tight side view of saffron-colored milk in one clear glass with pistachio pieces visible"
      },
      {
        "slug": "a-neighbor-s-door",
        "name": "A Neighbor's Door",
        "scene": "Eye-level view of an ordinary open front door with visiting shoes and a modest Eid garland"
      },
      {
        "slug": "the-garden-games",
        "name": "The Garden Games",
        "scene": "Elevated view of beanbags and a simple ring-toss set ready for an Eid afternoon outside"
      },
      {
        "slug": "stars-beyond-the-roof",
        "name": "Stars Beyond the Roof",
        "scene": "Wide view of a quiet rooftop family seating area beneath a natural early-night sky"
      },
      {
        "slug": "folded-prayer-rugs",
        "name": "Folded Prayer Rugs",
        "scene": "Close view of neatly folded prayer rugs in a plain community-hall storage alcove"
      },
      {
        "slug": "the-country-footbridge",
        "name": "The Country Footbridge",
        "scene": "Wide view of an empty footbridge leading to a green Eid picnic meadow"
      },
      {
        "slug": "shared-fruit-parcels",
        "name": "Shared Fruit Parcels",
        "scene": "Overhead view of plain paper bags filled with seasonal fruit for neighbors"
      },
      {
        "slug": "a-small-sweet-shop",
        "name": "A Small Sweet Shop",
        "scene": "Wide street-level view of a modest sweet shop counter prepared for Eid, without signs or branding"
      },
      {
        "slug": "a-ribbon-on-the-bicycle",
        "name": "A Ribbon on the Bicycle",
        "scene": "Close view of a new bicycle's handlebars with a small Eid gift ribbon in a sunny yard"
      },
      {
        "slug": "the-after-lunch-hammock",
        "name": "The After-Lunch Hammock",
        "scene": "Eye-level view of an empty shaded hammock beside a family Eid picnic area"
      },
      {
        "slug": "an-open-circle",
        "name": "An Open Circle",
        "scene": "Elevated view of chairs arranged in a welcoming circle beneath a tree for Eid conversation"
      }
    ]
  },
  {
    "id": "diwali",
    "name": "Diwali",
    "kind": "Religious & cultural",
    "date": {
      "kind": "dates",
      "dates": {
        "2025": "10-20",
        "2026": "11-08",
        "2027": "10-29",
        "2028": "10-17"
      },
      "fallback": [
        10,
        11
      ]
    },
    "palettes": [
      "terracotta",
      "plum",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Diwali Deepavali Deepawali festival lights",
    "designs": [
      {
        "slug": "clay-lamps",
        "name": "Clay Lamps",
        "scene": "A few ordinary clay diyas on a worn stone doorstep at dusk"
      },
      {
        "slug": "marigold-welcome",
        "name": "Marigold Welcome",
        "scene": "A simple marigold garland on a modest home doorway"
      },
      {
        "slug": "sweets-to-share",
        "name": "Sweets to Share",
        "scene": "Homemade Indian sweets in a plain steel serving tray"
      },
      {
        "slug": "family-rangoli",
        "name": "Family Rangoli",
        "scene": "A small handmade rangoli with slightly uneven colored powder on a courtyard floor"
      },
      {
        "slug": "evening-table",
        "name": "Evening Table",
        "scene": "A modest family table with small diyas and everyday dishes"
      },
      {
        "slug": "lamp-workshop",
        "name": "Lamp Workshop",
        "scene": "Unpainted clay diyas and simple craft supplies on a community table"
      },
      {
        "slug": "courtyard-lights",
        "name": "Courtyard Lights",
        "scene": "A few diyas along a modest courtyard wall at realistic evening exposure"
      },
      {
        "slug": "gift-of-sweets",
        "name": "Gift of Sweets",
        "scene": "A small box of homemade sweets wrapped with plain ribbon"
      },
      {
        "slug": "kitchen-gathering",
        "name": "Kitchen Gathering",
        "scene": "A lived-in kitchen counter with flour, a mixing bowl and prepared sweets"
      },
      {
        "slug": "quiet-glow",
        "name": "Quiet Glow",
        "scene": "Two small clay lamps beside marigold petals on a wooden sideboard"
      },
      {
        "slug": "lamps-along-the-steps",
        "name": "Lamps Along the Steps",
        "scene": "Ground-level view of a few clay diyas following uneven stone steps into an ordinary home at dusk"
      },
      {
        "slug": "the-marigold-market",
        "name": "The Marigold Market",
        "scene": "Wide street-level view of buckets and heaps of fresh marigolds at a neighborhood flower market"
      },
      {
        "slug": "rangoli-from-above",
        "name": "Rangoli from Above",
        "scene": "Straight overhead view of a hand-made flower-petal rangoli on a worn courtyard floor"
      },
      {
        "slug": "balcony-of-light",
        "name": "Balcony of Light",
        "scene": "Wide architectural view of a lived-in apartment balcony with restrained Diwali lights against natural night"
      },
      {
        "slug": "a-brass-bell",
        "name": "A Brass Bell",
        "scene": "Macro view of a small brass bell and marigold petals near a respectful unlettered home alcove"
      },
      {
        "slug": "the-sweet-shop-window",
        "name": "The Sweet Shop Window",
        "scene": "Eye-level view of colorful handmade mithai behind the glass of a modest neighborhood sweet shop"
      },
      {
        "slug": "clay-lamp-maker",
        "name": "Clay Lamp Maker",
        "scene": "Close view of rows of unfinished clay diyas drying on a pottery workshop rack"
      },
      {
        "slug": "riverbank-reflection",
        "name": "Riverbank Reflection",
        "scene": "Wide view of a few safely placed lamps reflected beside stone riverbank steps after dusk"
      },
      {
        "slug": "the-welcome-threshold",
        "name": "The Welcome Threshold",
        "scene": "Low-angle view of a fresh floral toran above an ordinary open front door during Diwali"
      },
      {
        "slug": "a-silk-gift",
        "name": "A Silk Gift",
        "scene": "Overhead view of a folded colorful textile and a small wrapped Diwali gift on a plain woven mat"
      },
      {
        "slug": "courtyard-sparklers",
        "name": "Courtyard Sparklers",
        "scene": "Close view of unused sparklers in plain paper sleeves beside a metal safety bucket outdoors"
      },
      {
        "slug": "temple-courtyard-evening",
        "name": "Temple Courtyard Evening",
        "scene": "Wide respectful view of an empty neighborhood temple courtyard with modest lights and no readable inscriptions"
      },
      {
        "slug": "the-lighted-bicycle",
        "name": "The Lighted Bicycle",
        "scene": "Ground-level view of a bicycle with a restrained string of lights parked outside a Diwali gathering"
      },
      {
        "slug": "coconut-sweet-squares",
        "name": "Coconut Sweet Squares",
        "scene": "Macro view of handmade coconut sweets with irregular edges in a plain metal sweet box"
      },
      {
        "slug": "window-lamps",
        "name": "Window Lamps",
        "scene": "Interior side view of clay lamps on a broad windowsill overlooking an ordinary street at blue hour"
      },
      {
        "slug": "a-lantern-above-the-lane",
        "name": "A Lantern Above the Lane",
        "scene": "Low-angle view of a single colorful handmade akash kandil lantern over a narrow residential lane"
      },
      {
        "slug": "garden-diwali-gathering",
        "name": "Garden Diwali Gathering",
        "scene": "Wide view of a neighborhood garden prepared with chairs and simple lights for a Diwali gathering"
      },
      {
        "slug": "the-oil-flask",
        "name": "The Oil Flask",
        "scene": "Close view of a small lamp-oil flask, cotton wicks and one unlit diya on cool stone"
      },
      {
        "slug": "floating-flower-bowl",
        "name": "Floating Flower Bowl",
        "scene": "Overhead view of flower petals and a few floating lights in a wide shallow courtyard bowl"
      },
      {
        "slug": "diwali-tram-stop",
        "name": "Diwali Tram Stop",
        "scene": "Wide view of a city tram stop beside gently decorated neighborhood storefronts at natural night"
      },
      {
        "slug": "a-clean-new-beginning",
        "name": "A Clean New Beginning",
        "scene": "Eye-level view of a freshly swept home entrance with a simple broom and a small Diwali garland"
      },
      {
        "slug": "the-rangoli-powder-shop",
        "name": "The Rangoli Powder Shop",
        "scene": "Close view of open containers of colorful rangoli powder at a local market stall"
      },
      {
        "slug": "distant-fireworks",
        "name": "Distant Fireworks",
        "scene": "Wide view of a few restrained distant Diwali fireworks beyond a real city roofline, natural exposure"
      },
      {
        "slug": "a-box-for-the-neighbors",
        "name": "A Box for the Neighbors",
        "scene": "Overhead view of an open unbranded mithai gift box tied with a small festive ribbon"
      },
      {
        "slug": "shadows-of-a-lattice",
        "name": "Shadows of a Lattice",
        "scene": "Architectural detail of warm diya light passing through a simple stone lattice onto the ground"
      },
      {
        "slug": "the-festival-ferry",
        "name": "The Festival Ferry",
        "scene": "Wide view of a moored ferry with modest Diwali lights reflected in dark water"
      },
      {
        "slug": "little-clay-elephants",
        "name": "Little Clay Elephants",
        "scene": "Close view of a few small handmade clay elephants beside a pottery studio's Diwali display"
      },
      {
        "slug": "terrace-dinner",
        "name": "Terrace Dinner",
        "scene": "Elevated view of a rooftop dinner area prepared with simple lamps and ordinary mismatched chairs"
      },
      {
        "slug": "jasmine-strings",
        "name": "Jasmine Strings",
        "scene": "Macro view of fresh jasmine garlands hanging from a neighborhood flower seller's rack"
      },
      {
        "slug": "a-railway-homecoming",
        "name": "A Railway Homecoming",
        "scene": "Eye-level view of a suitcase and a Diwali gift bag beside an empty station bench"
      },
      {
        "slug": "diwali-community-stage",
        "name": "Diwali Community Stage",
        "scene": "Wide view of a modest neighborhood performance stage with colorful drapes before a Diwali program"
      },
      {
        "slug": "pistachio-barfi-layers",
        "name": "Pistachio Barfi Layers",
        "scene": "Tight side view of hand-cut pistachio barfi with visible texture inside a small plain tin"
      },
      {
        "slug": "the-courtyard-tree",
        "name": "The Courtyard Tree",
        "scene": "Low-angle view of restrained warm lights winding around one real courtyard tree"
      },
      {
        "slug": "paper-lantern-workshop",
        "name": "Paper Lantern Workshop",
        "scene": "Overhead view of unfinished paper lantern panels and a single completed lantern on a clean floor"
      },
      {
        "slug": "diwali-at-the-lake",
        "name": "Diwali at the Lake",
        "scene": "Wide lakeside view of a small community pavilion illuminated for Diwali after sunset"
      },
      {
        "slug": "a-new-notebook",
        "name": "A New Notebook",
        "scene": "Close view of a fresh unlettered notebook beside a simple pen and a small Diwali lamp"
      },
      {
        "slug": "red-door-and-marigolds",
        "name": "Red Door and Marigolds",
        "scene": "Frontal architectural view of an old red-painted doorway framed with natural marigold garlands"
      },
      {
        "slug": "the-flower-cart",
        "name": "The Flower Cart",
        "scene": "Ground-level view of a handcart filled with loose flowers moving nowhere on a quiet Diwali market lane"
      },
      {
        "slug": "a-bowl-of-kaju-katli",
        "name": "A Bowl of Kaju Katli",
        "scene": "Overhead view of diamond-shaped cashew sweets arranged irregularly in a plain serving bowl"
      },
      {
        "slug": "festival-shadow-play",
        "name": "Festival Shadow Play",
        "scene": "Side view of paper lantern silhouettes cast across a plain wall by real practical lights"
      },
      {
        "slug": "lanterns-in-the-rain",
        "name": "Lanterns in the Rain",
        "scene": "Ground-level view of reflections from a few Diwali lanterns in a rain-wet residential street"
      },
      {
        "slug": "the-shared-courtyard",
        "name": "The Shared Courtyard",
        "scene": "Elevated wide view of neighbors' connected courtyards each with a different modest lamp arrangement"
      },
      {
        "slug": "a-copper-water-jug",
        "name": "A Copper Water Jug",
        "scene": "Close view of a polished copper water vessel with a small flower garland beside a Diwali doorway"
      },
      {
        "slug": "color-above-the-roofs",
        "name": "Color Above the Roofs",
        "scene": "Low-angle view of several different handmade paper lanterns against a clear blue-hour sky"
      },
      {
        "slug": "diwali-picnic-shelter",
        "name": "Diwali Picnic Shelter",
        "scene": "Wide view of a public park shelter prepared with simple Diwali lights and an accessible entrance"
      },
      {
        "slug": "the-sweet-maker-s-tools",
        "name": "The Sweet Maker's Tools",
        "scene": "Overhead view of a pastry cutter, a metal sweet mold and a few finished sweets on a marble counter"
      },
      {
        "slug": "a-single-flame",
        "name": "A Single Flame",
        "scene": "Macro view of the cotton wick and warm flame of one clay diya, convincing natural texture"
      },
      {
        "slug": "the-station-flower-stall",
        "name": "The Station Flower Stall",
        "scene": "Eye-level view of a tiny flower stall with Diwali garlands beside a quiet commuter station"
      },
      {
        "slug": "diwali-under-the-banyan",
        "name": "Diwali Under the Banyan",
        "scene": "Wide view of simple lamps around the safe stone border of a mature banyan tree at dusk"
      },
      {
        "slug": "morning-after-the-lights",
        "name": "Morning After the Lights",
        "scene": "Wide morning view of a quiet neighborhood lane with unlit Diwali lanterns and fresh flower petals"
      }
    ]
  },
  {
    "id": "holi",
    "name": "Holi",
    "kind": "Religious & cultural",
    "date": {
      "kind": "dates",
      "dates": {
        "2025": "03-14",
        "2026": "03-04",
        "2027": "03-22",
        "2028": "03-11"
      },
      "fallback": [
        2,
        3
      ]
    },
    "palettes": [
      "rose",
      "teal",
      "ochre"
    ],
    "purpose": "celebration",
    "aliases": "Holi festival colors Rangwali spring",
    "designs": [
      {
        "slug": "bowls-of-color",
        "name": "Bowls of Color",
        "scene": "Small plain bowls of pink yellow and blue Holi powder on a worn outdoor table"
      },
      {
        "slug": "spring-gathering",
        "name": "Spring Gathering",
        "scene": "A modest park picnic setup with a few bowls of Holi colors"
      },
      {
        "slug": "color-workshop",
        "name": "Color Workshop",
        "scene": "Paper and simple color powder bowls on a community craft table"
      },
      {
        "slug": "sweet-spring",
        "name": "Sweet Spring",
        "scene": "Homemade gujiya on a steel plate beside a small bowl of color"
      },
      {
        "slug": "courtyard-colors",
        "name": "Courtyard Colors",
        "scene": "A modest courtyard with a few natural powder stains on the stone floor"
      },
      {
        "slug": "flower-welcome",
        "name": "Flower Welcome",
        "scene": "Bright spring flowers in ordinary jars beside a gathering table"
      },
      {
        "slug": "picnic-and-color",
        "name": "Picnic and Color",
        "scene": "A plain picnic blanket with snacks and sealed packets of Holi powder without labels"
      },
      {
        "slug": "handmade-garland",
        "name": "Handmade Garland",
        "scene": "Simple colorful paper garlands above an outdoor community table"
      },
      {
        "slug": "kitchen-treats",
        "name": "Kitchen Treats",
        "scene": "A lived-in kitchen with a tray of homemade festival sweets"
      },
      {
        "slug": "after-the-colors",
        "name": "After the Colors",
        "scene": "Folded white cotton cloth with small powder stains beside a bowl of flowers"
      },
      {
        "slug": "color-across-the-square",
        "name": "Color Across the Square",
        "scene": "Wide elevated view of an empty neighborhood square with gentle traces of Holi color across the paving"
      },
      {
        "slug": "the-pichkari-basket",
        "name": "The Pichkari Basket",
        "scene": "Overhead view of several different unbranded water squirters in a woven festival basket"
      },
      {
        "slug": "palash-in-bloom",
        "name": "Palash in Bloom",
        "scene": "Low-angle botanical view of an actual palash tree carrying vivid spring blossoms against a pale sky"
      },
      {
        "slug": "gujiya-cooling-rack",
        "name": "Gujiya Cooling Rack",
        "scene": "Macro view of handmade gujiya pastries with uneven crimped edges on a wire cooling rack"
      },
      {
        "slug": "a-painted-bicycle",
        "name": "A Painted Bicycle",
        "scene": "Ground-level view of a parked bicycle with playful washable Holi color across its frame"
      },
      {
        "slug": "festival-drum-corner",
        "name": "Festival Drum Corner",
        "scene": "Eye-level view of a plain dhol drum and its beaters beside an empty community performance area"
      },
      {
        "slug": "the-white-kurta",
        "name": "The White Kurta",
        "scene": "Side view of a white cotton kurta marked with irregular Holi colors hanging outside to dry"
      },
      {
        "slug": "colors-on-the-steps",
        "name": "Colors on the Steps",
        "scene": "Ground-level view of real colorful powder settled into the grooves of old stone steps"
      },
      {
        "slug": "spring-picnic-field",
        "name": "Spring Picnic Field",
        "scene": "Wide view of an empty meadow picnic area with bright Holi blankets and fresh spring trees"
      },
      {
        "slug": "thandai-in-glass",
        "name": "Thandai in Glass",
        "scene": "Tight side view of creamy thandai with nuts visible in a clear glass on a cool stone ledge"
      },
      {
        "slug": "bougainvillea-arch",
        "name": "Bougainvillea Arch",
        "scene": "Wide architectural view of a pink bougainvillea arch framing a courtyard prepared for Holi"
      },
      {
        "slug": "the-color-merchant",
        "name": "The Color Merchant",
        "scene": "Frontal view of a modest market stall displaying separate open containers of bright Holi powders"
      },
      {
        "slug": "flower-petal-carpet",
        "name": "Flower Petal Carpet",
        "scene": "Straight overhead view of an irregular carpet of mixed spring petals across a courtyard corner"
      },
      {
        "slug": "rain-on-color",
        "name": "Rain on Color",
        "scene": "Macro view of raindrops meeting scattered colored powder on a dark stone surface"
      },
      {
        "slug": "community-welcome-gate",
        "name": "Community Welcome Gate",
        "scene": "Eye-level view of a park gate with simple colorful Holi ribbons and a wide accessible path"
      },
      {
        "slug": "paper-windmills",
        "name": "Paper Windmills",
        "scene": "Low-angle view of several handmade paper windmills turning above a community Holi garden"
      },
      {
        "slug": "the-sweet-parcel",
        "name": "The Sweet Parcel",
        "scene": "Overhead view of a small unbranded sweet box with gujiya, nuts and a plain fabric ribbon"
      },
      {
        "slug": "clothesline-rainbow",
        "name": "Clothesline Rainbow",
        "scene": "Wide view of differently color-stained cotton scarves drying across an ordinary terrace after Holi"
      },
      {
        "slug": "the-spring-lake",
        "name": "The Spring Lake",
        "scene": "Wide lakeside view of bright festival picnic mats reflected beside flowering trees"
      },
      {
        "slug": "a-single-color-cloud",
        "name": "A Single Color Cloud",
        "scene": "Side view of a small suspended puff of pink Holi powder against a dark outdoor background, no people"
      },
      {
        "slug": "colorful-footprints",
        "name": "Colorful Footprints",
        "scene": "Ground-level view of overlapping colored footprints leading away from a community festival entrance"
      },
      {
        "slug": "the-flower-cart",
        "name": "The Flower Cart",
        "scene": "Eye-level view of a handcart filled with loose spring flowers beside a Holi gathering lane"
      },
      {
        "slug": "turmeric-and-beetroot",
        "name": "Turmeric and Beetroot",
        "scene": "Overhead view of turmeric roots and cut beetroot beside small bowls of naturally colored powders"
      },
      {
        "slug": "courtyard-water-tap",
        "name": "Courtyard Water Tap",
        "scene": "Close view of a clean outdoor tap and a color-speckled steel bucket after a Holi afternoon"
      },
      {
        "slug": "the-park-pavilion",
        "name": "The Park Pavilion",
        "scene": "Wide architectural view of an empty park pavilion hung with bright cotton fabric for Holi"
      },
      {
        "slug": "a-string-of-kites",
        "name": "A String of Kites",
        "scene": "Low-angle view of different colorful kites suspended above a neighborhood spring gathering"
      },
      {
        "slug": "clay-pigment-pots",
        "name": "Clay Pigment Pots",
        "scene": "Macro view of earthy small clay pigment pots with differently colored rims at a festival supply stall"
      },
      {
        "slug": "colorful-umbrella-shelter",
        "name": "Colorful Umbrella Shelter",
        "scene": "Wide view beneath a few bright open umbrellas shading an empty community Holi rest area"
      },
      {
        "slug": "the-floral-swing",
        "name": "The Floral Swing",
        "scene": "Eye-level view of an empty garden swing decorated with loose spring flowers for Holi"
      },
      {
        "slug": "a-drum-s-surface",
        "name": "A Drum's Surface",
        "scene": "Tight close-up of a dhol drum skin lightly dusted with bright Holi color"
      },
      {
        "slug": "marigold-pathway",
        "name": "Marigold Pathway",
        "scene": "Elevated view of an irregular flower-petal path leading into a quiet Holi courtyard"
      },
      {
        "slug": "the-community-water-station",
        "name": "The Community Water Station",
        "scene": "Frontal view of refillable water dispensers and clean reusable cups beside a Holi field"
      },
      {
        "slug": "green-mango-cooler",
        "name": "Green Mango Cooler",
        "scene": "Close view of a frosted glass of pale green mango cooler against distant spring trees"
      },
      {
        "slug": "color-on-the-brick-wall",
        "name": "Color on the Brick Wall",
        "scene": "Eye-level view of expressive washable Holi color splashes on an ordinary exterior brick wall"
      },
      {
        "slug": "festival-beneath-the-neem",
        "name": "Festival Beneath the Neem",
        "scene": "Wide view of an old neem tree shading an empty colorful neighborhood Holi gathering space"
      },
      {
        "slug": "the-wooden-spinning-tops",
        "name": "The Wooden Spinning Tops",
        "scene": "Overhead view of differently painted traditional spinning tops on a bright cotton floor cloth"
      },
      {
        "slug": "sweet-fritters",
        "name": "Sweet Fritters",
        "scene": "Macro view of fresh sweet fritters with irregular golden surfaces in a plain metal serving bowl"
      },
      {
        "slug": "a-rooftop-rainbow",
        "name": "A Rooftop Rainbow",
        "scene": "Wide elevated view across a roof terrace with vivid Holi fabric and a real city skyline"
      },
      {
        "slug": "the-color-sieve",
        "name": "The Color Sieve",
        "scene": "Close view of a metal sieve and fine colored powder resting on a stone courtyard ledge"
      },
      {
        "slug": "spring-shoes",
        "name": "Spring Shoes",
        "scene": "Ground-level view of several empty color-speckled canvas shoes beside a community wash area"
      },
      {
        "slug": "holi-by-the-riverside",
        "name": "Holi by the Riverside",
        "scene": "Wide riverfront view of an empty public promenade with restrained colorful festival bunting"
      },
      {
        "slug": "the-community-bonfire",
        "name": "The Community Bonfire",
        "scene": "Wide natural-night view of a modest Holi-season community bonfire in an open safe clearing, no people"
      },
      {
        "slug": "a-box-of-colored-chalk",
        "name": "A Box of Colored Chalk",
        "scene": "Overhead view of thick unbranded colored chalk and playful abstract marks on pavement"
      },
      {
        "slug": "the-flower-seller-s-awning",
        "name": "The Flower Seller's Awning",
        "scene": "Wide street-level view beneath a colorful market awning with flower baskets for Holi"
      },
      {
        "slug": "coconut-laddoo",
        "name": "Coconut Laddoo",
        "scene": "Tight close view of uneven handmade coconut laddoo in an open plain sweet tin"
      },
      {
        "slug": "puddle-of-spring-light",
        "name": "Puddle of Spring Light",
        "scene": "Ground-level view of a courtyard puddle reflecting colorful festival fabric and fresh tree leaves"
      },
      {
        "slug": "the-bandstand",
        "name": "The Bandstand",
        "scene": "Wide view of an empty neighborhood bandstand with simple Holi drapes and a few waiting instruments"
      },
      {
        "slug": "a-stained-canvas-bag",
        "name": "A Stained Canvas Bag",
        "scene": "Eye-level view of a reusable cloth festival bag carrying irregular color stains, hanging from a garden hook"
      },
      {
        "slug": "blossoms-beyond-the-gate",
        "name": "Blossoms Beyond the Gate",
        "scene": "Low-angle view through an open gate toward a flowering spring tree and scattered Holi petals"
      },
      {
        "slug": "quiet-after-the-festival",
        "name": "Quiet After the Festival",
        "scene": "Wide late-afternoon view of an empty Holi gathering lawn with soft color traces and long tree shadows"
      }
    ]
  },
  {
    "id": "nowruz",
    "name": "Nowruz",
    "kind": "Religious & cultural",
    "date": {
      "kind": "calendar",
      "calendar": "persian",
      "month": "1",
      "day": 1,
      "duration": 13,
      "eve": false
    },
    "palettes": [
      "sage",
      "teal",
      "rose"
    ],
    "purpose": "celebration",
    "aliases": "Nowruz Persian New Year spring equinox",
    "designs": [
      {
        "slug": "spring-hyacinths",
        "name": "Spring Hyacinths",
        "scene": "A pot of real hyacinths beside a window in a modest home"
      },
      {
        "slug": "green-shoots",
        "name": "Green Shoots",
        "scene": "A small dish of wheat sprouts on a family table"
      },
      {
        "slug": "haft-sin-details",
        "name": "Haft Sin Details",
        "scene": "Apples, garlic, a dish of sprouts and a simple mirror on a modest Nowruz table, no goldfish"
      },
      {
        "slug": "family-tea",
        "name": "Family Tea",
        "scene": "Tea glasses and homemade pastries on a lived-in dining table"
      },
      {
        "slug": "spring-orchard",
        "name": "Spring Orchard",
        "scene": "Blossoming fruit trees in ordinary soft spring daylight"
      },
      {
        "slug": "painted-eggs",
        "name": "Painted Eggs",
        "scene": "Hand-painted eggs with imperfect marks beside fresh sprouts"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A modest doorway with spring flowers and a small welcome table"
      },
      {
        "slug": "shared-meal",
        "name": "Shared Meal",
        "scene": "A home table with herb rice, plain dishes and fresh greenery"
      },
      {
        "slug": "garden-picnic",
        "name": "Garden Picnic",
        "scene": "A simple picnic blanket and food basket under budding trees"
      },
      {
        "slug": "fresh-beginning",
        "name": "Fresh Beginning",
        "scene": "A small bowl of apples, hyacinths and a plain candle beside a window"
      },
      {
        "slug": "blossoms-above-the-door",
        "name": "Blossoms Above the Door",
        "scene": "Low-angle view of apricot blossoms arching over a plain welcoming doorway at the spring new year"
      },
      {
        "slug": "sabzeh-in-sunlight",
        "name": "Sabzeh in Sunlight",
        "scene": "Macro view of fresh green sabzeh shoots bending toward natural light in a simple shallow dish"
      },
      {
        "slug": "mountain-snowmelt",
        "name": "Mountain Snowmelt",
        "scene": "Wide view of a spring mountain stream carrying snowmelt past new grass during Nowruz season"
      },
      {
        "slug": "the-spring-market",
        "name": "The Spring Market",
        "scene": "Eye-level view of a neighborhood market stall with hyacinths, sprouts and fresh herbs for Nowruz"
      },
      {
        "slug": "a-mirror-and-candle",
        "name": "A Mirror and Candle",
        "scene": "Close side view of one simple mirror reflecting a small candle flame and fresh spring blossoms"
      },
      {
        "slug": "picnic-under-the-willows",
        "name": "Picnic Under the Willows",
        "scene": "Elevated view of a family picnic blanket beside a stream beneath newly leafing willow trees"
      },
      {
        "slug": "painted-eggs-from-above",
        "name": "Painted Eggs from Above",
        "scene": "Straight overhead view of a few differently hand-painted eggs in a plain bowl on cool stone"
      },
      {
        "slug": "hyacinth-roots",
        "name": "Hyacinth Roots",
        "scene": "Botanical close-up of a hyacinth bulb with visible roots in a clear growing glass"
      },
      {
        "slug": "freshly-washed-rugs",
        "name": "Freshly Washed Rugs",
        "scene": "Wide view of washed rugs drying from a courtyard rail in bright spring air before Nowruz"
      },
      {
        "slug": "the-apple-basket",
        "name": "The Apple Basket",
        "scene": "Ground-level view of red apples in a wicker basket beside an open spring garden gate"
      },
      {
        "slug": "nowruz-courtyard-fountain",
        "name": "Nowruz Courtyard Fountain",
        "scene": "Wide architectural view of a quiet courtyard fountain framed by budding trees and simple spring decorations"
      },
      {
        "slug": "a-bowl-of-samanu",
        "name": "A Bowl of Samanu",
        "scene": "Macro view of the rich brown surface of samanu in one small ceramic serving bowl"
      },
      {
        "slug": "tea-in-the-garden",
        "name": "Tea in the Garden",
        "scene": "Side view of two small tea glasses on a low garden stool beneath flowering branches"
      },
      {
        "slug": "the-haft-sin-corner",
        "name": "The Haft-Sin Corner",
        "scene": "Wide view of a modest household haft-sin arrangement, varied real items on a simple sideboard"
      },
      {
        "slug": "fresh-herb-bunches",
        "name": "Fresh Herb Bunches",
        "scene": "Overhead view of dill, parsley and chives bundled beside a rinsing colander on a stone counter"
      },
      {
        "slug": "the-spring-train",
        "name": "The Spring Train",
        "scene": "Wide view of a train curving through green foothills and flowering orchards during Nowruz travel season"
      },
      {
        "slug": "tulips-at-the-window",
        "name": "Tulips at the Window",
        "scene": "Eye-level view of freshly cut tulips in a plain glass vase at an open home window"
      },
      {
        "slug": "a-plain-gift-envelope",
        "name": "A Plain Gift Envelope",
        "scene": "Close view of a small new-year gift envelope resting beside a single hyacinth blossom"
      },
      {
        "slug": "riverbank-gathering",
        "name": "Riverbank Gathering",
        "scene": "Wide view of an empty riverside picnic shelter prepared for a Nowruz family outing"
      },
      {
        "slug": "coins-in-a-dish",
        "name": "Coins in a Dish",
        "scene": "Overhead close view of a few ordinary coins in a simple ceramic dish beside fresh green sprouts"
      },
      {
        "slug": "the-kitchen-herb-rice",
        "name": "The Kitchen Herb Rice",
        "scene": "Overhead view of a small pot of fresh herb rice with visible dill and a plain serving spoon"
      },
      {
        "slug": "courtyard-spring-cleaning",
        "name": "Courtyard Spring Cleaning",
        "scene": "Eye-level view of an open courtyard with a simple broom, a water bucket and freshly swept paving"
      },
      {
        "slug": "the-almond-orchard",
        "name": "The Almond Orchard",
        "scene": "Wide low-angle view along an almond orchard in full spring bloom beneath a soft blue sky"
      },
      {
        "slug": "a-bowl-of-senjed",
        "name": "A Bowl of Senjed",
        "scene": "Macro view of naturally textured dried oleaster fruit in a plain small bowl for a haft-sin setting"
      },
      {
        "slug": "woven-picnic-baskets",
        "name": "Woven Picnic Baskets",
        "scene": "Ground-level view of two different packed picnic baskets beside shoes at an open doorway"
      },
      {
        "slug": "wildflowers-on-the-hill",
        "name": "Wildflowers on the Hill",
        "scene": "Wide view of a green hillside scattered with early spring wildflowers in Nowruz season"
      },
      {
        "slug": "the-garlic-braid",
        "name": "The Garlic Braid",
        "scene": "Close view of a fresh garlic braid hanging beside an open sunlit pantry window"
      },
      {
        "slug": "new-clothes-on-the-rail",
        "name": "New Clothes on the Rail",
        "scene": "Eye-level view of a fresh spring outfit hanging by a window, prepared for Nowruz visiting"
      },
      {
        "slug": "a-bridge-to-the-picnic",
        "name": "A Bridge to the Picnic",
        "scene": "Wide view of an empty stone footbridge leading toward a green riverside meadow"
      },
      {
        "slug": "sumac-detail",
        "name": "Sumac Detail",
        "scene": "Straight overhead macro view of crimson ground sumac in a small shallow dish on pale stone"
      },
      {
        "slug": "the-village-courtyard",
        "name": "The Village Courtyard",
        "scene": "Elevated wide view of an ordinary village courtyard with a few blossom branches and spring seating"
      },
      {
        "slug": "pastry-box-for-visiting",
        "name": "Pastry Box for Visiting",
        "scene": "Overhead view of delicate homemade spring pastries in an open unbranded visiting box"
      },
      {
        "slug": "green-wheat-field",
        "name": "Green Wheat Field",
        "scene": "Ground-level botanical view across young green wheat stalks toward a distant Nowruz-season village"
      },
      {
        "slug": "the-window-s-reflection",
        "name": "The Window's Reflection",
        "scene": "Architectural close-up of budding branches reflected in an old courtyard window after spring rain"
      },
      {
        "slug": "a-bowl-of-vinegar",
        "name": "A Bowl of Vinegar",
        "scene": "Tight side view of amber vinegar in a small clear vessel reflecting a fresh haft-sin sprout dish"
      },
      {
        "slug": "the-kite-meadow",
        "name": "The Kite Meadow",
        "scene": "Wide view of several simple kites resting beside an empty spring picnic meadow"
      },
      {
        "slug": "spring-herb-pots",
        "name": "Spring Herb Pots",
        "scene": "Eye-level view of small pots of fresh herbs lining a real apartment balcony in early spring"
      },
      {
        "slug": "a-folded-embroidered-cloth",
        "name": "A Folded Embroidered Cloth",
        "scene": "Overhead view of a family heirloom-style embroidered cloth folded beside simple Nowruz visiting gifts"
      },
      {
        "slug": "snowdrop-morning",
        "name": "Snowdrop Morning",
        "scene": "Macro view of snowdrops emerging naturally from damp soil beside melting snow"
      },
      {
        "slug": "a-neighborhood-bakery",
        "name": "A Neighborhood Bakery",
        "scene": "Wide view of a small bakery's cooling shelves filled with fresh bread before Nowruz opening"
      },
      {
        "slug": "firelight-in-the-clearing",
        "name": "Firelight in the Clearing",
        "scene": "Wide natural-night view of a modest spring-new-year bonfire in an open clearing, no people"
      },
      {
        "slug": "the-brass-ewer",
        "name": "The Brass Ewer",
        "scene": "Close view of a plain brass ewer catching spring daylight beside a few real blossom branches"
      },
      {
        "slug": "a-garden-seat",
        "name": "A Garden Seat",
        "scene": "Eye-level view of a freshly cleaned garden bench beneath a blossoming tree for a Nowruz visit"
      },
      {
        "slug": "the-copper-sweet-tin",
        "name": "The Copper Sweet Tin",
        "scene": "Overhead view of a small copper-colored tin holding nut sweets and one simple serving tong"
      },
      {
        "slug": "a-spring-door-knocker",
        "name": "A Spring Door Knocker",
        "scene": "Macro view of an old door knocker with a small fresh flower tied nearby for Nowruz visiting"
      },
      {
        "slug": "the-riverside-bicycle",
        "name": "The Riverside Bicycle",
        "scene": "Ground-level view of a parked bicycle carrying a picnic basket beside a green river path"
      },
      {
        "slug": "pistachio-and-rose",
        "name": "Pistachio and Rose",
        "scene": "Close view of pistachio pieces and dried rose petals beside a few handmade spring sweets"
      },
      {
        "slug": "a-new-year-at-the-lake",
        "name": "A New Year at the Lake",
        "scene": "Wide view of a calm lake edged with budding trees and an empty Nowruz picnic blanket"
      },
      {
        "slug": "the-first-green-branch",
        "name": "The First Green Branch",
        "scene": "Low-angle botanical view of a single new leafy branch against an old courtyard wall"
      },
      {
        "slug": "sunrise-in-the-orchard",
        "name": "Sunrise in the Orchard",
        "scene": "Wide dawn view of a real flowering orchard and distant mountains welcoming the spring new year"
      }
    ]
  },
  {
    "id": "vaisakhi",
    "name": "Vaisakhi",
    "kind": "Religious & cultural",
    "date": {
      "kind": "window",
      "start": [
        4,
        13
      ],
      "end": [
        4,
        14
      ]
    },
    "palettes": [
      "ochre",
      "terracotta",
      "sage"
    ],
    "purpose": "celebration",
    "aliases": "Vaisakhi Baisakhi Sikh Punjabi harvest April",
    "designs": [
      {
        "slug": "harvest-morning",
        "name": "Harvest Morning",
        "scene": "A real wheat field in ordinary soft morning daylight"
      },
      {
        "slug": "community-kitchen",
        "name": "Community Kitchen",
        "scene": "Large plain serving pots and stacks of plates in a modest community kitchen"
      },
      {
        "slug": "shared-meal",
        "name": "Shared Meal",
        "scene": "Simple steel plates with dal, rice and roti on a community table"
      },
      {
        "slug": "spring-welcome",
        "name": "Spring Welcome",
        "scene": "A modest doorway decorated with a small marigold garland"
      },
      {
        "slug": "golden-wheat",
        "name": "Golden Wheat",
        "scene": "A few naturally uneven wheat stems in a plain ceramic jug"
      },
      {
        "slug": "helping-together",
        "name": "Helping Together",
        "scene": "Clean aprons and serving spoons on a community kitchen counter"
      },
      {
        "slug": "garden-gathering",
        "name": "Garden Gathering",
        "scene": "A simple outdoor table with marigolds and plain water glasses"
      },
      {
        "slug": "harvest-basket",
        "name": "Harvest Basket",
        "scene": "Wheat stems and fresh seasonal produce in a plain basket"
      },
      {
        "slug": "community-hall",
        "name": "Community Hall",
        "scene": "An empty modest community hall prepared with simple meal service stations"
      },
      {
        "slug": "spring-courtyard",
        "name": "Spring Courtyard",
        "scene": "A quiet courtyard with potted flowers and a few chairs in natural daylight"
      },
      {
        "slug": "golden-wheat-horizon",
        "name": "Golden Wheat Horizon",
        "scene": "Ground-level view through ripe golden wheat toward a distant Punjab-style farmstead in spring"
      },
      {
        "slug": "gurdwara-morning-courtyard",
        "name": "Gurdwara Morning Courtyard",
        "scene": "Wide respectful architectural view of an empty gurdwara courtyard in fresh morning light, no readable sacred text"
      },
      {
        "slug": "the-dhol-drum",
        "name": "The Dhol Drum",
        "scene": "Close eye-level view of a real dhol drum with its two beaters resting beside a community stage"
      },
      {
        "slug": "harvest-tractor",
        "name": "Harvest Tractor",
        "scene": "Wide view of an unbranded tractor parked at the edge of a freshly cut wheat field"
      },
      {
        "slug": "steel-plates-for-langar",
        "name": "Steel Plates for Langar",
        "scene": "Overhead view of clean stainless-steel thali plates stacked for a community Vaisakhi meal"
      },
      {
        "slug": "phulkari-in-the-breeze",
        "name": "Phulkari in the Breeze",
        "scene": "Side view of a genuine phulkari-style embroidered cloth drying from a shaded courtyard rail"
      },
      {
        "slug": "the-irrigation-channel",
        "name": "The Irrigation Channel",
        "scene": "Low-angle view along a narrow irrigation channel reflecting spring wheat and a clear sky"
      },
      {
        "slug": "marigold-market-baskets",
        "name": "Marigold Market Baskets",
        "scene": "Eye-level view of baskets of fresh marigolds at a local market preparing for Vaisakhi"
      },
      {
        "slug": "the-shared-water-stand",
        "name": "The Shared Water Stand",
        "scene": "Frontal view of a plain outdoor drinking-water stand with steel cups beside a community gathering space"
      },
      {
        "slug": "wheat-in-the-granary",
        "name": "Wheat in the Granary",
        "scene": "Wide elevated view of harvested wheat in a modest farm granary with woven sacks nearby"
      },
      {
        "slug": "roti-on-the-tawa",
        "name": "Roti on the Tawa",
        "scene": "Close side view of one puffing roti on a plain tawa at a community cooking station"
      },
      {
        "slug": "the-courtyard-shoes",
        "name": "The Courtyard Shoes",
        "scene": "Ground-level view of orderly shoes placed respectfully outside a gurdwara entrance"
      },
      {
        "slug": "a-village-bandstand",
        "name": "A Village Bandstand",
        "scene": "Wide view of an empty village performance platform with bright fabric prepared for Vaisakhi music"
      },
      {
        "slug": "sugarcane-juice-stall",
        "name": "Sugarcane Juice Stall",
        "scene": "Eye-level view of a small unbranded sugarcane press and steel tumblers at a spring fair stall"
      },
      {
        "slug": "the-harvest-sickle",
        "name": "The Harvest Sickle",
        "scene": "Overhead close view of a well-used sickle and freshly cut wheat stalks on a plain stone ledge"
      },
      {
        "slug": "spring-canal-bridge",
        "name": "Spring Canal Bridge",
        "scene": "Wide view of an empty rural bridge crossing a canal beside golden fields during Vaisakhi"
      },
      {
        "slug": "a-pair-of-jutti",
        "name": "A Pair of Jutti",
        "scene": "Macro view of a pair of embroidered Punjabi jutti shoes placed beside a folded colorful outfit"
      },
      {
        "slug": "community-meal-pavilion",
        "name": "Community Meal Pavilion",
        "scene": "Wide architectural view of an empty shaded pavilion with floor seating arranged for a shared Vaisakhi meal"
      },
      {
        "slug": "mustard-at-the-field-edge",
        "name": "Mustard at the Field Edge",
        "scene": "Low-angle botanical view of a few mustard flowers surviving beside a ripe wheat field"
      },
      {
        "slug": "the-volunteer-apron-rail",
        "name": "The Volunteer Apron Rail",
        "scene": "Eye-level view of clean volunteer aprons hanging neatly beside a community langar serving area"
      },
      {
        "slug": "a-bowl-of-dal",
        "name": "A Bowl of Dal",
        "scene": "Overhead view of a simple lentil dal bowl and a steel serving spoon on a clean metal tray"
      },
      {
        "slug": "kites-over-the-farm",
        "name": "Kites Over the Farm",
        "scene": "Low-angle view of bright kites above a real farmhouse roof during a Vaisakhi family gathering"
      },
      {
        "slug": "the-wheat-thresher",
        "name": "The Wheat Thresher",
        "scene": "Wide view of a stationary modest farm thresher beside neatly gathered wheat sheaves"
      },
      {
        "slug": "orange-fabric-canopy",
        "name": "Orange Fabric Canopy",
        "scene": "Architectural view from beneath a plain orange community canopy toward an empty bright courtyard"
      },
      {
        "slug": "fresh-lassi",
        "name": "Fresh Lassi",
        "scene": "Tight side view of a frothy lassi in a plain steel tumbler with condensation visible"
      },
      {
        "slug": "a-courtyard-charpai",
        "name": "A Courtyard Charpai",
        "scene": "Eye-level view of a woven charpai beneath a shade tree in a modest spring farm courtyard"
      },
      {
        "slug": "the-drum-straps",
        "name": "The Drum Straps",
        "scene": "Macro view of worn woven dhol straps and wooden drum beaters beside a stage edge"
      },
      {
        "slug": "harvest-cart-at-dawn",
        "name": "Harvest Cart at Dawn",
        "scene": "Wide dawn view of a simple cart holding wheat sheaves at the entrance to a farm lane"
      },
      {
        "slug": "garden-for-the-community",
        "name": "Garden for the Community",
        "scene": "Elevated view of a small community garden prepared with benches and spring flowers for Vaisakhi"
      },
      {
        "slug": "a-shared-handwashing-point",
        "name": "A Shared Handwashing Point",
        "scene": "Frontal view of clean outdoor taps and soap near a community meal entrance"
      },
      {
        "slug": "jaggery-pieces",
        "name": "Jaggery Pieces",
        "scene": "Macro view of irregular jaggery chunks in a plain bowl beside fresh wheat stalks"
      },
      {
        "slug": "the-cloth-stall",
        "name": "The Cloth Stall",
        "scene": "Wide street-level view of a colorful textile stall with folded everyday festive fabrics for Vaisakhi"
      },
      {
        "slug": "a-quiet-reflecting-pool",
        "name": "A Quiet Reflecting Pool",
        "scene": "Low-angle view across a peaceful gurdwara reflecting pool toward respectful distant architecture"
      },
      {
        "slug": "wheat-tied-by-hand",
        "name": "Wheat Tied by Hand",
        "scene": "Close view of an uneven hand-tied wheat sheaf with natural straw texture and no decorative staging"
      },
      {
        "slug": "the-fairground-wheel",
        "name": "The Fairground Wheel",
        "scene": "Wide view of a modest village fairground wheel and colorful Vaisakhi bunting before opening"
      },
      {
        "slug": "steel-cup-reflections",
        "name": "Steel Cup Reflections",
        "scene": "Overhead view of clean steel drinking cups reflecting a bright courtyard canopy"
      },
      {
        "slug": "a-spring-bicycle-route",
        "name": "A Spring Bicycle Route",
        "scene": "Ground-level view of an ordinary bicycle beside a canal path through spring agricultural fields"
      },
      {
        "slug": "the-community-bread-basket",
        "name": "The Community Bread Basket",
        "scene": "Close view of fresh rotis wrapped in a clean cloth inside a plain insulated serving basket"
      },
      {
        "slug": "an-orchard-rest-stop",
        "name": "An Orchard Rest Stop",
        "scene": "Wide view of an empty orchard shade shelter beside a wheat-growing farm during Vaisakhi"
      },
      {
        "slug": "a-bright-turban-cloth",
        "name": "A Bright Turban Cloth",
        "scene": "Side view of neatly folded plain turban cloth beside a fresh kurta, respectful and without symbols"
      },
      {
        "slug": "the-combine-at-rest",
        "name": "The Combine at Rest",
        "scene": "Wide elevated view of a parked combine harvester in a field with parallel cut wheat rows"
      },
      {
        "slug": "fresh-mint-for-lassi",
        "name": "Fresh Mint for Lassi",
        "scene": "Botanical macro view of fresh mint growing in a simple pot beside a farmhouse water vessel"
      },
      {
        "slug": "the-community-hall-windows",
        "name": "The Community Hall Windows",
        "scene": "Interior wide view of a plain community hall with sunlight, folded mats and a few festive flowers"
      },
      {
        "slug": "a-sack-of-flour",
        "name": "A Sack of Flour",
        "scene": "Ground-level view of an open plain flour sack and a metal scoop beside a community bread station"
      },
      {
        "slug": "evening-at-the-farm-gate",
        "name": "Evening at the Farm Gate",
        "scene": "Wide natural-dusk view of a farm entrance with simple Vaisakhi lights and golden stubble beyond"
      },
      {
        "slug": "the-children-s-ring-toss",
        "name": "The Children's Ring Toss",
        "scene": "Overhead view of colorful wooden rings and pegs prepared for a Vaisakhi family fair game"
      },
      {
        "slug": "a-garland-on-the-tractor",
        "name": "A Garland on the Tractor",
        "scene": "Close view of a modest marigold garland tied to a parked unbranded tractor's front rail"
      },
      {
        "slug": "the-courtyard-kitchen-hatch",
        "name": "The Courtyard Kitchen Hatch",
        "scene": "Eye-level view through an open community cooking hatch toward clean covered serving pots"
      },
      {
        "slug": "seeds-for-next-season",
        "name": "Seeds for Next Season",
        "scene": "Overhead view of wheat seed in an unmarked paper packet beside a small farmer's hand scale"
      },
      {
        "slug": "vaisakhi-under-the-stars",
        "name": "Vaisakhi Under the Stars",
        "scene": "Wide natural-night view of a quiet community courtyard with restrained festive lights and an empty dhol stage"
      }
    ]
  },
  {
    "id": "corn-maze",
    "name": "Corn Mazes",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        9,
        1
      ],
      "end": [
        10,
        31
      ]
    },
    "palettes": [
      "cider",
      "moss",
      "olive"
    ],
    "purpose": "volunteers",
    "aliases": "corn maze autumn fall farm maze hayride",
    "designs": [
      {
        "slug": "farm-trail",
        "name": "Farm Trail",
        "scene": "Eye-level view down a narrow muddy path through tall drying corn on an overcast autumn afternoon, uneven stalks and modest farm fencing"
      },
      {
        "slug": "barnside-maze",
        "name": "Barnside Maze",
        "scene": "An ordinary corn maze beside a small weathered farm shed under a pale cloudy sky"
      },
      {
        "slug": "morning-dew",
        "name": "Morning Dew",
        "scene": "A close view of corn leaves with real dew beside a slightly rutted maze path"
      },
      {
        "slug": "field-journal",
        "name": "Field Journal",
        "scene": "A worn notebook with blank pages and simple work gloves on a farm gate, cornfield behind"
      },
      {
        "slug": "harvest-entrance",
        "name": "Harvest Entrance",
        "scene": "A modest corn-maze entrance with an unlettered wooden sign and one imperfect pumpkin"
      },
      {
        "slug": "country-afternoon",
        "name": "Country Afternoon",
        "scene": "An ordinary rural corn maze seen from a low hillside under soft daylight, no dramatic sky"
      },
      {
        "slug": "pumpkin-stop",
        "name": "Pumpkin Stop",
        "scene": "A few uneven pumpkins in a simple wooden crate beside a cornfield path"
      },
      {
        "slug": "autumn-footpath",
        "name": "Autumn Footpath",
        "scene": "Dry corn husks scattered on an irregular dirt footpath through the maze"
      },
      {
        "slug": "family-farm",
        "name": "Family Farm",
        "scene": "A weathered picnic table and a small wagon beside a real-looking cornfield"
      },
      {
        "slug": "last-rows",
        "name": "Last Rows",
        "scene": "A quiet opening between uneven rows of drying corn with a simple fence in the distance"
      },
      {
        "slug": "the-maze-from-above",
        "name": "The Maze from Above",
        "scene": "High aerial view of a real irregular corn maze beside a modest working farm"
      },
      {
        "slug": "corn-at-eye-level",
        "name": "Corn at Eye Level",
        "scene": "Eye-level close view of mature corn ears growing beside a narrow dirt maze entrance"
      },
      {
        "slug": "the-observation-tower",
        "name": "The Observation Tower",
        "scene": "Low-angle view of a simple wooden maze lookout tower rising above full-grown corn"
      },
      {
        "slug": "a-fork-in-the-rows",
        "name": "A Fork in the Rows",
        "scene": "Ground-level view of three diverging dirt paths between tall corn, without readable signs"
      },
      {
        "slug": "harvest-wagon-arrival",
        "name": "Harvest Wagon Arrival",
        "scene": "Wide view of an empty wooden hay wagon beside a corn-maze farm entrance"
      },
      {
        "slug": "the-scarecrow-sentinel",
        "name": "The Scarecrow Sentinel",
        "scene": "Eye-level view of one handmade straw scarecrow at the edge of a real corn maze"
      },
      {
        "slug": "morning-spiderweb",
        "name": "Morning Spiderweb",
        "scene": "Macro view of a dew-covered spiderweb stretched between two living corn leaves"
      },
      {
        "slug": "the-barn-ticket-hatch",
        "name": "The Barn Ticket Hatch",
        "scene": "Frontal view of an unlettered farm ticket hatch with plain wristbands and a small lantern"
      },
      {
        "slug": "a-maze-by-the-lake",
        "name": "A Maze by the Lake",
        "scene": "Elevated wide view of a corn maze beside an ordinary farm lake in autumn"
      },
      {
        "slug": "the-muddy-boots-rack",
        "name": "The Muddy Boots Rack",
        "scene": "Ground-level view of muddy farm boots lined beneath a covered maze entrance bench"
      },
      {
        "slug": "a-wooden-footbridge",
        "name": "A Wooden Footbridge",
        "scene": "Low-angle view of a small footbridge crossing a drainage ditch into a corn-maze field"
      },
      {
        "slug": "sunflower-boundary",
        "name": "Sunflower Boundary",
        "scene": "Wide view of sunflowers separating a tall corn maze from an open farm path"
      },
      {
        "slug": "the-corn-tassel",
        "name": "The Corn Tassel",
        "scene": "Botanical macro view of a single mature corn tassel against a pale autumn sky"
      },
      {
        "slug": "a-tractor-rest-stop",
        "name": "A Tractor Rest Stop",
        "scene": "Wide view of an old unbranded tractor beside a maze boundary fence"
      },
      {
        "slug": "the-checkpoint-bell",
        "name": "The Checkpoint Bell",
        "scene": "Close view of a small brass checkpoint bell hanging from a plain post within corn rows"
      },
      {
        "slug": "aerial-maze-crossroads",
        "name": "Aerial Maze Crossroads",
        "scene": "Straight overhead view of a maze crossroads with trampled dirt and irregular corn edges"
      },
      {
        "slug": "pumpkin-harvest-cart",
        "name": "Pumpkin Harvest Cart",
        "scene": "Eye-level view of a handcart holding uneven pumpkins beside a corn-maze farm lane"
      },
      {
        "slug": "a-lantern-at-dusk",
        "name": "A Lantern at Dusk",
        "scene": "Ground-level view of a single farm lantern lighting a corn-row bend at natural dusk"
      },
      {
        "slug": "the-covered-picnic-barn",
        "name": "The Covered Picnic Barn",
        "scene": "Wide architectural view of an open-sided picnic barn beside a corn-maze entrance"
      },
      {
        "slug": "corn-silk-detail",
        "name": "Corn Silk Detail",
        "scene": "Macro view of golden corn silk and the rough edge of its living green husk"
      },
      {
        "slug": "after-the-rain",
        "name": "After the Rain",
        "scene": "Low-angle view of puddles reflecting tall corn and a distant wooden maze lookout"
      },
      {
        "slug": "the-rustic-water-pump",
        "name": "The Rustic Water Pump",
        "scene": "Close view of a working farm hand pump beside a clean maze visitor water station"
      },
      {
        "slug": "a-red-gate-opening",
        "name": "A Red Gate Opening",
        "scene": "Eye-level view through a plain red farm gate toward the start of an autumn corn maze"
      },
      {
        "slug": "the-straw-bale-tunnel",
        "name": "The Straw Bale Tunnel",
        "scene": "Ground-level view into a short straw-bale tunnel beside a farm maze activity area"
      },
      {
        "slug": "an-orchard-boundary",
        "name": "An Orchard Boundary",
        "scene": "Wide view of an apple orchard running beside a tall corn-maze field"
      },
      {
        "slug": "the-blank-maze-card",
        "name": "The Blank Maze Card",
        "scene": "Overhead view of a plain folded route card, pencil and simple compass on a farm bench"
      },
      {
        "slug": "birds-above-the-field",
        "name": "Birds Above the Field",
        "scene": "Wide low-angle view of a few natural blackbirds rising above a corn maze"
      },
      {
        "slug": "the-farmyard-handcart",
        "name": "The Farmyard Handcart",
        "scene": "Frontal view of an empty handcart with a plaid blanket beside a maze welcome shed"
      },
      {
        "slug": "fog-between-the-rows",
        "name": "Fog Between the Rows",
        "scene": "Wide eye-level view into a corn-maze corridor with soft ordinary morning fog"
      },
      {
        "slug": "a-wooden-balance-trail",
        "name": "A Wooden Balance Trail",
        "scene": "Elevated view of a log-balancing activity beside a corn-maze farm play area"
      },
      {
        "slug": "the-gourd-display",
        "name": "The Gourd Display",
        "scene": "Close view of irregular striped gourds in a farm crate beside a maze fence"
      },
      {
        "slug": "the-field-edge-swing",
        "name": "The Field Edge Swing",
        "scene": "Low-angle view of an empty rope swing on a tree at the maze farm's edge"
      },
      {
        "slug": "a-quiet-fire-ring",
        "name": "A Quiet Fire Ring",
        "scene": "Wide view of an unlit stone fire ring with log seats beside a corn-maze gathering area"
      },
      {
        "slug": "a-corn-leaf-in-rain",
        "name": "A Corn Leaf in Rain",
        "scene": "Macro view of rain beads following the ridges of one living corn leaf"
      },
      {
        "slug": "the-wheelbarrow-route",
        "name": "The Wheelbarrow Route",
        "scene": "Ground-level view of a worn blue wheelbarrow beside a wide accessible maze perimeter path"
      },
      {
        "slug": "a-real-farm-windmill",
        "name": "A Real Farm Windmill",
        "scene": "Wide view of a small working windmill beyond a tall corn-maze field"
      },
      {
        "slug": "the-petting-pen-neighbor",
        "name": "The Petting-Pen Neighbor",
        "scene": "Eye-level view of a healthy goat behind a farm pen with a distant maze entrance"
      },
      {
        "slug": "sunset-s-last-rows",
        "name": "Sunset's Last Rows",
        "scene": "Wide view across outer corn rows beneath a soft natural autumn sunset"
      },
      {
        "slug": "the-lost-mitten",
        "name": "The Lost Mitten",
        "scene": "Close view of a small knitted mitten resting on a fence rail beside a maze path"
      },
      {
        "slug": "a-shelter-from-drizzle",
        "name": "A Shelter from Drizzle",
        "scene": "Architectural view of a modest covered waiting shelter with empty benches at the maze entrance"
      },
      {
        "slug": "the-grain-bin",
        "name": "The Grain Bin",
        "scene": "Low-angle view of a metal grain bin beside a harvested field and green maze strip"
      },
      {
        "slug": "farm-cider-press",
        "name": "Farm Cider Press",
        "scene": "Close view of a traditional apple press at the farm refreshment area near a corn maze"
      },
      {
        "slug": "a-cornfield-culvert",
        "name": "A Cornfield Culvert",
        "scene": "Ground-level view of a small drainage culvert beneath a maze access lane"
      },
      {
        "slug": "the-sunflower-seeds",
        "name": "The Sunflower Seeds",
        "scene": "Overhead view of a dried sunflower head and loose seeds on a plain farm stool"
      },
      {
        "slug": "moon-above-the-maze",
        "name": "Moon Above the Maze",
        "scene": "Wide natural-night view of a corn field beneath a moon with a distant entrance light"
      },
      {
        "slug": "an-autumn-creek-crossing",
        "name": "An Autumn Creek Crossing",
        "scene": "Eye-level view of a shallow creek and stepping stones beside a maze perimeter trail"
      },
      {
        "slug": "the-resting-farm-dog",
        "name": "The Resting Farm Dog",
        "scene": "Ground-level view of a relaxed farm dog in shade beside a corn-maze welcome porch"
      },
      {
        "slug": "a-basket-of-miniature-corn",
        "name": "A Basket of Miniature Corn",
        "scene": "Macro view of small multicolored dried corn ears in an unadorned harvest basket"
      },
      {
        "slug": "the-end-of-maze-clearing",
        "name": "The End-of-Maze Clearing",
        "scene": "Elevated wide view of an open clearing with benches at the end of a corn-maze path"
      },
      {
        "slug": "first-frost-on-corn",
        "name": "First Frost on Corn",
        "scene": "Botanical close view of delicate natural frost along a corn leaf in pale morning light"
      }
    ]
  },
  {
    "id": "trunk-or-treat",
    "name": "Trunk-or-Treat",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        10,
        1
      ],
      "end": [
        10,
        31
      ]
    },
    "palettes": [
      "terracotta",
      "plum",
      "ochre"
    ],
    "purpose": "volunteers",
    "aliases": "trunk or treat school church parking lot Halloween",
    "designs": [
      {
        "slug": "pumpkin-trunk",
        "name": "Pumpkin Trunk",
        "scene": "An ordinary parked hatchback with its trunk open, two pumpkins and a small candy bowl, modest handmade autumn decorations"
      },
      {
        "slug": "paper-monster",
        "name": "Paper Monster",
        "scene": "A parked car trunk decorated with simple paper monster teeth and a bowl of unbranded sweets"
      },
      {
        "slug": "neighborhood-treats",
        "name": "Neighborhood Treats",
        "scene": "A small folding table of wrapped sweets beside an open hatchback in a school parking lot"
      },
      {
        "slug": "friendly-ghost-car",
        "name": "Friendly Ghost Car",
        "scene": "An ordinary car trunk decorated with a few handmade white paper ghosts"
      },
      {
        "slug": "fall-tailgate",
        "name": "Fall Tailgate",
        "scene": "A pickup tailgate with a plaid blanket and a simple pumpkin candy bowl"
      },
      {
        "slug": "candy-crew",
        "name": "Candy Crew",
        "scene": "Paper bags, wrapped sweets and plain volunteer supplies on a folding table beside parked cars"
      },
      {
        "slug": "storybook-trunk",
        "name": "Storybook Trunk",
        "scene": "A car trunk with modest handmade cardboard castle decorations, visibly handmade and imperfect"
      },
      {
        "slug": "harvest-parking-lot",
        "name": "Harvest Parking Lot",
        "scene": "A small row of ordinary parked cars with subtle pumpkin decorations in overcast daylight"
      },
      {
        "slug": "spooky-little-setup",
        "name": "Spooky Little Setup",
        "scene": "An open hatchback with paper bats, a plain orange cloth and a small candy basket"
      },
      {
        "slug": "community-candy-stop",
        "name": "Community Candy Stop",
        "scene": "A simple church parking-lot treat station with a few pumpkins, folding chairs and an open car trunk"
      },
      {
        "slug": "the-submarine-hatchback",
        "name": "The Submarine Hatchback",
        "scene": "Low-angle view of a hatchback decorated as a handmade submarine with cardboard portholes for trunk-or-treat"
      },
      {
        "slug": "dinosaur-dig-tailgate",
        "name": "Dinosaur Dig Tailgate",
        "scene": "Elevated view of a tailgate with a child-friendly pretend fossil dig and a candy basket"
      },
      {
        "slug": "the-tiny-spaceport",
        "name": "The Tiny Spaceport",
        "scene": "Wide eye-level view of a trunk transformed into a homemade rocket station with cardboard planets"
      },
      {
        "slug": "pirate-chest-stop",
        "name": "Pirate Chest Stop",
        "scene": "Ground-level view of an open trunk with a handmade pirate chest, rope and plain treat bags"
      },
      {
        "slug": "a-woodland-library",
        "name": "A Woodland Library",
        "scene": "Side view of a wagon trunk decorated as a woodland reading nook with unlettered books"
      },
      {
        "slug": "the-candy-checkpoint",
        "name": "The Candy Checkpoint",
        "scene": "Overhead view of a volunteer check-in basket with plain wristbands, blank tags and wrapped sweets"
      },
      {
        "slug": "cardboard-castle-car",
        "name": "Cardboard Castle Car",
        "scene": "Low-angle view of a small car with a removable cardboard castle facade and candy hatch"
      },
      {
        "slug": "the-firehouse-truck",
        "name": "The Firehouse Truck",
        "scene": "Wide view of a pickup decorated as a miniature handmade firehouse with toy hoses and treats"
      },
      {
        "slug": "undersea-coral-stop",
        "name": "Undersea Coral Stop",
        "scene": "Eye-level view of an open trunk with original cardboard coral, paper fish and blue ocean fabric"
      },
      {
        "slug": "the-farmstand-van",
        "name": "The Farmstand Van",
        "scene": "Three-quarter view of a van dressed as a harvest farmstand with gourds and wrapped candy"
      },
      {
        "slug": "a-tiny-train-depot",
        "name": "A Tiny Train Depot",
        "scene": "Ground-level view of a trunk with cardboard train wheels and a miniature station treat counter"
      },
      {
        "slug": "the-ice-cream-wagon",
        "name": "The Ice Cream Wagon",
        "scene": "Frontal view of a wagon trunk styled as an unbranded pretend ice-cream stand with paper cones"
      },
      {
        "slug": "parking-lot-welcome",
        "name": "Parking-Lot Welcome",
        "scene": "Elevated wide view of different decorated vehicles in an empty neighborhood lot with a clear walking lane"
      },
      {
        "slug": "the-weather-laboratory",
        "name": "The Weather Laboratory",
        "scene": "Close view of a trunk with handmade weather-station props, cloud shapes and sealed treat bags"
      },
      {
        "slug": "camping-under-the-hatch",
        "name": "Camping Under the Hatch",
        "scene": "Rear wide view of a hatchback with a fabric tent, unlit pretend campfire and candy tin"
      },
      {
        "slug": "the-monster-mouth-car",
        "name": "The Monster Mouth Car",
        "scene": "Low-angle view of a car hatch framed with oversized homemade paper teeth and soft colorful fabric"
      },
      {
        "slug": "a-rainbow-tunnel",
        "name": "A Rainbow Tunnel",
        "scene": "Eye-level view through a cardboard rainbow arch toward a simple open trunk treat station"
      },
      {
        "slug": "the-garden-gnome-truck",
        "name": "The Garden Gnome Truck",
        "scene": "Three-quarter view of a pickup bed styled as a miniature garden with handmade gnomes and plants"
      },
      {
        "slug": "treat-sorting-baskets",
        "name": "Treat Sorting Baskets",
        "scene": "Straight overhead view of varied sealed sweets sorted into simple baskets for community trunk-or-treat"
      },
      {
        "slug": "the-construction-zone",
        "name": "The Construction Zone",
        "scene": "Ground-level view of a trunk decorated with toy diggers, small traffic cones and wrapped treats"
      },
      {
        "slug": "a-hot-air-balloon-car",
        "name": "A Hot-Air Balloon Car",
        "scene": "Wide view of a parked car with a securely attached paper balloon canopy and wicker-style candy basket"
      },
      {
        "slug": "the-little-science-museum",
        "name": "The Little Science Museum",
        "scene": "Eye-level view of a hatchback with safe science props, crystal shapes and a candy bowl"
      },
      {
        "slug": "the-checkered-diner",
        "name": "The Checkered Diner",
        "scene": "Frontal view of a van trunk transformed into an original retro diner with blank menus and treats"
      },
      {
        "slug": "a-beehive-on-wheels",
        "name": "A Beehive on Wheels",
        "scene": "Close view of a trunk with handmade honeycomb cardboard, cheerful paper bees and wrapped candy"
      },
      {
        "slug": "the-jungle-expedition",
        "name": "The Jungle Expedition",
        "scene": "Low-angle view into a wagon trunk with large paper leaves and an original cardboard explorer jeep"
      },
      {
        "slug": "a-drive-in-picture-stop",
        "name": "A Drive-In Picture Stop",
        "scene": "Wide view of a pickup beside a blank portable outdoor screen and trunk-or-treat sweets"
      },
      {
        "slug": "the-lighthouse-hatch",
        "name": "The Lighthouse Hatch",
        "scene": "Three-quarter view of a car hatch decorated as a small handmade lighthouse with a simple lantern"
      },
      {
        "slug": "the-patchwork-quilt-car",
        "name": "The Patchwork Quilt Car",
        "scene": "Eye-level view of a trunk lined with different real patchwork quilts and a soft toy treat basket"
      },
      {
        "slug": "accessible-treat-lane",
        "name": "Accessible Treat Lane",
        "scene": "Wide ground-level view of a clear level route between trunk-or-treat cars, without readable signs"
      },
      {
        "slug": "the-dragon-s-cave",
        "name": "The Dragon's Cave",
        "scene": "Low-angle view into a fabric-lined trunk with a friendly original cardboard dragon and candy chest"
      },
      {
        "slug": "a-miniature-music-stage",
        "name": "A Miniature Music Stage",
        "scene": "Frontal view of a van trunk holding a miniature stage with toy instruments and paper stars"
      },
      {
        "slug": "the-pumpkin-bowling-stop",
        "name": "The Pumpkin Bowling Stop",
        "scene": "Elevated view of small pumpkin-shaped bowling pins beside a truck's open treat tailgate"
      },
      {
        "slug": "a-weathered-western-wagon",
        "name": "A Weathered Western Wagon",
        "scene": "Three-quarter view of a vehicle styled as an original old-west wagon with fabric bunting and treats"
      },
      {
        "slug": "the-arctic-expedition",
        "name": "The Arctic Expedition",
        "scene": "Eye-level view of a hatchback with cardboard icebergs, handmade polar animals and an unbranded cooler"
      },
      {
        "slug": "a-paper-butterfly-garden",
        "name": "A Paper Butterfly Garden",
        "scene": "Close side view of colorful paper butterflies suspended inside a plant-lined trunk treat display"
      },
      {
        "slug": "the-robot-repair-bay",
        "name": "The Robot Repair Bay",
        "scene": "Frontal view of a trunk with original cardboard robots, toy tools and plain treat containers"
      },
      {
        "slug": "the-community-photo-corner",
        "name": "The Community Photo Corner",
        "scene": "Wide view of a blank autumn photo backdrop and decorated vehicle at a trunk-or-treat gathering"
      },
      {
        "slug": "a-giant-book-hatch",
        "name": "A Giant Book Hatch",
        "scene": "Low-angle view of a trunk framed as an oversized handmade open book without readable writing"
      },
      {
        "slug": "the-secret-agent-car",
        "name": "The Secret Agent Car",
        "scene": "Three-quarter view of a car with handmade spy-gadget props and a plain metal treat case"
      },
      {
        "slug": "the-friendly-spider-web",
        "name": "The Friendly Spider Web",
        "scene": "Macro view of a soft yarn web and handmade paper spider attached to a trunk tailgate, wrapped candy behind"
      },
      {
        "slug": "a-board-game-tailgate",
        "name": "A Board-Game Tailgate",
        "scene": "Straight overhead view of oversized homemade board-game pieces and a treat bowl on a tailgate"
      },
      {
        "slug": "the-miniature-carnival",
        "name": "The Miniature Carnival",
        "scene": "Wide view of a hatchback with handmade carnival booths, fabric flags and wrapped sweets"
      },
      {
        "slug": "the-sunflower-truck",
        "name": "The Sunflower Truck",
        "scene": "Low-angle view of a pickup bed framed by large original paper sunflowers and a treat basket"
      },
      {
        "slug": "the-teddy-bear-clinic",
        "name": "The Teddy Bear Clinic",
        "scene": "Eye-level view of a trunk dressed as a pretend toy clinic with teddy bears and candy bags"
      },
      {
        "slug": "a-car-wash-of-color",
        "name": "A Car Wash of Color",
        "scene": "Frontal view of a van hatch with hanging colorful fabric strips as a pretend car wash"
      },
      {
        "slug": "the-pirate-ship-mast",
        "name": "The Pirate Ship Mast",
        "scene": "Wide side view of a truck with a low handmade pirate-ship facade and candy chest"
      },
      {
        "slug": "evening-treat-lanterns",
        "name": "Evening Treat Lanterns",
        "scene": "Ground-level view of lanterns marking a clear route between different trunk-or-treat vehicles at dusk"
      },
      {
        "slug": "the-space-rover-station",
        "name": "The Space Rover Station",
        "scene": "Elevated view of a trunk with an original cardboard lunar rover and textured pretend moon rocks"
      },
      {
        "slug": "the-thank-you-basket",
        "name": "The Thank-You Basket",
        "scene": "Close view of plain unlettered cards and a snack basket at a trunk-or-treat volunteer rest station"
      },
      {
        "slug": "last-lanterns-after-dark",
        "name": "Last Lanterns After Dark",
        "scene": "Wide natural-night view of one decorated car with warm practical lanterns after a quiet trunk-or-treat evening"
      }
    ]
  },
  {
    "id": "fall-harvest",
    "name": "Fall Harvest",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        9,
        1
      ],
      "end": [
        11,
        15
      ]
    },
    "palettes": [
      "cider",
      "olive",
      "terracotta"
    ],
    "purpose": "celebration",
    "aliases": "fall harvest autumn pumpkin patch apple picking hayride festival",
    "designs": [
      {
        "slug": "apple-orchard",
        "name": "Apple Orchard",
        "scene": "An ordinary apple orchard with a half-filled picking basket under a cloudy sky"
      },
      {
        "slug": "pumpkin-patch",
        "name": "Pumpkin Patch",
        "scene": "Uneven pumpkins on muddy ground with tangled vines, soft autumn daylight"
      },
      {
        "slug": "harvest-table",
        "name": "Harvest Table",
        "scene": "A worn farm table with squash, apples and a plain linen cloth"
      },
      {
        "slug": "hayride-afternoon",
        "name": "Hayride Afternoon",
        "scene": "A simple hay wagon parked beside a farm shed, no decorative staging"
      },
      {
        "slug": "market-morning",
        "name": "Market Morning",
        "scene": "A modest farm stand with seasonal produce in wooden crates, no labels"
      },
      {
        "slug": "autumn-garden",
        "name": "Autumn Garden",
        "scene": "A real backyard garden with drying sunflowers and fall vegetables"
      },
      {
        "slug": "cider-kitchen",
        "name": "Cider Kitchen",
        "scene": "A pitcher of apple cider and homemade doughnuts on a kitchen table"
      },
      {
        "slug": "country-porch",
        "name": "Country Porch",
        "scene": "A weathered porch with one pumpkin and an ordinary pot of mums"
      },
      {
        "slug": "leaf-walk",
        "name": "Leaf Walk",
        "scene": "A quiet woodland path with irregular fallen autumn leaves"
      },
      {
        "slug": "farm-supper",
        "name": "Farm Supper",
        "scene": "A modest outdoor supper table beside a vegetable garden in soft daylight"
      },
      {
        "slug": "the-red-pear-orchard",
        "name": "The Red Pear Orchard",
        "scene": "Wide view down an ordinary orchard row with ripe red pears and a few harvesting baskets"
      },
      {
        "slug": "beetroot-from-the-soil",
        "name": "Beetroot from the Soil",
        "scene": "Ground-level close view of fresh beetroot lifted from dark soil with leaves attached"
      },
      {
        "slug": "the-walnut-tree",
        "name": "The Walnut Tree",
        "scene": "Low-angle view into a mature walnut tree with naturally split green husks in autumn"
      },
      {
        "slug": "a-quiet-farm-silo",
        "name": "A Quiet Farm Silo",
        "scene": "Wide architectural view of a modest silo and harvest fields beneath an overcast autumn sky"
      },
      {
        "slug": "carrots-at-the-wash-trough",
        "name": "Carrots at the Wash Trough",
        "scene": "Overhead view of muddy freshly pulled carrots beside a simple outdoor rinsing trough"
      },
      {
        "slug": "a-basket-of-chestnuts",
        "name": "A Basket of Chestnuts",
        "scene": "Macro view of chestnuts in split spiny husks resting on fallen leaves"
      },
      {
        "slug": "the-apple-press",
        "name": "The Apple Press",
        "scene": "Eye-level view of a traditional cider press beside crates of uneven orchard apples"
      },
      {
        "slug": "rows-of-drying-beans",
        "name": "Rows of Drying Beans",
        "scene": "Side view of mature bean pods drying from a simple farm-shed rail"
      },
      {
        "slug": "the-sunflower-field",
        "name": "The Sunflower Field",
        "scene": "Elevated wide view of spent sunflower heads across a real late-season field"
      },
      {
        "slug": "a-harvest-moon",
        "name": "A Harvest Moon",
        "scene": "Wide natural-night view of a full moon above an ordinary farm roof and quiet autumn fields"
      },
      {
        "slug": "the-potato-fork",
        "name": "The Potato Fork",
        "scene": "Ground-level view of a digging fork beside freshly lifted potatoes in an allotment bed"
      },
      {
        "slug": "squash-at-the-barn-door",
        "name": "Squash at the Barn Door",
        "scene": "Frontal view of different naturally shaped winter squash beside an open weathered barn door"
      },
      {
        "slug": "the-autumn-dahlia",
        "name": "The Autumn Dahlia",
        "scene": "Botanical macro view of one late dahlia with imperfect petals and a dark garden behind"
      },
      {
        "slug": "corn-in-the-granary",
        "name": "Corn in the Granary",
        "scene": "Wide view of dried corn ears hanging inside a modest open farm granary"
      },
      {
        "slug": "the-cranberry-bog",
        "name": "The Cranberry Bog",
        "scene": "High wide view of a real cranberry bog with red fruit gathered on shallow water"
      },
      {
        "slug": "a-farmstand-scale",
        "name": "A Farmstand Scale",
        "scene": "Close view of an old produce scale holding late tomatoes at a small unlettered farmstand"
      },
      {
        "slug": "rainy-orchard-lane",
        "name": "Rainy Orchard Lane",
        "scene": "Ground-level view of wet fallen apples along a real orchard lane after autumn rain"
      },
      {
        "slug": "the-hay-bale-spiral",
        "name": "The Hay Bale Spiral",
        "scene": "Elevated view of round hay bales lying across an open harvested field"
      },
      {
        "slug": "a-basket-of-figs",
        "name": "A Basket of Figs",
        "scene": "Macro view of ripe figs with one naturally split fruit in a shallow harvest basket"
      },
      {
        "slug": "the-root-cellar-steps",
        "name": "The Root Cellar Steps",
        "scene": "Low-angle view down stone steps into a simple root cellar with vegetable crates"
      },
      {
        "slug": "pumpkins-on-the-vine",
        "name": "Pumpkins on the Vine",
        "scene": "Ground-level view of uneven pumpkins still attached to tangled vines in a muddy patch"
      },
      {
        "slug": "the-greenhouse-grape",
        "name": "The Greenhouse Grape",
        "scene": "Low-angle botanical view of ripe grape clusters beneath a plain greenhouse roof"
      },
      {
        "slug": "harvest-festival-bandstand",
        "name": "Harvest Festival Bandstand",
        "scene": "Wide view of an empty small-town bandstand with restrained autumn leaves and harvest baskets"
      },
      {
        "slug": "the-seed-saving-envelopes",
        "name": "The Seed Saving Envelopes",
        "scene": "Overhead view of dried seed pods and unlettered paper envelopes on a potting bench"
      },
      {
        "slug": "a-harvest-basket-overflowing",
        "name": "A Harvest Basket Overflowing",
        "scene": "Close view of an unadorned woven basket overflowing with genuinely varied seasonal vegetables"
      },
      {
        "slug": "the-barley-stubble",
        "name": "The Barley Stubble",
        "scene": "Wide view of a harvested barley field with neat stubble lines and a distant farm gate"
      },
      {
        "slug": "green-tomatoes-in-the-cold-frame",
        "name": "Green Tomatoes in the Cold Frame",
        "scene": "Elevated view into a simple cold frame holding the season's last green tomatoes"
      },
      {
        "slug": "the-farmyard-goose",
        "name": "The Farmyard Goose",
        "scene": "Ground-level view of a healthy goose beside a farmhouse with autumn produce crates distant behind"
      },
      {
        "slug": "a-country-grain-mill",
        "name": "A Country Grain Mill",
        "scene": "Wide architectural view of a modest rural grain mill beside a slow autumn stream"
      },
      {
        "slug": "the-plum-harvest",
        "name": "The Plum Harvest",
        "scene": "Eye-level view of ripe plums on a low living branch above a partly filled picking pail"
      },
      {
        "slug": "cider-doughnuts",
        "name": "Cider Doughnuts",
        "scene": "Macro view of imperfect fresh cider doughnuts cooling on a bakery wire rack"
      },
      {
        "slug": "the-wooden-orchard-ladder",
        "name": "The Wooden Orchard Ladder",
        "scene": "Low-angle view of an old ladder leaning safely into a loaded apple tree"
      },
      {
        "slug": "a-farm-pond-reflection",
        "name": "A Farm Pond Reflection",
        "scene": "Wide view of a quiet farm pond reflecting autumn trees and a small harvest shed"
      },
      {
        "slug": "the-onion-braids",
        "name": "The Onion Braids",
        "scene": "Close view of naturally irregular onion braids hanging in an airy farm doorway"
      },
      {
        "slug": "a-field-of-buckwheat",
        "name": "A Field of Buckwheat",
        "scene": "Wide botanical view of mature buckwheat with a few late flowers and distant autumn hills"
      },
      {
        "slug": "the-pumpkin-weigh-in",
        "name": "The Pumpkin Weigh-In",
        "scene": "Overhead view of a large uneven pumpkin on a plain farm platform scale"
      },
      {
        "slug": "a-basket-of-quince",
        "name": "A Basket of Quince",
        "scene": "Close view of fuzzy yellow quince piled in a basket beside a garden wall"
      },
      {
        "slug": "the-harvest-wagon-trail",
        "name": "The Harvest Wagon Trail",
        "scene": "Wide ground-level view of wagon-wheel tracks across an autumn field toward a barn"
      },
      {
        "slug": "frost-on-kale",
        "name": "Frost on Kale",
        "scene": "Botanical macro view of delicate natural frost coating a living kale leaf"
      },
      {
        "slug": "a-farm-supper-pavilion",
        "name": "A Farm Supper Pavilion",
        "scene": "Wide view of an empty farm shelter prepared with modest autumn supper seating"
      },
      {
        "slug": "the-hazelnut-branch",
        "name": "The Hazelnut Branch",
        "scene": "Close botanical view of hazelnuts clustered on a living branch with yellowing leaves"
      },
      {
        "slug": "the-garden-composter",
        "name": "The Garden Composter",
        "scene": "Eye-level view of a wooden compost bay filled with autumn trimmings beside harvested beds"
      },
      {
        "slug": "a-harvest-river-barge",
        "name": "A Harvest River Barge",
        "scene": "Wide view of a small working river barge beside a modest grain-loading dock in autumn"
      },
      {
        "slug": "pomegranate-split",
        "name": "Pomegranate Split",
        "scene": "Macro view of an open pomegranate revealing irregular ruby seeds on cool stone"
      },
      {
        "slug": "the-straw-hat-hook",
        "name": "The Straw Hat Hook",
        "scene": "Close view of a worn harvest hat and gloves inside a farm-shed doorway"
      },
      {
        "slug": "an-autumn-allotment",
        "name": "An Autumn Allotment",
        "scene": "Elevated wide view of neighboring vegetable plots with distinct late-season harvest beds"
      },
      {
        "slug": "the-persimmon-tree",
        "name": "The Persimmon Tree",
        "scene": "Low-angle view of bright persimmons remaining on a nearly bare tree in autumn light"
      },
      {
        "slug": "the-kettle-over-the-hearth",
        "name": "The Kettle over the Hearth",
        "scene": "Interior side view of a farmhouse hearth with a plain kettle after a harvest day"
      },
      {
        "slug": "leaf-filled-wheelbarrow",
        "name": "Leaf-Filled Wheelbarrow",
        "scene": "Ground-level view of a worn wheelbarrow filled with differently colored leaves beside a farm path"
      },
      {
        "slug": "the-first-winter-stack",
        "name": "The First Winter Stack",
        "scene": "Wide dusk view of newly stacked firewood against a barn with harvested fields beyond"
      }
    ]
  },
  {
    "id": "friendsgiving",
    "name": "Friendsgiving",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        11,
        1
      ],
      "end": [
        11,
        30
      ]
    },
    "palettes": [
      "cider",
      "plum",
      "terracotta"
    ],
    "purpose": "potluck",
    "aliases": "Friendsgiving friends November potluck thanks",
    "designs": [
      {
        "slug": "bring-a-dish",
        "name": "Bring a Dish",
        "scene": "Covered homemade dishes on a lived-in kitchen counter ready for a potluck"
      },
      {
        "slug": "apartment-supper",
        "name": "Apartment Supper",
        "scene": "A small apartment dining table with mismatched chairs and simple autumn flowers"
      },
      {
        "slug": "pie-and-coffee",
        "name": "Pie and Coffee",
        "scene": "Homemade pie slices and mismatched mugs on a wooden table"
      },
      {
        "slug": "long-table",
        "name": "Long Table",
        "scene": "Two ordinary tables pushed together with different chairs for a friendly dinner"
      },
      {
        "slug": "shared-kitchen",
        "name": "Shared Kitchen",
        "scene": "A busy-looking but empty home kitchen with mixing bowls and serving dishes"
      },
      {
        "slug": "autumn-picnic",
        "name": "Autumn Picnic",
        "scene": "A simple fall picnic blanket with homemade dishes and a thermos"
      },
      {
        "slug": "soup-night",
        "name": "Soup Night",
        "scene": "A large pot of soup, bread and plain bowls on a dining table"
      },
      {
        "slug": "cozy-gathering",
        "name": "Cozy Gathering",
        "scene": "A modest living room with snacks on a low table and extra floor cushions"
      },
      {
        "slug": "garden-potluck",
        "name": "Garden Potluck",
        "scene": "Folding tables with everyday dishes in a small autumn garden"
      },
      {
        "slug": "leftover-brunch",
        "name": "Leftover Brunch",
        "scene": "A relaxed brunch table with bread, fruit and coffee in natural daylight"
      },
      {
        "slug": "the-extra-door-key",
        "name": "The Extra Door Key",
        "scene": "Macro view of a spare key tied to a plain autumn ribbon beside a welcoming apartment door"
      },
      {
        "slug": "rooftop-friendsgiving",
        "name": "Rooftop Friendsgiving",
        "scene": "Wide view of a modest city rooftop prepared with mismatched seats and autumn supper lights"
      },
      {
        "slug": "an-arriving-potluck-wagon",
        "name": "An Arriving Potluck Wagon",
        "scene": "Ground-level view of a small handcart carrying covered homemade dishes outside a friend's building"
      },
      {
        "slug": "the-living-room-record-player",
        "name": "The Living-Room Record Player",
        "scene": "Eye-level view of a record player and unlettered album sleeves ready for a Friendsgiving evening"
      },
      {
        "slug": "chairs-from-every-room",
        "name": "Chairs from Every Room",
        "scene": "Elevated view of genuinely different chairs gathered around a modest apartment dining space"
      },
      {
        "slug": "a-paper-chain-of-thanks",
        "name": "A Paper Chain of Thanks",
        "scene": "Close view of an irregular autumn paper chain hanging across a window without readable writing"
      },
      {
        "slug": "the-autumn-beach-blanket",
        "name": "The Autumn Beach Blanket",
        "scene": "Wide coastal view of an empty blanket picnic with covered dishes for a seaside Friendsgiving"
      },
      {
        "slug": "roasted-cauliflower-centerpiece",
        "name": "Roasted Cauliflower Centerpiece",
        "scene": "Overhead close view of a whole roasted cauliflower with herbs on a simple ceramic platter"
      },
      {
        "slug": "a-coat-hook-gathering",
        "name": "A Coat Hook Gathering",
        "scene": "Eye-level view of varied coats and scarves waiting on hooks inside a welcoming Friendsgiving entryway"
      },
      {
        "slug": "the-puzzle-corner",
        "name": "The Puzzle Corner",
        "scene": "Straight overhead view of a partly finished unbranded jigsaw puzzle and mugs on a living-room floor"
      },
      {
        "slug": "friendsgiving-at-the-boathouse",
        "name": "Friendsgiving at the Boathouse",
        "scene": "Wide view of an empty lakeside boathouse prepared for a small autumn supper gathering"
      },
      {
        "slug": "a-guest-s-bouquet",
        "name": "A Guest's Bouquet",
        "scene": "Close view of an imperfect hand-tied autumn bouquet tucked into a reusable visiting bag"
      },
      {
        "slug": "the-shared-playlist",
        "name": "The Shared Playlist",
        "scene": "Eye-level view of an unbranded small speaker beside scattered unlettered record sleeves and a soft lamp"
      },
      {
        "slug": "apple-galette-edges",
        "name": "Apple Galette Edges",
        "scene": "Macro view of an uneven homemade apple galette cooling on a kitchen wire rack"
      },
      {
        "slug": "a-courtyard-string-of-lights",
        "name": "A Courtyard String of Lights",
        "scene": "Low-angle view of restrained lights crossing an ordinary apartment courtyard prepared for Friendsgiving"
      },
      {
        "slug": "the-game-night-basket",
        "name": "The Game Night Basket",
        "scene": "Overhead view of plain playing cards, dice and simple game pieces in a wicker basket"
      },
      {
        "slug": "a-welcome-at-the-bus-stop",
        "name": "A Welcome at the Bus Stop",
        "scene": "Wide view of a covered dish in a tote resting beside an empty urban bus-stop bench"
      },
      {
        "slug": "the-herb-butter-dish",
        "name": "The Herb Butter Dish",
        "scene": "Macro view of herb-flecked butter in a small handmade dish beside torn fresh bread"
      },
      {
        "slug": "floor-cushions-for-everyone",
        "name": "Floor Cushions for Everyone",
        "scene": "Elevated view of a colorful floor-cushion circle prepared in a small Friendsgiving living room"
      },
      {
        "slug": "the-garden-fire-pit",
        "name": "The Garden Fire Pit",
        "scene": "Wide natural-dusk view of an unlit garden fire pit with empty chairs and folded autumn blankets"
      },
      {
        "slug": "a-patchwork-napkin-basket",
        "name": "A Patchwork Napkin Basket",
        "scene": "Close view of different cloth napkins collected in a basket on a modest dining sideboard"
      },
      {
        "slug": "friendsgiving-in-the-greenhouse",
        "name": "Friendsgiving in the Greenhouse",
        "scene": "Wide architectural view of a real small greenhouse arranged for an intimate autumn supper"
      },
      {
        "slug": "the-casserole-carrier",
        "name": "The Casserole Carrier",
        "scene": "Ground-level close view of a quilted casserole carrier beside muddy visiting boots at a doorway"
      },
      {
        "slug": "a-single-polaroid-camera",
        "name": "A Single Polaroid Camera",
        "scene": "Overhead view of an unbranded instant camera and blank photo backs prepared for a gathering"
      },
      {
        "slug": "the-community-room-window",
        "name": "The Community Room Window",
        "scene": "Interior wide view of an apartment common room with autumn branches and ready supper seating"
      },
      {
        "slug": "roasted-beet-salad",
        "name": "Roasted Beet Salad",
        "scene": "Overhead view of roasted beetroot, citrus and greens in one generous shared serving bowl"
      },
      {
        "slug": "the-dog-s-place",
        "name": "The Dog's Place",
        "scene": "Ground-level view of a relaxed dog beside a Friendsgiving coat pile and visiting bags"
      },
      {
        "slug": "the-neighborhood-bridge-walk",
        "name": "The Neighborhood Bridge Walk",
        "scene": "Wide view of an empty autumn footbridge with a picnic tote beside the rail"
      },
      {
        "slug": "sourdough-from-a-friend",
        "name": "Sourdough from a Friend",
        "scene": "Close view of a fresh handmade sourdough loaf partly unwrapped from a cotton cloth"
      },
      {
        "slug": "friendsgiving-film-corner",
        "name": "Friendsgiving Film Corner",
        "scene": "Wide view of a modest living room with a blank projection screen and extra floor cushions"
      },
      {
        "slug": "a-line-of-borrowed-mugs",
        "name": "A Line of Borrowed Mugs",
        "scene": "Eye-level view of clearly different mugs on a small sideboard ready for a shared evening"
      },
      {
        "slug": "the-balcony-herb-box",
        "name": "The Balcony Herb Box",
        "scene": "Botanical close-up of living rosemary and sage on a city balcony beside a covered potluck dish"
      },
      {
        "slug": "candles-in-the-window",
        "name": "Candles in the Window",
        "scene": "Side view of a few plain candles reflected in a rainy apartment window at Friendsgiving"
      },
      {
        "slug": "an-autumn-cheese-board",
        "name": "An Autumn Cheese Board",
        "scene": "Straight overhead view of varied cheeses, pears and crackers on a simple stone serving slab"
      },
      {
        "slug": "the-hand-me-down-sofa",
        "name": "The Hand-Me-Down Sofa",
        "scene": "Wide view of a lived-in sofa with colorful blankets and an extra chair for Friendsgiving"
      },
      {
        "slug": "an-open-recipe-notebook",
        "name": "An Open Recipe Notebook",
        "scene": "Close view of an unlettered recipe notebook with food splashes and a wooden spoon on a counter"
      },
      {
        "slug": "a-barn-loft-supper",
        "name": "A Barn Loft Supper",
        "scene": "Wide view of an empty modest barn loft prepared for a friends' autumn potluck"
      },
      {
        "slug": "the-thankful-jar",
        "name": "The Thankful Jar",
        "scene": "Macro view of folded plain paper slips inside a clear jar beside a small autumn flower"
      },
      {
        "slug": "baked-mushroom-pie",
        "name": "Baked Mushroom Pie",
        "scene": "Overhead view of a homemade mushroom pie with an imperfect crust in a plain ceramic dish"
      },
      {
        "slug": "friendsgiving-by-the-river",
        "name": "Friendsgiving by the River",
        "scene": "Elevated wide view of a riverside picnic shelter with modest autumn supper supplies"
      },
      {
        "slug": "the-umbrella-stand",
        "name": "The Umbrella Stand",
        "scene": "Ground-level view of several wet umbrellas collected just inside a warm gathering doorway"
      },
      {
        "slug": "a-stack-of-borrowed-plates",
        "name": "A Stack of Borrowed Plates",
        "scene": "Close view of mismatched ceramic plates ready on a narrow apartment sideboard"
      },
      {
        "slug": "the-acoustic-guitar",
        "name": "The Acoustic Guitar",
        "scene": "Eye-level view of an acoustic guitar leaning beside empty gathering chairs and a warm lamp"
      },
      {
        "slug": "cranberry-spritzer-glasses",
        "name": "Cranberry Spritzer Glasses",
        "scene": "Tight side view of two unbranded cranberry spritzers with citrus slices beside an open courtyard window"
      },
      {
        "slug": "a-cozy-attic-gathering",
        "name": "A Cozy Attic Gathering",
        "scene": "Wide architectural view of a small attic room prepared with blankets and low supper seating"
      },
      {
        "slug": "the-take-home-containers",
        "name": "The Take-Home Containers",
        "scene": "Overhead view of clean reusable leftover containers with plain lids beside serving spoons"
      },
      {
        "slug": "shoes-beside-the-radiator",
        "name": "Shoes beside the Radiator",
        "scene": "Ground-level view of varied visiting shoes drying beside a radiator on a rainy Friendsgiving evening"
      },
      {
        "slug": "the-outdoor-pizza-oven",
        "name": "The Outdoor Pizza Oven",
        "scene": "Wide view of a modest backyard pizza oven and fresh prepared dough for a friends' autumn gathering"
      },
      {
        "slug": "last-slices-of-pumpkin-bread",
        "name": "Last Slices of Pumpkin Bread",
        "scene": "Macro view of irregular pumpkin-bread slices with visible crumbs in a plain serving tin"
      },
      {
        "slug": "city-lights-after-supper",
        "name": "City Lights After Supper",
        "scene": "Wide night view of an apartment balcony with empty mugs and quiet city lights beyond"
      }
    ]
  },
  {
    "id": "summer-camp",
    "name": "Summer Camps",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        6,
        1
      ],
      "end": [
        8,
        31
      ]
    },
    "palettes": [
      "moss",
      "marine",
      "ochre"
    ],
    "purpose": "volunteers",
    "aliases": "summer camps day camp camp registration June July August",
    "designs": [
      {
        "slug": "lakeside-camp",
        "name": "Lakeside Camp",
        "scene": "A few ordinary canoes pulled onto a sandy lakeshore beside a simple camp dock"
      },
      {
        "slug": "nature-explorers",
        "name": "Nature Explorers",
        "scene": "A magnifying glass, pinecones and a plain notebook on a woodland picnic table"
      },
      {
        "slug": "art-camp",
        "name": "Art Camp",
        "scene": "Used paintbrushes, water jars and unfinished paper crafts on an outdoor camp table"
      },
      {
        "slug": "cabin-morning",
        "name": "Cabin Morning",
        "scene": "A modest wooden summer-camp cabin in soft morning daylight"
      },
      {
        "slug": "sports-camp",
        "name": "Sports Camp",
        "scene": "Plain balls, cones and water bottles beside an ordinary grassy playing field"
      },
      {
        "slug": "trail-camp",
        "name": "Trail Camp",
        "scene": "A simple daypack and walking shoes beside a wooded camp trail"
      },
      {
        "slug": "science-camp",
        "name": "Science Camp",
        "scene": "Simple unbranded magnifiers, plant pots and a small safe science activity on a picnic table"
      },
      {
        "slug": "music-camp",
        "name": "Music Camp",
        "scene": "Acoustic guitars and a small hand drum on chairs in a plain camp shelter"
      },
      {
        "slug": "garden-camp",
        "name": "Garden Camp",
        "scene": "Small watering cans and hand tools beside a vegetable garden bed"
      },
      {
        "slug": "campfire-circle",
        "name": "Campfire Circle",
        "scene": "An unlit campfire ring with ordinary logs and simple benches in a wooded clearing"
      },
      {
        "slug": "the-canoe-launch",
        "name": "The Canoe Launch",
        "scene": "Wide low-angle view of ordinary canoes pulled beside a real summer-camp lake landing"
      },
      {
        "slug": "a-rope-bridge",
        "name": "A Rope Bridge",
        "scene": "Ground-level view across an empty wooden rope bridge on a summer-camp woodland trail"
      },
      {
        "slug": "the-archery-range",
        "name": "The Archery Range",
        "scene": "Wide view of an empty supervised-style camp archery lane with bows stored safely on a rack"
      },
      {
        "slug": "a-pond-dipping-net",
        "name": "A Pond Dipping Net",
        "scene": "Close view of a fine pond-study net and clear observation jar beside living reeds"
      },
      {
        "slug": "the-climbing-wall",
        "name": "The Climbing Wall",
        "scene": "Low-angle view of an empty outdoor camp climbing wall with colorful holds and secured ropes"
      },
      {
        "slug": "camp-telescope-night",
        "name": "Camp Telescope Night",
        "scene": "Wide natural-night view of a small telescope in a summer-camp clearing beneath visible stars"
      },
      {
        "slug": "the-tie-dye-line",
        "name": "The Tie-Dye Line",
        "scene": "Eye-level view of different tie-dyed camp shirts drying from a line between trees"
      },
      {
        "slug": "an-orienteering-compass",
        "name": "An Orienteering Compass",
        "scene": "Overhead macro view of a compass and an unlettered folded trail map on a flat woodland rock"
      },
      {
        "slug": "the-cabin-bunks",
        "name": "The Cabin Bunks",
        "scene": "Wide interior view of simple empty summer-camp bunk beds with different neatly rolled sleeping bags"
      },
      {
        "slug": "a-kayak-paddle-drip",
        "name": "A Kayak Paddle Drip",
        "scene": "Close side view of water dripping from a kayak paddle beside a sunlit camp dock"
      },
      {
        "slug": "the-pottery-wheel",
        "name": "The Pottery Wheel",
        "scene": "Eye-level view of a small pottery wheel with unfinished clay in an open-sided camp art shelter"
      },
      {
        "slug": "a-forest-insect-hotel",
        "name": "A Forest Insect Hotel",
        "scene": "Macro view of a small handmade insect hotel attached to a tree along a camp nature trail"
      },
      {
        "slug": "the-lake-swim-float",
        "name": "The Lake Swim Float",
        "scene": "Wide view of an empty floating swim platform inside a clearly bounded summer-camp lake area"
      },
      {
        "slug": "a-camp-theatre",
        "name": "A Camp Theatre",
        "scene": "Wide architectural view of a modest woodland amphitheater with an empty stage and log benches"
      },
      {
        "slug": "the-friendship-bracelets",
        "name": "The Friendship Bracelets",
        "scene": "Overhead view of different unfinished friendship bracelets and colorful threads on a canvas craft mat"
      },
      {
        "slug": "mountain-trail-camp",
        "name": "Mountain Trail Camp",
        "scene": "Wide view of a few modest tents on an ordinary grassy mountain campsite"
      },
      {
        "slug": "the-weather-station",
        "name": "The Weather Station",
        "scene": "Low-angle view of a simple camp weather station with a wind vane and rain gauge"
      },
      {
        "slug": "a-horse-riding-ring",
        "name": "A Horse-Riding Ring",
        "scene": "Wide view of an empty camp riding ring with a saddle on a nearby rail"
      },
      {
        "slug": "the-outdoor-microscope",
        "name": "The Outdoor Microscope",
        "scene": "Close view of a simple microscope and leaf samples inside an open summer-camp science pavilion"
      },
      {
        "slug": "a-disc-golf-basket",
        "name": "A Disc Golf Basket",
        "scene": "Ground-level view of a disc-golf basket among trees on a modest summer-camp course"
      },
      {
        "slug": "the-hammock-grove",
        "name": "The Hammock Grove",
        "scene": "Wide view of two empty fabric hammocks hanging between mature trees at summer camp"
      },
      {
        "slug": "camp-bread-on-a-stick",
        "name": "Camp Bread on a Stick",
        "scene": "Close view of simple twist bread resting above a small camp cooking fire without people"
      },
      {
        "slug": "the-rock-collection",
        "name": "The Rock Collection",
        "scene": "Straight overhead view of genuinely different natural rocks arranged in a plain camp specimen tray"
      },
      {
        "slug": "a-sailing-dinghy",
        "name": "A Sailing Dinghy",
        "scene": "Wide view of a small unbranded sailing dinghy moored beside a summer-camp dock"
      },
      {
        "slug": "the-zipline-platform",
        "name": "The Zipline Platform",
        "scene": "Low-angle architectural view of an empty camp zipline platform among tall trees"
      },
      {
        "slug": "a-camp-garden-watering-can",
        "name": "A Camp Garden Watering Can",
        "scene": "Ground-level view of small watering cans beside living vegetables in a summer-camp garden"
      },
      {
        "slug": "the-puppet-theatre",
        "name": "The Puppet Theatre",
        "scene": "Eye-level view of a handmade fabric puppet stage with original simple puppets in a camp lodge"
      },
      {
        "slug": "sun-prints-drying",
        "name": "Sun Prints Drying",
        "scene": "Overhead view of blue botanical sun prints drying on a canvas mat outside a camp shelter"
      },
      {
        "slug": "the-basketball-court",
        "name": "The Basketball Court",
        "scene": "Wide view of an empty outdoor camp basketball court bordered by pine trees"
      },
      {
        "slug": "a-painted-birdhouse",
        "name": "A Painted Birdhouse",
        "scene": "Macro view of a single handmade painted birdhouse drying from a tree branch at camp"
      },
      {
        "slug": "the-camp-kitchen-hatch",
        "name": "The Camp Kitchen Hatch",
        "scene": "Eye-level view through an open camp kitchen hatch toward clean serving trays and fresh fruit"
      },
      {
        "slug": "a-woodland-balance-beam",
        "name": "A Woodland Balance Beam",
        "scene": "Ground-level view along an empty log balance trail in a summer-camp forest"
      },
      {
        "slug": "the-campfire-story-circle",
        "name": "The Campfire Story Circle",
        "scene": "Wide natural-dusk view of a modest lit campfire ring with empty benches and a storytelling chair"
      },
      {
        "slug": "a-lake-life-specimen-tray",
        "name": "A Lake-Life Specimen Tray",
        "scene": "Overhead view of a shallow pond-observation tray with water plants and tiny natural aquatic life"
      },
      {
        "slug": "the-volleyball-net",
        "name": "The Volleyball Net",
        "scene": "Wide low-angle view of an empty camp volleyball net stretched across a sandy woodland clearing"
      },
      {
        "slug": "a-knotted-rope-lesson",
        "name": "A Knotted Rope Lesson",
        "scene": "Macro view of several different practice knots attached to a plain training board"
      },
      {
        "slug": "the-music-cabin",
        "name": "The Music Cabin",
        "scene": "Wide interior view of a modest camp music cabin with a drum, acoustic guitar and empty stools"
      },
      {
        "slug": "a-butterfly-meadow",
        "name": "A Butterfly Meadow",
        "scene": "Ground-level botanical view of real butterflies among native flowers beside a camp trail"
      },
      {
        "slug": "the-trail-lunch-pack",
        "name": "The Trail Lunch Pack",
        "scene": "Overhead view inside an open unbranded daypack with a wrapped lunch, water bottle and sunhat"
      },
      {
        "slug": "camp-observatory-roof",
        "name": "Camp Observatory Roof",
        "scene": "Low-angle architectural view of a simple small camp observatory shelter against blue-hour sky"
      },
      {
        "slug": "a-woodcarving-bench",
        "name": "A Woodcarving Bench",
        "scene": "Close view of a partly carved simple wooden spoon and supervised-craft tools on a camp bench"
      },
      {
        "slug": "the-low-ropes-course",
        "name": "The Low Ropes Course",
        "scene": "Wide view of an empty low ropes course with secured elements among camp trees"
      },
      {
        "slug": "a-rainy-cabin-porch",
        "name": "A Rainy Cabin Porch",
        "scene": "Eye-level view of rain beyond a camp cabin porch with lined-up boots and a folded board game"
      },
      {
        "slug": "the-field-microscope-slides",
        "name": "The Field Microscope Slides",
        "scene": "Macro view of plant slides and a magnifying lens in a simple unmarked science kit"
      },
      {
        "slug": "a-camp-bicycle-fleet",
        "name": "A Camp Bicycle Fleet",
        "scene": "Wide elevated view of different plain camp bicycles lined beside a rustic equipment shed"
      },
      {
        "slug": "the-loom-in-the-shade",
        "name": "The Loom in the Shade",
        "scene": "Close view of a small weaving loom with colorful yarn in a shaded summer-camp craft area"
      },
      {
        "slug": "an-outdoor-movie-night",
        "name": "An Outdoor Movie Night",
        "scene": "Wide natural-night view of an empty camp clearing with a blank film screen and simple blankets"
      },
      {
        "slug": "the-rowing-oars",
        "name": "The Rowing Oars",
        "scene": "Overhead view of two wooden rowing oars across an empty camp rowboat at the dock"
      },
      {
        "slug": "a-woodland-reading-nest",
        "name": "A Woodland Reading Nest",
        "scene": "Eye-level view of an empty camp reading nook with cushions and unlettered closed books"
      },
      {
        "slug": "sunrise-over-the-camp",
        "name": "Sunrise over the Camp",
        "scene": "Wide dawn view of ordinary cabins, a quiet lake and a small flag-free gathering circle"
      }
    ]
  },
  {
    "id": "back-to-school",
    "name": "Back to School",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        7,
        15
      ],
      "end": [
        9,
        15
      ]
    },
    "palettes": [
      "cobalt",
      "ochre",
      "sage"
    ],
    "purpose": "volunteers",
    "aliases": "back to school classroom fall supplies August September",
    "designs": [
      {
        "slug": "classroom-welcome",
        "name": "Classroom Welcome",
        "scene": "A modest real classroom with empty desks and simple colorful supplies"
      },
      {
        "slug": "supply-table",
        "name": "Supply Table",
        "scene": "Plain notebooks, pencils and glue sticks on a school supply donation table"
      },
      {
        "slug": "new-backpack",
        "name": "New Backpack",
        "scene": "An unbranded backpack and a plain lunch box on a wooden bench"
      },
      {
        "slug": "library-start",
        "name": "Library Start",
        "scene": "A school library table with stacks of books without readable titles"
      },
      {
        "slug": "teacher-desk",
        "name": "Teacher Desk",
        "scene": "A used teacher desk with pencils, blank paper and a small plant"
      },
      {
        "slug": "school-garden",
        "name": "School Garden",
        "scene": "A small school garden bed with hand tools and young plants"
      },
      {
        "slug": "open-house",
        "name": "Open House",
        "scene": "A quiet school hallway with classroom doors and no readable signage"
      },
      {
        "slug": "art-supplies",
        "name": "Art Supplies",
        "scene": "Used crayons, colored pencils and blank paper on a classroom table"
      },
      {
        "slug": "family-welcome",
        "name": "Family Welcome",
        "scene": "A modest school welcome table with blank name tags and pens"
      },
      {
        "slug": "fresh-notebooks",
        "name": "Fresh Notebooks",
        "scene": "A few plain notebooks and sharpened pencils beside a classroom window"
      },
      {
        "slug": "the-first-bus-stop",
        "name": "The First Bus Stop",
        "scene": "Wide street-level view of an empty neighborhood school-bus stop with a backpack beside the bench"
      },
      {
        "slug": "morning-at-the-crosswalk",
        "name": "Morning at the Crosswalk",
        "scene": "Ground-level view across a school crosswalk toward an open school entrance in early light"
      },
      {
        "slug": "the-locker-door",
        "name": "The Locker Door",
        "scene": "Eye-level view into one plain open school locker with a fresh notebook and an unbranded jacket"
      },
      {
        "slug": "a-sharpened-pencil-spiral",
        "name": "A Sharpened Pencil Spiral",
        "scene": "Macro view of fresh pencil shavings curled beside one sharpened pencil on a simple desk"
      },
      {
        "slug": "the-science-classroom",
        "name": "The Science Classroom",
        "scene": "Wide interior view of an empty school science room with microscopes and clean experiment stations"
      },
      {
        "slug": "the-music-room-stands",
        "name": "The Music Room Stands",
        "scene": "Elevated view of empty music stands and plain instrument cases ready for a new school year"
      },
      {
        "slug": "a-classroom-reading-tent",
        "name": "A Classroom Reading Tent",
        "scene": "Eye-level view of a small fabric reading tent with cushions and unlettered books in a classroom"
      },
      {
        "slug": "the-school-garden-harvest",
        "name": "The School Garden Harvest",
        "scene": "Ground-level view of ripe tomatoes and a small watering can in an actual school garden"
      },
      {
        "slug": "gym-floor-morning",
        "name": "Gym Floor Morning",
        "scene": "Wide low-angle view across a freshly cleaned school gym floor toward an empty basketball hoop"
      },
      {
        "slug": "a-fresh-lunch-thermos",
        "name": "A Fresh Lunch Thermos",
        "scene": "Overhead view of a plain lunch thermos, fruit and a reusable lunch box packed for school"
      },
      {
        "slug": "the-art-room-sink",
        "name": "The Art Room Sink",
        "scene": "Close view of clean paintbrushes drying beside a colorful well-used school art-room sink"
      },
      {
        "slug": "an-accessible-school-ramp",
        "name": "An Accessible School Ramp",
        "scene": "Wide architectural view of a welcoming school entrance with a clear accessible ramp and no readable signs"
      },
      {
        "slug": "the-bicycle-rack",
        "name": "The Bicycle Rack",
        "scene": "Ground-level view of different ordinary bicycles lined at a school rack in morning light"
      },
      {
        "slug": "a-school-library-return-cart",
        "name": "A School Library Return Cart",
        "scene": "Eye-level view of a library return cart filled with unlettered book spines beside empty shelves"
      },
      {
        "slug": "the-geometry-shapes",
        "name": "The Geometry Shapes",
        "scene": "Straight overhead view of different colorful geometric blocks and a plain ruler on a classroom mat"
      },
      {
        "slug": "a-new-pair-of-sneakers",
        "name": "A New Pair of Sneakers",
        "scene": "Macro view of new unbranded school sneakers with neatly tied laces beside a doorway"
      },
      {
        "slug": "the-computer-lab",
        "name": "The Computer Lab",
        "scene": "Wide interior view of a modest empty school computer room with screens switched off"
      },
      {
        "slug": "a-violin-case-opening",
        "name": "A Violin Case Opening",
        "scene": "Overhead view into a plain open violin case with a bow and simple shoulder rest"
      },
      {
        "slug": "the-courtyard-bell",
        "name": "The Courtyard Bell",
        "scene": "Low-angle architectural view of a real old school bell above a quiet courtyard"
      },
      {
        "slug": "a-backpack-rain-cover",
        "name": "A Backpack Rain Cover",
        "scene": "Close view of a plain rain-covered backpack hanging beside a wet school entrance mat"
      },
      {
        "slug": "the-pottery-classroom",
        "name": "The Pottery Classroom",
        "scene": "Wide view of an empty school pottery room with drying clay bowls and small workstations"
      },
      {
        "slug": "a-box-of-new-crayons",
        "name": "A Box of New Crayons",
        "scene": "Macro view of unbranded fresh crayons with differently colored tips inside a plain paper box"
      },
      {
        "slug": "the-playground-hopscotch",
        "name": "The Playground Hopscotch",
        "scene": "Elevated view of a freshly painted unnumbered geometric hopscotch path in a school playground"
      },
      {
        "slug": "school-theatre-curtains",
        "name": "School Theatre Curtains",
        "scene": "Wide architectural view of a modest empty school stage with closed curtains before the new term"
      },
      {
        "slug": "the-classroom-globe",
        "name": "The Classroom Globe",
        "scene": "Eye-level close view of a simple unlettered globe beside an open classroom window"
      },
      {
        "slug": "a-lunchroom-ready",
        "name": "A Lunchroom Ready",
        "scene": "Wide view of a modest empty school lunchroom with clean reusable trays and ordinary seating"
      },
      {
        "slug": "the-first-day-umbrella",
        "name": "The First-Day Umbrella",
        "scene": "Ground-level view of a small colorful umbrella and a school bag beside an entryway"
      },
      {
        "slug": "a-robotics-kit",
        "name": "A Robotics Kit",
        "scene": "Overhead view of a simple unbranded school robotics kit with wheels, wires and a small controller"
      },
      {
        "slug": "the-teacher-s-reading-chair",
        "name": "The Teacher's Reading Chair",
        "scene": "Eye-level view of an empty teacher's reading chair facing a semicircle of classroom cushions"
      },
      {
        "slug": "a-row-of-science-goggles",
        "name": "A Row of Science Goggles",
        "scene": "Close view of clean protective goggles drying on a plain school laboratory rack"
      },
      {
        "slug": "the-school-greenhouse",
        "name": "The School Greenhouse",
        "scene": "Wide architectural view of a small school greenhouse with seedlings and empty student work areas"
      },
      {
        "slug": "a-paper-airplane-lesson",
        "name": "A Paper Airplane Lesson",
        "scene": "Overhead view of differently folded plain paper airplanes beside a blank classroom sheet"
      },
      {
        "slug": "the-brass-instrument-rack",
        "name": "The Brass Instrument Rack",
        "scene": "Low-angle view of plain brass instruments stored neatly in a school music room"
      },
      {
        "slug": "a-fresh-timetable-board",
        "name": "A Fresh Timetable Board",
        "scene": "Frontal view of an entirely blank magnetic classroom timetable grid with colorful empty labels"
      },
      {
        "slug": "the-school-field-lines",
        "name": "The School Field Lines",
        "scene": "Wide elevated view of fresh field markings across an empty school sports ground"
      },
      {
        "slug": "a-sewing-class-machine",
        "name": "A Sewing Class Machine",
        "scene": "Close view of a simple unbranded sewing machine and a partly sewn cloth pencil case in a school craft room"
      },
      {
        "slug": "the-counseling-nook",
        "name": "The Counseling Nook",
        "scene": "Wide view of a quiet welcoming school support room with soft chairs and a small plant"
      },
      {
        "slug": "a-magnified-leaf",
        "name": "A Magnified Leaf",
        "scene": "Macro view through a handheld magnifying glass at the veins of a real school-garden leaf"
      },
      {
        "slug": "the-stairwell-light",
        "name": "The Stairwell Light",
        "scene": "Low-angle architectural view up a bright school stairwell with simple colorful student-art frames, no readable text"
      },
      {
        "slug": "a-new-water-bottle",
        "name": "A New Water Bottle",
        "scene": "Close view of an unbranded refillable bottle resting beside a plain backpack on an outdoor bench"
      },
      {
        "slug": "the-percussion-corner",
        "name": "The Percussion Corner",
        "scene": "Eye-level view of small drums, shakers and a xylophone arranged in a school music corner"
      },
      {
        "slug": "an-empty-school-minibus",
        "name": "An Empty School Minibus",
        "scene": "Wide view of a plain unbranded school minibus parked beside a welcoming entrance at dawn"
      },
      {
        "slug": "the-chess-club-board",
        "name": "The Chess Club Board",
        "scene": "Straight overhead view of a simple chessboard set for a new school-year club meeting"
      },
      {
        "slug": "a-classroom-plant-shelf",
        "name": "A Classroom Plant Shelf",
        "scene": "Botanical close view of different living plants on a classroom windowsill beside plain learning tools"
      },
      {
        "slug": "the-school-pool",
        "name": "The School Pool",
        "scene": "Wide architectural view of a modest empty school swimming pool with lane ropes and clean benches"
      },
      {
        "slug": "a-fresh-stack-of-aprons",
        "name": "A Fresh Stack of Aprons",
        "scene": "Close view of plain clean student aprons folded for a school cookery class"
      },
      {
        "slug": "the-lost-and-found-cubby",
        "name": "The Lost-and-Found Cubby",
        "scene": "Eye-level view of neatly sorted mittens, hats and water bottles in a school cubby without names"
      },
      {
        "slug": "a-playground-rain-puddle",
        "name": "A Playground Rain Puddle",
        "scene": "Ground-level view of a puddle reflecting colorful school playground equipment after morning rain"
      },
      {
        "slug": "the-school-welcome-hall",
        "name": "The School Welcome Hall",
        "scene": "Wide interior view of a modest school hall with empty chairs and simple first-day flowers"
      },
      {
        "slug": "the-night-before-school",
        "name": "The Night Before School",
        "scene": "Wide natural-night view through a warmly lit home window toward a schoolbag and closed notebook ready for morning"
      }
    ]
  },
  {
    "id": "graduation",
    "name": "Graduation",
    "kind": "Seasonal activities",
    "date": {
      "kind": "window",
      "start": [
        5,
        1
      ],
      "end": [
        6,
        30
      ]
    },
    "palettes": [
      "slate",
      "ochre",
      "marine"
    ],
    "purpose": "celebration",
    "aliases": "graduation commencement seniors school May June",
    "designs": [
      {
        "slug": "cap-and-gown",
        "name": "Cap and Gown",
        "scene": "A plain graduation cap and folded gown on a wooden chair by a window"
      },
      {
        "slug": "garden-reception",
        "name": "Garden Reception",
        "scene": "A modest backyard graduation reception table with simple flowers and plain plates"
      },
      {
        "slug": "school-courtyard",
        "name": "School Courtyard",
        "scene": "Empty folding chairs arranged in a small school courtyard"
      },
      {
        "slug": "next-chapter",
        "name": "Next Chapter",
        "scene": "A plain diploma tube and a closed unlettered notebook on a desk"
      },
      {
        "slug": "family-brunch",
        "name": "Family Brunch",
        "scene": "A simple graduation brunch table with a cap resting on a spare chair"
      },
      {
        "slug": "community-hall",
        "name": "Community Hall",
        "scene": "A modest community hall prepared with folding tables and subtle school-color ribbons"
      },
      {
        "slug": "library-steps",
        "name": "Library Steps",
        "scene": "A plain graduation cap resting on stone library steps in daylight"
      },
      {
        "slug": "photo-corner",
        "name": "Photo Corner",
        "scene": "A modest backyard photo corner with a few balloons and a simple chair"
      },
      {
        "slug": "shared-cake",
        "name": "Shared Cake",
        "scene": "A homemade celebration cake with no text beside a plain graduation cap"
      },
      {
        "slug": "summer-sendoff",
        "name": "Summer Sendoff",
        "scene": "A small outdoor table with lemonade, flowers and a folded gown nearby"
      },
      {
        "slug": "the-empty-commencement-stage",
        "name": "The Empty Commencement Stage",
        "scene": "Wide architectural view of a modest commencement stage with an unlettered lectern before guests arrive"
      },
      {
        "slug": "tassel-in-the-breeze",
        "name": "Tassel in the Breeze",
        "scene": "Macro view of one graduation tassel moving against a soft sky beside a campus window"
      },
      {
        "slug": "a-graduate-s-bicycle",
        "name": "A Graduate's Bicycle",
        "scene": "Ground-level view of a plain bicycle with a small graduation ribbon outside a campus building"
      },
      {
        "slug": "the-stadium-seating",
        "name": "The Stadium Seating",
        "scene": "Elevated wide view of an empty stadium prepared with modest commencement seating on the field"
      },
      {
        "slug": "a-robe-on-the-door",
        "name": "A Robe on the Door",
        "scene": "Eye-level view of a freshly pressed graduation robe hanging from a plain bedroom door"
      },
      {
        "slug": "the-diploma-seal",
        "name": "The Diploma Seal",
        "scene": "Macro view of a blank embossed diploma cover and a plain ribbon on deep blue cloth"
      },
      {
        "slug": "campus-cherry-blossoms",
        "name": "Campus Cherry Blossoms",
        "scene": "Wide low-angle view of flowering trees lining a real campus walk during graduation season"
      },
      {
        "slug": "an-open-travel-trunk",
        "name": "An Open Travel Trunk",
        "scene": "Overhead view of a partly packed travel case with a folded graduation robe and a plain journal"
      },
      {
        "slug": "the-brass-band-chairs",
        "name": "The Brass Band Chairs",
        "scene": "Wide view of empty music stands, brass instruments and chairs beside a commencement stage"
      },
      {
        "slug": "a-mortarboard-shadow",
        "name": "A Mortarboard Shadow",
        "scene": "Ground-level view of a graduation cap casting a distinct shadow across sunlit campus paving"
      },
      {
        "slug": "the-first-office-bag",
        "name": "The First Office Bag",
        "scene": "Close view of a new unbranded work bag beside a folded academic gown at home"
      },
      {
        "slug": "graduation-by-the-sea",
        "name": "Graduation by the Sea",
        "scene": "Wide coastal view of an empty graduation reception pavilion beside an ordinary beach"
      },
      {
        "slug": "the-family-flower-stall",
        "name": "The Family Flower Stall",
        "scene": "Eye-level view of a modest campus flower stall with wrapped bouquets ready for graduation visitors"
      },
      {
        "slug": "a-thank-you-envelope",
        "name": "A Thank-You Envelope",
        "scene": "Overhead view of a plain sealed envelope and a simple pen beside a graduation tassel"
      },
      {
        "slug": "the-library-gallery",
        "name": "The Library Gallery",
        "scene": "Wide architectural view of an empty campus library gallery prepared for a small graduate reception"
      },
      {
        "slug": "polished-shoes-and-hem",
        "name": "Polished Shoes and Hem",
        "scene": "Ground-level view of polished formal shoes beneath a neatly hanging graduation gown"
      },
      {
        "slug": "the-apprentice-s-toolbox",
        "name": "The Apprentice's Toolbox",
        "scene": "Overhead view of a clean practical toolbox beside a plain completion certificate cover and a graduation ribbon"
      },
      {
        "slug": "a-sunset-campus-bridge",
        "name": "A Sunset Campus Bridge",
        "scene": "Wide view of an empty campus footbridge at natural sunset with modest graduation ribbons"
      },
      {
        "slug": "the-rolled-poster-keepsake",
        "name": "The Rolled Poster Keepsake",
        "scene": "Close view of a blank rolled student-art poster and an unlettered portfolio beside a graduation robe"
      },
      {
        "slug": "a-new-chapter-plant",
        "name": "A New Chapter Plant",
        "scene": "Botanical macro view of a small fresh seedling in a plain gift pot tied with a graduation ribbon"
      },
      {
        "slug": "the-auditorium-balcony",
        "name": "The Auditorium Balcony",
        "scene": "Elevated architectural view from an empty auditorium balcony toward a commencement lectern and stage"
      },
      {
        "slug": "a-simple-pearl-necklace",
        "name": "A Simple Pearl Necklace",
        "scene": "Close view of a plain formal necklace resting beside a graduation outfit on a fabric chair"
      },
      {
        "slug": "graduation-cupcakes",
        "name": "Graduation Cupcakes",
        "scene": "Overhead view of a few handmade celebration cupcakes with simple original cap-shaped paper toppers"
      },
      {
        "slug": "the-engineering-model",
        "name": "The Engineering Model",
        "scene": "Eye-level view of an original small student bridge model beside a graduation tassel in a study nook"
      },
      {
        "slug": "a-campus-tram-ride",
        "name": "A Campus Tram Ride",
        "scene": "Wide view from an empty campus tram toward university-style buildings during graduation season"
      },
      {
        "slug": "the-garden-photo-arch",
        "name": "The Garden Photo Arch",
        "scene": "Wide view of a modest floral photo arch with an empty chair at a graduation garden reception"
      },
      {
        "slug": "a-fresh-portfolio",
        "name": "A Fresh Portfolio",
        "scene": "Overhead view of an unlettered open design portfolio with blank page backs beside a plain diploma cover"
      },
      {
        "slug": "the-science-graduate",
        "name": "The Science Graduate",
        "scene": "Close view of a clean lab coat folded beside a graduation robe, without institutional logos"
      },
      {
        "slug": "a-cap-by-the-lake",
        "name": "A Cap by the Lake",
        "scene": "Wide view of a plain graduation cap resting on a lakeside bench near a campus path"
      },
      {
        "slug": "the-guest-ticket-envelope",
        "name": "The Guest Ticket Envelope",
        "scene": "Macro view of plain blank ticket cards tucked into an unlettered commencement envelope"
      },
      {
        "slug": "the-courtyard-string-quartet",
        "name": "The Courtyard String Quartet",
        "scene": "Wide view of empty music chairs with unbranded string-instrument cases in a graduate reception courtyard"
      },
      {
        "slug": "a-first-apartment-key",
        "name": "A First Apartment Key",
        "scene": "Close view of a simple new key beside a graduation tassel on a plain ceramic dish"
      },
      {
        "slug": "the-class-memory-box",
        "name": "The Class Memory Box",
        "scene": "Overhead view inside a keepsake box with unlettered photos facing down and a worn school badge without symbols"
      },
      {
        "slug": "the-campus-clock-tower",
        "name": "The Campus Clock Tower",
        "scene": "Low-angle architectural view of a modest campus clock tower with a graduation ribbon on a nearby rail"
      },
      {
        "slug": "the-reception-dessert-cart",
        "name": "The Reception Dessert Cart",
        "scene": "Eye-level view of a small unbranded dessert cart with homemade treats prepared for a graduation party"
      },
      {
        "slug": "a-nurse-s-new-beginning",
        "name": "A Nurse's New Beginning",
        "scene": "Overhead view of a plain stethoscope beside a folded graduation robe and blank certificate cover"
      },
      {
        "slug": "the-last-dormitory-box",
        "name": "The Last Dormitory Box",
        "scene": "Wide view of a nearly empty dormitory room with one moving box and a hanging graduation gown"
      },
      {
        "slug": "the-dance-graduate-s-shoes",
        "name": "The Dance Graduate's Shoes",
        "scene": "Close view of well-used dance shoes beside a plain graduation cap in a studio corner"
      },
      {
        "slug": "an-autumn-graduation-walk",
        "name": "An Autumn Graduation Walk",
        "scene": "Wide view of an empty campus walkway with autumn leaves and a simple commencement directional stand without lettering"
      },
      {
        "slug": "the-technical-graduate-s-helmet",
        "name": "The Technical Graduate's Helmet",
        "scene": "Ground-level view of a clean unbranded hard hat beside a diploma tube and work boots"
      },
      {
        "slug": "the-community-college-atrium",
        "name": "The Community College Atrium",
        "scene": "Wide architectural view of an ordinary campus atrium prepared with modest commencement flowers and empty chairs"
      },
      {
        "slug": "a-pressed-graduation-bouquet",
        "name": "A Pressed Graduation Bouquet",
        "scene": "Macro view of a few pressed petals preserved beside a plain graduation ribbon inside an open keepsake album"
      },
      {
        "slug": "the-school-bus-sendoff",
        "name": "The School Bus Sendoff",
        "scene": "Wide view of an empty plain school bus beside a graduate picnic shelter with simple celebratory ribbons"
      },
      {
        "slug": "a-graduate-s-train-platform",
        "name": "A Graduate's Train Platform",
        "scene": "Eye-level view of a suitcase and diploma tube resting beside an empty railway platform bench"
      },
      {
        "slug": "the-architect-s-sketch-roll",
        "name": "The Architect's Sketch Roll",
        "scene": "Overhead view of plain rolled drawings and a simple model-building tool beside a graduation cap"
      },
      {
        "slug": "the-music-graduate-s-bow",
        "name": "The Music Graduate's Bow",
        "scene": "Macro view of a violin bow resting beside a plain graduation tassel on deep-colored fabric"
      },
      {
        "slug": "an-evening-campus-fountain",
        "name": "An Evening Campus Fountain",
        "scene": "Wide natural-night view of a softly lit campus fountain with empty graduation reception seats nearby"
      },
      {
        "slug": "the-cake-without-lettering",
        "name": "The Cake without Lettering",
        "scene": "Close view of a homemade celebration cake with simple fruit decoration and a plain graduation cap beside it"
      },
      {
        "slug": "the-family-picnic-welcome",
        "name": "The Family Picnic Welcome",
        "scene": "Elevated view of a modest graduation picnic with blankets, gifts and covered dishes beneath shade trees"
      },
      {
        "slug": "the-open-gate-ahead",
        "name": "The Open Gate Ahead",
        "scene": "Wide morning view through an open campus gate toward a sunlit path with a diploma tube resting on a bench"
      }
    ]
  }
] as const satisfies readonly HolidayCollection[];

export type HolidayCollectionId = (typeof HOLIDAY_COLLECTIONS)[number]["id"];
