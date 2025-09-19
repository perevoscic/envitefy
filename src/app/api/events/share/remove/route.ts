import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, revokeEventShare, getEventHistoryById } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const byUserId = await getUserIdByEmail(email);
    if (!byUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    const recipientUserId = body.recipientUserId ? String(body.recipientUserId) : null;
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

    // Ensure event exists; allow recipient to revoke their own grant, or owner to revoke theirs
    const existing = await getEventHistoryById(eventId);
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const count = await revokeEventShare({ eventId, byUserId, recipientUserId });
    return NextResponse.json({ ok: true, revoked: count });
  } catch (err: any) {
    try { console.error("[share remove] POST error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}


