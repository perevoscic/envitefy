import {
  normalizeInvitationText,
  type StudioGenerationError,
  type StudioInvitationText,
} from "@/lib/studio/types";

type GeminiTextResult =
  | { ok: true; invitation: StudioInvitationText; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type GeminiImageResult =
  | { ok: true; imageDataUrl: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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
  return process.env.STUDIO_GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function resolveImageModel(): string {
  return process.env.STUDIO_GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
}

function buildEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function extractTextFromGeminiResponse(json: any): string {
  const parts = json?.candidates?.[0]?.content?.parts;
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

function extractImageDataUrlFromGeminiResponse(json: any): string | null {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const mimeType = safeString(part?.inlineData?.mimeType);
      const data = safeString(part?.inlineData?.data);
      if (!mimeType.startsWith("image/") || !data) continue;
      return `data:${mimeType};base64,${data}`;
    }
  }
  return null;
}

async function postGemini(
  model: string,
  payload: Record<string, unknown>,
): Promise<
  | { ok: true; json: any; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: buildError("missing_api_key", "Gemini API key is not configured.", {
        retryable: false,
      }),
      warnings: [],
    };
  }

  const endpoint = buildEndpoint(model, apiKey);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: safeJsonStringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return {
      ok: false,
      error: buildError("network_error", `Gemini request failed: ${message}`),
      warnings: [],
    };
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: buildError(
        "invalid_provider_response",
        `Gemini returned a non-JSON response (${response.status}).`,
        { status: response.status },
      ),
      warnings: [],
    };
  }

  if (!response.ok) {
    const providerMessage =
      safeString(json?.error?.message) || `Gemini request failed (${response.status}).`;
    return {
      ok: false,
      error: buildError("provider_error", providerMessage, {
        status: response.status,
        retryable: response.status >= 500 || response.status === 429,
      }),
      warnings: [],
    };
  }

  return { ok: true, json, warnings: [] };
}

export async function generateInvitationTextWithGemini(prompt: string): Promise<GeminiTextResult> {
  const result = await postGemini(resolveTextModel(), {
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  if (!result.ok) return result;

  const rawText = extractTextFromGeminiResponse(result.json);
  const parsed = extractJsonObject(rawText);
  const invitation = normalizeInvitationText(parsed);
  if (!invitation) {
    return {
      ok: false,
      error: buildError(
        "invalid_text_payload",
        "Gemini returned invitation text in an unexpected format.",
      ),
      warnings: [],
    };
  }

  return { ok: true, invitation, warnings: result.warnings };
}

export async function generateInvitationImageWithGemini(
  prompt: string,
): Promise<GeminiImageResult> {
  const result = await postGemini(resolveImageModel(), {
    generationConfig: {
      temperature: 0.9,
      responseModalities: ["TEXT", "IMAGE"],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  if (!result.ok) return result;

  const imageDataUrl = extractImageDataUrlFromGeminiResponse(result.json);
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
