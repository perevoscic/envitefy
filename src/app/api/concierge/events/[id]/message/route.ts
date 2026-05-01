import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { applyEventActions, buildEventActionPlan } from "@/lib/concierge/event-actions";
import {
  appendConversationMessage,
  getOrCreateEventThread,
  listConversationMessages,
  listEventAssets,
  touchConversationThread,
} from "@/lib/concierge/event-storage";
import type {
  ConciergeEventMessageRequest,
  ConciergeEventMessageResponse,
} from "@/lib/concierge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Sign in to use this event assistant." } satisfies ConciergeEventMessageResponse,
        { status: 401 },
      );
    }

    const { id: eventId } = await params;
    const event = await getEventHistoryById(eventId);
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Event not found." } satisfies ConciergeEventMessageResponse,
        { status: 404 },
      );
    }
    if (event.user_id !== userId) {
      return NextResponse.json(
        { ok: false, error: "Event not found." } satisfies ConciergeEventMessageResponse,
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as ConciergeEventMessageRequest;
    const message = typeof body.message === "string" ? body.message.slice(0, 12000).trim() : "";
    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Send a message." } satisfies ConciergeEventMessageResponse,
        { status: 400 },
      );
    }

    const thread = await getOrCreateEventThread({
      userId,
      eventId,
      title: `${event.title || "Event"} assistant`,
    });
    await appendConversationMessage({
      threadId: thread.id,
      userId,
      role: "user",
      content: message,
      metadata: {},
    });

    const [assets, history] = await Promise.all([
      listEventAssets(eventId, userId),
      listConversationMessages(thread.id, 30),
    ]);
    const plan = await buildEventActionPlan({
      message,
      event,
      assets,
      history: history.map((item) => ({ role: item.role, content: item.content })),
    });
    const applied = await applyEventActions({
      userId,
      eventId,
      event,
      actions: plan.actions,
    });
    const assistantMessage =
      applied.appliedActions[0]?.type === "ask_question"
        ? applied.appliedActions[0].question
        : plan.assistantMessage;
    await appendConversationMessage({
      threadId: thread.id,
      userId,
      role: "assistant",
      content: assistantMessage,
      metadata: { actions: applied.appliedActions },
    });
    await touchConversationThread(thread.id);

    return NextResponse.json({
      ok: true,
      event: {
        id: applied.event.id,
        title: applied.event.title,
        data: asRecord(applied.event.data),
      },
      assets: applied.assets,
      assistantMessage,
      actions: applied.appliedActions,
      suggestedReplies:
        applied.appliedActions[0]?.type === "ask_question"
          ? applied.appliedActions[0].suggestedReplies
          : plan.suggestedReplies,
    } satisfies ConciergeEventMessageResponse);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Event assistant request failed.",
      } satisfies ConciergeEventMessageResponse,
      { status: 500 },
    );
  }
}
