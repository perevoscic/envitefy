import { GoogleGenAI } from "@google/genai";
import {
  normalizeLiveCardMetadata,
  type StudioGenerationError,
  type StudioInvitationText,
  type StudioLiveCardMetadata,
} from "@/lib/studio/types";

type GeminiLiveCardResult =
  | { ok: true; liveCard: StudioLiveCardMetadata; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type GeminiTextResult =
  | { ok: true; invitation: StudioInvitationText; liveCard: StudioLiveCardMetadata; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type GeminiImageResult =
  | { ok: true; imageDataUrl: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

const LIVE_CARD_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "palette", "themeStyle", "interactiveMetadata", "invitation"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    palette: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary", "accent"],
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
      },
    },
    themeStyle: { type: "string" },
    interactiveMetadata: {
      type: "object",
      additionalProperties: false,
      required: ["rsvpMessage", "funFacts", "ctaLabel", "shareNote"],
      properties: {
        rsvpMessage: { type: "string" },
        funFacts: {
          type: "array",
          items: { type: "string" },
        },
        ctaLabel: { type: "string" },
        shareNote: { type: "string" },
      },
    },
    invitation: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "subtitle",
        "openingLine",
        "scheduleLine",
        "locationLine",
        "detailsLine",
        "callToAction",
        "socialCaption",
        "hashtags",
      ],
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        openingLine: { type: "string" },
        scheduleLine: { type: "string" },
        locationLine: { type: "string" },
        detailsLine: { type: "string" },
        callToAction: { type: "string" },
        socialCaption: { type: "string" },
        hashtags: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildError(
  code: string,
  message: string,
  options?: { status?: number; retryable?: boolean },
): StudioGenerationError {
  return {
    code,
    message,
    retryable: options?.retryable ?? true,
    provider: "gemini",
    status: options?.status,
  };
}

function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
}

function resolveTextModel(): string {
  return process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-3-flash-preview";
}

function resolveImageModel(): string {
  return process.env.STUDIO_GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

function extractTextFromGeminiResponse(response: any): string {
  const direct = safeString(response?.text);
  if (direct) return direct;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => safeString(part?.text))
    .filter((text) => text.length > 0)
    .join("\n")
    .trim();
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
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  return null;
}

function extractImageDataUrlFromGeminiResponse(response: any): string | null {
  const candidates = Array.isArray(response?.generatedImages) ? response.generatedImages : [];
  for (const candidate of candidates) {
    const image = candidate?.image;
    const mimeType = safeString(image?.mimeType) || "image/png";
    const data = safeString(image?.imageBytes);
    if (!data) continue;
    return `data:${mimeType};base64,${data}`;
  }
  return null;
}

async function postStructuredGeminiContent(
  model: string,
  prompt: string,
): Promise<
  | { ok: true; response: any; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: LIVE_CARD_RESPONSE_SCHEMA,
        temperature: 0.6,
        topP: 0.9,
        candidateCount: 1,
      },
    });
    return { ok: true, response, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return {
      ok: false,
      error: buildError("provider_error", message, { retryable: true }),
      warnings: [],
    };
  }
}

async function postGeminiImage(
  model: string,
  prompt: string,
): Promise<
  | { ok: true; response: any; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  try {
    const client = getGeminiClient();
    const response = await client.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        imageSize: "1K",
        aspectRatio: "9:16",
        enhancePrompt: true,
      },
    });
    return { ok: true, response, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return {
      ok: false,
      error: buildError("provider_error", message, { retryable: true }),
      warnings: [],
    };
  }
}

export async function generateStudioLiveCardWithGemini(prompt: string): Promise<GeminiLiveCardResult> {
  const result = await postStructuredGeminiContent(resolveTextModel(), prompt);
  if (!result.ok) return result;

  const rawText = extractTextFromGeminiResponse(result.response);
  const parsed = extractJsonObject(rawText);
  const liveCard = normalizeLiveCardMetadata(parsed);
  if (!liveCard) {
    return {
      ok: false,
      error: buildError(
        "invalid_live_card_payload",
        "Gemini returned live-card metadata in an unexpected format.",
      ),
      warnings: [],
    };
  }

  return { ok: true, liveCard, warnings: result.warnings };
}

export async function generateInvitationTextWithGemini(prompt: string): Promise<GeminiTextResult> {
  const result = await generateStudioLiveCardWithGemini(prompt);
  if (!result.ok) return result;

  return {
    ok: true,
    invitation: result.liveCard.invitation,
    liveCard: result.liveCard,
    warnings: result.warnings,
  };
}

export async function generateInvitationImageWithGemini(
  prompt: string,
): Promise<GeminiImageResult> {
  const result = await postGeminiImage(resolveImageModel(), prompt);
  if (!result.ok) return result;

  const imageDataUrl = extractImageDataUrlFromGeminiResponse(result.response);
  if (!imageDataUrl) {
    return {
      ok: false,
      error: buildError(
        "image_not_returned",
        "Gemini did not return an image payload for this request.",
      ),
      warnings: [],
    };
  }

  return { ok: true, imageDataUrl, warnings: result.warnings };
}
