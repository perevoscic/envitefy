import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { conciergeApiErrorMessage } from "@/lib/concierge/api-errors";
import { listCreationSessions } from "@/lib/concierge/event-storage";
import type {
  CreationSession,
  CreationThreadSummary,
  CreationThreadsResponse,
} from "@/lib/concierge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function savedEventIdFromSession(session: CreationSession): string | null {
  const value = session.metadata?.savedEventId;
  return cleanString(value);
}

function threadTitle(session: CreationSession): string {
  const draft = session.draft;
  return (
    cleanString(draft.title) ||
    cleanString(draft.previewCopy?.headline) ||
    cleanString(draft.eventPurpose) ||
    cleanString(draft.requestedOutputs?.[0]?.replace(/_/g, " ")) ||
    "New AI creation"
  );
}

function toThreadSummary(session: CreationSession): CreationThreadSummary {
  return {
    id: session.id,
    title: threadTitle(session),
    status: String(session.status || "needs_event_details"),
    updatedAt: session.updated_at,
    createdAt: session.created_at,
    savedEventId: savedEventIdFromSession(session),
  };
}

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sign in to use Envitefy Concierge.",
        } satisfies CreationThreadsResponse,
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit") || 20);
    const includeSaved = url.searchParams.get("includeSaved") === "1";
    const threads = await listCreationSessions({
      userId,
      limit: Number.isFinite(rawLimit) ? rawLimit : 20,
      includeSaved,
    });

    return NextResponse.json({
      ok: true,
      threads: threads.map(toThreadSummary),
    } satisfies CreationThreadsResponse);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: conciergeApiErrorMessage(error, "Unable to load AI creation threads."),
      } satisfies CreationThreadsResponse,
      { status: 500 },
    );
  }
}
