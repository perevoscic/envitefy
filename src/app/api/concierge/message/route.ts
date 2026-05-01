import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { handleCreationIntake } from "@/lib/concierge/intake";
import type { ConciergeMessageRequest, ConciergeMessageResponse } from "@/lib/concierge/types";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timedJson(
  timing: ServerTimingTracker,
  payload: ConciergeMessageResponse,
  init?: ResponseInit,
) {
  const body = timing.enabled ? { ...payload, timings: timing.toObject() } : payload;
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
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
    )) as ConciergeMessageRequest;
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
        error: error instanceof Error ? error.message : "Concierge request failed.",
      } satisfies ConciergeMessageResponse,
      { status: 500 },
    );
  }
}
