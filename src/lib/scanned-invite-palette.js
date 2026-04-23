const DEFAULT_TEXT_DARK = "#101010";
const DEFAULT_TEXT_LIGHT = "#ffffff";

export const DEFAULT_SCANNED_INVITE_PALETTE = Object.freeze({
  background: "#d6ebee",
  primary: "#e61b8c",
  secondary: "#1da5e4",
  accent: "#ff9a1f",
  text: DEFAULT_TEXT_DARK,
  dominant: "#e61b8c",
  themeColor: "#e61b8c",
});

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function expandHex(hex) {
  const normalized = String(hex || "")
    .trim()
    .replace(/^#/, "")
    .toLowerCase();
  if (normalized.length === 3) {
    return `#${normalized
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`;
  }
  if (normalized.length === 6) return `#${normalized}`;
  return null;
}

export function normalizeHexColor(value, fallback) {
  return expandHex(value) || expandHex(fallback) || DEFAULT_TEXT_DARK;
}

export function hexToRgb(hex) {
  const normalized = expandHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(rgb) {
  if (!rgb) return null;
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function mixHexColors(colorA, colorB, ratio = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  if (!a && !b) return null;
  if (!a) return rgbToHex(b);
  if (!b) return rgbToHex(a);
  const mix = Math.max(0, Math.min(1, Number(ratio) || 0));
  return rgbToHex({
    r: a.r * (1 - mix) + b.r * mix,
    g: a.g * (1 - mix) + b.g * mix,
    b: a.b * (1 - mix) + b.b * mix,
  });
}

export function getLuminance(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function getContrastRatio(colorA, colorB) {
  const a = getLuminance(colorA);
  const b = getLuminance(colorB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureReadableTextColor(backgroundColor, preferredText, options = {}) {
  const minContrast = Number(options.minContrast) || 4.5;
  const darkCandidate = normalizeHexColor(options.darkCandidate, DEFAULT_TEXT_DARK);
  const lightCandidate = normalizeHexColor(options.lightCandidate, DEFAULT_TEXT_LIGHT);
  const preferred = normalizeHexColor(preferredText, darkCandidate);
  const background = normalizeHexColor(backgroundColor, DEFAULT_SCANNED_INVITE_PALETTE.background);

  if (getContrastRatio(background, preferred) >= minContrast) {
    return preferred;
  }

  const darkContrast = getContrastRatio(background, darkCandidate);
  const lightContrast = getContrastRatio(background, lightCandidate);

  if (darkContrast >= minContrast || darkContrast >= lightContrast) return darkCandidate;
  return lightCandidate;
}

export function normalizeScannedInvitePalette(raw, fallback = DEFAULT_SCANNED_INVITE_PALETTE) {
  const fallbackPalette = {
    ...DEFAULT_SCANNED_INVITE_PALETTE,
    ...(fallback && typeof fallback === "object" ? fallback : {}),
  };
  const input = raw && typeof raw === "object" ? raw : {};

  const background = normalizeHexColor(input.background, fallbackPalette.background);
  const primary = normalizeHexColor(input.primary, fallbackPalette.primary);
  const secondary = normalizeHexColor(input.secondary, fallbackPalette.secondary);
  const accent = normalizeHexColor(input.accent || input.themeColor, fallbackPalette.accent);
  const dominant = normalizeHexColor(input.dominant, accent || fallbackPalette.dominant);
  const themeColor = normalizeHexColor(
    input.themeColor,
    accent || dominant || fallbackPalette.themeColor,
  );
  const requestedText = normalizeHexColor(input.text, fallbackPalette.text);
  const text = ensureReadableTextColor(background, requestedText);

  return {
    background,
    primary,
    secondary,
    accent,
    text,
    dominant,
    themeColor,
  };
}
