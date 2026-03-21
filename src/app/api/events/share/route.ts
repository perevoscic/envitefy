import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createOrUpdateEventShare,
  getEventHistoryById,
  getUserIdByEmail,
  incrementUserSharesSent,
  type EventShareRow,
} from "@/lib/db";
import { sendShareEventEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";

export const runtime = "nodejs";

type SessionLike = {
  user?: {
    email?: string | null;
  } | null;
} | null;

type ShareRequestBody = {
  eventId?: unknown;
  recipientEmail?: unknown;
  recipientFirstName?: unknown;
  recipientLastName?: unknown;
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }
  return String(error || "");
}

function shareErrorResponse(
  error: unknown
): { body: { error: string; code: string }; status: number } {
  const message = getErrorMessage(error);
  if (/recipient user not found/i.test(message)) {
    return {
      body: {
        error: "Recipient must have an Envitefy account before this event can appear under Invited Events.",
        code: "recipient_user_not_found",
      },
      status: 409,
    };
  }
  if (/cannot share to yourself/i.test(message)) {
    return {
      body: {
        error: "You cannot share an event with your own account.",
        code: "cannot_share_to_self",
      },
      status: 400,
    };
  }
  return {
    body: {
      error: "Unable to create the share record.",
      code: "share_create_failed",
    },
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as SessionLike;
    const email = typeof session?.user?.email === "string" ? session.user.email : undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ownerUserId = await getUserIdByEmail(email);
    if (!ownerUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as ShareRequestBody;
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

    let share: EventShareRow | null = null;
    try {
      share = await createOrUpdateEventShare({
        eventId,
        ownerUserId,
        recipientEmail,
        recipientFirstName,
        recipientLastName,
      });
    } catch (err: unknown) {
      try {
        console.error("[share] failed to create DB share", getErrorMessage(err));
      } catch {}
      const failure = shareErrorResponse(err);
      return NextResponse.json(failure.body, { status: failure.status });
    }

    await incrementUserSharesSent({ userId: ownerUserId, delta: 1 });
    invalidateUserHistory(ownerUserId);
    invalidateUserDashboard(ownerUserId);
    if (share?.recipient_user_id) {
      invalidateUserHistory(share.recipient_user_id);
      invalidateUserDashboard(share.recipient_user_id);
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
    } catch (error: unknown) {
      try { console.error("[share] email send failed", error); } catch {}
    }

    return NextResponse.json({ ok: true, share });
  } catch (error: unknown) {
    try { console.error("[share] POST error", error); } catch {}
    return NextResponse.json(
      {
        error: getErrorMessage(error) || "unknown error",
      },
      { status: 500 }
    );
  }
}
