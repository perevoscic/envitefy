import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  getEventHistoryById,
  listShareRecipientUserIdsForEvent,
  updateEventHistoryDataMerge,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awaitedParams = await params;
    const { templateId } = await req.json();
    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const existing = await getEventHistoryById(awaitedParams.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = (existing.data as any) || {};
    const nextTheme = { ...(data.theme || {}), themeId: templateId };
    const patch = {
      variationId: templateId,
      theme: nextTheme,
    };

    await updateEventHistoryDataMerge(awaitedParams.id, patch);
    invalidateUserHistory(userId);
    invalidateUserDashboard(userId);
    const recipientUserIds = await listShareRecipientUserIdsForEvent(awaitedParams.id).catch(
      () => [],
    );
    for (const recipientUserId of recipientUserIds) {
      invalidateUserHistory(recipientUserId);
      invalidateUserDashboard(recipientUserId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try {
      // eslint-disable-next-line no-console
      console.error("[update-theme] error", err);
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 },
    );
  }
}
