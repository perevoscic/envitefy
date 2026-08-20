import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
} from "@/components/gym-meet-templates/registry";
import { getEventHistoryById } from "@/lib/db";
import { throwIfDiscoveryCancelled } from "@/lib/discovery/cancel";
import { safeString, uniqueStrings } from "@/lib/discovery/shared";
import type {
  DiscoveryBuilderDraft,
  EventDiscoveryRow,
  GymBuilderDraft,
} from "@/lib/discovery/types";
import { getSportEventPreset } from "@/lib/sport-event-presets";
import { getDiscoveryAdapter } from "@/lib/sports-discovery";

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
      pageTemplateId: safeString(mappedData.pageTemplateId) || DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
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

export function buildFootballBuilderDraft(params: {
  mappedData: Record<string, any>;
  reviewFlags?: string[];
}): DiscoveryBuilderDraft {
  const mappedData = params.mappedData || {};
  return {
    event: {
      ...mappedData,
      templateId: safeString(mappedData.templateId) || "football-season",
      pageTemplateId: safeString(mappedData.pageTemplateId) || DEFAULT_GYM_MEET_TEMPLATE_ID,
      createdVia: "football-discovery-v2",
      category: "football",
    },
    venue: {
      venue: safeString(mappedData.venue),
      address: safeString(mappedData.address),
      city: safeString(mappedData.city),
      state: safeString(mappedData.state),
      location: safeString(mappedData.location),
    },
    advancedSections:
      mappedData.advancedSections && typeof mappedData.advancedSections === "object"
        ? mappedData.advancedSections
        : {},
    canonicalLinks: {
      links: Array.isArray(mappedData.links) ? mappedData.links : [],
    },
    reviewFlags: uniqueStrings(params.reviewFlags || [], 24),
  };
}

export function buildSportsBuilderDraft(params: {
  mappedData: Record<string, any>;
  reviewFlags?: string[];
}): DiscoveryBuilderDraft {
  const mappedData = params.mappedData || {};
  const preset = getSportEventPreset(mappedData.activityProfile || mappedData?.customFields?.sport);
  return {
    event: {
      ...mappedData,
      templateId: safeString(mappedData.templateId) || `sport-event-${preset.key}`,
      pageTemplateId: safeString(mappedData.pageTemplateId) || preset.themeIds[0],
      createdVia: "sports-discovery-v1",
      createdManually: false,
      category: "sport_event",
      primaryOutput: "event_page",
      requestedOutputs: ["event_page"],
      activityProfile: preset.key,
    },
    venue: {
      venue: safeString(mappedData.venue),
      address: safeString(mappedData.address),
      city: safeString(mappedData.city),
      state: safeString(mappedData.state),
      location: safeString(mappedData.location),
    },
    advancedSections:
      mappedData.advancedSections && typeof mappedData.advancedSections === "object"
        ? mappedData.advancedSections
        : {},
    canonicalLinks: {
      links: Array.isArray(mappedData.links) ? mappedData.links : [],
    },
    reviewFlags: uniqueStrings(params.reviewFlags || [], 24),
  };
}

export async function runDiscoveryMapStage(
  discovery: EventDiscoveryRow,
  options?: { signal?: AbortSignal },
) {
  throwIfDiscoveryCancelled(options?.signal);
  const row = await getEventHistoryById(discovery.eventId);
  if (!row) throw new Error("Event shell not found");
  const currentData = (row.data || {}) as Record<string, any>;
  const baseParseResult =
    (discovery.debug && (discovery.debug as any).coreParseResult) ||
    discovery.canonicalParse?.eventCore;
  if (!baseParseResult || typeof baseParseResult !== "object") {
    throw new Error("Core parse result missing");
  }
  const adapter = getDiscoveryAdapter(discovery.workflow);
  const mappedData = await adapter.map({
    parseResult: baseParseResult as Record<string, any>,
    currentData,
    extractionMeta: discovery.document?.extractionMeta as Record<string, any>,
    activityProfile: discovery.canonicalParse?.activityProfile || discovery.source.activityProfile,
    eventArchetype: discovery.canonicalParse?.eventArchetype || discovery.source.eventArchetype,
    detectionConfidence: discovery.canonicalParse?.detection?.confidence,
  });
  throwIfDiscoveryCancelled(options?.signal);
  const reviewFlags = uniqueStrings(
    [
      ...(discovery.pipeline.reviewFlags || []),
      ...(discovery.canonicalParse?.issues || []).map((item) => item.message),
    ],
    24,
  );
  return {
    mappedData,
    builderDraft:
      discovery.workflow === "football"
        ? buildFootballBuilderDraft({ mappedData, reviewFlags })
        : discovery.workflow === "sports"
          ? buildSportsBuilderDraft({ mappedData, reviewFlags })
          : buildGymBuilderDraft({ mappedData, reviewFlags }),
  };
}
