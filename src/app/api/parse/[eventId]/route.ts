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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  _req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const row = await getEventHistoryById(eventId);
    if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const sessionUserId = await getSessionUserId();
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentData = (row.data || {}) as Record<string, any>;
    const sourceInput = currentData?.discoverySource?.input as DiscoverySourceInput | undefined;
    if (!sourceInput || !sourceInput.type) {
      return NextResponse.json({ error: "No discovery source input found" }, { status: 400 });
    }

    const extraction = await extractDiscoveryText(sourceInput);
    if (!extraction.extractedText || extraction.extractedText.length < 20) {
      return NextResponse.json({ error: "Not enough text extracted to parse" }, { status: 422 });
    }

    const parsed = await parseMeetFromExtractedText(
      extraction.extractedText,
      extraction.extractionMeta
    );
    const mapped = await mapParseResultToGymData(parsed.parseResult, currentData);
    const detectedGymLayoutImage = extraction.extractionMeta?.gymLayoutImageDataUrl || null;
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
    const nextData = {
      ...mapped,
      discoverySource: {
        ...(currentData.discoverySource || {}),
        status: "parsed",
        input: sourceInput,
        extractedText: extraction.extractedText,
        extractionMeta: extraction.extractionMeta,
        evidence: parsed.evidence,
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
      modelUsed: parsed.modelUsed,
      parseResult: parsed.parseResult,
      statuses: computeGymBuilderStatuses(nextData),
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
