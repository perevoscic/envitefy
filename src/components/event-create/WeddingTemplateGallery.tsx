"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TemplateGallery, {
  type TemplateGalleryTemplate,
  type TemplateGalleryVariation,
  type ResolvedTemplateVariation,
} from "./TemplateGallery";
import {
  type TemplateFontTokenId,
  type TemplatePaletteTokenId,
} from "./templateDesignTokens";

const baseMenu = [
  "Home",
  "Travel",
  "Things To Do",
  "Our Story",
  "Photos",
  "Wedding Party",
  "Registry",
  "RSVP",
];

export type WeddingTemplateDefinition = TemplateGalleryTemplate & {
  preview?: {
    coupleName: string;
    dateLabel: string;
    location: string;
  };
};
export type TemplateVariation = ResolvedTemplateVariation;
type StoryConfig = {
  key: string;
  paletteId: TemplatePaletteTokenId;
  label: string;
  tagline: string;
  titleColorOverride?: string;
};

const buildStories = (
  templateId: string,
  fontId: TemplateFontTokenId,
  configs: StoryConfig[]
): TemplateGalleryVariation[] =>
  configs.map(({ key, ...rest }) => ({
    id: `${templateId}-${key}`,
    fontId,
    ...rest,
  }));

const TEMPLATE_FONT_ASSIGNMENTS: Record<string, TemplateFontTokenId> = {
  "ivory-ink": "font-alex-brush",
  "garden-atelier": "font-allura",
  "desert-lumiere": "font-pacifico",
  "coastal-pearl": "font-arizonia",
  "gilded-twilight": "font-beth-ellen",
  "marble-whisper": "font-bilbo-swash-caps",
  "velvet-noir": "font-cookie",
  "moonlit-terrace": "font-tangerine",
  "champagne-skyline": "font-luxurious-script",
  "art-deco-gala": "font-great-vibes",
  "sunset-vineyard": "font-herr-von-muellerhoff",
  "winter-chalet": "font-indie-flower",
  "palais-moderne": "font-monte-carlo",
  "evergreen-ballroom": "font-kaushan-script",
  "tidal-opulence": "font-kalam",
  "starlight-ballroom": "font-la-belle-aurore",
  "silken-alpine": "font-rouge-script",
  "horizon-chateau": "font-meie-script",
  "celestial-atelier": "font-meddon",
  "harbor-serenade": "font-sacramento",
  "orchid-reverie": "font-satisfy",
  "golden-jubilee": "font-mr-de-haviland",
  "carriage-house": "font-parisienne",
};

export const weddingTemplateCatalog: WeddingTemplateDefinition[] = [
  {
    id: "midnight-bloom",
    name: "Midnight Bloom",
    description:
      "Candlelit florals and contrasting serif lettering for after-dark celebrations.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Velvet Florals",
    menu: [...baseMenu],
    variations: buildStories(
      "midnight-bloom",
      TEMPLATE_FONT_ASSIGNMENTS["midnight-bloom"],
      [
        {
          key: "velvet-midnight",
          paletteId: "midnight-noir",
          label: "Velvet Midnight",
          tagline: "Plum velvet & ink nightfall",
        },
        {
          key: "garnet-ember",
          paletteId: "crimson-velvet",
          label: "Garnet Ember",
          tagline: "Wine-lit romance glow",
        },
        {
          key: "moonlace",
          paletteId: "moonlit-lavender",
          label: "Moonlace",
          tagline: "Lavender twilight lace",
        },
        {
          key: "heirloom-brass",
          paletteId: "golden-ivy",
          label: "Heirloom Brass",
          tagline: "Gilded metallic sheen",
        },
        {
          key: "pearled-ash",
          paletteId: "opal-sand",
          label: "Pearled Ash",
          tagline: "Modern neutral canvas",
        },
        {
          key: "nocturne-ivy",
          paletteId: "garden-emerald",
          label: "Nocturne Ivy",
          tagline: "Shadowed botanical depth",
        },
        {
          key: "celadon-cascade",
          paletteId: "celadon-cascade",
          label: "Celadon Cascade",
          tagline: "Sunset champagne drift",
        },
        {
          key: "velour-waltz",
          paletteId: "velour-waltz",
          label: "Velour Waltz",
          tagline: "Dreamy twilight glaze",
        },
      ]
    ),
    preview: {
      coupleName: "Ava & Mason",
      dateLabel: "September 23, 2028",
      location: "New York, NY",
    },
  },
  {
    id: "ivory-ink",
    name: "Ivory & Ink",
    description:
      "Editorial black-and-white with bespoke typography revealing every detail.",
    heroImageName: "ivory-ink-hero.jpeg",
    heroMood: "Studio Portrait",
    menu: [...baseMenu, "Dress Code"],
    variations: buildStories(
      "ivory-ink",
      TEMPLATE_FONT_ASSIGNMENTS["ivory-ink"],
      [
        {
          key: "gallery-ivory",
          paletteId: "opal-sand",
          label: "Gallery Ivory",
          tagline: "Minimal parchment tones",
        },
        {
          key: "rose-monogram",
          paletteId: "blush-champagne",
          label: "Rose Monogram",
          tagline: "Soft blush serif flourishes",
        },
        {
          key: "sea-salt",
          paletteId: "sea-glass",
          label: "Sea Salt Glass",
          tagline: "Coastal ivory blend",
        },
        {
          key: "gilt-frame",
          paletteId: "golden-ivy",
          label: "Gilt Frame",
          tagline: "Editorial gold edges",
        },
        {
          key: "evening-lilac",
          paletteId: "moonlit-lavender",
          label: "Evening Lilac",
          tagline: "Periwinkle twilight glow",
        },
        {
          key: "charcoal-press",
          paletteId: "midnight-noir",
          label: "Charcoal Press",
          tagline: "Letterpress ink contrast",
        },
      ]
    ),
    preview: {
      coupleName: "Noah & Cam",
      dateLabel: "June 15, 2029",
      location: "Portland, OR",
    },
  },
  {
    id: "garden-atelier",
    name: "Garden Atelier",
    description:
      "Painterly leaves, hand-lettered cues, and lush directional layouts.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Botanical Canopy",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "garden-atelier",
      TEMPLATE_FONT_ASSIGNMENTS["garden-atelier"],
      [
        {
          key: "verdant-atelier",
          paletteId: "garden-emerald",
          label: "Verdant Atelier",
          tagline: "Botanical inked outlines",
        },
        {
          key: "mist-coast",
          paletteId: "sea-glass",
          label: "Mist Coast",
          tagline: "Cool greenhouse glass",
        },
        {
          key: "trellis-brass",
          paletteId: "golden-ivy",
          label: "Trellis Brass",
          tagline: "Gilded lattice cues",
        },
        {
          key: "petal-script",
          paletteId: "blush-champagne",
          label: "Petal Script",
          tagline: "Painterly blush swash",
        },
        {
          key: "sage-dusk",
          paletteId: "moonlit-lavender",
          label: "Sage Dusk",
          tagline: "Lavender twilight canopy",
        },
        {
          key: "terracotta-petal",
          paletteId: "sunset-coral",
          label: "Terracotta Petal",
          tagline: "Warm botanical clay",
        },
      ]
    ),
    preview: {
      coupleName: "Priya & Ren",
      dateLabel: "May 4, 2029",
      location: "Santa Barbara, CA",
    },
  },
  {
    id: "desert-lumiere",
    name: "Desert Lumière",
    description:
      "Warm adobe hues with luxury metallic lines overlaid on sweeping dunes.",
    heroImageName: "desert-lumiere-hero.jpeg",
    heroMood: "Sun-Bleached Stone",
    menu: [...baseMenu, "Weekend"],
    variations: buildStories(
      "desert-lumiere",
      TEMPLATE_FONT_ASSIGNMENTS["desert-lumiere"],
      [
        {
          key: "adobe-ember",
          paletteId: "desert-amber",
          label: "Adobe Ember",
          tagline: "Sun-warmed adobe stone",
        },
        {
          key: "canyon-bloom",
          paletteId: "sunset-coral",
          label: "Canyon Bloom",
          tagline: "Terracotta florals",
        },
        {
          key: "brass-mirage",
          paletteId: "golden-ivy",
          label: "Brass Mirage",
          tagline: "Gilded sand shimmer",
        },
        {
          key: "linen-mesa",
          paletteId: "opal-sand",
          label: "Linen Mesa",
          tagline: "Neutral sandstone fibers",
        },
        {
          key: "saguaro-velvet",
          paletteId: "crimson-velvet",
          label: "Saguaro Velvet",
          tagline: "Desert night velvet",
        },
        {
          key: "oasis-quartz",
          paletteId: "sea-glass",
          label: "Oasis Quartz",
          tagline: "Cooling oasis shimmer",
        },
      ]
    ),
    preview: {
      coupleName: "Elias & Mateo",
      dateLabel: "October 12, 2028",
      location: "Sedona, AZ",
    },
  },
  {
    id: "coastal-pearl",
    name: "Coastal Pearl",
    description:
      "Soft ocean breezes, glassy gradients, and an airy serif for seaside vows.",
    heroImageName: "coastal-pearl-hero.jpeg",
    heroMood: "Ocean Shimmer",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "coastal-pearl",
      TEMPLATE_FONT_ASSIGNMENTS["coastal-pearl"],
      [
        {
          key: "tidal-glass",
          paletteId: "sea-glass",
          label: "Tidal Glass",
          tagline: "Mist and aquamarine",
        },
        {
          key: "dusk-current",
          paletteId: "moonlit-lavender",
          label: "Dusk Current",
          tagline: "Lilac shoreline haze",
        },
        {
          key: "shell-linen",
          paletteId: "opal-sand",
          label: "Shell Linen",
          tagline: "Pearled neutral drift",
        },
        {
          key: "coral-petal",
          paletteId: "blush-champagne",
          label: "Coral Petal",
          tagline: "Sunset blush foam",
        },
        {
          key: "pier-gilt",
          paletteId: "golden-ivy",
          label: "Pier Gilt",
          tagline: "Brassy pier lights",
        },
        {
          key: "storm-break",
          paletteId: "midnight-noir",
          label: "Storm Break",
          tagline: "Moody tide contrast",
        },
      ]
    ),
    preview: {
      coupleName: "Lena & Harper",
      dateLabel: "July 8, 2029",
      location: "Martha's Vineyard, MA",
    },
  },
  {
    id: "gilded-twilight",
    name: "Gilded Twilight",
    description:
      "Artful gold foils on charcoal backdrops with luxe art-deco flourishes.",
    heroImageName: "gilded-twilight-hero.jpeg",
    heroMood: "Gilded Archway",
    menu: [...baseMenu],
    variations: buildStories(
      "gilded-twilight",
      TEMPLATE_FONT_ASSIGNMENTS["gilded-twilight"],
      [
        {
          key: "gilded-twilight",
          paletteId: "golden-ivy",
          label: "Gilded Twilight",
          tagline: "Deco brass luxe",
        },
        {
          key: "ink-ballroom",
          paletteId: "midnight-noir",
          label: "Ink Ballroom",
          tagline: "Charcoal evening drama",
        },
        {
          key: "merlot-tux",
          paletteId: "crimson-velvet",
          label: "Merlot Tux",
          tagline: "Burgundy gala flair",
        },
        {
          key: "amethyst-spark",
          paletteId: "moonlit-lavender",
          label: "Amethyst Spark",
          tagline: "Cool twilight sheen",
        },
        {
          key: "ivory-foil",
          paletteId: "opal-sand",
          label: "Ivory Foil",
          tagline: "Paperwhite shimmer",
        },
        {
          key: "champagne-luxe",
          paletteId: "blush-champagne",
          label: "Champagne Luxe",
          tagline: "Rosy deco lights",
        },
      ]
    ),
    preview: {
      coupleName: "Jordan & Lee",
      dateLabel: "December 1, 2028",
      location: "Chicago, IL",
    },
  },
  {
    id: "marble-whisper",
    name: "Marble Whisper",
    description:
      "Textured stone, minimalist borders, and calm serif headings for grand halls.",
    heroImageName: "marble-whisper-hero.jpeg",
    heroMood: "Marble Detail",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "marble-whisper",
      TEMPLATE_FONT_ASSIGNMENTS["marble-whisper"],
      [
        {
          key: "carrara-veil",
          paletteId: "opal-sand",
          label: "Carrara Veil",
          tagline: "Veined marble calm",
        },
        {
          key: "atrium-fern",
          paletteId: "garden-emerald",
          label: "Atrium Fern",
          tagline: "Emerald inlay wash",
        },
        {
          key: "lilac-fresco",
          paletteId: "moonlit-lavender",
          label: "Lilac Fresco",
          tagline: "Dusty mural hues",
        },
        {
          key: "guilded-sconce",
          paletteId: "golden-ivy",
          label: "Guilded Sconce",
          tagline: "Warm metallic halo",
        },
        {
          key: "fountain-mist",
          paletteId: "sea-glass",
          label: "Fountain Mist",
          tagline: "Cooling marble spray",
        },
        {
          key: "onyx-carving",
          paletteId: "midnight-noir",
          label: "Onyx Carving",
          tagline: "Smoky inlay drama",
        },
      ]
    ),
    preview: {
      coupleName: "Serena & Quinn",
      dateLabel: "April 19, 2029",
      location: "Savannah, GA",
    },
  },
  {
    id: "velvet-noir",
    name: "Velvet Noir",
    description:
      "Dark luxury tinted with jewel-bright florals and a confident serif stack.",
    heroImageName: "velvet-noir-hero.jpeg",
    heroMood: "Noir Petals",
    menu: [...baseMenu, "Dress Code"],
    variations: buildStories(
      "velvet-noir",
      TEMPLATE_FONT_ASSIGNMENTS["velvet-noir"],
      [
        {
          key: "velvet-noir",
          paletteId: "midnight-noir",
          label: "Velvet Noir",
          tagline: "Deep black-tie luxe",
        },
        {
          key: "cabernet-bloom",
          paletteId: "crimson-velvet",
          label: "Cabernet Bloom",
          tagline: "Wine-stained petals",
        },
        {
          key: "iris-smoke",
          paletteId: "moonlit-lavender",
          label: "Iris Smoke",
          tagline: "Cool lavender haze",
        },
        {
          key: "brass-marquis",
          paletteId: "golden-ivy",
          label: "Brass Marquis",
          tagline: "Golden marquee glow",
        },
        {
          key: "blush-shadow",
          paletteId: "blush-champagne",
          label: "Blush Shadow",
          tagline: "Soft neutral contrast",
        },
        {
          key: "opal-flare",
          paletteId: "opal-sand",
          label: "Opal Flare",
          tagline: "Powdered neutral glow",
        },
      ]
    ),
    preview: {
      coupleName: "Cam & Jordan",
      dateLabel: "February 9, 2029",
      location: "Philadelphia, PA",
    },
  },
  {
    id: "moonlit-terrace",
    name: "Moonlit Terrace",
    description:
      "Crescent moons, soft gradients, and lyrical scripts for rooftop celebrations.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Moonlit Terrace",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "moonlit-terrace",
      TEMPLATE_FONT_ASSIGNMENTS["moonlit-terrace"],
      [
        {
          key: "moon-terrace",
          paletteId: "moonlit-lavender",
          label: "Moon Terrace",
          tagline: "Rooftop lilac haze",
        },
        {
          key: "city-tide",
          paletteId: "sea-glass",
          label: "City Tide",
          tagline: "Skyline teal glimmer",
        },
        {
          key: "starlit-slate",
          paletteId: "midnight-noir",
          label: "Starlit Slate",
          tagline: "Inky midnight canopy",
        },
        {
          key: "stone-balcony",
          paletteId: "opal-sand",
          label: "Stone Balcony",
          tagline: "Pale limestone wash",
        },
        {
          key: "lantern-gleam",
          paletteId: "golden-ivy",
          label: "Lantern Gleam",
          tagline: "Warm brass balcony lights",
        },
        {
          key: "twilight-rose",
          paletteId: "sunset-coral",
          label: "Twilight Rose",
          tagline: "Warm rooftop dusk",
        },
      ]
    ),
    preview: {
      coupleName: "Noelle & Avery",
      dateLabel: "June 30, 2029",
      location: "Denver, CO",
    },
  },
  {
    id: "champagne-skyline",
    name: "Champagne Skyline",
    description:
      "City views, glass sparkle, and wide‐lettered tallcaps that echo skyline bars.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "City Sparkle",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "champagne-skyline",
      TEMPLATE_FONT_ASSIGNMENTS["champagne-skyline"],
      [
        {
          key: "champagne-glow",
          paletteId: "blush-champagne",
          label: "Champagne Glow",
          tagline: "Skyline blush glass",
        },
        {
          key: "city-gilt",
          paletteId: "golden-ivy",
          label: "City Gilt",
          tagline: "Tower lights shimmer",
        },
        {
          key: "penthouse-noir",
          paletteId: "midnight-noir",
          label: "Penthouse Noir",
          tagline: "After-dark skyline",
        },
        {
          key: "river-lights",
          paletteId: "sea-glass",
          label: "River Lights",
          tagline: "Cool urban teal",
        },
        {
          key: "sunset-highball",
          paletteId: "desert-amber",
          label: "Sunset Highball",
          tagline: "Cocktail amber sheen",
        },
        {
          key: "marina-emerald",
          paletteId: "garden-emerald",
          label: "Marina Emerald",
          tagline: "Glasshouse green glint",
        },
      ]
    ),
    preview: {
      coupleName: "Eleanor & Claire",
      dateLabel: "November 14, 2028",
      location: "San Francisco, CA",
    },
  },
  {
    id: "art-deco-gala",
    name: "Art Deco Gala",
    description:
      "Geometric frames, metallic edges, and graceful type for ballroom dances.",
    heroImageName: "art-deco-gala-hero.jpeg",
    heroMood: "Deco Geometry",
    menu: [...baseMenu],
    variations: buildStories(
      "art-deco-gala",
      TEMPLATE_FONT_ASSIGNMENTS["art-deco-gala"],
      [
        {
          key: "marquee-noir",
          paletteId: "midnight-noir",
          label: "Marquee Noir",
          tagline: "Deco midnight stage",
        },
        {
          key: "ruby-fanfare",
          paletteId: "crimson-velvet",
          label: "Ruby Fanfare",
          tagline: "Ballroom ruby flourish",
        },
        {
          key: "gatsby-brass",
          paletteId: "golden-ivy",
          label: "Gatsby Brass",
          tagline: "Geometric gold lines",
        },
        {
          key: "emerald-jazz",
          paletteId: "garden-emerald",
          label: "Emerald Jazz",
          tagline: "Green deco notes",
        },
        {
          key: "silver-overture",
          paletteId: "moonlit-lavender",
          label: "Silver Overture",
          tagline: "Platinum prelude",
        },
        {
          key: "opal-spotlight",
          paletteId: "opal-sand",
          label: "Opal Spotlight",
          tagline: "Luminous deco stone",
        },
      ]
    ),
    preview: {
      coupleName: "Milo & Ahmed",
      dateLabel: "March 2, 2029",
      location: "New Orleans, LA",
    },
  },
  {
    id: "sunset-vineyard",
    name: "Sunset Vineyard",
    description:
      "Dusty coral shades, leafy wreaths, and flowing serif lines for countryside vows.",
    heroImageName: "sunset-vineyard-hero.jpeg",
    heroMood: "Sunset over Vines",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "sunset-vineyard",
      TEMPLATE_FONT_ASSIGNMENTS["sunset-vineyard"],
      [
        {
          key: "rose-canopy",
          paletteId: "sunset-coral",
          label: "Rosé Canopy",
          tagline: "Terracotta vines",
        },
        {
          key: "peach-estate",
          paletteId: "blush-champagne",
          label: "Peach Estate",
          tagline: "Summer orchard shimmer",
        },
        {
          key: "treasure-harvest",
          paletteId: "golden-ivy",
          label: "Treasure Harvest",
          tagline: "Golden vineyard light",
        },
        {
          key: "amber-barrel",
          paletteId: "desert-amber",
          label: "Amber Barrel",
          tagline: "Cask-aged warmth",
        },
        {
          key: "vineyard-grove",
          paletteId: "garden-emerald",
          label: "Vineyard Grove",
          tagline: "Leafy evening breeze",
        },
        {
          key: "dusk-indigo",
          paletteId: "midnight-noir",
          label: "Dusk Indigo",
          tagline: "Evening vineyard haze",
        },
      ]
    ),
    preview: {
      coupleName: "Bianca & Theo",
      dateLabel: "August 18, 2029",
      location: "Napa Valley, CA",
    },
  },
  {
    id: "winter-chalet",
    name: "Winter Chalet",
    description:
      "Snowy minimalism, frosted edges, and thin serif text ready for alpine invites.",
    heroImageName: "winter-chalet-hero.jpeg",
    heroMood: "Frosted Lodge",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "winter-chalet",
      TEMPLATE_FONT_ASSIGNMENTS["winter-chalet"],
      [
        {
          key: "frosted-lilac",
          paletteId: "moonlit-lavender",
          label: "Frosted Lilac",
          tagline: "Snowy dusk glow",
        },
        {
          key: "glacier-ink",
          paletteId: "midnight-noir",
          label: "Glacier Ink",
          tagline: "Nighttime alpine",
        },
        {
          key: "linen-chalet",
          paletteId: "opal-sand",
          label: "Linen Chalet",
          tagline: "Warm wool neutrals",
        },
        {
          key: "icefall-mist",
          paletteId: "sea-glass",
          label: "Icefall Mist",
          tagline: "Minted winter wash",
        },
        {
          key: "hearth-brass",
          paletteId: "golden-ivy",
          label: "Hearth Brass",
          tagline: "Copper firelight",
        },
        {
          key: "cranberry-fir",
          paletteId: "crimson-velvet",
          label: "Cranberry Fir",
          tagline: "Fireside berry glow",
        },
      ]
    ),
    preview: {
      coupleName: "Kai & Max",
      dateLabel: "January 10, 2029",
      location: "Lake Tahoe, CA",
    },
  },
  {
    id: "palais-moderne",
    name: "Palais Moderne",
    description:
      "Modern symmetry, asymmetrical menus, and restrained palettes for bold couples.",
    heroImageName: "palais-moderne-hero.jpeg",
    heroMood: "Modern Gallery",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "palais-moderne",
      TEMPLATE_FONT_ASSIGNMENTS["palais-moderne"],
      [
        {
          key: "gallery-mint",
          paletteId: "sea-glass",
          label: "Gallery Mint",
          tagline: "Modern seafoam hue",
        },
        {
          key: "atrium-green",
          paletteId: "garden-emerald",
          label: "Atrium Green",
          tagline: "Museum atrium leaves",
        },
        {
          key: "stucco-veil",
          paletteId: "opal-sand",
          label: "Stucco Veil",
          tagline: "Soft sandstone wash",
        },
        {
          key: "lilac-plinth",
          paletteId: "moonlit-lavender",
          label: "Lilac Plinth",
          tagline: "Sculptural lilac shade",
        },
        {
          key: "obsidian-wing",
          paletteId: "midnight-noir",
          label: "Obsidian Wing",
          tagline: "Gallery noir accent",
        },
        {
          key: "terracotta-gallery",
          paletteId: "sunset-coral",
          label: "Terracotta Gallery",
          tagline: "Warm modern contrast",
        },
      ]
    ),
    preview: {
      coupleName: "Ivy & Lin",
      dateLabel: "May 28, 2029",
      location: "Los Angeles, CA",
    },
  },
  {
    id: "evergreen-ballroom",
    name: "Evergreen Ballroom",
    description:
      "Dark green, gold leaf, and organic script for grand ballroom affairs.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Emerald Canopy",
    menu: [...baseMenu],
    variations: buildStories(
      "evergreen-ballroom",
      TEMPLATE_FONT_ASSIGNMENTS["evergreen-ballroom"],
      [
        {
          key: "evergreen-waltz",
          paletteId: "garden-emerald",
          label: "Evergreen Waltz",
          tagline: "Grand forest flair",
        },
        {
          key: "azure-arbor",
          paletteId: "sea-glass",
          label: "Azure Arbor",
          tagline: "Cool greenhouse tint",
        },
        {
          key: "crown-brass",
          paletteId: "golden-ivy",
          label: "Crown Brass",
          tagline: "Royal metallic edge",
        },
        {
          key: "boxwood-night",
          paletteId: "midnight-noir",
          label: "Boxwood Night",
          tagline: "Dark botanical hush",
        },
        {
          key: "rosette-fern",
          paletteId: "blush-champagne",
          label: "Rosette Fern",
          tagline: "Soft rose vines",
        },
        {
          key: "amber-candela",
          paletteId: "desert-amber",
          label: "Amber Candela",
          tagline: "Candlelit canopy glow",
        },
      ]
    ),
    preview: {
      coupleName: "Riley & Sage",
      dateLabel: "September 07, 2029",
      location: "Seattle, WA",
    },
  },
  {
    id: "tidal-opulence",
    name: "Tidal Opulence",
    description:
      "Pearlescent shells, gallery grids, and lavish serif type for oceanfront vows.",
    heroImageName: "tidal-opulence-hero.jpeg",
    heroMood: "Pearl Tide",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "tidal-opulence",
      TEMPLATE_FONT_ASSIGNMENTS["tidal-opulence"],
      [
        {
          key: "opaline-tide",
          paletteId: "sea-glass",
          label: "Opaline Tide",
          tagline: "Glass tidepools",
        },
        {
          key: "salted-amber",
          paletteId: "desert-amber",
          label: "Salted Amber",
          tagline: "Beachfront amber sky",
        },
        {
          key: "shell-blush",
          paletteId: "blush-champagne",
          label: "Shell Blush",
          tagline: "Pearled rosy shell",
        },
        {
          key: "harbor-gilt",
          paletteId: "golden-ivy",
          label: "Harbor Gilt",
          tagline: "Pierside metallics",
        },
        {
          key: "lilac-current",
          paletteId: "moonlit-lavender",
          label: "Lilac Current",
          tagline: "Evening surf shimmer",
        },
        {
          key: "reef-ink",
          paletteId: "midnight-noir",
          label: "Reef Ink",
          tagline: "Deep ocean drama",
        },
      ]
    ),
    preview: {
      coupleName: "Nadia & Chen",
      dateLabel: "April 27, 2029",
      location: "Honolulu, HI",
    },
  },
  {
    id: "starlight-ballroom",
    name: "Starlight Ballroom",
    description:
      "Ink pulps, shooting stars, and illuminated script sections for starry affairs.",
    heroImageName: "starlight-ballroom-hero.jpeg",
    heroMood: "Star-Etched Sky",
    menu: [...baseMenu],
    variations: buildStories(
      "starlight-ballroom",
      TEMPLATE_FONT_ASSIGNMENTS["starlight-ballroom"],
      [
        {
          key: "starliner-noir",
          paletteId: "midnight-noir",
          label: "Starliner Noir",
          tagline: "Constellation black",
        },
        {
          key: "nebula-lilac",
          paletteId: "moonlit-lavender",
          label: "Nebula Lilac",
          tagline: "Celestial mauve",
        },
        {
          key: "orbit-brass",
          paletteId: "golden-ivy",
          label: "Orbit Brass",
          tagline: "Gilded starlight",
        },
        {
          key: "comet-rouge",
          paletteId: "crimson-velvet",
          label: "Comet Rouge",
          tagline: "Crimson shooting stars",
        },
        {
          key: "aurora-mist",
          paletteId: "sea-glass",
          label: "Aurora Mist",
          tagline: "Blue-green aurora glow",
        },
        {
          key: "polaris-ice",
          paletteId: "opal-sand",
          label: "Polaris Ice",
          tagline: "Icy star shimmer",
        },
      ]
    ),
    preview: {
      coupleName: "Lucas & Owen",
      dateLabel: "October 05, 2029",
      location: "Austin, TX",
    },
  },
  {
    id: "silken-alpine",
    name: "Silken Alpine",
    description:
      "Snowy linen, glassy serif strokes, and alpine vistas for high-country vows.",
    heroImageName: "silken-alpine-hero.jpeg",
    heroMood: "Winter Panorama",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "silken-alpine",
      TEMPLATE_FONT_ASSIGNMENTS["silken-alpine"],
      [
        {
          key: "silken-drift",
          paletteId: "opal-sand",
          label: "Silken Drift",
          tagline: "Ivory snow textures",
        },
        {
          key: "pinecrest",
          paletteId: "garden-emerald",
          label: "Pinecrest",
          tagline: "Evergreen peaks",
        },
        {
          key: "alpenglow-iris",
          paletteId: "moonlit-lavender",
          label: "Alpenglow Iris",
          tagline: "Lavender mountain light",
        },
        {
          key: "copper-chalet",
          paletteId: "desert-amber",
          label: "Copper Chalet",
          tagline: "Warm timber glow",
        },
        {
          key: "summit-brass",
          paletteId: "golden-ivy",
          label: "Summit Brass",
          tagline: "Bold metallic summits",
        },
        {
          key: "frost-berry",
          paletteId: "crimson-velvet",
          label: "Frost Berry",
          tagline: "Berry alpine accent",
        },
      ]
    ),
    preview: {
      coupleName: "Zara & Milo",
      dateLabel: "December 21, 2028",
      location: "Aspen, CO",
    },
  },
  {
    id: "horizon-chateau",
    name: "Horizon Château",
    description:
      "Sunrise headlands, crisp script, and luminous galleries for chateau celebrations.",
    heroImageName: "horizon-chateau-hero.jpeg",
    heroMood: "Sunrise Balcony",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "horizon-chateau",
      TEMPLATE_FONT_ASSIGNMENTS["horizon-chateau"],
      [
        {
          key: "rose-horizon",
          paletteId: "blush-champagne",
          label: "Rose Horizon",
          tagline: "Dawn pastel glow",
        },
        {
          key: "violet-chateau",
          paletteId: "moonlit-lavender",
          label: "Violet Château",
          tagline: "Evening lavender sky",
        },
        {
          key: "azure-estate",
          paletteId: "sea-glass",
          label: "Azure Estate",
          tagline: "Cool coastal castle",
        },
        {
          key: "citrine-arch",
          paletteId: "desert-amber",
          label: "Citrine Arch",
          tagline: "Golden archways",
        },
        {
          key: "obsidian-cellar",
          paletteId: "midnight-noir",
          label: "Obsidian Cellar",
          tagline: "Dramatic nightcap",
        },
        {
          key: "garden-parterre",
          paletteId: "garden-emerald",
          label: "Garden Parterre",
          tagline: "Formal terrace greens",
        },
      ]
    ),
    preview: {
      coupleName: "Amelia & Camille",
      dateLabel: "May 12, 2029",
      location: "Paris, France",
    },
  },
  {
    id: "celestial-atelier",
    name: "Celestial Atelier",
    description:
      "Star charts, moonbeams, and airy scripts that feel like a couture atelier.",
    heroImageName: "celestial-atelier-hero.jpeg",
    heroMood: "Celestial Glow",
    menu: [...baseMenu],
    variations: buildStories(
      "celestial-atelier",
      TEMPLATE_FONT_ASSIGNMENTS["celestial-atelier"],
      [
        {
          key: "celestial-violet",
          paletteId: "moonlit-lavender",
          label: "Celestial Violet",
          tagline: "Star-mapped lilac",
        },
        {
          key: "lunar-aqua",
          paletteId: "sea-glass",
          label: "Lunar Aqua",
          tagline: "Cosmic teal gradient",
        },
        {
          key: "orbit-noir",
          paletteId: "midnight-noir",
          label: "Orbit Noir",
          tagline: "Deep cosmos ink",
        },
        {
          key: "solar-gilt",
          paletteId: "golden-ivy",
          label: "Solar Gilt",
          tagline: "Sunbeam metallic highlights",
        },
        {
          key: "meteor-amber",
          paletteId: "desert-amber",
          label: "Meteor Amber",
          tagline: "Falling ember trails",
        },
        {
          key: "aurora-blush",
          paletteId: "blush-champagne",
          label: "Aurora Blush",
          tagline: "Soft cosmic blush",
        },
      ]
    ),
    preview: {
      coupleName: "Robin & Theo",
      dateLabel: "October 22, 2029",
      location: "Boston, MA",
    },
  },
  {
    id: "harbor-serenade",
    name: "Harbor Serenade",
    description:
      "Dockside lanterns, watercolor gradients, and calligraphed couples for seaside evenings.",
    heroImageName: "harbor-serenade-hero.jpeg",
    heroMood: "Harbor Twilight",
    menu: [...baseMenu, "Travel"],
    variations: buildStories(
      "harbor-serenade",
      TEMPLATE_FONT_ASSIGNMENTS["harbor-serenade"],
      [
        {
          key: "lantern-mist",
          paletteId: "sea-glass",
          label: "Lantern Mist",
          tagline: "Verdigris harbor glow",
        },
        {
          key: "coral-quay",
          paletteId: "sunset-coral",
          label: "Coral Quay",
          tagline: "Sunset dock blush",
        },
        {
          key: "brass-tide",
          paletteId: "golden-ivy",
          label: "Brass Tide",
          tagline: "Lantern-lit pier",
        },
        {
          key: "navy-starboard",
          paletteId: "midnight-noir",
          label: "Navy Starboard",
          tagline: "Nightfall reflections",
        },
        {
          key: "pearl-harbor",
          paletteId: "opal-sand",
          label: "Pearl Harbor",
          tagline: "Chalky sailcloth light",
        },
        {
          key: "driftwood-rose",
          paletteId: "blush-champagne",
          label: "Driftwood Rose",
          tagline: "Weathered romantic neutrals",
        },
      ]
    ),
    preview: {
      coupleName: "Isla & Rowan",
      dateLabel: "September 6, 2029",
      location: "Charleston, SC",
    },
  },
  {
    id: "orchid-reverie",
    name: "Orchid Reverie",
    description:
      "Velvet florals, gradient washes, and sculpted script for indoor garden fetes.",
    heroImageName: "orchid-reverie-hero.jpeg",
    heroMood: "Orchid Conservatory",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "orchid-reverie",
      TEMPLATE_FONT_ASSIGNMENTS["orchid-reverie"],
      [
        {
          key: "orchid-velvet",
          paletteId: "crimson-velvet",
          label: "Orchid Velvet",
          tagline: "Deep magenta petals",
        },
        {
          key: "lavender-haze",
          paletteId: "moonlit-lavender",
          label: "Lavender Haze",
          tagline: "Soft lilac bloom",
        },
        {
          key: "jade-glass",
          paletteId: "garden-emerald",
          label: "Jade Glass",
          tagline: "Tropical fern tones",
        },
        {
          key: "champagne-petal",
          paletteId: "blush-champagne",
          label: "Champagne Petal",
          tagline: "Muted floral blush",
        },
        {
          key: "noir-stamen",
          paletteId: "midnight-noir",
          label: "Noir Stamen",
          tagline: "High-contrast detail",
        },
        {
          key: "sunlit-terrarium",
          paletteId: "desert-amber",
          label: "Sunlit Terrarium",
          tagline: "Amber conservatory glow",
        },
      ]
    ),
    preview: {
      coupleName: "Lillie & Reese",
      dateLabel: "April 4, 2029",
      location: "Atlanta, GA",
    },
  },
  {
    id: "golden-jubilee",
    name: "Golden Jubilee",
    description:
      "Heritage ballrooms, gilded borders, and cascading script for black-tie evenings.",
    heroImageName: "golden-jubilee-hero.jpeg",
    heroMood: "Gala Ballroom",
    menu: [...baseMenu],
    variations: buildStories(
      "golden-jubilee",
      TEMPLATE_FONT_ASSIGNMENTS["golden-jubilee"],
      [
        {
          key: "chandelier-gilt",
          paletteId: "golden-ivy",
          label: "Chandelier Gilt",
          tagline: "Glowing ballroom brass",
        },
        {
          key: "midnight-waltz",
          paletteId: "midnight-noir",
          label: "Midnight Waltz",
          tagline: "Black-tie encore",
        },
        {
          key: "burgundy-toast",
          paletteId: "crimson-velvet",
          label: "Burgundy Toast",
          tagline: "Cabernet celebration",
        },
        {
          key: "oyster-foil",
          paletteId: "opal-sand",
          label: "Oyster Foil",
          tagline: "Ivory metallic edge",
        },
        {
          key: "champagne-fringe",
          paletteId: "blush-champagne",
          label: "Champagne Fringe",
          tagline: "Rosy gala detailing",
        },
        {
          key: "violet-spotlight",
          paletteId: "moonlit-lavender",
          label: "Violet Spotlight",
          tagline: "Cold theatre lights",
        },
      ]
    ),
    preview: {
      coupleName: "Helena & Amir",
      dateLabel: "November 23, 2029",
      location: "New York, NY",
    },
  },
  {
    id: "carriage-house",
    name: "Carriage House",
    description:
      "Garden estate arches, antique typography, and warm neutrals for historic venues.",
    heroImageName: "carriage-house-hero.jpeg",
    heroMood: "Estate Courtyard",
    menu: [...baseMenu, "Accommodations"],
    variations: buildStories(
      "carriage-house",
      TEMPLATE_FONT_ASSIGNMENTS["carriage-house"],
      [
        {
          key: "courtyard-blush",
          paletteId: "blush-champagne",
          label: "Courtyard Blush",
          tagline: "Pink limestone wash",
        },
        {
          key: "ivy-crest",
          paletteId: "garden-emerald",
          label: "Ivy Crest",
          tagline: "Climbing greenery",
        },
        {
          key: "coach-stone",
          paletteId: "opal-sand",
          label: "Coach Stone",
          tagline: "Faded sandstone",
        },
        {
          key: "lantern-umber",
          paletteId: "desert-amber",
          label: "Lantern Umber",
          tagline: "Copper-gold lanterns",
        },
        {
          key: "charcoal-mantel",
          paletteId: "midnight-noir",
          label: "Charcoal Mantel",
          tagline: "Historic hearth trim",
        },
        {
          key: "petal-atrium",
          paletteId: "sunset-coral",
          label: "Petal Atrium",
          tagline: "Peach courtyard light",
        },
      ]
    ),
    preview: {
      coupleName: "Genevieve & Luca",
      dateLabel: "June 1, 2029",
      location: "Savannah, GA",
    },
  },
];

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  showColorStories?: boolean;
  onApplyTemplate: (
    template: WeddingTemplateDefinition,
    variation: ResolvedTemplateVariation
  ) => void;
};

export default function WeddingTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  showColorStories = true,
  onApplyTemplate,
}: Props) {
  const [customHeroImage, setCustomHeroImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handlePreviewUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;
      setCustomHeroImage(nextUrl);
    },
    []
  );

  const clearPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCustomHeroImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="max-w-2xl rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-stone-900">
            Preview with your photo
          </p>
          <p className="text-xs text-stone-600">
            Upload an inspiration image to visualize every template.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            id="wedding-preview-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePreviewUpload}
          />
          <label
            htmlFor="wedding-preview-upload"
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-700 transition hover:border-stone-400"
          >
            Choose image
          </label>
          {customHeroImage ? (
            <>
              <button
                type="button"
                onClick={clearPreview}
                className="inline-flex items-center rounded-full bg-stone-900/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-stone-900"
              >
                Remove
              </button>
              <span className="text-xs text-stone-600">
                Showing your uploaded photo across all templates.
              </span>
            </>
          ) : (
            <span className="text-xs text-stone-600">
              No photo selected yet.
            </span>
          )}
        </div>
      </div>
      <div className="w-full max-w-6xl">
        <TemplateGallery
          templates={weddingTemplateCatalog}
          appliedTemplateId={appliedTemplateId}
          appliedVariationId={appliedVariationId}
          onApplyTemplate={onApplyTemplate}
          previewHeroImageUrl={customHeroImage}
          showColorStories={showColorStories}
        />
      </div>
    </div>
  );
}
