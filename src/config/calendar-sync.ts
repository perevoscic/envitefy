/**
 * Calendar syncing stays enabled by default (user preference, 2026-09-05).
 * Do not pause it for verification or maintenance without an explicit request.
 * Historical pause/restoration record: docs/calendar-sync-pause-2026-09-05.md.
 * This shared switch applies to every user and both client and server code.
 */
export const CONNECTED_CALENDAR_SYNC_ENABLED: boolean = true;

export const CALENDAR_SYNC_PAUSED_MESSAGE =
  "Google Calendar and Outlook syncing is temporarily paused. Your events still save to Envitefy. You can use Add to calendar on an event to save it manually.";
