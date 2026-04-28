export type OcrSkinCategory =
  | "birthday"
  | "wedding"
  | "basketball"
  | "baby-shower"
  | "bridal-shower"
  | "engagement"
  | "anniversary"
  | "housewarming"
  | "graduation"
  | "religious"
  | "general";

export type OcrSkinId =
  | "scanned-birthday-bento-pop"
  | "scanned-birthday-storybook-sparkle"
  | "scanned-birthday-retro-neon"
  | "scanned-wedding-editorial-paper"
  | "scanned-wedding-gilded-romance"
  | "scanned-wedding-noir-modern"
  | "scanned-basketball-court-energy"
  | "scanned-basketball-tournament-poster"
  | "scanned-basketball-night-run"
  | "scanned-invite-bento-celebration"
  | "scanned-invite-soft-radiance"
  | "scanned-invite-evening-luxe";

export type OcrSkinPalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  dominant: string;
  themeColor: string;
};

export type OcrSkinBackgroundTexture = "none" | "paper" | "grain" | "linen";
export type OcrSkinBackgroundDensity = "low" | "medium" | "high";
export type OcrSkinBackgroundPlacement = "edges" | "corners" | "balanced";

export type OcrSkinBackgroundObjectKind =
  | "confetti"
  | "streamer"
  | "dot"
  | "star"
  | "balloon"
  | "botanical-sprig"
  | "leaf"
  | "frame-corner"
  | "ring"
  | "pearl"
  | "basketball"
  | "hoop"
  | "court-line"
  | "cap"
  | "tassel"
  | "diploma"
  | "banner";

export type OcrSkinBackground = {
  version: 1;
  seed: string;
  texture: OcrSkinBackgroundTexture;
  density: OcrSkinBackgroundDensity;
  placement: OcrSkinBackgroundPlacement;
  objectKinds: OcrSkinBackgroundObjectKind[];
  colors?: string[];
};

export type OcrSkinBackgroundContext = {
  category?: OcrSkinCategory | string | null;
  title?: string | null;
  skinId?: OcrSkinId | string | null;
  palette?: Partial<OcrSkinPalette> | null;
};

const TEXTURE_SET = new Set<OcrSkinBackgroundTexture>(["none", "paper", "grain", "linen"]);
const DENSITY_SET = new Set<OcrSkinBackgroundDensity>(["low", "medium", "high"]);
const PLACEMENT_SET = new Set<OcrSkinBackgroundPlacement>(["edges", "corners", "balanced"]);

const BACKGROUND_OBJECT_KIND_SET = new Set<OcrSkinBackgroundObjectKind>([
  "confetti",
  "streamer",
  "dot",
  "star",
  "balloon",
  "botanical-sprig",
  "leaf",
  "frame-corner",
  "ring",
  "pearl",
  "basketball",
  "hoop",
  "court-line",
  "cap",
  "tassel",
  "diploma",
  "banner",
]);

const CATEGORY_OBJECT_KINDS: Record<OcrSkinCategory, readonly OcrSkinBackgroundObjectKind[]> = {
  birthday: ["confetti", "streamer", "dot", "star", "balloon"],
  wedding: ["botanical-sprig", "leaf", "frame-corner", "ring", "pearl"],
  basketball: ["basketball", "hoop", "court-line", "star", "banner", "dot"],
  "baby-shower": ["botanical-sprig", "leaf", "dot", "star", "banner"],
  "bridal-shower": ["botanical-sprig", "leaf", "frame-corner", "ring", "pearl"],
  engagement: ["botanical-sprig", "leaf", "frame-corner", "ring", "pearl"],
  anniversary: ["botanical-sprig", "leaf", "frame-corner", "ring", "pearl"],
  housewarming: ["confetti", "dot", "star", "banner", "botanical-sprig"],
  graduation: ["cap", "tassel", "diploma", "star", "banner", "confetti"],
  religious: ["botanical-sprig", "leaf", "dot", "star", "banner"],
  general: ["confetti", "dot", "star", "banner", "botanical-sprig"],
};

const CATEGORY_FALLBACK_STYLE: Record<
  OcrSkinCategory,
  {
    texture: OcrSkinBackgroundTexture;
    density: OcrSkinBackgroundDensity;
    placement: OcrSkinBackgroundPlacement;
  }
> = {
  birthday: { texture: "grain", density: "medium", placement: "edges" },
  wedding: { texture: "paper", density: "low", placement: "corners" },
  basketball: { texture: "grain", density: "medium", placement: "edges" },
  "baby-shower": { texture: "paper", density: "low", placement: "balanced" },
  "bridal-shower": { texture: "paper", density: "low", placement: "corners" },
  engagement: { texture: "paper", density: "low", placement: "corners" },
  anniversary: { texture: "paper", density: "low", placement: "corners" },
  housewarming: { texture: "grain", density: "low", placement: "balanced" },
  graduation: { texture: "grain", density: "medium", placement: "balanced" },
  religious: { texture: "paper", density: "low", placement: "balanced" },
  general: { texture: "grain", density: "low", placement: "balanced" },
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOcrSkinCategory(value: unknown): OcrSkinCategory | null {
  const normalized = safeString(value).toLowerCase();
  if (normalized === "birthday" || normalized === "birthdays") return "birthday";
  if (normalized === "wedding" || normalized === "weddings") return "wedding";
  if (
    normalized === "basketball" ||
    normalized === "basketball event" ||
    normalized === "basketball events" ||
    normalized === "basketball invite" ||
    normalized === "basketball invites"
  ) {
    return "basketball";
  }
  if (
    normalized === "baby shower" ||
    normalized === "baby showers" ||
    normalized === "gender reveal" ||
    normalized === "gender reveals"
  ) {
    return "baby-shower";
  }
  if (normalized === "bridal shower" || normalized === "bridal showers") {
    return "bridal-shower";
  }
  if (normalized === "engagement" || normalized === "engagements") return "engagement";
  if (normalized === "anniversary" || normalized === "anniversaries") return "anniversary";
  if (
    normalized === "housewarming" ||
    normalized === "housewarmings" ||
    normalized === "house warming" ||
    normalized === "house warmings"
  ) {
    return "housewarming";
  }
  if (normalized === "graduation" || normalized === "graduations") return "graduation";
  if (
    normalized === "religious event" ||
    normalized === "religious events" ||
    normalized === "religious celebration" ||
    normalized === "religious celebrations"
  ) {
    return "religious";
  }
  if (
    normalized === "general event" ||
    normalized === "general events" ||
    normalized === "general"
  ) {
    return "general";
  }
  return null;
}

export function isBasketballOcrSkinCandidate(input: {
  category?: unknown;
  title?: unknown;
  description?: unknown;
  ocrText?: unknown;
  activities?: unknown;
}): boolean {
  const textParts = [
    input.category,
    input.title,
    input.description,
    input.ocrText,
    ...(Array.isArray(input.activities) ? input.activities : []),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const text = textParts.join(" ").toLowerCase();
  if (!text) return false;
  const category = safeString(input.category).toLowerCase();
  if (
    [
      "birthday",
      "birthdays",
      "wedding",
      "weddings",
      "baby shower",
      "baby showers",
      "bridal shower",
      "bridal showers",
      "engagement",
      "engagements",
      "anniversary",
      "anniversaries",
      "graduation",
      "graduations",
      "religious event",
      "religious events",
    ].includes(category)
  ) {
    return false;
  }
  if (
    /\bbasketball\b|\bhoops?\b|\bfree\s*throws?\b|\btip[-\s]?off\b|\b3\s*v\s*3\b|\b5\s*v\s*5\b/.test(
      text,
    )
  ) {
    return true;
  }
  const isSportCategory = category === "sport events" || category === "sport event";
  if (!isSportCategory) return false;
  return (
    /\b(open\s+run|pickup\s+(?:game|games|run|runs)|shooting\s+(?:clinic|camp|workout)|skills\s+(?:clinic|camp)|scrimmage)\b/.test(
      text,
    ) && /\b(court|gym|league|tournament|team|tryouts?)\b/.test(text)
  );
}

function normalizeHex(value: unknown): string | null {
  const normalized = safeString(value).replace(/^#/, "").toLowerCase();
  if (!normalized) return null;
  if (/^[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`;
  }
  if (/^[0-9a-f]{6}$/.test(normalized)) return `#${normalized}`;
  return null;
}

function normalizeBackgroundSeed(value: unknown): string | null {
  const normalized = safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || null;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getContextCategory(context: OcrSkinBackgroundContext): OcrSkinCategory {
  return normalizeOcrSkinCategory(context.category) || "general";
}

function normalizeObjectKind(value: unknown): OcrSkinBackgroundObjectKind | null {
  const normalized = safeString(value).toLowerCase().replace(/_/g, "-");
  const aliases: Record<string, OcrSkinBackgroundObjectKind> = {
    balloons: "balloon",
    caps: "cap",
    confettis: "confetti",
    diplomas: "diploma",
    dots: "dot",
    "floral-sprig": "botanical-sprig",
    "frame-corners": "frame-corner",
    "graduation-cap": "cap",
    leaves: "leaf",
    pearls: "pearl",
    rings: "ring",
    stars: "star",
    streamer: "streamer",
    streamers: "streamer",
    basketballs: "basketball",
    hoops: "hoop",
    "court-lines": "court-line",
    court: "court-line",
    tassels: "tassel",
  };
  const resolved = aliases[normalized] || normalized;
  return BACKGROUND_OBJECT_KIND_SET.has(resolved as OcrSkinBackgroundObjectKind)
    ? (resolved as OcrSkinBackgroundObjectKind)
    : null;
}

function normalizeObjectKinds(
  value: unknown,
  category: OcrSkinCategory,
): OcrSkinBackgroundObjectKind[] {
  const allowed = new Set(CATEGORY_OBJECT_KINDS[category]);
  const rawKinds = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const normalized: OcrSkinBackgroundObjectKind[] = [];
  for (const item of rawKinds) {
    const objectKind = normalizeObjectKind(item);
    if (!objectKind || !allowed.has(objectKind) || normalized.includes(objectKind)) continue;
    normalized.push(objectKind);
  }
  return normalized.slice(0, 5);
}

function normalizeColors(
  value: unknown,
  palette: Partial<OcrSkinPalette> | null | undefined,
): string[] {
  const sourceColors = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as any).colors)
      ? (value as any).colors
      : [];
  const colors: string[] = [];
  for (const color of sourceColors) {
    const normalized = normalizeHex(color);
    if (normalized && !colors.includes(normalized)) colors.push(normalized);
  }
  const paletteColors = [
    palette?.accent,
    palette?.primary,
    palette?.secondary,
    palette?.themeColor,
    palette?.dominant,
  ];
  for (const color of paletteColors) {
    const normalized = normalizeHex(color);
    if (normalized && !colors.includes(normalized)) colors.push(normalized);
  }
  return colors.slice(0, 5);
}

function pickFallbackObjectKinds(
  category: OcrSkinCategory,
  seedHash: number,
): OcrSkinBackgroundObjectKind[] {
  const allowed = CATEGORY_OBJECT_KINDS[category];
  const targetCount = category === "wedding" ? 3 : category === "graduation" ? 4 : 4;
  const picked: OcrSkinBackgroundObjectKind[] = [];
  let cursor = seedHash % allowed.length;
  const step = Math.max(1, (seedHash >>> 8) % allowed.length || 1);
  while (picked.length < Math.min(targetCount, allowed.length)) {
    const next = allowed[cursor % allowed.length];
    if (!picked.includes(next)) picked.push(next);
    cursor += step;
    if (cursor > allowed.length * 8) break;
  }
  for (const item of allowed) {
    if (picked.length >= targetCount) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked;
}

export function buildFallbackOcrSkinBackground(
  context: OcrSkinBackgroundContext = {},
): OcrSkinBackground {
  const category = getContextCategory(context);
  const seedSource = [
    category,
    safeString(context.title),
    safeString(context.skinId),
    context.palette?.background,
    context.palette?.primary,
    context.palette?.secondary,
    context.palette?.accent,
    context.palette?.dominant,
  ]
    .filter(Boolean)
    .join("|");
  const seedHash = hashString(seedSource || category);
  const fallback = CATEGORY_FALLBACK_STYLE[category];
  return {
    version: 1,
    seed: `${category}-${seedHash.toString(36)}`,
    texture: fallback.texture,
    density: fallback.density,
    placement: fallback.placement,
    objectKinds: pickFallbackObjectKinds(category, seedHash),
    colors: normalizeColors([], context.palette),
  };
}

export function normalizeOcrSkinBackground(
  value: unknown,
  context: OcrSkinBackgroundContext = {},
): OcrSkinBackground | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const category = getContextCategory(context);
  const fallback = buildFallbackOcrSkinBackground(context);
  const objectKinds = normalizeObjectKinds(input.objectKinds, category);
  const colors = normalizeColors(input.colors, context.palette);
  const texture = safeString(input.texture) as OcrSkinBackgroundTexture;
  const density = safeString(input.density) as OcrSkinBackgroundDensity;
  const placement = safeString(input.placement) as OcrSkinBackgroundPlacement;
  return {
    version: 1,
    seed: normalizeBackgroundSeed(input.seed) || fallback.seed,
    texture: TEXTURE_SET.has(texture) ? texture : fallback.texture,
    density: DENSITY_SET.has(density) ? density : fallback.density,
    placement: PLACEMENT_SET.has(placement) ? placement : fallback.placement,
    objectKinds: objectKinds.length ? objectKinds : fallback.objectKinds,
    colors: colors.length ? colors : fallback.colors,
  };
}

export function resolveOcrSkinBackground(
  value: unknown,
  context: OcrSkinBackgroundContext = {},
): OcrSkinBackground {
  return normalizeOcrSkinBackground(value, context) || buildFallbackOcrSkinBackground(context);
}

export function getAllowedOcrSkinBackgroundObjectKinds(
  categoryInput: OcrSkinCategory | string,
): readonly OcrSkinBackgroundObjectKind[] {
  const category = normalizeOcrSkinCategory(categoryInput) || "general";
  return CATEGORY_OBJECT_KINDS[category];
}

export function buildOcrSkinBackgroundPromptRules(category: OcrSkinCategory): string {
  const allowedKinds = CATEGORY_OBJECT_KINDS[category].map((kind) => `"${kind}"`).join(", ");
  const categoryLabel =
    category === "birthday"
      ? "birthday"
      : category === "wedding"
        ? "wedding"
        : category === "basketball"
          ? "basketball"
          : category === "graduation"
            ? "graduation"
            : "this invite category";
  return [
    "Also generate a subtle structured background spec for the UI.",
    "This is not an image prompt. It is JSON that the app renders as small decorative objects.",
    `For ${categoryLabel}, objectKinds may only include: ${allowedKinds}.`,
    'Use texture as one of "none", "paper", "grain", "linen".',
    'Use density as one of "low", "medium", "high". Prefer low or medium unless the source invite is very playful.',
    'Use placement as one of "edges", "corners", "balanced". Prefer edges/corners for readability.',
    "Use colors from the flyer palette as six-digit hex values. Do not add text, words, names, dates, or logos.",
    "The seed must be a short unique kebab-case token derived from the event title and visual mood.",
  ].join("\n");
}
