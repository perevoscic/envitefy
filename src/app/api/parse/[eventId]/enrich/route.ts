import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getEventHistoryInputBlob,
  getUserIdByEmail,
  query,
  updateEventHistoryData,
  updateEventHistoryDataMerge,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import {
  computeGymBuilderStatuses,
  createDiscoveryPerformance,
  extractDiscoveryText,
  finalizeMeetParseResult,
  isDiscoveryDebugArtifactsEnabled,
  mapParseResultToGymData,
  resolveDiscoveryBudget,
  type DiscoveryPerformance,
  type DiscoveryEnrichmentStatus,
  type DiscoverySourceInput,
} from "@/lib/meet-discovery";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCOVERY_ENRICH_LOG_PREFIX = "[meet-parse-enrich]";
const DEFAULT_DISCOVERY_ENRICH_STALE_MS = 10 * 60 * 1000;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function durationMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function sanitizeExtractionMetaForPersistence(meta: any, debugArtifacts: boolean) {
  if (!meta || typeof meta !== "object") return meta;
  const next = { ...meta } as Record<string, any>;
  if (!debugArtifacts) {
    delete next.schedulePageImages;
  }
  return next;
}

function buildPersistedPerformance(
  performance: Partial<DiscoveryPerformance> | Record<string, any> | null | undefined
): DiscoveryPerformance {
  const next = performance && typeof performance === "object" ? performance : {};
  return {
    ...createDiscoveryPerformance(),
    ...next,
    persistMs: 0,
  };
}

function resolveDiscoveryEnrichStaleMs(): number {
  const parsed = Number.parseInt(
    process.env.DISCOVERY_ENRICH_STALE_MS || "",
    10
  );
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DISCOVERY_ENRICH_STALE_MS;
}

function isEnrichmentLeaseStale(
  enrichment: Record<string, any> | null | undefined,
  staleMs: number
) {
  const startedAt = safeString(enrichment?.startedAt);
  if (!startedAt) return true;
  const startedAtMs = Date.parse(startedAt);
  if (!Number.isFinite(startedAtMs)) return true;
  return Date.now() - startedAtMs >= staleMs;
}

function buildEnrichmentStatus(
  overrides: Partial<DiscoveryEnrichmentStatus> = {}
): DiscoveryEnrichmentStatus {
  return {
    state: "pending",
    pending: true,
    startedAt: null,
    finishedAt: null,
    lastError: null,
    performance: createDiscoveryPerformance(),
    ...overrides,
  };
}

async function tryAcquireEnrichmentLease(params: {
  eventId: string;
  discoverySource: Record<string, any>;
  performance: DiscoveryPerformance;
  force: boolean;
}) {
  const startedAt = new Date().toISOString();
  const staleMs = resolveDiscoveryEnrichStaleMs();
  const staleBefore = new Date(Date.now() - staleMs).toISOString();
  const runningEnrichment = buildEnrichmentStatus({
    state: "running",
    pending: true,
    startedAt,
    finishedAt: null,
    lastError: null,
    performance: buildPersistedPerformance(params.performance),
  });
  const nextDiscoverySource = {
    ...params.discoverySource,
    enrichment: runningEnrichment,
    updatedAt: startedAt,
  };

  const result = await query<{ id: string }>(
    `update event_history
       set data = jsonb_set(
         coalesce(data, '{}'::jsonb),
         '{discoverySource}',
         $2::jsonb,
         true
       )
     where id = $1
       and (
         (
           coalesce(data #>> '{discoverySource,enrichment,state}', '') = 'running'
           and (
             nullif(data #>> '{discoverySource,enrichment,startedAt}', '') is null
             or (nullif(data #>> '{discoverySource,enrichment,startedAt}', ''))::timestamptz <= $4::timestamptz
           )
         )
         or (
           coalesce(data #>> '{discoverySource,enrichment,state}', '') <> 'running'
           and (
             $3::boolean
             or coalesce(data #>> '{discoverySource,enrichment,state}', '') <> 'completed'
           )
         )
       )
     returning id`,
    [params.eventId, JSON.stringify(nextDiscoverySource), params.force, staleBefore]
  );

  if (result.rows[0]) {
    return {
      status: "acquired" as const,
      discoverySource: nextDiscoverySource,
      enrichment: runningEnrichment,
      startedAt,
      staleMs,
    };
  }

  const latestRow = await getEventHistoryById(params.eventId);
  const latestData = (latestRow?.data || {}) as Record<string, any>;
  const latestDiscoverySource = (latestData.discoverySource || {}) as Record<
    string,
    any
  >;
  const latestEnrichment =
    latestDiscoverySource.enrichment &&
    typeof latestDiscoverySource.enrichment === "object"
      ? latestDiscoverySource.enrichment
      : buildEnrichmentStatus();

  if (
    safeString(latestEnrichment.state) === "completed" &&
    !params.force
  ) {
    return {
      status: "completed" as const,
      row: latestRow,
      data: latestData,
      discoverySource: latestDiscoverySource,
      enrichment: latestEnrichment,
      staleMs,
    };
  }

  if (
    safeString(latestEnrichment.state) === "running" &&
    !isEnrichmentLeaseStale(latestEnrichment, staleMs)
  ) {
    return {
      status: "running" as const,
      row: latestRow,
      data: latestData,
      discoverySource: latestDiscoverySource,
      enrichment: latestEnrichment,
      staleMs,
    };
  }

  return {
    status: "blocked" as const,
    row: latestRow,
    data: latestData,
    discoverySource: latestDiscoverySource,
    enrichment: latestEnrichment,
    staleMs,
  };
}

function collectUpdatedSections(previousData: Record<string, any>, nextData: Record<string, any>) {
  const previousSections = (previousData?.advancedSections || {}) as Record<string, any>;
  const nextSections = (nextData?.advancedSections || {}) as Record<string, any>;
  const sectionIds = new Set([
    ...Object.keys(previousSections),
    ...Object.keys(nextSections),
  ]);
  return [...sectionIds].filter((sectionId) => {
    return JSON.stringify(previousSections[sectionId] ?? null) !== JSON.stringify(nextSections[sectionId] ?? null);
  });
}

async function getSessionUserId() {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  return userId;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const startedAt = Date.now();
  let failureSnapshot: Record<string, any> | null = null;
  let enrichmentStartedAt: string | null = null;
  const performance = createDiscoveryPerformance();
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    console.log(`${DISCOVERY_ENRICH_LOG_PREFIX} request started`, {
      eventId,
      force,
    });
    const row = await getEventHistoryById(eventId);
    if (!row) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const sessionUserId = await getSessionUserId();
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentData = (row.data || {}) as Record<string, any>;
    const discoverySource = (currentData.discoverySource || {}) as Record<string, any>;
    failureSnapshot = discoverySource;
    if (safeString(discoverySource.workflow) === "football") {
      return NextResponse.json(
        { error: "Football discovery does not support enrichment" },
        { status: 400 }
      );
    }

    const sourceInput = discoverySource.input as DiscoverySourceInput | undefined;
    if (!sourceInput?.type) {
      return NextResponse.json(
        { error: "No discovery source input found" },
        { status: 400 }
      );
    }

    const baseParseResult = discoverySource.parseResult;
    const baseExtractedText = safeString(discoverySource.extractedText);
    if (!baseParseResult || !baseExtractedText) {
      return NextResponse.json(
        { error: "Run core parse before enrichment" },
        { status: 409 }
      );
    }

    const lease = await tryAcquireEnrichmentLease({
      eventId,
      discoverySource,
      performance,
      force,
    });
    if (lease.status === "completed" || lease.status === "running") {
      const responseData = (lease.data || currentData) as Record<string, any>;
      const enrichmentState =
        lease.enrichment && typeof lease.enrichment === "object"
          ? lease.enrichment
          : buildEnrichmentStatus();
      const responseStatus = lease.status === "running" ? 202 : 200;
      return NextResponse.json(
        {
          ok: true,
          eventId,
          enrichmentState,
          updatedSections: [],
          performance: enrichmentState.performance || createDiscoveryPerformance(),
          statuses: computeGymBuilderStatuses(responseData),
        },
        { status: responseStatus }
      );
    }
    if (lease.status === "blocked") {
      return NextResponse.json(
        { error: "Could not acquire enrichment lease" },
        { status: 409 }
      );
    }
    failureSnapshot = lease.discoverySource;
    enrichmentStartedAt = lease.startedAt;

    let hydratedSourceInput = sourceInput;
    if (sourceInput.type === "file" && !safeString(sourceInput.dataUrl || "")) {
      const blob = await getEventHistoryInputBlob(eventId);
      if (!blob?.data) {
        return NextResponse.json(
          { error: "Discovery source file blob not found" },
          { status: 404 }
        );
      }
      hydratedSourceInput = {
        ...sourceInput,
        fileName: safeString(sourceInput.fileName) || safeString(blob.file_name) || "upload",
        mimeType:
          safeString(sourceInput.mimeType) ||
          safeString(blob.mime_type) ||
          "application/octet-stream",
        sizeBytes:
          Number.isFinite(sourceInput.sizeBytes)
            ? sourceInput.sizeBytes
            : Number(blob.size_bytes || blob.data.length),
        dataUrl: `data:${safeString(blob.mime_type) || "application/octet-stream"};base64,${blob.data.toString("base64")}`,
        blobStored: true,
      };
    }

    const debugArtifacts = isDiscoveryDebugArtifactsEnabled();
    const enrichBudgetMs = resolveDiscoveryBudget("enrich");

    const extraction = await extractDiscoveryText(hydratedSourceInput, {
      workflow: "gymnastics",
      mode: "enrich",
      budgetMs: enrichBudgetMs,
      debugArtifacts,
      performance,
    });

    const enrichedParseResult = await finalizeMeetParseResult(
      baseParseResult,
      extraction.extractedText || baseExtractedText,
      extraction.extractionMeta,
      {
        traceId: eventId,
        mode: "enrich",
        performance,
      }
    );

    const latestRow = await getEventHistoryById(eventId);
    const latestData = ((latestRow?.data || currentData) ?? {}) as Record<string, any>;
    const latestDiscoverySource = (latestData.discoverySource || discoverySource) as Record<string, any>;
    const mapped = await mapParseResultToGymData(
      enrichedParseResult,
      latestData,
      extraction.extractionMeta
    );
    const nextGymPageTemplateId =
      resolveGymMeetTemplateId({ ...latestData, ...mapped }) ||
      DEFAULT_GYM_MEET_TEMPLATE_ID;
    const detectedGymLayoutImage =
      extraction.extractionMeta?.gymLayoutImageDataUrl || null;
    if (
      detectedGymLayoutImage &&
      !mapped?.advancedSections?.logistics?.gymLayoutImage
    ) {
      mapped.advancedSections = mapped.advancedSections || {};
      mapped.advancedSections.logistics = mapped.advancedSections.logistics || {};
      mapped.advancedSections.logistics.gymLayoutImage = detectedGymLayoutImage;
      mapped.customFields = mapped.customFields || {};
      mapped.customFields.advancedSections = mapped.advancedSections;
    }

    const finishedAt = new Date().toISOString();
    const enrichmentState = buildEnrichmentStatus({
      state: "completed",
      pending: false,
      startedAt:
        safeString(latestDiscoverySource?.enrichment?.startedAt) ||
        enrichmentStartedAt,
      finishedAt,
      lastError: null,
      performance: buildPersistedPerformance(performance),
    });

    const nextData = {
      ...mapped,
      pageTemplateId: nextGymPageTemplateId,
      discoverySource: {
        ...latestDiscoverySource,
        status: "parsed",
        workflow: "gymnastics",
        input: sourceInput,
        extractedText: extraction.extractedText || baseExtractedText,
        extractionMeta: sanitizeExtractionMetaForPersistence(
          extraction.extractionMeta,
          debugArtifacts
        ),
        parseResult: enrichedParseResult,
        enrichment: enrichmentState,
        enrichedAt: finishedAt,
        updatedAt: finishedAt,
      },
    };

    const persistStartedAt = Date.now();
    await updateEventHistoryData(eventId, nextData);
    performance.persistMs = durationMs(persistStartedAt);
    if (safeString(enrichedParseResult.title)) {
      await updateEventHistoryTitle(eventId, enrichedParseResult.title);
    }
    if (row.user_id) {
      invalidateUserHistory(row.user_id);
    }

    const updatedSections = collectUpdatedSections(latestData, nextData);
    console.log(`${DISCOVERY_ENRICH_LOG_PREFIX} request completed`, {
      eventId,
      updatedSections,
      totalDurationMs: durationMs(startedAt),
      textQuality: extraction.extractionMeta?.textQuality || null,
      performance,
    });
    return NextResponse.json({
      ok: true,
      eventId,
      enrichmentState: {
        ...enrichmentState,
        performance,
      },
      updatedSections,
      performance,
      statuses: computeGymBuilderStatuses(nextData),
    });
  } catch (err: any) {
    console.error(`${DISCOVERY_ENRICH_LOG_PREFIX} enrich failed`, {
      eventId,
      message: err?.message,
      stack: err?.stack,
      cause: err?.cause,
    });
    if (failureSnapshot) {
      try {
        const finishedAt = new Date().toISOString();
        await updateEventHistoryDataMerge(eventId, {
          discoverySource: {
            ...failureSnapshot,
            enrichment: buildEnrichmentStatus({
              state: "failed",
              pending: false,
              startedAt:
                safeString(failureSnapshot?.enrichment?.startedAt) ||
                enrichmentStartedAt,
              finishedAt,
              lastError: String(err?.message || err || "Enrichment failed"),
              performance: buildPersistedPerformance(performance),
            }),
            updatedAt: finishedAt,
          },
        });
      } catch {}
    }
    return NextResponse.json(
      { error: String(err?.message || err || "Enrichment failed") },
      { status: 500 }
    );
  }
}
