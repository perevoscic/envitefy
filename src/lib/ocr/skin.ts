import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { resolveStudioProvider } from "@/lib/studio/provider";
import type { StudioProvider } from "@/lib/studio/types";

export type OcrSkinCategory = "birthday" | "wedding";

export type OcrSkinId =
  | "scanned-birthday-bento-pop"
  | "scanned-birthday-storybook-sparkle"
  | "scanned-birthday-retro-neon"
  | "scanned-wedding-editorial-paper"
  | "scanned-wedding-gilded-romance"
  | "scanned-wedding-noir-modern";

export type OcrSkinPalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  dominant: string;
  themeColor: string;
};

export type OcrSkinSelection = {
  version: 1;
  category: OcrSkinCategory;
  skinId: OcrSkinId;
  palette: OcrSkinPalette;
  provider: StudioProvider;
};

type OcrSkinPromptInput = {
  category: OcrSkinCategory;
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

const OCR_SKIN_ID_SET = new Set<OcrSkinId>([...BIRTHDAY_SKIN_IDS, ...WEDDING_SKIN_IDS]);

const DEFAULT_OCR_SKIN_PALETTES: Record<OcrSkinId, OcrSkinPalette> = {
  "scanned-birthday-bento-pop": {
    background: "#fff7eb",
    primary: "#ff7b89",
    secondary: "#ffd166",
    accent: "#4cc9f0",
    text: "#351628",
    dominant: "#ff9f6e",
    themeColor: "#ff7b89",
  },
  "scanned-birthday-storybook-sparkle": {
    background: "#fff7fb",
    primary: "#f3d7f4",
    secondary: "#ffd9e8",
    accent: "#9f7aea",
    text: "#3f244b",
    dominant: "#e9b7da",
    themeColor: "#9f7aea",
  },
  "scanned-birthday-retro-neon": {
    background: "#0b1020",
    primary: "#161f3d",
    secondary: "#291b57",
    accent: "#14f1d9",
    text: "#f5efff",
    dominant: "#ff4fb3",
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
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: unknown): OcrSkinCategory | null {
  const normalized = safeString(value).toLowerCase();
  if (normalized === "birthday" || normalized === "birthdays") return "birthday";
  if (normalized === "wedding" || normalized === "weddings") return "wedding";
  return null;
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
  if (category === "birthday" && BIRTHDAY_SKIN_IDS.includes(id as (typeof BIRTHDAY_SKIN_IDS)[number])) {
    return id;
  }
  if (category === "wedding" && WEDDING_SKIN_IDS.includes(id as (typeof WEDDING_SKIN_IDS)[number])) {
    return id;
  }
  return null;
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

  return [
    'Allowed skinId values: "scanned-wedding-editorial-paper", "scanned-wedding-gilded-romance", "scanned-wedding-noir-modern".',
    'Pick "scanned-wedding-editorial-paper" for airy, floral, cream, stationery-like, classic, delicate, or soft editorial wedding invites.',
    'Pick "scanned-wedding-gilded-romance" for warm gold, ballroom, formal, traditional, ornate, luxurious, or champagne-toned wedding invites.',
    'Pick "scanned-wedding-noir-modern" for black-and-white, moody, fashion-editorial, city-night, stark, minimal, or modern luxury wedding invites.',
  ].join("\n");
}

function buildPrompt(input: OcrSkinPromptInput): string {
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
    buildAllowedSkinRules(input.category),
    "Also extract a coherent palette from the flyer itself.",
    "Palette must use six-digit hex colors and include: background, primary, secondary, accent, text, dominant, themeColor.",
    "Do not invent a new skinId. Choose only from the allowed list.",
    "Prefer the flyer's visual mood, typography attitude, and composition feel over generic category defaults.",
    "",
    `Category: ${input.category}`,
    title ? `Title: ${title}` : "Title: Not provided",
    location ? `Location: ${location}` : "Location: Not provided",
    description ? `Description: ${description}` : "Description: Not provided",
    input.category === "birthday" && hintAudience ? `Birthday audience hint: ${hintAudience}` : "",
    input.category === "birthday" && hintName ? `Birthday honoree hint: ${hintName}` : "",
    input.category === "birthday" && hintAge ? `Birthday age hint: ${hintAge}` : "",
    input.category === "birthday" && hintThemeId ? `Existing birthday OCR theme hint: ${hintThemeId}` : "",
    input.ocrText ? `OCR text:\n${input.ocrText}` : "OCR text: Not provided",
    "",
    'Response shape: {"skinId":"allowed-id","palette":{"background":"#xxxxxx","primary":"#xxxxxx","secondary":"#xxxxxx","accent":"#xxxxxx","text":"#xxxxxx","dominant":"#xxxxxx","themeColor":"#xxxxxx"}}',
  ]
    .filter(Boolean)
    .join("\n");
}

function resolveOpenAiTextModel(): string {
  return process.env.STUDIO_OPENAI_TEXT_MODEL || "gpt-5.4-mini";
}

function resolveGeminiTextModel(): string {
  return process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-3-flash-preview";
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
          },
          required: ["skinId", "palette"],
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
): OcrSkinSelection | null {
  if (!value || typeof value !== "object") return null;
  const category = normalizeCategory(categoryInput || (value as any)?.category);
  if (!category) return null;
  const providerRaw = providerInput || (value as any)?.provider;
  const provider: StudioProvider = providerRaw === "openai" ? "openai" : "gemini";
  const skinId = normalizeSkinId(category, (value as any)?.skinId);
  if (!skinId) return null;
  return {
    version: 1,
    category,
    skinId,
    palette: normalizePalette(skinId, (value as any)?.palette),
    provider,
  };
}

export async function inferOcrSkinSelection(input: OcrSkinPromptInput): Promise<OcrSkinSelection | null> {
  const category = normalizeCategory(input.category);
  if (!category) return null;
  const provider = ocrSkinDeps.resolveStudioProvider();
  const raw =
    provider === "openai"
      ? await ocrSkinDeps.inferWithOpenAi({ ...input, category })
      : await ocrSkinDeps.inferWithGemini({ ...input, category });
  return normalizeOcrSkinSelection(raw, category, provider);
}
