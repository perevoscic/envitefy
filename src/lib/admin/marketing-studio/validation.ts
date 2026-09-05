import {
  DEFAULT_STUDIO_SETTINGS,
  STUDIO_PLATFORMS,
  type StudioConversationPatch,
  type StudioSettings,
  type StudioTurnInput,
} from "./types.ts";

export class StudioRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StudioRequestError";
    this.status = status;
  }
}

export const MAX_STUDIO_REFERENCES = 8;
export const MAX_STUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireStudioId(value: string, label = "ID"): string {
  if (!UUID.test(value)) throw new StudioRequestError(`Invalid ${label}.`);
  return value.toLowerCase();
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioRequestError("A JSON object is required.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, limit: number, label: string): string {
  if (typeof value !== "string") throw new StudioRequestError(`${label} must be text.`);
  if (value.length > limit)
    throw new StudioRequestError(`${label} is too long (maximum ${limit} characters).`);
  return value.trim();
}

export function parseStudioSettings(value: unknown): StudioSettings {
  const source = record(value);
  const { output, platform, format } = source;
  if (output !== "prompt" && output !== "image" && output !== "video") {
    throw new StudioRequestError("Choose prompt, image, or video.");
  }
  if (!STUDIO_PLATFORMS.some((item) => item === platform)) {
    throw new StudioRequestError("Choose Instagram, Facebook, YouTube, or Reddit.");
  }
  if (format !== "square" && format !== "vertical" && format !== "horizontal") {
    throw new StudioRequestError("Choose a supported format.");
  }
  if (output === "video" && format === "square") {
    throw new StudioRequestError("Video supports portrait or landscape format.");
  }
  if (typeof source.branding !== "boolean")
    throw new StudioRequestError("Branding must be true or false.");
  return {
    output,
    platform: platform as StudioSettings["platform"],
    format,
    audience: text(source.audience ?? "", 500, "Audience"),
    tone: text(source.tone ?? "", 240, "Tone"),
    callToAction: text(source.callToAction ?? "", 240, "Call to action"),
    branding: source.branding,
  };
}

export function parseStudioReferenceIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new StudioRequestError("Reference assets must be an array of IDs.");
  }
  const ids = Array.from(
    new Set(value.map((item: string) => requireStudioId(item, "reference asset ID"))),
  );
  if (ids.length > MAX_STUDIO_REFERENCES) {
    throw new StudioRequestError(`Attach up to ${MAX_STUDIO_REFERENCES} reference images.`);
  }
  return ids;
}

export function parseStudioTurn(value: unknown): StudioTurnInput {
  const source = record(value);
  const prompt = text(source.text, 4_000, "Your idea");
  if (!prompt) throw new StudioRequestError("Share an idea or describe a change.");
  const clientRequestId = requireStudioId(
    text(source.clientRequestId, 36, "Request ID"),
    "request ID",
  );
  const parentVersionId =
    source.parentVersionId == null
      ? null
      : requireStudioId(text(source.parentVersionId, 36, "Version ID"), "version ID");
  const parsed: StudioTurnInput = {
    clientRequestId,
    text: prompt,
    settings: parseStudioSettings(source.settings),
    parentVersionId,
    referenceAssetIds: parseStudioReferenceIds(source.referenceAssetIds ?? []),
  };
  if (source.promptOverride !== undefined) {
    const override = source.promptOverride;
    if (typeof override !== "string" || override.length > 16_000) {
      throw new StudioRequestError("Production prompt must be text up to 16000 characters.");
    }
    if (override.trim()) parsed.promptOverride = override;
  }
  return parsed;
}

export function parseStudioConversationPatch(value: unknown): StudioConversationPatch {
  const source = record(value);
  const patch: StudioConversationPatch = {};
  if (source.title !== undefined) {
    patch.title = text(source.title, 160, "Title");
    if (!patch.title) throw new StudioRequestError("Title cannot be empty.");
  }
  if (source.draft !== undefined) {
    if (typeof source.draft !== "string" || source.draft.length > 4_000) {
      throw new StudioRequestError("Draft must be text up to 4000 characters.");
    }
    patch.draft = source.draft;
  }
  if (source.settings !== undefined) patch.settings = parseStudioSettings(source.settings);
  if (source.referenceAssetIds !== undefined)
    patch.referenceAssetIds = parseStudioReferenceIds(source.referenceAssetIds);
  if (source.selectedVersionId !== undefined) {
    patch.selectedVersionId =
      source.selectedVersionId === null
        ? null
        : requireStudioId(text(source.selectedVersionId, 36, "Version ID"), "version ID");
  }
  return patch;
}

export function parseStudioConversationCreate(value: unknown): {
  title: string;
  settings: StudioSettings;
} {
  const source = record(value);
  return {
    title:
      source.title === undefined
        ? "New creation"
        : text(source.title, 160, "Title") || "New creation",
    settings:
      source.settings === undefined
        ? { ...DEFAULT_STUDIO_SETTINGS }
        : parseStudioSettings(source.settings),
  };
}

export function validateStudioUpload(bytes: Buffer, mimeType: string): void {
  if (!bytes.length || bytes.length > MAX_STUDIO_UPLOAD_BYTES) {
    throw new StudioRequestError("Each reference image must be between 1 byte and 25 MB.");
  }
  const isPng =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const isWebp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (
    !(
      (mimeType === "image/png" && isPng) ||
      (mimeType === "image/jpeg" && isJpeg) ||
      (mimeType === "image/webp" && isWebp)
    )
  ) {
    throw new StudioRequestError("Upload a valid JPG, PNG, or WebP image.");
  }
}
