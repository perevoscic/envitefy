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

export type DashboardEventQueryDiagnostics = {
  sourceRowCount: number;
  returnedEventCount: number;
  droppedMissingStartCount: number;
  fallbackUsed: boolean;
  fallbackReason:
    | "no-next-event-in-window"
    | "no-invited-upcoming-in-window"
    | "statement-timeout"
    | null;
};

export type DashboardEventQueryResult = {
  events: DashboardEvent[];
  diagnostics: DashboardEventQueryDiagnostics;
};

function rowsToDashboardEvents(rows: EventHistoryRow[]): {
  events: DashboardEvent[];
  droppedMissingStartCount: number;
} {
  const seen = new Set<string>();
  let droppedMissingStartCount = 0;
  const events = rows
    .map<DashboardEvent | null>((row) => {
      const event = toDashboardEvent({
        id: row.id,
        title: row.title,
        data: row.data,
        created_at: row.created_at,
      });
      if (!event) droppedMissingStartCount += 1;
      return event;
    })
    .filter((row): row is DashboardEvent => Boolean(row))
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  return { events, droppedMissingStartCount };
}

export async function listDashboardEventsForOwner(
  userId: string,
  limit = 200
): Promise<DashboardEventQueryResult> {
  return listDashboardEventsForUser(userId, limit);
}

export async function listDashboardEventsForUser(
  userId: string,
  limit = 200
): Promise<DashboardEventQueryResult> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const rowLimit = Math.max(1, Math.min(DASHBOARD_HISTORY_ROW_CAP, safeLimit));
  try {
    const rows = await listDashboardHistoryWindowForUser(userId, rowLimit);
    const windowResult = rowsToDashboardEvents(rows);
    const events = windowResult.events;
    const { nextEvent, upcoming } = buildDashboardCollections(events);
    const hasInvitedUpcoming = upcoming.some(
      (event) => event.ownership === "invited"
    );

    // The hot path intentionally scans only a recent created_at window. If that
    // window is full but either has no upcoming event or has not surfaced any
    // invited upcoming rows yet, broaden the scan so older-created invites can
    // still populate Home.
    if (rows.length >= rowLimit && (!nextEvent || !hasInvitedUpcoming)) {
      const fallbackRows = await listDashboardHistoryFallbackForUser(
        userId,
        safeLimit,
        safeLimit
      );
      const fallbackResult = rowsToDashboardEvents(fallbackRows);
      return {
        events: fallbackResult.events,
        diagnostics: {
          sourceRowCount: fallbackRows.length,
          returnedEventCount: fallbackResult.events.length,
          droppedMissingStartCount: fallbackResult.droppedMissingStartCount,
          fallbackUsed: true,
          fallbackReason: nextEvent
            ? "no-invited-upcoming-in-window"
            : "no-next-event-in-window",
        },
      };
    }

    return {
      events,
      diagnostics: {
        sourceRowCount: rows.length,
        returnedEventCount: events.length,
        droppedMissingStartCount: windowResult.droppedMissingStartCount,
        fallbackUsed: false,
        fallbackReason: null,
      },
    };
  } catch (err) {
    const anyErr = err as { code?: unknown; message?: unknown } | null;
    const code = String(anyErr?.code || "");
    const message = String(anyErr?.message || "");
    const isTimeout =
      code === "57014" ||
      /statement timeout|canceling statement due to statement timeout/i.test(message);
    if (!isTimeout) throw err;
    const fallbackRows = await listDashboardHistoryFallbackForUser(
      userId,
      safeLimit,
      safeLimit
    );
    const fallbackResult = rowsToDashboardEvents(fallbackRows);
    return {
      events: fallbackResult.events,
      diagnostics: {
        sourceRowCount: fallbackRows.length,
        returnedEventCount: fallbackResult.events.length,
        droppedMissingStartCount: fallbackResult.droppedMissingStartCount,
        fallbackUsed: true,
        fallbackReason: "statement-timeout",
      },
    };
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
