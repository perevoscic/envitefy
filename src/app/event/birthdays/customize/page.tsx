// @ts-nocheck
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
import ScrollBoundary from "@/components/ScrollBoundary";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";

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

type SimpleTemplateThemeSnapshot = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview: string;
};

const PROFESSIONAL_THEME_CLASSES: Record<
  string,
  SimpleTemplateThemeSnapshot
> = {
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
    professionalThemeId: "rainbow_confetti_splash",
  },
  themePalette:
    PROFESSIONAL_THEMES.find((t) => t.id === "rainbow_confetti_splash")
      ?.recommendedColorPalette || [],
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

// Helper function to calculate luminance from hex color (0-1, higher = lighter)
const getLuminance = (hex: string): number => {
  const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!rgb) return 0.5; // Default to medium if invalid

  const r = parseInt(rgb[1], 16) / 255;
  const g = parseInt(rgb[2], 16) / 255;
  const b = parseInt(rgb[3], 16) / 255;

  // Relative luminance formula
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Determine if a palette is dark (average luminance < 0.5)
const isPaletteDark = (palette: string[]): boolean => {
  if (!palette || palette.length === 0) return false;
  const colors = palette.filter(Boolean).slice(0, 3); // Use first 3 colors (gradient)
  if (colors.length === 0) return false;

  const luminances = colors.map(getLuminance);
  const avgLuminance =
    luminances.reduce((a, b) => a + b, 0) / luminances.length;
  return avgLuminance < 0.5; // Dark if average luminance < 0.5
};

// Helper function to create preview gradient from color palette (like football-season)
const getPreviewStyle = (palette: string[]) => {
  if (!palette || palette.length === 0) {
    return { backgroundColor: "#e2e8f0" };
  }
  const colors = palette.filter(Boolean);
  if (colors.length === 1) {
    return { backgroundColor: colors[0] };
  }
  if (colors.length === 2) {
    return {
      backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
    };
  }
  // Use first 3 colors for gradient (like football-season uses 3 colors)
  return {
    backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
  };
};

const ThemeSwatch = ({
  theme,
  active,
  onClick,
}: {
  theme: (typeof PROFESSIONAL_THEMES)[0];
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-lg border text-left transition-all ${
      active
        ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
        : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
    }`}
  >
    <div
      className="h-12 w-full border-b border-black/5"
      style={getPreviewStyle(theme.recommendedColorPalette)}
    />
    <div className="p-3">
      <div className="text-sm font-semibold text-slate-700">
        {theme.themeName}
      </div>
      <div className="text-xs text-slate-400">Palette preset</div>
    </div>
  </button>
);

export default function BirthdayTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");
  const variationIdParam = search?.get("variationId") ?? undefined;
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(
    templateId || birthdayTemplateCatalog[0]?.id
  );
  const [activeVariationId, setActiveVariationId] = useState<
    string | undefined
  >(
    variationIdParam ||
      birthdayTemplateCatalog.find((t) => t.id === (templateId || ""))?.variations?.[0]?.id ||
      birthdayTemplateCatalog[0]?.variations?.[0]?.id
  );
  const [loadingExisting, setLoadingExisting] = useState(false);
  const template = getTemplateById(activeTemplateId);
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
  const [themesExpanded, setThemesExpanded] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fontListRef = useRef<HTMLDivElement | null>(null);
  const [fontScrollTop, setFontScrollTop] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("details");
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
  if (field === "professionalThemeId") {
    const match =
      PROFESSIONAL_THEMES.find((t) => t.id === value) ||
      PROFESSIONAL_THEMES[0];
    // Keep variation in lockstep with the chosen theme so saves reflect the same palette
    setActiveVariationId(value);
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
      themePalette: match?.recommendedColorPalette || prev.themePalette,
    }));
    return;
  }
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

  // Default theme fallback for CSS classes (styling is primarily handled by professional theme inline styles)
  const currentTheme = {
    bg: "",
    text: "text-slate-800",
    accent: "",
    previewDot: "bg-slate-200",
    previewColor: "bg-slate-200",
  };
  const currentThemeDot = currentTheme.previewDot;

  const currentProfessionalTheme =
    PROFESSIONAL_THEMES.find(
      (theme) => theme.id === data.theme.professionalThemeId
    ) || PROFESSIONAL_THEMES[0];
  const professionalPalette =
    (Array.isArray(data.themePalette) && data.themePalette.length > 0
      ? data.themePalette
      : currentProfessionalTheme.recommendedColorPalette) || [];

  // Analyze palette to determine if it's dark or light
  const isDarkPalette = React.useMemo(
    () => isPaletteDark(professionalPalette),
    [professionalPalette]
  );

  // Set text colors based on palette darkness
  const textColorStyle = isDarkPalette
    ? { color: "#ffffff" } // White text on dark backgrounds
    : { color: "#1e293b" }; // Dark slate text on light backgrounds

  const accentColorStyle = isDarkPalette
    ? { color: "#f1f5f9" } // Light accent on dark
    : { color: "#475569" }; // Medium accent on light

  const professionalAccentColor =
    professionalPalette[3] ??
    professionalPalette[2] ??
    professionalPalette[0] ??
    undefined;

  // Create gradient like football-season (using first 3 colors for smooth gradient)
  const professionalBackgroundStyle =
    professionalPalette.length >= 3
      ? {
          backgroundImage: `linear-gradient(to bottom right, ${professionalPalette[0]}, ${professionalPalette[1]}, ${professionalPalette[2]})`,
        }
      : professionalPalette.length === 2
      ? {
          backgroundImage: `linear-gradient(to bottom right, ${professionalPalette[0]}, ${professionalPalette[1]})`,
        }
      : professionalPalette[0]
      ? { backgroundColor: professionalPalette[0] }
      : {};

  // Use accent color from palette if available, otherwise use computed accent
  const professionalAccentStyle = professionalAccentColor
    ? { color: professionalAccentColor }
    : accentColorStyle;

  // Text shadow for better contrast on dark backgrounds
  const textShadowStyle = isDarkPalette
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.5)" }
    : undefined;
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

  // Navigation items for birthday template
  const navItems = React.useMemo(() => {
    const items = [
      { id: "details", label: "Details", enabled: true },
      { id: "hosts", label: "Hosts", enabled: data.hosts.length > 0 },
      {
        id: "location",
        label: "Location",
        enabled: !!(data.address || data.venue),
      },
      {
        id: "party",
        label: "Party Details",
        enabled: !!data.partyDetails.notes,
      },
      { id: "gallery", label: "Gallery", enabled: data.gallery.length > 0 },
      {
        id: "registry",
        label: "Registry",
        enabled: data.registries.length > 0,
      },
      { id: "rsvp", label: "RSVP", enabled: data.rsvp.isEnabled },
    ];
    return items.filter((item) => item.enabled);
  }, [
    data.hosts.length,
    data.address,
    data.venue,
    data.partyDetails.notes,
    data.gallery.length,
    data.registries.length,
    data.rsvp.isEnabled,
  ]);

  // Sync activeSection with navItems
  React.useEffect(() => {
    if (!navItems.length) return;
    if (!navItems.some((i) => i.id === activeSection)) {
      setActiveSection(navItems[0].id);
    }
  }, [activeSection, navItems]);

  // Handle hash navigation
  React.useEffect(() => {
    if (typeof window === "undefined" || !navItems.length) return;
    const hash = window.location.hash.replace("#", "");
    if (hash && navItems.some((i) => i.id === hash)) {
      setActiveSection(hash);
    }
  }, [navItems]);

  // Intersection observer for auto-scroll detection
  React.useEffect(() => {
    if (!navItems.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && navItems.some((i) => i.id === id)) {
              setActiveSection(id);
              if (
                typeof window !== "undefined" &&
                window.location.hash !== `#${id}`
              ) {
                window.history.replaceState(null, "", `#${id}`);
              }
            }
          }
        });
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    const targets = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

  // When template changes, reset variation to first for that template (or keep existing matching variation)
  useEffect(() => {
    if (!activeTemplateId) return;
    const nextTemplate = getTemplateById(activeTemplateId);
    const availableVariations = nextTemplate?.variations || [];
    if (!availableVariations.length) return;
    setActiveVariationId((prev) => {
      if (prev && availableVariations.some((v) => v.id === prev)) return prev;
      return availableVariations[0]?.id;
    });
  }, [activeTemplateId]);

  // Keep theme + palette in sync with the active variation (especially when coming from URL)
  useEffect(() => {
    if (!activeVariationId) return;
    const matchedTheme = PROFESSIONAL_THEMES.find(
      (t) => t.id === activeVariationId
    );
    if (!matchedTheme) return;
    setData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        professionalThemeId: activeVariationId,
      },
      themePalette:
        matchedTheme.recommendedColorPalette || prev.themePalette,
    }));
  }, [activeVariationId]);

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

  // Load existing birthday event data when editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!editEventId) return;
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/history/${editEventId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("[Birthday Edit] Failed to load event:", res.status);
          setLoadingExisting(false);
          return;
        }
        const json = await res.json();
        const existing = json?.data || {};

        // Infer date/time from startISO/start/startIso
        const startIso =
          existing.start || existing.startISO || existing.startIso || null;
        let loadedDate: string | undefined;
        let loadedTime: string | undefined;
        if (startIso) {
          const d = new Date(startIso);
          if (!Number.isNaN(d.getTime())) {
            loadedDate = d.toISOString().split("T")[0];
            loadedTime = d.toISOString().slice(11, 16);
          }
        }

        const templateIdFromData =
          existing.templateId || existing.template?.id || existing.variationId;
        if (templateIdFromData) {
          setActiveTemplateId(String(templateIdFromData));
        }
        const variationFromData =
          existing.variationId ||
          existing.theme?.professionalThemeId ||
          variationIdParam ||
          null;
        if (variationFromData) {
          setActiveVariationId(String(variationFromData));
        }

        const paletteFromThemeId =
          existing.themePalette ||
          (() => {
            const tid =
              (existing.theme && existing.theme.professionalThemeId) ||
              existing.variationId ||
              null;
            const match = tid
              ? PROFESSIONAL_THEMES.find((t) => t.id === tid)
              : null;
            return match?.recommendedColorPalette;
          })() ||
          null;
        const existingThemeKey =
          (existing.theme && (existing.theme.id || existing.theme.professionalThemeId)) ||
          existing.variationId ||
          variationIdParam ||
          null;
        const existingThemeClasses =
          (existingThemeKey &&
            (PROFESSIONAL_THEME_CLASSES[existingThemeKey] ||
              PROFESSIONAL_THEME_CLASSES.default)) ||
          null;

        const resolvedFont =
          existing.theme?.font ||
          existing.fontId ||
          prev.theme.font;
        const resolvedFontSize =
          existing.theme?.fontSize ||
          existing.fontSize ||
          prev.theme.fontSize;

        setData((prev) => ({
          ...prev,
          childName:
            existing.birthdayName ||
            existing.childName ||
            existing.name ||
            prev.childName,
          age:
            typeof existing.age === "number"
              ? existing.age
              : prev.age,
          date: existing.date || loadedDate || prev.date,
          time: existing.time || loadedTime || prev.time,
          city: existing.city || prev.city,
          state: existing.state || prev.state,
          address: existing.address || prev.address,
          venue: existing.venue || existing.location || prev.venue,
          partyDetails: existing.partyDetails || prev.partyDetails,
          hosts: existing.hosts || prev.hosts,
          images: {
            ...prev.images,
            hero: existing.customHeroImage || existing.heroImage || prev.images.hero,
            headlineBg: existing.images?.headlineBg || prev.images.headlineBg,
          },
          theme: {
            ...prev.theme,
            ...(existing.theme || {}),
            ...(existingThemeClasses &&
              (!existing.theme?.bg || !existing.theme?.text)
              ? {
                  ...existingThemeClasses,
                  id: existingThemeClasses.id,
                  name: existingThemeClasses.name,
                }
              : {}),
            font: resolvedFont,
            fontSize: resolvedFontSize,
          },
          themePalette: paletteFromThemeId || prev.themePalette,
          registries: existing.registries || prev.registries,
          rsvp: existing.rsvp
            ? {
                ...prev.rsvp,
                ...existing.rsvp,
                isEnabled:
                  typeof existing.rsvp.isEnabled === "boolean"
                    ? existing.rsvp.isEnabled
                    : prev.rsvp.isEnabled,
              }
            : prev.rsvp,
          gallery: existing.gallery || prev.gallery,
        }));

        setLoadingExisting(false);
      } catch (err) {
        console.error("[Birthday Edit] Error loading event:", err);
        setLoadingExisting(false);
        alert("Failed to load event data. Please refresh the page.");
      }
    };

    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEventId]);

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const toDataUrlIfBlob = async (
        input: string | null | undefined
      ): Promise<string | null> => {
        if (!input) return null;
        if (!/^blob:/i.test(input)) return input;
        try {
          const response = await fetch(input);
          const blob = await response.blob();
          const reader = new FileReader();
          return await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string) || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("[Birthday] Failed to convert blob URL", err);
          return null;
        }
      };

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

      // Convert hero/background/gallery uploads so they persist
      const heroToSave =
        (await toDataUrlIfBlob(data.images.hero)) ||
        (template?.heroImageName
          ? `/templates/birthdays/${template.heroImageName}`
          : null);
      const headlineBgToSave = await toDataUrlIfBlob(data.images.headlineBg);
      const galleryToSave = await Promise.all(
        (data.gallery || []).map(async (item) => ({
          ...item,
          url: (await toDataUrlIfBlob(item.url)) || item.url,
        }))
      );

      const currentProfessionalTheme =
        PROFESSIONAL_THEMES.find(
          (theme) => theme.id === data.theme.professionalThemeId
        ) || PROFESSIONAL_THEMES[0];
      const professionalPalette =
        currentProfessionalTheme.recommendedColorPalette || [];
      const currentFont = FONTS[data.theme.font] || FONTS.playfair;
      const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;
      const templateIdForSave =
        template?.id || activeTemplateId || "party-pop";
      const variationIdForSave =
        data.theme?.professionalThemeId ||
        activeVariationId ||
        template?.variations?.[0]?.id ||
        templateIdForSave;
      const themeClasses =
        PROFESSIONAL_THEME_CLASSES[variationIdForSave] ||
        PROFESSIONAL_THEME_CLASSES[data.theme?.professionalThemeId || ""] ||
        PROFESSIONAL_THEME_CLASSES.default;

      const payload: any = {
        title: `${data.childName}'s ${data.age}${getAgeSuffix(
          data.age
        )} Birthday`,
        data: {
          category: "Birthdays",
          createdVia: "simple-template",
          createdManually: true,
          startISO,
          endISO,
          location,
          venue: data.venue || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          description: data.partyDetails?.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          rsvpEnabled: data.rsvp.isEnabled,
          rsvpDeadline: data.rsvp.deadline || undefined,
          numberOfGuests: 0,
          templateId: templateIdForSave,
          variationId: variationIdForSave,
          // Customization data
          birthdayName: data.childName,
          childName: data.childName,
          age: data.age,
          partyDetails: data.partyDetails,
          hosts: data.hosts,
          theme: {
            ...data.theme,
            id: themeClasses.id,
            name: themeClasses.name,
            fontFamily: currentFont.preview,
            fontSizeH1: currentSize.h1,
            fontSizeH2: currentSize.h2,
            fontSizeBody: currentSize.body,
            ...themeClasses,
          },
          fontId: data.theme.font,
          fontSize: data.theme.fontSize,
          fontFamily: currentFont.preview,
          fontSizeClass: currentSize.h1,
          themePalette: professionalPalette,
          registries: data.registries
            .filter((r) => r.url.trim())
            .map((r) => ({
              label: r.label.trim() || "Registry",
              url: r.url.trim(),
            })),
          customHeroImage: heroToSave || undefined,
          heroImage: heroToSave || undefined,
          images: {
            ...data.images,
            hero: heroToSave || undefined,
            headlineBg: headlineBgToSave || undefined,
          },
          gallery: galleryToSave,
        },
      };

      let id: string | undefined;

      if (editEventId) {
        const res = await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText || "Failed to update event. Please try again."
          );
        }
        id = editEventId;
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(
            errorText || "Failed to create event. Please try again."
          );
        }
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        const params = editEventId
          ? { updated: true, t: Date.now() }
          : { created: true };
        router.push(buildEventPath(id, payload.title, params));
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
  }, [
    submitting,
    data,
    template?.id,
    template?.heroImageName,
    template?.variations,
    activeTemplateId,
    activeVariationId,
    editEventId,
    router,
  ]);

  useEffect(() => {
    if (galleryIndex >= data.gallery.length) {
      setGalleryIndex(Math.max(0, data.gallery.length - 1));
    }
  }, [data.gallery.length, galleryIndex]);

  // Expand themes when Design view is opened
  useEffect(() => {
    if (activeView === "design") {
      setThemesExpanded(true);
    }
  }, [activeView]);

  // Restore scroll position in font list after selection
  useEffect(() => {
    if (fontListRef.current && fontScrollTop > 0) {
      fontListRef.current.scrollTop = fontScrollTop;
    }
  }, [fontScrollTop, data.theme.font]);

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
        <div className="space-y-3">
          <button
            onClick={() => setThemesExpanded(!themesExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette size={16} /> Theme ({PROFESSIONAL_THEMES.length})
            </div>
            {themesExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {themesExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {PROFESSIONAL_THEMES.map((theme) => (
                <ThemeSwatch
                  key={theme.id}
                  theme={theme}
                  active={data.theme.professionalThemeId === theme.id}
                  onClick={() => updateTheme("professionalThemeId", theme.id)}
                />
              ))}
            </div>
          )}
          {!themesExpanded && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div
                className="w-3 h-3 rounded-full border shadow-sm"
                style={getPreviewStyle(
                  currentProfessionalTheme.recommendedColorPalette || []
                )}
              ></div>
              <span>Current theme: {currentProfessionalTheme.themeName}</span>
            </div>
          )}
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Typography
            </p>
          </div>
          <div
            ref={fontListRef}
            className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1"
          >
            {Object.entries(FONTS).map(([key, font]) => (
              <button
                key={key}
                onClick={() => {
                  setFontScrollTop(fontListRef.current?.scrollTop || 0);
                  updateTheme("font", key);
                }}
                className={`border rounded-lg p-3 text-left transition-colors ${
                  data.theme.font === key
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div
                  className="text-base font-semibold"
                  style={{ fontFamily: font.preview }}
                >
                  {font.name}
                </div>
              </button>
            ))}
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

  if (editEventId && loadingExisting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your birthday...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center md:justify-end md:pr-25"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            key={`preview-${data.theme.professionalThemeId}`}
            className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.preview} transition-all duration-500 relative z-0`}
            style={professionalBackgroundStyle}
          >
            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b border-white/10 ${currentTheme.text}`}
                style={{
                  borderBottomColor: isDarkPalette
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                }}
              >
                <div>
                  <h1
                    className={`${currentSize.h1} mb-2 leading-tight`}
                    style={{
                      fontFamily: currentFont.preview,
                      ...textColorStyle,
                      ...textShadowStyle,
                    }}
                  >
                    {data.childName}'s {data.age}
                    {getAgeSuffix(data.age)} Birthday
                  </h1>
                  <div
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${currentSize.body} font-medium opacity-90 tracking-wide`}
                    style={textColorStyle}
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
                {navItems.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {navItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                              setActiveSection(item.id);
                              window.history.replaceState(
                                null,
                                "",
                                `#${item.id}`
                              );
                            }
                          }}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition border ${
                            isActive
                              ? isDarkPalette
                                ? "bg-white/85 text-slate-900 border-white shadow"
                                : "bg-slate-900/85 text-white border-slate-900 shadow"
                              : isDarkPalette
                              ? "bg-white/10 text-inherit border-white/20 hover:bg-white/20"
                              : "bg-black/10 text-inherit border-black/20 hover:bg-black/20"
                          }`}
                          style={!isActive ? textColorStyle : undefined}
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div id="details" className="relative w-full aspect-video">
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
                  sizes="100vw"
                />
              )}
            </div>

            {data.hosts.length > 0 && (
              <section
                className="text-center py-12"
                style={{
                  borderTop: isDarkPalette
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <h2
                  id="hosts"
                  className="text-2xl mb-6"
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
                >
                  Hosted By
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {data.hosts.map((host) => (
                    <div key={host.id} className="text-center">
                      <div
                        className="font-semibold text-lg mb-1"
                        style={textColorStyle}
                      >
                        {host.name}
                      </div>
                      {host.role && (
                        <div
                          className="text-sm opacity-70"
                          style={textColorStyle}
                        >
                          {host.role}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(data.address || data.venue) && (
              <section
                id="location"
                className="text-center py-12"
                style={{
                  borderTop: isDarkPalette
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <h2
                  className="text-2xl mb-4"
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
                >
                  Location
                </h2>
                {data.venue && (
                  <div
                    className="font-semibold text-lg mb-2"
                    style={textColorStyle}
                  >
                    {data.venue}
                  </div>
                )}
                {(data.address || data.city || data.state) && (
                  <div className="opacity-80" style={textColorStyle}>
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
                  id="party"
                  className={currentSize.h2 + " mb-4"}
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
                >
                  Party Details
                </h2>
                <p
                  className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap`}
                  style={textColorStyle}
                >
                  {data.partyDetails.notes}
                </p>
                {data.partyDetails.theme && (
                  <div className="mt-4">
                    <span
                      className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                      style={{
                        ...textColorStyle,
                        backgroundColor: isDarkPalette
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    >
                      Theme: {data.partyDetails.theme}
                    </span>
                  </div>
                )}
                {data.partyDetails.activities && (
                  <div className="mt-4 text-left">
                    <h3 className="font-semibold mb-2" style={textColorStyle}>
                      Activities:
                    </h3>
                    <p
                      className="opacity-80 whitespace-pre-wrap"
                      style={textColorStyle}
                    >
                      {data.partyDetails.activities}
                    </p>
                  </div>
                )}
              </section>
            )}

            {data.gallery.length > 0 && (
              <section
                id="gallery"
                className="py-12"
                style={{
                  borderTop: isDarkPalette
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <h2
                  className="text-2xl mb-6 text-center"
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
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
              <section
                className="text-center py-12"
                style={{
                  borderTop: isDarkPalette
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <h2
                  id="registry"
                  className="text-2xl mb-6"
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
                >
                  Registry
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {data.registries.map((registry, idx) => (
                    <a
                      key={registry.id || `${registry.url}-${idx}`}
                      href={registry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 rounded-full transition-colors"
                      style={{
                        backgroundColor: isDarkPalette
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                        border: isDarkPalette
                          ? "1px solid rgba(255,255,255,0.2)"
                          : "1px solid rgba(0,0,0,0.2)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkPalette
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkPalette
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)";
                      }}
                    >
                      <span
                        className="uppercase tracking-widest text-sm font-semibold"
                        style={textColorStyle}
                      >
                        {registry.label || "Registry"}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {data.rsvp.isEnabled && (
              <section
                id="rsvp"
                className="max-w-3xl mx-auto text-center p-6 md:p-8"
              >
                <h2
                  className={currentSize.h2 + " mb-6"}
                  style={{
                    fontFamily: currentFont.preview,
                    ...textColorStyle,
                    ...textShadowStyle,
                  }}
                >
                  RSVP
                </h2>
                <div
                  className="p-8 rounded-xl text-left"
                  style={{
                    backgroundColor: isDarkPalette
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                    border: isDarkPalette
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  {!rsvpSubmitted ? (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <p className="opacity-80" style={textColorStyle}>
                          {data.rsvp.deadline
                            ? `Kindly respond by ${new Date(
                                data.rsvp.deadline
                              ).toLocaleDateString()}`
                            : "Please RSVP"}
                        </p>
                      </div>
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2"
                          style={textColorStyle}
                        >
                          Full Name
                        </label>
                        <input
                          className="w-full p-4 rounded-lg outline-none transition-colors"
                          placeholder="Guest Name"
                          style={{
                            backgroundColor: isDarkPalette
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                            border: isDarkPalette
                              ? "1px solid rgba(255,255,255,0.2)"
                              : "1px solid rgba(0,0,0,0.2)",
                            color: textColorStyle.color,
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = isDarkPalette
                              ? "rgba(255,255,255,0.5)"
                              : "rgba(0,0,0,0.5)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = isDarkPalette
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(0,0,0,0.2)";
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3"
                          style={textColorStyle}
                        >
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
                            <div
                              className="p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 peer-checked:bg-opacity-20"
                              style={{
                                borderColor: isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)",
                                backgroundColor: isDarkPalette
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.05)",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !e.currentTarget.classList.contains(
                                    "peer-checked"
                                  )
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    isDarkPalette
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !e.currentTarget.classList.contains(
                                    "peer-checked"
                                  )
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    isDarkPalette
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(0,0,0,0.05)";
                                }
                              }}
                            >
                              <div
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                                style={{
                                  borderColor: textColorStyle.color,
                                }}
                              >
                                <div
                                  className="w-5 h-5 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"
                                  style={{
                                    backgroundColor: textColorStyle.color,
                                  }}
                                />
                              </div>
                              <span
                                className="font-semibold"
                                style={textColorStyle}
                              >
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
                            <div
                              className="p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 peer-checked:bg-opacity-20"
                              style={{
                                borderColor: isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)",
                                backgroundColor: isDarkPalette
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.05)",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !e.currentTarget.classList.contains(
                                    "peer-checked"
                                  )
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    isDarkPalette
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !e.currentTarget.classList.contains(
                                    "peer-checked"
                                  )
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    isDarkPalette
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(0,0,0,0.05)";
                                }
                              }}
                            >
                              <div
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                                style={{
                                  borderColor: textColorStyle.color,
                                }}
                              >
                                <div
                                  className="w-5 h-5 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"
                                  style={{
                                    backgroundColor: textColorStyle.color,
                                  }}
                                />
                              </div>
                              <span
                                className="font-semibold"
                                style={textColorStyle}
                              >
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
                        className="w-full py-4 mt-2 font-bold uppercase tracking-widest text-sm rounded-lg transition-colors shadow-lg"
                        style={{
                          backgroundColor: isDarkPalette
                            ? "#ffffff"
                            : "#1e293b",
                          color: isDarkPalette ? "#1e293b" : "#ffffff",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkPalette
                            ? "#f1f5f9"
                            : "#334155";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkPalette
                            ? "#ffffff"
                            : "#1e293b";
                        }}
                      >
                        Send RSVP
                      </button>

                      <div className="mt-4">
                        <div
                          className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-3"
                          style={textColorStyle}
                        >
                          Share & Add to Calendar
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                          <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                            style={{
                              border: isDarkPalette
                                ? "1px solid rgba(255,255,255,0.2)"
                                : "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: isDarkPalette
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                              color: textColorStyle.color,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)";
                            }}
                          >
                            <Share2 size={16} />
                            <span className="hidden sm:inline">Share link</span>
                          </button>
                          <button
                            onClick={handleGoogleCalendar}
                            className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                            style={{
                              border: isDarkPalette
                                ? "1px solid rgba(255,255,255,0.2)"
                                : "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: isDarkPalette
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                              color: textColorStyle.color,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)";
                            }}
                          >
                            <Image
                              src={
                                isDarkPalette
                                  ? "/brands/google-white.svg"
                                  : "/brands/google.svg"
                              }
                              alt="Google"
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                            <span className="hidden sm:inline">Google Cal</span>
                          </button>
                          <button
                            onClick={handleAppleCalendar}
                            className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                            style={{
                              border: isDarkPalette
                                ? "1px solid rgba(255,255,255,0.2)"
                                : "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: isDarkPalette
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                              color: textColorStyle.color,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)";
                            }}
                          >
                            <Image
                              src={
                                isDarkPalette
                                  ? "/brands/apple-white.svg"
                                  : "/brands/apple-black.svg"
                              }
                              alt="Apple"
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                            <span className="hidden sm:inline">Apple Cal</span>
                          </button>
                          <button
                            onClick={handleOutlookCalendar}
                            className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                            style={{
                              border: isDarkPalette
                                ? "1px solid rgba(255,255,255,0.2)"
                                : "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: isDarkPalette
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.1)",
                              color: textColorStyle.color,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                isDarkPalette
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)";
                            }}
                          >
                            <Image
                              src={
                                isDarkPalette
                                  ? "/brands/microsoft-white.svg"
                                  : "/brands/microsoft.svg"
                              }
                              alt="Microsoft"
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                            <span className="hidden sm:inline">Outlook</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3
                        className="text-2xl font-serif mb-2"
                        style={textColorStyle}
                      >
                        Thank you!
                      </h3>
                      <p className="opacity-70" style={textColorStyle}>
                        Your RSVP has been sent.
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRsvpSubmitted(false);
                        }}
                        className="text-sm underline mt-6 opacity-50 hover:opacity-100 transition-opacity"
                        style={textColorStyle}
                      >
                        Send another response
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            <footer
              className="text-center py-8 mt-1"
              style={{
                borderTop: isDarkPalette
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.1)",
              }}
            >
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
              <div className="flex items-center justify-center gap-4 mt-4">
                <a
                  href="https://www.facebook.com/envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Facebook"
                >
                  <Image
                    src="/email/social-facebook.svg"
                    alt="Facebook"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.instagram.com/envitefy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Instagram"
                >
                  <Image
                    src="/email/social-instagram.svg"
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.tiktok.com/@envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="TikTok"
                >
                  <Image
                    src="/email/social-tiktok.svg"
                    alt="TikTok"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.youtube.com/@Envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="YouTube"
                >
                  <Image
                    src="/email/social-youtube.svg"
                    alt="YouTube"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
              </div>
            </footer>
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
        <ScrollBoundary
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
        </ScrollBoundary>

        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
          <div className="flex gap-3">
            {editEventId && (
              <button
                onClick={() => router.push(`/event/${editEventId}`)}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-sm tracking-wide transition-colors shadow-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handlePublish}
              disabled={submitting}
              className={`${
                editEventId ? "flex-1" : "w-full"
              } py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {submitting
                ? editEventId
                  ? "Saving..."
                  : "Publishing..."
                : editEventId
                ? "Save"
                : "Publish"}
            </button>
          </div>
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
