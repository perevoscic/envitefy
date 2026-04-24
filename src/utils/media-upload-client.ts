"use client";

import {
  type UploadResponse,
  type UploadUsage,
  getUploadAcceptAttribute,
  resolveAttachmentPreviewUrl,
  validateUploadFileMeta,
} from "@/lib/upload-config";
import { sanitizePersistedMediaUrl } from "@/lib/public-asset-url";
import type { SignupHeaderImageAsset } from "@/types/signup";

export function validateClientUploadFile(file: File, usage: UploadUsage): string | null {
  const validation = validateUploadFileMeta({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    usage,
  });
  return validation.ok ? null : validation.error;
}

export function createObjectUrlPreview(file: File | null): string | null {
  if (!(file instanceof File) || !file.type.startsWith("image/")) return null;
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {}
}

export async function uploadMediaFile(params: {
  file: File;
  usage: UploadUsage;
  eventId?: string | null;
  uploadToken?: string | null;
}): Promise<UploadResponse> {
  const formData = new FormData();
  formData.set("file", params.file);
  formData.set("usage", params.usage);
  if (params.eventId) formData.set("eventId", params.eventId);
  if (params.uploadToken) formData.set("uploadToken", params.uploadToken);

  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    throw new Error(
      typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Upload failed",
    );
  }
  return json as UploadResponse;
}

export function signupHeaderImageFromUpload(
  upload: UploadResponse,
  fallbackName = "image.webp",
): SignupHeaderImageAsset {
  return {
    name: upload.eventMedia.attachment?.name || fallbackName,
    type: upload.stored.display?.mimeType || "image/webp",
    dataUrl:
      sanitizePersistedMediaUrl(upload.stored.display?.url || upload.eventMedia.thumbnail || "") || "",
    thumbnailUrl: sanitizePersistedMediaUrl(
      upload.stored.thumb?.url || upload.eventMedia.thumbnail || null,
    ),
    sizeBytes: upload.stored.display?.sizeBytes ?? null,
    width: upload.stored.display?.width ?? null,
    height: upload.stored.display?.height ?? null,
    originalName: upload.original.name || fallbackName,
    originalType: upload.original.mimeType || null,
    originalSizeBytes: upload.original.sizeBytes ?? null,
    optimizedFromMimeType:
      upload.eventMedia.attachment?.optimizedFromMimeType || upload.original.mimeType || null,
  };
}

export async function uploadSignupHeaderImage(file: File): Promise<SignupHeaderImageAsset> {
  const upload = await uploadMediaFile({
    file,
    usage: "header",
  });
  return signupHeaderImageFromUpload(upload, file.name || "image.webp");
}

async function fileFromMediaValue(value: string, fileName: string): Promise<File | null> {
  try {
    const response = await fetch(value);
    const blob = await response.blob();
    const mimeType =
      blob.type ||
      (value.startsWith("data:") ? value.slice(5, value.indexOf(";base64,")) : "") ||
      "image/png";
    return new File([blob], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
}

function isLegacyLocalUploadPath(value: string): boolean {
  return /^\/uploads\//i.test(value);
}

export async function persistImageMediaValue(params: {
  value?: string | null;
  eventId?: string | null;
  uploadToken?: string | null;
  fileName?: string;
  fallbackValue?: string | null;
}): Promise<string | null> {
  const value = typeof params.value === "string" ? params.value.trim() : "";
  if (!value) return sanitizePersistedMediaUrl(params.fallbackValue);
  if (/^https?:\/\//i.test(value) || (value.startsWith("/") && !isLegacyLocalUploadPath(value))) {
    return sanitizePersistedMediaUrl(value);
  }
  if (!value.startsWith("blob:") && !value.startsWith("data:")) {
    if (isLegacyLocalUploadPath(value)) {
      const file = await fileFromMediaValue(value, params.fileName || "event-image.png");
      if (!file) return params.fallbackValue || null;
      const upload = await uploadMediaFile({
        file,
        usage: "header",
        eventId: params.eventId,
        uploadToken: params.uploadToken,
      });
      return sanitizePersistedMediaUrl(
        upload.stored.display?.url || upload.eventMedia.thumbnail || params.fallbackValue || null,
      );
    }
    return sanitizePersistedMediaUrl(params.fallbackValue);
  }

  const file = await fileFromMediaValue(value, params.fileName || "event-image.png");
  if (!file) return params.fallbackValue || null;
  const upload = await uploadMediaFile({
    file,
    usage: "header",
    eventId: params.eventId,
    uploadToken: params.uploadToken,
  });
  return sanitizePersistedMediaUrl(
    upload.stored.display?.url || upload.eventMedia.thumbnail || params.fallbackValue || null,
  );
}

export function mergeUploadedEventMedia(params: {
  headerUpload?: UploadResponse | null;
  attachmentUpload?: UploadResponse | null;
  existingThumbnail?: string | null;
  existingThumbnailMeta?: Record<string, unknown> | null;
  existingAttachment?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  if (params.attachmentUpload?.eventMedia.attachment) {
    next.attachment = params.attachmentUpload.eventMedia.attachment;
  } else if (params.existingAttachment) {
    next.attachment = params.existingAttachment;
  }

  const winningThumbnail =
    params.headerUpload?.eventMedia.thumbnail ??
    params.attachmentUpload?.eventMedia.thumbnail ??
    params.existingThumbnail;
  if (winningThumbnail) {
    next.thumbnail = winningThumbnail;
  }

  const winningThumbnailMeta =
    params.headerUpload?.eventMedia.thumbnailMeta ??
    params.attachmentUpload?.eventMedia.thumbnailMeta ??
    params.existingThumbnailMeta;
  if (winningThumbnailMeta) {
    next.thumbnailMeta = winningThumbnailMeta;
  }

  return next;
}

export function getAttachmentPreviewForEditor(params: {
  attachment?: Record<string, unknown> | null;
  thumbnail?: string | null;
}): string | null {
  return resolveAttachmentPreviewUrl(params.attachment, params.thumbnail || null);
}

export { getUploadAcceptAttribute };
