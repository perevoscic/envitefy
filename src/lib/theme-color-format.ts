export function normalizeColor(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed)) return trimmed;
  if (/^rgb(a)?\(/i.test(trimmed)) return trimmed;
  if (/^hsl(a)?\(/i.test(trimmed)) return trimmed;
  return null;
}

export function extractSolidColor(value: string): string | null {
  const direct = normalizeColor(value);
  if (direct) return direct;

  const hexMatch = value.match(/#[0-9a-f]{3,8}/i);
  if (hexMatch) return hexMatch[0];

  const rgbMatch = value.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) return rgbMatch[0];

  const hslMatch = value.match(/hsla?\([^)]+\)/i);
  if (hslMatch) return hslMatch[0];

  return null;
}

