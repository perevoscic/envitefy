import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { absoluteUrl } from "@/lib/absolute-url";
import { STUDIO_LIVE_CARD_RESPONSE_SCHEMA } from "@/lib/studio/live-card-schema";
import {
  normalizeLiveCardMetadata,
  type StudioGenerationError,
  type StudioInvitationText,
  type StudioLiveCardMetadata,
} from "@/lib/studio/types";

type OpenAiLiveCardResult =
  | { ok: true; liveCard: StudioLiveCardMetadata; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type OpenAiTextResult =
  | {
      ok: true;
      invitation: StudioInvitationText;
      liveCard: StudioLiveCardMetadata;
      warnings: string[];
    }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type OpenAiImageResult =
  | { ok: true; imageDataUrl: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] };

type InlineStudioImage = {
  mimeType: string;
  data: string;
};

const OPENAI_LIVE_CARD_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "studio_live_card",
    strict: true,
    schema: STUDIO_LIVE_CARD_RESPONSE_SCHEMA,
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
    provider: "openai",
    status: options?.status,
  };
}

function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

function resolveTextModel(): string {
  return process.env.STUDIO_OPENAI_TEXT_MODEL || "gpt-5.4-mini";
}

function resolveImageModel(): string {
  return process.env.STUDIO_OPENAI_IMAGE_MODEL || "gpt-image-1.5";
}

function resolveImageEditModel(): string {
  return process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL || resolveImageModel();
}

function resolveImageSize(): "1024x1024" | "1536x1024" | "1024x1536" | "auto" {
  const raw = safeString(process.env.STUDIO_OPENAI_IMAGE_SIZE).toLowerCase();
  if (raw === "1024x1024" || raw === "1536x1024" || raw === "auto") return raw;
  return "1024x1536";
}

function resolveImageQuality(): "low" | "medium" | "high" | "auto" {
  const raw = safeString(process.env.STUDIO_OPENAI_IMAGE_QUALITY).toLowerCase();
  if (raw === "low" || raw === "high" || raw === "auto") return raw;
  return "medium";
}

function resolveImageBackground(): "transparent" | "opaque" | "auto" {
  const raw = safeString(process.env.STUDIO_OPENAI_IMAGE_BACKGROUND).toLowerCase();
  if (raw === "transparent" || raw === "auto") return raw;
  return "opaque";
}

function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
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

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

async function resolveInlineImageSource(value: string): Promise<InlineStudioImage | null> {
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

async function toUploadableImage(
  image: InlineStudioImage,
  prefix: string,
  index: number,
) {
  const ext = extensionForMimeType(image.mimeType);
  return toFile(Buffer.from(image.data, "base64"), `${prefix}-${index + 1}.${ext}`, {
    type: image.mimeType,
  });
}

async function postStructuredOpenAiContent(
  model: string,
  prompt: string,
): Promise<
  | { ok: true; raw: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  try {
    const client = getOpenAiClient();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      response_format: OPENAI_LIVE_CARD_RESPONSE_FORMAT as any,
      messages: [
        {
          role: "system",
          content:
            "You are a premium invitation designer and invitation copywriter for Envitefy. Return only strict JSON matching the requested schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    return { ok: true, raw, warnings: [] };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "OpenAI request failed";
    return {
      ok: false,
      error: buildError(
        message.includes("not configured") ? "missing_api_key" : "provider_error",
        message,
        {
          retryable: !message.includes("not configured"),
          status: typeof error?.status === "number" ? error.status : undefined,
        },
      ),
      warnings: [],
    };
  }
}

async function postOpenAiImageGeneration(
  model: string,
  prompt: string,
  referenceImages?: InlineStudioImage[],
): Promise<
  | { ok: true; imageDataUrl: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  const warnings =
    referenceImages && referenceImages.length > 5
      ? ["OpenAI preserves the first 5 reference images with higher fidelity."]
      : [];

  if (referenceImages?.length) {
    try {
      const client = getOpenAiClient();
      const uploadables = await Promise.all(
        referenceImages.map((image, index) =>
          toUploadableImage(image, "studio-openai-reference", index),
        ),
      );
      const response = await client.images.edit({
        model,
        image: uploadables,
        prompt,
        size: resolveImageSize(),
        quality: resolveImageQuality(),
        background: resolveImageBackground(),
        n: 1,
      });
      const imageData = response.data?.[0]?.b64_json || "";
      if (!imageData) {
        return {
          ok: false,
          error: buildError(
            "image_not_returned",
            "OpenAI did not return an image payload for this request.",
          ),
          warnings,
        };
      }
      return {
        ok: true,
        imageDataUrl: `data:image/png;base64,${imageData}`,
        warnings,
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "OpenAI request failed";
      return {
        ok: false,
        error: buildError(
          message.includes("not configured") ? "missing_api_key" : "provider_error",
          message,
          {
            retryable: !message.includes("not configured"),
            status: typeof error?.status === "number" ? error.status : undefined,
          },
        ),
        warnings,
      };
    }
  }

  try {
    const client = getOpenAiClient();
    const response = await client.images.generate({
      model,
      prompt,
      size: resolveImageSize(),
      quality: resolveImageQuality(),
      background: resolveImageBackground(),
      output_format: "png",
      moderation: "auto",
      n: 1,
    });
    const imageData = response.data?.[0]?.b64_json || "";
    if (!imageData) {
      return {
        ok: false,
        error: buildError(
          "image_not_returned",
          "OpenAI did not return an image payload for this request.",
        ),
        warnings: [],
      };
    }
    return {
      ok: true,
      imageDataUrl: `data:image/png;base64,${imageData}`,
      warnings,
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "OpenAI request failed";
    return {
      ok: false,
      error: buildError(
        message.includes("not configured") ? "missing_api_key" : "provider_error",
        message,
        {
          retryable: !message.includes("not configured"),
          status: typeof error?.status === "number" ? error.status : undefined,
        },
      ),
      warnings,
    };
  }
}

async function postOpenAiImageEdit(
  model: string,
  prompt: string,
  sourceImageDataUrl: string,
  referenceImages?: InlineStudioImage[],
): Promise<
  | { ok: true; imageDataUrl: string; warnings: string[] }
  | { ok: false; error: StudioGenerationError; warnings: string[] }
> {
  const sourceImage = await resolveInlineImageSource(sourceImageDataUrl);
  if (!sourceImage) {
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

  const uploadables = [
    await toUploadableImage(sourceImage, "studio-openai-edit-source", 0),
    ...(
      await Promise.all(
        (referenceImages || []).map((image, index) =>
          toUploadableImage(image, "studio-openai-edit-reference", index),
        ),
      )
    ),
  ];

  const warnings =
    referenceImages && referenceImages.length > 5
      ? ["OpenAI preserves the first 5 reference images with higher fidelity."]
      : [];

  try {
    const client = getOpenAiClient();
    const response = await client.images.edit({
      model,
      image: uploadables,
      prompt,
      size: resolveImageSize(),
      quality: resolveImageQuality(),
      background: resolveImageBackground(),
      n: 1,
    });
    const imageData = response.data?.[0]?.b64_json || "";
    if (!imageData) {
      return {
        ok: false,
        error: buildError(
          "image_not_returned",
          "OpenAI did not return an edited image payload for this request.",
        ),
        warnings,
      };
    }
    return {
      ok: true,
      imageDataUrl: `data:image/png;base64,${imageData}`,
      warnings,
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "OpenAI request failed";
    return {
      ok: false,
      error: buildError(
        message.includes("not configured") ? "missing_api_key" : "provider_error",
        message,
        {
          retryable: !message.includes("not configured"),
          status: typeof error?.status === "number" ? error.status : undefined,
        },
      ),
      warnings,
    };
  }
}

export async function generateStudioLiveCardWithOpenAi(
  prompt: string,
): Promise<OpenAiLiveCardResult> {
  const result = await postStructuredOpenAiContent(resolveTextModel(), prompt);
  if (!result.ok) return result;

  const parsed = extractJsonObject(result.raw);
  const liveCard = normalizeLiveCardMetadata(parsed);
  if (!liveCard) {
    return {
      ok: false,
      error: buildError(
        "invalid_live_card_payload",
        "OpenAI returned live-card metadata in an unexpected format.",
      ),
      warnings: result.warnings,
    };
  }

  return { ok: true, liveCard, warnings: result.warnings };
}

export async function generateInvitationTextWithOpenAi(prompt: string): Promise<OpenAiTextResult> {
  const result = await generateStudioLiveCardWithOpenAi(prompt);
  if (!result.ok) return result;

  return {
    ok: true,
    invitation: result.liveCard.invitation,
    liveCard: result.liveCard,
    warnings: result.warnings,
  };
}

export async function generateInvitationImageWithOpenAi(
  prompt: string,
  referenceImages?: InlineStudioImage[],
): Promise<OpenAiImageResult> {
  return postOpenAiImageGeneration(resolveImageModel(), prompt, referenceImages);
}

export async function editInvitationImageWithOpenAi(
  prompt: string,
  sourceImageDataUrl: string,
  referenceImages?: InlineStudioImage[],
): Promise<OpenAiImageResult> {
  return postOpenAiImageEdit(
    resolveImageEditModel(),
    prompt,
    sourceImageDataUrl,
    referenceImages,
  );
}
