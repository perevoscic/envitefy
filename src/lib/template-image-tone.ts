import colors from "tailwindcss/colors";

/** Templates store accents as CSS colors or Tailwind text utilities. */
export function resolveTemplateImageColor(value?: string): string {
  const color = value?.trim();
  if (!color) return "#83709c";
  if (/^(#[\da-f]{3,8}|(?:rgb|hsl|oklch|oklab|color)\([^;{}]+\))$/i.test(color)) return color;
  const arbitrary = color.match(/(?:text|bg|border)-\[(#[\da-f]{3,8})\]/i);
  if (arbitrary) return arbitrary[1];
  const token = color.match(/(?:^|\s)(?:text|bg|border)-([a-z]+)(?:-(\d{2,3}))?(?:\/\d+)?(?:\s|$)/);
  const name = token?.[1] || color;
  if (name in colors) {
    const palette = colors[name as keyof typeof colors];
    if (typeof palette === "string") return palette;
    const shade = token?.[2] || "500";
    if (shade in palette) return palette[shade as keyof typeof palette];
  }
  return "#83709c";
}
