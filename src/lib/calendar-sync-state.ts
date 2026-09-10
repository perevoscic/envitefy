export type CalendarSyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "needs_connection"
  | "needs_reconnect"
  | "failed"
  | "skipped";

export type CalendarSyncState = {
  status: CalendarSyncStatus | null;
  provider: "google" | "microsoft" | null;
  updatedAt: string | null;
};

export function readCalendarSyncState(value: unknown): CalendarSyncState {
  const state = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const status = state.status;
  const provider = state.autoProvider ?? state.provider;
  return {
    status:
      status === "pending" ||
      status === "syncing" ||
      status === "synced" ||
      status === "needs_connection" ||
      status === "needs_reconnect" ||
      status === "failed" ||
      status === "skipped"
        ? status
        : null,
    provider:
      provider === "google" || provider === "microsoft" ? provider : null,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null,
  };
}

export const CALENDAR_SYNC_LEASE_MS = 5 * 60_000;

export function canResumeCalendarSync(state: CalendarSyncState): boolean {
  return (
    state.status === "pending" ||
    (state.status === "syncing" &&
      (!state.updatedAt || Date.parse(state.updatedAt) < Date.now() - CALENDAR_SYNC_LEASE_MS))
  );
}
