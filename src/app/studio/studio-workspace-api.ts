"use client";

import type { StudioGenerateMode } from "@/lib/studio/types";
import { isAllowedStudioReferenceImageUrl } from "@/lib/studio/reference-image-url";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import { buildStudioRequest } from "./studio-workspace-builders";
import { isRecord, sanitizeGuestImageUrls } from "./studio-workspace-utils";
import { sanitizeStudioGenerateResponse } from "./studio-workspace-sanitize";
import type { EventDetails, MediaType } from "./studio-workspace-types";

const STUDIO_REFERENCE_IMAGE_ERROR =
  "The invite was not generated because attached reference photos could not be used. Re-upload the photos and try again.";

function toAllowedStudioReferenceImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && typeof window !== "undefined") {
    return new URL(trimmed, window.location.origin).toString();
  }
  return trimmed;
}

async function prepareStudioDetailsForGeneration(details: EventDetails): Promise<EventDetails> {
  const guestImageUrls = sanitizeGuestImageUrls(details.guestImageUrls);
  if (guestImageUrls.length === 0) {
    return details;
  }

  const preparedGuestImageUrls: string[] = [];
  for (let i = 0; i < guestImageUrls.length; i++) {
    const raw = guestImageUrls[i] || "";
    const persisted = await persistImageMediaValue({
      value: raw,
      fileName: `studio-reference-${i + 1}.png`,
      fallbackValue: raw,
    });
    const finalUrl = toAllowedStudioReferenceImageUrl(persisted || raw);
    if (!finalUrl || !isAllowedStudioReferenceImageUrl(finalUrl)) {
      throw new Error(STUDIO_REFERENCE_IMAGE_ERROR);
    }
    preparedGuestImageUrls.push(finalUrl);
  }

  if (preparedGuestImageUrls.length !== guestImageUrls.length) {
    throw new Error(STUDIO_REFERENCE_IMAGE_ERROR);
  }

  return { ...details, guestImageUrls: preparedGuestImageUrls };
}

export async function requestStudioGeneration(
  details: EventDetails,
  mode: StudioGenerateMode,
  surface: MediaType,
  editPrompt?: string,
  sourceImageDataUrl?: string,
) {
  const preparedDetails = await prepareStudioDetailsForGeneration(details);
  const response = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildStudioRequest(preparedDetails, mode, surface, editPrompt, sourceImageDataUrl),
    ),
  });

  let rawData: unknown = null;
  try {
    rawData = await response.json();
  } catch {
    rawData = null;
  }

  const data = sanitizeStudioGenerateResponse(rawData);

  if (!response.ok || !data || !data.ok) {
    const errorMessage =
      data?.errors?.image?.message ||
      data?.errors?.text?.message ||
      (isRecord(rawData) && typeof rawData.message === "string" ? rawData.message : "") ||
      `Studio generation failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return { ...data, preparedDetails };
}
