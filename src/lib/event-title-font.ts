/** Stable, bundled title font choices shared by Event Page editors. */
export const EVENT_TITLE_FONTS = [
  { id: "playfair", label: "Playfair Display", family: '"Playfair Display", Georgia, serif' },
  { id: "anton", label: "Anton", family: '"Anton", Impact, sans-serif' },
  { id: "montserrat", label: "Montserrat", family: '"Montserrat", Arial, sans-serif' },
  { id: "cormorant", label: "Cormorant Garamond", family: '"Cormorant Garamond", Georgia, serif' },
  { id: "inter", label: "Inter", family: '"Inter", Arial, sans-serif' },
  { id: "rounded", label: "Quicksand", family: '"Quicksand", Arial, sans-serif' },
  { id: "orbitron", label: "Orbitron", family: '"Orbitron", Arial, sans-serif' },
  { id: "space", label: "Space Grotesk", family: '"Space Grotesk", Arial, sans-serif' },
] as const;
export type EventTitleFont = typeof EVENT_TITLE_FONTS[number]["id"];
export function normalizeEventTitleFont(value: unknown): EventTitleFont | undefined {
  return EVENT_TITLE_FONTS.find(font => font.id === value)?.id;
}
export function eventTitleFontFamily(value: unknown): string | undefined {
  return EVENT_TITLE_FONTS.find(font => font.id === value)?.family;
}
