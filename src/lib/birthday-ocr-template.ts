export type BirthdayAudience = "girl" | "boy" | "neutral";

export type BirthdayTemplateHint = {
  detected: boolean;
  audience: BirthdayAudience | null;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  honoreeName: string | null;
  age: number | null;
  themeId: string | null;
};

const GIRL_SIGNAL_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bballerina\b/i, reason: "ballerina" },
  { pattern: /\bballet\b/i, reason: "ballet" },
  { pattern: /\btutu\b/i, reason: "tutu" },
  { pattern: /\bprincess\b/i, reason: "princess" },
  { pattern: /\bcrown\b/i, reason: "crown" },
  { pattern: /\bbow(?:s)?\b/i, reason: "bow" },
  { pattern: /\btea party\b/i, reason: "tea party" },
  { pattern: /\bshe\b|\bher\b/i, reason: "she/her" },
];

const BOY_SIGNAL_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\ball[\s-]?star\b/i, reason: "all-star" },
  { pattern: /\bmvp\b/i, reason: "mvp" },
  { pattern: /\bsports?\b/i, reason: "sports" },
  { pattern: /\bfootball\b|\bsoccer\b|\bbasketball\b|\bbaseball\b/i, reason: "sports theme" },
  { pattern: /\bsuperhero\b/i, reason: "superhero" },
  { pattern: /\btruck(?:s)?\b/i, reason: "trucks" },
  { pattern: /\bmonster truck(?:s)?\b/i, reason: "monster trucks" },
  { pattern: /\bhe\b|\bhim\b/i, reason: "he/him" },
];

export const OCR_BIRTHDAY_THEME_IDS = {
  girl: "editorial_ballerina_bloom",
  boy: "editorial_blue_allstar",
  neutral: "editorial_confetti_neutral",
} as const;

export function selectBirthdayOcrThemeId(
  audience: BirthdayAudience | null | undefined
): string {
  if (audience === "girl") return OCR_BIRTHDAY_THEME_IDS.girl;
  if (audience === "boy") return OCR_BIRTHDAY_THEME_IDS.boy;
  return OCR_BIRTHDAY_THEME_IDS.neutral;
}

export function isOcrBirthdayRenderer(createdVia: unknown): boolean {
  return String(createdVia || "").trim().toLowerCase() === "ocr-birthday-renderer";
}

function extractAge(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 1 && value <= 99 ? Math.round(value) : null;
  }
  const text = String(value || "").trim();
  if (!text) return null;
  const match =
    text.match(/\b([1-9]\d?)\s*(?:st|nd|rd|th)?\b/i) ||
    text.match(/\bturning\s+([1-9]\d?)\b/i) ||
    text.match(/\bage\s+([1-9]\d?)\b/i);
  if (!match) return null;
  const age = Number.parseInt(match[1], 10);
  return Number.isFinite(age) && age >= 1 && age <= 99 ? age : null;
}

function normalizeName(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function collectReasons(text: string, patterns: Array<{ pattern: RegExp; reason: string }>) {
  const reasons: string[] = [];
  for (const entry of patterns) {
    if (!entry.pattern.test(text)) continue;
    if (!reasons.includes(entry.reason)) reasons.push(entry.reason);
  }
  return reasons;
}

export function normalizeBirthdayTemplateHint(input: {
  category?: unknown;
  rawText?: unknown;
  title?: unknown;
  birthdayAudience?: unknown;
  birthdaySignals?: unknown;
  birthdayName?: unknown;
  birthdayAge?: unknown;
}): BirthdayTemplateHint {
  const category = String(input.category || "").trim().toLowerCase();
  if (category !== "birthdays") {
    return {
      detected: false,
      audience: null,
      confidence: "low",
      reasons: [],
      honoreeName: null,
      age: null,
      themeId: null,
    };
  }

  const combinedText = `${String(input.rawText || "")}\n${String(input.title || "")}`.trim();
  const modelAudience = String(input.birthdayAudience || "").trim().toLowerCase();
  const modelSignals = Array.isArray(input.birthdaySignals)
    ? input.birthdaySignals
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    : [];
  const girlReasons = collectReasons(combinedText, GIRL_SIGNAL_PATTERNS);
  const boyReasons = collectReasons(combinedText, BOY_SIGNAL_PATTERNS);
  const reasons = [...modelSignals];

  let audience: BirthdayAudience = "neutral";
  let confidence: BirthdayTemplateHint["confidence"] = "low";

  if (modelAudience === "girl" || modelAudience === "boy" || modelAudience === "neutral") {
    audience = modelAudience as BirthdayAudience;
  }

  if (girlReasons.length && !boyReasons.length) {
    audience = "girl";
    confidence = girlReasons.length >= 2 ? "high" : "medium";
    reasons.push(...girlReasons);
  } else if (boyReasons.length && !girlReasons.length) {
    audience = "boy";
    confidence = boyReasons.length >= 2 ? "high" : "medium";
    reasons.push(...boyReasons);
  } else if (audience === "girl" || audience === "boy") {
    confidence = "medium";
  } else {
    audience = "neutral";
    confidence = "low";
  }

  const dedupedReasons = Array.from(
    new Set(reasons.map((reason) => reason.trim()).filter(Boolean))
  );

  return {
    detected: true,
    audience,
    confidence,
    reasons: dedupedReasons,
    honoreeName: normalizeName(input.birthdayName),
    age: extractAge(input.birthdayAge),
    themeId: selectBirthdayOcrThemeId(audience),
  };
}
