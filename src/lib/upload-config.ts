export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PDF_UPLOAD_MIME_TYPE = "application/pdf" as const;

export const UPLOAD_USAGES = ["attachment", "header"] as const;

export type UploadUsage = (typeof UPLOAD_USAGES)[number];
export type UploadKind = "image" | "pdf";

export const UPLOAD_LIMITS = {
  imageBytes: 10 * 1024 * 1024,
  pdfBytes: 25 * 1024 * 1024,
} as const;

export const SHARP_UPLOAD_PRESETS = {
  displayMaxWidth: 1900,
  displayQuality: 80,
  thumbWidth: 400,
  thumbQuality: 60,
} as const;

export type UploadValidationResult =
  | {
      ok: true;
      kind: UploadKind;
      mimeType: string;
    }
  | {
      ok: false;
      error: string;
      status: 400 | 413 | 415;
    };

export type UploadResponse = {
  ok: true;
  kind: UploadKind;
  original: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  };
  stored: {
    display?: {
      url: string;
      mimeType: "image/webp";
      width: number;
      height: number;
      sizeBytes: number;
    };
    thumb?: {
      url: string;
      mimeType: "image/webp";
      width: number;
      height: number;
      sizeBytes: number;
    };
    source?: {
      url: string;
      mimeType: string;
      sizeBytes: number;
      optimizedByQpdf?: boolean;
    };
  };
  eventMedia: {
    thumbnail?: string;
    thumbnailMeta?: {
      mimeType: string;
      width: number;
      height: number;
      sizeBytes: number;
    };
    attachment?: {
      name: string;
      type: string;
      dataUrl: string;
      sizeBytes: number;
      width?: number;
      height?: number;
      previewImageUrl?: string;
      thumbnailUrl?: string;
      storageKind: "blob";
      optimizedFromMimeType?: string;
      originalName?: string;
      originalType?: string;
      originalSizeBytes?: number;
      optimizedByQpdf?: boolean;
    };
  };
};

export function isUploadUsage(value: unknown): value is UploadUsage {
  return typeof value === "string" && (UPLOAD_USAGES as readonly string[]).includes(value);
}

export function isImageUploadMimeType(value: unknown): value is (typeof IMAGE_UPLOAD_MIME_TYPES)[number] {
  return typeof value === "string" && (IMAGE_UPLOAD_MIME_TYPES as readonly string[]).includes(value);
}

export function getUploadSizeLimitBytes(kind: UploadKind): number {
  return kind === "pdf" ? UPLOAD_LIMITS.pdfBytes : UPLOAD_LIMITS.imageBytes;
}

export function getUploadSizeErrorMessage(kind: UploadKind): string {
  return kind === "pdf" ? "PDFs must be 25 MB or smaller." : "Images must be 10 MB or smaller.";
}

export function getUnsupportedUploadMessage(usage: UploadUsage): string {
  return usage === "header"
    ? "Unsupported file. Header uploads accept JPG, PNG, or WebP images."
    : "Unsupported file. Attachments accept JPG, PNG, WebP, or PDF.";
}

export function getAllowedMimeTypesForUsage(usage: UploadUsage): readonly string[] {
  return usage === "header"
    ? IMAGE_UPLOAD_MIME_TYPES
    : [...IMAGE_UPLOAD_MIME_TYPES, PDF_UPLOAD_MIME_TYPE];
}

export function getUploadAcceptAttribute(usage: UploadUsage): string {
  return usage === "header"
    ? IMAGE_UPLOAD_MIME_TYPES.join(",")
    : [...IMAGE_UPLOAD_MIME_TYPES, PDF_UPLOAD_MIME_TYPE].join(",");
}

export function getUploadKindFromMeta(params: {
  fileName?: string | null;
  mimeType?: string | null;
  usage: UploadUsage;
}): UploadKind | null {
  const mimeType = String(params.mimeType || "").trim().toLowerCase();
  if (isImageUploadMimeType(mimeType)) return "image";
  if (params.usage === "attachment" && mimeType === PDF_UPLOAD_MIME_TYPE) return "pdf";

  const fileName = String(params.fileName || "").trim().toLowerCase();
  if (/\.(jpe?g|png|webp)$/i.test(fileName)) return "image";
  if (params.usage === "attachment" && /\.pdf$/i.test(fileName)) return "pdf";
  return null;
}

export function validateUploadFileMeta(params: {
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  usage: UploadUsage;
}): UploadValidationResult {
  const kind = getUploadKindFromMeta(params);
  if (!kind) {
    return {
      ok: false,
      error: getUnsupportedUploadMessage(params.usage),
      status: 415,
    };
  }

  const sizeBytes = Number(params.sizeBytes || 0);
  const sizeLimit = getUploadSizeLimitBytes(kind);
  if (sizeBytes > sizeLimit) {
    return {
      ok: false,
      error: getUploadSizeErrorMessage(kind),
      status: 413,
    };
  }

  const normalizedMimeType =
    kind === "pdf"
      ? PDF_UPLOAD_MIME_TYPE
      : isImageUploadMimeType(params.mimeType)
        ? String(params.mimeType)
        : /\.png$/i.test(String(params.fileName || ""))
          ? "image/png"
          : /\.webp$/i.test(String(params.fileName || ""))
            ? "image/webp"
            : "image/jpeg";

  return {
    ok: true,
    kind,
    mimeType: normalizedMimeType,
  };
}

export function isInlineDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith("data:");
}

export function isRemoteMediaUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

export function resolveAttachmentPreviewUrl(
  attachment: Record<string, unknown> | null | undefined,
  fallbackThumbnail?: string | null,
): string | null {
  if (!attachment || typeof attachment !== "object") {
    return typeof fallbackThumbnail === "string" && fallbackThumbnail.trim() ? fallbackThumbnail : null;
  }

  const type = String(attachment.type || "").trim().toLowerCase();
  const dataUrl = typeof attachment.dataUrl === "string" ? attachment.dataUrl : null;
  const previewImageUrl =
    typeof attachment.previewImageUrl === "string" ? attachment.previewImageUrl : null;
  const thumbnailUrl =
    typeof attachment.thumbnailUrl === "string" ? attachment.thumbnailUrl : null;

  if (type.startsWith("image/") && dataUrl) return dataUrl;
  if (previewImageUrl) return previewImageUrl;
  if (thumbnailUrl) return thumbnailUrl;
  if (typeof fallbackThumbnail === "string" && fallbackThumbnail.trim()) return fallbackThumbnail;
  return null;
}

export function resolveCoverImageUrlFromEventData(data: Record<string, any> | null | undefined): string | null {
  if (!data || typeof data !== "object") return null;

  const explicitCover =
    typeof data.coverImageUrl === "string" && data.coverImageUrl.trim() ? data.coverImageUrl : null;
  if (explicitCover) return explicitCover;

  const thumbnail = typeof data.thumbnail === "string" && data.thumbnail.trim() ? data.thumbnail : null;
  if (thumbnail) return thumbnail;

  const customHeroImage =
    typeof data.customHeroImage === "string" && data.customHeroImage.trim()
      ? data.customHeroImage
      : null;
  if (customHeroImage) return customHeroImage;

  const heroImage = typeof data.heroImage === "string" && data.heroImage.trim() ? data.heroImage : null;
  if (heroImage) return heroImage;

  return resolveAttachmentPreviewUrl(
    data.attachment && typeof data.attachment === "object" ? data.attachment : null,
    null,
  );
}
