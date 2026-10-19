import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { intakeDiscovery } from "@/lib/discovery/intake";
import { cancelDiscoveryIntakeKey, hideCancelledDiscoveryShell, recoverDiscoveryIntake, validDiscoveryIntakeKey } from "@/lib/discovery/intake-recovery";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { cancelDiscoveryPipeline } from "@/lib/discovery/cancel";
import { creationAccessErrorResponse } from "@/lib/creation-access-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to import your event." }, { status: 403 });
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await intakeDiscovery({ request, userId });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      eventId: result.eventId,
      discoveryId: result.discoveryId,
      workflow: result.workflow,
      activityProfile: result.activityProfile,
      activityLabel: "activityLabel" in result ? result.activityLabel : null,
      eventArchetype: "eventArchetype" in result ? result.eventArchetype : null,
      processingStage: result.processingStage,
    });
  } catch (error) {
    const access = creationAccessErrorResponse(error);
    if (access) return access;
    const message = error instanceof Error ? error.message : String(error);
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      Number.isFinite((error as any).status)
        ? Number((error as any).status)
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Recover an intake whose upload response was interrupted, without creating another event. */
export async function GET(request: Request) {
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = validDiscoveryIntakeKey(new URL(request.url).searchParams.get("clientIntakeId"));
  if (!key) return NextResponse.json({ error: "Provide an intake identifier." }, { status: 400 });
  const recovered = await recoverDiscoveryIntake(userId, key);
  return NextResponse.json(recovered || { eventId: null }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to cancel this import." }, { status: 403 });
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = validDiscoveryIntakeKey(new URL(request.url).searchParams.get("clientIntakeId"));
  if (!key) return NextResponse.json({ error: "Provide an intake identifier." }, { status: 400 });
  const eventId = await cancelDiscoveryIntakeKey(userId, key);
  if (eventId) {
    cancelDiscoveryPipeline(eventId);
    await hideCancelledDiscoveryShell(eventId);
    invalidateUserHistory(userId);
    invalidateUserDashboard(userId);
  }
  return NextResponse.json({ accepted: true, eventId });
}
