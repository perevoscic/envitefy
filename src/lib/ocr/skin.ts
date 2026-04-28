import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import {
  buildOcrSkinBackgroundPromptRules,
  normalizeOcrSkinBackground,
  normalizeOcrSkinCategory,
  resolveOcrSkinBackground,
  type OcrSkinBackground,
  type OcrSkinCategory,
  type OcrSkinId,
  type OcrSkinPalette,
} from "@/lib/ocr/skin-background";
import { resolveStudioProvider } from "@/lib/studio/provider";
import type { StudioProvider } from "@/lib/studio/types";

export type {
  OcrSkinBackground,
  OcrSkinBackgroundDensity,
  OcrSkinBackgroundObjectKind,
  OcrSkinBackgroundPlacement,
  OcrSkinBackgroundTexture,
  OcrSkinCategory,
  OcrSkinId,
  OcrSkinPalette,
} from "@/lib/ocr/skin-background";

export { isBasketballOcrSkinCandidate } from "@/lib/ocr/skin-background";

export type OcrSkinSelection = {
  version: 1;
  category: OcrSkinCategory;
  skinId: OcrSkinId;
  palette: OcrSkinPalette;
  background?: OcrSkinBackground;
  provider: StudioProvider;
};

type OcrSkinPromptInput = {
  category: OcrSkinCategory | string;
  imageBytes: Buffer;
  mimeType: string;
  ocrText: string;
  fieldsGuess?: {
    title?: string | null;
    location?: string | null;
    description?: string | null;
  } | null;
  birthdayHint?: {
    audience?: string | null;
    honoreeName?: string | null;
    age?: number | string | null;
    themeId?: string | null;
  } | null;
};

type RawOcrSkinPayload = {
  skinId?: unknown;
  palette?: Record<string, unknown> | null;
  background?: Record<string, unknown> | null;
};

const BIRTHDAY_SKIN_IDS = [
  "scanned-birthday-bento-pop",
  "scanned-birthday-storybook-sparkle",
  "scanned-birthday-retro-neon",
] as const;

const WEDDING_SKIN_IDS = [
  "scanned-wedding-editorial-paper",
  "scanned-wedding-gilded-romance",
  "scanned-wedding-noir-modern",
] as const;

const BASKETBALL_SKIN_IDS = [
  "scanned-basketball-court-energy",
  "scanned-basketball-tournament-poster",
  "scanned-basketball-night-run",
] as const;

const GENERIC_INVITE_SKIN_IDS = [
  "scanned-invite-bento-celebration",
  "scanned-invite-soft-radiance",
  "scanned-invite-evening-luxe",
] as const;

const GENERIC_OCR_SKIN_CATEGORIES = [
  "baby-shower",
  "bridal-shower",
  "engagement",
  "anniversary",
  "housewarming",
  "graduation",
  "religious",
  "general",
] as const;

const OCR_SKIN_ID_SET = new Set<OcrSkinId>([
  ...BIRTHDAY_SKIN_IDS,
  ...WEDDING_SKIN_IDS,
  ...BASKETBALL_SKIN_IDS,
  ...GENERIC_INVITE_SKIN_IDS,
]);

const OCR_INVITE_CATEGORY_LABELS: Record<OcrSkinCategory, string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  basketball: "Basketball",
  "baby-shower": "Baby Shower",
  "bridal-shower": "Bridal Shower",
  engagement: "Engagement",
  anniversary: "Anniversary",
  housewarming: "Housewarming",
  graduation: "Graduation",
  religious: "Religious Celebration",
  general: "General Event",
};

const DEFAULT_OCR_SKIN_PALETTES: Record<OcrSkinId, OcrSkinPalette> = {
  "scanned-birthday-bento-pop": {
    background: "#d6ebee",
    primary: "#ef2f92",
    secondary: "#1ba3e4",
    accent: "#ff9a1f",
    text: "#101010",
    dominant: "#ef2f92",
    themeColor: "#ef2f92",
  },
  "scanned-birthday-storybook-sparkle": {
    background: "#fff3fb",
    primary: "#c285ff",
    secondary: "#ff8bb7",
    accent: "#6ed0ff",
    text: "#2d1b45",
    dominant: "#ffb2d7",
    themeColor: "#c285ff",
  },
  "scanned-birthday-retro-neon": {
    background: "#0b1020",
    primary: "#ff4fb3",
    secondary: "#14f1d9",
    accent: "#f7b801",
    text: "#f5efff",
    dominant: "#161f3d",
    themeColor: "#14f1d9",
  },
  "scanned-wedding-editorial-paper": {
    background: "#faf5ef",
    primary: "#efe5d6",
    secondary: "#fffaf6",
    accent: "#b58a63",
    text: "#2c241e",
    dominant: "#dfcfbd",
    themeColor: "#b58a63",
  },
  "scanned-wedding-gilded-romance": {
    background: "#f9f1e7",
    primary: "#eadcc7",
    secondary: "#fffaf2",
    accent: "#c29a5f",
    text: "#2d2317",
    dominant: "#d8c1a1",
    themeColor: "#c29a5f",
  },
  "scanned-wedding-noir-modern": {
    background: "#0d1018",
    primary: "#1a2130",
    secondary: "#111111",
    accent: "#f1d39a",
    text: "#f5efe7",
    dominant: "#2a3345",
    themeColor: "#f1d39a",
  },
  "scanned-basketball-court-energy": {
    background: "#fff6eb",
    primary: "#f97316",
    secondary: "#111827",
    accent: "#f59e0b",
    text: "#111827",
    dominant: "#f97316",
    themeColor: "#f97316",
  },
  "scanned-basketball-tournament-poster": {
    background: "#f8fafc",
    primary: "#ea580c",
    secondary: "#2563eb",
    accent: "#facc15",
    text: "#111827",
    dominant: "#ea580c",
    themeColor: "#2563eb",
  },
  "scanned-basketball-night-run": {
    background: "#111827",
    primary: "#f97316",
    secondary: "#38bdf8",
    accent: "#fbbf24",
    text: "#f9fafb",
    dominant: "#1f2937",
    themeColor: "#f97316",
  },
  "scanned-invite-bento-celebration": {
    background: "#dcecf7",
    primary: "#e91e8f",
    secondary: "#16a5e3",
    accent: "#ff9f1c",
    text: "#111827",
    dominant: "#e91e8f",
    themeColor: "#e91e8f",
  },
  "scanned-invite-soft-radiance": {
    background: "#f7f0ff",
    primary: "#b56ef4",
    secondary: "#ff7aa8",
    accent: "#53c7ff",
    text: "#24163d",
    dominant: "#ffb347",
    themeColor: "#b56ef4",
  },
  "scanned-invite-evening-luxe": {
    background: "#111827",
    primary: "#5eead4",
    secondary: "#f472b6",
    accent: "#fbbf24",
    text: "#f9fafb",
    dominant: "#1f2937",
    themeColor: "#5eead4",
  },
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isOcrInviteCategory(value: unknown): boolean {
  return Boolean(normalizeOcrSkinCategory(value));
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
  if (/^[0-9a-f]{6}$/.test(normalized)) {
    return `#${normalized}`;
  }
  return null;
}

function normalizeSkinId(category: OcrSkinCategory, value: unknown): OcrSkinId | null {
  const id = safeString(value) as OcrSkinId;
  if (!OCR_SKIN_ID_SET.has(id)) return null;
  if (
    category === "birthday" &&
    BIRTHDAY_SKIN_IDS.includes(id as (typeof BIRTHDAY_SKIN_IDS)[number])
  ) {
    return id;
  }
  if (
    category === "wedding" &&
    WEDDING_SKIN_IDS.includes(id as (typeof WEDDING_SKIN_IDS)[number])
  ) {
    return id;
  }
  if (
    category === "basketball" &&
    BASKETBALL_SKIN_IDS.includes(id as (typeof BASKETBALL_SKIN_IDS)[number])
  ) {
    return id;
  }
  if (
    GENERIC_OCR_SKIN_CATEGORIES.includes(
      category as (typeof GENERIC_OCR_SKIN_CATEGORIES)[number],
    ) &&
    GENERIC_INVITE_SKIN_IDS.includes(id as (typeof GENERIC_INVITE_SKIN_IDS)[number])
  ) {
    return id;
  }
  return null;
}

function hexToSaturation(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;
  const value = normalized.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const lightness = (max + min) / 2;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

function normalizePalette(skinId: OcrSkinId, value: unknown): OcrSkinPalette {
  const fallback = DEFAULT_OCR_SKIN_PALETTES[skinId];
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const background = normalizeHex(input.background) || fallback.background;
  const primary = normalizeHex(input.primary) || fallback.primary;
  const secondary = normalizeHex(input.secondary) || fallback.secondary;
  const accent = normalizeHex(input.accent) || fallback.accent;
  const text = normalizeHex(input.text) || fallback.text;
  const dominant = normalizeHex(input.dominant) || accent || fallback.dominant;
  const themeColor = normalizeHex(input.themeColor) || accent || dominant || fallback.themeColor;
  const maxSaturation = Math.max(
    hexToSaturation(primary),
    hexToSaturation(secondary),
    hexToSaturation(accent),
    hexToSaturation(dominant),
  );
  if (maxSaturation < 0.18) {
    return {
      background,
      primary: fallback.primary,
      secondary: fallback.secondary,
      accent: fallback.accent,
      text,
      dominant: fallback.dominant,
      themeColor: fallback.themeColor,
    };
  }
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

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {}
  }
  return null;
}

function buildAllowedSkinRules(category: OcrSkinCategory): string {
  if (category === "birthday") {
    return [
      'Allowed skinId values: "scanned-birthday-bento-pop", "scanned-birthday-storybook-sparkle", "scanned-birthday-retro-neon".',
      'Pick "scanned-birthday-bento-pop" for bright playful flyers with confetti, candy, balloons, saturated kids-party color, or cheerful bento-card energy.',
      'Pick "scanned-birthday-storybook-sparkle" for pastel, floral, princess, fairy, ballet, whimsical, dreamy, or soft magical flyers.',
      'Pick "scanned-birthday-retro-neon" for dark, neon, arcade, disco, city-night, teen, glow-party, or high-contrast modern flyers.',
    ].join("\n");
  }

  if (category === "wedding") {
    return [
      'Allowed skinId values: "scanned-wedding-editorial-paper", "scanned-wedding-gilded-romance", "scanned-wedding-noir-modern".',
      'Pick "scanned-wedding-editorial-paper" for airy, floral, cream, stationery-like, classic, delicate, or soft editorial wedding invites.',
      'Pick "scanned-wedding-gilded-romance" for warm gold, ballroom, formal, traditional, ornate, luxurious, or champagne-toned wedding invites.',
      'Pick "scanned-wedding-noir-modern" for black-and-white, moody, fashion-editorial, city-night, stark, minimal, or modern luxury wedding invites.',
    ].join("\n");
  }

  if (category === "basketball") {
    return [
      'Allowed skinId values: "scanned-basketball-court-energy", "scanned-basketball-tournament-poster", "scanned-basketball-night-run".',
      'Pick "scanned-basketball-court-energy" for bright orange, gym-floor, practice, skills clinic, or casual pickup flyers.',
      'Pick "scanned-basketball-tournament-poster" for school/team, bracket, league, camp, tournament, or bold poster-style flyers.',
      'Pick "scanned-basketball-night-run" for dark, neon, blacktop, late-night run, dramatic arena, or high-contrast basketball flyers.',
    ].join("\n");
  }

  return [
    'Allowed skinId values: "scanned-invite-bento-celebration", "scanned-invite-soft-radiance", "scanned-invite-evening-luxe".',
    `This flyer is for a ${OCR_INVITE_CATEGORY_LABELS[category].toLowerCase()} or related invitation surface.`,
    'Pick "scanned-invite-bento-celebration" for bright, playful, confetti-forward, saturated, kid-friendly, or high-energy flyers.',
    'Pick "scanned-invite-soft-radiance" for airy, floral, brunch, shower, pastel, delicate, or daytime editorial flyers.',
    'Pick "scanned-invite-evening-luxe" for dark, metallic, dramatic, formal, nightlife, or high-contrast flyers.',
  ].join("\n");
}

function buildPrompt(input: OcrSkinPromptInput): string {
  const category = normalizeOcrSkinCategory(input.category);
  if (!category) {
    return "Return JSON only.";
  }
  const title = safeString(input.fieldsGuess?.title);
  const location = safeString(input.fieldsGuess?.location);
  const description = safeString(input.fieldsGuess?.description);
  const hintAudience = safeString(input.birthdayHint?.audience);
  const hintName = safeString(input.birthdayHint?.honoreeName);
  const hintAge = String(input.birthdayHint?.age || "").trim();
  const hintThemeId = safeString(input.birthdayHint?.themeId);
  return [
    "You select one allowed mobile invite UI skin for a scanned event invitation.",
    "Return JSON only.",
    buildAllowedSkinRules(category),
    "Also extract the EXACT dominant color palette from the flyer itself.",
    "Palette must use six-digit hex colors and include: background, primary, secondary, accent, text, dominant, themeColor.",
    "Palette values are direct UI render tokens, not soft suggestions.",
    "For vivid flyers, keep saturated pinks, cyans, oranges, blues, purples, and neon accents when they are present.",
    "Do not mute, soften, or pastelize a vivid flyer palette unless the flyer is already soft.",
    "If the flyer background is colorful, preserve that color truth instead of washing it out to near-white.",
    "Do not invent a new skinId. Choose only from the allowed list.",
    "Prefer the flyer's visual mood, typography attitude, and composition feel over generic category defaults.",
    buildOcrSkinBackgroundPromptRules(category),
    "",
    `Category: ${category}`,
    title ? `Title: ${title}` : "Title: Not provided",
    location ? `Location: ${location}` : "Location: Not provided",
    description ? `Description: ${description}` : "Description: Not provided",
    category === "birthday" && hintAudience ? `Birthday audience hint: ${hintAudience}` : "",
    category === "birthday" && hintName ? `Birthday honoree hint: ${hintName}` : "",
    category === "birthday" && hintAge ? `Birthday age hint: ${hintAge}` : "",
    category === "birthday" && hintThemeId
      ? `Existing birthday OCR theme hint: ${hintThemeId}`
      : "",
    input.ocrText ? `OCR text:\n${input.ocrText}` : "OCR text: Not provided",
    "",
    'Response shape: {"skinId":"allowed-id","palette":{"background":"#xxxxxx","primary":"#xxxxxx","secondary":"#xxxxxx","accent":"#xxxxxx","text":"#xxxxxx","dominant":"#xxxxxx","themeColor":"#xxxxxx"},"background":{"version":1,"seed":"unique-kebab-case","texture":"paper","density":"low","placement":"corners","objectKinds":["allowed-kind"],"colors":["#xxxxxx"]}}',
  ]
    .filter(Boolean)
    .join("\n");
}

function resolveOpenAiTextModel(): string {
  return process.env.STUDIO_OPENAI_TEXT_MODEL || "gpt-5.4-mini";
}

function resolveGeminiTextModel(): string {
  return (
    process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-3-flash-preview"
  );
}

function getOpenAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || "";
  return apiKey ? new OpenAI({ apiKey }) : null;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (apiKey) return new GoogleGenAI({ apiKey });

  const project =
    process.env.STUDIO_GOOGLE_VERTEX_PROJECT ||
    process.env.GOOGLE_VERTEX_PROJECT ||
    process.env.NANA_GOOGLE_VERTEX_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    "";
  const location =
    process.env.STUDIO_GOOGLE_VERTEX_LOCATION ||
    process.env.GOOGLE_VERTEX_LOCATION ||
    process.env.NANA_GOOGLE_VERTEX_LOCATION ||
    process.env.GOOGLE_CLOUD_LOCATION ||
    "";
  if (project && location) {
    return new GoogleGenAI({ vertexai: true, project, location });
  }
  return null;
}

async function inferWithOpenAi(input: OcrSkinPromptInput): Promise<RawOcrSkinPayload | null> {
  const client = getOpenAiClient();
  if (!client) return null;
  const prompt = buildPrompt(input);
  try {
    const completion = await client.chat.completions.create({
      model: resolveOpenAiTextModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an invitation skin selector. Pick one allowed skin id and return compact JSON only.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mimeType};base64,${input.imageBytes.toString("base64")}`,
              },
            },
          ],
        },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = extractJsonObject(raw);
    return parsed && typeof parsed === "object" ? (parsed as RawOcrSkinPayload) : null;
  } catch {
    return null;
  }
}

async function inferWithGemini(input: OcrSkinPromptInput): Promise<RawOcrSkinPayload | null> {
  const client = getGeminiClient();
  if (!client) return null;
  try {
    const response = await client.models.generateContent({
      model: resolveGeminiTextModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBytes.toString("base64"),
              },
            },
            {
              text: buildPrompt(input),
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinId: { type: Type.STRING },
            palette: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                text: { type: Type.STRING },
                dominant: { type: Type.STRING },
                themeColor: { type: Type.STRING },
              },
              required: [
                "background",
                "primary",
                "secondary",
                "accent",
                "text",
                "dominant",
                "themeColor",
              ],
            },
            background: {
              type: Type.OBJECT,
              properties: {
                version: { type: Type.NUMBER },
                seed: { type: Type.STRING },
                texture: { type: Type.STRING },
                density: { type: Type.STRING },
                placement: { type: Type.STRING },
                objectKinds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                colors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["version", "seed", "texture", "density", "placement", "objectKinds"],
            },
          },
          required: ["skinId", "palette", "background"],
        },
      },
    });
    const text = typeof response.text === "string" ? response.text : "";
    const parsed = extractJsonObject(text);
    return parsed && typeof parsed === "object" ? (parsed as RawOcrSkinPayload) : null;
  } catch {
    return null;
  }
}

export const ocrSkinDeps = {
  inferWithGemini,
  inferWithOpenAi,
  resolveStudioProvider,
};

export function normalizeOcrSkinSelection(
  value: unknown,
  categoryInput?: unknown,
  providerInput?: unknown,
  backgroundContext?: { title?: unknown } | null,
): OcrSkinSelection | null {
  if (!value || typeof value !== "object") return null;
  const category = normalizeOcrSkinCategory(categoryInput || (value as any)?.category);
  if (!category) return null;
  const providerRaw = providerInput || (value as any)?.provider;
  const provider: StudioProvider = providerRaw === "openai" ? "openai" : "gemini";
  const skinId = normalizeSkinId(category, (value as any)?.skinId);
  if (!skinId) return null;
  const palette = normalizePalette(skinId, (value as any)?.palette);
  const background = normalizeOcrSkinBackground((value as any)?.background, {
    category,
    title: safeString(backgroundContext?.title) || safeString((value as any)?.title),
    skinId,
    palette,
  });
  return {
    version: 1,
    category,
    skinId,
    palette,
    background:
      background ||
      resolveOcrSkinBackground(null, {
        category,
        title: safeString(backgroundContext?.title) || safeString((value as any)?.title),
        skinId,
        palette,
      }),
    provider,
  };
}

export async function inferOcrSkinSelection(
  input: OcrSkinPromptInput,
): Promise<OcrSkinSelection | null> {
  const category = normalizeOcrSkinCategory(input.category);
  if (!category) return null;
  const provider = ocrSkinDeps.resolveStudioProvider();
  const raw =
    provider === "openai"
      ? await ocrSkinDeps.inferWithOpenAi({ ...input, category })
      : await ocrSkinDeps.inferWithGemini({ ...input, category });
  return normalizeOcrSkinSelection(raw, category, provider, {
    title: input.fieldsGuess?.title,
  });
}
