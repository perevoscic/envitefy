import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  acceptCoHostInvitationById,
  acceptCollaboratorInvitation,
  declineCoHostInvitationById,
  listPendingCoHostInvitations,
  readCollaboratorInvitation,
} from "@/lib/event-collaboration";
import { EventCollaborationError } from "@/lib/event-collaboration-types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof EventCollaborationError
          ? error.message
          : "Co-host invitations could not be loaded. Please try again.",
    },
    { status: error instanceof EventCollaborationError ? error.status : 503, headers },
  );
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    if (!userId)
      throw new EventCollaborationError(
        "Sign in to view co-host invitations.",
        401,
        "sign_in_required",
      );
    return NextResponse.json(
      { invitations: await listPendingCoHostInvitations(userId) },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new EventCollaborationError("Open the invitation in Envitefy.", 403, "cross_site");
    const raw: unknown = await request.json().catch(() => null);
    if (raw && typeof raw === "object" && "invitationId" in raw) {
      const session = await getServerSession(authOptions);
      const userId = await resolveSessionUserId(session);
      if (!userId)
        throw new EventCollaborationError(
          "Sign in to accept this invitation.",
          401,
          "sign_in_required",
        );
      if (
        !("action" in raw) ||
        (raw.action !== "accept" && raw.action !== "decline") ||
        typeof raw.invitationId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.invitationId)
      )
        throw new EventCollaborationError(
          "Choose a valid co-host invitation.",
          400,
          "invalid_invitation",
        );
      if (raw.action === "decline") {
        await declineCoHostInvitationById(raw.invitationId, userId);
        return NextResponse.json({ declined: true }, { headers });
      }
      const eventId = await acceptCoHostInvitationById(raw.invitationId, userId);
      return NextResponse.json({ eventId, href: `/event/${eventId}?tab=dashboard` }, { headers });
    }
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
