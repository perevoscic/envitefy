import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptEventShare, getUserIdByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const recipientUserId = await getUserIdByEmail(email);
    if (!recipientUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

    const updated = await acceptEventShare({ eventId, recipientUserId });
    if (!updated) return NextResponse.json({ error: "No pending invite found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try { console.error("[share accept] POST error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}


