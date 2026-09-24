import type { LiveCardEventType } from "./livecard-builder.ts";

export type LiveCardDesignSuggestion = {
  id: string;
  theme: string;
  title: string;
  summary: string;
  prompt: string;
  audience: "girl" | "boy" | "everyone";
};

// Each category has 25 authored scenes and two complete art directions per scene.
// These are visual starting points only: never add event names, ages or logistics.
type Scene = readonly [title: string, description: string];
const SCENES = {
  Birthday: [
    [
      "Moonlit mermaids",
      "a mermaid lagoon with pearly shells, luminous coral and moonlight rippling across the water",
    ],
    [
      "Dinosaur valley",
      "friendly dinosaurs exploring a fern-filled valley beneath a towering waterfall",
    ],
    [
      "Space explorer",
      "a tiny rocket drifting past ringed planets, sparkling nebulae and a cratered moon",
    ],
    [
      "Secret fairy garden",
      "a fairy cottage tucked among giant flowers, glowing mushrooms and winding mossy paths",
    ],
    [
      "Raceway party",
      "racing cars rounding a sweeping track with checkered flags and sunlit grandstands",
    ],
    [
      "Movie premiere",
      "a glowing vintage cinema with velvet curtains, popcorn and a spotlighted red carpet",
    ],
    [
      "Under the sea",
      "sea turtles and playful fish weaving through a richly layered reef with sunbeams from above",
    ],
    [
      "Enchanted castle",
      "a storybook castle beyond a flower-lined bridge, with fluttering banners and distant mountains",
    ],
    [
      "Jungle adventure",
      "curious jungle animals gathered around a treehouse among tropical leaves and hanging vines",
    ],
    [
      "Disco celebration",
      "a mirrored disco ball above a colorful dance floor, with shimmering curtains and scattered light",
    ],
    [
      "Art studio",
      "paintbrushes, thick swirls of paint and a joyful canvas in a sun-filled artist's studio",
    ],
    [
      "Magical bakery",
      "an elaborate birthday cake inside a charming bakery filled with pastries and frosting details",
    ],
    [
      "Stadium spotlight",
      "a football on a vivid stadium field under bright floodlights, with cheering stands in the distance",
    ],
    [
      "Wildflower picnic",
      "a birthday picnic beneath a flowering tree, with a cake, woven baskets and embroidered blankets",
    ],
    [
      "Robot workshop",
      "friendly handmade robots in a whimsical workshop full of copper gears and glowing inventions",
    ],
    [
      "Rodeo sunset",
      "a decorated cowboy hat and boots beside a rustic fence overlooking a warm desert sunset",
    ],
    [
      "Butterfly conservatory",
      "bright butterflies drifting through a glass conservatory filled with orchids and leafy arches",
    ],
    [
      "Pirate treasure",
      "a playful pirate ship entering a tropical cove with a treasure chest and sparkling turquoise waves",
    ],
    [
      "Winter wonderland",
      "a cozy snow-covered chalet with glittering trees, lanterns and a birthday cake by the window",
    ],
    [
      "Skate park",
      "colorful skateboards and roller skates beside sweeping ramps and a lively mural",
    ],
    [
      "Ballet stage",
      "a pair of ballet shoes beside a softly lit stage with flowing curtains and scattered petals",
    ],
    [
      "Mountain campout",
      "a lantern-lit tent by a still mountain lake, with pine trees and a sky full of stars",
    ],
    [
      "Poolside sunshine",
      "a sparkling pool with playful floats, striped umbrellas and a festive tropical cake",
    ],
    [
      "Music festival",
      "a small outdoor stage with guitars, glowing string lights and colorful festival flags",
    ],
    [
      "Evening lounge",
      "a sophisticated birthday cake on a marble table in a candlelit lounge with velvet seating",
    ],
  ],
  Wedding: [
    [
      "Garden vows",
      "a flower-covered wedding arch at the end of a lush garden aisle in soft afternoon light",
    ],
    [
      "Tuscan courtyard",
      "a candlelit wedding table in a Tuscan courtyard with climbing vines and stone arches",
    ],
    [
      "Coastal ceremony",
      "a billowing fabric ceremony arch above a quiet beach with sea grass and luminous waves",
    ],
    [
      "Forest chapel",
      "an intimate woodland wedding aisle beneath towering trees and suspended lanterns",
    ],
    [
      "Orchid ballroom",
      "a grand ballroom with cascading orchids, crystal chandeliers and a polished dance floor",
    ],
    [
      "Desert romance",
      "a sculptural wedding arch among desert rocks, dried flowers and a glowing sunset",
    ],
    [
      "Lakeside vows",
      "a flower-lined dock leading to a wedding canopy reflected in a still mountain lake",
    ],
    [
      "City rooftop",
      "an elegant rooftop wedding with sculptural flowers, candles and a sparkling city skyline",
    ],
    [
      "Vineyard evening",
      "a long reception table between vineyard rows beneath strings of warm lights",
    ],
    [
      "Winter candlelight",
      "a romantic winter wedding hall with evergreen garlands, tall candles and frosted windows",
    ],
    [
      "Wildflower meadow",
      "a wedding aisle winding through tall wildflowers toward a simple wooden ceremony arch",
    ],
    [
      "Glasshouse celebration",
      "a wedding reception in a glass conservatory with hanging greenery and reflected candlelight",
    ],
    [
      "Tropical vows",
      "a wedding canopy of palm leaves and bright flowers overlooking a calm tropical bay",
    ],
    [
      "Old-world library",
      "an intimate wedding setting among carved bookshelves, antique lamps and cascading florals",
    ],
    [
      "Cherry blossom aisle",
      "a wedding aisle beneath flowering cherry trees with fallen petals and silk ribbons",
    ],
    [
      "Sailboat escape",
      "a flower-adorned sailboat at a peaceful harbor with flowing fabric and sunset reflections",
    ],
    [
      "Art deco romance",
      "a glamorous wedding salon with fan-shaped architecture, sculptural florals and gleaming metal details",
    ],
    [
      "Country barn",
      "a beautifully dressed barn reception with timber beams, meadow flowers and warm lanterns",
    ],
    [
      "Midnight roses",
      "a wedding table overflowing with roses beneath a starry sky and clusters of tall candles",
    ],
    [
      "Citrus estate",
      "a wedding courtyard with citrus trees, tiled fountains and a long linen-covered table",
    ],
    [
      "Mountain overlook",
      "a sweeping wedding ceremony overlook with layered peaks, flowing fabric and alpine flowers",
    ],
    [
      "Museum celebration",
      "a sculptural wedding installation inside a luminous gallery with modern floral arrangements",
    ],
    [
      "Seaside villa",
      "a wedding terrace with stone balustrades, climbing bougainvillea and a shimmering sea view",
    ],
    [
      "Secret rose garden",
      "an ornate garden gate opening onto a rose-filled wedding ceremony with candlelit pathways",
    ],
    [
      "Celestial vows",
      "a dreamy wedding arch shaped like a crescent moon with floating stars and soft clouds",
    ],
  ],
  Anniversary: [
    [
      "Candlelit dinner",
      "an intimate anniversary table with paired glasses, roses and candlelight reflected in crystal",
    ],
    [
      "Garden memories",
      "a garden swing wrapped in flowering vines beside a small anniversary cake",
    ],
    [
      "Coastal escape",
      "two lounge chairs on a quiet seaside terrace with linen drapes and sunset waves",
    ],
    [
      "Parisian evening",
      "a romantic bistro table on a glowing cobbled street with flowers and vintage lamps",
    ],
    [
      "Golden orchard",
      "a long anniversary table among orchard trees with hanging lanterns and ripe fruit",
    ],
    [
      "Moonlit sail",
      "a graceful sailboat crossing a moonlit bay with reflections dancing on the water",
    ],
    [
      "Jazz lounge",
      "a velvet anniversary lounge with a grand piano, candlelit tables and rich stage curtains",
    ],
    [
      "Love letters",
      "a still life of handwritten-style unopened letters, ribbon, flowers and an antique writing desk",
    ],
    [
      "Mountain retreat",
      "a cozy cabin terrace with two chairs, glowing lanterns and layered mountain views",
    ],
    [
      "Champagne sparkle",
      "paired sparkling glasses beside an anniversary cake and a cascade of celebratory light",
    ],
    ["Rose-covered arch", "a romantic arch overflowing with roses along a winding garden path"],
    [
      "Record collection",
      "a vintage record player surrounded by flowers, vinyl records and warm lamplight",
    ],
    [
      "Starlit picnic",
      "an elegant picnic for two with cushions, a small cake and a wide starry sky",
    ],
    [
      "Tuscan getaway",
      "a sunlit stone terrace with olive trees, pottery and a beautifully set anniversary table",
    ],
    [
      "Winter fireside",
      "a cozy fireplace with flowers, candles and a special cake beside upholstered chairs",
    ],
    [
      "Tropical hideaway",
      "a private cabana with tropical flowers, flowing curtains and a brilliant lagoon",
    ],
    [
      "City lights",
      "an anniversary dinner above the city with a skyline reflected in tall windows",
    ],
    [
      "Tea for two",
      "a delicate tea service and anniversary cake in a conservatory filled with flowers",
    ],
    [
      "Vintage train journey",
      "a luxurious train dining compartment with flowers and rolling countryside beyond the window",
    ],
    [
      "Seashell keepsakes",
      "paired shells and ribbon-bound keepsakes on driftwood beside gentle ocean waves",
    ],
    [
      "Dancing in the garden",
      "a small anniversary dance floor under garden lights and sweeping floral branches",
    ],
    [
      "Pearl celebration",
      "an anniversary cake with pearlescent details beside sculptural flowers and glowing candles",
    ],
    [
      "Desert evening",
      "an intimate anniversary table beside desert palms and layered dunes at twilight",
    ],
    [
      "Storybook romance",
      "an open illustrated book unfolding into a magical garden with a tiny celebration table",
    ],
    [
      "Waterfront lanterns",
      "a riverside anniversary terrace with lanterns, flowering planters and shimmering reflections",
    ],
  ],
  "Baby shower": [
    ["Cloud nursery", "a tiny cradle among fluffy clouds, soft stars and a glowing crescent moon"],
    ["Woodland welcome", "gentle woodland animals beside a bassinet in a fern-filled clearing"],
    ["Little astronaut", "a baby-sized rocket among soft planets, plush stars and floating clouds"],
    [
      "Garden bunny",
      "a plush bunny in a woven basket surrounded by spring flowers and trailing ribbon",
    ],
    [
      "Teddy picnic",
      "teddy bears at a tiny picnic with quilted blankets, miniature cakes and dappled sunlight",
    ],
    [
      "Storybook arrival",
      "an open nursery storybook unfolding into a cozy cottage and rolling hills",
    ],
    [
      "Little sailor",
      "a toy sailboat beside a wicker bassinet with soft fabric waves and seashells",
    ],
    [
      "Sweet citrus",
      "a baby shower table under citrus branches with delicate blossoms and a softly frosted cake",
    ],
    [
      "Dreamy safari",
      "baby giraffes and elephants beneath an acacia tree with soft grasses and gentle light",
    ],
    [
      "Tiny dinosaur",
      "a baby dinosaur hatching among lush ferns, smooth pebbles and cheerful flowers",
    ],
    [
      "Butterfly wishes",
      "delicate butterflies floating above a woven cradle in a blooming conservatory",
    ],
    [
      "Honeybee garden",
      "a friendly bee hovering over daisies, honey jars and a tiny knitted blanket",
    ],
    [
      "Little duck pond",
      "fluffy ducklings on a lily pond beside reeds and softly reflected clouds",
    ],
    [
      "Hot-air balloon",
      "a basket carrying plush toys beneath a patterned balloon above rolling clouds",
    ],
    [
      "Knitted with love",
      "tiny knitted booties, a textured blanket and soft yarn beside a vase of fresh flowers",
    ],
    [
      "Little wildflower",
      "a rustic bassinet amid layered meadow flowers and gently floating seed heads",
    ],
    [
      "Ocean lullaby",
      "gentle whales and sea turtles swimming through a dreamy underwater nursery scene",
    ],
    [
      "Farmyard welcome",
      "a lamb, calf and duckling peeking around a cozy barn filled with soft hay",
    ],
    [
      "Rainy-day rainbow",
      "a tiny pair of rain boots beneath a rainbow with fluffy clouds and spring blooms",
    ],
    [
      "Little swan",
      "a graceful swan with cygnets on a flower-framed lake with shimmering reflections",
    ],
    ["Toy train", "a wooden toy train carrying little gifts through a storybook landscape"],
    [
      "Cherry blossom cradle",
      "a hanging cradle beneath cherry blossoms with petals drifting through warm light",
    ],
    [
      "Lullaby music",
      "a nursery mobile with tiny instruments and stars above a softly draped cradle",
    ],
    [
      "Pumpkin patch",
      "a little bassinet nestled among pumpkins, autumn leaves and warm knitted textures",
    ],
    [
      "Winter baby",
      "a plush polar bear beside a cozy cradle with frosted pines and gentle snowfall",
    ],
  ],
  "Gender reveal": [
    [
      "Cloud surprise",
      "two matching clusters of colored clouds around a closed gift box beneath a rainbow",
    ],
    [
      "Teddy twins",
      "two equally featured teddy bears with contrasting ribbons beside a sealed surprise box",
    ],
    [
      "Butterfly secret",
      "paired butterfly swarms circling a flower-covered arch and a closed keepsake box",
    ],
    [
      "Moon and stars",
      "a crescent moon holding a wrapped surprise among two equally bright constellations",
    ],
    [
      "Garden reveal",
      "two complementary flower arrangements framing a closed gift basket in a lush garden",
    ],
    [
      "Balloon baskets",
      "two matching hot-air balloons floating over rolling clouds with wrapped baskets",
    ],
    [
      "Ocean mystery",
      "two friendly whales swimming around a closed pearly shell in a luminous reef",
    ],
    [
      "Sweet surprise",
      "a whole, uncut reveal cake on a pedestal with two matching ribbons and sugar flowers",
    ],
    [
      "Stadium suspense",
      "paired colored pennants above a bright playing field with a sealed surprise ball at center",
    ],
    ["Woodland secret", "two woodland animals peeking at a closed box beneath flowering branches"],
    [
      "Safari surprise",
      "a baby elephant holding two equal balloon bunches beside tall grasses and a wrapped gift",
    ],
    [
      "Citrus celebration",
      "paired colored ribbons around a closed gift on a citrus-lined garden table",
    ],
    [
      "Little stars",
      "two equally glowing star mobiles hanging above a closed nursery keepsake chest",
    ],
    [
      "Carnival mystery",
      "two striped carnival booths flanking a sealed surprise box under festive lights",
    ],
    [
      "Seaside secret",
      "two matching beach umbrellas beside a closed woven hamper and sparkling water",
    ],
    [
      "Bow surprise",
      "two elaborate fabric bows framing a closed hatbox on a sculptural display table",
    ],
    [
      "Fairytale reveal",
      "two friendly dragons guarding a closed sparkling egg in a storybook valley",
    ],
    [
      "Confetti moment",
      "a sealed confetti cylinder surrounded by balanced colored streamers and glowing party lights",
    ],
    [
      "Little duck secret",
      "two ducklings with complementary ribbons beside a closed basket at a lily pond",
    ],
    [
      "Picnic surprise",
      "a garden picnic with two matching cushions, flowers and a sealed reveal hamper",
    ],
    [
      "Toy train reveal",
      "two matching toy train carriages carrying closed gifts through a dreamy landscape",
    ],
    [
      "Winter wonder",
      "two cozy mittens framing a closed present among snowy pines and twinkling lights",
    ],
    [
      "Desert rainbow",
      "two colored arches above a sealed gift basket with pampas grass and warm desert light",
    ],
    [
      "Storybook secret",
      "a closed ribbon-bound storybook surrounded by paired stars, flowers and tiny toys",
    ],
    [
      "Firefly wishes",
      "two groups of glowing fireflies around a sealed keepsake lantern in a twilight garden",
    ],
  ],
  "Bridal shower": [
    ["Garden tea", "a bridal tea table with delicate cups, a floral cake and climbing roses"],
    [
      "Citrus brunch",
      "a bridal brunch table beneath lemon branches with patterned ceramics and linen napkins",
    ],
    [
      "Parisian patisserie",
      "a charming pastry counter with macarons, a bridal cake and lush flowers",
    ],
    [
      "Pearls and bows",
      "silk bows and strands of pearls around a sculptural bridal cake on a velvet table",
    ],
    [
      "Coastal bride",
      "a shower table with shells, billowing linen and flowers overlooking the sea",
    ],
    [
      "Wildflower gathering",
      "a picnic-style bridal shower among meadow flowers with baskets and embroidered cushions",
    ],
    ["Champagne tower", "a sparkling glass tower beside an elegant cake and cascading orchids"],
    [
      "Love in bloom",
      "an overflowing flower cart with peonies, ribbons and a small bridal shower cake",
    ],
    [
      "Mediterranean terrace",
      "a bridal table among olive trees, tiled steps and warm stone arches",
    ],
    [
      "Disco bride",
      "mirrored disco balls above a flower-covered bridal celebration table and shimmering curtains",
    ],
    [
      "Country romance",
      "a rustic shower table with boots, meadow flowers and lace details in a sunlit barn",
    ],
    [
      "Lakeside luncheon",
      "a beautifully set bridal luncheon beside a still lake with willow branches overhead",
    ],
    [
      "Bookshop romance",
      "a bridal tea tucked between antique bookshelves with flowers and warm reading lamps",
    ],
    [
      "Tropical shower",
      "a bridal cake beneath palm leaves with vivid tropical flowers and woven textures",
    ],
    [
      "Strawberry social",
      "a shower picnic with fresh strawberries, gingham fabric and a berry-topped cake",
    ],
    [
      "Secret conservatory",
      "a glasshouse bridal table with hanging ferns, orchids and glimmering candles",
    ],
    [
      "Vintage vanity",
      "a vintage dressing table with bridal accessories, perfume bottles and a bouquet",
    ],
    [
      "Rooftop celebration",
      "a bridal brunch above a city skyline with modern florals and a sculptural cake",
    ],
    ["Butterfly bride", "butterflies drifting above a floral cake in a lush garden pavilion"],
    [
      "Autumn romance",
      "a bridal table with dahlias, pears, velvet ribbons and softly glowing candles",
    ],
    [
      "Winter sparkle",
      "a bridal cake surrounded by frosted branches, crystal ornaments and warm fairy lights",
    ],
    [
      "Bows and cherries",
      "a playful shower cake with oversized fabric bows, glossy cherries and vintage glassware",
    ],
    [
      "Desert rose",
      "a bridal shower setting with sculptural ceramics, desert roses and flowing linen",
    ],
    [
      "Moonlit florals",
      "an evening bridal table with luminous flowers and candles under a crescent moon",
    ],
    [
      "Artful bride",
      "a gallery-style shower with sculptural flowers, painted silk and a modern tiered cake",
    ],
  ],
  Graduation: [
    [
      "Cap and laurel",
      "a graduation cap and rolled diploma on a stone pedestal with laurel branches and falling confetti",
    ],
    [
      "Campus twilight",
      "a graduation cap in the foreground of a tree-lined campus glowing at twilight",
    ],
    [
      "City of possibilities",
      "a graduation cap on a rooftop ledge overlooking a luminous city skyline",
    ],
    ["Starry future", "a cap and diploma among sweeping constellations and a radiant night sky"],
    ["Garden graduate", "a graduation cap beside a celebration cake in a flowering garden"],
    [
      "Library legacy",
      "a diploma and cap on an antique desk in a grand library with warm reading lights",
    ],
    [
      "Mountain milestone",
      "a graduation cap on a rocky overlook above layered mountain peaks at sunrise",
    ],
    [
      "Confetti celebration",
      "a cap suspended in a joyful burst of paper confetti above a festive graduation table",
    ],
    ["Varsity spirit", "a graduation cap beside a varsity jacket and diploma under stadium lights"],
    [
      "Modern marble",
      "a cap and diploma on sculptural marble plinths with strong architectural light",
    ],
    [
      "Coastal horizon",
      "a graduation cap and ribbon-bound diploma beside a breezy coastal overlook",
    ],
    [
      "New chapter",
      "an open book unfolding into a bright path with a graduation cap and floating pages",
    ],
    ["Neon future", "a graduation cap reflected on a glossy floor beneath abstract neon arches"],
    [
      "Wildflower achievement",
      "a diploma tied with ribbon among wildflowers and a softly lit graduation cap",
    ],
    [
      "Film premiere",
      "a graduation cap on a red carpet with cinema spotlights and velvet curtains",
    ],
    [
      "Travel ahead",
      "a vintage suitcase topped with a cap and diploma beside a globe and a sunlit window",
    ],
    [
      "Creative graduate",
      "a cap and diploma among paintbrushes, a colorful canvas and ceramic studio tools",
    ],
    [
      "Science of success",
      "a graduation cap on a laboratory-inspired display with glowing glass forms and molecular sculptures",
    ],
    [
      "Music milestone",
      "a cap and diploma on a grand piano beside sheet-music textures and a stage spotlight",
    ],
    [
      "Tropical send-off",
      "a graduation celebration table with a cap, tropical flowers and palm shadows",
    ],
    [
      "Stairway forward",
      "a graduation cap at the foot of a sweeping architectural staircase filled with sunlight",
    ],
    ["Desert dawn", "a cap and diploma on a warm stone ledge with distant dunes and a rising sun"],
    [
      "Balloon celebration",
      "a graduation cap above a festive cake with layered balloons and shimmering ribbons",
    ],
    [
      "Garden lanterns",
      "a graduation dinner table with a cap and diploma beneath glowing garden lanterns",
    ],
    [
      "Classic academy",
      "a cap and diploma beneath a grand columned arch with ivy and rich fabric draping",
    ],
  ],
  Housewarming: [
    [
      "Welcome home",
      "an inviting front door with a wreath, flowering pots and a warmly glowing porch",
    ],
    [
      "Cozy kitchen",
      "a welcoming kitchen island with fresh bread, flowers and a housewarming cake",
    ],
    [
      "Garden gathering",
      "a backyard table under string lights with climbing plants and colorful garden cushions",
    ],
    [
      "City apartment",
      "a stylish apartment living room with lush plants, warm lamps and a skyline view",
    ],
    [
      "Cottage keys",
      "a vintage key on a flower-covered cottage doorstep with a woven welcome basket",
    ],
    ["Rooftop neighbors", "a cozy rooftop gathering with potted trees, lanterns and a city sunset"],
    [
      "Moving-day joy",
      "neatly stacked moving boxes with houseplants, cushions and celebratory ribbons",
    ],
    [
      "Coastal home",
      "a breezy living room with woven furniture, shells and open doors toward the ocean",
    ],
    [
      "Midcentury welcome",
      "a midcentury living room with sculptural chairs, a record player and festive flowers",
    ],
    [
      "Front-porch evening",
      "a welcoming porch with rocking chairs, hanging plants and glowing lanterns",
    ],
    [
      "Greenhouse home",
      "a sun-filled reading nook surrounded by leafy plants and flowering window boxes",
    ],
    [
      "First dinner",
      "a beautifully laid dining table with handmade pottery, fresh flowers and candlelight",
    ],
    [
      "Fireplace friends",
      "a cozy living room centered on a glowing fireplace with soft throws and flowers",
    ],
    [
      "Courtyard party",
      "a tiled courtyard with a small fountain, citrus trees and a welcoming dinner table",
    ],
    [
      "Farmhouse welcome",
      "a farmhouse kitchen with a wooden table, baskets of produce and wildflowers",
    ],
    ["New keys", "a gleaming key ring beside a miniature house, fresh blooms and textured linen"],
    [
      "Book-filled home",
      "a warm home library with a reading chair, stacked books and a celebration cake",
    ],
    [
      "Balcony bloom",
      "a flower-filled balcony with a small table, lanterns and soft evening light",
    ],
    [
      "Poolside welcome",
      "a backyard pool with bright umbrellas, comfortable seating and festive string lights",
    ],
    ["Autumn doorstep", "a new home's porch decorated with pumpkins, leaves and warm lanterns"],
    [
      "Winter welcome",
      "a warmly lit doorway surrounded by evergreens, snow and cozy porch blankets",
    ],
    [
      "Desert dwelling",
      "a sculptural desert home entry with cacti, terracotta pots and soft sunset shadows",
    ],
    [
      "Artist's loft",
      "a light-filled loft with large windows, original paintings and a welcoming communal table",
    ],
    [
      "Neighborhood picnic",
      "a friendly front-yard picnic with a house in the background and glowing garden lights",
    ],
    [
      "Home sweet home",
      "a housewarming cake on a kitchen table with a flower vase and an open garden window",
    ],
  ],
  "Game day": [
    [
      "Friday night lights",
      "a football on a vivid field under brilliant stadium lights and atmospheric evening haze",
    ],
    [
      "Tailgate cookout",
      "a festive football tailgate with a grill, pennants, coolers and a stadium in the distance",
    ],
    [
      "Courtside energy",
      "a basketball at center court with gleaming floorboards and dramatic arena spotlights",
    ],
    [
      "Ballpark afternoon",
      "a baseball and glove beside a sunny diamond with grandstands and classic pennants",
    ],
    [
      "Soccer celebration",
      "a soccer ball on fresh turf with a goal, waving flags and a bright stadium backdrop",
    ],
    ["Hockey night", "a hockey puck and sticks on reflective ice beneath powerful arena lights"],
    [
      "Home watch party",
      "a comfortable game-viewing lounge with snacks, pennants and a softly glowing blank screen",
    ],
    [
      "Vintage varsity",
      "a leather ball and varsity jacket in an old locker room with fabric pennants",
    ],
    ["Stadium sunset", "a sweeping football stadium at sunset with the field illuminated below"],
    [
      "Championship glow",
      "a gleaming sports trophy on a pedestal with dramatic spotlights and falling confetti",
    ],
    [
      "Backyard rivalry",
      "a backyard game-day cookout with lawn games, string lights and matching team-color decorations",
    ],
    [
      "College spirit",
      "a festive campus walkway with generic pennants, a football and band instruments",
    ],
    [
      "Night at the diamond",
      "a baseball resting on the pitcher's mound beneath towering floodlights",
    ],
    [
      "Court graffiti",
      "a basketball and sneakers beside an outdoor court with colorful street-art textures",
    ],
    [
      "Retro sports lounge",
      "a retro game-day lounge with leather chairs, snack bowls and vintage sports equipment",
    ],
    ["Ice and motion", "hockey skates carving a sweeping trail across luminous arena ice"],
    ["Center-court tennis", "a tennis racket and ball beside a crisp net with sunlit court lines"],
    [
      "Volleyball rally",
      "a volleyball above a beach court with a net, palm trees and a vivid sunset",
    ],
    ["Golf clubhouse", "a golf ball and putter near a flag with a welcoming clubhouse beyond"],
    [
      "Race-day roar",
      "race cars entering a sweeping turn with checkered flags and bright grandstands",
    ],
    [
      "Locker-room buildup",
      "a dramatic football locker with a helmet, jersey and directional overhead light",
    ],
    ["Tunnel entrance", "a sports ball in a stadium tunnel opening onto a brilliantly lit field"],
    [
      "Pennant party",
      "layered fabric pennants over a festive game-day snack table with a ball at center",
    ],
    [
      "Rugby afternoon",
      "a rugby ball on a grassy field with tall goalposts and lively generic banners",
    ],
    [
      "Pickleball social",
      "colorful paddles and a ball beside a sunny pickleball court with festive bunting",
    ],
  ],
  "Open house": [
    [
      "Sunlit entry",
      "an open front door leading into a bright entryway with fresh flowers and warm wood",
    ],
    [
      "Modern architecture",
      "a contemporary house with sculptural landscaping, broad windows and welcoming evening light",
    ],
    [
      "Garden courtyard",
      "an open courtyard gate revealing flowering plants, tiled paths and a sunlit fountain",
    ],
    [
      "Coastal residence",
      "an airy coastal house with open shutters, sea grass and a wide welcoming porch",
    ],
    [
      "Historic charm",
      "a beautifully restored entrance with carved wood, antique lamps and lush planters",
    ],
    [
      "Creative studio",
      "an artist's open studio with easels, ceramics and sunlight through tall windows",
    ],
    [
      "Design showroom",
      "a curated showroom with sculptural furniture, material samples and elegant floral displays",
    ],
    [
      "School welcome",
      "an inviting school entry with colorful student-art displays and a bright courtyard",
    ],
    [
      "Office opening",
      "a welcoming office reception with plants, modern seating and soft architectural lighting",
    ],
    [
      "Garden nursery",
      "a plant nursery entrance overflowing with blooms, pots and softly lit greenhouse arches",
    ],
    ["Mountain home", "a welcoming mountain cabin with timber details, lanterns and distant peaks"],
    ["City loft", "an airy loft with tall factory windows, modern furniture and a skyline beyond"],
    [
      "Poolside property",
      "a modern home opening onto a sparkling pool with lush planting and sun loungers",
    ],
    [
      "Bakery welcome",
      "an inviting bakery doorway with pastry displays, warm light and fresh flowers",
    ],
    [
      "Boutique opening",
      "a boutique storefront with elegant displays, fabric textures and a flower-framed doorway",
    ],
    [
      "Country estate",
      "a tree-lined approach to a country house with broad lawns and an inviting porch",
    ],
    [
      "Gallery afternoon",
      "an art gallery entrance with sculptural displays, flowers and soft directional light",
    ],
    [
      "Lakeside home",
      "a welcoming lake house with a wooden deck, comfortable chairs and water reflections",
    ],
    [
      "Community welcome",
      "a community hall with open doors, welcoming tables and cheerful flower arrangements",
    ],
    [
      "Glasshouse tour",
      "a sunlit glasshouse with winding paths, layered tropical plants and inviting benches",
    ],
    [
      "Autumn visit",
      "a handsome front porch with seasonal leaves, pumpkins and warm interior light",
    ],
    [
      "Winter doorway",
      "a welcoming doorway with evergreen garlands, snowy steps and glowing lanterns",
    ],
    [
      "Desert modern",
      "a modern desert house with warm stone, sculptural cacti and long evening shadows",
    ],
    [
      "Workshop welcome",
      "a tidy craft workshop with handmade objects, wooden workbenches and warm task lamps",
    ],
    [
      "Rooftop reception",
      "an inviting rooftop terrace with comfortable seating, trees and a glowing skyline",
    ],
  ],
  "General event": [
    [
      "Garden brunch",
      "a lush garden brunch table with fruit, pastries and flowers beneath dappled sunlight",
    ],
    [
      "Rooftop evening",
      "a stylish rooftop gathering with lanterns, sculptural plants and a sparkling skyline",
    ],
    [
      "Beach bonfire",
      "a welcoming bonfire on a quiet beach with blankets, lanterns and rolling waves",
    ],
    [
      "Movie under the stars",
      "an outdoor cinema with comfortable cushions, popcorn and a blank screen under fairy lights",
    ],
    [
      "Art night",
      "a creative table filled with paints, brushes and unfinished canvases in a warm studio",
    ],
    [
      "Community picnic",
      "a cheerful picnic in a leafy park with woven baskets and colorful blankets",
    ],
    ["Dinner gathering", "a long dinner table with candles, linen and abundant seasonal flowers"],
    [
      "Music in the garden",
      "a small garden stage with acoustic instruments, flowers and glowing string lights",
    ],
    ["Book club", "a cozy reading nook with stacks of books, tea and a vase of fresh flowers"],
    [
      "Tropical social",
      "a poolside gathering with palm leaves, bright flowers and patterned umbrellas",
    ],
    [
      "Winter gathering",
      "a welcoming lodge with a crackling fireplace, evergreen branches and warm lanterns",
    ],
    ["Autumn harvest", "a rustic gathering table with pumpkins, orchard fruit and glowing candles"],
    [
      "Spring celebration",
      "a flowering garden pavilion with soft ribbons, fresh greenery and a festive table",
    ],
    [
      "Summer sail",
      "a sailboat deck set for a gathering with striped cushions and brilliant ocean light",
    ],
    ["Disco night", "a mirrored disco ball above a colorful dance floor with shimmering curtains"],
    [
      "Coffee and conversation",
      "a welcoming cafe table with steaming cups, pastries and morning window light",
    ],
    [
      "Game night",
      "a cozy table with board-game pieces, playing cards and snack bowls beneath warm lamps",
    ],
    [
      "Wellness morning",
      "a serene garden deck with rolled yoga mats, soft towels and sunrise light",
    ],
    [
      "Mountain adventure",
      "a gathering of tents beside a mountain lake with pine trees and glowing lanterns",
    ],
    [
      "Gallery evening",
      "an elegant art gallery with modern sculptures, flowers and softly lit gathering spaces",
    ],
    [
      "Neighborhood cookout",
      "a backyard grill beside a long picnic table with bunting and warm evening light",
    ],
    [
      "Charity gala",
      "a grand celebration hall with dramatic floral installations, chandeliers and candlelit tables",
    ],
    [
      "Creative workshop",
      "a welcoming worktable with pottery tools, textured materials and fresh greenery",
    ],
    [
      "Desert stargazing",
      "a cozy circle of cushions and lanterns among dunes beneath a spectacular starry sky",
    ],
    [
      "Lantern festival",
      "a garden path lined with glowing lanterns leading to a beautifully decorated pavilion",
    ],
  ],
} as const satisfies Record<LiveCardEventType, readonly Scene[]>;

type Finish = readonly [label: string, palette: string, medium: string, style: string];
const FINISHES: readonly Finish[] = [
  [
    "Lilac & gold",
    "lilac, deep plum and warm gold",
    "a richly layered gouache illustration with luminous highlights",
    "Gouache",
  ],
  [
    "Coral & teal",
    "coral, deep teal and warm ivory",
    "a cinematic digital painting with atmospheric depth",
    "Cinematic",
  ],
  [
    "Rose & sage",
    "dusty rose, sage green and cream",
    "a detailed watercolor with delicate pigment textures",
    "Watercolor",
  ],
  [
    "Midnight & pearl",
    "midnight blue, pearl and silver",
    "an editorial photograph with dramatic pools of light",
    "Photography",
  ],
  [
    "Peach & emerald",
    "peach, emerald and soft gold",
    "a dimensional paper sculpture with tactile layers and gentle shadows",
    "Paper art",
  ],
  [
    "Navy & copper",
    "navy, copper and warm cream",
    "a cinematic digital painting with glowing highlights",
    "Cinematic",
  ],
  [
    "Mint & apricot",
    "mint, apricot and deep forest green",
    "a richly layered gouache illustration with visible brushwork",
    "Gouache",
  ],
  [
    "Sky & amber",
    "sky blue, amber and ivory",
    "a dimensional paper sculpture with tactile layers and directional light",
    "Paper art",
  ],
  [
    "Teal & silver",
    "deep teal, silver and soft white",
    "an editorial photograph with atmospheric depth and soft reflections",
    "Photography",
  ],
  [
    "Sage & ochre",
    "sage, ochre and warm ivory",
    "a detailed watercolor with luminous washes and fine natural textures",
    "Watercolor",
  ],
];
const REVEAL_FINISHES: readonly Finish[] = [
  [
    "Rose & sky",
    "rose pink and sky blue in equal measure, with ivory accents",
    "a richly layered watercolor with soft luminous washes",
    "Watercolor",
  ],
  [
    "Blue & blush",
    "powder blue and blush pink in equal measure, with pearl accents",
    "a dimensional paper sculpture with tactile layers and gentle shadows",
    "Paper art",
  ],
];
const BALANCED_CATEGORIES = new Set<LiveCardEventType>([
  "Birthday",
  "Baby shower",
  "Gender reveal",
  "Graduation",
]);

function buildBank(category: LiveCardEventType): readonly LiveCardDesignSuggestion[] {
  return SCENES[category].flatMap(([title, scene], index) =>
    [0, 1].map((variant) => {
      const audience = BALANCED_CATEGORIES.has(category)
        ? variant === 0
          ? "girl"
          : "boy"
        : "everyone";
      const [label, palette, medium, style] =
        category === "Gender reveal"
          ? REVEAL_FINISHES[variant]
          : FINISHES[(index % 5) + variant * 5];
      const occasion =
        audience === "everyone" || category === "Gender reveal"
          ? category.toLowerCase()
          : `${category.toLowerCase()} for a ${audience}`;
      const revealDirection =
        category === "Gender reveal"
          ? " Give the girl and boy motifs equal prominence; keep the surprise concealed, with no revealed result or announcement."
          : "";
      return {
        id: `${category}-${index}-${variant}`,
        theme: `${category}-${index}`,
        title,
        summary: `${label} · ${style}`,
        audience,
        prompt: `Design ${/^[aeiou]/i.test(occasion) ? "an" : "a"} ${occasion} Live Card featuring ${scene}. Use ${palette}, rendered as ${medium}. Keep a clear focal subject, layered surroundings and intentional lighting, with a naturally readable title pocket.${revealDirection}`,
      };
    }),
  );
}

export const LIVE_CARD_DESIGN_SUGGESTIONS = Object.fromEntries(
  (Object.keys(SCENES) as LiveCardEventType[]).map((category) => [category, buildBank(category)]),
) as Record<LiveCardEventType, readonly LiveCardDesignSuggestion[]>;

/** Four different scenes, evenly balanced where relevant, with no immediate repeats. */
export function pickLiveCardDesignSuggestions(
  category: LiveCardEventType,
  previousIds: readonly string[] = [],
  random: () => number = Math.random,
): LiveCardDesignSuggestion[] {
  const bank = LIVE_CARD_DESIGN_SUGGESTIONS[category];
  const previousThemes = new Set(
    bank.filter((idea) => previousIds.includes(idea.id)).map((idea) => idea.theme),
  );
  let pool = bank.filter((idea) => !previousThemes.has(idea.theme));
  const chosen: LiveCardDesignSuggestion[] = [];
  const take = (audience?: LiveCardDesignSuggestion["audience"]) => {
    const candidates = audience ? pool.filter((idea) => idea.audience === audience) : pool;
    const idea = candidates[Math.floor(random() * candidates.length)];
    if (!idea) return;
    chosen.push(idea);
    pool = pool.filter((candidate) => candidate.theme !== idea.theme);
  };
  if (BALANCED_CATEGORIES.has(category)) {
    take("girl");
    take("boy");
    take("girl");
    take("boy");
  }
  while (chosen.length < 4 && pool.length) take();
  // Shuffle presentation order so neither audience always appears first.
  for (let index = chosen.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [chosen[index], chosen[other]] = [chosen[other], chosen[index]];
  }
  return chosen;
}
