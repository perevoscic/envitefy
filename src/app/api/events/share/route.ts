import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrUpdateEventShare, getEventHistoryById, getUserIdByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ownerUserId = await getUserIdByEmail(email);
    if (!ownerUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase();
    if (!eventId || !recipientEmail) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await getEventHistoryById(eventId);
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (existing.user_id && existing.user_id !== ownerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const share = await createOrUpdateEventShare({ eventId, ownerUserId, recipientEmail });
    return NextResponse.json({ ok: true, share });
  } catch (err: any) {
    try { console.error("[share] POST error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}


