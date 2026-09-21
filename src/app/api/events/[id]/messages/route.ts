import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { isEventDraft } from "@/lib/event-draft-access";
import {
  EventMessageError,
  validateEventMessage,
  validGuestEmail,
} from "@/lib/event-message-types";
import {
  currentMessageAudience,
  ensureEventMessages,
  listEventMessages,
  processEventMessage,
  retryEventMessage,
  saveEventMessage,
} from "@/lib/event-messages";
import { readOwnerRsvpSettings } from "@/lib/owner-rsvp-settings";
import { resolvePublicAssetOrigin } from "@/lib/public-asset-url";
import { buildEventPath } from "@/utils/event-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };

class MessageRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function ownerContext(context: Context) {
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);
  if (!userId) throw new MessageRequestError("Sign in to email guests.", 401);
  const { id } = await context.params;
  const event = await getEventHistoryById(id);
  if (!event || event.user_id !== userId)
    throw new MessageRequestError("Only the event owner can manage messages.", 403);
  if (isEventDraft(event.data))
    throw new MessageRequestError("Publish the event before emailing guests.", 409);
  const host = readOwnerRsvpSettings(event.data);
  const replyTo = validGuestEmail(host.email) ? host.email : null;
  const eventUrl = `${resolvePublicAssetOrigin()}${buildEventPath(id, event.title, undefined, event.public_slug)}`;
  await ensureEventMessages();
  return { eventId: id, eventTitle: event.title || "Your event", eventUrl, replyTo };
}

async function readData(owned: Awaited<ReturnType<typeof ownerContext>>) {
  const [audience, messages] = await Promise.all([
    currentMessageAudience(owned.eventId),
    listEventMessages(owned.eventId),
  ]);
  return {
    audienceCount: audience.length,
    messages,
    eventUrl: owned.eventUrl,
    replyTo: owned.replyTo,
  };
}

function failure(error: unknown) {
  if (error instanceof EventMessageError)
    return NextResponse.json({ error: error.message }, { status: 409, headers });
  return NextResponse.json(
    {
      error:
        error instanceof MessageRequestError
          ? error.message
          : "Messages are unavailable. Check the send history before trying again.",
    },
    { status: error instanceof MessageRequestError ? error.status : 503, headers },
  );
}

export async function GET(_req: Request, context: Context) {
  try {
    return NextResponse.json(await readData(await ownerContext(context)), { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: Request, context: Context) {
  try {
    const owned = await ownerContext(context);
    const raw: unknown = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new MessageRequestError("Invalid message request.", 400);
    const body = raw as Record<string, unknown>;
    if (body.action === "save" || body.action === "send") {
      let input: ReturnType<typeof validateEventMessage>;
      try {
        input = validateEventMessage(body, body.action === "send");
      } catch (error) {
        throw new MessageRequestError(
          error instanceof Error ? error.message : "Invalid message.",
          400,
        );
      }
      await saveEventMessage(owned.eventId, input, body.action === "send");
    } else if (body.action === "process" || body.action === "retry") {
      const messageId = typeof body.id === "string" ? body.id : "";
      if (!/^[0-9a-f-]{36}$/i.test(messageId))
        throw new MessageRequestError("Invalid message.", 400);
      const messages = await listEventMessages(owned.eventId);
      if (!messages.some((message) => message.id === messageId && message.status === "queued")) {
        throw new MessageRequestError("Message not found.", 404);
      }
      if (body.action === "retry") await retryEventMessage(owned.eventId, messageId);
      await processEventMessage({ ...owned, messageId });
    } else {
      throw new MessageRequestError("Choose Save draft or Send from Messages.", 400);
    }
    return NextResponse.json(await readData(owned), { headers });
  } catch (error) {
    return failure(error);
  }
}
