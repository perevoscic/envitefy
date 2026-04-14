"use client";

import type { StudioGenerateMode } from "@/lib/studio/types";
import { buildStudioRequest } from "./studio-workspace-builders";
import { isRecord } from "./studio-workspace-utils";
import { sanitizeStudioGenerateResponse } from "./studio-workspace-sanitize";
import type { EventDetails, MediaType } from "./studio-workspace-types";

export async function requestStudioGeneration(
  details: EventDetails,
  mode: StudioGenerateMode,
  surface: MediaType,
  editPrompt?: string,
  sourceImageDataUrl?: string,
) {
  const response = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildStudioRequest(details, mode, surface, editPrompt, sourceImageDataUrl)),
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

  return data;
}
