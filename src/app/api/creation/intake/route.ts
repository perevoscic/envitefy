import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { conciergeApiErrorMessage } from "@/lib/concierge/api-errors";
import {
  handleCreationIntake,
  resumeCreationSession,
  resumeLatestCreationSession,
  saveCreationPreview,
} from "@/lib/concierge/intake";
import { parseCreationGeneratedPreview } from "@/lib/concierge/generated-preview";
import type {
  ConciergeMessageResponse,
  CreationIntakeRequest,
  CreationSessionResumeResponse,
  CreationPreviewSaveResponse,
} from "@/lib/concierge/types";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timedJson(
  timing: ServerTimingTracker,
  payload: ConciergeMessageResponse | CreationSessionResumeResponse | CreationPreviewSaveResponse,
  init?: ResponseInit,
) {
  const body = timing.enabled ? { ...payload, timings: timing.toObject() } : payload;
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
}

export async function GET(req: Request) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session: any = await timing.time("session", () => getServerSession(authOptions as any));
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      return timedJson(
        timing,
        {
          ok: false,
          error: "Sign in to use Envitefy Concierge.",
        } satisfies CreationSessionResumeResponse,
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const threadId = url.searchParams.get("threadId")?.trim();
    const result = threadId
      ? await resumeCreationSession({
          userId,
          sessionId: threadId,
          timing,
        })
      : await resumeLatestCreationSession({
          userId,
          timing,
        });

    return timedJson(timing, result satisfies CreationSessionResumeResponse);
  } catch (error) {
    return timedJson(
      timing,
      {
        ok: false,
        error: conciergeApiErrorMessage(error, "Unable to resume creation session."),
      } satisfies CreationSessionResumeResponse,
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session: any = await timing.time("session", () => getServerSession(authOptions as any));
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      return timedJson(
        timing,
        {
          ok: false,
          error: "Sign in to use Envitefy Concierge.",
        } satisfies ConciergeMessageResponse,
        { status: 401 },
      );
    }

    const body = (await timing.time("body_parse", () =>
      req.json().catch(() => ({})),
    )) as CreationIntakeRequest;
    const message = typeof body.message === "string" ? body.message.slice(0, 12000) : "";
    const action = body.action || "message";
    if (!message.trim() && !body.ocrContext && action !== "save") {
      return timedJson(
        timing,
        {
          ok: false,
          error: "Send a message or upload context.",
        } satisfies ConciergeMessageResponse,
        { status: 400 },
      );
    }

    const result = await handleCreationIntake({
      userId,
      request: {
        ...body,
        message,
        action,
      },
      timing,
    });

    return timedJson(timing, result satisfies ConciergeMessageResponse);
  } catch (error) {
    return timedJson(
      timing,
      {
        ok: false,
        error: conciergeApiErrorMessage(error, "Creation intake failed."),
      } satisfies ConciergeMessageResponse,
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session = await timing.time("session", () => getServerSession(authOptions));
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      return timedJson(timing, { ok: false, error: "Sign in to save your preview." }, { status: 401 });
    }
    const body: unknown = await req.json().catch(() => null);
    const request = body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const creationSessionId = typeof request.creationSessionId === "string"
      ? request.creationSessionId.trim()
      : "";
    const studioInvite = parseCreationGeneratedPreview(request.studioInvite);
    if (!creationSessionId || !studioInvite) {
      return timedJson(timing, { ok: false, error: "A draft and generated preview are required." }, { status: 400 });
    }
    const result = await saveCreationPreview({
      userId,
      request: {
        creationSessionId,
        studioInvite,
        // Message snapshots are normalized at the persistence boundary.
        chatMessages: Array.isArray(request.chatMessages) ? request.chatMessages : [],
      },
    });
    return timedJson(timing, result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    return timedJson(timing, {
      ok: false,
      error: conciergeApiErrorMessage(error, "Unable to save the preview."),
    }, { status: 500 });
  }
}
