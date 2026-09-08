"use client";

import { isAllowedStudioReferenceImageUrl } from "@/lib/studio/reference-image-url";
import type { StudioGenerateMode } from "@/lib/studio/types";
import { readGenerationStream, type GenerationOptions } from "@/lib/studio/generation-progress";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import { buildStudioRequest } from "./studio-workspace-builders";
import { sanitizeStudioGenerateResponse } from "./studio-workspace-sanitize";
import type { EventDetails, MediaType } from "./studio-workspace-types";
import {
  isRecord,
  STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
  sanitizeGuestImageUrls,
} from "./studio-workspace-utils";

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
  const propertyImageUrls = sanitizeGuestImageUrls(details.propertyImageUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_PROPERTY_IMAGE_URL_MAX,
  );
  const realtorImageUrls = sanitizeGuestImageUrls(details.realtorImageUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_REALTOR_IMAGE_URL_MAX,
  );
  const realtorLogoUrls = sanitizeGuestImageUrls(details.realtorLogoUrls).slice(
    0,
    STUDIO_OPEN_HOUSE_REALTOR_LOGO_URL_MAX,
  );
  const allImageUrls = [
    ...guestImageUrls,
    ...propertyImageUrls,
    ...realtorImageUrls,
    ...realtorLogoUrls,
  ];
  if (allImageUrls.length === 0) {
    return details;
  }

  async function prepareUrls(urls: string[], filePrefix: string): Promise<string[]> {
    const preparedUrls: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const raw = urls[i] || "";
      const persisted = await persistImageMediaValue({
        value: raw,
        fileName: `${filePrefix}-${i + 1}.png`,
        fallbackValue: raw,
      });
      const finalUrl = toAllowedStudioReferenceImageUrl(persisted || raw);
      if (!finalUrl || !isAllowedStudioReferenceImageUrl(finalUrl)) {
        throw new Error(STUDIO_REFERENCE_IMAGE_ERROR);
      }
      preparedUrls.push(finalUrl);
    }

    if (preparedUrls.length !== urls.length) {
      throw new Error(STUDIO_REFERENCE_IMAGE_ERROR);
    }
    return preparedUrls;
  }

  const preparedGuestImageUrls = await prepareUrls(guestImageUrls, "studio-reference");
  const preparedPropertyImageUrls = await prepareUrls(propertyImageUrls, "studio-property");
  const preparedRealtorImageUrls = await prepareUrls(realtorImageUrls, "studio-realtor");
  const preparedRealtorLogoUrls = await prepareUrls(realtorLogoUrls, "studio-realtor-logo");

  return {
    ...details,
    guestImageUrls: preparedGuestImageUrls,
    propertyImageUrls: preparedPropertyImageUrls,
    realtorImageUrls: preparedRealtorImageUrls,
    realtorLogoUrls: preparedRealtorLogoUrls,
  };
}

export async function requestStudioGeneration(
  details: EventDetails,
  mode: StudioGenerateMode,
  surface: MediaType,
  editPrompt?: string,
  sourceImageDataUrl?: string,
  previousDetails?: EventDetails,
  options: GenerationOptions = {},
) {
  options.onProgress?.({ type: "stage", stage: "preparing" });
  const preparedDetails = await prepareStudioDetailsForGeneration(details);
  const response = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.onProgress ? { Accept: "application/x-ndjson" } : {}) },
    signal: options.signal,
    body: JSON.stringify(
      buildStudioRequest(
        preparedDetails,
        mode,
        surface,
        editPrompt,
        sourceImageDataUrl,
        previousDetails,
      ),
    ),
  });

  let rawData: unknown = null;
  if (response.ok && response.headers.get("content-type")?.includes("application/x-ndjson") && response.body) {
    rawData = await readGenerationStream(response.body, options.onProgress);
  } else rawData = await response.json().catch(() => null);

  const data = sanitizeStudioGenerateResponse(rawData);
  if (process.env.NODE_ENV === "development" && data?.ok && data.timings) {
    console.info("studio_generation_client_run", JSON.stringify(data.timings));
  }

  if (!response.ok || !data || !data.ok) {
    const errorMessage =
      data?.errors?.image?.message ||
      data?.errors?.text?.message ||
      (isRecord(rawData) && typeof rawData.message === "string" ? rawData.message : "") ||
      `Studio generation failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  if (sourceImageDataUrl && mode !== "text" && !data.imageUrl && !data.imageDataUrl) {
    throw new Error(
      data.errors?.image?.message ||
        "The live-card image edit did not return an updated image. Try a more specific visual edit.",
    );
  }

  return { ...data, preparedDetails };
}
