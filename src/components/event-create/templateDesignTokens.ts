"use client";

export type TemplateTitleFont =
  | "auto"
  | "montserrat"
  | "pacifico"
  | "geist"
  | "mono"
  | "serif"
  | "system"
  | "poppins"
  | "raleway"
  | "playfair"
  | "dancing";

export type TitleWeight = "normal" | "semibold" | "bold";
export type TitleAlign = "left" | "center" | "right";

export type TemplateFontToken = {
  id: string;
  label: string;
  font: TemplateTitleFont;
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

export const TEMPLATE_FONT_TOKENS = {
  "serif-regal-center": {
    id: "serif-regal-center",
    label: "Regal Serif Centered",
    font: "playfair",
    weight: "semibold",
    align: "center",
  },
  "serif-bold-center": {
    id: "serif-bold-center",
    label: "Serif Bold Centered",
    font: "playfair",
    weight: "bold",
    align: "center",
  },
  "sans-classic-left": {
    id: "sans-classic-left",
    label: "Classic Sans Left",
    font: "montserrat",
    weight: "normal",
    align: "left",
  },
  "sans-classic-center": {
    id: "sans-classic-center",
    label: "Classic Sans Center",
    font: "montserrat",
    weight: "semibold",
    align: "center",
  },
  "raleway-editorial": {
    id: "raleway-editorial",
    label: "Editorial Raleway",
    font: "raleway",
    weight: "semibold",
    align: "center",
  },
  "raleway-luxe-left": {
    id: "raleway-luxe-left",
    label: "Luxe Raleway Left",
    font: "raleway",
    weight: "normal",
    align: "left",
  },
  "script-center": {
    id: "script-center",
    label: "Script Center",
    font: "dancing",
    weight: "bold",
    align: "center",
  },
  "poppins-center": {
    id: "poppins-center",
    label: "Poppins Center",
    font: "poppins",
    weight: "semibold",
    align: "center",
  },
  "geist-bold-center": {
    id: "geist-bold-center",
    label: "Geist Bold Center",
    font: "geist",
    weight: "bold",
    align: "center",
  },
} as const satisfies Record<string, TemplateFontToken>;

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
