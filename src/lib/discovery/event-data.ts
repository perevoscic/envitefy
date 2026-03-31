import { safeString } from "@/lib/discovery/strings";
import type { GymBuilderDraft, GymPublicArtifacts } from "@/lib/discovery/types";

export function isGymDiscoveryV2EventData(data: any): boolean {
  return (
    safeString(data?.createdVia) === "meet-discovery-v2" ||
    Boolean(
      data &&
        typeof data === "object" &&
        data.builderDraft &&
        data.publicArtifacts &&
        data.pipelineSummary?.discoveryId,
    )
  );
}

export function getGymDiscoveryV2BuilderDraft(data: any): GymBuilderDraft | null {
  if (!isGymDiscoveryV2EventData(data)) return null;
  return data?.builderDraft && typeof data.builderDraft === "object"
    ? (data.builderDraft as GymBuilderDraft)
    : null;
}

export function getGymDiscoveryV2PublicArtifacts(data: any): GymPublicArtifacts | null {
  if (!isGymDiscoveryV2EventData(data)) return null;
  return data?.publicArtifacts && typeof data.publicArtifacts === "object"
    ? (data.publicArtifacts as GymPublicArtifacts)
    : null;
}

export function getGymDiscoveryV2PipelineSummary(data: any) {
  if (!isGymDiscoveryV2EventData(data)) return null;
  return data?.pipelineSummary && typeof data.pipelineSummary === "object"
    ? (data.pipelineSummary as Record<string, any>)
    : null;
}

export function buildLegacyDiscoverySourceFromV2(data: any) {
  const publicArtifacts = getGymDiscoveryV2PublicArtifacts(data);
  if (!publicArtifacts) return null;
  const persistedDiscoverySource =
    data?.discoverySource && typeof data.discoverySource === "object" ? data.discoverySource : {};
  return {
    ...persistedDiscoverySource,
    workflow: "gymnastics",
    pipelineVersion: publicArtifacts.pipelineVersion,
    publicPageSections: publicArtifacts.sections || {},
    publishAssessment: publicArtifacts.publishAssessment || null,
    parseResult: persistedDiscoverySource.parseResult || null,
    extractionMeta: persistedDiscoverySource.extractionMeta || null,
    input: persistedDiscoverySource.input || null,
  };
}

export function inflateGymDiscoveryV2EventData(data: any) {
  if (!isGymDiscoveryV2EventData(data)) return data;
  const builderDraft = getGymDiscoveryV2BuilderDraft(data);
  const publicArtifacts = getGymDiscoveryV2PublicArtifacts(data);
  const builderEvent =
    builderDraft?.event && typeof builderDraft.event === "object" ? builderDraft.event : {};
  const builderVenue =
    builderDraft?.venue && typeof builderDraft.venue === "object" ? builderDraft.venue : {};
  const canonicalLinks =
    builderDraft?.canonicalLinks && typeof builderDraft.canonicalLinks === "object"
      ? builderDraft.canonicalLinks
      : {};
  return {
    ...data,
    ...builderEvent,
    ...builderVenue,
    advancedSections:
      builderDraft?.advancedSections && typeof builderDraft.advancedSections === "object"
        ? builderDraft.advancedSections
        : data?.advancedSections,
    links:
      Array.isArray(publicArtifacts?.quickAccess) && publicArtifacts?.quickAccess.length > 0
        ? publicArtifacts.quickAccess
        : Array.isArray((canonicalLinks as any)?.links)
          ? (canonicalLinks as any).links
          : data?.links,
    discoverySource: buildLegacyDiscoverySourceFromV2(data) || data?.discoverySource || {},
  };
}
