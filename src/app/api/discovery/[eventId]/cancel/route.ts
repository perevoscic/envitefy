import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventDiscoveryByEventId, getEventHistoryById } from "@/lib/db";
import { cancelDiscoveryPipeline } from "@/lib/discovery/cancel";
import { hideCancelledDiscoveryShell, requestPersistentDiscoveryCancellation } from "@/lib/discovery/intake-recovery";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventPermissions } from "@/lib/event-collaboration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await context.params;
  const historyRow = await getEventHistoryById(eventId);
  if (!historyRow) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!historyRow.user_id || !(await getEventPermissions(historyRow, userId)).canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discovery = await getEventDiscoveryByEventId(eventId);
  if (!discovery) {
    return NextResponse.json({ error: "Discovery not found" }, { status: 404 });
  }

  await requestPersistentDiscoveryCancellation(eventId, userId);
  cancelDiscoveryPipeline(eventId);
  await hideCancelledDiscoveryShell(eventId);
  if (historyRow.user_id) { invalidateUserHistory(historyRow.user_id); invalidateUserDashboard(historyRow.user_id); }
  return NextResponse.json(
    {
      eventId: discovery.eventId,
      discoveryId: discovery.id,
      processingStage: discovery.pipeline.processingStage,
      accepted: true,
    },
    { status: 202 },
  );
}
