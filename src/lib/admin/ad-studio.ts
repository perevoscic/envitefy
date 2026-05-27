import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import {
  type AdminAdStudioBeat,
  type AdminAdStudioConfig,
  type AdminAdStudioFrameAsset,
  type AdminAdStudioGenerateRequest,
  type AdminAdStudioImagesRequest,
  type AdminAdStudioProviderStatus,
  type AdminAdStudioVideoAsset,
  type AdminAdStudioVideoProvider,
  type AdminAdStudioVideoRequest,
  DEFAULT_ADMIN_AD_STUDIO_CONFIG,
  isAdminAdStudioAccent,
  isAdminAdStudioCaptionStyle,
  isAdminAdStudioFormat,
  isAdminAdStudioVideoProvider,
} from "@/lib/admin/ad-studio-types";

type ParseSuccess = { ok: true; value: AdminAdStudioGenerateRequest };
type ParseFailure = { ok: false; error: string };
type ImagesParseSuccess = { ok: true; value: AdminAdStudioImagesRequest };
type ImagesParseFailure = { ok: false; error: string };
type VideoParseSuccess = { ok: true; value: AdminAdStudioVideoRequest };
type VideoParseFailure = { ok: false; error: string };
type AdminAdStudioRunStage = {
  status: "pending" | "running" | "done" | "error";
  updatedAt: string;
  error: string | null;
};
type AdminAdStudioRun = {
  version: 1;
  runId: string;
  createdAt: string;
  updatedAt: string;
  request: AdminAdStudioGenerateRequest | null;
  ad: AdminAdStudioConfig;
  frames: AdminAdStudioFrameAsset[];
  video: AdminAdStudioVideoAsset | null;
  models: {
    geminiText: string;
    nanoBananaImage: string;
    veoVideo: string;
  };
  stages: {
    copy: AdminAdStudioRunStage;
    images: AdminAdStudioRunStage;
    video: AdminAdStudioRunStage;
  };
};
type GeminiImagePayload = {
  bytes: Buffer;
  mimeType: string;
};

const RUN_ID_PATTERN = /^\d{8}-\d{6}-[a-z0-9-]+$/;

const ACCENT_HEX: Record<string, string> = {
  lilac: "#7C3AED",
  mint: "#059669",
  coral: "#E11D48",
  ocean: "#0284C7",
  midnight: "#334155",
};

const ADMIN_AD_STUDIO_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    eventTitle: { type: "string" },
    eventDate: { type: "string" },
    location: { type: "string" },
    audience: { type: "string" },
    goal: { type: "string" },
    outputFormat: {
      type: "string",
      enum: ["vertical", "horizontal", "square"],
    },
    accentColor: {
      type: "string",
      enum: ["lilac", "mint", "coral", "ocean", "midnight"],
    },
    captionStyle: {
      type: "string",
      enum: ["cinematic", "playful", "editorial"],
    },
    socialCaption: { type: "string" },
    hashtags: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 6,
    },
    beats: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          tag: { type: "string" },
          headline: { type: "string" },
          subheadline: { type: "string" },
          body: { type: "string" },
        },
        required: ["tag", "headline", "subheadline", "body"],
      },
    },
  },
  required: [
    "eventTitle",
    "eventDate",
    "location",
    "audience",
    "goal",
    "outputFormat",
    "accentColor",
    "captionStyle",
    "socialCaption",
    "hashtags",
    "beats",
  ],
} as const;

export class AdminAdStudioGenerationError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(
    code: string,
    message: string,
    options: { status?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.code = code;
    this.status = options.status ?? 500;
    this.retryable = options.retryable ?? true;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildStage(status: AdminAdStudioRunStage["status"], error: string | null = null) {
  return { status, updatedAt: nowIso(), error };
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function trimTo(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength).trim();
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42) || "ad-studio"
  );
}

function timestampForRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join("-");
}

function cleanVideoBrandCopy(value: string): string {
  return value.replace(/\bEnvitefy\b/gi, "the live invite");
}

function nullableRequestString(value: unknown): string | null {
  const text = safeString(value);
  return text || null;
}

export function parseAdminAdStudioGenerateRequest(input: unknown): ParseSuccess | ParseFailure {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const value = input as Record<string, unknown>;
  const brief = safeString(value.brief);
  const eventTitle = nullableRequestString(value.eventTitle);
  const eventDate = nullableRequestString(value.eventDate);
  const location = nullableRequestString(value.location);
  const audience = nullableRequestString(value.audience);
  const goal = nullableRequestString(value.goal);
  const outputFormat = safeString(value.outputFormat);

  if (![brief, eventTitle, eventDate, location, audience, goal].some(Boolean)) {
    return { ok: false, error: "Add campaign details before generating an ad." };
  }

  return {
    ok: true,
    value: {
      brief: trimTo(brief, 4000),
      eventTitle: eventTitle ? trimTo(eventTitle, 120) : null,
      eventDate: eventDate ? trimTo(eventDate, 120) : null,
      location: location ? trimTo(location, 140) : null,
      audience: audience ? trimTo(audience, 180) : null,
      goal: goal ? trimTo(goal, 180) : null,
      outputFormat: isAdminAdStudioFormat(outputFormat) ? outputFormat : null,
    },
  };
}

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || ""
  );
}

function resolveGeminiModel(): string {
  return (
    process.env.ADMIN_AD_STUDIO_GEMINI_MODEL ||
    process.env.STUDIO_GEMINI_TEXT_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3-flash-preview"
  );
}

function resolveNanoBananaImageModel(): string {
  return (
    process.env.ADMIN_AD_STUDIO_NANO_BANANA_MODEL ||
    process.env.ADMIN_AD_STUDIO_IMAGE_MODEL ||
    process.env.STUDIO_GEMINI_IMAGE_MODEL ||
    "gemini-2.5-flash-image"
  );
}

function resolveVeoVideoModel(): string {
  return (
    process.env.ADMIN_AD_STUDIO_VEO_MODEL ||
    process.env.STUDIO_GEMINI_VIDEO_MODEL ||
    "veo-3.0-generate-001"
  );
}

export function getAdminAdStudioGeminiStatus(): { configured: boolean; model: string } {
  return {
    configured: Boolean(getGeminiApiKey()),
    model: resolveGeminiModel(),
  };
}

export function getAdminAdStudioProviderStatuses(): AdminAdStudioProviderStatus[] {
  const configured = Boolean(getGeminiApiKey());
  return [
    {
      id: "geminiText",
      label: "Gemini text",
      configured,
      model: resolveGeminiModel(),
      envVars: ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"],
    },
    {
      id: "nanoBananaImage",
      label: "Nano Banana image",
      configured,
      model: resolveNanoBananaImageModel(),
      envVars: ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"],
    },
    {
      id: "veoVideo",
      label: "Veo video",
      configured,
      model: resolveVeoVideoModel(),
      envVars: ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"],
    },
  ];
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new AdminAdStudioGenerationError(
      "missing_api_key",
      "Gemini is not configured. Set GEMINI_API_KEY, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY.",
      { status: 503, retryable: false },
    );
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

function extractImagePayloadFromGeminiResponse(response: any): GeminiImagePayload | null {
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  const directParts = Array.isArray(response?.parts) ? response.parts : [];
  const partGroups = [
    directParts,
    ...candidates.map((candidate: { content?: { parts?: unknown } }) =>
      Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [],
    ),
  ];

  for (const parts of partGroups) {
    for (const part of parts) {
      const data = safeString(part?.inlineData?.data);
      if (!data) continue;
      return {
        bytes: Buffer.from(data, "base64"),
        mimeType: safeString(part?.inlineData?.mimeType) || "image/png",
      };
    }
  }
  return null;
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

function normalizeHashtags(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_ADMIN_AD_STUDIO_CONFIG.hashtags;
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    const text = trimTo(safeString(item), 32);
    if (!text) continue;
    const tag = text.startsWith("#") ? text : `#${text.replace(/^#+/, "")}`;
    const normalized = tag.replace(/\s+/g, "");
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    tags.push(normalized);
    if (tags.length >= 6) break;
  }

  return tags.length > 0 ? tags : DEFAULT_ADMIN_AD_STUDIO_CONFIG.hashtags;
}

function normalizeBeat(value: unknown, fallback: AdminAdStudioBeat): AdminAdStudioBeat {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    tag: trimTo(cleanVideoBrandCopy(safeString(record.tag) || fallback.tag), 22),
    headline: trimTo(cleanVideoBrandCopy(safeString(record.headline) || fallback.headline), 64),
    subheadline: trimTo(
      cleanVideoBrandCopy(safeString(record.subheadline) || fallback.subheadline),
      92,
    ),
    body: trimTo(cleanVideoBrandCopy(safeString(record.body) || fallback.body), 160),
  };
}

function normalizeAdStudioConfig(
  value: unknown,
  request: AdminAdStudioGenerateRequest,
): AdminAdStudioConfig | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const beatsRaw = Array.isArray(record.beats) ? record.beats : [];
  const beats = DEFAULT_ADMIN_AD_STUDIO_CONFIG.beats.map((fallback, index) =>
    normalizeBeat(beatsRaw[index], fallback),
  ) as AdminAdStudioConfig["beats"];

  const accent = safeString(record.accentColor);
  const captionStyle = safeString(record.captionStyle);
  const outputFormat = safeString(record.outputFormat);
  const eventTitle = trimTo(
    safeString(record.eventTitle) ||
      request.eventTitle ||
      DEFAULT_ADMIN_AD_STUDIO_CONFIG.eventTitle,
    120,
  );
  const eventDate = trimTo(
    safeString(record.eventDate) || request.eventDate || DEFAULT_ADMIN_AD_STUDIO_CONFIG.eventDate,
    120,
  );
  const location = trimTo(
    safeString(record.location) || request.location || DEFAULT_ADMIN_AD_STUDIO_CONFIG.location,
    140,
  );

  if (!eventTitle || beats.length !== 4) return null;

  return {
    eventTitle,
    eventDate,
    location,
    audience: trimTo(
      safeString(record.audience) || request.audience || DEFAULT_ADMIN_AD_STUDIO_CONFIG.audience,
      180,
    ),
    goal: trimTo(
      safeString(record.goal) || request.goal || DEFAULT_ADMIN_AD_STUDIO_CONFIG.goal,
      180,
    ),
    outputFormat: isAdminAdStudioFormat(outputFormat)
      ? outputFormat
      : request.outputFormat || DEFAULT_ADMIN_AD_STUDIO_CONFIG.outputFormat,
    accentColor: isAdminAdStudioAccent(accent)
      ? accent
      : DEFAULT_ADMIN_AD_STUDIO_CONFIG.accentColor,
    captionStyle: isAdminAdStudioCaptionStyle(captionStyle)
      ? captionStyle
      : DEFAULT_ADMIN_AD_STUDIO_CONFIG.captionStyle,
    socialCaption: trimTo(
      safeString(record.socialCaption) || DEFAULT_ADMIN_AD_STUDIO_CONFIG.socialCaption,
      300,
    ),
    hashtags: normalizeHashtags(record.hashtags),
    beats,
  };
}

export function normalizeAdminAdStudioConfigInput(value: unknown): AdminAdStudioConfig | null {
  return normalizeAdStudioConfig(value, {
    brief: "",
    eventTitle: null,
    eventDate: null,
    location: null,
    audience: null,
    goal: null,
    outputFormat: null,
  });
}

function isAdminAdStudioFrameAsset(value: unknown): value is AdminAdStudioFrameAsset {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const beatIndex = Number(record.beatIndex);
  return (
    Number.isInteger(beatIndex) &&
    beatIndex >= 0 &&
    beatIndex <= 3 &&
    safeString(record.file).length > 0 &&
    safeString(record.url).length > 0 &&
    safeString(record.provider) === "nano-banana"
  );
}

export function parseAdminAdStudioImagesRequest(
  input: unknown,
): ImagesParseSuccess | ImagesParseFailure {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = input as Record<string, unknown>;
  const ad = normalizeAdminAdStudioConfigInput(record.ad);
  if (!ad) return { ok: false, error: "Ad copy is required before generating images." };

  let frameIndex: number | null = null;
  if (record.frameIndex !== undefined && record.frameIndex !== null) {
    const numeric = Number(record.frameIndex);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 3) {
      return { ok: false, error: "frameIndex must be 0, 1, 2, or 3." };
    }
    frameIndex = numeric;
  }

  return {
    ok: true,
    value: {
      runId: nullableRequestString(record.runId),
      ad,
      frameIndex,
    },
  };
}

export function parseAdminAdStudioVideoRequest(
  input: unknown,
): VideoParseSuccess | VideoParseFailure {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = input as Record<string, unknown>;
  const ad = normalizeAdminAdStudioConfigInput(record.ad);
  if (!ad) return { ok: false, error: "Ad copy is required before rendering video." };

  const frames = Array.isArray(record.frames)
    ? record.frames.filter(isAdminAdStudioFrameAsset)
    : [];
  if (frames.length !== 4) {
    return { ok: false, error: "Generate all four Nano Banana frames before rendering video." };
  }

  const providerRaw = safeString(record.provider);
  return {
    ok: true,
    value: {
      runId: nullableRequestString(record.runId),
      ad,
      frames: frames.sort((a, b) => a.beatIndex - b.beatIndex) as AdminAdStudioFrameAsset[],
      provider: isAdminAdStudioVideoProvider(providerRaw) ? providerRaw : "ffmpeg",
    },
  };
}

export function getAdminAdStudioRunsRoot(projectRoot = process.cwd()): string {
  return path.join(projectRoot, "qa-artifacts", "ad-studio-runs");
}

export function sanitizeAdminAdStudioRunId(value: string): string {
  const runId = safeString(value);
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new AdminAdStudioGenerationError("invalid_run_id", "Invalid ad-studio run id.", {
      status: 400,
      retryable: false,
    });
  }
  return runId;
}

export function resolveAdminAdStudioRunDir(runId: string, projectRoot = process.cwd()): string {
  return path.join(getAdminAdStudioRunsRoot(projectRoot), sanitizeAdminAdStudioRunId(runId));
}

export function buildAdminAdStudioAssetUrl(runId: string, file: string): string {
  return `/api/admin/ad-studio/assets/${encodeURIComponent(runId)}?file=${encodeURIComponent(file)}`;
}

export function resolveAdminAdStudioAssetPath(
  runId: string,
  file: string,
  projectRoot = process.cwd(),
): string {
  const runDir = resolveAdminAdStudioRunDir(runId, projectRoot);
  const requested = safeString(file);
  if (!requested) {
    throw new AdminAdStudioGenerationError("missing_file", "Missing asset file.", {
      status: 400,
      retryable: false,
    });
  }
  const absolutePath = path.resolve(runDir, requested);
  const normalizedRunDir = `${runDir}${path.sep}`;
  if (absolutePath === runDir || !absolutePath.startsWith(normalizedRunDir)) {
    throw new AdminAdStudioGenerationError("invalid_file", "Invalid asset file.", {
      status: 400,
      retryable: false,
    });
  }
  return absolutePath;
}

function createRunId(ad: AdminAdStudioConfig): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${timestampForRunId()}-${slugify(ad.eventTitle)}-${suffix}`;
}

async function readRun(runDir: string): Promise<AdminAdStudioRun | null> {
  try {
    const raw = await fs.readFile(path.join(runDir, "run.json"), "utf8");
    return JSON.parse(raw) as AdminAdStudioRun;
  } catch {
    return null;
  }
}

async function writeRun(runDir: string, run: AdminAdStudioRun): Promise<void> {
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "run.json"), `${JSON.stringify(run, null, 2)}\n`, "utf8");
}

function withFreshAssetUrls(run: AdminAdStudioRun): AdminAdStudioRun {
  return {
    ...run,
    frames: run.frames.map((frame) => ({
      ...frame,
      url: buildAdminAdStudioAssetUrl(run.runId, frame.file),
    })),
    video: run.video
      ? {
          ...run.video,
          url: run.video.file ? buildAdminAdStudioAssetUrl(run.runId, run.video.file) : null,
        }
      : null,
  };
}

async function ensureRun({
  runId,
  request,
  ad,
}: {
  runId?: string | null;
  request?: AdminAdStudioGenerateRequest | null;
  ad: AdminAdStudioConfig;
}): Promise<{ run: AdminAdStudioRun; runDir: string }> {
  const safeRunId = runId ? sanitizeAdminAdStudioRunId(runId) : createRunId(ad);
  const runDir = resolveAdminAdStudioRunDir(safeRunId);
  const existing = await readRun(runDir);
  const generatedAt = existing?.createdAt || nowIso();
  const run: AdminAdStudioRun = {
    version: 1,
    runId: safeRunId,
    createdAt: generatedAt,
    updatedAt: nowIso(),
    request: request ?? existing?.request ?? null,
    ad,
    frames: existing?.frames ?? [],
    video: existing?.video ?? null,
    models: {
      geminiText: resolveGeminiModel(),
      nanoBananaImage: resolveNanoBananaImageModel(),
      veoVideo: resolveVeoVideoModel(),
    },
    stages: existing?.stages ?? {
      copy: buildStage("pending"),
      images: buildStage("pending"),
      video: buildStage("pending"),
    },
  };
  await writeRun(runDir, run);
  return { run, runDir };
}

async function saveRun(runDir: string, run: AdminAdStudioRun): Promise<AdminAdStudioRun> {
  const nextRun = { ...run, updatedAt: nowIso() };
  await writeRun(runDir, nextRun);
  return withFreshAssetUrls(nextRun);
}

function buildPrompt(request: AdminAdStudioGenerateRequest): string {
  return `You create concise 10-second mobile ad copy for Envitefy.

Product facts:
- Envitefy creates polished event invite pages from event details.
- Hosts can share one link with date, location, RSVP, registry, schedule, and guest-facing details.
- The ad should feel like a social Reel/TikTok spot, not a long product explainer.
- Visual brand rendering is handled by the app with public/favicon.png, public/email/envitefy-wordmark-email.png, and envitefy.com. Do not put the brand name in beat headlines or beat body copy.

Required story structure:
1. Problem: event planning stress.
2. Chaos: group chats and repeated guest questions.
3. Reveal: Envitefy creates the hosted invite.
4. Share: one polished link and clear call to action.

Keep copy short enough for a phone screen. Do not invent discounts, guarantees, prices, partnerships, or unavailable features. Return JSON only.

Campaign input:
Brief: ${request.brief || "(none)"}
Event title: ${request.eventTitle || "(infer)"}
Date/time: ${request.eventDate || "(infer if supplied, otherwise leave broad)"}
Location: ${request.location || "(infer if supplied, otherwise keep simple)"}
Audience: ${request.audience || "(infer)"}
Goal: ${request.goal || "(infer)"}
Output format: ${request.outputFormat || DEFAULT_ADMIN_AD_STUDIO_CONFIG.outputFormat}`;
}

export async function generateAdminAdStudioConfig(
  request: AdminAdStudioGenerateRequest,
): Promise<{ ad: AdminAdStudioConfig; model: string; runId: string; warnings: string[] }> {
  const model = resolveGeminiModel();
  const client = getGeminiClient();

  try {
    const response = await client.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: buildPrompt(request) }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ADMIN_AD_STUDIO_RESPONSE_SCHEMA,
        temperature: 0.65,
        topP: 0.9,
        candidateCount: 1,
      },
    });
    const parsed = extractJsonObject(extractTextFromGeminiResponse(response));
    const ad = normalizeAdStudioConfig(parsed, request);
    if (!ad) {
      throw new AdminAdStudioGenerationError(
        "invalid_response",
        "Gemini returned ad copy in an unexpected format.",
        { status: 502 },
      );
    }
    const { run, runDir } = await ensureRun({ request, ad });
    run.stages.copy = buildStage("done");
    const saved = await saveRun(runDir, run);
    return { ad, model, runId: saved.runId, warnings: [] };
  } catch (error) {
    if (error instanceof AdminAdStudioGenerationError) throw error;
    const message = error instanceof Error ? error.message : "Gemini request failed.";
    throw new AdminAdStudioGenerationError(
      message.includes("API key") ? "missing_api_key" : "provider_error",
      message,
      { status: message.includes("API key") ? 503 : 502 },
    );
  }
}

function imageExtensionForMime(mimeType: string): ".jpg" | ".png" | ".webp" {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

function imageAspectRatioForFormat(format: AdminAdStudioConfig["outputFormat"]) {
  if (format === "horizontal") return "16:9";
  if (format === "square") return "1:1";
  return "9:16";
}

function videoDimensionsForFormat(format: AdminAdStudioConfig["outputFormat"]) {
  if (format === "horizontal") return { width: 1920, height: 1080 };
  if (format === "square") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function buildFrameImagePrompt(ad: AdminAdStudioConfig, beatIndex: 0 | 1 | 2 | 3): string {
  const beat = ad.beats[beatIndex];
  const continuity =
    "Keep the scene in the same premium social-ad campaign style as the other frames: realistic light, polished composition, modern event-planning context, and room for animated text overlays.";
  const scene =
    beatIndex === 0
      ? "Show the relatable planning-stress moment before the event: a host surrounded by tasteful planning details, phone notifications, notes, and event items."
      : beatIndex === 1
        ? "Show the message-chaos moment: repeated questions and planning friction represented visually through phones, notes, and a busy host."
        : beatIndex === 2
          ? "Show the product-reveal moment: a polished live invitation experience implied on a phone or laptop without readable UI text."
          : "Show the payoff moment: the event is ready to share, with a confident host and an elegant digital invite vibe.";

  return [
    `Create frame ${beatIndex + 1} of a four-frame ${imageAspectRatioForFormat(
      ad.outputFormat,
    )} social ad background for Envitefy.`,
    continuity,
    scene,
    "Do not include readable text, brand logos, watermarks, QR codes, captions, or UI copy in the image. The app will overlay all text later.",
    "Leave clean negative space in the upper and lower thirds so overlay text remains legible.",
    `Campaign: ${ad.eventTitle}. Date/time: ${ad.eventDate}. Location: ${ad.location}. Audience: ${ad.audience}. Goal: ${ad.goal}.`,
    `Beat tag: ${beat.tag}. Beat headline for context only: ${beat.headline}. Beat body for context only: ${beat.body}.`,
  ].join("\n");
}

export async function generateAdminAdStudioImages(request: AdminAdStudioImagesRequest): Promise<{
  runId: string;
  model: string;
  frames: AdminAdStudioFrameAsset[];
  warnings: string[];
}> {
  const model = resolveNanoBananaImageModel();
  const { run, runDir } = await ensureRun({ runId: request.runId, ad: request.ad });
  const frameIndexes =
    request.frameIndex === null || request.frameIndex === undefined
      ? ([0, 1, 2, 3] as const)
      : ([request.frameIndex] as Array<0 | 1 | 2 | 3>);

  run.stages.images = buildStage("running");
  await saveRun(runDir, run);

  try {
    const client = getGeminiClient();
    const imagesDir = path.join(runDir, "images");
    await fs.mkdir(imagesDir, { recursive: true });
    const nextFrames = [...run.frames];

    for (const beatIndex of frameIndexes) {
      const prompt = buildFrameImagePrompt(request.ad, beatIndex);
      const response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: imageAspectRatioForFormat(request.ad.outputFormat),
          },
        },
      });
      const payload = extractImagePayloadFromGeminiResponse(response);
      if (!payload) {
        throw new AdminAdStudioGenerationError(
          "image_not_returned",
          "Nano Banana did not return an image payload.",
          { status: 502 },
        );
      }

      const file = `images/frame-${String(beatIndex + 1).padStart(2, "0")}${imageExtensionForMime(
        payload.mimeType,
      )}`;
      await fs.writeFile(path.join(runDir, file), payload.bytes);
      const frame: AdminAdStudioFrameAsset = {
        beatIndex,
        url: buildAdminAdStudioAssetUrl(run.runId, file),
        file,
        prompt,
        provider: "nano-banana",
        model,
        generatedAt: nowIso(),
      };
      const existingIndex = nextFrames.findIndex((item) => item.beatIndex === beatIndex);
      if (existingIndex >= 0) {
        nextFrames[existingIndex] = frame;
      } else {
        nextFrames.push(frame);
      }
    }

    run.frames = nextFrames.sort((a, b) => a.beatIndex - b.beatIndex);
    run.video = null;
    run.stages.images = buildStage("done");
    run.stages.video = buildStage("pending");
    const saved = await saveRun(runDir, run);
    return { runId: saved.runId, model, frames: saved.frames, warnings: [] };
  } catch (error) {
    run.stages.images = buildStage(
      "error",
      error instanceof Error ? error.message : "Image generation failed.",
    );
    await saveRun(runDir, run);
    if (error instanceof AdminAdStudioGenerationError) throw error;
    const message = error instanceof Error ? error.message : "Nano Banana request failed.";
    throw new AdminAdStudioGenerationError(
      message.includes("API key") || message.includes("not configured")
        ? "missing_api_key"
        : "provider_error",
      message,
      { status: message.includes("API key") ? 503 : 502 },
    );
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(value: string, maxChars: number, maxLines: number): string[] {
  const words = cleanVideoBrandCopy(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [""];
}

function svgTextLines({
  lines,
  x,
  y,
  fontSize,
  lineHeight,
  fill,
  weight = 700,
  anchor = "middle",
}: {
  lines: string[];
  x: number;
  y: number;
  fontSize: number;
  lineHeight: number;
  fill: string;
  weight?: number;
  anchor?: "middle" | "start";
}) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${fill}">${escapeXml(line)}</text>`,
    )
    .join("");
}

function buildCaptionOverlaySvg({
  ad,
  beat,
  beatIndex,
  width,
  height,
}: {
  ad: AdminAdStudioConfig;
  beat: AdminAdStudioBeat;
  beatIndex: number;
  width: number;
  height: number;
}) {
  const accent = ACCENT_HEX[ad.accentColor] || ACCENT_HEX.lilac;
  const isVertical = height > width;
  const margin = Math.round(width * (isVertical ? 0.08 : 0.06));
  const panelWidth = width - margin * 2;
  const panelY = Math.round(height * (isVertical ? 0.62 : 0.58));
  const panelHeight = Math.round(height * (isVertical ? 0.26 : 0.28));
  const centerX = width / 2;
  const headlineLines = wrapText(beat.headline, isVertical ? 24 : 42, 3);
  const supportLines = wrapText(beat.subheadline, isVertical ? 34 : 64, 2);
  const eventLines = beatIndex === 3 ? wrapText(ad.eventTitle, isVertical ? 28 : 44, 2) : [];
  const headlineSize = Math.round(width * (isVertical ? 0.062 : 0.04));
  const supportSize = Math.round(width * (isVertical ? 0.036 : 0.024));
  const eyebrowSize = Math.round(width * (isVertical ? 0.028 : 0.018));
  const eventSize = Math.round(width * (isVertical ? 0.038 : 0.024));
  const headlineY = panelY + Math.round(panelHeight * 0.34);
  const supportY = headlineY + headlineLines.length * Math.round(headlineSize * 1.18) + 18;
  const eventY = panelY + panelHeight - Math.round(panelHeight * 0.14);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#020617" stop-opacity="0.26"/>
      <stop offset="0.52" stop-color="#020617" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#shade)"/>
  <rect x="${margin}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${Math.round(
    width * 0.035,
  )}" fill="#020617" fill-opacity="0.84" stroke="#FFFFFF" stroke-opacity="0.16"/>
  <text x="${centerX}" y="${panelY + Math.round(panelHeight * 0.17)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${eyebrowSize}" font-weight="800" letter-spacing="5" fill="${accent}">${escapeXml(
    cleanVideoBrandCopy(beat.tag).toUpperCase(),
  )}</text>
  ${svgTextLines({
    lines: headlineLines,
    x: centerX,
    y: headlineY,
    fontSize: headlineSize,
    lineHeight: Math.round(headlineSize * 1.16),
    fill: "#F8FAFC",
    weight: 900,
  })}
  ${svgTextLines({
    lines: supportLines,
    x: centerX,
    y: supportY,
    fontSize: supportSize,
    lineHeight: Math.round(supportSize * 1.28),
    fill: "#CBD5E1",
    weight: 650,
  })}
  ${
    eventLines.length
      ? svgTextLines({
          lines: eventLines,
          x: centerX,
          y: eventY,
          fontSize: eventSize,
          lineHeight: Math.round(eventSize * 1.18),
          fill: accent,
          weight: 800,
        })
      : ""
  }
  <rect x="${margin}" y="${Math.round(height * 0.045)}" width="${Math.round(
    width * (isVertical ? 0.48 : 0.28),
  )}" height="${Math.round(height * (isVertical ? 0.042 : 0.058))}" rx="${Math.round(
    height * 0.03,
  )}" fill="#020617" fill-opacity="0.72" stroke="#FFFFFF" stroke-opacity="0.14"/>
  <circle cx="${margin + Math.round(height * (isVertical ? 0.021 : 0.029))}" cy="${Math.round(
    height * (isVertical ? 0.066 : 0.074),
  )}" r="${Math.round(height * (isVertical ? 0.012 : 0.016))}" fill="${accent}"/>
  <text x="${margin + Math.round(height * (isVertical ? 0.044 : 0.058))}" y="${Math.round(
    height * (isVertical ? 0.073 : 0.083),
  )}" font-family="Inter, Arial, sans-serif" font-size="${Math.round(
    width * (isVertical ? 0.028 : 0.018),
  )}" font-weight="800" fill="#F8FAFC">Envitefy</text>
</svg>`;
}

async function renderCaptionedVideoFrames({
  runId,
  runDir,
  ad,
  frames,
}: {
  runId: string;
  runDir: string;
  ad: AdminAdStudioConfig;
  frames: AdminAdStudioFrameAsset[];
}): Promise<string[]> {
  const sharp = (await import("sharp")).default;
  const { width, height } = videoDimensionsForFormat(ad.outputFormat);
  const outputDir = path.join(runDir, "video-frames");
  await fs.mkdir(outputDir, { recursive: true });
  const files: string[] = [];

  for (const frame of frames) {
    const inputPath = resolveAdminAdStudioAssetPath(runId, frame.file);
    const outputFile = `video-frames/frame-${String(frame.beatIndex + 1).padStart(2, "0")}.png`;
    const overlay = buildCaptionOverlaySvg({
      ad,
      beat: ad.beats[frame.beatIndex],
      beatIndex: frame.beatIndex,
      width,
      height,
    });
    await sharp(inputPath)
      .resize(width, height, { fit: "cover" })
      .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
      .png()
      .toFile(path.join(runDir, outputFile));
    files.push(outputFile);
  }

  return files;
}

async function writeVideoConcatFile(runDir: string, files: string[]): Promise<string> {
  const concatPath = path.join(runDir, "video.concat.txt");
  const lines: string[] = [];
  for (const file of files) {
    lines.push(`file '${path.join(runDir, file).replace(/'/g, "'\\''")}'`);
    lines.push("duration 2.5");
  }
  if (files.length) {
    lines.push(`file '${path.join(runDir, files[files.length - 1]).replace(/'/g, "'\\''")}'`);
  }
  await fs.writeFile(concatPath, `${lines.join("\n")}\n`, "utf8");
  return concatPath;
}

function runFfmpeg(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

async function renderAdminAdStudioFfmpegVideo({
  run,
  runDir,
  request,
}: {
  run: AdminAdStudioRun;
  runDir: string;
  request: AdminAdStudioVideoRequest;
}): Promise<AdminAdStudioVideoAsset> {
  const { width, height } = videoDimensionsForFormat(request.ad.outputFormat);
  const captionedFrames = await renderCaptionedVideoFrames({
    runId: run.runId,
    runDir,
    ad: request.ad,
    frames: request.frames,
  });
  const concatPath = await writeVideoConcatFile(runDir, captionedFrames);
  const outputFile = "video.mp4";
  const outputPath = path.join(runDir, outputFile);
  await runFfmpeg(
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-vf",
      `scale=${width}:${height},setsar=1,format=yuv420p`,
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    runDir,
  );

  return {
    url: buildAdminAdStudioAssetUrl(run.runId, outputFile),
    file: outputFile,
    provider: "ffmpeg",
    model: "ffmpeg",
    status: "done",
    operationName: null,
    generatedAt: nowIso(),
  };
}

async function startAdminAdStudioVeoVideo({
  run,
  request,
}: {
  run: AdminAdStudioRun;
  request: AdminAdStudioVideoRequest;
}): Promise<AdminAdStudioVideoAsset> {
  const client = getGeminiClient();
  const generateVideos = (client.models as any).generateVideos;
  if (typeof generateVideos !== "function") {
    throw new AdminAdStudioGenerationError(
      "provider_unavailable",
      "The installed Google GenAI SDK does not expose generateVideos.",
      { status: 501, retryable: false },
    );
  }
  const model = resolveVeoVideoModel();
  const prompt = [
    "Create a polished 10-second social ad video for Envitefy using this four-beat structure.",
    "Keep it premium, modern, and usable as a short Reel/TikTok ad. Do not invent discounts or claims.",
    `Aspect ratio: ${imageAspectRatioForFormat(request.ad.outputFormat)}.`,
    `Event: ${request.ad.eventTitle}. Date: ${request.ad.eventDate}. Location: ${request.ad.location}.`,
    ...request.ad.beats.map(
      (beat, index) =>
        `Beat ${index + 1}: ${beat.tag}. ${beat.headline}. ${beat.subheadline}. ${beat.body}`,
    ),
  ].join("\n");
  const operation = await generateVideos.call(client.models, {
    model,
    prompt,
    config: {
      aspectRatio: request.ad.outputFormat === "horizontal" ? "16:9" : "9:16",
    },
  });
  const operationName =
    safeString(operation?.name) ||
    safeString(operation?.operation?.name) ||
    safeString(operation?.metadata?.name) ||
    null;

  return {
    url: null,
    file: null,
    provider: "veo",
    model,
    status: "running",
    operationName,
    generatedAt: nowIso(),
  };
}

export async function generateAdminAdStudioVideo(
  request: AdminAdStudioVideoRequest,
): Promise<{ runId: string; video: AdminAdStudioVideoAsset; warnings: string[] }> {
  const provider: AdminAdStudioVideoProvider = request.provider || "ffmpeg";
  const { run, runDir } = await ensureRun({ runId: request.runId, ad: request.ad });
  run.frames = request.frames;
  run.stages.video = buildStage("running");
  await saveRun(runDir, run);

  try {
    const video =
      provider === "veo"
        ? await startAdminAdStudioVeoVideo({ run, request })
        : await renderAdminAdStudioFfmpegVideo({ run, runDir, request });
    run.video = video;
    run.stages.video = buildStage(video.status === "done" ? "done" : "running");
    const saved = await saveRun(runDir, run);
    return { runId: saved.runId, video: saved.video || video, warnings: [] };
  } catch (error) {
    run.stages.video = buildStage(
      "error",
      error instanceof Error ? error.message : "Video render failed.",
    );
    await saveRun(runDir, run);
    if (error instanceof AdminAdStudioGenerationError) throw error;
    const message = error instanceof Error ? error.message : "Video render failed.";
    throw new AdminAdStudioGenerationError(
      message.includes("ffmpeg") ? "ffmpeg_error" : "provider_error",
      message,
      { status: 502 },
    );
  }
}
