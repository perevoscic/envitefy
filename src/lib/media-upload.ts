// General attachment uploads support PDFs. Image-only callers import
// media-upload-image directly so authentication and photo routes stay lightweight.
import {
  getScopeId,
  getImageOutputName,
  sanitizePathSegment,
  stripExtension,
  uploadBlobAsset,
  uploadWebpAsset,
  renderImageVariants,
  processImageUpload,
  processImageBufferWithVariants,
  readAndValidateUploadFile,
  type ValidatedUpload,
  type PublicUploadParams,
  type BufferUploadParams,
  type DiscoverySourceResult,
} from "./media-upload-image.ts";
import { validateUploadFileMeta, type UploadResponse, type UploadUsage } from "./upload-config.ts";

// Preserve the existing shared upload API for legacy callers.
export {
  processImageBufferForUpload,
  processImageBufferWithVariants,
  readAndValidateUploadFile,
  uploadPublicBinaryAsset,
  uploadPrivateBinaryAsset,
  resolveEmailEmbedAssetUrl,
} from "./media-upload-image.ts";

async function processPdfUpload(params: {
  validated: ValidatedUpload;
  scopeId: string;
}): Promise<UploadResponse> {
  // Only a validated PDF reaches this branch; photos never load either module.
  const [{ optimizePdfWithQpdf }, { rasterizePdfPageToPng }] = await Promise.all([
    import("./pdf-optimize.ts"),
    import("./pdf-raster.ts"),
  ]);
  const optimized = await optimizePdfWithQpdf(params.validated.bytes);
  const pdfBytes = optimized.buffer;
  const previewPng = await rasterizePdfPageToPng(pdfBytes, 0);
  if (!previewPng) {
    throw new Error("Could not render PDF preview image");
  }

  const variants = await renderImageVariants(previewPng);
  if (!variants.thumb) {
    throw new Error("Could not generate PDF preview thumbnail");
  }
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
      bytes: params.validated.bytes,
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
        optimizedByQpdf: false,
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
        thumbnailWidth: thumb.width,
        thumbnailHeight: thumb.height,
        thumbnailMimeType: "image/webp",
        thumbnailSizeBytes: thumb.sizeBytes,
        storageKind: "blob",
        originalName: params.validated.fileName,
        originalType: params.validated.mimeType,
        originalSizeBytes: params.validated.sizeBytes,
        optimizedByQpdf: false,
      },
    },
  };
}

async function processValidatedUpload(params: {
  validated: ValidatedUpload;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
  scanAttemptId?: string | null;
}): Promise<UploadResponse> {
  const scopeId = getScopeId(params.eventId, params.uploadToken);
  console.log("[media-upload] processing", {
    scopeId,
    usage: params.usage,
    fileName: params.validated.fileName,
    mimeType: params.validated.mimeType,
    inputType: params.validated.kind,
    originalSize: params.validated.sizeBytes,
    scanAttemptId: params.scanAttemptId || null,
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
    scanAttemptId: params.scanAttemptId || null,
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
    scanAttemptId: params.scanAttemptId,
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
    scanAttemptId: params.scanAttemptId,
  });
}

export async function prepareDiscoverySourceFile(file: File): Promise<DiscoverySourceResult> {
  const validated = await readAndValidateUploadFile(file, "attachment");
  if (validated.kind === "pdf") {
    const { optimizePdfWithQpdf } = await import("./pdf-optimize.ts");
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
