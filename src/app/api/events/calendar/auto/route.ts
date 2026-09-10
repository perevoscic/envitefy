import { getServerSession } from "next-auth";
import { after, NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { runSavedCalendarSync } from "@/lib/calendar-sync-background";
import { getCalendarSyncPauseResponse } from "@/lib/calendar-sync-pause";
import { canResumeCalendarSync, readCalendarSyncState } from "@/lib/calendar-sync-state";
import { getEventHistoryById } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

async function handle(request: Request, retry: boolean) {
  const pausedResponse = getCalendarSyncPauseResponse();
  if (pausedResponse) return pausedResponse;
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);
  const email = session?.user?.email?.trim().toLowerCase() || "";
  if (!userId || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body: { eventId?: unknown } = retry ? await request.json().catch(() => ({})) : {};
  const eventId = retry
    ? typeof body.eventId === "string" ? body.eventId.trim() : ""
    : new URL(request.url).searchParams.get("eventId") || "";
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  const row = await getEventHistoryById(eventId);
  if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const state = readCalendarSyncState(row.data?.calendarSync);
  const job = { eventId, userId, email, origin: await absoluteUrl("/") };
  // Explicit setup/retry keeps its existing response contract; the event is already open.
  if (retry) return runSavedCalendarSync({ ...job, retry: true });
  if (canResumeCalendarSync(state)) {
    after(async () => {
      try { await runSavedCalendarSync(job); }
      catch { console.error("[calendar-sync] resume deferred", { eventId }); }
    });
  }
  // Never expose tokens, provider event IDs, provider errors or event contents.
  return NextResponse.json(state, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) { return handle(request, false); }
export async function POST(request: Request) { return handle(request, true); }
