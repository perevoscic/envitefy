import {
  mapParseResultToFootballData,
  parseFootballFromExtractedText,
} from "@/lib/football-discovery";
import { mapParseResultToGymData, parseMeetFromExtractedText } from "@/lib/meet-discovery";
import { getSportEventPreset } from "@/lib/sport-event-presets";
import { detectSportActivity } from "./detect";
import { getSportActivityProfile } from "./profiles";
import type {
  SportDetectionResult,
  SportDiscoveryAdapter,
  SportDiscoveryParseOutput,
  SportParserFamily,
} from "./types";

function fixedDetection(
  profileKey: "gymnastics" | "football",
  archetypeHint?: string | null,
): SportDetectionResult {
  return detectSportActivity({ activityHint: profileKey, archetypeHint });
}

async function parseWithFamily(params: {
  parserFamily: SportParserFamily;
  extractedText: string;
  extractionMeta: Record<string, any>;
  eventId: string;
  activityProfile?: string | null;
  activityLabel?: string | null;
  eventArchetype?: string | null;
}) {
  if (params.parserFamily === "game") {
    return parseFootballFromExtractedText(params.extractedText, params.extractionMeta as any, {
      activityProfile: params.activityProfile,
      activityLabel: params.activityLabel,
      eventArchetype: params.eventArchetype,
    });
  }
  return parseMeetFromExtractedText(params.extractedText, params.extractionMeta as any, {
    traceId: params.eventId,
    mode: "core",
  });
}

async function mapWithFamily(params: {
  parserFamily: SportParserFamily;
  parseResult: Record<string, any>;
  currentData: Record<string, any>;
  extractionMeta?: Record<string, any> | null;
}) {
  return params.parserFamily === "game"
    ? mapParseResultToFootballData(params.parseResult as any, params.currentData)
    : mapParseResultToGymData(
        params.parseResult as any,
        params.currentData,
        params.extractionMeta as any,
      );
}

function toGenericSportsEventData(params: {
  mappedData: Record<string, any>;
  currentData: Record<string, any>;
  parseResult: Record<string, any>;
  activityProfile: string;
  eventArchetype?: string | null;
  detectionConfidence?: number | null;
}) {
  const sportPreset = getSportEventPreset(params.activityProfile);
  const activityProfile = getSportActivityProfile(params.activityProfile);
  const eventArchetype = params.eventArchetype || activityProfile?.defaultArchetype || "game_match";
  const firstGame = Array.isArray(params.parseResult.games) ? params.parseResult.games[0] : null;
  const mappedCustomFields =
    params.mappedData.customFields && typeof params.mappedData.customFields === "object"
      ? params.mappedData.customFields
      : {};
  const mappedDiscoverySource =
    params.mappedData.discoverySource && typeof params.mappedData.discoverySource === "object"
      ? params.mappedData.discoverySource
      : {};
  const scheduleLines = (Array.isArray(params.parseResult.games) ? params.parseResult.games : [])
    .slice(0, 16)
    .map((game: Record<string, any>) => {
      const opponent = String(game.opponent || "").trim();
      const matchup = opponent
        ? `${String(game.homeAway || "").toLowerCase() === "away" ? "at" : "vs"} ${opponent}`
        : "";
      return [game.date, game.time, matchup, game.venue].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
  const factLines = (
    Array.isArray(params.parseResult.unmappedFacts) ? params.parseResult.unmappedFacts : []
  )
    .filter((item: Record<string, any>) => item.confidence !== "low")
    .slice(0, 12)
    .map((item: Record<string, any>) => [item.category, item.detail].filter(Boolean).join(": "))
    .filter(Boolean);
  const genericDetails = [
    String(params.mappedData.details || "").trim(),
    scheduleLines.length ? `Schedule\n${scheduleLines.join("\n")}` : "",
    factLines.length ? `Additional information\n${factLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const logistics =
    params.mappedData.advancedSections?.logistics &&
    typeof params.mappedData.advancedSections.logistics === "object"
      ? params.mappedData.advancedSections.logistics
      : {};
  const ticketLink = Array.isArray(params.mappedData.links)
    ? params.mappedData.links.find((item: Record<string, any>) =>
        /ticket|admission/i.test(String(item?.label || "")),
      )?.url
    : "";
  return {
    ...params.mappedData,
    details: genericDetails,
    category: "sport_event",
    createdVia: "sports-discovery-v1",
    createdManually: false,
    primaryOutput: "event_page",
    requestedOutputs: ["event_page"],
    activityProfile: sportPreset.key,
    eventArchetype,
    detectionConfidence: params.detectionConfidence ?? null,
    templateId: `sport-event-${sportPreset.key}`,
    templateKey: "sport-events",
    pageTemplateId:
      String(params.currentData?.pageTemplateId || "").trim() ||
      sportPreset.themeIds[0] ||
      "stadium_nights",
    customFields: {
      ...mappedCustomFields,
      sport: sportPreset.key,
      sportLabel: sportPreset.label,
      opponent: String(
        mappedCustomFields.opponent || params.parseResult.opponent || firstGame?.opponent || "",
      ).trim(),
      league: String(mappedCustomFields.league || params.parseResult.season || "").trim(),
      stadium: String(
        mappedCustomFields.stadium || params.mappedData.venue || params.parseResult.venue || "",
      ).trim(),
      tickets: String(
        mappedCustomFields.tickets || logistics.ticketsLink || ticketLink || "",
      ).trim(),
      broadcast: String(mappedCustomFields.broadcast || logistics.broadcast || "").trim(),
      parking: String(mappedCustomFields.parking || logistics.parking || "").trim(),
      activityProfile: sportPreset.key,
      eventArchetype,
    },
    discoverySource: {
      ...mappedDiscoverySource,
      workflow: "sports",
      activityProfile: sportPreset.key,
      eventArchetype,
      detectionConfidence: params.detectionConfidence ?? null,
      parseResult: params.parseResult,
      updatedAt: new Date().toISOString(),
    },
  };
}

export const gymnasticsDiscoveryAdapter: SportDiscoveryAdapter = {
  id: "gymnastics-meet-v2",
  async parse(params) {
    const parsed = await parseWithFamily({ ...params, parserFamily: "meet" });
    return {
      ...parsed,
      detection: fixedDetection("gymnastics", params.archetypeHint),
      adapterId: "gymnastics-meet-v2",
    } as SportDiscoveryParseOutput;
  },
  async map(params) {
    return mapWithFamily({ ...params, parserFamily: "meet" });
  },
};

export const footballDiscoveryAdapter: SportDiscoveryAdapter = {
  id: "football-game-v2",
  async parse(params) {
    const parsed = await parseWithFamily({ ...params, parserFamily: "game" });
    return {
      ...parsed,
      detection: fixedDetection("football", params.archetypeHint),
      adapterId: "football-game-v2",
    } as SportDiscoveryParseOutput;
  },
  async map(params) {
    return mapWithFamily({ ...params, parserFamily: "game" });
  },
};

export const genericSportsDiscoveryAdapter: SportDiscoveryAdapter = {
  id: "sports-profile-v1",
  async parse(params) {
    const detection = detectSportActivity({
      text: params.extractedText,
      activityHint: params.activityHint,
      archetypeHint: params.archetypeHint,
    });
    const parsed = await parseWithFamily({
      ...params,
      parserFamily: detection.parserFamily,
      activityProfile: detection.profile,
      activityLabel: detection.label,
      eventArchetype: detection.archetype,
    });
    return {
      ...parsed,
      detection,
      adapterId: `sports-profile-v1:${detection.profile}:${detection.parserFamily}`,
    } as SportDiscoveryParseOutput;
  },
  async map(params) {
    const profile =
      getSportActivityProfile(params.activityProfile) || getSportActivityProfile("football")!;
    const mappedData = await mapWithFamily({
      ...params,
      parserFamily: profile.parserFamily,
    });
    return toGenericSportsEventData({
      mappedData,
      currentData: params.currentData,
      parseResult: params.parseResult,
      activityProfile: profile.key,
      eventArchetype: params.eventArchetype,
      detectionConfidence: params.detectionConfidence,
    });
  },
};

export function getDiscoveryAdapter(workflow: "gymnastics" | "football" | "sports") {
  if (workflow === "football") return footballDiscoveryAdapter;
  if (workflow === "sports") return genericSportsDiscoveryAdapter;
  return gymnasticsDiscoveryAdapter;
}
