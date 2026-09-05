/**
 * Temporary calendar integration hold for Google verification (2026-09-05).
 * Set to true and rebuild/redeploy to restore the existing integration flows.
 * Restore record: docs/calendar-sync-pause-2026-09-05.md.
 * This shared switch applies to every user and both client and server code.
 */
export const CONNECTED_CALENDAR_SYNC_ENABLED: boolean = false;

export const CALENDAR_SYNC_PAUSED_MESSAGE =
  "Google Calendar and Outlook syncing is temporarily paused. Your events still save to Envitefy. You can use Add to calendar on an event to save it manually.";
