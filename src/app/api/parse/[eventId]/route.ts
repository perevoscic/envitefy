import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  getEventHistoryById,
  getEventHistoryInputBlob,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  computeGymBuilderStatuses,
  createDiscoveryPerformance,
  extractDiscoveryText,
  isDiscoveryDebugArtifactsEnabled,
  mapParseResultToGymData,
  parseMeetFromExtractedText,
  resolveDiscoveryBudget,
  type DiscoveryPerformance,
  type DiscoveryEnrichmentStatus,
  type DiscoverySourceInput,
  type DiscoveryWorkflow,
} from "@/lib/meet-discovery";
import {
  computeFootballBuilderStatuses,
  mapParseResultToFootballData,
  parseFootballFromExtractedText,
} from "@/lib/football-discovery";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";

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

function buildPersistedPerformance(
  performance: DiscoveryPerformance
): DiscoveryPerformance {
  return {
    ...performance,
    persistMs: 0,
  };
}

function buildEnrichmentStatus(
  workflow: DiscoveryWorkflow,
  overrides: Partial<DiscoveryEnrichmentStatus> = {}
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

export async function POST(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
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
    const coreBudgetMs = resolveDiscoveryBudget("core");
    const performance = createDiscoveryPerformance();
    console.log(`${MEET_PARSE_LOG_PREFIX} source resolved`, {
      eventId,
      workflow,
      sourceType: sourceInput?.type || null,
      blobStored:
        sourceInput?.type === "file" ? Boolean(sourceInput?.blobStored) : null,
      fileName: sourceInput?.type === "file" ? sourceInput.fileName : null,
      sizeBytes: sourceInput?.type === "file" ? sourceInput.sizeBytes : null,
    });
    if (!sourceInput || !sourceInput.type) {
      return NextResponse.json({ error: "No discovery source input found" }, { status: 400 });
    }

    let hydratedSourceInput = sourceInput;
    if (sourceInput.type === "file" && !safeString(sourceInput.dataUrl || "")) {
      const hydrateStartedAt = Date.now();
      console.log(`${MEET_PARSE_LOG_PREFIX} hydrating blob-backed input`, {
        eventId,
      });
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
        mimeType: safeString(sourceInput.mimeType) || safeString(blob.mime_type) || "application/octet-stream",
        sizeBytes:
          Number.isFinite(sourceInput.sizeBytes)
            ? sourceInput.sizeBytes
            : Number(blob.size_bytes || blob.data.length),
        dataUrl: `data:${safeString(blob.mime_type) || "application/octet-stream"};base64,${blob.data.toString("base64")}`,
        blobStored: true,
      };
      console.log(`${MEET_PARSE_LOG_PREFIX} hydrated blob-backed input`, {
        eventId,
        sizeBytes: blob.size_bytes || blob.data.length,
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

    const modelStartedAt = Date.now();
    console.log(`${MEET_PARSE_LOG_PREFIX} model parse started`, {
      eventId,
      workflow,
    });
    if (workflow === "football") {
      const footballParsed = await parseFootballFromExtractedText(
        extraction.extractedText,
        extraction.extractionMeta,
        { performance }
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
      mapped = await mapParseResultToFootballData(
        footballParsed.parseResult,
        currentData
      );
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
        }
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
        extraction.extractionMeta
      );
      console.log(`${MEET_PARSE_LOG_PREFIX} mapping finished`, {
        eventId,
        workflow,
        durationMs: durationMs(mappingStartedAt),
        nextGymPageTemplateId: "pending",
      });
    }
    const nextGymPageTemplateId =
      workflow === "gymnastics"
        ? resolveGymMeetTemplateId({ ...currentData, ...mapped }) ||
          DEFAULT_GYM_MEET_TEMPLATE_ID
        : null;
    const detectedGymLayoutImage = extraction.extractionMeta?.gymLayoutImageDataUrl || null;
    if (workflow === "gymnastics") {
      if (repairMode && !detectedGymLayoutImage) {
        mapped.advancedSections = mapped.advancedSections || {};
        mapped.advancedSections.logistics = mapped.advancedSections.logistics || {};
        mapped.advancedSections.logistics.gymLayoutImage = "";
        mapped.customFields = mapped.customFields || {};
        mapped.customFields.advancedSections = mapped.advancedSections;
      } else if (
        detectedGymLayoutImage &&
        !mapped?.advancedSections?.logistics?.gymLayoutImage
      ) {
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
    const enrichment = buildEnrichmentStatus(workflow, {
      state: workflow === "gymnastics" ? "pending" : "not_applicable",
      pending: workflow === "gymnastics",
    });
    const nextData = {
      ...mapped,
      ...(workflow === "gymnastics"
        ? { pageTemplateId: nextGymPageTemplateId }
        : {}),
      discoverySource: {
        ...(currentData.discoverySource || {}),
        status: "parsed",
        workflow,
        input: sourceInput,
        extractedText: extraction.extractedText,
        extractionMeta: sanitizeExtractionMetaForPersistence(
          extraction.extractionMeta,
          debugArtifacts
        ),
        ...(workflow === "gymnastics" && "evidence" in parsed
          ? { evidence: parsed.evidence }
          : {}),
        parseResult: parsed.parseResult,
        rawModelOutput: parsed.rawModelOutput,
        modelUsed: parsed.modelUsed,
        performance: buildPersistedPerformance(performance),
        enrichment,
        coreUpdatedAt: new Date().toISOString(),
        enrichedAt: null,
        updatedAt: new Date().toISOString(),
      },
    };

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
    console.log(`${MEET_PARSE_LOG_PREFIX} request completed`, {
      eventId,
      workflow,
      totalDurationMs: durationMs(startedAt),
      modelUsed: parsed.modelUsed,
      repaired: repairMode,
      phase: "core",
      textQuality: extraction.extractionMeta?.textQuality || null,
      performance,
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
      { status: 500 }
    );
  }
}
