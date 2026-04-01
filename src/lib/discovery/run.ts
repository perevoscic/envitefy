import { getEventDiscoveryByEventId, updateEventDiscovery, updateEventHistoryDataMerge } from "@/lib/db";
import {
  beginDiscoveryPipelineCancellationScope,
  finishDiscoveryPipelineCancellationScope,
  isDiscoveryCancellationError,
  throwIfDiscoveryCancelled,
} from "@/lib/discovery/cancel";
import { runDiscoveryComposePublicStage } from "@/lib/discovery/compose-public";
import { runDiscoveryEnrichStage } from "@/lib/discovery/enrich";
import { runDiscoveryExtractStage } from "@/lib/discovery/extract";
import { buildDiscoveryFailureSummary } from "@/lib/discovery/failure-summary";
import { acquireDiscoveryLease } from "@/lib/discovery/lease";
import { runDiscoveryMapStage } from "@/lib/discovery/map";
import { runDiscoveryParseStage } from "@/lib/discovery/parse";
import { persistDiscoveryEventSnapshot } from "@/lib/discovery/persist";
import {
  buildEmptyDiscoveryPublicArtifacts,
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

function assertActive(signal?: AbortSignal) {
  throwIfDiscoveryCancelled(signal);
}

export async function runDiscoveryPipeline(
  eventId: string,
  options?: { signal?: AbortSignal },
) {
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
    assertActive(options?.signal);
    current = await enterStage(current, "extract");
    const extracted = await runDiscoveryExtractStage(current, { signal: options?.signal });
    assertActive(options?.signal);
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
    assertActive(options?.signal);
    current = await enterStage(current, "parse");
    const parsed = await runDiscoveryParseStage(current, { signal: options?.signal });
    assertActive(options?.signal);
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
    assertActive(options?.signal);
    current = await enterStage(current, "map");
    const mapped = await runDiscoveryMapStage(current, { signal: options?.signal });
    assertActive(options?.signal);
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
      workflow: current.workflow,
      eventId: current.eventId,
      title: safeString(mapped.mappedData.title),
      timezone: safeString(mapped.mappedData.timezone) || null,
      startISO: safeString(mapped.mappedData.startISO) || null,
      endISO: safeString(mapped.mappedData.endISO) || null,
      builderDraft: mapped.builderDraft,
      publicArtifacts:
        current.workflow === "football"
          ? buildEmptyDiscoveryPublicArtifacts(safeString(mapped.mappedData.title))
          : buildEmptyGymPublicArtifacts(safeString(mapped.mappedData.title)),
      pipeline: mappedPipeline,
      discoveryId: current.id,
      templateId: safeString(mapped.mappedData.templateId),
      pageTemplateId: safeString(mapped.mappedData.pageTemplateId),
      status: "processing",
    });
    assertActive(options?.signal);

    startedAt = Date.now();
    assertActive(options?.signal);
    current = await enterStage(current, "enrich");
    const enriched = await runDiscoveryEnrichStage(current, { signal: options?.signal });
    assertActive(options?.signal);
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

    const travelAccommodationState =
      enriched.enrichment && typeof enriched.enrichment === "object"
        ? (enriched.enrichment as any).travelAccommodation
        : null;
    if (travelAccommodationState && typeof travelAccommodationState === "object") {
      await updateEventHistoryDataMerge(current.eventId, {
        discoverySource: {
          travelAccommodation: travelAccommodationState,
          updatedAt: new Date().toISOString(),
        },
      }).catch(() => {});
    }
    assertActive(options?.signal);

    startedAt = Date.now();
    assertActive(options?.signal);
    current = await enterStage(current, "compose_public");
    const composed = await runDiscoveryComposePublicStage(current, { signal: options?.signal });
    assertActive(options?.signal);
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
      workflow: current.workflow,
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
      eventDataPatch: composed.eventDataPatch,
    });
    assertActive(options?.signal);
    return buildDiscoveryStatusResponse(current);
  } catch (error) {
    const stageAtFailure = safeString(current.pipeline.processingStage) || "extract";
    const failedStage = resolveFailureStage(stageAtFailure);
    const failureSummary = buildDiscoveryFailureSummary({
      discovery: current,
      error,
      failedStage: stageAtFailure,
      fallbackCode: failedStage,
    });
    const failedPipeline = failDiscoveryStage(
      current.pipeline,
      failedStage,
      isDiscoveryCancellationError(error) ? "cancelled" : failedStage,
      isDiscoveryCancellationError(error) ? "Discovery cancelled" : failureSummary.errorMessage,
    );
    await persistDiscoveryRow({
      discovery: current,
      patch: {
        debug: {
          ...((current.debug || {}) as Record<string, unknown>),
          lastError: failureSummary.errorMessage,
          failureSummary,
        },
        pipeline: failedPipeline,
      },
    }).catch(() => {});
    return null;
  }
}

export function dispatchDiscoveryPipeline(eventId: string) {
  const controller = beginDiscoveryPipelineCancellationScope(eventId);
  setTimeout(() => {
    void runDiscoveryPipeline(eventId, { signal: controller.signal }).finally(() => {
      finishDiscoveryPipelineCancellationScope(eventId, controller);
    });
  }, 0);
}
