"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export const EVENT_CACHE_INVALIDATE_EVENT = "envitefy:events:invalidate";
export const EVENT_CACHE_RESET_EVENT = "envitefy:events:reset";

type HistoryRow = {
  id: string;
  title: string;
  created_at?: string | null;
  data?: any;
};

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  weatherSummary: string | null;
  weatherTemp: number | null;
  weatherUpdatedAt: string | null;
};

type DashboardPayload = {
  ok: boolean;
  nextEvent: Record<string, unknown> | null;
  snapshot: {
    upcomingCount30Days: number;
    upcomingCount7Days: number;
    nextEventInDays: number | null;
  };
  upcoming: Array<Record<string, unknown>>;
  rsvp: Record<string, unknown> | null;
  setupHealth: {
    flags: Array<Record<string, unknown>>;
  };
  checklist: {
    source: string;
    items: Array<Record<string, unknown>>;
  };
  drafts: {
    count: number;
    items: Array<Record<string, unknown>>;
  };
  metricsCache?: DashboardMetricsCache | null;
  metricsEligibility: {
    weatherEligible: boolean;
    travelWindowEligible: boolean;
  };
  degraded?: boolean;
};

type EventCacheInvalidateDetail = {
  force?: boolean;
  source?: string;
};

type EventCacheContextValue = {
  historySidebarItems: HistoryRow[];
  historyLoading: boolean;
  dashboardData: DashboardPayload | null;
  dashboardLoading: boolean;
  isHydrated: boolean;
  refreshHistory: (opts?: { force?: boolean }) => Promise<void>;
  refreshDashboard: (opts?: { force?: boolean }) => Promise<void>;
  refreshAll: (opts?: { force?: boolean }) => Promise<void>;
  invalidateEventCache: (detail?: EventCacheInvalidateDetail) => void;
  setDashboardMetricsCache: (metrics: DashboardMetricsCache | null) => void;
};

const EventCacheContext = createContext<EventCacheContextValue | null>(null);

function sortHistoryRows(rows: HistoryRow[]): HistoryRow[] {
  return [...rows].sort((a, b) => {
    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (bt !== at) return bt - at;
    return String(b.id).localeCompare(String(a.id));
  });
}

function isDashboardResponsePayload(value: unknown): value is DashboardPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DashboardPayload> & { ok?: unknown };
  if (candidate.ok !== true) return false;
  if (!candidate.snapshot || typeof candidate.snapshot !== "object") return false;
  if (!Array.isArray(candidate.upcoming)) return false;
  if (!candidate.setupHealth || typeof candidate.setupHealth !== "object")
    return false;
  if (!candidate.checklist || typeof candidate.checklist !== "object")
    return false;
  if (!candidate.drafts || typeof candidate.drafts !== "object") return false;
  if (
    !candidate.metricsEligibility ||
    typeof candidate.metricsEligibility !== "object"
  ) {
    return false;
  }
  return true;
}

export function emitEventCacheInvalidation(detail?: EventCacheInvalidateDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT_CACHE_INVALIDATE_EVENT, {
      detail: detail || {},
    }),
  );
}

export function emitEventCacheReset() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_CACHE_RESET_EVENT));
}

function normalizeIdentityPart(value: unknown, lowercase = false): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return lowercase ? trimmed.toLowerCase() : trimmed;
}

export function EventCacheProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const sessionUser = (session?.user || null) as
    | { email?: string | null; id?: string | null }
    | null;
  const [historySidebarItems, setHistorySidebarItems] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const historyRef = useRef<HistoryRow[]>([]);
  const dashboardRef = useRef<DashboardPayload | null>(null);
  const isHydratedRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const identityKeyRef = useRef<string | null>(null);
  const sessionIdentityKey =
    status === "authenticated"
      ? (
          normalizeIdentityPart(sessionUser?.email, true) ||
          normalizeIdentityPart(sessionUser?.id) ||
          null
        )
      : null;

  useEffect(() => {
    historyRef.current = historySidebarItems;
  }, [historySidebarItems]);

  useEffect(() => {
    dashboardRef.current = dashboardData;
  }, [dashboardData]);

  useEffect(() => {
    isHydratedRef.current = isHydrated;
  }, [isHydrated]);

  const resetCacheState = useCallback(() => {
    if (typeof window !== "undefined" && refreshTimerRef.current != null) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = null;
    refreshPromiseRef.current = null;
    historyRef.current = [];
    dashboardRef.current = null;
    isHydratedRef.current = false;
    setHistorySidebarItems([]);
    setDashboardData(null);
    setHistoryLoading(false);
    setDashboardLoading(false);
    setIsHydrated(false);
  }, []);

  const refreshHistory = useCallback(async (_opts?: { force?: boolean }) => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/history?view=sidebar&limit=200&time=all", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 304 || !res.ok) return;
      const json = await res.json().catch(() => null);
      const items = Array.isArray(json?.items)
        ? (json.items as HistoryRow[])
        : historyRef.current;
      setHistorySidebarItems(sortHistoryRows(items).slice(0, 200));
    } catch {
      // Keep the last good history state on transient failures.
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async (opts?: { force?: boolean }) => {
    setDashboardLoading(true);
    try {
      const qs = opts?.force ? "?refresh=1" : "";
      const res = await fetch(`/api/dashboard${qs}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        if (!dashboardRef.current) {
          setDashboardData(null);
        }
        return;
      }
      const json = await res.json().catch(() => null);
      if (isDashboardResponsePayload(json)) {
        const degraded = Boolean((json as DashboardPayload).degraded);
        if (degraded && dashboardRef.current?.nextEvent) {
          setDashboardData({
            ...dashboardRef.current,
            metricsCache:
              json.metricsCache ?? dashboardRef.current.metricsCache ?? null,
          });
          return;
        }
        setDashboardData(json);
      } else if (!dashboardRef.current) {
        setDashboardData(null);
      }
    } catch {
      if (!dashboardRef.current) {
        setDashboardData(null);
      }
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const refreshAll = useCallback(
    async (opts?: { force?: boolean }) => {
      await Promise.all([
        refreshHistory(opts),
        refreshDashboard({ force: opts?.force }),
      ]);
      setIsHydrated(true);
    },
    [refreshDashboard, refreshHistory],
  );

  const queueRefresh = useCallback(
    (detail?: EventCacheInvalidateDetail) => {
      if (status !== "authenticated" || typeof window === "undefined") return;
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        if (refreshPromiseRef.current) return;
        refreshPromiseRef.current = refreshAll({ force: detail?.force !== false })
          .catch(() => undefined)
          .finally(() => {
            refreshPromiseRef.current = null;
          });
      }, 80);
    },
    [refreshAll, status],
  );

  const invalidateEventCache = useCallback(
    (detail?: EventCacheInvalidateDetail) => {
      emitEventCacheInvalidation(detail);
    },
    [],
  );

  const setDashboardMetricsCache = useCallback(
    (metrics: DashboardMetricsCache | null) => {
      setDashboardData((prev) =>
        prev
          ? {
              ...prev,
              metricsCache: metrics,
            }
          : prev,
      );
    },
    [],
  );

  useEffect(() => {
    const previousIdentity = identityKeyRef.current;
    if (status !== "authenticated") {
      identityKeyRef.current = null;
      resetCacheState();
      return;
    }
    if (previousIdentity !== sessionIdentityKey) {
      identityKeyRef.current = sessionIdentityKey;
      resetCacheState();
    }
    if (status !== "authenticated" || isHydratedRef.current) return;
    let cancelled = false;
    (async () => {
      await Promise.all([refreshHistory(), refreshDashboard()]);
      if (!cancelled) {
        setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshDashboard, refreshHistory, resetCacheState, sessionIdentityKey, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onCreated = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown> | null>).detail;
      if (!detail?.id) return;
      setHistorySidebarItems((prev) => {
        if (prev.some((row) => row.id === String(detail.id))) return prev;
        const detailData =
          detail.data && typeof detail.data === "object" ? detail.data : {};
        const nextItem: HistoryRow = {
          id: String(detail.id),
          title: String(detail.title || "Event"),
          created_at: String(detail.created_at || new Date().toISOString()),
          data: {
            ...detailData,
            ...(detail.start ? { start: String(detail.start) } : {}),
            ...(detail.category ? { category: String(detail.category) } : {}),
          },
        };
        return sortHistoryRows([nextItem, ...prev]).slice(0, 200);
      });
      queueRefresh({ force: true, source: "history:created" });
    };

    const onDeleted = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown> | null>).detail;
      const deletedId =
        detail?.id != null ? String(detail.id).trim() : "";
      if (!deletedId) return;
      setHistorySidebarItems((prev) =>
        prev.filter((row) => row.id !== deletedId),
      );
      queueRefresh({ force: true, source: "history:deleted" });
    };

    const onInvalidate = (event: Event) => {
      const detail =
        (event as CustomEvent<EventCacheInvalidateDetail | undefined>).detail ||
        {};
      queueRefresh(detail);
    };

    const onUpdated = () => {
      queueRefresh({ force: true, source: "history:updated" });
    };

    const onReset = () => {
      resetCacheState();
    };

    const onRsvpSubmitted = () => {
      queueRefresh({ force: true, source: "rsvp-submitted" });
    };

    window.addEventListener("history:created", onCreated as EventListener);
    window.addEventListener("history:deleted", onDeleted as EventListener);
    window.addEventListener("history:updated", onUpdated as EventListener);
    window.addEventListener(
      EVENT_CACHE_INVALIDATE_EVENT,
      onInvalidate as EventListener,
    );
    window.addEventListener(EVENT_CACHE_RESET_EVENT, onReset as EventListener);
    window.addEventListener("rsvp-submitted", onRsvpSubmitted);
    return () => {
      window.removeEventListener("history:created", onCreated as EventListener);
      window.removeEventListener("history:deleted", onDeleted as EventListener);
      window.removeEventListener("history:updated", onUpdated as EventListener);
      window.removeEventListener(
        EVENT_CACHE_INVALIDATE_EVENT,
        onInvalidate as EventListener,
      );
      window.removeEventListener(EVENT_CACHE_RESET_EVENT, onReset as EventListener);
      window.removeEventListener("rsvp-submitted", onRsvpSubmitted);
    };
  }, [queueRefresh, resetCacheState]);

  const value = useMemo<EventCacheContextValue>(
    () => ({
      historySidebarItems,
      historyLoading,
      dashboardData,
      dashboardLoading,
      isHydrated,
      refreshHistory,
      refreshDashboard,
      refreshAll,
      invalidateEventCache,
      setDashboardMetricsCache,
    }),
    [
      dashboardData,
      dashboardLoading,
      historyLoading,
      historySidebarItems,
      invalidateEventCache,
      isHydrated,
      refreshAll,
      refreshDashboard,
      refreshHistory,
      setDashboardMetricsCache,
    ],
  );

  return (
    <EventCacheContext.Provider value={value}>
      {children}
    </EventCacheContext.Provider>
  );
}

export function useEventCache() {
  const context = useContext(EventCacheContext);
  if (!context) {
    throw new Error("useEventCache must be used within EventCacheProvider");
  }
  return context;
}
