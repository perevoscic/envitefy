export type OcrSkinCategory =
  | "birthday"
  | "wedding"
  | "basketball"
  | "football"
  | "baby-shower"
  | "bridal-shower"
  | "engagement"
  | "anniversary"
  | "housewarming"
  | "graduation"
  | "religious"
  | "general";

export type OcrSportKind = "pickleball";

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
  | "scanned-football-friday-lights"
  | "scanned-football-senior-night"
  | "scanned-football-watch-party"
  | "scanned-pickleball-showdown"
  | "scanned-pickleball-pop-court"
  | "scanned-pickleball-clinic"
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
  | "cake"
  | "cupcake"
  | "gift"
  | "party-hat"
  | "candle"
  | "sparkle"
  | "crown"
  | "music-note"
  | "arcade-token"
  | "botanical-sprig"
  | "leaf"
  | "frame-corner"
  | "ring"
  | "ring-box"
  | "pearl"
  | "heart"
  | "diamond"
  | "champagne"
  | "champagne-bubble"
  | "wine-glass"
  | "floral-arch"
  | "lace"
  | "vow-book"
  | "ribbon"
  | "bouquet"
  | "wax-seal"
  | "rose"
  | "photo-frame"
  | "baby-bottle"
  | "rattle"
  | "moon"
  | "onesie"
  | "pacifier"
  | "teddy-bear"
  | "cloud"
  | "bib"
  | "stroller"
  | "teacup"
  | "bow"
  | "house"
  | "key"
  | "front-door"
  | "welcome-mat"
  | "plant"
  | "lamp"
  | "mug"
  | "basketball"
  | "football"
  | "helmet"
  | "goalpost"
  | "field-line"
  | "stadium-light"
  | "hoop"
  | "court-line"
  | "court-arc"
  | "backboard"
  | "net"
  | "shot-clock"
  | "sneaker"
  | "trophy"
  | "football-trophy"
  | "yard-marker"
  | "playbook"
  | "cleat"
  | "foam-finger"
  | "pickleball"
  | "paddle"
  | "paddle-pair"
  | "net-line"
  | "pickleball-court"
  | "serve-line"
  | "water-bottle"
  | "cap"
  | "tassel"
  | "diploma"
  | "book"
  | "notebook"
  | "school-building"
  | "scroll"
  | "laurel"
  | "medal"
  | "dove"
  | "stained-glass"
  | "olive-branch"
  | "lantern"
  | "calendar"
  | "ticket"
  | "map-pin"
  | "announcement-card"
  | "jersey"
  | "whistle"
  | "scoreboard"
  | "pennant"
  | "megaphone"
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
  sportKind?: OcrSportKind | string | null;
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
  "cake",
  "cupcake",
  "gift",
  "party-hat",
  "candle",
  "sparkle",
  "crown",
  "music-note",
  "arcade-token",
  "botanical-sprig",
  "leaf",
  "frame-corner",
  "ring",
  "ring-box",
  "pearl",
  "heart",
  "diamond",
  "champagne",
  "champagne-bubble",
  "wine-glass",
  "floral-arch",
  "lace",
  "vow-book",
  "ribbon",
  "bouquet",
  "wax-seal",
  "rose",
  "photo-frame",
  "baby-bottle",
  "rattle",
  "moon",
  "onesie",
  "pacifier",
  "teddy-bear",
  "cloud",
  "bib",
  "stroller",
  "teacup",
  "bow",
  "house",
  "key",
  "front-door",
  "welcome-mat",
  "plant",
  "lamp",
  "mug",
  "basketball",
  "football",
  "helmet",
  "goalpost",
  "field-line",
  "stadium-light",
  "hoop",
  "court-line",
  "court-arc",
  "backboard",
  "net",
  "shot-clock",
  "sneaker",
  "trophy",
  "football-trophy",
  "yard-marker",
  "playbook",
  "cleat",
  "foam-finger",
  "pickleball",
  "paddle",
  "paddle-pair",
  "net-line",
  "pickleball-court",
  "serve-line",
  "water-bottle",
  "cap",
  "tassel",
  "diploma",
  "book",
  "notebook",
  "school-building",
  "scroll",
  "laurel",
  "medal",
  "dove",
  "stained-glass",
  "olive-branch",
  "lantern",
  "calendar",
  "ticket",
  "map-pin",
  "announcement-card",
  "jersey",
  "whistle",
  "scoreboard",
  "pennant",
  "megaphone",
  "banner",
]);

const CATEGORY_OBJECT_KINDS: Record<OcrSkinCategory, readonly OcrSkinBackgroundObjectKind[]> = {
  birthday: [
    "confetti",
    "streamer",
    "dot",
    "star",
    "balloon",
    "cake",
    "cupcake",
    "gift",
    "party-hat",
    "sparkle",
    "crown",
    "music-note",
    "arcade-token",
  ],
  wedding: [
    "botanical-sprig",
    "leaf",
    "frame-corner",
    "ring",
    "ring-box",
    "pearl",
    "heart",
    "diamond",
    "champagne",
    "champagne-bubble",
    "floral-arch",
    "lace",
    "vow-book",
    "ribbon",
    "bouquet",
    "wax-seal",
  ],
  basketball: [
    "basketball",
    "hoop",
    "court-line",
    "court-arc",
    "backboard",
    "net",
    "sneaker",
    "trophy",
    "shot-clock",
    "banner",
    "jersey",
    "whistle",
    "scoreboard",
  ],
  football: [
    "football",
    "helmet",
    "goalpost",
    "field-line",
    "yard-marker",
    "stadium-light",
    "star",
    "football-trophy",
    "playbook",
    "cleat",
    "foam-finger",
    "banner",
    "pennant",
    "megaphone",
    "jersey",
    "scoreboard",
  ],
  "baby-shower": [
    "baby-bottle",
    "rattle",
    "moon",
    "onesie",
    "pacifier",
    "teddy-bear",
    "cloud",
    "bib",
    "stroller",
    "botanical-sprig",
    "leaf",
    "dot",
    "star",
    "banner",
  ],
  "bridal-shower": [
    "botanical-sprig",
    "leaf",
    "frame-corner",
    "ring",
    "pearl",
    "heart",
    "champagne",
    "champagne-bubble",
    "floral-arch",
    "teacup",
    "bouquet",
    "bow",
    "gift",
  ],
  engagement: [
    "diamond",
    "ring",
    "ring-box",
    "heart",
    "sparkle",
    "botanical-sprig",
    "leaf",
    "frame-corner",
    "champagne",
    "champagne-bubble",
    "pearl",
    "rose",
    "ribbon",
  ],
  anniversary: [
    "heart",
    "champagne",
    "wine-glass",
    "ring",
    "botanical-sprig",
    "leaf",
    "frame-corner",
    "pearl",
    "rose",
    "photo-frame",
    "candle",
    "ribbon",
  ],
  housewarming: [
    "house",
    "front-door",
    "welcome-mat",
    "key",
    "plant",
    "lamp",
    "mug",
    "botanical-sprig",
    "leaf",
    "dot",
    "star",
    "banner",
    "gift",
  ],
  graduation: [
    "cap",
    "tassel",
    "diploma",
    "book",
    "notebook",
    "school-building",
    "scroll",
    "laurel",
    "medal",
    "star",
    "sparkle",
    "banner",
    "confetti",
  ],
  religious: [
    "candle",
    "dove",
    "stained-glass",
    "olive-branch",
    "lantern",
    "botanical-sprig",
    "leaf",
    "dot",
    "star",
    "banner",
  ],
  general: [
    "calendar",
    "ticket",
    "confetti",
    "dot",
    "star",
    "sparkle",
    "banner",
    "botanical-sprig",
    "map-pin",
    "announcement-card",
  ],
};

const SPORT_KIND_OBJECT_KINDS: Record<OcrSportKind, readonly OcrSkinBackgroundObjectKind[]> = {
  pickleball: [
    "pickleball",
    "paddle",
    "paddle-pair",
    "net-line",
    "pickleball-court",
    "serve-line",
    "trophy",
    "water-bottle",
    "court-line",
    "scoreboard",
    "whistle",
    "star",
    "banner",
    "dot",
  ],
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
  football: { texture: "grain", density: "medium", placement: "edges" },
  "baby-shower": { texture: "paper", density: "low", placement: "balanced" },
  "bridal-shower": { texture: "paper", density: "low", placement: "corners" },
  engagement: { texture: "paper", density: "low", placement: "corners" },
  anniversary: { texture: "paper", density: "low", placement: "corners" },
  housewarming: { texture: "grain", density: "low", placement: "balanced" },
  graduation: { texture: "grain", density: "medium", placement: "balanced" },
  religious: { texture: "paper", density: "low", placement: "balanced" },
  general: { texture: "grain", density: "low", placement: "balanced" },
};

const SPORT_KIND_FALLBACK_STYLE: Record<
  OcrSportKind,
  {
    texture: OcrSkinBackgroundTexture;
    density: OcrSkinBackgroundDensity;
    placement: OcrSkinBackgroundPlacement;
  }
> = {
  pickleball: { texture: "grain", density: "medium", placement: "edges" },
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
    normalized === "football" ||
    normalized === "football event" ||
    normalized === "football events" ||
    normalized === "football invite" ||
    normalized === "football invites" ||
    normalized === "football game" ||
    normalized === "football games"
  ) {
    return "football";
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

export function normalizeOcrSportKind(value: unknown): OcrSportKind | null {
  const normalized = safeString(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  return normalized === "pickleball" ? "pickleball" : null;
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

export function isFootballOcrSkinCandidate(input: {
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
  const isSportOrGeneralCategory =
    !category ||
    category === "sport events" ||
    category === "sport event" ||
    category === "sports" ||
    category === "general events" ||
    category === "general event" ||
    category === "football";
  if (!isSportOrGeneralCategory) return false;
  if (
    /\bfootball\b|\bkick\s*off\b|\bkickoff\b|\bpregame\b|\btouchdown\b|\bfriday\s+night\s+lights\b|\bsenior\s+night\b|\bvarsity\b|\bstadium\b|\btailgate\b|\bhalftime\b|\bstudent\s+section\b/.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /\bwatch\s+party\b/.test(text) &&
    /\b(jets|texans|lions|tigers|panthers|eagles|chiefs|football|super\s*bowl|nfl|game\s*day|touchdown)\b/.test(
      text,
    )
  ) {
    return true;
  }
  return (
    /\bvs\.?\b|\btickets?\b|\bwear\s+[a-z]+(?:\s*(?:&|and)\s*[a-z]+)?\b/.test(text) &&
    /\b(field|stadium|team|game|school|athletics|kickoff|halftime|student\s+section)\b/.test(text)
  );
}

export function isPickleballOcrSkinCandidate(input: {
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
  const isSportOrGeneralCategory =
    !category ||
    category === "sport events" ||
    category === "sport event" ||
    category === "sports" ||
    category === "general events" ||
    category === "general event" ||
    category === "pickleball";
  if (!isSportOrGeneralCategory) return false;
  if (/\bpickle\s*ball\b|\bpickleball\b|\bdink(?:s|ing)?\b|\bkitchen\b/.test(text)) {
    return true;
  }
  if (
    /\bpaddles?\b/.test(text) &&
    /\b(court|tournament|clinic|doubles?|entry|register)\b/.test(text)
  ) {
    return true;
  }
  return (
    /\b(?:open\s+)?(?:mixed\s+)?doubles?\b|\bopen\s+class\b|\bcheck[-\s]?in\b|\bentry\s+fee\b/.test(
      text,
    ) &&
    /\b(court|tournament|clinic|team|register|registration|session|skill\s+levels?)\b/.test(text)
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
  const skinId = safeString(context.skinId);
  if (skinId.startsWith("scanned-football-")) return "football";
  if (skinId.startsWith("scanned-basketball-")) return "basketball";
  return normalizeOcrSkinCategory(context.category) || "general";
}

function getContextSportKind(context: OcrSkinBackgroundContext): OcrSportKind | null {
  return (
    normalizeOcrSportKind(context.sportKind) ||
    (safeString(context.skinId).startsWith("scanned-pickleball-") ? "pickleball" : null)
  );
}

function getAllowedObjectKinds(
  category: OcrSkinCategory,
  sportKind: OcrSportKind | null,
): readonly OcrSkinBackgroundObjectKind[] {
  return sportKind ? SPORT_KIND_OBJECT_KINDS[sportKind] : CATEGORY_OBJECT_KINDS[category];
}

function getRequiredObjectKinds(
  category: OcrSkinCategory,
  sportKind: OcrSportKind | null,
): readonly OcrSkinBackgroundObjectKind[] {
  if (sportKind) return [];
  return category === "football" ? ["football-trophy"] : [];
}

function normalizeObjectKind(value: unknown): OcrSkinBackgroundObjectKind | null {
  const normalized = safeString(value).toLowerCase().replace(/_/g, "-");
  const aliases: Record<string, OcrSkinBackgroundObjectKind> = {
    balloons: "balloon",
    caps: "cap",
    confettis: "confetti",
    birthdaycake: "cake",
    "birthday-cake": "cake",
    cakes: "cake",
    cupcake: "cupcake",
    cupcakes: "cupcake",
    presents: "gift",
    present: "gift",
    gifts: "gift",
    "party-hats": "party-hat",
    "party hat": "party-hat",
    "party hats": "party-hat",
    candles: "candle",
    sparkles: "sparkle",
    twinkle: "sparkle",
    twinkles: "sparkle",
    crowns: "crown",
    "music-notes": "music-note",
    "music note": "music-note",
    "music notes": "music-note",
    note: "music-note",
    notes: "music-note",
    "arcade-token": "arcade-token",
    "arcade token": "arcade-token",
    "arcade tokens": "arcade-token",
    token: "arcade-token",
    tokens: "arcade-token",
    diplomas: "diploma",
    dots: "dot",
    flowers: "botanical-sprig",
    "floral-sprig": "botanical-sprig",
    "floral-sprigs": "botanical-sprig",
    "floral arch": "floral-arch",
    "floral-arches": "floral-arch",
    "flower-arch": "floral-arch",
    "frame-corners": "frame-corner",
    "graduation-cap": "cap",
    hearts: "heart",
    "ring-boxes": "ring-box",
    "ring box": "ring-box",
    "ring boxes": "ring-box",
    diamond: "diamond",
    diamonds: "diamond",
    gems: "diamond",
    "champagne-glass": "champagne",
    "champagne-glasses": "champagne",
    "champagne glass": "champagne",
    "champagne glasses": "champagne",
    flute: "champagne",
    flutes: "champagne",
    "champagne-bubbles": "champagne-bubble",
    "champagne bubble": "champagne-bubble",
    "champagne bubbles": "champagne-bubble",
    bubbles: "champagne-bubble",
    "wine-glass": "wine-glass",
    "wine-glasses": "wine-glass",
    "wine glass": "wine-glass",
    "wine glasses": "wine-glass",
    wine: "wine-glass",
    lace: "lace",
    "lace-border": "lace",
    "lace border": "lace",
    "vow-book": "vow-book",
    "vow-books": "vow-book",
    "vow book": "vow-book",
    "vow books": "vow-book",
    "guest-book": "vow-book",
    "guest book": "vow-book",
    ribbons: "ribbon",
    bouquets: "bouquet",
    "flower-bouquet": "bouquet",
    "flower bouquet": "bouquet",
    "wax-seals": "wax-seal",
    "wax seal": "wax-seal",
    "wax seals": "wax-seal",
    roses: "rose",
    "photo-frame": "photo-frame",
    "photo-frames": "photo-frame",
    "photo frame": "photo-frame",
    "photo frames": "photo-frame",
    picture: "photo-frame",
    "picture-frame": "photo-frame",
    "baby bottle": "baby-bottle",
    "baby-bottles": "baby-bottle",
    "baby bottles": "baby-bottle",
    bottles: "baby-bottle",
    rattles: "rattle",
    crescent: "moon",
    moons: "moon",
    onesies: "onesie",
    bodysuit: "onesie",
    pacifiers: "pacifier",
    "teddy-bears": "teddy-bear",
    "teddy bear": "teddy-bear",
    "teddy bears": "teddy-bear",
    clouds: "cloud",
    bibs: "bib",
    strollers: "stroller",
    pram: "stroller",
    prams: "stroller",
    teacups: "teacup",
    "tea-cup": "teacup",
    "tea-cups": "teacup",
    "tea cup": "teacup",
    "tea cups": "teacup",
    bows: "bow",
    houses: "house",
    home: "house",
    homes: "house",
    keys: "key",
    door: "front-door",
    doors: "front-door",
    "front-doors": "front-door",
    "front door": "front-door",
    "front doors": "front-door",
    "welcome-mats": "welcome-mat",
    "welcome mat": "welcome-mat",
    "welcome mats": "welcome-mat",
    plants: "plant",
    greenery: "plant",
    lamps: "lamp",
    mugs: "mug",
    cups: "mug",
    leaves: "leaf",
    pearls: "pearl",
    rings: "ring",
    stars: "star",
    streamer: "streamer",
    streamers: "streamer",
    basketballs: "basketball",
    footballs: "football",
    helmets: "helmet",
    "goal-post": "goalpost",
    "goal-posts": "goalpost",
    goalposts: "goalpost",
    "field-lines": "field-line",
    field: "field-line",
    lights: "stadium-light",
    "stadium-lights": "stadium-light",
    hoops: "hoop",
    "court-lines": "court-line",
    court: "court-line",
    "court-arc": "court-arc",
    "court-arcs": "court-arc",
    "court arc": "court-arc",
    "court arcs": "court-arc",
    backboards: "backboard",
    "basketball-net": "net",
    "basketball net": "net",
    "basketball nets": "net",
    "shot-clocks": "shot-clock",
    "shot clock": "shot-clock",
    "shot clocks": "shot-clock",
    shoe: "sneaker",
    shoes: "sneaker",
    sneaker: "sneaker",
    sneakers: "sneaker",
    trophies: "trophy",
    "football-trophy": "football-trophy",
    "football-trophies": "football-trophy",
    "football trophy": "football-trophy",
    "football trophies": "football-trophy",
    "championship-trophy": "football-trophy",
    "championship trophy": "football-trophy",
    "super-bowl-trophy": "football-trophy",
    "super bowl trophy": "football-trophy",
    "super-bowl-cup": "football-trophy",
    "super bowl cup": "football-trophy",
    "lombardi-trophy": "football-trophy",
    "lombardi trophy": "football-trophy",
    "vince-lombardi-trophy": "football-trophy",
    "vince lombardi trophy": "football-trophy",
    "yard-markers": "yard-marker",
    "yard marker": "yard-marker",
    "yard markers": "yard-marker",
    playbooks: "playbook",
    cleats: "cleat",
    "foam-fingers": "foam-finger",
    "foam finger": "foam-finger",
    "foam fingers": "foam-finger",
    net: "net",
    nets: "net",
    "court-net": "net-line",
    "court net": "net-line",
    "net-lines": "net-line",
    paddle: "paddle",
    paddles: "paddle",
    "paddle-pairs": "paddle-pair",
    "paddle pair": "paddle-pair",
    "paddle pairs": "paddle-pair",
    "pickleball-ball": "pickleball",
    "pickleball-balls": "pickleball",
    pickleballs: "pickleball",
    "pickleball-courts": "pickleball-court",
    "pickleball court": "pickleball-court",
    "pickleball courts": "pickleball-court",
    "serve-lines": "serve-line",
    "serve line": "serve-line",
    "serve lines": "serve-line",
    "water-bottle": "water-bottle",
    "water-bottles": "water-bottle",
    "water bottle": "water-bottle",
    "water bottles": "water-bottle",
    tassels: "tassel",
    books: "book",
    notebooks: "notebook",
    "school-building": "school-building",
    "school-buildings": "school-building",
    "school building": "school-building",
    "school buildings": "school-building",
    scrolls: "scroll",
    laurels: "laurel",
    "laurel-wreath": "laurel",
    "laurel wreath": "laurel",
    medals: "medal",
    medal: "medal",
    doves: "dove",
    "stained-glass": "stained-glass",
    "stained glass": "stained-glass",
    "stained-glass-window": "stained-glass",
    "stained glass window": "stained-glass",
    "olive-branches": "olive-branch",
    "olive branch": "olive-branch",
    "olive branches": "olive-branch",
    lanterns: "lantern",
    calendars: "calendar",
    ticket: "ticket",
    tickets: "ticket",
    "map-pin": "map-pin",
    "map-pins": "map-pin",
    "map pin": "map-pin",
    "map pins": "map-pin",
    pin: "map-pin",
    pins: "map-pin",
    "announcement-card": "announcement-card",
    "announcement-cards": "announcement-card",
    "announcement card": "announcement-card",
    "announcement cards": "announcement-card",
    card: "announcement-card",
    cards: "announcement-card",
    jerseys: "jersey",
    uniform: "jersey",
    uniforms: "jersey",
    whistles: "whistle",
    scoreboards: "scoreboard",
    pennants: "pennant",
    flags: "pennant",
    megaphones: "megaphone",
  };
  const resolved = aliases[normalized] || normalized;
  return BACKGROUND_OBJECT_KIND_SET.has(resolved as OcrSkinBackgroundObjectKind)
    ? (resolved as OcrSkinBackgroundObjectKind)
    : null;
}

function normalizeObjectKinds(
  value: unknown,
  category: OcrSkinCategory,
  sportKind: OcrSportKind | null,
): OcrSkinBackgroundObjectKind[] {
  const allowed = new Set(getAllowedObjectKinds(category, sportKind));
  const rawKinds = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const normalized: OcrSkinBackgroundObjectKind[] = [];
  for (const item of rawKinds) {
    const objectKind = normalizeObjectKind(item);
    const contextualObjectKind =
      category === "football" && objectKind === "trophy" ? "football-trophy" : objectKind;
    if (
      !contextualObjectKind ||
      !allowed.has(contextualObjectKind) ||
      normalized.includes(contextualObjectKind)
    )
      continue;
    normalized.push(contextualObjectKind);
  }
  return normalized.slice(0, 7);
}

function getObjectKindTargetCount(
  category: OcrSkinCategory,
  sportKind: OcrSportKind | null,
): number {
  return sportKind ? 6 : category === "wedding" ? 5 : 6;
}

function completeObjectKinds(
  objectKinds: OcrSkinBackgroundObjectKind[],
  fallbackObjectKinds: OcrSkinBackgroundObjectKind[],
  category: OcrSkinCategory,
  sportKind: OcrSportKind | null,
): OcrSkinBackgroundObjectKind[] {
  const allowedCount = getAllowedObjectKinds(category, sportKind).length;
  const targetCount = Math.min(getObjectKindTargetCount(category, sportKind), allowedCount);
  const merged: OcrSkinBackgroundObjectKind[] = [];
  for (const objectKind of [
    ...getRequiredObjectKinds(category, sportKind),
    ...objectKinds,
    ...fallbackObjectKinds,
  ]) {
    if (merged.length >= targetCount) break;
    if (!merged.includes(objectKind)) merged.push(objectKind);
  }
  return merged.slice(0, 7);
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
  sportKind: OcrSportKind | null,
  seedHash: number,
): OcrSkinBackgroundObjectKind[] {
  const allowed = getAllowedObjectKinds(category, sportKind);
  const targetCount = getObjectKindTargetCount(category, sportKind);
  const picked: OcrSkinBackgroundObjectKind[] = [...getRequiredObjectKinds(category, sportKind)];
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
  const sportKind = getContextSportKind(context);
  const seedSource = [
    sportKind,
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
  const seedHash = hashString(seedSource || sportKind || category);
  const fallback = sportKind
    ? SPORT_KIND_FALLBACK_STYLE[sportKind]
    : CATEGORY_FALLBACK_STYLE[category];
  return {
    version: 1,
    seed: `${sportKind || category}-${seedHash.toString(36)}`,
    texture: fallback.texture,
    density: fallback.density,
    placement: fallback.placement,
    objectKinds: pickFallbackObjectKinds(category, sportKind, seedHash),
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
  const sportKind = getContextSportKind(context);
  const fallback = buildFallbackOcrSkinBackground(context);
  const objectKinds = normalizeObjectKinds(input.objectKinds, category, sportKind);
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
    objectKinds: objectKinds.length
      ? completeObjectKinds(objectKinds, fallback.objectKinds, category, sportKind)
      : fallback.objectKinds,
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
  sportKindInput?: OcrSportKind | string | null,
): readonly OcrSkinBackgroundObjectKind[] {
  const category = normalizeOcrSkinCategory(categoryInput) || "general";
  const sportKind = normalizeOcrSportKind(sportKindInput);
  return getAllowedObjectKinds(category, sportKind);
}

export function buildOcrSkinBackgroundPromptRules(
  category: OcrSkinCategory,
  sportKindInput?: OcrSportKind | string | null,
): string {
  const sportKind = normalizeOcrSportKind(sportKindInput);
  const allowedKinds = getAllowedObjectKinds(category, sportKind)
    .map((kind) => `"${kind}"`)
    .join(", ");
  const categoryLabel =
    sportKind === "pickleball"
      ? "pickleball sport flyers"
      : category === "birthday"
        ? "birthday"
        : category === "wedding"
          ? "wedding"
          : category === "basketball"
            ? "basketball"
            : category === "football"
              ? "football"
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
    "Choose 4 to 7 objectKinds that are most characteristic of the specific skin/category.",
    "Use colors from the flyer palette as six-digit hex values. Do not add text, words, names, dates, or logos.",
    "The seed must be a short unique kebab-case token derived from the event title and visual mood.",
  ].join("\n");
}
