"use client";

export type TitleWeight = "normal" | "semibold" | "bold";
export type TitleAlign = "left" | "center" | "right";

export type TemplateFontToken = {
  id: string;
  label: string;
  fontVar: string;
  weight: TitleWeight;
  align: TitleAlign;
};

export type TemplatePaletteToken = {
  id: string;
  label: string;
  tagline: string;
  swatches: string[];
  background: string;
  titleColor: string;
  defaultFontId: TemplateFontTokenId;
};

const BASE_FONT_TOKENS = {
  "serif-regal-center": {
    id: "serif-regal-center",
    label: "Regal Serif Centered",
    fontVar: "var(--font-playfair)",
    weight: "semibold",
    align: "center",
  },
  "serif-bold-center": {
    id: "serif-bold-center",
    label: "Serif Bold Centered",
    fontVar: "var(--font-playfair)",
    weight: "bold",
    align: "center",
  },
  "sans-classic-left": {
    id: "sans-classic-left",
    label: "Classic Sans Left",
    fontVar: "var(--font-montserrat)",
    weight: "normal",
    align: "left",
  },
  "sans-classic-center": {
    id: "sans-classic-center",
    label: "Classic Sans Center",
    fontVar: "var(--font-montserrat)",
    weight: "semibold",
    align: "center",
  },
  "raleway-editorial": {
    id: "raleway-editorial",
    label: "Editorial Raleway",
    fontVar: "var(--font-raleway)",
    weight: "semibold",
    align: "center",
  },
  "raleway-luxe-left": {
    id: "raleway-luxe-left",
    label: "Luxe Raleway Left",
    fontVar: "var(--font-raleway)",
    weight: "normal",
    align: "left",
  },
  "script-center": {
    id: "script-center",
    label: "Script Center",
    fontVar: "var(--font-dancing)",
    weight: "bold",
    align: "center",
  },
  "poppins-center": {
    id: "poppins-center",
    label: "Poppins Center",
    fontVar: "var(--font-poppins)",
    weight: "semibold",
    align: "center",
  },
  "geist-bold-center": {
    id: "geist-bold-center",
    label: "Geist Bold Center",
    fontVar: "var(--font-geist-sans)",
    weight: "bold",
    align: "center",
  },
} satisfies Record<string, TemplateFontToken>;

const SCRIPT_FONT_ENTRIES = [
  {
    id: "font-great-vibes",
    label: "Great Vibes - beautifully flowing, formal script.",
    varName: "var(--font-great-vibes)",
  },
  {
    id: "font-allura",
    label: "Allura - clean and legible with elegant script flourishes.",
    varName: "var(--font-allura)",
  },
  {
    id: "font-alex-brush",
    label: "Alex Brush - flowing brush script, good for names on invites.",
    varName: "var(--font-alex-brush)",
  },
  {
    id: "font-parisienne",
    label: "Parisienne - casual connecting script with a vintage feel.",
    varName: "var(--font-parisienne)",
  },
  {
    id: "font-luxurious-script",
    label: "Luxurious Script - highly slanted, condensed formal script.",
    varName: "var(--font-luxurious-script)",
  },
  {
    id: "font-monte-carlo",
    label: "Monte Carlo - formal connecting script, legible yet decorative.",
    varName: "var(--font-monte-carlo)",
  },
  {
    id: "font-tangerine",
    label: "Tangerine - elegant calligraphic style with tall ascenders.",
    varName: "var(--font-tangerine)",
  },
  {
    id: "font-mr-de-haviland",
    label: "Mr De Haviland - classic cursive with flourish, great for names.",
    varName: "var(--font-mr-de-haviland)",
  },
  {
    id: "font-rouge-script",
    label: "Rouge Script - loose, stylish handwritten script.",
    varName: "var(--font-rouge-script)",
  },
  {
    id: "font-satisfy",
    label: "Satisfy - charming handwriting-style script.",
    varName: "var(--font-satisfy)",
  },
  {
    id: "font-sacramento",
    label: "Sacramento - refined thin cursive, formal yet readable.",
    varName: "var(--font-sacramento)",
  },
  {
    id: "font-yesteryear",
    label: "Yesteryear - flat nib connecting script with vintage mood.",
    varName: "var(--font-yesteryear)",
  },
  {
    id: "font-arizonia",
    label: "Arizonia - flowing sign-painter style script, decorative.",
    varName: "var(--font-arizonia)",
  },
  {
    id: "font-bilbo-swash-caps",
    label: "Bilbo Swash Caps - decorative script with bold swashes.",
    varName: "var(--font-bilbo-swash-caps)",
  },
  {
    id: "font-la-belle-aurore",
    label: "La Belle Aurore - delicate cursive, soft and elegant.",
    varName: "var(--font-la-belle-aurore)",
  },
  {
    id: "font-indie-flower",
    label: "Indie Flower - casual handwritten style for relaxed invites.",
    varName: "var(--font-indie-flower)",
  },
  {
    id: "font-meddon",
    label: "Meddon - handwritten cursive that feels personable and warm.",
    varName: "var(--font-meddon)",
  },
  {
    id: "font-cookie",
    label: "Cookie - soft, friendly script ideal for names or headings.",
    varName: "var(--font-cookie)",
  },
  {
    id: "font-shadows-into-light",
    label: "Shadows Into Light - neat handwritten style, simpler than ornate scripts.",
    varName: "var(--font-shadows-into-light)",
  },
  {
    id: "font-yellowtail",
    label: "Yellowtail - retro brush script with smooth flow.",
    varName: "var(--font-yellowtail)",
  },
  {
    id: "font-dancing-script",
    label: "Dancing Script - lively bouncing script that stays elegant.",
    varName: "var(--font-dancing)",
  },
  {
    id: "font-pacifico",
    label: "Pacifico - beachy brush script for casual or semi-formal invites.",
    varName: "var(--font-pacifico)",
  },
  {
    id: "font-kalam",
    label: "Kalam - flowing handwriting style that stays readable.",
    varName: "var(--font-kalam)",
  },
  {
    id: "font-kaushan-script",
    label: "Kaushan Script - assertive yet elegant with dynamic edges.",
    varName: "var(--font-kaushan-script)",
  },
  {
    id: "font-meie-script",
    label: "Meie Script - elegant flowing script suited for signatures.",
    varName: "var(--font-meie-script)",
  },
  {
    id: "font-niconne",
    label: "Niconne - playful yet elegant script for decorative text.",
    varName: "var(--font-niconne)",
  },
  {
    id: "font-beth-ellen",
    label: "Beth Ellen - relaxed handwritten style for less formal invites.",
    varName: "var(--font-beth-ellen)",
  },
  {
    id: "font-mrs-saint-delafield",
    label: "Mrs Saint Delafield - ornate script with a formal flourish.",
    varName: "var(--font-mrs-saint-delafield)",
  },
  {
    id: "font-herr-von-muellerhoff",
    label: "Herr Von Muellerhoff - decorative calligraphic style for headings.",
    varName: "var(--font-herr-von-muellerhoff)",
  },
  {
    id: "font-parisienne-accent",
    label: "Parisienne Accent - casual yet elegant for highlight text.",
    varName: "var(--font-parisienne)",
  },
] as const;

const SCRIPT_FONT_TOKENS = SCRIPT_FONT_ENTRIES.reduce<
  Record<string, TemplateFontToken>
>((acc, entry) => {
  acc[entry.id] = {
    id: entry.id,
    label: entry.label,
    fontVar: entry.varName,
    weight: "normal",
    align: "center",
  };
  return acc;
}, {}) as Record<(typeof SCRIPT_FONT_ENTRIES)[number]["id"], TemplateFontToken>;

export const TEMPLATE_FONT_TOKENS = {
  ...BASE_FONT_TOKENS,
  ...SCRIPT_FONT_TOKENS,
} satisfies Record<string, TemplateFontToken>;

export type TemplateFontTokenId = keyof typeof TEMPLATE_FONT_TOKENS;

export const TEMPLATE_PALETTE_TOKENS = {
  "blush-champagne": {
    id: "blush-champagne",
    label: "Blush & Champagne",
    tagline: "Soft rose-gold warmth",
    swatches: ["#FDF3EF", "#F5D6CA", "#E0B8A9", "#AC7F73", "#4A1E19"],
    background: "linear-gradient(145deg, #FDF3EF, #E0B8A9)",
    titleColor: "#3C1511",
    defaultFontId: "serif-regal-center",
  },
  "midnight-noir": {
    id: "midnight-noir",
    label: "Midnight Noir",
    tagline: "Candlelit drama",
    swatches: ["#0F0D17", "#1F142E", "#30404F", "#7E5A8A", "#C7B5D4"],
    background: "linear-gradient(160deg, #0F0D17, #30404F)",
    titleColor: "#ECD7E7",
    defaultFontId: "serif-bold-center",
  },
  "garden-emerald": {
    id: "garden-emerald",
    label: "Garden Emerald",
    tagline: "Botanical atelier",
    swatches: ["#F4F5F0", "#C6D8D1", "#93B4A9", "#577864", "#24382D"],
    background: "linear-gradient(150deg, #F4F5F0, #93B4A9)",
    titleColor: "#24382D",
    defaultFontId: "raleway-editorial",
  },
  "opal-sand": {
    id: "opal-sand",
    label: "Opal Sand",
    tagline: "Marble fresh neutrals",
    swatches: ["#FFF9F6", "#F3E2D7", "#D7B9A9", "#93756A", "#4B3A34"],
    background: "linear-gradient(145deg, #FFF9F6, #D7B9A9)",
    titleColor: "#4B3A34",
    defaultFontId: "sans-classic-left",
  },
  "moonlit-lavender": {
    id: "moonlit-lavender",
    label: "Moonlit Lavender",
    tagline: "Twilight whispers",
    swatches: ["#F0F2F7", "#D8D7E5", "#9FA6C8", "#676C95", "#1E1F3D"],
    background: "linear-gradient(160deg, #F0F2F7, #9FA6C8)",
    titleColor: "#1E1F3D",
    defaultFontId: "serif-regal-center",
  },
  "sunset-coral": {
    id: "sunset-coral",
    label: "Sunset Coral",
    tagline: "Bougainvillea glow",
    swatches: ["#FFF3EE", "#FFD1C1", "#FF9C8D", "#C75B40", "#481E16"],
    background: "linear-gradient(145deg, #FFF3EE, #FF9C8D)",
    titleColor: "#481E16",
    defaultFontId: "script-center",
  },
  "golden-ivy": {
    id: "golden-ivy",
    label: "Golden Ivy",
    tagline: "Gilded heirlooms",
    swatches: ["#F8F6EF", "#E4D4AF", "#C6B07E", "#6B5A3B", "#2E2518"],
    background: "linear-gradient(135deg, #F8F6EF, #C6B07E)",
    titleColor: "#2E2518",
    defaultFontId: "poppins-center",
  },
  "crimson-velvet": {
    id: "crimson-velvet",
    label: "Crimson Velvet",
    tagline: "Deep luxe hints",
    swatches: ["#F9F1EF", "#E9D7D4", "#CF4D53", "#7B1C26", "#2F0A0F"],
    background: "linear-gradient(145deg, #F9F1EF, #CF4D53)",
    titleColor: "#2F0A0F",
    defaultFontId: "geist-bold-center",
  },
  "sea-glass": {
    id: "sea-glass",
    label: "Sea Glass",
    tagline: "Coastal shimmer",
    swatches: ["#F1FBFA", "#D0E5E3", "#9BC6C6", "#4B7E7F", "#1A3B3A"],
    background: "linear-gradient(150deg, #F1FBFA, #9BC6C6)",
    titleColor: "#1A3B3A",
    defaultFontId: "sans-classic-center",
  },
  "desert-amber": {
    id: "desert-amber",
    label: "Desert Amber",
    tagline: "Warm adobe glow",
    swatches: ["#FFF6ED", "#FAD4A5", "#CE8E5A", "#8A582F", "#35251D"],
    background: "linear-gradient(150deg, #FFF6ED, #CE8E5A)",
    titleColor: "#35251D",
    defaultFontId: "raleway-luxe-left",
  },
  "celadon-cascade": {
    id: "celadon-cascade",
    label: "Celadon Cascade",
    tagline: "Sunset champagne drift",
    swatches: ["#FFF6EE", "#FBDCC5", "#C6E5D8", "#82B8BA", "#2F4B66"],
    background: "linear-gradient(140deg, #FFF6EE, #82B8BA)",
    titleColor: "#1F2A3A",
    defaultFontId: "serif-regal-center",
  },
  "velour-waltz": {
    id: "velour-waltz",
    label: "Velour Waltz",
    tagline: "Dreamy twilight glaze",
    swatches: ["#F7F2FB", "#E2D4F0", "#C3A6DA", "#7C619F", "#2F1E44"],
    background: "linear-gradient(155deg, #F7F2FB, #C3A6DA)",
    titleColor: "#231434",
    defaultFontId: "serif-bold-center",
  },
} as const satisfies Record<string, TemplatePaletteToken>;

export type TemplatePaletteTokenId = keyof typeof TEMPLATE_PALETTE_TOKENS;

const PALETTE_FALLBACK =
  TEMPLATE_PALETTE_TOKENS["blush-champagne"] ??
  Object.values(TEMPLATE_PALETTE_TOKENS)[0];
const FONT_FALLBACK =
  TEMPLATE_FONT_TOKENS["serif-regal-center"] ??
  Object.values(TEMPLATE_FONT_TOKENS)[0];

export function getPaletteToken(
  id?: TemplatePaletteTokenId | null
): TemplatePaletteToken {
  if (id && TEMPLATE_PALETTE_TOKENS[id]) return TEMPLATE_PALETTE_TOKENS[id];
  return PALETTE_FALLBACK;
}

export function getFontToken(
  id?: TemplateFontTokenId | null
): TemplateFontToken {
  if (id && TEMPLATE_FONT_TOKENS[id]) return TEMPLATE_FONT_TOKENS[id];
  return FONT_FALLBACK;
}
