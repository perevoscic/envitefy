const HEX_COLOR_REGEX = /#[0-9a-f]{3,8}/gi;

export const DEFAULT_WEDDING_SCAN_FLYER_COLORS = Object.freeze({
  background: "#faf7f1",
  primary: "#f3ede3",
  secondary: "#ffffff",
  accent: "#b59b6d",
  text: "#221c16",
  dominant: "#e7dece",
  themeColor: "#b59b6d",
});

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function expandHex(hex) {
  const normalized = String(hex || "").trim().replace(/^#/, "").toLowerCase();
  if (normalized.length === 3) {
    return `#${normalized
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`;
  }
  if (normalized.length === 6) return `#${normalized}`;
  return null;
}

function hexToRgb(hex) {
  const normalized = expandHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function extractHexColors(value) {
  if (typeof value !== "string") return [];
  const matches = value.match(HEX_COLOR_REGEX) || [];
  return matches.map(expandHex).filter(Boolean);
}

export function extractFirstHexColor(...values) {
  for (const value of values) {
    const color = extractHexColors(value)[0] || null;
    if (color) return color;
  }
  return null;
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

export function normalizeWeddingFlyerColors(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const background =
    extractFirstHexColor(input.background) || DEFAULT_WEDDING_SCAN_FLYER_COLORS.background;
  const primary =
    extractFirstHexColor(input.primary) || DEFAULT_WEDDING_SCAN_FLYER_COLORS.primary;
  const secondary =
    extractFirstHexColor(input.secondary) || DEFAULT_WEDDING_SCAN_FLYER_COLORS.secondary;
  const accent = extractFirstHexColor(input.accent) || DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent;
  const text = extractFirstHexColor(input.text) || DEFAULT_WEDDING_SCAN_FLYER_COLORS.text;
  const dominant =
    extractFirstHexColor(input.dominant) || mixHexColors(primary, accent, 0.2) || accent;
  const themeColor =
    extractFirstHexColor(input.themeColor) || mixHexColors(accent, dominant, 0.25) || accent;

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

export function buildWeddingScanFlyerColorsFromImageColors(imageColors) {
  if (!imageColors || typeof imageColors !== "object") {
    return { ...DEFAULT_WEDDING_SCAN_FLYER_COLORS };
  }

  const headerLightPalette = extractHexColors(imageColors.headerLight);
  const headerDarkPalette = extractHexColors(imageColors.headerDark);
  const lightBase = headerLightPalette[0] || DEFAULT_WEDDING_SCAN_FLYER_COLORS.primary;
  const lightSecondary = headerLightPalette[1] || lightBase;
  const darkAccent = headerDarkPalette[0] || DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent;
  const fallbackText = extractFirstHexColor(imageColors.textLight, imageColors.textDark);

  return normalizeWeddingFlyerColors({
    background:
      mixHexColors(lightBase, DEFAULT_WEDDING_SCAN_FLYER_COLORS.background, 0.88) ||
      DEFAULT_WEDDING_SCAN_FLYER_COLORS.background,
    primary:
      mixHexColors(lightBase, DEFAULT_WEDDING_SCAN_FLYER_COLORS.primary, 0.58) ||
      DEFAULT_WEDDING_SCAN_FLYER_COLORS.primary,
    secondary:
      mixHexColors(lightSecondary, DEFAULT_WEDDING_SCAN_FLYER_COLORS.secondary, 0.78) ||
      DEFAULT_WEDDING_SCAN_FLYER_COLORS.secondary,
    accent:
      mixHexColors(darkAccent, DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent, 0.18) ||
      DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent,
    text: fallbackText || DEFAULT_WEDDING_SCAN_FLYER_COLORS.text,
    dominant: lightBase,
    themeColor:
      mixHexColors(darkAccent, DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent, 0.1) ||
      DEFAULT_WEDDING_SCAN_FLYER_COLORS.accent,
  });
}

function stripWeddingTitleShell(input) {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized
    .replace(/^wedding celebration of\s+/i, "")
    .replace(/^celebration of\s+/i, "")
    .replace(/^the wedding of\s+/i, "")
    .replace(/\s+wedding celebration$/i, "")
    .replace(/\s+wedding$/i, "")
    .trim();
}

export function parseWeddingCoupleNames(title) {
  const normalizedTitle = String(title || "").replace(/\s+/g, " ").trim();
  const stripped = stripWeddingTitleShell(normalizedTitle);
  const splitCandidate = stripped.replace(/\s+(and|&)\s+/i, " & ");
  const parts = splitCandidate.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return {
      partner1: parts[0],
      partner2: parts.slice(1).join(" & "),
      displayTitle: `${parts[0]} & ${parts.slice(1).join(" & ")}`,
    };
  }

  return {
    partner1: null,
    partner2: null,
    displayTitle: stripped || normalizedTitle || "Wedding Celebration",
  };
}

export function buildWeddingScanSchedule(input) {
  const source = input && typeof input === "object" ? input : {};
  const savedSchedule = Array.isArray(source.schedule) ? source.schedule : [];

  const normalizedSaved = savedSchedule
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : typeof item.name === "string" && item.name.trim()
            ? item.name.trim()
            : "";
      const time =
        typeof item.time === "string" && item.time.trim()
          ? item.time.trim()
          : typeof item.date === "string" && item.date.trim()
            ? item.date.trim()
            : "";
      if (!title && !time) return null;
      return {
        title: title || "Wedding Event",
        time: time || "To Follow",
      };
    })
    .filter(Boolean);

  if (normalizedSaved.length > 0) {
    return normalizedSaved;
  }

  const textBlob = [
    source.title,
    source.description,
    source.ocrText,
    source.location,
    source.venue,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .toLowerCase();

  const timeLabel =
    typeof source.timeLabel === "string" && source.timeLabel.trim()
      ? source.timeLabel.trim()
      : "Time TBD";

  const mentionCeremony = /\bceremon(?:y|ies)\b/i.test(textBlob);
  const mentionReception = /\breception\b/i.test(textBlob);

  const rows = [
    {
      time: timeLabel,
      title: mentionCeremony ? "Wedding Ceremony" : "Wedding Starts",
    },
  ];

  if (mentionReception) {
    rows.push({
      time: "Following",
      title: "Reception",
    });
  }

  return rows;
}
