// @ts-nocheck
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Heart,
  Users,
  Image as ImageIcon,
  Type,
  Palette,
  CheckSquare,
  Gift,
  Menu,
  Upload,
  Trash2,
  Cake,
  Calendar as CalendarIcon,
  Share2,
  Apple,
} from "lucide-react";
import {
  type BirthdayTemplateDefinition,
  birthdayTemplateCatalog,
} from "@/components/event-create/BirthdayTemplateGallery";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

function getTemplateById(
  id?: string | null
): BirthdayTemplateDefinition | null {
  if (!birthdayTemplateCatalog || birthdayTemplateCatalog.length === 0) {
    return null;
  }
  if (!id) return birthdayTemplateCatalog[0];
  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
  );
}

// Simplified constants - we'll expand these
const FONTS = {
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

const FONT_SIZES = {
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

const PROFESSIONAL_THEMES = [
  {
    id: "rainbow_confetti_splash",
    themeName: "Rainbow Confetti Splash",
    description:
      "Bright rainbow confetti bursting across the top for a fun celebration vibe.",
    headerIllustrationPrompt:
      "watercolor rainbow confetti splash sweeping across the header",
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
      "pastel watercolor balloons forming an arch in pink, blue, mint, and lavender",
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
      "gold and silver starburst pattern radiating across the header",
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
      "Watercolor party animals with hats and confetti for kids’ birthdays.",
    headerIllustrationPrompt:
      "watercolor giraffe, elephant, and lion wearing party hats with confetti",
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
    headerIllustrationPrompt: "pink glitter watercolor sweep with sparkles",
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
      "gold foil frame with star-like flourishes on royal-blue header",
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
    id: "dinosaur_adventure_watercolor",
    themeName: "Dinosaur Adventure",
    description:
      "Cute dinosaurs in watercolor style marching across the header.",
    headerIllustrationPrompt:
      "pastel watercolor dinosaurs with leaves and volcano icons in header",
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
      "watercolor rockets, planets, and stars forming a cosmic header",
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
      "pastel watercolor mermaid tails and glitter waves wrapping the header",
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
      "watercolor dump trucks, traffic cones, and caution stripes across header",
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
      "watercolor unicorns jumping through clouds with sparkles",
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
      "sports balls in watercolor forming a header band with stars",
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
      "lush watercolor florals in pink, peach, and cream across header",
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
      "royal purple watercolor sweep with gold foil flourishes",
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
      "circus tent, flags, and stars in watercolor forming header border",
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
      "pastel watercolor birthday cake with rainbow sprinkles and candles",
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
      "gold foil confetti falling from the top with subtle sparkles",
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
      "palm leaves, hibiscus, and citrus watercolor band",
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
      "neon streaks and stars over deep space watercolor background",
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
      "watercolor dolphins, turtles, fish, and bubbles swimming across header",
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
      "neon pink and turquoise geometric shapes layered diagonally",
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
      "watercolor compass and map with footprints and binoculars",
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
      "watercolor butterflies with pink and purple blooms in header",
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
    headerIllustrationPrompt: "watercolor tents and campfire under starry sky",
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
      "string lights with watercolor florals and fairy dust effect",
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
      "watercolor cow, pig, and rooster with barn backdrop",
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
      "lion, monkey, zebra, and giraffe with tropical leaves",
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
      "polaroid photo frames layered diagonally with confetti",
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
      "hand-painted florals with gold foil geometric frame",
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
      "balloons floating upward in peach and coral tones over horizon",
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

const DESIGN_THEMES = [
  {
    id: "super_star_gala",
    name: "Super Star Gala",
    category: "High glamour",
    bg: "bg-gradient-to-br from-black via-slate-900 to-red-900",
    text: "text-white drop-shadow-md",
    accent: "text-amber-300",
    previewColor: "bg-gradient-to-br from-black via-slate-900 to-red-900",
    previewDot: "bg-amber-400",
    aesthetic: "High glamour, red carpet event.",
    colors: "Deep black, shimmering gold, and vivid ruby red.",
    graphics:
      "Glittering stars, spotlights, and a subtle velvet texture background.",
    font: "A dramatic, elegant serif for the title.",
    primaryObjects:
      "Gold Statuettes (trophies) framing the text block. A velvet curtain backdrop with spotlights shining from the top corners.",
  },
  {
    id: "mystic_unicorn",
    name: "Mystic Unicorn",
    category: "Magical & soft",
    bg: "bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100",
    text: "text-slate-800",
    accent: "text-purple-600",
    previewColor: "bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200",
    previewDot: "bg-purple-300",
    aesthetic: "Magical, iridescent, and soft.",
    colors:
      "Pastel lavender, mint green, baby pink, and white, with an iridescent sheen.",
    graphics: "A graceful unicorn silhouette, rainbows, and sparkles.",
    font: "A whimsical, flowing script.",
    primaryObjects:
      "A shimmering Unicorn centered at the top of the invite title. Rainbow and star dust trails sweeping across the background.",
  },
  {
    id: "dinosaur_adventure",
    name: "Dinosaur Adventure",
    category: "Prehistoric jungle",
    bg: "bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-700",
    text: "text-white drop-shadow-md",
    accent: "text-amber-200",
    previewColor:
      "bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-700",
    previewDot: "bg-emerald-700",
    aesthetic: "Prehistoric jungle exploration.",
    colors: "Earthy greens, moss, burnt orange, and brown.",
    graphics:
      "Friendly T-Rex or Triceratops illustration, palm leaves, and fossil patterns.",
    font: "A bold, slightly rugged, stencil-like font.",
    primaryObjects:
      "A friendly T-Rex illustration peering in from the bottom left corner. Tropical foliage borders along the top and sides.",
  },
  {
    id: "candy_dreams",
    name: "Candy Dreams",
    category: "Sweet & playful",
    bg: "bg-gradient-to-br from-pink-100 via-yellow-100 to-purple-100",
    text: "text-fuchsia-900",
    accent: "text-pink-600",
    previewColor:
      "bg-gradient-to-br from-pink-200 via-yellow-200 to-purple-200",
    previewDot: "bg-pink-200",
    aesthetic: "Sweet, vibrant, and playful.",
    colors: "Hot pink, turquoise, sunshine yellow, and electric purple.",
    graphics:
      "Giant lollipops, swirling gummies, candy canes, and drippy frosting borders.",
    font: "A bubbly, rounded, and highly decorative font.",
    primaryObjects:
      "Giant Lollipops and ice cream cones placed as corner accents. The text is often bordered by dripping chocolate or frosting effects.",
  },
  {
    id: "deep_space_hero",
    name: "Deep Space Hero",
    category: "Cosmic adventure",
    bg: "bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700",
    text: "text-white drop-shadow-md",
    accent: "text-sky-300",
    previewColor: "bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700",
    previewDot: "bg-blue-500",
    aesthetic: "Cosmic adventure and futuristic technology.",
    colors: "Deep navy blue, black, electric blue, and silver.",
    graphics: "Starfields, planets, spaceships, and geometric, neon lines.",
    font: "A clean, bold, futuristic sans-serif.",
    primaryObjects:
      "A stylized Spaceship graphic flying across the top banner. Planets (e.g., Mars, Saturn) visible in the bottom corners of the starfield background.",
  },
  {
    id: "rainbow_sparkle",
    name: "Rainbow Sparkle",
    category: "Joyful color",
    bg: "bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200",
    text: "text-slate-800",
    accent: "text-fuchsia-600",
    previewColor: "bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200",
    previewDot: "bg-amber-300",
    aesthetic: "Joyful explosion of color.",
    colors: "Every color of the rainbow, with white to ensure readability.",
    graphics: "Arcing rainbows, clouds, and scattered glitter effects.",
    font: "A fun, slightly chunky font.",
    primaryObjects:
      "A large, arcing Rainbow stretching across the center, with small Cloud and Star emojis/graphics scattered around the main text block.",
  },
  {
    id: "pirate_treasure",
    name: "Pirate Treasure",
    category: "Swashbuckling",
    bg: "bg-gradient-to-br from-amber-200 via-amber-100 to-stone-400",
    text: "text-stone-800",
    accent: "text-amber-700",
    previewColor: "bg-gradient-to-br from-amber-200 via-amber-100 to-stone-400",
    previewDot: "bg-amber-400",
    aesthetic: "Aged parchment and swashbuckling adventure.",
    colors: "Dark browns, deep reds, sandy beige, and gold.",
    graphics:
      "Treasure map texture background, skull and crossbones, compass rose, and chest of gold.",
    font: "An old-style script font.",
    primaryObjects:
      "A rolled-up Scroll or Treasure Map texture serves as the background for the text. A small Skull and Crossbones icon is placed near the RSVP details.",
  },
  {
    id: "mermaid_lagoon",
    name: "Mermaid Lagoon",
    category: "Undersea fantasy",
    bg: "bg-gradient-to-br from-teal-200 via-cyan-100 to-purple-200",
    text: "text-slate-900",
    accent: "text-teal-700",
    previewColor: "bg-gradient-to-br from-teal-200 via-cyan-100 to-purple-200",
    previewDot: "bg-teal-300",
    aesthetic: "Undersea fantasy with shimmer.",
    colors: "Teal, seafoam green, deep purple, and pearly white.",
    graphics:
      "Detailed fish scales pattern, seashells, starfish, and shimmering bubbles.",
    font: "An elegant, slightly watery script.",
    primaryObjects:
      "A Mermaid tail emerging from the bottom center, surrounded by Seashells and bubbles. The event title is often framed by a clam shell shape.",
  },
  {
    id: "robot_invasion",
    name: "Robot Invasion",
    category: "Retro-futuristic",
    bg: "bg-gradient-to-br from-gray-200 via-slate-100 to-orange-200",
    text: "text-slate-900",
    accent: "text-orange-600",
    previewColor: "bg-gradient-to-br from-gray-200 via-slate-100 to-orange-200",
    previewDot: "bg-slate-400",
    aesthetic: "Industrial, mechanical, and retro-futuristic.",
    colors: "Metallic silver, vibrant orange, black, and light gray.",
    graphics:
      "Circuit board patterns, nuts and bolts borders, and a friendly-but-boxy robot illustration.",
    font: "A blocky, monospace font.",
    primaryObjects:
      "A friendly, angular Robot centered below the main title. Gear and circuit patterns form the background texture and border elements.",
  },
  {
    id: "fairy_garden",
    name: "Fairy Garden",
    category: "Enchanted forest",
    bg: "bg-gradient-to-br from-green-100 via-lime-100 to-pink-100",
    text: "text-emerald-900",
    accent: "text-pink-700",
    previewColor: "bg-gradient-to-br from-green-100 via-lime-100 to-pink-100",
    previewDot: "bg-green-200",
    aesthetic: "Enchanted forest, delicate and natural.",
    colors: "Soft forest green, pale yellow, moss, and blush pink.",
    graphics:
      "Intricate flower borders, whimsical mushroom caps, and tiny fairy silhouettes.",
    font: "A delicate, looping calligraphy font.",
    primaryObjects:
      "Tiny Fairy silhouettes fluttering around the main title. Intricate Flower vines and soft light orbs frame the edges of the invite.",
  },
  {
    id: "dragons_fire",
    name: "Dragon's Fire",
    category: "Medieval fantasy",
    bg: "bg-gradient-to-br from-red-900 via-amber-600 to-amber-800",
    text: "text-white drop-shadow-md",
    accent: "text-amber-300",
    previewColor: "bg-gradient-to-br from-red-900 via-amber-600 to-amber-800",
    previewDot: "bg-red-700",
    aesthetic: "Medieval fantasy, epic scale, and intensity.",
    colors: "Deep crimson, charcoal gray, fiery orange, and metallic bronze.",
    graphics:
      "A majestic dragon silhouette breathing fire, castle turrets, and rocky textures.",
    font: "A dramatic, bold, and slightly Gothic font.",
    primaryObjects:
      "A Dragon silhouette wrapping around the top edge of the invite. Fire effects emanate subtly from the bottom corners, framing the event details.",
  },
  {
    id: "jungle_safari",
    name: "Jungle Safari",
    category: "Tropical adventure",
    bg: "bg-gradient-to-br from-amber-200 via-lime-200 to-green-300",
    text: "text-emerald-900",
    accent: "text-amber-700",
    previewColor: "bg-gradient-to-br from-amber-200 via-lime-200 to-green-300",
    previewDot: "bg-green-300",
    aesthetic: "Tropical, wild, and adventurous.",
    colors: "Khaki, bright leaf green, tan, and splashes of animal print.",
    graphics:
      "Layered jungle leaves, illustrations of friendly lions, elephants, or monkeys.",
    font: "A playful, textured font.",
    primaryObjects:
      "Layered Palm Leaves and jungle vines creating a dense border around the edges. A friendly Lion or Monkey illustration peeking from the side.",
  },
  {
    id: "princess_castle",
    name: "Princess Castle",
    category: "Royal fairytale",
    bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
    text: "text-slate-800",
    accent: "text-pink-600",
    previewColor: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
    previewDot: "bg-pink-300",
    aesthetic: "Royal, elegant, and fairytale-inspired.",
    colors: "Light gold, soft pink, periwinkle blue, and white.",
    graphics:
      "A silhouette of a grand castle, ornate scrollwork borders, and tiny crowns.",
    font: "A formal, decorative script font.",
    primaryObjects:
      "A grand Castle silhouette centered at the top, acting as the main header graphic. Ornate scrollwork and tiny Crowns are used as decorative dividers.",
  },
  {
    id: "knights_quest",
    name: "Knight's Quest",
    category: "Noble & brave",
    bg: "bg-gradient-to-br from-slate-800 via-blue-800 to-red-700",
    text: "text-white drop-shadow-md",
    accent: "text-red-200",
    previewColor: "bg-gradient-to-br from-slate-800 via-blue-800 to-red-700",
    previewDot: "bg-slate-700",
    aesthetic: "Brave, noble, and historical.",
    colors: "Silver, deep blue, deep red, and slate gray.",
    graphics:
      "A heraldic shield/crest, crossed swords, and chainmail texture background.",
    font: "A strong, imposing serif font.",
    primaryObjects:
      "A large Heraldic Shield or Crest placed slightly behind the main title text (as a watermark). Crossed Swords used as a decorative element near the date/time.",
  },
  {
    id: "monster_mash",
    name: "Monster Mash",
    category: "Friendly spooky",
    bg: "bg-gradient-to-br from-lime-200 via-purple-200 to-gray-800",
    text: "text-white drop-shadow-md",
    accent: "text-lime-200",
    previewColor: "bg-gradient-to-br from-lime-200 via-purple-200 to-gray-800",
    previewDot: "bg-lime-400",
    aesthetic: "Slightly spooky, silly, and friendly frights.",
    colors: "Lime green, deep purple, black, and glow-in-the-dark white.",
    graphics:
      "Cute, fuzzy, multi-eyed monsters, and abstract ooze/slime effects.",
    font: "A slightly wobbly or handwritten horror-style font.",
    primaryObjects:
      "Cute, fuzzy Monsters acting as border elements, peeking from the top and bottom. Silly green slime or abstract spots dripping from the header.",
  },
  {
    id: "sunny_beach_bash",
    name: "Sunny Beach Bash",
    category: "Tropical chill",
    bg: "bg-gradient-to-br from-yellow-200 via-orange-200 to-sky-200",
    text: "text-orange-900",
    accent: "text-sky-700",
    previewColor: "bg-gradient-to-br from-yellow-200 via-orange-200 to-sky-200",
    previewDot: "bg-amber-300",
    aesthetic: "Relaxed, tropical, and bright.",
    colors: "Turquoise water, sandy yellow, coral pink, and sunset orange.",
    graphics:
      "Palm trees, flip-flops, sunglasses, beach balls, and wave patterns.",
    font: "A casual, hand-drawn font.",
    primaryObjects:
      "Palm Trees on the sides, casting shadows on the sandy background. A graphic of Ocean Waves along the bottom edge, where the party location is listed.",
  },
  {
    id: "winter_wonderland",
    name: "Winter Wonderland",
    category: "Icy & serene",
    bg: "bg-gradient-to-br from-blue-50 via-blue-100 to-slate-200",
    text: "text-slate-800",
    accent: "text-sky-700",
    previewColor: "bg-gradient-to-br from-blue-50 via-blue-100 to-slate-200",
    previewDot: "bg-blue-200",
    aesthetic: "Icy, serene, and sparkling.",
    colors: "Icy blue, silver, crisp white, and deep navy.",
    graphics:
      "Detailed snowflakes, frost patterns, bare tree silhouettes, and swirling snow effects.",
    font: "A thin, delicate serif or an elegant script font.",
    primaryObjects:
      "Large, detailed Snowflakes falling across the page. A subtle, frosted border and bare Tree silhouettes visible in the background texture.",
  },
  {
    id: "mad_scientist_lab",
    name: "Mad Scientist Lab",
    category: "Chaotic lab",
    bg: "bg-gradient-to-br from-lime-200 via-yellow-200 to-cyan-200",
    text: "text-slate-900",
    accent: "text-lime-700",
    previewColor: "bg-gradient-to-br from-lime-200 via-yellow-200 to-cyan-200",
    previewDot: "bg-lime-300",
    aesthetic: "Energetic, chaotic, and experimental.",
    colors: "Neon green, bright yellow, black, and beaker-blue.",
    graphics:
      "Bubbling test tubes, atomic symbols, lightning bolts, and safety signs.",
    font: "A bold, industrial, or slightly erratic distressed font.",
    primaryObjects:
      "Beakers and Test Tubes placed as icons near the event location or details. Lightning bolts or radiation symbols are used as divider lines.",
  },
  {
    id: "llama_fiesta",
    name: "Llama Fiesta",
    category: "Festive & vibrant",
    bg: "bg-gradient-to-br from-pink-200 via-orange-200 to-emerald-200",
    text: "text-orange-900",
    accent: "text-pink-700",
    previewColor:
      "bg-gradient-to-br from-pink-200 via-orange-200 to-emerald-200",
    previewDot: "bg-pink-300",
    aesthetic: "Vibrant, celebratory, and charmingly fuzzy.",
    colors:
      "Fusia, turquoise, orange, and lime green (inspired by Peruvian textiles).",
    graphics:
      "A smiling llama wearing a colorful blanket/sombrero, confetti, and geometric patterns.",
    font: "A playful, bold, and rounded font.",
    primaryObjects:
      "A Llama wearing a festive blanket, centered below the main title. Colorful paper 'Picado' (banners) draped across the top edge.",
  },
  {
    id: "panda_zen",
    name: "Panda Zen",
    category: "Calm minimal",
    bg: "bg-gradient-to-br from-white via-gray-100 to-green-200",
    text: "text-slate-800",
    accent: "text-emerald-600",
    previewColor: "bg-gradient-to-br from-white via-gray-100 to-green-200",
    previewDot: "bg-emerald-400",
    aesthetic: "Calm, minimalist, and bamboo forest inspired.",
    colors: "Black, white, various shades of natural green, and warm gray.",
    graphics:
      "Simple, cute panda illustrations, bamboo stalks, and subtle watercolor effects.",
    font: "A clean, minimalist, and highly readable sans-serif font.",
    primaryObjects:
      "A small, seated Panda illustration in the bottom corner. Bamboo stalks used as simple, vertical dividing elements or background textures.",
  },
  {
    id: "doggy_pawty",
    name: "Doggy Pawty",
    category: "Energetic pups",
    bg: "bg-gradient-to-br from-yellow-100 via-red-100 to-blue-100",
    text: "text-slate-800",
    accent: "text-blue-700",
    previewColor: "bg-gradient-to-br from-yellow-100 via-red-100 to-blue-100",
    previewDot: "bg-yellow-200",
    aesthetic: "Energetic, fun, and tail-wagging.",
    colors:
      "Primary colors (red, blue, yellow) or a combo of brown, black, and bone-white.",
    graphics: "Paw prints, bones, tennis balls, and various cute dog breeds.",
    font: "A friendly, rounded, slightly bouncy font.",
    primaryObjects:
      'Scattered Paw Prints throughout the background. A large Bone graphic centered at the top, containing the words "Doggy Pawty" or the child\'s age.',
  },
  {
    id: "kitten_cafe",
    name: "Kitten Cafe",
    category: "Cozy & sweet",
    bg: "bg-gradient-to-br from-amber-100 via-rose-50 to-stone-100",
    text: "text-stone-800",
    accent: "text-amber-700",
    previewColor: "bg-gradient-to-br from-amber-100 via-rose-50 to-stone-100",
    previewDot: "bg-amber-200",
    aesthetic: "Cozy, gentle, and sweet.",
    colors: "Pastel peach, cream, light gray, and soft brown.",
    graphics:
      "Simple line-drawn kittens, hearts, steaming teacups, and floral accents.",
    font: "A gentle, slightly cursive or handwritten script.",
    primaryObjects:
      "Simple, line-drawn Kitten motifs near the corners. A steaming Teacup graphic placed next to the RSVP information or event time.",
  },
  {
    id: "race_car_rally",
    name: "Race Car Rally",
    category: "High speed",
    bg: "bg-gradient-to-br from-red-600 via-yellow-200 to-slate-900",
    text: "text-white drop-shadow-md",
    accent: "text-yellow-200",
    previewColor: "bg-gradient-to-br from-red-600 via-yellow-200 to-slate-900",
    previewDot: "bg-red-500",
    aesthetic: "High speed, checkered flags, and competitive energy.",
    colors: "Bright red, black, white, and neon yellow.",
    graphics:
      "Racing stripes, checkered flag patterns, speed lines, and a stylized race car graphic.",
    font: "A bold, italicized, dynamic font.",
    primaryObjects:
      "Checkered Flags bordering the top and bottom of the invite. A dynamic Race Car graphic positioned near the main title, with speed lines trailing.",
  },
  {
    id: "music_festival_vibe",
    name: "Music Festival Vibe",
    category: "Boho & free",
    bg: "bg-gradient-to-br from-amber-200 via-emerald-200 to-indigo-300",
    text: "text-slate-900",
    accent: "text-indigo-700",
    previewColor:
      "bg-gradient-to-br from-amber-200 via-emerald-200 to-indigo-300",
    previewDot: "bg-indigo-300",
    aesthetic: "Bohemian, artistic, and free-spirited.",
    colors:
      "Earth tones (mustard, rust, olive) paired with bright jewel tones (indigo, turquoise).",
    graphics: "Tents, stage lights, tribal patterns, and sunbursts.",
    font: "A cool, retro, slightly distressed font.",
    primaryObjects:
      "A stylized stage/tent silhouette in the background. Feather and Floral arrangements used as side borders or header elements.",
  },
  {
    id: "construction_zone",
    name: "Construction Zone",
    category: "Caution stripes",
    bg: "bg-gradient-to-br from-yellow-300 via-orange-300 to-gray-500",
    text: "text-slate-900",
    accent: "text-orange-800",
    previewColor:
      "bg-gradient-to-br from-yellow-300 via-orange-300 to-gray-500",
    previewDot: "bg-yellow-400",
    aesthetic: "Industrial, safety-focused, and dynamic.",
    colors: "Caution yellow, bright orange, black, and industrial gray.",
    graphics:
      "Construction tape borders, dump trucks, hard hats, and traffic cones.",
    font: "A heavy, blocky, stencil-style font.",
    primaryObjects:
      "Safety Tape or Caution Stripes used as prominent border elements. Dump Trucks or Cranes positioned along the bottom edge, creating a scene.",
  },
  {
    id: "under_the_sea",
    name: "Under the Sea",
    category: "Deep ocean",
    bg: "bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700",
    text: "text-white drop-shadow-md",
    accent: "text-cyan-200",
    previewColor: "bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700",
    previewDot: "bg-cyan-500",
    aesthetic: "Deep ocean wonder, bioluminescent.",
    colors: "Deep blues, vibrant corals, electric greens, and dark teal.",
    graphics:
      "Silhouettes of deep-sea creatures, kelp forests, and glowing bubbles.",
    font: "A slightly distorted or wavy font.",
    primaryObjects:
      "Bioluminescent Jellyfish floating near the header text. Coral reefs and deep-sea vents visible in the background texture along the bottom.",
  },
  {
    id: "farmyard_friends",
    name: "Farmyard Friends",
    category: "Pastoral & rustic",
    bg: "bg-gradient-to-br from-red-200 via-amber-200 to-green-200",
    text: "text-emerald-900",
    accent: "text-red-600",
    previewColor: "bg-gradient-to-br from-red-200 via-amber-200 to-green-200",
    previewDot: "bg-red-300",
    aesthetic: "Rustic, cheerful, and pastoral.",
    colors: "Barn red, straw yellow, denim blue, and grassy green.",
    graphics:
      "Picket fence border, hay bales, and simple, cute farm animal illustrations (pig, cow, chicken).",
    font: "A sweet, slightly rounded, country-style font.",
    primaryObjects:
      "A Picket Fence border along the bottom. Cute illustrations of a Cow and a Pig flanking the main invitation text.",
  },
  {
    id: "superhero_city",
    name: "Superhero City",
    category: "Comic book",
    bg: "bg-gradient-to-br from-blue-700 via-yellow-300 to-red-600",
    text: "text-white",
    accent: "text-yellow-200",
    previewColor: "bg-gradient-to-br from-blue-700 via-yellow-300 to-red-600",
    previewDot: "bg-blue-500",
    aesthetic: "Comic book style, powerful, and iconic.",
    colors:
      "Primary colors (red, blue, yellow) with black outlines and white highlights.",
    graphics:
      'Comic book speech bubbles ("POW!"), city skyline silhouette, and a shield icon.',
    font: "A bold, impactful, and slightly skewed comic book lettering font.",
    primaryObjects:
      "A City Skyline silhouette forming the backdrop. A personalized Hero logo (e.g., child's initial on a shield) placed prominently at the top header.",
  },
  {
    id: "retro_arcade",
    name: "Retro Arcade",
    category: "Neon arcade",
    bg: "bg-gradient-to-br from-pink-600 via-purple-700 to-cyan-400",
    text: "text-white",
    accent: "text-cyan-200",
    previewColor: "bg-gradient-to-br from-pink-600 via-purple-700 to-cyan-400",
    previewDot: "bg-pink-500",
    aesthetic: "8-bit, neon, and high-energy nostalgia.",
    colors: "Electric pink, cyan, purple, and black.",
    graphics:
      "Pixel art characters (Pac-Man, space invaders), geometric patterns, and neon light tubing effects.",
    font: "A pixelated or blocky 8-bit digital font.",
    primaryObjects:
      "Pixelated Characters (like ghosts or cherries) scattered randomly in the background. The main title is often framed by a neon-style geometric box.",
  },
  {
    id: "viking_voyage",
    name: "Viking Voyage",
    category: "Norse epic",
    bg: "bg-gradient-to-br from-emerald-900 via-stone-700 to-amber-700",
    text: "text-white drop-shadow-md",
    accent: "text-amber-200",
    previewColor:
      "bg-gradient-to-br from-emerald-900 via-stone-700 to-amber-700",
    previewDot: "bg-emerald-700",
    aesthetic: "Norse mythology, rugged, and epic.",
    colors: "Dark forest green, deep brown, steel gray, and rustic gold.",
    graphics:
      "Longship silhouette, stylized knots/runes, and a Viking helmet icon.",
    font: "A strong, medieval, or carved wood-effect font.",
    primaryObjects:
      "A Viking Longship sailing across the bottom of the invite. Rune-like symbols used to frame the main text block, giving a carved-wood effect.",
  },
];

const INITIAL_DATA = {
  childName: "Emma",
  age: 5,
  date: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  })(),
  time: "14:00",
  city: "Chicago",
  state: "IL",
  address: "123 Main Street",
  venue: "Fun Zone Playground",
  partyDetails: {
    theme: "Princess Party",
    activities:
      "Face painting, bouncy castle, magic show, piñata, arts & crafts",
    notes:
      "Join us for an amazing birthday celebration! We'll have games, cake, and lots of fun activities. Can't wait to celebrate with you!",
  },
  hosts: [
    { id: 1, name: "Sarah & Michael", role: "Parents" },
    { id: 2, name: "Grandma Linda", role: "Grandmother" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    themeId: "rainbow_sparkle",
    professionalThemeId: "rainbow_confetti_splash",
  },
  images: {
    hero: null,
    headlineBg: null,
  },
  registries: [
    {
      id: 1,
      label: "Amazon Registry",
      url: "https://www.amazon.com/wishlist/emma-5th-birthday",
    },
    {
      id: 2,
      label: "Target Registry",
      url: "https://www.target.com/wishlist/emma-party",
    },
  ],
  rsvp: {
    isEnabled: true,
    deadline: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date.toISOString().split("T")[0];
    })(),
  },
  gallery: [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800",
      caption: "Last year's party",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800",
      caption: "Birthday cake",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800",
      caption: "Party decorations",
    },
  ],
};

const MenuCard = ({ title, icon, desc, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
  >
    <div className="bg-slate-50 p-3 rounded-lg text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all"
        />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const EditorLayout = ({ title, onBack, children }) => (
  <div className="animate-fade-in-right">
    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
      <button
        onClick={onBack}
        className="mr-3 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-auto">
        Customize
      </span>
      <h2 className="text-lg font-serif font-bold text-slate-800 absolute left-1/2 transform -translate-x-1/2">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const InputGroup = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

export default function BirthdayTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");

  const template = getTemplateById(templateId);
  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState("yes");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    previewTouchHandlers,
    drawerTouchHandlers,
  } = useMobileDrawer();
  const [professionalOpen, setProfessionalOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newHost, setNewHost] = useState({ name: "", role: "" });
  const [newRegistry, setNewRegistry] = useState({ label: "", url: "" });
  const buildCalendarDetails = () => {
    const title = data.title || "Birthday Event";
    let start: Date | null = null;
    if (data.date) {
      const tentative = new Date(`${data.date}T${data.time || "17:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const location = [data.address, data.city, data.state]
      .filter(Boolean)
      .join(", ");
    const description = data.details || "";
    return { title, start, end, location, description };
  };

  const toGoogleDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const buildIcsUrl = (details: ReturnType<typeof buildCalendarDetails>) => {
    const params = new URLSearchParams();
    params.set("title", details.title);
    params.set("start", details.start.toISOString());
    params.set("end", details.end.toISOString());
    if (details.location) params.set("location", details.location);
    if (details.description) params.set("description", details.description);
    params.set("disposition", "inline");
    return `/api/ics?${params.toString()}`;
  };

  const openWithAppFallback = (appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 700);
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", clear);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clear();
    });
    try {
      window.location.href = appUrl;
    } catch {
      clearTimeout(timer);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      shareUrl
    ) {
      (navigator as any)
        .share({
          title: details.title,
          text: details.description || details.location || details.title,
          url: shareUrl,
        })
        .catch(() => {
          window.open(shareUrl, "_blank", "noopener,noreferrer");
        });
    } else if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleGoogleCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const start = toGoogleDate(details.start);
    const end = toGoogleDate(details.end);
    const query = `action=TEMPLATE&text=${encodeURIComponent(
      details.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(
      details.location
    )}&details=${encodeURIComponent(details.description || "")}`;
    const webUrl = `https://calendar.google.com/calendar/render?${query}`;
    const appUrl = `comgooglecalendar://?${query}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleOutlookCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleAppleCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const icsPath = buildIcsUrl(buildCalendarDetails());
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${icsPath}`
        : icsPath;
    window.location.href = absolute;
  };

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updatePartyDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      partyDetails: { ...prev.partyDetails, [field]: value },
    }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setData((prev) => ({
        ...prev,
        images: { ...prev.images, [field]: imageUrl },
      }));
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      url: URL.createObjectURL(file),
    }));
    setData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newImages],
    }));
  };

  const removeGalleryImage = (id) => {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((img) => img.id !== id),
    }));
  };

  const currentTheme =
    DESIGN_THEMES.find((c) => c.id === data.theme.themeId) || DESIGN_THEMES[0];
  const currentThemeDot =
    currentTheme.previewDot ||
    currentTheme.previewColor?.split(" ")[0] ||
    "bg-slate-200";

  // Detect dark background for title color
  const isDarkBackground = React.useMemo(() => {
    const bg = currentTheme?.bg?.toLowerCase() ?? "";
    const darkTokens = [
      "black",
      "slate-9",
      "stone-9",
      "neutral-9",
      "gray-9",
      "grey-9",
      "indigo-9",
      "purple-9",
      "violet-9",
      "emerald-9",
      "teal-9",
      "blue-9",
      "navy",
      "midnight",
    ];
    const hasDarkToken = darkTokens.some((token) => bg.includes(token));
    const hasDarkHex =
      /#0[0-9a-f]{5,}/i.test(bg) ||
      /#1[0-3][0-9a-f]{4}/i.test(bg) ||
      /#2[0-3][0-9a-f]{4}/i.test(bg);
    return hasDarkToken || hasDarkHex;
  }, [currentTheme]);

  // Light text needs a soft shadow for contrast on dark themes
  const rawTextClass = currentTheme?.text || "";
  const usesLightText = /text-(white|slate-50|neutral-50|gray-50)/.test(
    rawTextClass.toLowerCase()
  );
  const bodyShadow = usesLightText
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" }
    : undefined;

  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;
  const currentProfessionalTheme =
    PROFESSIONAL_THEMES.find(
      (theme) => theme.id === data.theme.professionalThemeId
    ) || PROFESSIONAL_THEMES[0];
  const professionalPalette =
    currentProfessionalTheme.recommendedColorPalette || [];
  const professionalAccentColor =
    professionalPalette[3] ??
    professionalPalette[2] ??
    professionalPalette[0] ??
    undefined;
  const professionalBackgroundStyle =
    professionalPalette.length >= 2
      ? {
          backgroundImage: `linear-gradient(135deg, ${professionalPalette[0]} 0%, ${professionalPalette[1]} 100%)`,
        }
      : professionalPalette[0]
      ? { backgroundColor: professionalPalette[0] }
      : {};
  const professionalAccentStyle = professionalAccentColor
    ? { color: professionalAccentColor }
    : undefined;
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

  const heroImageSrc =
    template?.heroImageName &&
    typeof template.heroImageName === "string" &&
    template.heroImageName.trim()
      ? `/templates/birthdays/${template.heroImageName}`
      : "/templates/birthdays/rainbow-bash.webp";
  const activeGalleryItem =
    data.gallery.length > 0
      ? data.gallery[Math.min(galleryIndex, data.gallery.length - 1)]
      : null;

  const getAgeSuffix = (age: number) => {
    if (age === 1) return "st";
    if (age === 2) return "nd";
    if (age === 3) return "rd";
    return "th";
  };

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 3);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const locationParts = [data.venue, data.city, data.state].filter(Boolean);
      const location =
        locationParts.length > 0 ? locationParts.join(", ") : undefined;

      const payload: any = {
        title: `${data.childName}'s ${data.age}${getAgeSuffix(
          data.age
        )} Birthday`,
        data: {
          category: "Birthdays",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          location,
          venue: data.venue || undefined,
          description: data.partyDetails.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          numberOfGuests: 0,
          templateId: template?.id || "party-pop",
          // Customization data
          birthdayName: data.childName,
          age: data.age,
          partyDetails: data.partyDetails,
          hosts: data.hosts,
          theme: data.theme,
          registries: data.registries
            .filter((r) => r.url.trim())
            .map((r) => ({
              label: r.label.trim() || "Registry",
              url: r.url.trim(),
            })),
          customHeroImage: data.images.hero || undefined,
        },
      };

      let id: string | undefined;

      if (editEventId) {
        await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        id = editEventId;
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        router.push(`/event/${id}${editEventId ? "?updated=1" : "?created=1"}`);
      } else {
        throw new Error(
          editEventId ? "Failed to update event" : "Failed to create event"
        );
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, data, template?.id, editEventId, router]);

  useEffect(() => {
    if (galleryIndex >= data.gallery.length) {
      setGalleryIndex(Math.max(0, data.gallery.length - 1));
    }
  }, [data.gallery.length, galleryIndex]);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your birthday party website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Child's name, age, date, location."
          onClick={() => setActiveView("headline")}
        />
        <MenuCard
          title="Design"
          icon={<Palette size={18} />}
          desc="Theme, fonts, colors."
          onClick={() => setActiveView("design")}
        />
        <MenuCard
          title="Images"
          icon={<ImageIcon size={18} />}
          desc="Hero & background photos."
          onClick={() => setActiveView("images")}
        />
        <MenuCard
          title="Party Details"
          icon={<Cake size={18} />}
          desc="Theme, activities, notes."
          onClick={() => setActiveView("partyDetails")}
        />
        <MenuCard
          title="Hosts"
          icon={<Users size={18} />}
          desc="Who's organizing the party."
          onClick={() => setActiveView("hosts")}
        />
        <MenuCard
          title="Photos"
          icon={<ImageIcon size={18} />}
          desc="Photo gallery."
          onClick={() => setActiveView("photos")}
        />
        <MenuCard
          title="RSVP"
          icon={<CheckSquare size={18} />}
          desc="RSVP settings."
          onClick={() => setActiveView("rsvp")}
        />
        <MenuCard
          title="Registry"
          icon={<Gift size={18} />}
          desc="Gift registry links."
          onClick={() => setActiveView("registry")}
        />
      </div>
    </div>
  );

  const renderHeadlineEditor = () => (
    <EditorLayout title="Headline" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <InputGroup
          label="Child's Name"
          value={data.childName}
          onChange={(v) => updateData("childName", v)}
          placeholder="Child's name"
        />
        <InputGroup
          label="Age"
          type="number"
          value={data.age}
          onChange={(v) => updateData("age", Number.parseInt(v, 10) || 0)}
          placeholder="5"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Event Date"
            type="date"
            value={data.date}
            onChange={(v) => updateData("date", v)}
          />
          <InputGroup
            label="Start Time"
            type="time"
            value={data.time}
            onChange={(v) => updateData("time", v)}
          />
        </div>
        <InputGroup
          label="Venue"
          value={data.venue}
          onChange={(v) => updateData("venue", v)}
          placeholder="Party venue (optional)"
        />
        <InputGroup
          label="Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="Street address (optional)"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="City"
            value={data.city}
            onChange={(v) => updateData("city", v)}
          />
          <InputGroup
            label="State"
            value={data.state}
            onChange={(v) => updateData("state", v)}
          />
        </div>
      </div>
    </EditorLayout>
  );

  const renderImagesEditor = () => (
    <EditorLayout title="Images" onBack={() => setActiveView("main")}>
      <div className="space-y-8">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Hero Image
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.hero ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={data.images.hero}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, hero: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Upload size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">Upload main photo</p>
                <p className="text-xs text-slate-400">
                  Recommended: 1600x900px
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("hero", e)}
                />
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Headline Background
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.headlineBg ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={data.images.headlineBg}
                  alt="Headline Bg"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, headlineBg: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ImageIcon size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Upload header texture
                </p>
                <p className="text-xs text-slate-400">
                  Optional pattern behind names
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("headlineBg", e)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const renderDesignEditor = () => (
    <EditorLayout title="Design" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="border-b border-slate-100 pb-6">
          <button
            onClick={() => setProfessionalOpen(!professionalOpen)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block cursor-pointer mb-1">
                Professional Themes
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <div
                  className="w-3 h-3 rounded-full border shadow-sm"
                  style={{
                    backgroundColor:
                      currentProfessionalTheme.recommendedColorPalette?.[0] ||
                      "#e2e8f0",
                  }}
                ></div>
                {currentProfessionalTheme.themeName || "Select a theme"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentProfessionalTheme.description}
              </p>
            </div>
            <div
              className={`p-2 rounded-full bg-slate-50 text-slate-500 group-hover:bg-slate-100 transition-all ${
                professionalOpen
                  ? "rotate-180 text-indigo-600 bg-indigo-50"
                  : ""
              }`}
            >
              <ChevronDown size={16} />
            </div>
          </button>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 overflow-y-auto transition-all duration-300 ease-in-out ${
              professionalOpen
                ? "max-h-[800px] opacity-100"
                : "max-h-0 opacity-0 hidden"
            }`}
          >
            {PROFESSIONAL_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateTheme("professionalThemeId", theme.id);
                }}
                className={`relative overflow-hidden p-3 border rounded-lg text-left transition-all group ${
                  data.theme.professionalThemeId === theme.id
                    ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
                    : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {theme.themeName}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {theme.recommendedColorPalette
                        .slice(0, 5)
                        .map((color) => (
                          <span
                            key={color}
                            className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                            style={{ backgroundColor: color }}
                          ></span>
                        ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Typography
          </label>
          <div className="relative">
            <select
              value={data.theme.font}
              onChange={(e) => updateTheme("font", e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            >
              {Object.entries(FONTS).map(([key, font]) => (
                <option
                  key={key}
                  value={key}
                  style={{ fontFamily: font.preview }}
                >
                  {font.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Text Size
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                onClick={() => updateTheme("fontSize", size)}
                className={`py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  data.theme.fontSize === size
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const renderPartyDetailsEditor = () => (
    <EditorLayout title="Party Details" onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <InputGroup
          label="Party Theme"
          value={data.partyDetails.theme}
          onChange={(v) => updatePartyDetails("theme", v)}
          placeholder="e.g. Princess, Superhero, Unicorn"
        />
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Activities
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] text-slate-700 text-sm"
            value={data.partyDetails.activities}
            onChange={(e) => updatePartyDetails("activities", e.target.value)}
            placeholder="Games, activities, special events..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Notes
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.partyDetails.notes}
            onChange={(e) => updatePartyDetails("notes", e.target.value)}
            placeholder="Share details about the party..."
          />
        </div>
      </div>
    </EditorLayout>
  );

  const renderHostsEditor = () => {
    const addHost = () => {
      if (newHost.name) {
        updateData("hosts", [...data.hosts, { ...newHost, id: Date.now() }]);
        setNewHost({ name: "", role: "" });
      }
    };

    return (
      <EditorLayout title="Hosts" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Host
            </h4>
            <InputGroup
              label="Name"
              value={newHost.name}
              onChange={(v) => setNewHost({ ...newHost, name: v })}
              placeholder="Host name"
            />
            <InputGroup
              label="Role"
              value={newHost.role}
              onChange={(v) => setNewHost({ ...newHost, role: v })}
              placeholder="e.g. Parents, Grandparents"
            />
            <button
              onClick={addHost}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Host
            </button>
          </div>

          <div className="space-y-3">
            {data.hosts.map((host) => (
              <div
                key={host.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">{host.name}</div>
                  {host.role && (
                    <div className="text-xs text-slate-500">{host.role}</div>
                  )}
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "hosts",
                      data.hosts.filter((h) => h.id !== host.id)
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  const renderPhotosEditor = () => (
    <EditorLayout title="Photos" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Upload Photos
          </h3>
          <p className="text-xs text-slate-500">JPG or PNG up to 5MB</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleGalleryUpload}
          />
        </div>

        {data.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {data.gallery.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt="Gallery"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeGalleryImage(img.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </EditorLayout>
  );

  const renderRsvpEditor = () => (
    <EditorLayout title="RSVP Settings" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <span className="font-medium text-slate-700 text-sm">
            Enable RSVP
          </span>
          <button
            onClick={() =>
              updateData("rsvp", {
                ...data.rsvp,
                isEnabled: !data.rsvp.isEnabled,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative ${
              data.rsvp.isEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                data.rsvp.isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>

        {data.rsvp.isEnabled && (
          <InputGroup
            label="RSVP Deadline"
            type="date"
            value={data.rsvp.deadline}
            onChange={(v) => updateData("rsvp", { ...data.rsvp, deadline: v })}
          />
        )}

        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
          <strong>Preview:</strong> Check the preview pane to see the RSVP form
          that your guests will see.
        </div>
      </div>
    </EditorLayout>
  );

  const renderRegistryEditor = () => {
    const addRegistry = () => {
      if (newRegistry.url) {
        updateData("registries", [
          ...data.registries,
          { ...newRegistry, id: Date.now() },
        ]);
        setNewRegistry({ label: "", url: "" });
      }
    };

    return (
      <EditorLayout title="Registry" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Registry
            </h4>
            <InputGroup
              label="Registry Name"
              value={newRegistry.label}
              onChange={(v) => setNewRegistry({ ...newRegistry, label: v })}
              placeholder="e.g. Amazon, Target, Toys R Us"
            />
            <InputGroup
              label="Registry URL"
              type="url"
              value={newRegistry.url}
              onChange={(v) => setNewRegistry({ ...newRegistry, url: v })}
              placeholder="https://www.example.com/registry"
            />
            <button
              onClick={addRegistry}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Registry
            </button>
          </div>

          <div className="space-y-3">
            {data.registries.map((registry) => (
              <div
                key={registry.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {registry.label || "Registry"}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">
                    {registry.url}
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "registries",
                      data.registries.filter((r) => r.id !== registry.id)
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            key={`preview-${data.theme.themeId}`}
            className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.preview} transition-all duration-500 relative z-0`}
            style={professionalBackgroundStyle}
          >
            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b border-white/10 flex justify-between items-start ${currentTheme.text}`}
              >
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => setActiveView("headline")}
                >
                  <h1
                    className={`${currentSize.h1} mb-2 leading-tight`}
                    style={{
                      fontFamily: currentFont.preview,
                      ...(titleColor || {}),
                    }}
                  >
                    {data.childName}'s {data.age}
                    {getAgeSuffix(data.age)} Birthday
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={24} />
                    </span>
                  </h1>
                  <div
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${currentSize.body} font-medium opacity-90 tracking-wide`}
                  >
                    <span>
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>{data.time}</span>
                    {(data.city || data.state || data.venue) && (
                      <>
                        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                        <span className="md:truncate">
                          {[data.venue, data.city, data.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative w-full h-64 md:h-96">
                {data.images.hero ? (
                  <img
                    src={data.images.hero}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={heroImageSrc}
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                )}
              </div>

              {data.hosts.length > 0 && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2
                    className={`text-2xl mb-6 ${currentTheme.accent}`}
                    style={professionalAccentStyle}
                  >
                    Hosted By
                  </h2>
                  <div className="flex flex-wrap justify-center gap-6">
                    {data.hosts.map((host) => (
                      <div key={host.id} className="text-center">
                        <div className="font-semibold text-lg mb-1">
                          {host.name}
                        </div>
                        {host.role && (
                          <div className="text-sm opacity-70">{host.role}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(data.address || data.venue) && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2
                    className={`text-2xl mb-4 ${currentTheme.accent}`}
                    style={professionalAccentStyle}
                  >
                    Location
                  </h2>
                  {data.venue && (
                    <div className="font-semibold text-lg mb-2">
                      {data.venue}
                    </div>
                  )}
                  {(data.address || data.city || data.state) && (
                    <div className="opacity-80">
                      {[data.address, data.city, data.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </section>
              )}

              {data.partyDetails.notes && (
                <section className="max-w-2xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-4 ${currentTheme.accent}`}
                    style={professionalAccentStyle}
                  >
                    Party Details
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap`}
                  >
                    {data.partyDetails.notes}
                  </p>
                  {data.partyDetails.theme && (
                    <div className="mt-4">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${currentTheme.accent} bg-white/10`}
                        style={professionalAccentStyle}
                      >
                        Theme: {data.partyDetails.theme}
                      </span>
                    </div>
                  )}
                  {data.partyDetails.activities && (
                    <div className="mt-4 text-left">
                      <h3 className="font-semibold mb-2">Activities:</h3>
                      <p className="opacity-80 whitespace-pre-wrap">
                        {data.partyDetails.activities}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {data.gallery.length > 0 && (
                <section className="py-12 border-t border-white/10">
                  <h2
                    className={`text-2xl mb-6 text-center ${currentTheme.accent}`}
                    style={professionalAccentStyle}
                  >
                    Photo Gallery
                  </h2>
                  {activeGalleryItem && (
                    <div className="relative max-w-3xl mx-auto px-4">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/10">
                        <img
                          src={activeGalleryItem.url}
                          alt={activeGalleryItem.caption || "Gallery"}
                          className="w-full h-full object-cover"
                        />
                        {activeGalleryItem.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-3">
                            {activeGalleryItem.caption}
                          </div>
                        )}
                      </div>
                      {data.gallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGalleryIndex(
                                (idx) =>
                                  (idx - 1 + data.gallery.length) %
                                  data.gallery.length
                              );
                            }}
                            className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGalleryIndex(
                                (idx) => (idx + 1) % data.gallery.length
                              );
                            }}
                            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                            aria-label="Next photo"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="flex justify-center gap-2 mt-4">
                            {data.gallery.map((img, idx) => (
                              <button
                                key={img.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryIndex(idx);
                                }}
                                className={`h-2.5 rounded-full transition-all ${
                                  galleryIndex === idx
                                    ? "w-6 bg-white/90"
                                    : "w-2.5 bg-white/40 hover:bg-white/60"
                                }`}
                                aria-label={`Show photo ${idx + 1}`}
                              ></button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </section>
              )}

              {data.registries.length > 0 && (
                <section className="text-center py-12 border-t border-white/10">
                  <h2
                    className={`text-2xl mb-6 ${currentTheme.accent}`}
                    style={professionalAccentStyle}
                  >
                    Registry
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {data.registries.map((registry) => (
                      <a
                        key={registry.id}
                        href={registry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <span className="uppercase tracking-widest text-sm font-semibold">
                          {registry.label || "Registry"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {data.rsvp.isEnabled && (
                <section className="max-w-3xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-6 ${currentTheme.accent}`}
                    style={titleColor || professionalAccentStyle}
                  >
                    RSVP
                  </h2>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-left">
                    {!rsvpSubmitted ? (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <p className="opacity-80">
                            {data.rsvp.deadline
                              ? `Kindly respond by ${new Date(
                                  data.rsvp.deadline
                                ).toLocaleDateString()}`
                              : "Please RSVP"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                            Full Name
                          </label>
                          <input
                            className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                            placeholder="Guest Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                            Attending?
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <label className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                                defaultChecked
                              />
                              <div className="p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20">
                                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-semibold">
                                  Joyfully Accept
                                </span>
                              </div>
                            </label>
                            <label className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                              />
                              <div className="p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20">
                                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-semibold">
                                  Regretfully Decline
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(true);
                          }}
                          className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                        >
                          Send RSVP
                        </button>

                        <div className="mt-4">
                          <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-3">
                            Share & Add to Calendar
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center">
                            <button
                              onClick={handleShare}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Share2 size={16} />
                              <span className="hidden sm:inline">
                                Share link
                              </span>
                            </button>
                            <button
                              onClick={handleGoogleCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <CalendarIcon size={16} />
                              <span className="hidden sm:inline">
                                Google Cal
                              </span>
                            </button>
                            <button
                              onClick={handleAppleCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Apple size={16} />
                              <span className="hidden sm:inline">
                                Apple Cal
                              </span>
                            </button>
                            <button
                              onClick={handleOutlookCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <CalendarIcon size={16} />
                              <span className="hidden sm:inline">Outlook</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3 className="text-2xl font-serif mb-2">Thank you!</h3>
                        <p className="opacity-70">Your RSVP has been sent.</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(false);
                          }}
                          className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                        >
                          Send another response
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <footer className="text-center py-8 border-t border-white/10 mt-1">
                <a
                  href="https://envitefy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="space-y-1 inline-block no-underline"
                >
                  <p className="text-sm opacity-60">
                    Powered By Envitefy. Creat. Share. Enjoy.
                  </p>
                  <p className="text-xs opacity-50">Create yours now.</p>
                </a>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
          onClick={closeMobileMenu}
          role="presentation"
        ></div>
      )}

      <div
        className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        {...drawerTouchHandlers}
      >
        <div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {mobileMenuOpen && (
            <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
              <button
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1"
              >
                <ChevronLeft size={14} />
                Back to preview
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Customize
              </span>
            </div>
          )}
          <div className="p-6 pt-4 md:pt-6">
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "partyDetails" && renderPartyDetailsEditor()}
            {activeView === "hosts" && renderHostsEditor()}
            {activeView === "photos" && renderPhotosEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "registry" && renderRegistryEditor()}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Publishing..." : "PREVIEW AND PUBLISH"}
          </button>
        </div>
      </div>

      {!mobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg"
          >
            <Menu size={18} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
