import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { conciergeApiErrorMessage } from "@/lib/concierge/api-errors";
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
import { resolveConciergeWeatherContextFromEvent } from "@/lib/concierge/weather-context";
import { getEventHistoryById } from "@/lib/db";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timedJson(
  timing: ServerTimingTracker,
  payload: ConciergeEventMessageResponse,
  init?: ResponseInit,
) {
  const body = timing.enabled ? { ...payload, timings: timing.toObject() } : payload;
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session: any = await timing.time("session", () => getServerSession(authOptions as any));
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      return timedJson(
        timing,
        {
          ok: false,
          error: "Sign in to use this event assistant.",
        } satisfies ConciergeEventMessageResponse,
        { status: 401 },
      );
    }

    const { id: eventId } = await params;
    const event = await timing.time("db_read", () => getEventHistoryById(eventId));
    if (!event) {
      return timedJson(
        timing,
        { ok: false, error: "Event not found." } satisfies ConciergeEventMessageResponse,
        { status: 404 },
      );
    }
    if (event.user_id !== userId) {
      return timedJson(
        timing,
        { ok: false, error: "Event not found." } satisfies ConciergeEventMessageResponse,
        { status: 404 },
      );
    }

    const body = (await timing.time("body_parse", () =>
      req.json().catch(() => ({})),
    )) as ConciergeEventMessageRequest;
    const message = typeof body.message === "string" ? body.message.slice(0, 12000).trim() : "";
    if (!message) {
      return timedJson(
        timing,
        { ok: false, error: "Send a message." } satisfies ConciergeEventMessageResponse,
        { status: 400 },
      );
    }

    const thread = await timing.time("db_write", () =>
      getOrCreateEventThread({
        userId,
        eventId,
        title: `${event.title || "Event"} assistant`,
      }),
    );

    const [assets, history] = await timing.time("db_read", () =>
      Promise.all([listEventAssets(eventId, userId), listConversationMessages(thread.id, 30)]),
    );
    const weatherContext = await timing.time("weather_context", () =>
      resolveConciergeWeatherContextFromEvent({
        message,
        eventData: asRecord(event.data),
      }),
    );
    const plan = await timing.time("model_planning", () =>
      buildEventActionPlan({
        message,
        event,
        assets,
        history: history.map((item) => ({ role: item.role, content: item.content })),
        weatherContext,
      }),
    );
    await timing.time("db_write", () =>
      appendConversationMessage({
        threadId: thread.id,
        userId,
        role: "user",
        content: message,
        metadata: { acceptedAt: new Date().toISOString() },
      }),
    );
    const applied = await timing.time("db_write", () =>
      applyEventActions({
        userId,
        eventId,
        event,
        actions: plan.actions,
      }),
    );
    const assistantMessage =
      applied.appliedActions[0]?.type === "ask_question"
        ? applied.appliedActions[0].question
        : plan.assistantMessage;
    try {
      await timing.time("db_write", () =>
        appendConversationMessage({
          threadId: thread.id,
          userId,
          role: "assistant",
          content: assistantMessage,
          metadata: { actions: applied.appliedActions },
        }),
      );
      await timing.time("db_write", () => touchConversationThread(thread.id));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[concierge] Event assistant response persistence failed after action apply", error);
      }
    }

    return timedJson(timing, {
      ok: true,
      event: {
        id: applied.event.id,
        title: applied.event.title,
        data: asRecord(applied.event.data),
      },
      assets: applied.assets,
      assistantMessage,
      actions: applied.appliedActions,
      weatherContext,
      suggestedReplies:
        applied.appliedActions[0]?.type === "ask_question"
          ? applied.appliedActions[0].suggestedReplies
          : plan.suggestedReplies,
    } satisfies ConciergeEventMessageResponse);
  } catch (error) {
    return timedJson(
      timing,
      {
        ok: false,
        error: conciergeApiErrorMessage(error, "Event assistant request failed."),
      } satisfies ConciergeEventMessageResponse,
      { status: 500 },
    );
  }
}
