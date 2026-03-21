import {
  isArchivedOrCanceled,
  isDraftStatus,
  toDashboardEvent,
  type DashboardEvent,
} from "@/lib/dashboard-data";
import {
  listDashboardHistoryWindowForUser,
  type EventHistoryRow,
} from "@/lib/db";

const DASHBOARD_HISTORY_ROW_CAP = 40;
const DASHBOARD_HISTORY_EXPANDED_ROW_CAP = 200;
const DASHBOARD_EXPAND_QUERY_MAX_MS = 2000;

function isStatementTimeoutError(err: unknown): boolean {
  const anyErr = err as { code?: unknown; message?: unknown } | null;
  const code = String(anyErr?.code || "");
  const message = String(anyErr?.message || "");
  return code === "57014" || /statement timeout|canceling statement due to statement timeout/i.test(message);
}

function rowsToDashboardEvents(rows: EventHistoryRow[]): DashboardEvent[] {
  const seen = new Set<string>();
  return rows
    .map<DashboardEvent | null>((row) =>
      toDashboardEvent({
        id: row.id,
        title: row.title,
        data: row.data,
        created_at: row.created_at,
      })
    )
    .filter((row): row is DashboardEvent => Boolean(row))
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
}

function needsExpandedDashboardScan(rows: EventHistoryRow[], events: DashboardEvent[]): boolean {
  if (rows.length < DASHBOARD_HISTORY_ROW_CAP) return false;
  const now = Date.now();
  const hasDraft = events.some((event) => isDraftStatus(event.status));
  const hasUpcoming = events.some((event) => {
    const startMs = new Date(event.startAt).getTime();
    return startMs > now && !isArchivedOrCanceled(event.status);
  });
  return !hasDraft && !hasUpcoming;
}

export async function listDashboardEventsForOwner(
  userId: string,
  limit = 200
): Promise<DashboardEvent[]> {
  const rowLimit = Math.max(1, Math.min(DASHBOARD_HISTORY_ROW_CAP, Math.floor(limit)));
  const startedAt = Date.now();
  const rows = await listDashboardHistoryWindowForUser(
    userId,
    Math.max(rowLimit, DASHBOARD_HISTORY_ROW_CAP)
  );
  const initialQueryMs = Date.now() - startedAt;
  const events = rowsToDashboardEvents(rows);
  if (
    !needsExpandedDashboardScan(rows, events) ||
    initialQueryMs > DASHBOARD_EXPAND_QUERY_MAX_MS
  ) {
    return events;
  }
  try {
    const expandedRows = await listDashboardHistoryWindowForUser(
      userId,
      DASHBOARD_HISTORY_EXPANDED_ROW_CAP
    );
    return rowsToDashboardEvents(expandedRows);
  } catch (err) {
    if (!isStatementTimeoutError(err)) throw err;
    return events;
  }
}

export function buildDashboardCollections(
  events: DashboardEvent[],
  nowMs = Date.now()
): {
  allDrafts: DashboardEvent[];
  drafts: DashboardEvent[];
  upcoming: DashboardEvent[];
  nextEvent: DashboardEvent | null;
  upcomingIn30DaysCount: number;
  upcomingIn7DaysCount: number;
  nextEventInDays: number | null;
} {
  const allDrafts = events
    .filter((event) => isDraftStatus(event.status))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const upcoming = events
    .filter((event) => {
      const startMs = new Date(event.startAt).getTime();
      return startMs > nowMs && !isArchivedOrCanceled(event.status);
    })
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

  const nextEvent = upcoming[0] || null;
  const upcomingIn30DaysCount = upcoming.filter((event) => {
    const diff = new Date(event.startAt).getTime() - nowMs;
    return diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const upcomingIn7DaysCount = upcoming.filter((event) => {
    const diff = new Date(event.startAt).getTime() - nowMs;
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const nextEventInDays = nextEvent
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextEvent.startAt).getTime() - nowMs) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null;

  return {
    allDrafts,
    drafts: allDrafts.slice(0, 3),
    upcoming,
    nextEvent,
    upcomingIn30DaysCount,
    upcomingIn7DaysCount,
    nextEventInDays,
  };
}
