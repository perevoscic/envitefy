import { getEventHistoryById } from "@/lib/db";
import { buildFootballBuilderDraft } from "@/lib/discovery/map";
import { buildGymBuilderDraft } from "@/lib/discovery/map";
import {
  buildEmptyDiscoveryPublicArtifacts,
  safeString,
  uniqueStrings,
} from "@/lib/discovery/shared";
import type {
  EventDiscoveryRow,
  DiscoveryPublicArtifacts,
  GymPublicArtifacts,
  GymPublicSection,
  PublicSectionProvenance,
} from "@/lib/discovery/types";
import {
  buildGymDiscoveryPublicPageArtifacts,
  mapParseResultToGymData,
} from "@/lib/meet-discovery";
import { mapParseResultToFootballData } from "@/lib/football-discovery";

function mapSectionProvenance(section: Record<string, any>): PublicSectionProvenance {
  const body = safeString(section.body);
  const links = Array.isArray(section.links) ? section.links.length : 0;
  if (links > 0 && body) return "mixed";
  if (links > 0) return "location_enriched";
  return body ? "pdf_grounded" : "derived_summary";
}

function mapSectionConfidence(section: Record<string, any>): number {
  if (safeString(section.visibility) !== "visible") return 0;
  if (safeString(section.body) && Array.isArray(section.links) && section.links.length > 0)
    return 0.9;
  if (safeString(section.body)) return 0.8;
  if (Array.isArray(section.links) && section.links.length > 0) return 0.7;
  return 0.5;
}

function toPublicSection(section: Record<string, any>, fallbackTitle: string): GymPublicSection {
  return {
    title: safeString(section.title) || fallbackTitle,
    visibility: safeString(section.visibility) || "hidden",
    body: safeString(section.body) || "",
    bullets: Array.isArray(section.bullets)
      ? section.bullets.map((item) => safeString(item)).filter(Boolean)
      : [],
    links: Array.isArray(section.links)
      ? section.links
          .map((item) => ({
            label: safeString(item?.label || item?.title || "Link"),
            url: safeString(item?.url),
          }))
          .filter((item) => item.url)
      : [],
    hideReason: safeString(section.hideReason) || null,
    provenance: mapSectionProvenance(section),
    confidence: mapSectionConfidence(section),
  };
}

function normalizeQuickAccessLabel(value: unknown) {
  return safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function runDiscoveryComposePublicStage(discovery: EventDiscoveryRow) {
  const row = await getEventHistoryById(discovery.eventId);
  if (!row) throw new Error("Event shell not found");
  const currentData = (row.data || {}) as Record<string, any>;
  const parseResult =
    (discovery.enrichment && (discovery.enrichment as any).parseResult) ||
    (discovery.debug && (discovery.debug as any).coreParseResult);
  if (!parseResult) {
    throw new Error("No parse result available for public composition.");
  }
  if (discovery.workflow === "football") {
    const mappedData = await mapParseResultToFootballData(parseResult as any, currentData);
    const publicArtifacts: DiscoveryPublicArtifacts = {
      ...buildEmptyDiscoveryPublicArtifacts(safeString(mappedData.title)),
      hero: {
        title: safeString(mappedData.title),
        dateLabel:
          safeString(mappedData?.customFields?.scheduleDateRangeLabel) || safeString(mappedData.date),
        venue: safeString(mappedData.venue || mappedData.address),
        badges: uniqueStrings([mappedData?.customFields?.team], 4),
      },
      quickAccess: Array.isArray(mappedData.links)
        ? mappedData.links
            .map((item: any) => ({
              label: safeString(item?.label || item?.title || "Link"),
              url: safeString(item?.url),
            }))
            .filter((item: { label: string; url: string }) => item.url)
            .slice(0, 12)
        : [],
    };
    const reviewFlags = uniqueStrings(
      [
        ...(discovery.canonicalParse?.issues || []).map((item) => item.message),
      ],
      24,
    );
    return {
      mappedData,
      builderDraft: buildFootballBuilderDraft({ mappedData, reviewFlags }),
      publicArtifacts,
    };
  }
  const enrichment = (discovery.enrichment || {}) as Record<string, any>;
  const hasTravelAccommodation = Object.hasOwn(enrichment, "travelAccommodation");
  const discoverySourceWithTravel = hasTravelAccommodation
    ? {
        ...((currentData.discoverySource || {}) as Record<string, any>),
        travelAccommodation: enrichment.travelAccommodation ?? null,
      }
    : ((currentData.discoverySource || {}) as Record<string, any>);
  const baseDataWithTravel = hasTravelAccommodation
    ? {
        ...currentData,
        discoverySource: discoverySourceWithTravel,
      }
    : currentData;
  const mappedData = await mapParseResultToGymData(
    parseResult,
    baseDataWithTravel,
    discovery.document?.extractionMeta as any,
  );
  const legacyArtifacts = buildGymDiscoveryPublicPageArtifacts({
    parseResult,
    baseData: baseDataWithTravel,
    extractionMeta: discovery.document?.extractionMeta as any,
  });
  const sectionTitles: Record<string, string> = {
    meetDetails: "Meet Details",
    parking: "Parking",
    traffic: "Traffic",
    venue: "Venue Details",
    spectatorInfo: "Spectator Info",
    travel: "Hotels",
    documents: "Documents",
  };
  const sections = Object.fromEntries(
    Object.entries(legacyArtifacts.publicPageSections || {}).map(([key, value]) => [
      key,
      toPublicSection((value || {}) as Record<string, any>, sectionTitles[key] || key),
    ]),
  );
  const quickAccess = (() => {
    const out: Array<{ label: string; url: string }> = [];
    const seenUrls = new Set<string>();
    const seenLabels = new Set<string>();
    const candidates = [
      ...(Array.isArray(mappedData.links) ? mappedData.links : []),
      ...Object.values(sections).flatMap((section: any) =>
        Array.isArray(section.links) ? section.links : [],
      ),
    ];
    for (const item of candidates) {
      const url = safeString(item?.url);
      const label = safeString(item?.label || item?.title || "Link");
      const labelKey = normalizeQuickAccessLabel(label);
      if (!url || seenUrls.has(url.toLowerCase())) continue;
      if (labelKey && seenLabels.has(labelKey)) continue;
      seenUrls.add(url.toLowerCase());
      if (labelKey) seenLabels.add(labelKey);
      out.push({
        label,
        url,
      });
      if (out.length >= 12) break;
    }
    return out;
  })();
  const publicArtifacts: GymPublicArtifacts = {
    pipelineVersion: "gym-public-v3",
    publishAssessment: {
      state: safeString((legacyArtifacts.publishAssessment as any)?.state) || "needs_review",
      reasons: Array.isArray((legacyArtifacts.publishAssessment as any)?.reasons)
        ? (legacyArtifacts.publishAssessment as any).reasons
            .map((item: any) => safeString(item))
            .filter(Boolean)
        : [],
    },
    hero: {
      title: safeString(mappedData.title),
      dateLabel:
        safeString(mappedData?.customFields?.meetDateRangeLabel) || safeString(mappedData.date),
      venue: safeString(mappedData.venue || mappedData.address),
      badges: uniqueStrings([mappedData.hostGym], 4),
    },
    sections,
    quickAccess,
  };
  const reviewFlags = uniqueStrings(
    [
      ...(publicArtifacts.publishAssessment.reasons || []),
      ...(discovery.canonicalParse?.issues || []).map((item) => item.message),
    ],
    24,
  );
  return {
    mappedData,
    builderDraft: buildGymBuilderDraft({ mappedData, reviewFlags }),
    publicArtifacts,
    eventDataPatch: hasTravelAccommodation
      ? {
          discoverySource: discoverySourceWithTravel,
        }
      : undefined,
  };
}
