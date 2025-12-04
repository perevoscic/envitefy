export const FONTS = {
  playfair: { name: "Playfair Display", preview: "var(--font-playfair)" },
  montserrat: { name: "Montserrat", preview: "var(--font-montserrat)" },
  poppins: { name: "Poppins", preview: "var(--font-poppins)" },
  dancing: { name: "Dancing Script", preview: "var(--font-dancing)" },
  allura: { name: "Allura", preview: "var(--font-allura)" },
  parisienne: { name: "Parisienne", preview: "var(--font-parisienne)" },
  indieFlower: { name: "Indie Flower", preview: "var(--font-indie-flower)" },
  shadowsIntoLight: {
    name: "Shadows Into Light",
    preview: "var(--font-shadows-into-light)",
  },
  kalam: { name: "Kalam", preview: "var(--font-kalam)" },
  sofia: { name: "Sofia", preview: "var(--font-sofia)" },
  sonsieOne: { name: "Sonsie One", preview: "var(--font-sonsie-one)" },
  styleScript: { name: "Style Script", preview: "var(--font-style-script)" },
  tangerine: { name: "Tangerine", preview: "var(--font-tangerine)" },
  yellowtail: { name: "Yellowtail", preview: "var(--font-yellowtail)" },
  alexBrush: { name: "Alex Brush", preview: "var(--font-alex-brush)" },
  cookie: { name: "Cookie", preview: "var(--font-cookie)" },
  courgette: { name: "Courgette", preview: "var(--font-courgette)" },
  redressed: { name: "Redressed", preview: "var(--font-redressed)" },
  satisfy: { name: "Satisfy", preview: "var(--font-satisfy)" },
  sacramento: { name: "Sacramento", preview: "var(--font-sacramento)" },
  amita: { name: "Amita", preview: "var(--font-amita)" },
  arizonia: { name: "Arizonia", preview: "var(--font-arizonia)" },
  euphoriaScript: {
    name: "Euphoria Script",
    preview: "var(--font-euphoria-script)",
  },
  laBelleAurore: {
    name: "La Belle Aurore",
    preview: "var(--font-la-belle-aurore)",
  },
  kaushanScript: {
    name: "Kaushan Script",
    preview: "var(--font-kaushan-script)",
  },
  monteCarlo: { name: "MonteCarlo", preview: "var(--font-monte-carlo)" },
};


export const FONT_SIZES = {
  small: {
    h1: "text-2xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    body: "text-sm",
  },
  medium: {
    h1: "text-3xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    body: "text-base",
  },
  large: {
    h1: "text-4xl md:text-6xl",
    h2: "text-4xl md:text-5xl",
    body: "text-lg",
  },
};


export const PROFESSIONAL_THEMES = [
  {
    id: "rainbow_confetti_splash",
    themeName: "Rainbow Confetti Splash",
    description:
      "Bright rainbow confetti bursting across the top for a fun celebration vibe.",
    headerIllustrationPrompt:
      "Rainbow ribbons, colorful confetti, and pastel balloons arranged in a cheerful birthday scene on a clean white background.",
    cornerAccentPrompt: "colorful confetti clusters in both top corners",
    backgroundPrompt: "light pastel rainbow wash with subtle grain",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#fdebed",
      "#fff6d6",
      "#e6f7ff",
      "#d4e8ff",
      "#ffffff",
    ],
  },
  {
    id: "balloon_bouquet_arch",
    themeName: "Balloon Bouquet Arch",
    description:
      "Soft pastel balloons creating a festive arch over the header.",
    headerIllustrationPrompt:
      "A tall balloon arch, floating balloons, and curling ribbons forming a playful celebration scene on a white background.",
    cornerAccentPrompt: "curled ribbon balloon corner clusters",
    backgroundPrompt: "soft sky-blue watercolor texture",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#e7f5ff",
      "#fde5f2",
      "#fdf0da",
      "#d8e9e5",
      "#ffffff",
    ],
  },
  {
    id: "sparkle_starburst",
    themeName: "Sparkle Starburst",
    description:
      "Starburst sparkles for magical and whimsical birthday energy.",
    headerIllustrationPrompt:
      "Glittering stars, sparkling bursts, and metallic streamers creating a bright starburst theme on a white background.",
    cornerAccentPrompt: "tiny star clusters in metallic gold",
    backgroundPrompt: "cream-to-blush gradient with sparkly dust",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Nunito",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#fff8f0",
      "#fde4d7",
      "#f5cfc3",
      "#f0b8a8",
      "#ffffff",
    ],
  },
  {
    id: "pastel_party_animals",
    themeName: "Pastel Party Animals",
    description:
      "Watercolor party animals with hats and confetti for kids' birthdays.",
    headerIllustrationPrompt:
      "Pastel-colored bunny, bear, and lion characters celebrating together on a soft white background.",
    cornerAccentPrompt: "tiny pastel animal footprints",
    backgroundPrompt: "mint watercolor wash with subtle texture",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#def7f3",
      "#fceae3",
      "#ffe8f1",
      "#e8f0ff",
      "#ffffff",
    ],
  },
  {
    id: "glitter_pink_celebration",
    themeName: "Glitter Pink Celebration",
    description: "Pink glitter accents perfect for glamorous birthday themes.",
    headerIllustrationPrompt:
      "A pink glitter heart, sparkly bow, and glossy pink balloons arranged festively on a white background.",
    cornerAccentPrompt: "rose glitter corner dust",
    backgroundPrompt: "light pink glitter-textured gradient",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#ffeaf4",
      "#ffd0e4",
      "#ffaac9",
      "#e57aa4",
      "#ffffff",
    ],
  },
  {
    id: "blue_gold_birthday_luxe",
    themeName: "Blue & Gold Birthday Luxe",
    description:
      "Royal blue paired with gold foil for elevated birthday styling.",
    headerIllustrationPrompt:
      "Blue balloons, gold confetti, and a small gold crown arranged in a luxury birthday style on a white background.",
    cornerAccentPrompt: "gold foil geometric corners",
    backgroundPrompt: "deep blue watercolor texture",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#0d1b3d",
      "#132c55",
      "#364e78",
      "#d8b878",
      "#ffffff",
    ],
  },
  {
    id: "sunset_sherbet_glow",
    themeName: "Sunset Sherbet Glow",
    description: "Warm sunset gradient with floating balloons across the top.",
    headerIllustrationPrompt:
      "Glowing sunset sky with orange, pink, and violet clouds plus soft bokeh lights for a dreamy celebration.",
    cornerAccentPrompt: "tiny gold sparkles and confetti dust",
    backgroundPrompt: "orange-to-pink watercolor sunset gradient",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Montserrat",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#ff8a3d",
      "#ff5f6d",
      "#c850c0",
      "#f9d976",
      "#fff3e0",
    ],
  },
  {
    id: "aurora_dream",
    themeName: "Aurora Dream",
    description:
      "Cool aurora gradients with soft shimmer for a night-sky vibe.",
    headerIllustrationPrompt:
      "Northern-lights ribbon waves in teal, cyan, and magenta over a calm night sky with subtle stars.",
    cornerAccentPrompt: "faint star clusters with teal glow",
    backgroundPrompt: "mint and lavender watercolor gradient",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#0fd3c3",
      "#6a7cff",
      "#b066ff",
      "#0a1c3f",
      "#e5f5ff",
    ],
  },
  {
    id: "midnight_neon",
    themeName: "Midnight Neon",
    description: "Dark indigo base with neon gradients and glow lines.",
    headerIllustrationPrompt:
      "Dark indigo-to-black gradient with neon magenta and cyan light trails and tiny star sparks.",
    cornerAccentPrompt: "neon cyan and magenta corner strokes",
    backgroundPrompt: "black backdrop with glowing neon gradients",
    typography: {
      headingFont: "Montserrat",
      bodyFont: "Montserrat",
      accentFont: "Sofia",
    },
    recommendedColorPalette: [
      "#0b1224",
      "#121c40",
      "#08d9d6",
      "#ff2e63",
      "#fefefe",
    ],
  },
  {
    id: "citrus_splash",
    themeName: "Citrus Splash",
    description:
      "Fresh lime, lemon, and tangerine gradients for upbeat parties.",
    headerIllustrationPrompt:
      "Citrus slices and leaves with juicy watercolor splashes in lime, lemon, and orange hues.",
    cornerAccentPrompt: "tiny citrus slice confetti in lime and orange",
    backgroundPrompt: "aqua watercolor gradient with ripple texture",
    typography: {
      headingFont: "Raleway",
      bodyFont: "Montserrat",
      accentFont: "Satisfy",
    },
    recommendedColorPalette: [
      "#d7f75b",
      "#f8d94e",
      "#ffb347",
      "#0fb28a",
      "#ffffff",
    ],
  },
  {
    id: "cotton_candy_fields",
    themeName: "Cotton Candy Fields",
    description: "Pastel rainbow gradient with soft grain and airy sparkles.",
    headerIllustrationPrompt:
      "Pastel pink and baby blue clouds with light gold sparkles drifting across a soft sky.",
    cornerAccentPrompt: "hazy pastel color mist in both corners",
    backgroundPrompt: "soft pastel rainbow gradient with grain texture",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Poppins",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#ffd3ec",
      "#c5e1ff",
      "#c7ffd8",
      "#ffe9b3",
      "#ffffff",
    ],
  },
  {
    id: "dinosaur_adventure_watercolor",
    themeName: "Dinosaur Adventure",
    description:
      "Cute dinosaurs in watercolor style marching across the header.",
    headerIllustrationPrompt:
      "A friendly T-rex, happy triceratops, and a cartoon volcano with smoke, all on a clean white background.",
    cornerAccentPrompt: "small dino tracks in corners",
    backgroundPrompt: "light sandy watercolor texture",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Nunito",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#faf3e7",
      "#e2f5e5",
      "#dbeeef",
      "#ffe3cc",
      "#ffffff",
    ],
  },
  {
    id: "outer_space_blast",
    themeName: "Outer Space Blast",
    description:
      "Cosmic theme with rockets, stars, and planets in watercolor style.",
    headerIllustrationPrompt:
      "A rocket ship, cute astronaut, and colorful planets floating together on a crisp white background.",
    cornerAccentPrompt: "tiny star clusters in navy and gold",
    backgroundPrompt: "deep navy watercolor night-sky texture",
    typography: {
      headingFont: "EB Garamond",
      bodyFont: "Inter",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#0a1230",
      "#1d2952",
      "#3f4f78",
      "#f0c36f",
      "#ffffff",
    ],
  },
  {
    id: "mermaid_sparkle_waves",
    themeName: "Mermaid Sparkle Waves",
    description: "Shimmering mermaid tails and watercolor waves.",
    headerIllustrationPrompt:
      "A shimmering mermaid tail, pastel seashells, and starfish forming a magical undersea scene on a white background.",
    cornerAccentPrompt: "pearlescent shell corners",
    backgroundPrompt: "aqua watercolor gradient with shimmer",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Nunito",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#dff8ff",
      "#cde9f7",
      "#bad7ef",
      "#8db0c9",
      "#ffffff",
    ],
  },
  {
    id: "construction_zone_party",
    themeName: "Construction Zone Party",
    description:
      "Watercolor trucks, cones, and stripes for a construction-themed birthday.",
    headerIllustrationPrompt:
      "A bright dump truck, orange traffic cone, and caution sign arranged in a construction theme on a white background.",
    cornerAccentPrompt: "mini cones or caution stripe corners",
    backgroundPrompt: "light gray concrete-like watercolor texture",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#f4f4f4",
      "#ffd972",
      "#e9b34c",
      "#333333",
      "#ffffff",
    ],
  },
  {
    id: "unicorn_dreamland",
    themeName: "Unicorn Dreamland",
    description: "Soft pastel unicorns with dreamy clouds and stars.",
    headerIllustrationPrompt:
      "A magical unicorn standing beside soft clouds and a pastel rainbow on a clean white background.",
    cornerAccentPrompt: "star and cloud corners",
    backgroundPrompt: "pastel purple-pink watercolor blend",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#f8eaff",
      "#f6d7ff",
      "#eebcff",
      "#d8a8ff",
      "#ffffff",
    ],
  },
  {
    id: "sports_all_star",
    themeName: "Sports All-Star",
    description: "Watercolor soccer balls, basketballs, and stars.",
    headerIllustrationPrompt:
      "Soccer ball, baseball glove, and a gold trophy arranged in an all-star sports theme on a white background.",
    cornerAccentPrompt: "small sports icon corners",
    backgroundPrompt: "cool gray watercolor texture with faint stripes",
    typography: {
      headingFont: "EB Garamond",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#f1f1f1",
      "#dfe4e9",
      "#bcc9d4",
      "#7d8fa3",
      "#ffffff",
    ],
  },
  {
    id: "floral_garden_birthday",
    themeName: "Floral Garden Birthday",
    description:
      "Elegant watercolor florals suitable for adult birthday celebrations.",
    headerIllustrationPrompt:
      "Roses, daisies, and butterflies arranged in a soft floral birthday style on a white background.",
    cornerAccentPrompt: "floral botanical corners",
    backgroundPrompt: "cream paper texture with soft floral shadows",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#fff7f2",
      "#fae0d6",
      "#e7b6a6",
      "#be8d7c",
      "#ffffff",
    ],
  },
  {
    id: "royal_purple_celebration",
    themeName: "Royal Purple Celebration",
    description:
      "Rich purple tones with gold embellishment for a luxury birthday theme.",
    headerIllustrationPrompt:
      "A royal crown, purple balloons, and a small gold scepter displayed on a white background.",
    cornerAccentPrompt: "gold foil corners with micro filigree",
    backgroundPrompt: "deep purple textured gradient",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#2c1a39",
      "#4c2b5a",
      "#734686",
      "#d1b07d",
      "#ffffff",
    ],
  },
  {
    id: "circus_big_top",
    themeName: "Circus Big Top",
    description: "Classic circus-style watercolor stripes and festive icons.",
    headerIllustrationPrompt:
      "A colorful circus tent, clown-themed balloon, and popcorn bucket arranged on a white background.",
    cornerAccentPrompt: "circus star corners",
    backgroundPrompt: "red-and-cream faded circus stripes in watercolor",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Inter",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#fff5ef",
      "#f2e0da",
      "#e3b9ad",
      "#cc7a66",
      "#ffffff",
    ],
  },
  {
    id: "rainbow_sprinkle_cake",
    themeName: "Rainbow Sprinkle Cake",
    description:
      "A watercolor sprinkle cake surrounded by bright rainbow accents.",
    headerIllustrationPrompt:
      "Rainbow sprinkles, cute birthday cake, and colorful candles displayed on a clean white background.",
    cornerAccentPrompt: "rainbow sprinkle corner clusters",
    backgroundPrompt: "soft pastel rainbow gradient with grain texture",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#fff2f2",
      "#ffdfef",
      "#eaf8ff",
      "#f7ffd9",
      "#ffffff",
    ],
  },
  {
    id: "golden_age_celebration",
    themeName: "Golden Age Celebration",
    description: "Gold confetti on black with an elegant adult birthday style.",
    headerIllustrationPrompt:
      "Golden balloons, gold ribbon, and elegant clinking champagne glasses (empty) on a white background.",
    cornerAccentPrompt: "gold dusted corner flares",
    backgroundPrompt: "black-to-charcoal gradient with shimmering gold dust",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#1a1a1a",
      "#333333",
      "#e3c56e",
      "#bba256",
      "#ffffff",
    ],
  },
  {
    id: "tropical_fiesta",
    themeName: "Tropical Fiesta",
    description:
      "Bright watercolor tropical leaves and fruits for a summer vibe.",
    headerIllustrationPrompt:
      "A pineapple, bright palm leaves, and a cute toucan arranged in a tropical fiesta theme on a white background.",
    cornerAccentPrompt: "tropical leaves in top corners",
    backgroundPrompt: "pale sand watercolor wash",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Nunito",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#fff4e8",
      "#fbe6d4",
      "#f2d8a7",
      "#89b97c",
      "#ffffff",
    ],
  },
  {
    id: "galaxy_neon_party",
    themeName: "Galaxy Neon Party",
    description:
      "Bright neon elements on a galaxy backdrop for teens and adults.",
    headerIllustrationPrompt:
      "Neon planets, glowing cosmic rings, and vibrant neon stars floating on a white background.",
    cornerAccentPrompt: "neon pink and blue corner starbursts",
    backgroundPrompt: "dark indigo-to-black gradient with star speckles",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Inter",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#060a1e",
      "#121c3a",
      "#283766",
      "#ff76e1",
      "#61d0ff",
    ],
  },
  {
    id: "under_the_sea",
    themeName: "Under the Sea",
    description:
      "Watercolor sea creatures and bubbles for ocean-themed birthdays.",
    headerIllustrationPrompt:
      "A happy fish, coral branches, and a cute sea turtle swimming together on a white background.",
    cornerAccentPrompt: "bubble corner clusters",
    backgroundPrompt: "aqua watercolor gradient with ripple texture",
    typography: {
      headingFont: "EB Garamond",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#e7f8ff",
      "#c8e6f2",
      "#98c7e2",
      "#5c93b8",
      "#ffffff",
    ],
  },
  {
    id: "retro_80s_neon",
    themeName: "Retro 80s Neon",
    description: "Bold geometric neon shapes inspired by 80s retro parties.",
    headerIllustrationPrompt:
      "A retro cassette tape, neon grid shapes, and a colorful boombox arranged on a white background.",
    cornerAccentPrompt: "neon triangles and squiggles",
    backgroundPrompt: "black backdrop with glowing neon gradients",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#0c0c0c",
      "#ff63b5",
      "#00f5e1",
      "#e0f070",
      "#ffffff",
    ],
  },
  {
    id: "little_explorer",
    themeName: "Little Explorer",
    description: "Adventure-themed watercolor compass, map, and binoculars.",
    headerIllustrationPrompt:
      "A child-sized compass, small binoculars, and explorer backpack arranged on a white background.",
    cornerAccentPrompt: "footprint trail corners",
    backgroundPrompt: "beige map-textured watercolor background",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Nunito",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#f8f1e0",
      "#e4d3ae",
      "#c7b88a",
      "#917e60",
      "#ffffff",
    ],
  },
  {
    id: "butterfly_bloom",
    themeName: "Butterfly Bloom",
    description: "Pastel butterflies and florals fluttering across the header.",
    headerIllustrationPrompt:
      "Colorful butterflies, soft flowers, and delicate vines arranged gracefully on a white background.",
    cornerAccentPrompt: "tiny floral and butterfly corners",
    backgroundPrompt: "soft lilac watercolor wash",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#f7f1fa",
      "#eedaf2",
      "#d7b4e2",
      "#9c7eb6",
      "#ffffff",
    ],
  },
  {
    id: "camping_night",
    themeName: "Camping Night",
    description: "Campfire, tents, and stars for an outdoor-themed birthday.",
    headerIllustrationPrompt:
      "A cute tent, friendly campfire illustration (no flames touching), and a lantern on a white background.",
    cornerAccentPrompt: "forest silhouette corners",
    backgroundPrompt: "navy blue night-sky watercolor texture",
    typography: {
      headingFont: "EB Garamond",
      bodyFont: "Inter",
      accentFont: "Tangerine",
    },
    recommendedColorPalette: [
      "#0d1a2e",
      "#23324b",
      "#4d6580",
      "#d59b58",
      "#ffffff",
    ],
  },
  {
    id: "fairy_garden_glow",
    themeName: "Fairy Garden Glow",
    description:
      "Whimsical fairy lights and pastel florals for a magical birthday.",
    headerIllustrationPrompt:
      "Delicate fairy wings, whimsical mushrooms, and soft glowing sparkles arranged on a white background.",
    cornerAccentPrompt: "tiny fairy dust clusters",
    backgroundPrompt: "mint and lavender watercolor gradient",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#f4f8f7",
      "#e5f1ec",
      "#d5e6e3",
      "#b2ccc4",
      "#ffffff",
    ],
  },
  {
    id: "farmyard_friends",
    themeName: "Farmyard Friends",
    description: "Cute watercolor farm animals with barn and hay textures.",
    headerIllustrationPrompt:
      "A happy cow, cute chicken, and small red barn arranged on a white background.",
    cornerAccentPrompt: "farm tool and hay illustrations",
    backgroundPrompt: "light tan paper texture with faint hay lines",
    typography: {
      headingFont: "EB Garamond",
      bodyFont: "Nunito",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#fff4e8",
      "#f8e4ca",
      "#e5c790",
      "#a07e52",
      "#ffffff",
    ],
  },
  {
    id: "jungle_parade",
    themeName: "Jungle Parade",
    description:
      "Watercolor jungle animals and tropical leaves marching across header.",
    headerIllustrationPrompt:
      "A playful monkey, tall giraffe, and big tropical leaves arranged on a white background.",
    cornerAccentPrompt: "tropical leaf corners",
    backgroundPrompt: "green watercolor wash with leaf silhouettes",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#edf7ec",
      "#d2ead2",
      "#b3d8b4",
      "#77a279",
      "#ffffff",
    ],
  },
  {
    id: "vintage_polaroid",
    themeName: "Vintage Polaroid",
    description:
      "Retro birthday theme with Polaroid photo frames and pastel tape art.",
    headerIllustrationPrompt:
      "A retro Polaroid frame, vintage camera, and small film strip arranged on a clean white background.",
    cornerAccentPrompt: "washi tape and sticker corners",
    backgroundPrompt: "off-white paper texture with faint grid",
    typography: {
      headingFont: "Libre Baskerville",
      bodyFont: "Lora",
      accentFont: "Parisienne",
    },
    recommendedColorPalette: [
      "#fffaf3",
      "#efe3d2",
      "#d8c6a9",
      "#a58c6e",
      "#ffffff",
    ],
  },
  {
    id: "elegant_florals_gold",
    themeName: "Elegant Florals & Gold",
    description: "Delicate pink and cream flowers paired with gold foil lines.",
    headerIllustrationPrompt:
      "Gold leaves, white roses, and an elegant floral border arranged on a white background.",
    cornerAccentPrompt: "tiny gold floral corners",
    backgroundPrompt: "soft blush watercolor texture",
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentFont: "Great Vibes",
    },
    recommendedColorPalette: [
      "#fff6f2",
      "#f7e1da",
      "#e5bca9",
      "#c48c6c",
      "#ffffff",
    ],
  },
  {
    id: "balloons_at_sunset",
    themeName: "Balloons at Sunset",
    description: "Warm sunset gradient with floating balloons across the top.",
    headerIllustrationPrompt:
      "A cluster of sunset-toned balloons with soft clouds and warm light rays, all on a clean white background.",
    cornerAccentPrompt: "balloon ribbon corners",
    backgroundPrompt: "orange-to-pink watercolor sunset gradient",
    typography: {
      headingFont: "Cormorant",
      bodyFont: "Lora",
      accentFont: "Dancing Script",
    },
    recommendedColorPalette: [
      "#fff1eb",
      "#ffd7c4",
      "#f9b28f",
      "#e58058",
      "#ffffff",
    ],
  },
];

export type ProfessionalTheme = (typeof PROFESSIONAL_THEMES)[number];


export type SimpleTemplateThemeSnapshot = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview: string;
};


export const PROFESSIONAL_THEME_CLASSES: Record<string, SimpleTemplateThemeSnapshot> =
  {
    construction_zone_party: {
      id: "construction_zone_party",
      name: "Construction Zone",
      bg: "bg-gradient-to-br from-yellow-200 via-amber-200 to-amber-400",
      text: "text-slate-900",
      accent: "text-amber-900",
      preview: "bg-amber-300",
    },
    rainbow_confetti_splash: {
      id: "rainbow_confetti_splash",
      name: "Rainbow Confetti",
      bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
      text: "text-slate-900",
      accent: "text-pink-600",
      preview: "bg-pink-200",
    },
    sparkle_starburst: {
      id: "sparkle_starburst",
      name: "Sparkle Starburst",
      bg: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-200",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-amber-200",
    },
    balloon_bouquet_arch: {
      id: "balloon_bouquet_arch",
      name: "Balloon Bouquet",
      bg: "bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-sky-200",
    },
    default: {
      id: "default",
      name: "Default",
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
      text: "text-white",
      accent: "text-white",
      preview: "bg-slate-800",
    },
  };
