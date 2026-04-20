import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  type StudioEventDetails,
  type StudioGenerateRequest,
  type StudioGenerationGuidance,
  type StudioProvider,
  type StudioThemeNormalization,
  type StudioThemeNormalizationRisk,
} from "@/lib/studio/types";

const DEFAULT_OPENAI_TEXT_MODEL = "gpt-5.4-mini";
const DEFAULT_GEMINI_TEXT_MODEL = "gemini-3-flash-preview";
const DEFAULT_REWRITE_NOTE =
  "We turned this into an original inspired theme for best results.";

const STUDIO_THEME_NORMALIZATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    riskLevel: {
      type: "string",
      enum: ["safe", "rewrite", "block"],
    },
    normalizedTheme: {
      type: "string",
    },
    visualMotifs: {
      type: "array",
      items: { type: "string" },
    },
    paletteHints: {
      type: "array",
      items: { type: "string" },
    },
    notes: {
      type: "string",
    },
  },
  required: ["riskLevel", "normalizedTheme", "visualMotifs", "paletteHints", "notes"],
} as const;

type ThemeNormalizationInput = {
  provider: StudioProvider;
  event: StudioEventDetails;
  guidance?: StudioGenerationGuidance;
};

type ParsedThemeNormalization = {
  riskLevel: StudioThemeNormalizationRisk;
  normalizedTheme: string;
  visualMotifs: string[];
  paletteHints: string[];
  notes: string;
};

type ProviderThemeNormalizationResult =
  | { ok: true; value: ParsedThemeNormalization }
  | { ok: false };

type FallbackRewriteRule = {
  pattern: RegExp;
  normalizedTheme: string;
  visualMotifs: string[];
  paletteHints: string[];
};

const BRANDED_THEME_PATTERNS: RegExp[] = [
  /\bspider[- ]?man\b/i,
  /\bbatman\b/i,
  /\bjoker\b/i,
  /\belsa\b/i,
  /\banna\b/i,
  /\bfrozen\b/i,
  /\bbluey\b/i,
  /\bmario(?:\s+kart)?\b/i,
  /\bpok[eé]mon\b/i,
  /\bpikachu\b/i,
  /\bminions?\b/i,
  /\bbarbie\b/i,
  /\bmarvel\b/i,
  /\bavengers?\b/i,
  /\bdc\b/i,
  /\bdisney\b/i,
  /\bjurassic park\b/i,
  /\bsonic\b/i,
  /\bharry potter\b/i,
  /\bhogwarts\b/i,
  /\bpaw patrol\b/i,
  /\bhello kitty\b/i,
  /\bgotham\b/i,
];

const FUZZY_BRANDED_THEME_PATTERNS: RegExp[] = [
  /\bdog cartoon from australia\b/i,
  /\bice princess movie\b/i,
  /\bgreen guy from mario\b/i,
  /\bavenger style\b/i,
  /\bwizard school theme\b/i,
  /\bice queen sisters?\b/i,
];

const UNSAFE_BLOCK_PATTERNS: RegExp[] = [
  /\bsexual\b.*\bminor\b/i,
  /\bminor\b.*\bsexual\b/i,
  /\bchild\b.*\bexplicit\b/i,
  /\bcsam\b/i,
];

const FALLBACK_REWRITE_RULES: FallbackRewriteRule[] = [
  {
    pattern: /\bspider[- ]?man\b/i,
    normalizedTheme:
      "red-and-blue comic-action celebration theme with original web-inspired motion graphics and city-adventure energy",
    visualMotifs: ["web-like line patterns", "dynamic city silhouettes", "comic bursts"],
    paletteHints: ["red", "blue", "white"],
  },
  {
    pattern: /\bbatman\b|\bjoker\b/i,
    normalizedTheme:
      "dramatic city-night comic celebration theme with original masked-hero energy, skyline silhouettes, spotlight beams, and playful villain-vs-hero tension",
    visualMotifs: ["city skyline silhouettes", "spotlight beams", "comic action lines"],
    paletteHints: ["black", "yellow", "gray"],
  },
  {
    pattern: /\belsa\b|\banna\b|\bfrozen\b|\bice princess movie\b|\bice queen sisters?\b/i,
    normalizedTheme:
      "icy fairytale celebration theme with sparkling winter florals, snow-kissed textures, and sister-story magic in an original storybook direction",
    visualMotifs: ["snowflake filigree", "frosted florals", "crystalline swirls"],
    paletteHints: ["ice blue", "soft lavender", "silver", "white"],
  },
  {
    pattern: /\bbluey\b|\bdog cartoon from australia\b/i,
    normalizedTheme:
      "playful pastel family-pup celebration theme with backyard party charm, cheerful confetti shapes, and original cartoon-canine energy",
    visualMotifs: ["paw-print confetti", "backyard bunting", "rounded playful shapes"],
    paletteHints: ["sky blue", "peach", "cream", "orange"],
  },
  {
    pattern: /\bmario(?:\s+kart)?\b|\bgreen guy from mario\b/i,
    normalizedTheme:
      "colorful kart-racing celebration theme with original speedway graphics, checkered motion, and playful arcade-race energy",
    visualMotifs: ["checkered flags", "speed lines", "curving racetrack shapes"],
    paletteHints: ["red", "blue", "yellow", "green"],
  },
  {
    pattern: /\bpok[eé]mon\b|\bpikachu\b/i,
    normalizedTheme:
      "bright creature-adventure celebration theme with original collectible-monster energy, playful quest motifs, and outdoor discovery vibes",
    visualMotifs: ["adventure map shapes", "energy sparks", "badge-like icons"],
    paletteHints: ["yellow", "red", "blue", "white"],
  },
  {
    pattern: /\bmarvel\b|\bavengers?\b|\bavenger style\b|\bdc\b/i,
    normalizedTheme:
      "bold comic-team hero celebration theme with original action energy, dramatic skyline cues, and high-contrast adventure styling",
    visualMotifs: ["action bursts", "heroic skyline forms", "kinetic motion lines"],
    paletteHints: ["red", "blue", "gold", "charcoal"],
  },
  {
    pattern: /\bharry potter\b|\bhogwarts\b|\bwizard school theme\b/i,
    normalizedTheme:
      "storybook magic-academy celebration theme with original enchanted stationery details, candlelit halls, and whimsical school-of-wonders atmosphere",
    visualMotifs: ["star maps", "candlelit arches", "spellbook flourishes"],
    paletteHints: ["midnight blue", "burgundy", "gold", "cream"],
  },
  {
    pattern: /\bbarbie\b/i,
    normalizedTheme:
      "glamorous fashion-doll celebration theme with original boutique sparkle, editorial pink styling, and polished party energy",
    visualMotifs: ["editorial starbursts", "glossy ribbons", "runway curves"],
    paletteHints: ["pink", "white", "silver"],
  },
];

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter(Boolean)
    .slice(0, limit);
}

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
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

function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

function resolveOpenAiTextModel(): string {
  return process.env.STUDIO_OPENAI_TEXT_MODEL || DEFAULT_OPENAI_TEXT_MODEL;
}

function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
}

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || ""
  );
}

function resolveGeminiTextModel(): string {
  return (
    process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_TEXT_MODEL
  );
}

function resolveVertexProject(): string {
  return (
    process.env.STUDIO_GOOGLE_VERTEX_PROJECT ||
    process.env.GOOGLE_VERTEX_PROJECT ||
    process.env.NANA_GOOGLE_VERTEX_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ""
  );
}

function resolveVertexLocation(): string {
  return (
    process.env.STUDIO_GOOGLE_VERTEX_LOCATION ||
    process.env.GOOGLE_VERTEX_LOCATION ||
    process.env.NANA_GOOGLE_VERTEX_LOCATION ||
    process.env.GOOGLE_CLOUD_LOCATION ||
    ""
  );
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  const project = resolveVertexProject();
  const location = resolveVertexLocation();
  if (project && location) {
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  throw new Error(
    "Gemini is not configured. Set GEMINI_API_KEY/GOOGLE_API_KEY or Vertex project and location env vars.",
  );
}

function extractTextFromGeminiResponse(response: any): string {
  const direct = safeString(response?.text);
  if (direct) return direct;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => safeString(part?.text))
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function classifyStudioThemeRisk(theme: string): StudioThemeNormalizationRisk {
  const trimmed = safeString(theme);
  if (!trimmed) return "safe";
  if (UNSAFE_BLOCK_PATTERNS.some((pattern) => pattern.test(trimmed))) return "block";
  if (
    BRANDED_THEME_PATTERNS.some((pattern) => pattern.test(trimmed)) ||
    FUZZY_BRANDED_THEME_PATTERNS.some((pattern) => pattern.test(trimmed))
  ) {
    return "rewrite";
  }
  return "safe";
}

function containsBrandedCarryover(value: string): boolean {
  return [...BRANDED_THEME_PATTERNS, ...FUZZY_BRANDED_THEME_PATTERNS].some((pattern) =>
    pattern.test(value),
  );
}

function inferFallbackCategoryLabel(event: StudioEventDetails): string {
  return safeString(event.category || event.occasion || "celebration").toLowerCase();
}

function buildFallbackThemeRewrite(event: StudioEventDetails): StudioThemeNormalization {
  const originalTheme = safeString(event.userIdea);
  const matchedRule = FALLBACK_REWRITE_RULES.find((rule) => rule.pattern.test(originalTheme));
  const categoryLabel = inferFallbackCategoryLabel(event) || "celebration";

  if (matchedRule) {
    return {
      riskLevel: "rewrite",
      originalTheme: originalTheme || null,
      normalizedTheme: matchedRule.normalizedTheme,
      visualMotifs: matchedRule.visualMotifs,
      paletteHints: matchedRule.paletteHints,
      note: DEFAULT_REWRITE_NOTE,
    };
  }

  return {
    riskLevel: "rewrite",
    originalTheme: originalTheme || null,
    normalizedTheme: `original non-branded ${categoryLabel} theme with polished invitation styling, strong mood, and distinctive celebratory atmosphere`,
    visualMotifs: ["confetti motion", "graphic shapes", "invitation-ready decor cues"],
    paletteHints: [],
    note: DEFAULT_REWRITE_NOTE,
  };
}

function buildBlockedThemeResult(event: StudioEventDetails): StudioThemeNormalization {
  return {
    riskLevel: "block",
    originalTheme: safeString(event.userIdea) || null,
    normalizedTheme: null,
    visualMotifs: [],
    paletteHints: [],
    note: null,
  };
}

function buildSafeThemeResult(event: StudioEventDetails): StudioThemeNormalization {
  const originalTheme = safeString(event.userIdea);
  return {
    riskLevel: "safe",
    originalTheme: originalTheme || null,
    normalizedTheme: originalTheme || null,
    visualMotifs: [],
    paletteHints: [],
    note: null,
  };
}

function normalizeThemeNormalizationValue(
  value: unknown,
  event: StudioEventDetails,
): ParsedThemeNormalization | null {
  if (!value || typeof value !== "object") return null;

  const riskLevelRaw = safeString((value as any).riskLevel);
  if (riskLevelRaw !== "safe" && riskLevelRaw !== "rewrite" && riskLevelRaw !== "block") {
    return null;
  }

  const normalizedTheme = safeString((value as any).normalizedTheme);
  const visualMotifs = normalizeStringList((value as any).visualMotifs);
  const paletteHints = normalizeStringList((value as any).paletteHints);
  const notes = safeString((value as any).notes);

  if (riskLevelRaw === "block") {
    return {
      riskLevel: "block",
      normalizedTheme: "",
      visualMotifs: [],
      paletteHints: [],
      notes,
    };
  }

  return {
    riskLevel: riskLevelRaw,
    normalizedTheme: normalizedTheme || safeString(event.userIdea),
    visualMotifs,
    paletteHints,
    notes,
  };
}

export function buildStudioThemeNormalizationPrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): string {
  return [
    "You are a theme normalizer for party invitation image generation.",
    "Convert the user's requested theme into a safe, original visual direction for invitation generation.",
    "Preserve the vibe, colors, mood, setting, and celebratory intent.",
    "Remove copyrighted characters, franchise names, trademarked names, logos, team names, recognizable costumes, trademarked props, and branded place names.",
    "Replace them with generic visual descriptions and original art direction.",
    "Keep the result polished, invitation-appropriate, kid-friendly when relevant, and specific enough for premium visual generation.",
    "Return strict JSON only.",
    "{",
    '  "riskLevel": "safe|rewrite|block",',
    '  "normalizedTheme": string,',
    '  "visualMotifs": string[],',
    '  "paletteHints": string[],',
    '  "notes": string',
    "}",
    "Block only for clearly unsafe or disallowed content. Do not block only because a request mentions branding or copyrighted characters; rewrite those.",
    "",
    `Selected event type: ${safeString(event.category || event.occasion) || "Not provided"}`,
    `Invitation title: ${safeString(event.title) || "Not provided"}`,
    `Raw user theme: ${safeString(event.userIdea) || "Not provided"}`,
    `Event details: ${safeString(event.description) || "Not provided"}`,
    `User visual preferences: ${safeString(guidance?.visualPreferences) || "Not provided"}`,
    `Requested color palette: ${safeString(guidance?.colorPalette) || "Not provided"}`,
  ].join("\n");
}

async function normalizeThemeWithOpenAi(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): Promise<ProviderThemeNormalizationResult> {
  try {
    const client = getOpenAiClient();
    const completion = await client.chat.completions.create({
      model: resolveOpenAiTextModel(),
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "studio_theme_normalization",
          strict: true,
          schema: STUDIO_THEME_NORMALIZATION_JSON_SCHEMA,
        },
      } as any,
      messages: [
        {
          role: "system",
          content:
            "You normalize branded or risky invitation themes into original non-branded art direction. Return only strict JSON.",
        },
        {
          role: "user",
          content: buildStudioThemeNormalizationPrompt(event, guidance),
        },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = normalizeThemeNormalizationValue(extractJsonObject(raw), event);
    return parsed ? { ok: true, value: parsed } : { ok: false };
  } catch {
    return { ok: false };
  }
}

async function normalizeThemeWithGemini(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): Promise<ProviderThemeNormalizationResult> {
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: resolveGeminiTextModel(),
      contents: [{ role: "user", parts: [{ text: buildStudioThemeNormalizationPrompt(event, guidance) }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: STUDIO_THEME_NORMALIZATION_JSON_SCHEMA as any,
        temperature: 0.4,
        topP: 0.9,
        candidateCount: 1,
      },
    });
    const parsed = normalizeThemeNormalizationValue(
      extractJsonObject(extractTextFromGeminiResponse(response)),
      event,
    );
    return parsed ? { ok: true, value: parsed } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function toStudioThemeNormalization(
  parsed: ParsedThemeNormalization,
  event: StudioEventDetails,
): StudioThemeNormalization {
  return {
    riskLevel: parsed.riskLevel,
    originalTheme: safeString(event.userIdea) || null,
    normalizedTheme:
      parsed.riskLevel === "block" ? null : safeString(parsed.normalizedTheme) || null,
    visualMotifs: parsed.visualMotifs,
    paletteHints: parsed.paletteHints,
    note: parsed.riskLevel === "rewrite" ? safeString(parsed.notes) || DEFAULT_REWRITE_NOTE : null,
  };
}

export async function normalizeStudioTheme(
  input: ThemeNormalizationInput,
): Promise<StudioThemeNormalization> {
  const theme = safeString(input.event.userIdea);
  const riskSeed = [theme, safeString(input.guidance?.visualPreferences)].filter(Boolean).join(" ");
  if (!theme) return buildSafeThemeResult(input.event);

  const localRisk = classifyStudioThemeRisk(riskSeed);
  if (localRisk === "safe") {
    return buildSafeThemeResult(input.event);
  }
  if (localRisk === "block") {
    return buildBlockedThemeResult(input.event);
  }

  const providerResult =
    input.provider === "openai"
      ? await normalizeThemeWithOpenAi(input.event, input.guidance)
      : await normalizeThemeWithGemini(input.event, input.guidance);

  if (!providerResult.ok) {
    return buildFallbackThemeRewrite(input.event);
  }

  const normalized = toStudioThemeNormalization(providerResult.value, input.event);

  if (normalized.riskLevel === "block") {
    return normalized;
  }

  if (!safeString(normalized.normalizedTheme) || containsBrandedCarryover(normalized.normalizedTheme || "")) {
    return buildFallbackThemeRewrite(input.event);
  }

  if (localRisk === "rewrite" && normalized.riskLevel === "safe") {
    return buildFallbackThemeRewrite(input.event);
  }

  return normalized;
}

export function applyStudioThemeNormalization(
  request: StudioGenerateRequest,
  themeNormalization: StudioThemeNormalization,
): StudioGenerateRequest {
  const normalizedTheme =
    safeString(themeNormalization.normalizedTheme) || safeString(request.event.userIdea);
  const existingStyle = safeString(request.guidance?.style);
  const visualPreferencesRaw = safeString(request.guidance?.visualPreferences);
  const visualPreferences =
    themeNormalization.riskLevel === "rewrite" && containsBrandedCarryover(visualPreferencesRaw)
      ? ""
      : visualPreferencesRaw;
  const motifs = themeNormalization.visualMotifs.join(", ");
  const paletteHints = themeNormalization.paletteHints.join(", ");

  const style = [
    normalizedTheme
      ? `Highest-priority visual direction from the user: ${normalizedTheme}.`
      : "",
    normalizedTheme
      ? "Treat the Design Idea as the theme of the invitation, while still expressing the selected category clearly."
      : "",
    motifs
      ? `Use original non-branded motifs such as ${motifs}.`
      : "",
    themeNormalization.riskLevel === "rewrite"
      ? "Preserve the mood, setting, palette, and celebratory energy while removing franchise names, logos, trademarked props, recognizable costumes, and branded character carryovers."
      : "",
    visualPreferences
      ? `Additional visual preferences from the user: ${visualPreferences}.`
      : "",
    existingStyle,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...request,
    event: {
      ...request.event,
      userIdea: normalizedTheme || request.event.userIdea,
    },
    guidance: {
      ...request.guidance,
      style: style || null,
      colorPalette: safeString(request.guidance?.colorPalette) || paletteHints || null,
    },
  };
}
