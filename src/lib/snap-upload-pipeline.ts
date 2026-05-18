"use client";

import { prepareOcrUploadFile } from "@/utils/media-upload-client";

export type SnapOcrUploadResult = {
  ocrText?: string | null;
  fieldsGuess?: Record<string, unknown> | null;
  category?: string | null;
  birthdayTemplateHint?: unknown;
  ocrSkin?: Record<string, unknown> | null;
  thumbnailFocus?: unknown;
  openHouse?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function cloneFileForUpload(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return new File([arrayBuffer], file.name, {
      type: file.type || "application/octet-stream",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function normalizeOcrUploadPayload(payload: unknown): SnapOcrUploadResult {
  const record = asRecord(payload) || {};
  return {
    ocrText: typeof record.ocrText === "string" ? record.ocrText : null,
    fieldsGuess: asRecord(record.fieldsGuess),
    category: typeof record.category === "string" ? record.category : null,
    birthdayTemplateHint: record.birthdayTemplateHint ?? null,
    ocrSkin: asRecord(record.ocrSkin),
    thumbnailFocus: record.thumbnailFocus ?? null,
    openHouse: asRecord(record.openHouse),
  };
}

export async function runSnapOcrUpload(params: {
  file: File;
  scanAttemptId: string;
  timeoutMs?: number;
}): Promise<SnapOcrUploadResult> {
  const preparedFile = await prepareOcrUploadFile(params.file);
  const fileToUpload = await cloneFileForUpload(preparedFile);
  const form = new FormData();
  form.append("file", fileToUpload);
  form.append("scanAttemptId", params.scanAttemptId);

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(params.timeoutMs) ? Math.max(1000, params.timeoutMs!) : 75_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch("/api/ocr?fast=0", {
      method: "POST",
      body: form,
      signal: controller.signal,
      mode: "cors",
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Upload timed out. Please check your connection and try again.");
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Upload failed: ${message}. Please check your connection and try again.`);
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const record = asRecord(payload);
    const serverError = typeof record?.error === "string" ? record.error.trim() : "";
    throw new Error(serverError || `Server error (${response.status})`);
  }

  return normalizeOcrUploadPayload(payload);
}
