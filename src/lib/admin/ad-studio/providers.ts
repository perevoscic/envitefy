import fs from "node:fs/promises";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import type { AdStudioProviderStatus, AdStudioRenderableFormat } from "@/lib/admin/ad-studio/types";

type JsonObject = Record<string, unknown>;

export type TextAgentResult<T> = {
  output: T;
  provider: string;
  model: string;
  warnings: string[];
};

export type GeneratedImagePayload = {
  bytes: Buffer;
  mimeType: string;
  provider: string;
  model: string;
  warnings: string[];
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function extractJsonObject(text: string): unknown | null {
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

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }

  return null;
}

function getOpenAiApiKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

export function resolveAdStudioTextProvider(): string {
  return (
    safeString(process.env.ADMIN_AD_STUDIO_TEXT_PROVIDER || process.env.STUDIO_PROVIDER) || "openai"
  );
}

export function resolveAdStudioTextModel(): string {
  return (
    safeString(process.env.ADMIN_AD_STUDIO_OPENAI_TEXT_MODEL) ||
    safeString(process.env.STUDIO_OPENAI_TEXT_MODEL) ||
    "gpt-5.5"
  );
}

export function resolveAdStudioImageProvider(): string {
  return (
    safeString(process.env.ADMIN_AD_STUDIO_IMAGE_PROVIDER || process.env.STUDIO_PROVIDER) ||
    "openai"
  );
}

export function resolveAdStudioImageModel(): string {
  return (
    safeString(process.env.ADMIN_AD_STUDIO_OPENAI_IMAGE_MODEL) ||
    safeString(process.env.ADMIN_AD_STUDIO_IMAGE_MODEL) ||
    safeString(process.env.STUDIO_OPENAI_IMAGE_MODEL) ||
    "gpt-image-2"
  );
}

export function resolveAdStudioVideoProvider(): string {
  return safeString(process.env.ADMIN_AD_STUDIO_VIDEO_PROVIDER) || "veo";
}

export function resolveAdStudioVideoModel(): string {
  return (
    safeString(process.env.ADMIN_AD_STUDIO_VEO_MODEL) ||
    safeString(process.env.VEO_MODEL) ||
    "veo-3.1-generate-preview"
  );
}

function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");
  return new OpenAI({ apiKey });
}

function imageSizeForFormat(
  format: AdStudioRenderableFormat,
): "1024x1024" | "1536x1024" | "1024x1536" | "auto" {
  if (format === "horizontal") return "1536x1024";
  if (format === "square") return "1024x1024";
  return "1024x1536";
}

function imageExtensionForMime(mimeType: string): ".jpg" | ".png" | ".webp" {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

export function extensionForMimeType(mimeType: string): ".jpg" | ".png" | ".webp" {
  return imageExtensionForMime(mimeType);
}

export function getAdminAdStudioProviderStatuses(): AdStudioProviderStatus[] {
  const textProvider = resolveAdStudioTextProvider();
  const imageProvider = resolveAdStudioImageProvider();
  const videoProvider = resolveAdStudioVideoProvider();
  const openAiConfigured = Boolean(getOpenAiApiKey());
  return [
    {
      id: "openaiText",
      label: "Text agents",
      configured: textProvider !== "openai" || openAiConfigured,
      provider: textProvider,
      model: resolveAdStudioTextModel(),
      envVars: [
        "ADMIN_AD_STUDIO_TEXT_PROVIDER",
        "ADMIN_AD_STUDIO_OPENAI_TEXT_MODEL",
        "OPENAI_API_KEY",
      ],
    },
    {
      id: "openaiImage",
      label: "Base image generation",
      configured: imageProvider !== "openai" || openAiConfigured,
      provider: imageProvider,
      model: resolveAdStudioImageModel(),
      envVars: [
        "ADMIN_AD_STUDIO_IMAGE_PROVIDER",
        "ADMIN_AD_STUDIO_OPENAI_IMAGE_MODEL",
        "ADMIN_AD_STUDIO_IMAGE_MODEL",
        "OPENAI_API_KEY",
      ],
    },
    {
      id: "videoProvider",
      label: "Video prompt package",
      configured: true,
      provider: videoProvider,
      model: resolveAdStudioVideoModel(),
      envVars: ["ADMIN_AD_STUDIO_VIDEO_PROVIDER", "ADMIN_AD_STUDIO_VEO_MODEL"],
    },
  ];
}

export async function runJsonTextAgent<T>({
  agentName,
  prompt,
  schema,
  fallback,
  normalize,
}: {
  agentName: string;
  prompt: string;
  schema: JsonObject;
  fallback: T;
  normalize: (value: unknown) => T | null;
}): Promise<TextAgentResult<T>> {
  const provider = resolveAdStudioTextProvider();
  const model = resolveAdStudioTextModel();
  if (provider !== "openai") {
    return {
      output: fallback,
      provider,
      model,
      warnings: [`${agentName} used deterministic fallback because ${provider} is not wired yet.`],
    };
  }

  try {
    const client = getOpenAiClient();
    const completion = await client.chat.completions.create({
      model,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: agentName.replace(/[^a-z0-9_]+/gi, "_").toLowerCase(),
          strict: true,
          schema,
        },
      } as any,
      messages: [
        {
          role: "system",
          content:
            "You are an expert Envitefy ad production agent. Return strict JSON only. Never ask the image model to render readable flyer text or exact product UI; deterministic renderers handle those assets.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "";
    const normalized = normalize(extractJsonObject(raw));
    if (normalized) return { output: normalized, provider, model, warnings: [] };
    return {
      output: fallback,
      provider,
      model,
      warnings: [`${agentName} returned invalid JSON, so deterministic fallback was used.`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed.";
    return {
      output: fallback,
      provider,
      model,
      warnings: [`${agentName} fallback: ${message}`],
    };
  }
}

async function fileToOpenAiUpload(pathname: string, index: number) {
  const bytes = await fs.readFile(pathname);
  return toFile(bytes, `ad-studio-reference-${index + 1}.png`, { type: "image/png" });
}

export async function generateBaseImageWithProvider({
  prompt,
  format,
  referenceFiles,
}: {
  prompt: string;
  format: AdStudioRenderableFormat;
  referenceFiles: string[];
}): Promise<GeneratedImagePayload | null> {
  const provider = resolveAdStudioImageProvider();
  const model = resolveAdStudioImageModel();
  if (provider !== "openai") return null;

  const client = getOpenAiClient();
  const size = imageSizeForFormat(format);
  const warnings =
    referenceFiles.length > 1
      ? ["Only cropped identity references should be passed to image generation."]
      : [];

  if (referenceFiles.length) {
    const uploadables = await Promise.all(referenceFiles.map(fileToOpenAiUpload));
    const response = await client.images.edit({
      model,
      image: uploadables,
      prompt,
      size,
      quality: "medium",
      background: "opaque",
      n: 1,
    });
    const imageData = response.data?.[0]?.b64_json || "";
    if (!imageData) return null;
    return {
      bytes: Buffer.from(imageData, "base64"),
      mimeType: "image/png",
      provider,
      model,
      warnings,
    };
  }

  const response = await client.images.generate({
    model,
    prompt,
    size,
    quality: "medium",
    background: "opaque",
    output_format: "png",
    moderation: "auto",
    n: 1,
  });
  const imageData = response.data?.[0]?.b64_json || "";
  if (!imageData) return null;
  return {
    bytes: Buffer.from(imageData, "base64"),
    mimeType: "image/png",
    provider,
    model,
    warnings,
  };
}
