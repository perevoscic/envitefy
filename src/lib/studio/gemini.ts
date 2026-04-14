import { GoogleGenAI } from "@google/genai";
import { absoluteUrl } from "@/lib/absolute-url";
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
  | {
      ok: true;
      invitation: StudioInvitationText;
      liveCard: StudioLiveCardMetadata;
      warnings: string[];
    }
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
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || ""
  );
}

function resolveTextModel(): string {
  return (
    process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-3-flash-preview"
  );
}

/** Default: Gemini 3.1 Flash Image — branded "Nano Banana 2" (not 2.5 "Nano Banana"). */
function resolveImageModel(): string {
  return (
    process.env.STUDIO_GEMINI_IMAGE_MODEL ||
    process.env.STUDIO_GEMINI_NANO_BANANA_2_MODEL ||
    "gemini-3.1-flash-image-preview"
  );
}

function resolveImageEditModel(): string {
  return (
    process.env.STUDIO_GEMINI_IMAGE_EDIT_MODEL ||
    process.env.STUDIO_GEMINI_IMAGE_MODEL ||
    process.env.STUDIO_GEMINI_NANO_BANANA_2_MODEL ||
    "gemini-3.1-flash-image-preview"
  );
}

/** Higher default for print-like invites; set STUDIO_GEMINI_INVITE_IMAGE_SIZE=1K if your quota rejects 2K. */
function resolveInviteImageConfig(): { aspectRatio: "9:16"; imageSize: "1K" | "2K" } {
  const raw = (process.env.STUDIO_GEMINI_INVITE_IMAGE_SIZE || "2K").trim().toUpperCase();
  const imageSize = raw === "1K" ? "1K" : "2K";
  return { aspectRatio: "9:16", imageSize };
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
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const mimeType = safeString(part?.inlineData?.mimeType) || "image/png";
      const data = safeString(part?.inlineData?.data);
      if (!data) continue;
      return `data:${mimeType};base64,${data}`;
    }
  }
  return null;
}

async function resolveInlineImageSource(
  value: string,
): Promise<{ mimeType: string; data: string } | null> {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2].replace(/\s+/g, ""),
    };
  }

  const resolvedUrl = trimmed.startsWith("/") ? await absoluteUrl(trimmed) : trimmed;
  if (!/^https?:\/\//i.test(resolvedUrl)) return null;

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) return null;
    const mimeTypeHeader = safeString(response.headers.get("content-type"));
    const mimeType = mimeTypeHeader.split(";")[0]?.trim() || "image/png";
    if (!mimeType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      mimeType,
      data: bytes.toString("base64"),
    };
  } catch {
    return null;
  }
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
      error: buildError(
        message.includes("not configured") ? "missing_api_key" : "provider_error",
        message,
        { retryable: !message.includes("not configured") },
      ),
      warnings: [],
    };
  }
}

async function postGeminiImage(
  model: string,
  prompt: string,
  sourceImageDataUrl?: string,
  referenceImages?: Array<{ mimeType: string; data: string }>,
): Promise<
  | { ok: true; response: any; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  const sourceImage = sourceImageDataUrl
    ? await resolveInlineImageSource(sourceImageDataUrl)
    : null;
  if (sourceImageDataUrl && !sourceImage) {
    return {
      ok: false,
      error: buildError(
        "invalid_source_image",
        "The current image could not be prepared for editing.",
        { retryable: false },
      ),
      warnings: [],
    };
  }

  const refParts =
    referenceImages?.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    })) ?? [];

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];
  if (sourceImage) {
    parts.push({
      inlineData: {
        mimeType: sourceImage.mimeType,
        data: sourceImage.data,
      },
    });
  }
  parts.push(...refParts);
  parts.push({ text: prompt });

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: sourceImage
        ? {
            responseModalities: ["IMAGE"],
          }
        : {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: resolveInviteImageConfig(),
          },
    });
    return { ok: true, response, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return {
      ok: false,
      error: buildError(
        message.includes("not configured") ? "missing_api_key" : "provider_error",
        message,
        { retryable: !message.includes("not configured") },
      ),
      warnings: [],
    };
  }
}

export async function generateStudioLiveCardWithGemini(
  prompt: string,
): Promise<GeminiLiveCardResult> {
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
  referenceImages?: Array<{ mimeType: string; data: string }>,
): Promise<GeminiImageResult> {
  const result = await postGeminiImage(resolveImageModel(), prompt, undefined, referenceImages);
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

export async function editInvitationImageWithGemini(
  prompt: string,
  sourceImageDataUrl: string,
  referenceImages?: Array<{ mimeType: string; data: string }>,
): Promise<GeminiImageResult> {
  const result = await postGeminiImage(
    resolveImageEditModel(),
    prompt,
    sourceImageDataUrl,
    referenceImages,
  );
  if (!result.ok) return result;

  const imageDataUrl = extractImageDataUrlFromGeminiResponse(result.response);
  if (!imageDataUrl) {
    return {
      ok: false,
      error: buildError(
        "image_not_returned",
        "Gemini did not return an edited image payload for this request.",
      ),
      warnings: [],
    };
  }

  return { ok: true, imageDataUrl, warnings: result.warnings };
}
