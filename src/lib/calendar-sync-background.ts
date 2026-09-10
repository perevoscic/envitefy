import { randomUUID } from "node:crypto";
import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
import { CALENDAR_SYNC_LEASE_MS, readCalendarSyncState } from "@/lib/calendar-sync-state";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById, query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";

export type CalendarSyncJob = {
  eventId: string;
  userId: string;
  email: string;
  origin: string;
  retry?: boolean;
};

/** This marker commits in the event insert, before the browser can navigate away. */
export function prepareScanCalendarSync(
  data: Record<string, unknown>,
  scanAttemptId: string | null,
): boolean {
  if (
    !CONNECTED_CALENDAR_SYNC_ENABLED ||
    !scanAttemptId ||
    !/^ocr(?:-|$)/.test(String(data.createdVia || "")) ||
    data.status === "draft"
  )
    return false;
  data.calendarSync = { status: "pending", updatedAt: new Date().toISOString() };
  return true;
}

/** Called by after(); pending work can also resume when the owner reads its status. */
export async function runSavedCalendarSync(job: CalendarSyncJob): Promise<Response> {
  if (!CONNECTED_CALENDAR_SYNC_ENABLED) return Response.json({ ok: false, status: "paused" });
  const claimToken = randomUUID();
  const startedAt = Date.now();
  const claimed = await query<{ id: string }>(
    `UPDATE event_history SET data = jsonb_set(coalesce(data, '{}'::jsonb), '{calendarSync}',
       coalesce(data->'calendarSync', '{}'::jsonb) || $3::jsonb)
     WHERE id = $1 AND user_id = $2 AND (
       data->'calendarSync'->>'status' = 'pending'
       OR (data->'calendarSync'->>'status' = 'syncing'
         AND coalesce(data->'calendarSync'->>'updatedAt', '') < $4)
       OR ($5 AND coalesce(data->'calendarSync'->>'status', '') <> 'syncing')
     ) RETURNING id`,
    [
      job.eventId,
      job.userId,
      JSON.stringify({ status: "syncing", claimToken, updatedAt: new Date().toISOString() }),
      new Date(Date.now() - CALENDAR_SYNC_LEASE_MS).toISOString(),
      Boolean(job.retry),
    ],
  );
  if (!claimed.rows.length) {
    const row = await getEventHistoryById(job.eventId);
    if (!row || row.user_id !== job.userId)
      return Response.json({ error: "Not found" }, { status: 404 });
    const state = readCalendarSyncState(row.data?.calendarSync);
    return Response.json({
      ok: state.status === "synced",
      ...state,
      status: state.status === "synced" ? "already_synced" : state.status,
    });
  }
  try {
    // Keep the calendar SDK and token checks out of the history save's critical path.
    const { syncSavedEventToCalendar } = await import("@/lib/calendar-sync-service");
    const response = await syncSavedEventToCalendar({ ...job, claimToken });
    console.info("[calendar-sync] background complete", {
      eventId: job.eventId,
      durationMs: Date.now() - startedAt,
      responseStatus: response.status,
    });
    return response;
  } catch {
    await query(
      `UPDATE event_history SET data = jsonb_set(data, '{calendarSync}',
         (data->'calendarSync') || $3::jsonb)
       WHERE id = $1 AND user_id = $2 AND data->'calendarSync'->>'claimToken' = $4`,
      [
        job.eventId,
        job.userId,
        JSON.stringify({
          status: "failed",
          reason: "request_failed",
          updatedAt: new Date().toISOString(),
        }),
        claimToken,
      ],
    );
    console.error("[calendar-sync] background failed", {
      eventId: job.eventId,
      durationMs: Date.now() - startedAt,
    });
    return Response.json({ ok: false, status: "failed", reason: "request_failed" });
  } finally {
    invalidateUserHistory(job.userId);
    invalidateUserDashboard(job.userId);
  }
}
