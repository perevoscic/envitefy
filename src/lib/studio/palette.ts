import type { StudioLiveCardPalette } from "./types.ts";

const COLORS: Record<string, string> = {
  navy: "#0f172a", silver: "#c0c0c0", cream: "#fffdd0", ivory: "#fffff0", green: "#166534", forest: "#14532d", blue: "#2563eb", aqua: "#22d3ee", teal: "#0f766e", charcoal: "#36454f", white: "#ffffff", black: "#111827", gold: "#d4af37", yellow: "#eab308", pink: "#ec4899", blush: "#f4c2c2", purple: "#7c3aed", lavender: "#c4b5fd", red: "#dc2626", orange: "#ea580c", copper: "#b87333", burgundy: "#800020", coral: "#ff7f50",
};

/** Resolve supported explicit colors once instead of retaining a conflicting model default. */
export function requestedStudioPalette(description?: string | null): StudioLiveCardPalette | undefined {
  if (!description) return undefined;
  const input = description.toLowerCase().replace(/\b(?:no|without|avoid|not)\s+(?:any\s+)?[a-z]+/g, "");
  const tokens = input.match(/#[0-9a-f]{6}\b|\b(?:navy|silver|cream|ivory|forest|green|blue|aqua|teal|charcoal|white|black|gold|yellow|pink|blush|purple|lavender|red|orange|copper|burgundy|coral)\b/g) || [];
  const values = [...new Set(tokens.map((token) => token.startsWith("#") ? token : COLORS[token]))];
  if (!values.length) return undefined;
  return { primary: values[0], secondary: values[1] || values[0], accent: values[2] || values[1] || values[0] };
}
