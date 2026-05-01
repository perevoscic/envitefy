import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { deleteEventAsset, updateEventAsset } from "@/lib/concierge/event-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function requireOwnedEvent(eventId: string) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const event = await getEventHistoryById(eventId);
  if (!event) {
    return { error: NextResponse.json({ error: "Event not found" }, { status: 404 }) };
  }
  if (event.user_id !== userId) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { userId };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const { id: eventId, assetId } = await params;
  const owned = await requireOwnedEvent(eventId);
  if ("error" in owned) return owned.error;
  const body = asRecord(await req.json().catch(() => ({})));
  const asset = await updateEventAsset({
    userId: owned.userId,
    eventId,
    assetId,
    patch: {
      title: typeof body.title === "string" ? body.title : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      content: asRecord(body.content),
      design: asRecord(body.design),
      metadata: asRecord(body.metadata),
    },
  });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  invalidateUserHistory(owned.userId);
  invalidateUserDashboard(owned.userId);
  return NextResponse.json({ asset });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const { id: eventId, assetId } = await params;
  const owned = await requireOwnedEvent(eventId);
  if ("error" in owned) return owned.error;
  const deleted = await deleteEventAsset({ userId: owned.userId, eventId, assetId });
  if (!deleted) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  invalidateUserHistory(owned.userId);
  invalidateUserDashboard(owned.userId);
  return NextResponse.json({ ok: true });
}
