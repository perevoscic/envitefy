import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventDiscoveryStatusByEventId, getEventHistoryOwnerById } from "@/lib/db";
import { buildDiscoveryStatusResponse } from "@/lib/discovery/status";
import { ensureDiscoveryForExistingEvent } from "@/lib/discovery/persist";
import { isDiscoveryCancellationRequested } from "@/lib/discovery/intake-recovery";
import { getEventPermissions } from "@/lib/event-collaboration";
import { getEventHistoryById } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await context.params;
  const historyRow = await getEventHistoryOwnerById(eventId);
  if (!historyRow) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const fullRow = historyRow.user_id && historyRow.user_id !== userId ? await getEventHistoryById(eventId) : null;
  const canRead = historyRow.user_id === userId || Boolean(fullRow && (await getEventPermissions(fullRow, userId)).canEdit);
  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discovery =
    (await getEventDiscoveryStatusByEventId(eventId)) ||
    (await ensureDiscoveryForExistingEvent(eventId));
  if (!discovery) {
    return NextResponse.json(
      {
        eventId,
        discoveryId: null,
        processingStage: "ingested",
        lastSuccessfulStage: null,
        needsHumanReview: false,
        draftReady: false,
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

  const status = buildDiscoveryStatusResponse(discovery);
  if (await isDiscoveryCancellationRequested(eventId)) return NextResponse.json({ ...status, draftReady: false, builderReady: false, errorCode: "cancelled", errorMessage: "This import was cancelled." });
  return NextResponse.json(status);
}
