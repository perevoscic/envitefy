import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import sharp, { type Metadata } from "sharp";
import { encodeScanArtworkWebp } from "./ocr/artwork-webp.ts";
import { buildPublicAssetUrl } from "./public-asset-url.ts";
import {
  SHARP_UPLOAD_PRESETS,
  type UploadKind,
  type UploadResponse,
  type UploadUsage,
  validateUploadFileMeta,
} from "./upload-config.ts";

type BlobAccess = "public" | "private";

type BlobAsset = {
  url: string;
  pathname: string;
  sizeBytes: number;
  access: BlobAccess;
  /** Raw Vercel Blob URL from put(); prefer for public email embeds. */
  rawBlobUrl?: string;
};

export type ValidatedUpload = {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadKind;
};

type ImageOptimizationOptions = {
  displayMaxWidth?: number;
  displayQuality?: number;
  thumbWidth?: number;
  thumbQuality?: number;
  includeThumb?: boolean;
};

type WebpAsset = BlobAsset & {
  mimeType: "image/webp";
  width: number;
  height: number;
};

type UploadBlobParams = {
  pathname: string;
  bytes: Buffer;
  contentType: string;
  access: BlobAccess;
};

const BLOB_STORE_ACCESS_ERROR = /cannot use (?:public|private) access on a (?:private|public) store/i;

let detectedBlobStoreAccess: BlobAccess | null = null;

export type PublicUploadParams = {
  file: File;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
  scanAttemptId?: string | null;
};

export type BufferUploadParams = {
  bytes: Buffer;
  fileName: string;
  mimeType?: string | null;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
  scanAttemptId?: string | null;
};

export type DiscoverySourceResult = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadKind;
  buffer: Buffer;
  originalName: string;
  originalMimeType: string;
  originalSizeBytes: number;
  optimizedByQpdf?: boolean;
};

export function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "upload";
}

export function getScopeId(eventId?: string | null, uploadToken?: string | null): string {
  return sanitizePathSegment(String(eventId || uploadToken || `upload-${randomUUID()}`));
}

export function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

export function getImageOutputName(fileName: string): string {
  return `${sanitizePathSegment(stripExtension(fileName)) || "image"}.webp`;
}

function isBlobStoreAccessError(error: unknown): boolean {
  return error instanceof Error && BLOB_STORE_ACCESS_ERROR.test(error.message);
}

function buildPrivateBlobProxyPath(pathname: string): string {
  const encodedPath = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/blob/${encodedPath}`;
}

function resolveBlobAssetUrl(pathname: string, blobUrl: string, access: BlobAccess): string {
  if (access === "public") return blobUrl;
  // Persist a site-relative path so the stored value does not bake in a host.
  // The `/api/blob/<pathname>` proxy streams private blobs from whatever origin
  // is serving the page (previously this was `absoluteUrl(...)` which baked
  // `http://localhost:3000` into the DB during local dev and broke mobile loads).
  return buildPrivateBlobProxyPath(pathname);
}

export async function uploadBlobAsset(params: UploadBlobParams): Promise<BlobAsset> {
  // Enforce the policy at the shared boundary, including binary/email callers.
  const isPngOrJpeg =
    /^image\/(png|jpe?g)(?:;|$)/i.test(params.contentType) ||
    /\.(png|jpe?g)$/i.test(params.pathname) ||
    params.bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ||
    params.bytes.subarray(0, 3).toString("hex") === "ffd8ff";
  if (isPngOrJpeg) {
    const bytes = await encodeScanArtworkWebp(params.bytes);
    params = {
      ...params,
      bytes,
      pathname: /\.(png|jpe?g|webp)$/i.test(params.pathname)
        ? params.pathname.replace(/\.(png|jpe?g|webp)$/i, ".webp")
        : `${params.pathname}.webp`,
      contentType: "image/webp",
    };
  }
  const preferredAccess = detectedBlobStoreAccess || params.access;
  let blob: Awaited<ReturnType<typeof put>>;
  let resolvedAccess = preferredAccess;
  try {
    blob = await put(params.pathname, params.bytes, {
      access: preferredAccess,
      contentType: params.contentType || "application/octet-stream",
    });
  } catch (error) {
    if (!isBlobStoreAccessError(error)) {
      throw error;
    }
    resolvedAccess = preferredAccess === "public" ? "private" : "public";
    blob = await put(params.pathname, params.bytes, {
      access: resolvedAccess,
      contentType: params.contentType || "application/octet-stream",
    });
  }
  detectedBlobStoreAccess = resolvedAccess;
  return {
    url: resolveBlobAssetUrl(blob.pathname, blob.url, resolvedAccess),
    pathname: blob.pathname,
    sizeBytes: params.bytes.length,
    access: resolvedAccess,
    rawBlobUrl: blob.url,
  };
}

/** PNG/JPEG bytes become verified WebP; other binary formats pass through. */
export async function uploadPublicBinaryAsset(params: {
  bytes: Buffer;
  pathname: string;
  contentType: string;
}): Promise<{
  url: string;
  pathname: string;
  sizeBytes: number;
  access: BlobAccess;
  rawBlobUrl?: string;
}> {
  const uploaded = await uploadBlobAsset({
    pathname: params.pathname.replace(/^\/+/, ""),
    bytes: params.bytes,
    contentType: params.contentType,
    access: "public",
  });
  return {
    url: uploaded.url,
    pathname: uploaded.pathname,
    sizeBytes: uploaded.sizeBytes,
    access: uploaded.access,
    rawBlobUrl: uploaded.rawBlobUrl,
  };
}

/** Upload bytes private-store-first, avoiding a known failed public attempt for account media. */
export async function uploadPrivateBinaryAsset(params: {
  bytes: Buffer;
  pathname: string;
  contentType: string;
}): Promise<{
  url: string;
  pathname: string;
  sizeBytes: number;
  access: BlobAccess;
  rawBlobUrl?: string;
}> {
  const uploaded = await uploadBlobAsset({
    pathname: params.pathname.replace(/^\/+/, ""),
    bytes: params.bytes,
    contentType: params.contentType,
    access: "private",
  });
  return {
    url: uploaded.url,
    pathname: uploaded.pathname,
    sizeBytes: uploaded.sizeBytes,
    access: uploaded.access,
    rawBlobUrl: uploaded.rawBlobUrl,
  };
}

/**
 * Resolve a URL safe for email clients and admin preview.
 * Prefers public CDN URLs; for private proxy paths uses the app origin (not always envitefy.com).
 */
export function resolveEmailEmbedAssetUrl(params: {
  url: string;
  rawBlobUrl?: string | null;
  access?: BlobAccess | null;
}): string {
  const raw = (params.rawBlobUrl || "").trim();
  if (raw && /^https?:\/\//i.test(raw) && params.access !== "private") {
    return raw;
  }

  const url = (params.url || "").trim();
  if (!url) return "";

  // Already an absolute non-proxy URL (e.g. public CDN).
  if (/^https?:\/\//i.test(url) && !/\/api\/blob\//i.test(url)) {
    return url;
  }

  // Private proxy path — keep host flexible via buildPublicAssetUrl env resolution.
  return buildPublicAssetUrl(url.startsWith("/") || /^https?:\/\//i.test(url) ? url : `/${url}`);
}

export async function uploadWebpAsset(params: {
  scopeId: string;
  usage: UploadUsage;
  assetKind: "display" | "thumb" | "source";
  bytes: Buffer;
  width: number;
  height: number;
  access: BlobAccess;
}): Promise<WebpAsset> {
  const uploaded = await uploadBlobAsset({
    pathname: `event-media/${params.scopeId}/${params.usage}/${params.assetKind}.webp`,
    bytes: params.bytes,
    contentType: "image/webp",
    access: params.access,
  });
  return {
    ...uploaded,
    mimeType: "image/webp",
    width: params.width,
    height: params.height,
  };
}

function getImageMetadata(meta: Metadata): { width?: number; height?: number } {
  return {
    width: Number.isFinite(meta.width) ? meta.width : undefined,
    height: Number.isFinite(meta.height) ? meta.height : undefined,
  };
}

function resolveImageOptimizationOptions(
  options?: ImageOptimizationOptions,
): Required<ImageOptimizationOptions> {
  return {
    displayMaxWidth: options?.displayMaxWidth ?? SHARP_UPLOAD_PRESETS.displayMaxWidth,
    displayQuality: options?.displayQuality ?? SHARP_UPLOAD_PRESETS.displayQuality,
    thumbWidth: options?.thumbWidth ?? SHARP_UPLOAD_PRESETS.thumbWidth,
    thumbQuality: options?.thumbQuality ?? SHARP_UPLOAD_PRESETS.thumbQuality,
    includeThumb: options?.includeThumb ?? true,
  };
}

export async function readAndValidateUploadFile(file: File, usage: UploadUsage): Promise<ValidatedUpload> {
  const validation = validateUploadFileMeta({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    usage,
  });
  if (!validation.ok) {
    const error = new Error(validation.error) as Error & { status?: number };
    error.status = validation.status;
    throw error;
  }

  return {
    bytes: Buffer.from(await file.arrayBuffer()),
    fileName: file.name || "upload",
    mimeType: validation.mimeType,
    sizeBytes: file.size,
    kind: validation.kind,
  };
}

export async function renderImageVariants(
  inputBuffer: Buffer,
  options?: ImageOptimizationOptions,
): Promise<{
  display: { bytes: Buffer; width: number; height: number };
  thumb: { bytes: Buffer; width: number; height: number } | null;
}> {
  const resolved = resolveImageOptimizationOptions(options);
  const displayBytes = await encodeScanArtworkWebp(inputBuffer, {
    maxWidth: resolved.displayMaxWidth,
    quality: resolved.displayQuality,
  });
  const displayMeta = await sharp(displayBytes).metadata();

  if (!resolved.includeThumb) {
    return {
      display: {
        bytes: displayBytes,
        width: displayMeta.width || 1,
        height: displayMeta.height || 1,
      },
      thumb: null,
    };
  }

  const thumbBytes = await sharp(displayBytes)
    .resize({
      width: resolved.thumbWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: resolved.thumbQuality })
    .toBuffer();
  const thumbMeta = await sharp(thumbBytes).metadata();
  await sharp(thumbBytes, { failOn: "warning" }).raw().toBuffer();

  return {
    display: {
      bytes: displayBytes,
      width: displayMeta.width || 1,
      height: displayMeta.height || 1,
    },
    thumb: {
      bytes: thumbBytes,
      width: thumbMeta.width || 1,
      height: thumbMeta.height || 1,
    },
  };
}

export async function processImageBufferForUpload(inputBuffer: Buffer): Promise<{
  original: { width?: number; height?: number };
  display: { bytes: Buffer; width: number; height: number };
  thumb: { bytes: Buffer; width: number; height: number };
}> {
  const processed = await processImageBufferWithVariants(inputBuffer);
  if (!processed.thumb) {
    throw new Error("Could not generate upload thumbnail");
  }
  return {
    original: processed.original,
    display: processed.display,
    thumb: processed.thumb,
  };
}

export async function processImageBufferWithVariants(
  inputBuffer: Buffer,
  options?: ImageOptimizationOptions,
): Promise<{
  original: { width?: number; height?: number };
  display: { bytes: Buffer; width: number; height: number };
  thumb: { bytes: Buffer; width: number; height: number } | null;
}> {
  const originalMeta = await sharp(inputBuffer).metadata();
  const variants = await renderImageVariants(inputBuffer, options);
  return {
    original: getImageMetadata(originalMeta),
    display: variants.display,
    thumb: variants.thumb,
  };
}

export async function processImageUpload(params: {
  validated: ValidatedUpload;
  scopeId: string;
  usage: UploadUsage;
}): Promise<UploadResponse> {
  const processed = await processImageBufferWithVariants(params.validated.bytes);
  if (!processed.thumb) {
    throw new Error("Could not generate upload thumbnail");
  }
  const originalMeta = await sharp(params.validated.bytes).metadata();
  const orientedWidth = originalMeta.autoOrient.width;
  // Full-resolution artwork is kept for printing/editing. Reuse the display when
  // it already has the full dimensions instead of uploading an identical source.
  const sourceBytes = orientedWidth > processed.display.width
    ? await encodeScanArtworkWebp(params.validated.bytes)
    : null;
  const sourceMeta = sourceBytes ? await sharp(sourceBytes).metadata() : null;
  const [display, thumb] = await Promise.all([
    uploadWebpAsset({
      scopeId: params.scopeId,
      usage: params.usage,
      assetKind: "display",
      bytes: processed.display.bytes,
      width: processed.display.width,
      height: processed.display.height,
      access: "public",
    }),
    uploadWebpAsset({
      scopeId: params.scopeId,
      usage: params.usage,
      assetKind: "thumb",
      bytes: processed.thumb.bytes,
      width: processed.thumb.width,
      height: processed.thumb.height,
      access: "public",
    }),
  ]);
  const source = sourceBytes && sourceMeta
    ? await uploadWebpAsset({
        scopeId: params.scopeId,
        usage: params.usage,
        assetKind: "source",
        bytes: sourceBytes,
        width: sourceMeta.width || 1,
        height: sourceMeta.height || 1,
        access: "public",
      })
    : display;

  const attachment =
    params.usage === "attachment"
      ? {
          name: getImageOutputName(params.validated.fileName),
          type: "image/webp",
          dataUrl: source.url,
          sizeBytes: source.sizeBytes,
          width: source.width,
          height: source.height,
          previewImageUrl: display.url,
          thumbnailUrl: thumb.url,
          thumbnailWidth: thumb.width,
          thumbnailHeight: thumb.height,
          thumbnailMimeType: "image/webp" as const,
          thumbnailSizeBytes: thumb.sizeBytes,
          storageKind: "blob" as const,
          optimizedFromMimeType: params.validated.mimeType,
          originalName: params.validated.fileName,
          originalType: params.validated.mimeType,
          originalSizeBytes: params.validated.sizeBytes,
        }
      : undefined;

  return {
    ok: true,
    kind: "image",
    original: {
      name: params.validated.fileName,
      mimeType: params.validated.mimeType,
      sizeBytes: params.validated.sizeBytes,
      ...processed.original,
    },
    stored: {
      display: {
        url: display.url,
        mimeType: "image/webp",
        width: display.width,
        height: display.height,
        sizeBytes: display.sizeBytes,
      },
      thumb: {
        url: thumb.url,
        mimeType: "image/webp",
        width: thumb.width,
        height: thumb.height,
        sizeBytes: thumb.sizeBytes,
      },
      source: {
        url: source.url,
        mimeType: "image/webp",
        sizeBytes: source.sizeBytes,
        width: source.width,
        height: source.height,
      },
    },
    eventMedia: {
      thumbnail: display.url,
      thumbnailMeta: {
        mimeType: "image/webp",
        width: display.width,
        height: display.height,
        sizeBytes: display.sizeBytes,
      },
      attachment,
    },
  };
}

/** Photo-only entry points keep PDF processing out of their module graph. */
export { processPublicImageUpload as processPublicUpload, processBufferImageUpload as processBufferUpload };

export async function processPublicImageUpload(params: PublicUploadParams): Promise<UploadResponse> {
  const validated = await readAndValidateUploadFile(params.file, params.usage);
  return processValidatedImageUpload({ ...params, validated });
}

export async function processBufferImageUpload(params: BufferUploadParams): Promise<UploadResponse> {
  const validation = validateUploadFileMeta({
    fileName: params.fileName, mimeType: params.mimeType,
    sizeBytes: params.bytes.length, usage: params.usage,
  });
  if (!validation.ok) {
    throw Object.assign(new Error(validation.error), { status: validation.status });
  }
  return processValidatedImageUpload({ ...params, validated: {
    bytes: params.bytes, fileName: params.fileName || "upload",
    mimeType: validation.mimeType, sizeBytes: params.bytes.length, kind: validation.kind,
  } });
}

async function processValidatedImageUpload(params: {
  validated: ValidatedUpload; usage: UploadUsage; eventId?: string | null; uploadToken?: string | null;
}): Promise<UploadResponse> {
  if (params.validated.kind !== "image") {
    throw Object.assign(new Error("Choose a JPG, PNG or WebP image"), { status: 415 });
  }
  return processImageUpload({
    validated: params.validated, usage: params.usage,
    scopeId: getScopeId(params.eventId, params.uploadToken),
  });
}
