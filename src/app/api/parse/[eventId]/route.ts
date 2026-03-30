import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById, updateEventHistoryData, updateEventHistoryTitle } from "@/lib/db";
import {
  hydrateDiscoveryFileInput,
  requiresClientPdfReupload,
} from "@/lib/discovery-file-hydration";
import { runInlineGymnasticsEnrichmentPhase } from "@/lib/discovery-gymnastics-enrich-inline";
import { summarizeDiscoveryPerformanceForLog } from "@/lib/discovery-performance-log";
import {
  computeFootballBuilderStatuses,
  mapParseResultToFootballData,
  parseFootballFromExtractedText,
} from "@/lib/football-discovery";
import { invalidateUserHistory } from "@/lib/history-cache";
import {
  buildGymDiscoveryPublicPageArtifacts,
  computeGymBuilderStatuses,
  createDiscoveryPerformance,
  type DiscoveryEnrichmentStatus,
  type DiscoveryPerformance,
  type DiscoverySourceInput,
  type DiscoveryWorkflow,
  extractDiscoveryText,
  isDiscoveryDebugArtifactsEnabled,
  mapParseResultToGymData,
  parseMeetFromExtractedText,
  type ParseResult,
  resolveDiscoveryBudget,
  stripGymScheduleGridsFromParseResult,
} from "@/lib/meet-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MEET_PARSE_LOG_PREFIX = "[meet-parse]";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function durationMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function normalizeWorkflow(value: unknown): DiscoveryWorkflow {
  return safeString(value) === "football" ? "football" : "gymnastics";
}

function sanitizeExtractionMetaForPersistence(meta: any, debugArtifacts: boolean) {
  if (!meta || typeof meta !== "object") return meta;
  const next = { ...meta } as Record<string, any>;
  if (!debugArtifacts) {
    delete next.schedulePageImages;
  }
  return next;
}

function buildPersistedPerformance(performance: DiscoveryPerformance): DiscoveryPerformance {
  return {
    ...performance,
    persistMs: 0,
  };
}

function buildEnrichmentStatus(
  workflow: DiscoveryWorkflow,
  overrides: Partial<DiscoveryEnrichmentStatus> = {},
): DiscoveryEnrichmentStatus {
  const pending = workflow === "gymnastics";
  return {
    state: pending ? "pending" : "not_applicable",
    pending,
    startedAt: null,
    finishedAt: null,
    lastError: null,
    performance: createDiscoveryPerformance(),
    ...overrides,
  };
}

async function getSessionUserId() {
  const session: any = await getServerSession(authOptions as any);
  return await resolveSessionUserId(session);
}

export async function POST(req: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const startedAt = Date.now();
    const url = new URL(req.url);
    const repairMode = url.searchParams.get("repair") === "1";
    const { eventId } = await context.params;
    console.log(`${MEET_PARSE_LOG_PREFIX} request started`, {
      eventId,
      repairMode,
    });
    const row = await getEventHistoryById(eventId);
    if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const sessionUserId = await getSessionUserId();
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentData = (row.data || {}) as Record<string, any>;
    const sourceInput = currentData?.discoverySource?.input as DiscoverySourceInput | undefined;
    const workflow = normalizeWorkflow(currentData?.discoverySource?.workflow);
    const debugArtifacts = isDiscoveryDebugArtifactsEnabled();
    const performance = createDiscoveryPerformance();
    console.log(`${MEET_PARSE_LOG_PREFIX} source resolved`, {
      eventId,
      workflow,
      sourceType: sourceInput?.type || null,
      blobStored: sourceInput?.type === "file" ? Boolean(sourceInput?.blobStored) : null,
      fileName: sourceInput?.type === "file" ? sourceInput.fileName : null,
      sizeBytes: sourceInput?.type === "file" ? sourceInput.sizeBytes : null,
    });
    if (!sourceInput || !sourceInput.type) {
      return NextResponse.json({ error: "No discovery source input found" }, { status: 400 });
    }
    const coreBudgetMs = resolveDiscoveryBudget("core", sourceInput.type);

    const contentType = safeString(req.headers.get("content-type")).toLowerCase();
    let uploadFile: File | null = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const f = formData.get("file");
      if (f instanceof File) uploadFile = f;
    }

    if (
      repairMode &&
      sourceInput.type === "file" &&
      requiresClientPdfReupload(sourceInput) &&
      !uploadFile
    ) {
      return NextResponse.json(
        {
          error:
            'Repair for this PDF requires re-uploading the file. Send the same PDF as multipart field "file".',
        },
        { status: 400 },
      );
    }

    let hydratedSourceInput = sourceInput;
    if (sourceInput.type === "file" && !safeString(sourceInput.dataUrl || "")) {
      const hydrateStartedAt = Date.now();
      console.log(`${MEET_PARSE_LOG_PREFIX} hydrating file discovery input`, {
        eventId,
        hasUpload: Boolean(uploadFile),
      });
      const hydrated = await hydrateDiscoveryFileInput(eventId, sourceInput, uploadFile);
      if (!hydrated.ok) {
        return NextResponse.json({ error: hydrated.error }, { status: hydrated.status });
      }
      hydratedSourceInput = hydrated.hydrated;
      console.log(`${MEET_PARSE_LOG_PREFIX} hydrated file input`, {
        eventId,
        durationMs: durationMs(hydrateStartedAt),
      });
    }

    const extractionStartedAt = Date.now();
    console.log(`${MEET_PARSE_LOG_PREFIX} extraction started`, {
      eventId,
      workflow,
      inputType: hydratedSourceInput.type,
    });
    const extraction = await extractDiscoveryText(hydratedSourceInput, {
      workflow,
      mode: "core",
      budgetMs: coreBudgetMs,
      debugArtifacts,
      performance,
    });
    console.log(`${MEET_PARSE_LOG_PREFIX} extraction finished`, {
      eventId,
      durationMs: durationMs(extractionStartedAt),
      extractedChars: extraction.extractedText?.length || 0,
      sourceType: extraction.extractionMeta?.sourceType || null,
      usedOcr: extraction.extractionMeta?.usedOcr ?? null,
      textQuality: extraction.extractionMeta?.textQuality || null,
      linkedAssets: extraction.extractionMeta?.linkedAssets?.length || 0,
      discoveredLinks: extraction.extractionMeta?.discoveredLinks?.length || 0,
    });
    if (!extraction.extractedText || extraction.extractedText.length < 20) {
      return NextResponse.json({ error: "Not enough text extracted to parse" }, { status: 422 });
    }

    let parsed:
      | Awaited<ReturnType<typeof parseFootballFromExtractedText>>
      | Awaited<ReturnType<typeof parseMeetFromExtractedText>>;
    let mapped: Record<string, any>;
    let gymnasticsPublicArtifacts:
      | ReturnType<typeof buildGymDiscoveryPublicPageArtifacts>
      | null = null;

    const modelStartedAt = Date.now();
    console.log(`${MEET_PARSE_LOG_PREFIX} model parse started`, {
      eventId,
      workflow,
    });
    if (workflow === "football") {
      const footballParsed = await parseFootballFromExtractedText(
        extraction.extractedText,
        extraction.extractionMeta,
        { performance },
      );
      parsed = footballParsed;
      console.log(`${MEET_PARSE_LOG_PREFIX} model parse finished`, {
        eventId,
        workflow,
        durationMs: durationMs(modelStartedAt),
        modelUsed: footballParsed.modelUsed,
        parseTitle: footballParsed.parseResult?.title || null,
      });
      const mappingStartedAt = Date.now();
      console.log(`${MEET_PARSE_LOG_PREFIX} mapping started`, {
        eventId,
        workflow,
      });
      mapped = await mapParseResultToFootballData(footballParsed.parseResult, currentData);
      console.log(`${MEET_PARSE_LOG_PREFIX} mapping finished`, {
        eventId,
        workflow,
        durationMs: durationMs(mappingStartedAt),
        nextGymPageTemplateId: null,
      });
    } else {
      const gymnasticsParsed = await parseMeetFromExtractedText(
        extraction.extractedText,
        extraction.extractionMeta,
        {
          traceId: eventId,
          mode: "core",
          performance,
        },
      );
      parsed = gymnasticsParsed;
      console.log(`${MEET_PARSE_LOG_PREFIX} model parse finished`, {
        eventId,
        workflow,
        durationMs: durationMs(modelStartedAt),
        modelUsed: gymnasticsParsed.modelUsed,
        parseTitle: gymnasticsParsed.parseResult?.title || null,
      });
      const mappingStartedAt = Date.now();
      console.log(`${MEET_PARSE_LOG_PREFIX} mapping started`, {
        eventId,
        workflow,
      });
      mapped = await mapParseResultToGymData(
        gymnasticsParsed.parseResult,
        currentData,
        extraction.extractionMeta,
      );
      gymnasticsPublicArtifacts = buildGymDiscoveryPublicPageArtifacts({
        parseResult: gymnasticsParsed.parseResult,
        baseData: currentData,
        evidence: gymnasticsParsed.evidence,
        extractionMeta: extraction.extractionMeta,
      });
      console.log(`${MEET_PARSE_LOG_PREFIX} mapping finished`, {
        eventId,
        workflow,
        durationMs: durationMs(mappingStartedAt),
        nextGymPageTemplateId: "pending",
      });
    }
    const nextGymPageTemplateId =
      workflow === "gymnastics"
        ? resolveGymMeetTemplateId({ ...currentData, ...mapped }) || DEFAULT_GYM_MEET_TEMPLATE_ID
        : null;
    const detectedGymLayoutImage = extraction.extractionMeta?.gymLayoutImageDataUrl || null;
    if (workflow === "gymnastics") {
      if (repairMode && !detectedGymLayoutImage) {
        mapped.advancedSections = mapped.advancedSections || {};
        mapped.advancedSections.logistics = mapped.advancedSections.logistics || {};
        mapped.advancedSections.logistics.gymLayoutImage = "";
        mapped.customFields = mapped.customFields || {};
        mapped.customFields.advancedSections = mapped.advancedSections;
      } else if (detectedGymLayoutImage && !mapped?.advancedSections?.logistics?.gymLayoutImage) {
        mapped.advancedSections = mapped.advancedSections || {};
        mapped.advancedSections.logistics = mapped.advancedSections.logistics || {};
        mapped.advancedSections.logistics.gymLayoutImage = detectedGymLayoutImage;
        mapped.customFields = mapped.customFields || {};
        mapped.customFields.advancedSections = mapped.advancedSections;
      }
    }
    if (workflow === "gymnastics") {
      console.log(`${MEET_PARSE_LOG_PREFIX} gymnastics template resolved`, {
        eventId,
        nextGymPageTemplateId,
      });
    }
    const coreUpdatedAt = new Date().toISOString();
    const enrichmentPending = buildEnrichmentStatus(workflow, {
      state: workflow === "gymnastics" ? "pending" : "not_applicable",
      pending: workflow === "gymnastics",
    });
    let nextData: Record<string, any> = {
      ...mapped,
      ...(workflow === "gymnastics" ? { pageTemplateId: nextGymPageTemplateId } : {}),
      discoverySource: {
        ...(currentData.discoverySource || {}),
        status: "parsed",
        workflow,
        input: sourceInput,
        extractedText: extraction.extractedText,
        extractionMeta: sanitizeExtractionMetaForPersistence(
          extraction.extractionMeta,
          debugArtifacts,
        ),
        ...(workflow === "gymnastics" && "evidence" in parsed ? { evidence: parsed.evidence } : {}),
        ...(workflow === "gymnastics" && gymnasticsPublicArtifacts
          ? {
              pipelineVersion: gymnasticsPublicArtifacts.pipelineVersion,
              publicPageSections: gymnasticsPublicArtifacts.publicPageSections,
              publishAssessment: gymnasticsPublicArtifacts.publishAssessment,
            }
          : {}),
        parseResult:
          workflow === "gymnastics"
            ? stripGymScheduleGridsFromParseResult(
                (gymnasticsPublicArtifacts?.parseResult || parsed.parseResult) as ParseResult
              )
            : parsed.parseResult,
        rawModelOutput: parsed.rawModelOutput,
        modelUsed: parsed.modelUsed,
        performance: buildPersistedPerformance(performance),
        enrichment: enrichmentPending,
        coreUpdatedAt,
        enrichedAt: null,
        updatedAt: coreUpdatedAt,
      },
    };

    if (workflow === "gymnastics") {
      const enrichStartedAt = Date.now();
      console.log(`${MEET_PARSE_LOG_PREFIX} inline enrichment started`, { eventId });
      const { nextData: enrichedData } = await runInlineGymnasticsEnrichmentPhase({
        eventId,
        hydratedSourceInput,
        mergedCoreEventData: nextData,
        sourceInput,
        performance,
      });
      nextData = enrichedData;
      console.log(`${MEET_PARSE_LOG_PREFIX} inline enrichment finished`, {
        eventId,
        durationMs: durationMs(enrichStartedAt),
      });
    }

    const enrichment = (nextData.discoverySource as any)?.enrichment ?? enrichmentPending;

    const persistStartedAt = Date.now();
    console.log(`${MEET_PARSE_LOG_PREFIX} persistence started`, {
      eventId,
      workflow,
    });
    await updateEventHistoryData(eventId, nextData);
    performance.persistMs = durationMs(persistStartedAt);
    const persistedTitle = safeString(mapped?.title || parsed.parseResult.title);
    if (persistedTitle) {
      await updateEventHistoryTitle(eventId, persistedTitle);
    }
    if (row.user_id) {
      invalidateUserHistory(row.user_id);
      invalidateUserDashboard(row.user_id);
    }
    console.log(`${MEET_PARSE_LOG_PREFIX} persistence finished`, {
      eventId,
      workflow,
      durationMs: durationMs(persistStartedAt),
    });
    const parseSummary = summarizeDiscoveryPerformanceForLog(performance);
    console.log(`${MEET_PARSE_LOG_PREFIX} request completed`, {
      eventId,
      workflow,
      totalDurationMs: durationMs(startedAt),
      modelUsed: parsed.modelUsed,
      repaired: repairMode,
      phase: "core",
      textQuality: extraction.extractionMeta?.textQuality || null,
      performance,
      parseSummary,
    });

    return NextResponse.json({
      ok: true,
      eventId,
      repaired: repairMode,
      modelUsed: parsed.modelUsed,
      parseResult: parsed.parseResult,
      phase: "core",
      enrichment,
      performance,
      parseSummary,
      statuses:
        workflow === "football"
          ? computeFootballBuilderStatuses(nextData)
          : computeGymBuilderStatuses(nextData),
    });
  } catch (err: any) {
    console.error(`${MEET_PARSE_LOG_PREFIX} parse failed`, {
      message: err?.message,
      stack: err?.stack,
      cause: err?.cause,
      response: err?.response?.data || err?.response || null,
    });
    return NextResponse.json(
      { error: String(err?.message || err || "Parse failed") },
      { status: 500 },
    );
  }
}
