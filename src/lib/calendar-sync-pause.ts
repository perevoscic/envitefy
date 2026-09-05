import { CALENDAR_SYNC_PAUSED_MESSAGE, CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";

/** Stop before authentication, token refresh, provider calls, or sync metadata writes. */
export function getCalendarSyncPauseResponse(): Response | null {
  if (CONNECTED_CALENDAR_SYNC_ENABLED) return null;

  return Response.json(
    {
      ok: false,
      status: "paused",
      code: "CALENDAR_SYNC_PAUSED",
      error: CALENDAR_SYNC_PAUSED_MESSAGE,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
