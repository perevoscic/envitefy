import { getEventDiscoveryByEventId, updateEventDiscovery } from "@/lib/db";
import { runDiscoveryComposePublicStage } from "@/lib/discovery/compose-public";
import { runDiscoveryEnrichStage } from "@/lib/discovery/enrich";
import { runDiscoveryExtractStage } from "@/lib/discovery/extract";
import { acquireDiscoveryLease } from "@/lib/discovery/lease";
import { runDiscoveryMapStage } from "@/lib/discovery/map";
import { runDiscoveryParseStage } from "@/lib/discovery/parse";
import { persistDiscoveryEventSnapshot } from "@/lib/discovery/persist";
import {
  buildEmptyGymPublicArtifacts,
  completeDiscoveryStage,
  createDiscoveryPipelineState,
  failDiscoveryStage,
  safeString,
  startDiscoveryStage,
  uniqueStrings,
} from "@/lib/discovery/shared";
import { buildDiscoveryStatusResponse } from "@/lib/discovery/status";
import type { DiscoveryFailureStage, EventDiscoveryRow } from "@/lib/discovery/types";

function resolveFailureStage(stage: string): DiscoveryFailureStage {
  switch (stage) {
    case "extract":
      return "failed_extract";
    case "enrich":
      return "failed_enrich";
    case "compose_public":
      return "failed_compose";
    case "map":
    case "parse":
      return "failed_parse";
    default:
      return "failed_extract";
  }
}

async function persistDiscoveryRow(params: {
  discovery: EventDiscoveryRow;
  patch: Partial<EventDiscoveryRow> & Record<string, unknown>;
}) {
  const updated = await updateEventDiscovery({
    eventId: params.discovery.eventId,
    source: (params.patch.source as any) ?? params.discovery.source,
    document:
      params.patch.document === undefined
        ? params.discovery.document
        : (params.patch.document as any),
    canonicalParse:
      params.patch.canonicalParse === undefined
        ? params.discovery.canonicalParse
        : (params.patch.canonicalParse as any),
    enrichment:
      params.patch.enrichment === undefined
        ? params.discovery.enrichment
        : (params.patch.enrichment as any),
    pipeline: (params.patch.pipeline as any) ?? params.discovery.pipeline,
    debug: params.patch.debug === undefined ? params.discovery.debug : (params.patch.debug as any),
  });
  if (!updated) {
    throw new Error("Failed to persist discovery state");
  }
  return updated;
}

async function enterStage(
  discovery: EventDiscoveryRow,
  stage: "extract" | "parse" | "map" | "enrich" | "compose_public",
) {
  return persistDiscoveryRow({
    discovery,
    patch: {
      pipeline: startDiscoveryStage(discovery.pipeline || createDiscoveryPipelineState(), stage),
    },
  });
}

export async function runDiscoveryPipeline(eventId: string) {
  const discovery = await getEventDiscoveryByEventId(eventId);
  if (!discovery) return null;
  const leased = await acquireDiscoveryLease(discovery);
  if (!leased) {
    const current = await getEventDiscoveryByEventId(eventId);
    return current ? buildDiscoveryStatusResponse(current) : null;
  }

  let current = leased.discovery;
  try {
    let startedAt = Date.now();
    current = await enterStage(current, "extract");
    const extracted = await runDiscoveryExtractStage(current);
    current = await persistDiscoveryRow({
      discovery: current,
      patch: {
        source: {
          ...current.source,
          ...extracted.sourceInput,
          updatedAt: new Date().toISOString(),
        },
        document: extracted.document,
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          ...extracted.debug,
        },
        pipeline: completeDiscoveryStage(current.pipeline, "extract", Date.now() - startedAt),
      },
    });

    startedAt = Date.now();
    current = await enterStage(current, "parse");
    const parsed = await runDiscoveryParseStage(current);
    current = await persistDiscoveryRow({
      discovery: current,
      patch: {
        canonicalParse: parsed.canonicalParse,
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          ...parsed.debug,
        },
        pipeline: completeDiscoveryStage(current.pipeline, "parse", Date.now() - startedAt),
      },
    });

    startedAt = Date.now();
    current = await enterStage(current, "map");
    const mapped = await runDiscoveryMapStage(current);
    const mappedPipeline = {
      ...completeDiscoveryStage(current.pipeline, "map", Date.now() - startedAt),
      reviewFlags: mapped.builderDraft.reviewFlags || [],
    };
    current = await persistDiscoveryRow({
      discovery: current,
      patch: {
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          mappedData: mapped.mappedData,
        },
        pipeline: mappedPipeline,
      },
    });
    await persistDiscoveryEventSnapshot({
      eventId: current.eventId,
      title: safeString(mapped.mappedData.title),
      timezone: safeString(mapped.mappedData.timezone) || null,
      startISO: safeString(mapped.mappedData.startISO) || null,
      endISO: safeString(mapped.mappedData.endISO) || null,
      builderDraft: mapped.builderDraft,
      publicArtifacts: buildEmptyGymPublicArtifacts(safeString(mapped.mappedData.title)),
      pipeline: mappedPipeline,
      discoveryId: current.id,
      templateId: safeString(mapped.mappedData.templateId),
      pageTemplateId: safeString(mapped.mappedData.pageTemplateId),
      status: "processing",
    });

    startedAt = Date.now();
    current = await enterStage(current, "enrich");
    const enriched = await runDiscoveryEnrichStage(current);
    current = await persistDiscoveryRow({
      discovery: current,
      patch: {
        document: enriched.document,
        enrichment: enriched.enrichment,
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          ...(enriched.debug || {}),
        },
        pipeline: completeDiscoveryStage(current.pipeline, "enrich", Date.now() - startedAt),
      },
    });

    startedAt = Date.now();
    current = await enterStage(current, "compose_public");
    const composed = await runDiscoveryComposePublicStage(current);
    const publishReady =
      safeString(composed.publicArtifacts.publishAssessment.state) === "auto_publish" ||
      (composed.publicArtifacts.publishAssessment.reasons || []).length === 0;
    const reviewFlags = uniqueStrings(
      [
        ...(composed.builderDraft.reviewFlags || []),
        ...(composed.publicArtifacts.publishAssessment.reasons || []),
      ],
      24,
    );
    const finalPipeline = {
      ...completeDiscoveryStage(current.pipeline, "compose_public", Date.now() - startedAt),
      processingStage: "review_ready" as const,
      needsHumanReview: reviewFlags.length > 0,
      publishReady,
      reviewFlags,
      lease: null,
    };
    current = await persistDiscoveryRow({
      discovery: current,
      patch: {
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          mappedData: composed.mappedData,
        },
        pipeline: finalPipeline,
      },
    });
    await persistDiscoveryEventSnapshot({
      eventId: current.eventId,
      title: safeString(composed.mappedData.title),
      timezone: safeString(composed.mappedData.timezone) || null,
      startISO: safeString(composed.mappedData.startISO) || null,
      endISO: safeString(composed.mappedData.endISO) || null,
      builderDraft: {
        ...composed.builderDraft,
        reviewFlags,
      },
      publicArtifacts: composed.publicArtifacts,
      pipeline: finalPipeline,
      discoveryId: current.id,
      templateId: safeString(composed.mappedData.templateId),
      pageTemplateId: safeString(composed.mappedData.pageTemplateId),
      status: "review_ready",
    });
    return buildDiscoveryStatusResponse(current);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedStage = resolveFailureStage(String(current.pipeline.processingStage || ""));
    const failedPipeline = failDiscoveryStage(current.pipeline, failedStage, failedStage, message);
    await persistDiscoveryRow({
      discovery: current,
      patch: {
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          lastError: message,
        },
        pipeline: failedPipeline,
      },
    }).catch(() => {});
    return null;
  }
}

export function dispatchDiscoveryPipeline(eventId: string) {
  setTimeout(() => {
    void runDiscoveryPipeline(eventId);
  }, 0);
}
