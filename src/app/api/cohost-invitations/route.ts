import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  acceptCollaboratorInvitation,
  readCollaboratorInvitation,
} from "@/lib/event-collaboration";
import { EventCollaborationError } from "@/lib/event-collaboration-types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new EventCollaborationError("Open the invitation in Envitefy.", 403, "cross_site");
    const raw: unknown = await request.json().catch(() => null);
    const token =
      raw && typeof raw === "object" && "token" in raw && typeof raw.token === "string"
        ? raw.token
        : "";
    const invite = await readCollaboratorInvitation(token);
    if (!invite)
      throw new EventCollaborationError(
        "This invitation is unavailable. Ask the owner to send a new one.",
        404,
        "invalid_invitation",
      );
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    const available =
      !invite.revoked_at && !invite.accepted_at && Date.parse(invite.expires_at) > Date.now();
    const acceptedByCurrentUser = Boolean(
      userId && invite.accepted_at && invite.accepted_by === userId && !invite.revoked_at,
    );
    if (raw && typeof raw === "object" && "action" in raw && raw.action === "accept") {
      if (!userId)
        throw new EventCollaborationError(
          "Sign in or create an account to accept this invitation.",
          401,
          "sign_in_required",
        );
      const eventId = await acceptCollaboratorInvitation(token, userId);
      return NextResponse.json({ eventId, href: `/event/${eventId}?tab=dashboard` }, { headers });
    }
    // Limited invitation metadata only; no private event fields or guest contacts.
    return NextResponse.json(
      {
        title: invite.eventTitle,
        ownerName: invite.ownerName || "The event owner",
        email: invite.email,
        available,
        accepted: Boolean(invite.accepted_at),
        acceptedByCurrentUser,
        href: acceptedByCurrentUser ? `/event/${invite.event_id}?tab=dashboard` : null,
        signedInEmail: session?.user?.email || null,
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof EventCollaborationError
            ? error.message
            : "The invitation could not be loaded. Please try again.",
      },
      { status: error instanceof EventCollaborationError ? error.status : 503, headers },
    );
  }
}
