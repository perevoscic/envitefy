import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventDiscoveryByEventId, getEventHistoryById } from "@/lib/db";
import { buildDiscoveryStatusResponse, ensureDiscoveryForExistingEvent } from "@/lib/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await context.params;
  const historyRow = await getEventHistoryById(eventId);
  if (!historyRow) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (historyRow.user_id && historyRow.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discovery =
    (await getEventDiscoveryByEventId(eventId)) || (await ensureDiscoveryForExistingEvent(eventId));
  if (!discovery) {
    return NextResponse.json(
      {
        eventId,
        discoveryId: null,
        processingStage: "ingested",
        lastSuccessfulStage: null,
        needsHumanReview: false,
        builderReady: false,
        errorCode: null,
        errorStage: null,
        errorMessage: null,
        errorDetails: null,
        reviewFlags: [],
      },
      { status: 202 },
    );
  }

  return NextResponse.json(buildDiscoveryStatusResponse(discovery));
}
