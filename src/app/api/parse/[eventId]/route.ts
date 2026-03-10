import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getUserIdByEmail,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import {
  computeGymBuilderStatuses,
  extractDiscoveryText,
  mapParseResultToGymData,
  parseMeetFromExtractedText,
  type DiscoverySourceInput,
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

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  try {
    const url = new URL(req.url);
    const repairMode = url.searchParams.get("repair") === "1";
    const { eventId } = await context.params;
    const row = await getEventHistoryById(eventId);
    if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const sessionUserId = await getSessionUserId();
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentData = (row.data || {}) as Record<string, any>;
    const sourceInput = currentData?.discoverySource?.input as DiscoverySourceInput | undefined;
    const workflow =
      safeString(currentData?.discoverySource?.workflow) === "football"
        ? "football"
        : "gymnastics";
    if (!sourceInput || !sourceInput.type) {
      return NextResponse.json({ error: "No discovery source input found" }, { status: 400 });
    }

    const extraction = await extractDiscoveryText(sourceInput);
    if (!extraction.extractedText || extraction.extractedText.length < 20) {
      return NextResponse.json({ error: "Not enough text extracted to parse" }, { status: 422 });
    }

    let parsed:
      | Awaited<ReturnType<typeof parseFootballFromExtractedText>>
      | Awaited<ReturnType<typeof parseMeetFromExtractedText>>;
    let mapped: Record<string, any>;

    if (workflow === "football") {
      parsed = await parseFootballFromExtractedText(
        extraction.extractedText,
        extraction.extractionMeta
      );
      mapped = await mapParseResultToFootballData(parsed.parseResult, currentData);
    } else {
      parsed = await parseMeetFromExtractedText(
        extraction.extractedText,
        extraction.extractionMeta
      );
      mapped = await mapParseResultToGymData(
        parsed.parseResult,
        currentData,
        extraction.extractionMeta
      );
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
        extractionMeta: extraction.extractionMeta,
        ...(workflow === "gymnastics" && "evidence" in parsed
          ? { evidence: parsed.evidence }
          : {}),
        parseResult: parsed.parseResult,
        rawModelOutput: parsed.rawModelOutput,
        modelUsed: parsed.modelUsed,
        updatedAt: new Date().toISOString(),
      },
    };

    await updateEventHistoryData(eventId, nextData);
    if (parsed.parseResult.title) {
      await updateEventHistoryTitle(eventId, parsed.parseResult.title);
    }
    if (row.user_id) {
      invalidateUserHistory(row.user_id);
    }

    return NextResponse.json({
      ok: true,
      eventId,
      repaired: repairMode,
      modelUsed: parsed.modelUsed,
      parseResult: parsed.parseResult,
      statuses:
        workflow === "football"
          ? computeFootballBuilderStatuses(nextData)
          : computeGymBuilderStatuses(nextData),
    });
  } catch (err: any) {
    console.error("[meet-parse] parse failed", {
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
