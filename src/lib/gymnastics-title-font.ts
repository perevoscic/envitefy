/** Optional title overrides use the fonts bundled by the gymnastics collection. */
export const GYMNASTICS_TITLE_FONTS = [
  { id: "playfair", label: "Playfair Display", fontFamily: '"Gym Playfair", Georgia, serif' },
  { id: "anton", label: "Anton", fontFamily: '"Gym Anton", Impact, sans-serif' },
  { id: "montserrat", label: "Montserrat", fontFamily: '"Gym Montserrat", Arial, sans-serif' },
  { id: "cormorant", label: "Cormorant Garamond", fontFamily: '"Gym Cormorant", Georgia, serif' },
  { id: "inter", label: "Inter", fontFamily: '"Gym Inter", Arial, sans-serif' },
  { id: "rounded", label: "Quicksand", fontFamily: '"Gym Rounded", Arial, sans-serif' },
  { id: "orbitron", label: "Orbitron", fontFamily: '"Gym Orbitron", Arial, sans-serif' },
  { id: "space", label: "Space Grotesk", fontFamily: '"Gym Space", Arial, sans-serif' },
] as const;

export type GymnasticsTitleFont = (typeof GYMNASTICS_TITLE_FONTS)[number]["id"];

/** An empty value explicitly restores the design's own typography. */
export function normalizeGymnasticsTitleFont(value: unknown): GymnasticsTitleFont | "" {
  return GYMNASTICS_TITLE_FONTS.find((font) => font.id === value)?.id || "";
}

export function gymnasticsTitleFontFamily(value: unknown): string | undefined {
  return GYMNASTICS_TITLE_FONTS.find((font) => font.id === value)?.fontFamily;
}
