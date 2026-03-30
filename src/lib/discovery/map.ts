import { DEFAULT_GYM_MEET_TEMPLATE_ID } from "@/components/gym-meet-templates/registry";
import { getEventHistoryById } from "@/lib/db";
import { safeString, uniqueStrings } from "@/lib/discovery/shared";
import type { EventDiscoveryRow, GymBuilderDraft } from "@/lib/discovery/types";
import { mapParseResultToGymData } from "@/lib/meet-discovery";

export function buildGymBuilderDraft(params: {
  mappedData: Record<string, any>;
  reviewFlags?: string[];
}): GymBuilderDraft {
  const mappedData = params.mappedData || {};
  const venue = {
    venue: safeString(mappedData.venue),
    address: safeString(mappedData.address),
    city: safeString(mappedData.city),
    state: safeString(mappedData.state),
    location: safeString(mappedData.location),
  };
  return {
    event: {
      ...mappedData,
      pageTemplateId: safeString(mappedData.pageTemplateId) || DEFAULT_GYM_MEET_TEMPLATE_ID,
      templateId: safeString(mappedData.templateId) || "gymnastics-schedule",
      createdVia: "meet-discovery-v2",
      category: "gymnastics",
    },
    venue,
    advancedSections:
      mappedData.advancedSections && typeof mappedData.advancedSections === "object"
        ? mappedData.advancedSections
        : {},
    canonicalLinks: {
      links: Array.isArray(mappedData.links) ? mappedData.links : [],
      scoresLink: safeString(mappedData?.advancedSections?.meet?.scoresLink),
    },
    reviewFlags: uniqueStrings(params.reviewFlags || [], 24),
  };
}

export async function runDiscoveryMapStage(discovery: EventDiscoveryRow) {
  const row = await getEventHistoryById(discovery.eventId);
  if (!row) throw new Error("Event shell not found");
  const currentData = (row.data || {}) as Record<string, any>;
  const baseParseResult =
    (discovery.debug && (discovery.debug as any).coreParseResult) ||
    discovery.canonicalParse?.eventCore;
  if (!baseParseResult || typeof baseParseResult !== "object") {
    throw new Error("Core parse result missing");
  }
  const mappedData = await mapParseResultToGymData(
    baseParseResult as any,
    currentData,
    discovery.document?.extractionMeta as any,
  );
  const reviewFlags = uniqueStrings(
    [
      ...(discovery.pipeline.reviewFlags || []),
      ...(discovery.canonicalParse?.issues || []).map((item) => item.message),
    ],
    24,
  );
  return {
    mappedData,
    builderDraft: buildGymBuilderDraft({ mappedData, reviewFlags }),
  };
}
