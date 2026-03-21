import {
  isArchivedOrCanceled,
  isDraftStatus,
  toDashboardEvent,
  type DashboardEvent,
} from "@/lib/dashboard-data";
import {
  listDashboardHistoryFallbackForUser,
  listDashboardHistoryWindowForUser,
  type EventHistoryRow,
} from "@/lib/db";

const DASHBOARD_HISTORY_ROW_CAP = 40;

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

export async function listDashboardEventsForOwner(
  userId: string,
  limit = 200
): Promise<DashboardEvent[]> {
  return listDashboardEventsForUser(userId, limit);
}

export async function listDashboardEventsForUser(
  userId: string,
  limit = 200
): Promise<DashboardEvent[]> {
  const rowLimit = Math.max(1, Math.min(DASHBOARD_HISTORY_ROW_CAP, Math.floor(limit)));
  try {
    const rows = await listDashboardHistoryWindowForUser(userId, rowLimit);
    return rowsToDashboardEvents(rows);
  } catch (err) {
    const anyErr = err as { code?: unknown; message?: unknown } | null;
    const code = String(anyErr?.code || "");
    const message = String(anyErr?.message || "");
    const isTimeout =
      code === "57014" ||
      /statement timeout|canceling statement due to statement timeout/i.test(message);
    if (!isTimeout) throw err;
    const fallbackRows = await listDashboardHistoryFallbackForUser(userId, 200, 200);
    return rowsToDashboardEvents(fallbackRows);
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
    .filter(
      (event) =>
        event.ownership === "owned" && isDraftStatus(event.status)
    )
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const upcoming = events
    .filter((event) => {
      const startMs = new Date(event.startAt).getTime();
      return startMs > nowMs && !isArchivedOrCanceled(event.status);
    })
    .sort((a, b) => {
      const startDiff = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      if (startDiff !== 0) return startDiff;
      const aPriority =
        a.ownership === "owned"
          ? 0
          : a.shareStatus === "accepted"
          ? 1
          : 2;
      const bPriority =
        b.ownership === "owned"
          ? 0
          : b.shareStatus === "accepted"
          ? 1
          : 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.title.localeCompare(b.title);
    });

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
