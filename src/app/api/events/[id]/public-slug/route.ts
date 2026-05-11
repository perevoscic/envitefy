import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  getEventHistoryById,
  listShareRecipientUserIdsForEvent,
  updateEventHistoryPublicSlug,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { makeEventPublicSlugRoutable } from "@/utils/event-public-slug";
import { buildEventPath, buildEventSlugSegment, buildStudioCardPath } from "@/utils/event-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readPublicSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  return makeEventPublicSlugRoutable(value);
}

async function invalidateEventViewers(eventId: string, ownerUserId: string) {
  invalidateUserHistory(ownerUserId);
  invalidateUserDashboard(ownerUserId);
  const recipientUserIds = await listShareRecipientUserIdsForEvent(eventId).catch(() => []);
  for (const recipientUserId of recipientUserIds) {
    if (!recipientUserId || recipientUserId === ownerUserId) continue;
    invalidateUserHistory(recipientUserId);
    invalidateUserDashboard(recipientUserId);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await getEventHistoryById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.user_id !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const requestedSlug = readPublicSlug(
      (body as Record<string, unknown>)?.publicSlug ?? (body as Record<string, unknown>)?.slug,
    );
    if (!requestedSlug || requestedSlug === "event") {
      return NextResponse.json({ error: "Enter a more specific event link." }, { status: 400 });
    }

    const updated = await updateEventHistoryPublicSlug({ id, publicSlug: requestedSlug });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await invalidateEventViewers(id, userId);

    const publicSlug = updated.public_slug || requestedSlug;
    return NextResponse.json({
      ok: true,
      publicSlug,
      segment: buildEventSlugSegment(updated.id, updated.title, publicSlug),
      eventPath: buildEventPath(updated.id, updated.title, undefined, publicSlug),
      cardPath: buildStudioCardPath(updated.id, updated.title, undefined, publicSlug),
      signupFormPath: `/smart-signup-form/${buildEventSlugSegment(
        updated.id,
        updated.title,
        publicSlug,
      )}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The event link could not be updated.";
    return NextResponse.json(
      { error: message },
      { status: /already in use/i.test(message) ? 409 : 500 },
    );
  }
}
