import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { sendCoHostInvitationEmail } from "@/lib/email";
import {
  ensureEventCollaboration,
  inviteEventCollaborator,
  listEventAccess,
  markCollaborationEmail,
  requireCollaborationOwner,
  revokeEventCollaborator,
} from "@/lib/event-collaboration";
import { EventCollaborationError } from "@/lib/event-collaboration-types";
import { validGuestEmail } from "@/lib/event-message-types";
import { resolvePublicAssetOrigin } from "@/lib/public-asset-url";
import { createServerTimingTracker, type ServerTimingTracker } from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };
async function owner(context: Context, timing: ServerTimingTracker) {
  const session = await timing.time("session", () => getServerSession(authOptions));
  const userId = await timing.time("user", () => resolveSessionUserId(session));
  if (!userId)
    throw new EventCollaborationError("Sign in to manage co-hosts.", 401, "sign_in_required");
  const { id } = await context.params;
  const event = await timing.time("owner", () => requireCollaborationOwner(id, userId));
  return {
    id,
    userId,
    event,
    name: session?.user?.name || session?.user?.email || "The event owner",
  };
}
function finish(response: Response, timing: ServerTimingTracker, method: string) {
  timing.applyHeader(response);
  if (timing.getTotalMs() >= 1500)
    console.warn(
      "[event-access] slow request",
      timing.toObject({ method, status: response.status }),
    );
  return response;
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof EventCollaborationError
          ? error.message
          : "Co-host access is unavailable. Please try again.",
      code: error instanceof EventCollaborationError ? error.code : "unavailable",
    },
    { status: error instanceof EventCollaborationError ? error.status : 503, headers },
  );
}
export async function GET(_request: Request, context: Context) {
  const timing = createServerTimingTracker(true);
  try {
    const owned = await owner(context, timing);
    await timing.time("schema", ensureEventCollaboration);
    const people = await timing.time("roster", () => listEventAccess(owned.id));
    return finish(NextResponse.json({ people }, { headers }), timing, "GET");
  } catch (error) {
    return finish(failure(error), timing, "GET");
  }
}
export async function POST(request: Request, context: Context) {
  const timing = createServerTimingTracker(true);
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new EventCollaborationError("Open Envitefy to invite a co-host.", 403, "cross_site");
    const owned = await owner(context, timing);
    const raw: unknown = await request.json().catch(() => null);
    const email =
      raw && typeof raw === "object" && "email" in raw && typeof raw.email === "string"
        ? raw.email.trim().toLowerCase()
        : "";
    if (!validGuestEmail(email) || email.length > 254)
      throw new EventCollaborationError("Enter a valid email address.", 400, "invalid_email");
    await timing.time("schema", ensureEventCollaboration);
    const invite = await timing.time("invitation", () =>
      inviteEventCollaborator(owned.id, owned.userId, email),
    );
    let sent = false;
    try {
      await timing.time("smtp", () =>
        sendCoHostInvitationEmail({
          toEmail: email,
          ownerName: owned.name,
          eventTitle: invite.event.title,
          acceptUrl: `${resolvePublicAssetOrigin()}/cohost-invite#${invite.token}`,
        }),
      );
      sent = true;
    } catch {
      /* The pending invite remains visible with an explicit retry action. */
    }
    await timing.time("email_status", () =>
      markCollaborationEmail(invite.id, sent ? "sent" : "failed"),
    );
    const people = await timing.time("roster", () => listEventAccess(owned.id));
    return finish(
      NextResponse.json({ people, emailSent: sent }, { status: sent ? 201 : 202, headers }),
      timing,
      "POST",
    );
  } catch (error) {
    return finish(failure(error), timing, "POST");
  }
}
export async function DELETE(request: Request, context: Context) {
  const timing = createServerTimingTracker(true);
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new EventCollaborationError("Open Envitefy to remove access.", 403, "cross_site");
    const owned = await owner(context, timing);
    const id = new URL(request.url).searchParams.get("personId") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id))
      throw new EventCollaborationError("Choose a co-host or invitation.", 400, "invalid_person");
    await timing.time("schema", ensureEventCollaboration);
    await timing.time("revoke", () => revokeEventCollaborator(owned.id, owned.userId, id));
    const people = await timing.time("roster", () => listEventAccess(owned.id));
    return finish(NextResponse.json({ people }, { headers }), timing, "DELETE");
  } catch (error) {
    return finish(failure(error), timing, "DELETE");
  }
}
