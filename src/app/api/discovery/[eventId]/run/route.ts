import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventDiscoveryByEventId, getEventHistoryById } from "@/lib/db";
import { dispatchDiscoveryPipeline } from "@/lib/discovery/run";
import { ensureDiscoveryForExistingEvent } from "@/lib/discovery/persist";
import { isDiscoveryCancellationRequested } from "@/lib/discovery/intake-recovery";
import { getEventPermissions } from "@/lib/event-collaboration";
import { creationAccessErrorResponse, requireDiscoveryCreationAccess } from "@/lib/creation-access-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function hasActiveLease(discovery: Awaited<ReturnType<typeof getEventDiscoveryByEventId>>) {
  const expiresAt = discovery?.pipeline?.lease?.expiresAt;
  if (!expiresAt) return false;
  const leaseMs = Date.parse(expiresAt);
  return Number.isFinite(leaseMs) && leaseMs > Date.now();
}

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to continue this import." }, { status: 403 });
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  const { eventId } = await context.params;
  const historyRow = await getEventHistoryById(eventId);
  if (!historyRow) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!historyRow.user_id || !(await getEventPermissions(historyRow, userId)).canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discovery =
    (await getEventDiscoveryByEventId(eventId)) || (await ensureDiscoveryForExistingEvent(eventId));
  if (!discovery) {
    return NextResponse.json({ error: "Discovery not found" }, { status: 404 });
  }
  try { await requireDiscoveryCreationAccess(historyRow, discovery.source, userId); }
  catch (error) { return creationAccessErrorResponse(error) || NextResponse.json({ error: "Your access could not be checked. Your source is kept; please retry." }, { status: 503 }); }
  if (await isDiscoveryCancellationRequested(eventId)) return NextResponse.json({ error: "This import was cancelled. Start a new import to continue.", code: "cancelled" }, { status: 409 });

  if (
    !force &&
    (hasActiveLease(discovery) || discovery.pipeline.processingStage === "review_ready")
  ) {
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

  after(() => dispatchDiscoveryPipeline(eventId, userId));
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
