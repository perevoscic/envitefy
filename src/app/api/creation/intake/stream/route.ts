import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "@/lib/concierge/fallback";
import { finalizeCreationIntake, resolveCreationIntakeDraft } from "@/lib/concierge/intake";
import { streamConciergePersona } from "@/lib/concierge/persona";
import type {
  ConciergeMessageResponse,
  CreationChatMessageSnapshot,
  CreationIntakeRequest,
} from "@/lib/concierge/types";
import { createServerTimingTracker, isTimingRequested } from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 12000;

function ssePayload(event: string, payload: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function normalizeChatMessages(value: unknown): CreationChatMessageSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((message): CreationChatMessageSnapshot | null => {
      if (!message || typeof message !== "object") return null;
      const role = (message as { role?: unknown }).role;
      const text = (message as { text?: unknown }).text;
      if (role !== "user" && role !== "assistant" && role !== "system") return null;
      if (typeof text !== "string" || !text.trim()) return null;
      return {
        role,
        text: text.trim().slice(0, 4000),
        createdAt:
          typeof (message as { createdAt?: unknown }).createdAt === "string"
            ? ((message as { createdAt: string }).createdAt || "").trim() || undefined
            : undefined,
      };
    })
    .filter((message): message is CreationChatMessageSnapshot => Boolean(message))
    .slice(-50);
}

function responseWithJsonError(error: string, status: number) {
  return Response.json({ ok: false, error } satisfies ConciergeMessageResponse, { status });
}

export async function POST(req: Request) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session: any = await timing.time("session", () => getServerSession(authOptions as any));
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) return responseWithJsonError("Sign in to use Envitefy Concierge.", 401);

    const body = (await timing.time("body_parse", () =>
      req.json().catch(() => ({})),
    )) as CreationIntakeRequest;
    const message =
      typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_LENGTH) : "";
    const action = body.action || "message";
    if (!message.trim() && !body.ocrContext && action !== "save") {
      return responseWithJsonError("Send a message or upload context.", 400);
    }

    const request: CreationIntakeRequest = {
      ...body,
      message,
      action,
    };
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(ssePayload(event, payload)));
        };

        try {
          const fallbackDraft = await timing.time("deterministic_draft", async () =>
            fallbackExtractConciergeDraft({
              message,
              draft: request.draft || null,
              ocrContext: request.ocrContext || null,
              requestedOutputs: request.requestedOutputs || null,
              activeContext: request.activeContext || null,
            }),
          );
          const fallbackMessage = buildAssistantMessage(fallbackDraft);
          const chatMessages = normalizeChatMessages(request.chatMessages);
          const extractionPromise = resolveCreationIntakeDraft({
            request,
            timing,
          });
          const personaResult = await timing.time("persona_generation", () =>
            streamConciergePersona({
              message,
              chatMessages,
              draft: fallbackDraft,
              fallbackMessage,
              onDelta: (text) => send("assistant_delta", { text }),
            }),
          );
          send("assistant_done", {
            assistantMessage: personaResult.assistantMessage,
            usedAi: personaResult.usedAi,
          });

          const result = await extractionPromise;
          const finalState = await finalizeCreationIntake({
            userId,
            request,
            result,
            assistantMessageOverride: personaResult.assistantMessage,
            timing,
          });
          send(
            "state",
            timing.enabled ? { ...finalState, timings: timing.toObject() } : finalState,
          );
          send("done", { ok: true });
        } catch (error) {
          send("error", {
            error: error instanceof Error ? error.message : "Creation intake stream failed.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return responseWithJsonError(
      error instanceof Error ? error.message : "Creation intake stream failed.",
      500,
    );
  }
}
