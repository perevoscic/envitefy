import { put } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { absoluteUrl } from "./absolute-url.ts";
import {
  type UploadKind,
  type UploadResponse,
  type UploadUsage,
  SHARP_UPLOAD_PRESETS,
  validateUploadFileMeta,
} from "./upload-config.ts";
import { optimizePdfWithQpdf } from "./pdf-optimize.ts";
import { rasterizePdfPageToPng } from "./pdf-raster.ts";

type BlobAccess = "public" | "private";

type BlobAsset = {
  url: string;
  pathname: string;
  sizeBytes: number;
  access: BlobAccess;
};

type ValidatedUpload = {
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

const PRIVATE_STORE_ACCESS_ERROR = /cannot use public access on a private store/i;

let detectedBlobStoreAccess: BlobAccess | null = null;

type PublicUploadParams = {
  file: File;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
};

type BufferUploadParams = {
  bytes: Buffer;
  fileName: string;
  mimeType?: string | null;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
};

type DiscoverySourceResult = {
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

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "upload";
}

function getScopeId(eventId?: string | null, uploadToken?: string | null): string {
  return sanitizePathSegment(String(eventId || uploadToken || `upload-${randomUUID()}`));
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function getImageOutputName(fileName: string): string {
  return `${sanitizePathSegment(stripExtension(fileName)) || "image"}.webp`;
}

function getOriginalOutputName(fileName: string): string {
  return sanitizePathSegment(fileName || "image") || "image";
}

function isPrivateStoreAccessError(error: unknown): boolean {
  return error instanceof Error && PRIVATE_STORE_ACCESS_ERROR.test(error.message);
}

function buildPrivateBlobProxyPath(pathname: string): string {
  const encodedPath = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/blob/${encodedPath}`;
}

async function resolveBlobAssetUrl(pathname: string, blobUrl: string, access: BlobAccess): Promise<string> {
  if (access === "public") return blobUrl;
  return absoluteUrl(buildPrivateBlobProxyPath(pathname));
}

async function uploadBlobAsset(params: UploadBlobParams): Promise<BlobAsset> {
  const preferredAccess = detectedBlobStoreAccess || params.access;
  let blob: Awaited<ReturnType<typeof put>>;
  let resolvedAccess = preferredAccess;
  try {
    blob = await put(params.pathname, params.bytes, {
      access: preferredAccess,
      contentType: params.contentType || "application/octet-stream",
    });
  } catch (error) {
    if (preferredAccess !== "public" || !isPrivateStoreAccessError(error)) {
      throw error;
    }
    resolvedAccess = "private";
    blob = await put(params.pathname, params.bytes, {
      access: resolvedAccess,
      contentType: params.contentType || "application/octet-stream",
    });
  }
  detectedBlobStoreAccess = resolvedAccess;
  return {
    url: await resolveBlobAssetUrl(blob.pathname, blob.url, resolvedAccess),
    pathname: blob.pathname,
    sizeBytes: params.bytes.length,
    access: resolvedAccess,
  };
}

async function uploadWebpAsset(params: {
  scopeId: string;
  usage: UploadUsage;
  assetKind: "display" | "thumb";
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

function getImageMetadata(meta: sharp.Metadata): { width?: number; height?: number } {
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

async function renderImageVariants(
  inputBuffer: Buffer,
  options?: ImageOptimizationOptions,
): Promise<{
  display: { bytes: Buffer; width: number; height: number };
  thumb: { bytes: Buffer; width: number; height: number } | null;
}> {
  const resolved = resolveImageOptimizationOptions(options);
  const displayBytes = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: resolved.displayMaxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: resolved.displayQuality })
    .toBuffer();
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

async function processImageUpload(params: {
  validated: ValidatedUpload;
  scopeId: string;
  usage: UploadUsage;
}): Promise<UploadResponse> {
  const processed = await processImageBufferWithVariants(params.validated.bytes);
  if (!processed.thumb) {
    throw new Error("Could not generate upload thumbnail");
  }
  const [display, thumb, source] = await Promise.all([
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
    uploadBlobAsset({
      pathname: `event-media/${params.scopeId}/${params.usage}/${getOriginalOutputName(
        params.validated.fileName,
      )}`,
      bytes: params.validated.bytes,
      contentType: params.validated.mimeType,
      access: "public",
    }),
  ]);

  const attachment =
    params.usage === "attachment"
      ? {
          name: params.validated.fileName,
          type: params.validated.mimeType,
          dataUrl: source.url,
          sizeBytes: params.validated.sizeBytes,
          width: processed.original.width,
          height: processed.original.height,
          previewImageUrl: display.url,
          thumbnailUrl: thumb.url,
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
        mimeType: params.validated.mimeType,
        sizeBytes: params.validated.sizeBytes,
        width: processed.original.width,
        height: processed.original.height,
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

async function processPdfUpload(params: {
  validated: ValidatedUpload;
  scopeId: string;
}): Promise<UploadResponse> {
  const optimized = await optimizePdfWithQpdf(params.validated.bytes);
  const pdfBytes = optimized.buffer;
  const previewPng = await rasterizePdfPageToPng(pdfBytes, 0);
  if (!previewPng) {
    throw new Error("Could not render PDF preview image");
  }

  const variants = await renderImageVariants(previewPng);
  const [display, thumb, source] = await Promise.all([
    uploadWebpAsset({
      scopeId: params.scopeId,
      usage: "attachment",
      assetKind: "display",
      bytes: variants.display.bytes,
      width: variants.display.width,
      height: variants.display.height,
      access: "public",
    }),
    uploadWebpAsset({
      scopeId: params.scopeId,
      usage: "attachment",
      assetKind: "thumb",
      bytes: variants.thumb.bytes,
      width: variants.thumb.width,
      height: variants.thumb.height,
      access: "public",
    }),
    uploadBlobAsset({
      pathname: `event-media/${params.scopeId}/attachment/source.pdf`,
      bytes: pdfBytes,
      contentType: "application/pdf",
      access: "public",
    }),
  ]);

  return {
    ok: true,
    kind: "pdf",
    original: {
      name: params.validated.fileName,
      mimeType: params.validated.mimeType,
      sizeBytes: params.validated.sizeBytes,
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
        mimeType: "application/pdf",
        sizeBytes: source.sizeBytes,
        optimizedByQpdf: optimized.optimizedByQpdf,
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
      attachment: {
        name: params.validated.fileName,
        type: "application/pdf",
        dataUrl: source.url,
        sizeBytes: source.sizeBytes,
        previewImageUrl: display.url,
        thumbnailUrl: thumb.url,
        storageKind: "blob",
        originalName: params.validated.fileName,
        originalType: params.validated.mimeType,
        originalSizeBytes: params.validated.sizeBytes,
        optimizedByQpdf: optimized.optimizedByQpdf,
      },
    },
  };
}

async function processValidatedUpload(params: {
  validated: ValidatedUpload;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
}): Promise<UploadResponse> {
  const scopeId = getScopeId(params.eventId, params.uploadToken);
  console.log("[media-upload] processing", {
    scopeId,
    usage: params.usage,
    fileName: params.validated.fileName,
    mimeType: params.validated.mimeType,
    inputType: params.validated.kind,
    originalSize: params.validated.sizeBytes,
  });

  const response =
    params.validated.kind === "pdf"
      ? await processPdfUpload({ validated: params.validated, scopeId })
      : await processImageUpload({
          validated: params.validated,
          scopeId,
          usage: params.usage,
        });

  console.log("[media-upload] complete", {
    scopeId,
    usage: params.usage,
    kind: response.kind,
    originalSize: response.original.sizeBytes,
    displaySize: response.stored.display?.sizeBytes || null,
    sourceSize: response.stored.source?.sizeBytes || null,
    optimizedByQpdf: response.stored.source?.optimizedByQpdf ?? null,
  });

  return response;
}

export async function processPublicUpload(params: PublicUploadParams): Promise<UploadResponse> {
  const validated = await readAndValidateUploadFile(params.file, params.usage);
  return processValidatedUpload({
    validated,
    usage: params.usage,
    eventId: params.eventId,
    uploadToken: params.uploadToken,
  });
}

export async function processBufferUpload(params: BufferUploadParams): Promise<UploadResponse> {
  const validation = validateUploadFileMeta({
    fileName: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.bytes.length,
    usage: params.usage,
  });
  if (!validation.ok) {
    const error = new Error(validation.error) as Error & { status?: number };
    error.status = validation.status;
    throw error;
  }

  return processValidatedUpload({
    validated: {
      bytes: params.bytes,
      fileName: params.fileName || "upload",
      mimeType: validation.mimeType,
      sizeBytes: params.bytes.length,
      kind: validation.kind,
    },
    usage: params.usage,
    eventId: params.eventId,
    uploadToken: params.uploadToken,
  });
}

export async function prepareDiscoverySourceFile(file: File): Promise<DiscoverySourceResult> {
  const validated = await readAndValidateUploadFile(file, "attachment");
  if (validated.kind === "pdf") {
    const optimized = await optimizePdfWithQpdf(validated.bytes);
    return {
      fileName: `${sanitizePathSegment(stripExtension(validated.fileName)) || "source"}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: optimized.buffer.length,
      kind: "pdf",
      buffer: optimized.buffer,
      originalName: validated.fileName,
      originalMimeType: validated.mimeType,
      originalSizeBytes: validated.sizeBytes,
      optimizedByQpdf: optimized.optimizedByQpdf,
    };
  }

  const processed = await processImageBufferWithVariants(validated.bytes, {
    includeThumb: false,
  });

  return {
    fileName: getImageOutputName(validated.fileName),
    mimeType: "image/webp",
    sizeBytes: processed.display.bytes.length,
    kind: "image",
    buffer: processed.display.bytes,
    originalName: validated.fileName,
    originalMimeType: validated.mimeType,
    originalSizeBytes: validated.sizeBytes,
  };
}
