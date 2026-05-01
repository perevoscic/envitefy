import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { buildEventAssetContent } from "@/lib/concierge/assets";
import {
  createEventAsset,
  isEventAssetType,
  listEventAssets,
} from "@/lib/concierge/event-storage";

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
  return { userId, event };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const owned = await requireOwnedEvent(eventId);
  if ("error" in owned) return owned.error;
  const assets = await listEventAssets(eventId, owned.userId);
  return NextResponse.json({ assets });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const owned = await requireOwnedEvent(eventId);
  if ("error" in owned) return owned.error;
  const body = asRecord(await req.json().catch(() => ({})));
  const rawAssetType = body.assetType ?? body.asset_type;
  if (!isEventAssetType(rawAssetType)) {
    return NextResponse.json({ error: "Valid assetType required" }, { status: 400 });
  }

  const generated = buildEventAssetContent({
    eventId,
    eventTitle: owned.event.title,
    eventData: asRecord(owned.event.data),
    assetType: rawAssetType,
    brief: typeof body.brief === "string" ? body.brief : "",
  });
  const bodyContent = asRecord(body.content);
  const asset = await createEventAsset({
    userId: owned.userId,
    eventId,
    assetType: rawAssetType,
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : generated.title,
    content: Object.keys(bodyContent).length ? bodyContent : generated.content,
    design: Object.keys(asRecord(body.design)).length ? asRecord(body.design) : generated.design,
    metadata: {
      ...generated.metadata,
      ...asRecord(body.metadata),
    },
  });
  invalidateUserHistory(owned.userId);
  invalidateUserDashboard(owned.userId);
  return NextResponse.json({ asset }, { status: 201 });
}
