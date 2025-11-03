import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrUpdateEventShare, getEventHistoryById, getUserIdByEmail, incrementUserSharesSent } from "@/lib/db";
import { sendShareEventEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";
import { invalidateUserHistory } from "@/lib/history-cache";

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
    const recipientFirstName = (String(body.recipientFirstName || "").trim() || null) as string | null;
    const recipientLastName = (String(body.recipientLastName || "").trim() || null) as string | null;
    if (!eventId || !recipientEmail) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await getEventHistoryById(eventId);
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (existing.user_id && existing.user_id !== ownerUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let share: any = null;
    try {
      share = await createOrUpdateEventShare({
        eventId,
        ownerUserId,
        recipientEmail,
        recipientFirstName,
        recipientLastName,
      });
      // Increment owner's shares_sent counter
      await incrementUserSharesSent({ userId: ownerUserId, delta: 1 });
      // Invalidate owner's cache since share status changed
      invalidateUserHistory(ownerUserId);
    } catch (err: any) {
      // If event_shares table is not present yet, bypass DB share and still email the recipient
      try { console.warn("[share] falling back to email only:", err?.message || err); } catch {}
    }

    // Email notification to recipient (from no-reply)
    try {
      const ownerEmail = email;
      const slugTitle =
        typeof existing.title === "string" && existing.title.trim().length
          ? existing.title
          : "Event";
      const slug = slugTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "event";
      const eventUrl = await absoluteUrl(`/event/${slug}-${eventId}`);
      await sendShareEventEmail({
        toEmail: recipientEmail,
        ownerEmail,
        eventTitle: slugTitle,
        eventUrl,
        recipientFirstName,
        recipientLastName,
      });
    } catch (e) {
      try { console.error("[share] email send failed", e); } catch {}
    }

    return NextResponse.json({ ok: true, share });
  } catch (err: any) {
    try { console.error("[share] POST error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}
