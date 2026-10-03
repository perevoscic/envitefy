import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { canReadEventDraft, isEventDraft } from "./event-draft-access";
import { getEventPermissions } from "@/lib/event-collaboration";

export async function guardDraftRequest(
  eventId: string,
  allowOwner = true,
): Promise<NextResponse | null> {
  const row = await getEventHistoryById(eventId);
  if (!row || !isEventDraft(row.data)) return null;
  const viewerId = allowOwner
    ? await resolveSessionUserId(await getServerSession(authOptions))
    : null;
  return (canReadEventDraft(row.data, row.user_id, viewerId) || (viewerId && (await getEventPermissions(row, viewerId)).canEdit))
    ? null
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
