"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdminAccess } from "@/components/admin/AdminAccessProvider";
import type { AdminUserListItem, AdminUserListPage } from "@/lib/admin-user-metrics-sql";
import { buildEventProductPath } from "@/utils/event-product-route";

const EVENT_TYPE_LABELS = {
  scans_birthdays: "Birthdays",
  scans_weddings: "Weddings",
  scans_sport_events: "Sports",
  scans_appointments: "Appointments",
  scans_doctor_appointments: "Medical",
  scans_play_days: "Play days",
  scans_general_events: "General",
  scans_car_pool: "Car pool",
} as const;

type EventTypeKey = keyof typeof EVENT_TYPE_LABELS;
type EventCategoryTotals = Partial<Record<EventTypeKey, number>>;

type AdminEventDebugLink = {
  id: string;
  title: string | null;
  category: string | null;
  publicSlug: string | null;
  primaryOutput: string | null;
  createdVia: string | null;
  sourceType: string | null;
  createdAt: string | null;
};

type AdminScanAttemptDebugLink = {
  id: string;
  title: string;
  category: string;
  status: "processed" | "saved" | "failed";
  createdAt: string | null;
};

const USER_EVENT_CATEGORY_KEYS: Record<EventTypeKey, string> = {
  scans_birthdays: "events_birthdays",
  scans_weddings: "events_weddings",
  scans_sport_events: "events_sport_events",
  scans_appointments: "events_appointments",
  scans_doctor_appointments: "events_doctor_appointments",
  scans_play_days: "events_play_days",
  scans_general_events: "events_general_events",
  scans_car_pool: "events_car_pool",
};

type Overview = {
  totalUsers: number;
  totalEvents: number;
  totalShares: number;
  totalScans: number;
  eventsByCategory: EventCategoryTotals;
  scansByCategory: EventCategoryTotals;
};

type StatView = "all" | "scans" | "shares" | null;

export default function AdminUsersPage() {
  const { email: adminEmail, status, isAdmin } = useAdminAccess();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [activeStatView, setActiveStatView] = useState<StatView>("all");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const usersCache = useRef(new Map<string, AdminUserListPage>());
  const activeUsersKey = useRef("all");
  const usersRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
    const controller = new AbortController();
    const fetchStats = async () => {
      setError(null);
      if (activeUsersKey.current === "all") {
        setUsersLoading(true);
        setUsersError(null);
      }
      try {
        const res = await fetch("/api/admin/stats", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = readAdminDebugError(await res.json().catch(() => null));
          throw new Error(
            `Could not load platform overview (${res.status}). ${detail ? `${detail} — ` : ""}Please retry.`,
          );
        }
        const json = await res.json();
        if (controller.signal.aborted) return;
        setOverview(json.overview);
        usersCache.current.set("all", json.users);
        if (activeUsersKey.current === "all") {
          setUsers(json.users.items);
          setUsersCursor(json.users.nextCursor);
          setUsersLoading(false);
        }
        setError(null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Could not load platform overview. Please retry.");
        if (activeUsersKey.current === "all") {
          setUsersLoading(false);
          setUsersError("Could not load the user list. Please retry.");
        }
      }
    };
    void fetchStats();
    return () => controller.abort();
  }, [status, isAdmin, adminEmail, overviewRefreshKey]);

  useEffect(() => {
    // Keep cached account data scoped to the authorized admin session.
    activeUsersKey.current = "all";
    setActiveStatView("all");
    setQ("");
    setAppliedQuery("");
    setUsers([]);
    setUsersCursor(null);
    setUsersError(null);
    setUsersLoading(true);
    setOverview(null);
    setError(null);
    return () => {
      usersRequest.current?.abort();
      usersCache.current.clear();
    };
  }, [adminEmail, status, isAdmin]);

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const categoryStats = overview ? getEventTypeStats(overview.eventsByCategory) : [];
  const scanStats = overview ? getEventTypeStats(overview.scansByCategory) : [];

  function handleClearSearch() {
    usersRequest.current?.abort();
    activeUsersKey.current = "all";
    setQ("");
    setAppliedQuery("");
    const cached = usersCache.current.get("all");
    setUsers(cached?.items || []);
    setUsersCursor(cached?.nextCursor || null);
    setUsersError(!cached && error ? "Could not load the user list. Please retry." : null);
    setUsersLoading(!cached && !error);
    setActiveStatView("all");
  }

  async function handleSearch() {
    if (!q.trim()) {
      handleClearSearch();
      return;
    }
    setAppliedQuery(q.trim());
    setActiveStatView(null);
    await loadUsersView(null, q.trim());
  }

  async function handleStatClick(view: StatView) {
    setActiveStatView(view);
    setQ("");
    setAppliedQuery("");
    await loadUsersView(view);
  }

  async function loadUsersView(view: StatView, search = "", cursor?: string) {
    usersRequest.current?.abort();
    const key = view || `search:${search.toLowerCase()}`;
    activeUsersKey.current = key;
    setUsersError(null);
    const cached = usersCache.current.get(key);
    if (!cursor && cached) {
      setUsers(cached.items);
      setUsersCursor(cached.nextCursor);
      setUsersLoading(false);
      return;
    }

    const controller = new AbortController();
    usersRequest.current = controller;
    setUsersLoading(true);
    if (!cursor) {
      setUsers([]);
      setUsersCursor(null);
    }
    try {
      const res = view
        ? await fetchStatUsers(view, cursor, view === "all" ? 100 : undefined, controller.signal)
        : await fetchUsers(search, cursor, controller.signal);
      if (controller.signal.aborted) return;
      const page = {
        items: cursor ? [...(cached?.items || []), ...res.items] : res.items,
        nextCursor: res.nextCursor,
      };
      usersCache.current.set(key, page);
      setUsers(page.items);
      setUsersCursor(page.nextCursor);
    } catch (e: any) {
      if (controller.signal.aborted) return;
      setUsersError(e?.message || String(e));
    } finally {
      if (!controller.signal.aborted) setUsersLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!usersCursor || usersLoading) return;
    await loadUsersView(activeStatView, appliedQuery, usersCursor);
  }

  function getActiveViewTitle(): string {
    if (activeStatView === "all") return "All Users";
    if (activeStatView === "scans") return "Users by Total Scans";
    if (activeStatView === "shares") return "Users by Shares Sent";
    return "User Search";
  }

  async function handleDeleteUser(user: AdminUserListItem) {
    const displayName =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      user?.email ||
      "this user";
    const confirmed = window.confirm(
      `Delete ${displayName}? This permanently removes the user account, owned events, shares, and saved sign-in tokens.`,
    );
    if (!confirmed) return;

    setDeletingUserId(user.id);
    setUsersError(null);

    try {
      await deleteAdminUser(user.id);
      usersRequest.current?.abort();
      for (const [key, page] of usersCache.current) {
        usersCache.current.set(key, {
          ...page,
          items: page.items.filter((entry) => entry.id !== user.id),
        });
      }
      setUsersLoading(false);
      setUsers((prev) => prev.filter((entry) => entry.id !== user.id));
      setOverviewRefreshKey((key) => key + 1);
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] text-slate-950 transition-colors" suppressHydrationWarning>
      <div className="max-w-7xl space-y-6" suppressHydrationWarning>
        {/* Header */}
        <div
          className="flex flex-col gap-2 border-b border-slate-200 pb-5"
          suppressHydrationWarning
        >
          <h1
            className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl"
            suppressHydrationWarning
          >
            Users
          </h1>
          <p className="text-sm text-slate-600" suppressHydrationWarning>
            Account search, usage counters, deletion tools, and capped event debug links.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 text-error p-4"
            suppressHydrationWarning
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">{error}</div>
              <button
                type="button"
                className="shrink-0 font-semibold underline underline-offset-4"
                onClick={() => setOverviewRefreshKey((key) => key + 1)}
              >
                Retry overview
              </button>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <section suppressHydrationWarning>
          <h2 className="text-xl font-semibold mb-3 text-[#43366f]" suppressHydrationWarning>
            Platform Overview
          </h2>
          {!overview && error ? (
            <div className="py-12 text-center text-muted-foreground">Overview unavailable.</div>
          ) : !overview ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="flex items-center gap-3 text-muted-foreground"
                suppressHydrationWarning
              >
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading overview…
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard
                label="Total Users"
                value={overview.totalUsers}
                icon="U"
                gradient="from-[#bbaaf3] to-[#7f67d3]"
                onClick={() => handleStatClick("all")}
                isActive={activeStatView === "all"}
              />
              <ScanBreakdownCard
                label="Total Scans"
                scanStats={scanStats}
                total={overview.totalScans}
              />
              <CategoryBreakdownCard
                label="Total Events Created"
                categoryStats={categoryStats}
                total={overview.totalEvents}
              />
            </div>
          )}
        </section>

        {/* User Search */}
        <section suppressHydrationWarning>
          <div
            className="bg-white border border-[#ddd5f6] rounded-2xl overflow-hidden shadow-xl"
            suppressHydrationWarning
          >
            <div className="px-6 py-4 border-b border-[#e4def9]" suppressHydrationWarning>
              <h2 className="text-lg font-semibold text-[#43366f]" suppressHydrationWarning>
                {getActiveViewTitle()}
              </h2>
              <p className="text-sm text-[#8c80b6] mt-1" suppressHydrationWarning>
                {activeStatView
                  ? `Showing ${
                      activeStatView === "all"
                        ? "all users"
                        : activeStatView === "scans"
                          ? "users sorted by total scans"
                          : "users sorted by shares sent"
                    }`
                  : "Search for users by email, first name, or last name"}
              </p>
            </div>
            <div className="p-6">
              {activeStatView && activeStatView !== "all" && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[#cbbbf1] bg-[#f4efff] px-4 py-3">
                  <span className="text-sm text-[#6f57c8] font-medium">
                    Active Filter: {getActiveViewTitle()}
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm text-[#6f57c8] hover:text-[#5a42b7] font-semibold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear Filter
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    aria-label="Search users"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="Search by email, first or last name..."
                    className="min-h-12 w-full rounded-2xl border border-[#d8d0f3] bg-white py-3 pr-10 pl-11 text-base text-[#483a74] transition-all placeholder:text-[#766b9d] focus:border-[#9b86df] focus:ring-2 focus:ring-[#baa9ea]/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                    suppressHydrationWarning
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#998fc0]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    suppressHydrationWarning
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {q && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-[#f1edff]"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <svg
                        className="w-4 h-4 text-[#998fc0]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={usersLoading}
                  className="px-6 py-3 text-sm font-semibold overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b70de] to-[#6f57c8] hover:from-[#7f63d8] hover:to-[#5f49bb] text-white shadow-lg shadow-[#8b70de]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {usersLoading && !activeStatView ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>

              {usersError && (
                <div
                  role="alert"
                  className="rounded-lg border border-error/30 bg-error/10 text-error p-3 text-sm mb-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{usersError}</span>
                    <button
                      type="button"
                      onClick={() =>
                        loadUsersView(activeStatView, appliedQuery, usersCursor || undefined)
                      }
                      className="min-h-11 shrink-0 font-semibold underline underline-offset-4"
                    >
                      Retry users
                    </button>
                  </div>
                </div>
              )}

              {usersLoading && users.length === 0 && (
                <div role="status" aria-busy="true" className="py-8 text-center text-[#5b4d86]">
                  Loading users…
                </div>
              )}

              {users.length === 0 && !usersLoading && !usersError && (
                <div className="text-center py-8 text-[#9186bb]">
                  <svg
                    className="mx-auto h-12 w-12 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="font-medium">No users found</p>
                  <p className="text-sm mt-1">
                    {activeStatView ? "No user accounts to display." : "Try a different search query"}
                  </p>
                </div>
              )}

              {users.length > 0 && (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {users.map((u) => {
                      const eventBreakdown = getUserEventTypeStats(u);
                      const scanBreakdown = getEventTypeStats(u);
                      const eventTotal = getFiniteNumber(
                        u.events_total,
                        eventBreakdown.reduce((sum, item) => sum + item.count, 0),
                      );
                      const scanTotal =
                        typeof u.scans_total === "number" && Number.isFinite(u.scans_total)
                          ? u.scans_total
                          : 0;
                      return (
                        <div
                          key={u.id}
                          className="rounded-2xl border border-[#ddd5f6] bg-white p-4 space-y-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7fb6]">
                                Name
                              </p>
                              <p className="text-base font-semibold text-[#43366f] truncate">
                                {[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}
                              </p>
                              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7fb6]">
                                Email
                              </p>
                              <p className="text-sm text-[#5b4d86] break-words">{u.email}</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#e5defa] space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7fb6]">
                                  Events
                                </p>
                                <BreakdownPopup
                                  label="Events"
                                  count={eventTotal}
                                  breakdown={eventBreakdown}
                                  userId={u.id}
                                  debugLinkKind="events"
                                  variant="inline"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7fb6]">
                                  Scans
                                </p>
                                <BreakdownPopup
                                  label="Scans"
                                  count={scanTotal}
                                  breakdown={scanBreakdown}
                                  userId={u.id}
                                  debugLinkKind="scans"
                                  variant="inline"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end justify-between gap-3 pt-2 border-t border-[#e5defa]">
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-[#8b7fb6] mb-1">
                                  Last event
                                </p>
                                <p className="text-sm text-[#5b4d86]">
                                  {formatDate(u.last_event_created_at, { forceUsNumeric: true })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-[#8b7fb6] mb-1">
                                  Joined
                                </p>
                                <p className="text-sm text-[#5b4d86]">{formatDate(u.created_at)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingUserId === u.id}
                              className="rounded-xl border border-[#f0b8c7] bg-[#fff2f5] px-3 py-2 text-sm font-semibold text-[#b84367] transition-colors hover:bg-[#ffe7ee] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingUserId === u.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div
                    className="hidden md:block overflow-x-auto rounded-2xl border border-[#ddd5f6] bg-white shadow-lg"
                    suppressHydrationWarning
                  >
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#faf8ff] text-xs uppercase tracking-wider font-semibold text-[#8b7fb6] border-b border-[#e4def9]">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3 text-right">Scans</th>
                          <th className="px-4 py-3">Events</th>
                          <th className="px-4 py-3">Last event</th>
                          <th className="px-4 py-3">Joined</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e1fb] bg-white">
                        {users.map((u) => {
                          const eventBreakdown = getUserEventTypeStats(u);
                          const scanBreakdown = getEventTypeStats(u);
                          const eventTotal = getFiniteNumber(
                            u.events_total,
                            eventBreakdown.reduce((sum, item) => sum + item.count, 0),
                          );
                          const scanTotal =
                            typeof u.scans_total === "number" && Number.isFinite(u.scans_total)
                              ? u.scans_total
                              : 0;
                          return (
                            <tr key={u.id} className="hover:bg-[#f8f4ff] transition-colors">
                              <td className="px-4 py-3 text-foreground/80">
                                {[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}
                              </td>
                              <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">
                                <BreakdownPopup
                                  label="Scans"
                                  count={scanTotal}
                                  breakdown={scanBreakdown}
                                  userId={u.id}
                                  debugLinkKind="scans"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground/80">
                                <BreakdownPopup
                                  label="Events"
                                  count={eventTotal}
                                  breakdown={eventBreakdown}
                                  userId={u.id}
                                  debugLinkKind="events"
                                />
                              </td>
                              <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                                {formatDate(u.last_event_created_at, { forceUsNumeric: true })}
                              </td>
                              <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                                {formatDate(u.created_at)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={deletingUserId === u.id}
                                  className="rounded-xl border border-[#f0b8c7] bg-[#fff2f5] px-3 py-2 text-sm font-semibold text-[#b84367] transition-colors hover:bg-[#ffe7ee] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingUserId === u.id ? "Deleting…" : "Delete"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-[#8c80b6]">
                      Showing {users.length} result
                      {users.length !== 1 ? "s" : ""}
                    </p>
                    {usersCursor && (
                      <button
                        onClick={handleLoadMore}
                        disabled={usersLoading}
                        className="px-4 py-2 text-sm font-medium rounded-2xl border border-[#d8d0f3] bg-white text-[#4b3f72] hover:bg-[#f4efff] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {usersLoading ? "Loading…" : "Load more"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  onClick,
  isActive,
  helperText,
}: {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  onClick?: () => void;
  isActive?: boolean;
  helperText?: string;
}) {
  const activeBorderClass = isActive ? "border-2 border-[#7f67d3] shadow-2xl" : "";

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white border border-[#ddd5f6] transition-all shadow-lg cursor-pointer ring-1 ring-[#ede7ff] ${activeBorderClass} ${
        onClick ? "hover:-translate-y-0.5" : ""
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b7fb6] mb-1.5">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-[#43366f] truncate">
              {value.toLocaleString()}
            </p>
            {helperText && <p className="text-xs text-[#8c80b6] mt-1 line-clamp-2">{helperText}</p>}
          </div>
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-lg sm:text-xl shadow-2xl border border-[#e8e1fb] text-white`}
          >
            {icon}
          </div>
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${gradient} opacity-80`} />
    </div>
  );
}

function CategoryBreakdownCard({
  label,
  categoryStats,
  total,
}: {
  label: string;
  categoryStats: Array<{ key: EventTypeKey; label: string; count: number }>;
  total: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white transition-all shadow-lg ring-1 ring-[#ede7ff] border border-[#ddd5f6]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8b7fb6] mb-1.5">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-[#43366f] truncate">
              {total.toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#c9b9f9] to-[#9072e5] flex items-center justify-center text-lg sm:text-xl shadow-lg flex-shrink-0">
            🗂️
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#e7e1fb]">
          {categoryStats.length > 0 ? (
            <div className="space-y-2">
              {categoryStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[#5b4d86] font-medium truncate">{item.label}</span>
                  <span className="text-[#43366f] font-semibold whitespace-nowrap">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9186bb]">No categorized events yet</p>
          )}
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#b8a8f0] to-[#7d65d2] opacity-80" />
    </div>
  );
}

function ScanBreakdownCard({
  label,
  scanStats,
  total,
}: {
  label: string;
  scanStats: Array<{ key: EventTypeKey; label: string; count: number }>;
  total: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white transition-all shadow-lg ring-1 ring-[#ede7ff] border border-[#ddd5f6]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8b7fb6] mb-1.5">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-[#43366f] truncate">
              {total.toLocaleString()}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#c9b9f9] to-[#9072e5] flex items-center justify-center text-lg sm:text-xl shadow-lg flex-shrink-0">
            🌀
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#e7e1fb]">
          {scanStats.length > 0 ? (
            <div className="space-y-2">
              {scanStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[#5b4d86] font-medium truncate">{item.label}</span>
                  <span className="text-[#43366f] font-semibold whitespace-nowrap">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : total > 0 ? (
            <p className="text-xs text-[#9186bb]">Scans not categorized</p>
          ) : (
            <p className="text-xs text-[#9186bb]">No scans yet</p>
          )}
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#b8a8f0] to-[#7d65d2] opacity-80" />
    </div>
  );
}

type BreakdownPopupVariant = "popover" | "inline";
type DebugLinkKind = "events" | "scans";

type DebugLinkState = {
  key: string;
  links: AdminEventDebugLink[];
  scanAttempts: AdminScanAttemptDebugLink[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

type BreakdownPopupProps = {
  label: string;
  count: number;
  breakdown: Array<{ key: EventTypeKey; label: string; count: number }>;
  userId?: string | null;
  debugLinkKind?: DebugLinkKind;
  variant?: BreakdownPopupVariant;
};

function BreakdownPopup({
  label,
  count,
  breakdown,
  userId,
  debugLinkKind,
  variant = "popover",
}: BreakdownPopupProps) {
  const [open, setOpen] = useState(false);
  const [debugLinkState, setDebugLinkState] = useState<DebugLinkState | null>(null);
  const [debugLinksRetryKey, setDebugLinksRetryKey] = useState(0);
  const loadedDebugLinks = useRef<{ count: number; state: DebugLinkState } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const normalizedCount = Number.isFinite(count) ? count : 0;
  const hasItems = breakdown.length > 0;
  const debugLinkKey = userId && debugLinkKind ? `${userId}:${debugLinkKind}` : null;
  const activeDebugLinkState = debugLinkState?.key === debugLinkKey ? debugLinkState : null;
  const eventLinks = activeDebugLinkState?.links ?? [];
  const scanAttempts = activeDebugLinkState?.scanAttempts ?? [];
  const hasEventLinks = eventLinks.length > 0;
  const hasScanAttempts = scanAttempts.length > 0;
  const isScanBreakdown = label.toLowerCase() === "scans";
  const debugLinksHeading = isScanBreakdown ? "Dev scan URLs" : "Dev event URLs";
  const showMissingScanLinks =
    isScanBreakdown &&
    normalizedCount > 0 &&
    Boolean(activeDebugLinkState?.loaded) &&
    !activeDebugLinkState?.error &&
    !hasEventLinks &&
    !hasScanAttempts;

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [normalizedCount, breakdown.length]);

  useEffect(() => {
    if (!open || !debugLinkKey || !userId || !debugLinkKind || normalizedCount <= 0) return;
    // Only completed requests are reusable. Loading state must not restart this
    // effect: its cleanup would abort the request that just set that state.
    const cached = loadedDebugLinks.current;
    if (cached?.state.key === debugLinkKey && cached.count === normalizedCount) {
      setDebugLinkState(cached.state);
      return;
    }

    const controller = new AbortController();
    setDebugLinkState({
      key: debugLinkKey,
      links: [],
      scanAttempts: [],
      loading: true,
      loaded: false,
      error: null,
    });

    const loadDebugLinks = async () => {
      try {
        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}/debug-links?kind=${debugLinkKind}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok) {
          throw new Error(readAdminDebugError(payload) || `Debug links failed: ${response.status}`);
        }
        const record =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
        const rawLinks = debugLinkKind === "scans" ? record.scanLinks : record.eventLinks;
        const nextState: DebugLinkState = {
          key: debugLinkKey,
          links: readAdminDebugLinks(rawLinks),
          scanAttempts: readAdminScanAttemptLinks(record.scanAttempts),
          loading: false,
          loaded: true,
          error: null,
        };
        loadedDebugLinks.current = { count: normalizedCount, state: nextState };
        setDebugLinkState(nextState);
      } catch (error) {
        if (controller.signal.aborted) return;
        setDebugLinkState({
          key: debugLinkKey,
          links: [],
          scanAttempts: [],
          loading: false,
          loaded: true,
          error: error instanceof Error ? error.message : "Could not load debug links",
        });
      }
    };

    void loadDebugLinks();
    return () => controller.abort();
  }, [
    debugLinkKey,
    debugLinkKind,
    debugLinksRetryKey,
    normalizedCount,
    open,
    userId,
  ]);

  const summary = (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      className="flex flex-col items-start gap-0.5 text-left focus-visible:outline-2 focus-visible:outline-[#8c74df]"
      aria-expanded={open}
    >
      <span className="text-2xl font-semibold text-[#43366f]">
        {normalizedCount.toLocaleString()}
      </span>
    </button>
  );

  const content = (
    <div className="space-y-2 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b7fb6]">
        {label} by type
      </p>
      {hasItems ? (
        breakdown.map((item) => (
          <div key={item.key} className="flex items-center justify-between text-xs text-[#4b3f72]">
            <span className="truncate">{item.label}</span>
            <span className="font-semibold">{item.count.toLocaleString()}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-[#9186bb]">
          {normalizedCount > 0
            ? `No categorized ${label.toLowerCase()} yet`
            : `No ${label.toLowerCase()} yet`}
        </p>
      )}
      {hasEventLinks && (
        <div className="mt-3 border-t border-[#e8e1fb] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8b7fb6]">
            {debugLinksHeading}
          </p>
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {eventLinks.map((event) => {
              const href = buildAdminEventDebugHref(event);
              return (
                <div key={event.id} className="text-xs text-[#4b3f72]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{event.title || "Untitled event"}</span>
                    {(event.sourceType || event.createdVia || event.category) && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#9186bb]">
                        {event.sourceType || event.createdVia || event.category}
                      </span>
                    )}
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block break-all font-mono text-[11px] text-[#6e55c8] underline decoration-[#c7baf4] underline-offset-2 hover:text-[#4e38a2]"
                  >
                    {href}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {hasScanAttempts && (
        <div className="mt-3 border-t border-[#e8e1fb] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8b7fb6]">
            Troubleshooting records
          </p>
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {scanAttempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/admin/scans/${attempt.id}`}
                className="block rounded-lg border border-[#e8e1fb] bg-[#faf8ff] px-3 py-2 text-xs text-[#4b3f72] transition hover:border-[#c7baf4] hover:bg-[#f4efff]"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{attempt.title}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#766b9d]">
                    {attempt.status === "processed" ? "not saved" : attempt.status}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] text-[#9186bb]">
                  {attempt.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {activeDebugLinkState?.loading && (
        <p className="mt-3 border-t border-[#e8e1fb] pt-3 text-xs text-[#9186bb]">
          Loading dev URLs...
        </p>
      )}
      {activeDebugLinkState?.error && (
        <div role="alert" className="mt-3 border-t border-[#e8e1fb] pt-3 text-xs text-[#b84367]">
          <p>{activeDebugLinkState.error}</p>
          <button
            type="button"
            onClick={() => setDebugLinksRetryKey((key) => key + 1)}
            className="mt-2 font-semibold text-[#6e55c8] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#8c74df]"
          >
            Retry
          </button>
        </div>
      )}
      {showMissingScanLinks && (
        <p className="mt-3 border-t border-[#e8e1fb] pt-3 text-xs text-[#9186bb]">
          This count predates detailed attempt tracking, so the uploaded scan cannot be
          reconstructed.
        </p>
      )}
    </div>
  );

  if (variant === "inline") {
    return (
      <div ref={ref} className="w-full">
        {summary}
        {open && (
          <div className="mt-2 rounded-2xl border border-[#ddd5f6] bg-white p-3 shadow-xl">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative inline-flex">
      {summary}
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#ddd5f6] bg-white p-3 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}

function buildAdminEventDebugHref(event: AdminEventDebugLink): string {
  return buildEventProductPath({
    eventId: event.id,
    title: event.title,
    data: event.primaryOutput ? { primaryOutput: event.primaryOutput } : null,
    publicSlug: event.publicSlug,
  });
}

function getEventTypeStats(source: Partial<Record<EventTypeKey, number>> | null | undefined) {
  if (!source) return [];
  return (Object.keys(EVENT_TYPE_LABELS) as EventTypeKey[])
    .map((key) => {
      const raw = Number((source as any)?.[key] ?? 0);
      const count = Number.isFinite(raw) ? raw : 0;
      return { key, label: EVENT_TYPE_LABELS[key], count };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function getUserEventTypeStats(source: Record<string, unknown> | null | undefined) {
  if (!source) return [];
  return (Object.keys(EVENT_TYPE_LABELS) as EventTypeKey[])
    .map((key) => {
      const raw = Number(source[USER_EVENT_CATEGORY_KEYS[key]] ?? 0);
      const count = Number.isFinite(raw) ? raw : 0;
      return { key, label: EVENT_TYPE_LABELS[key], count };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function readAdminDebugLinks(value: unknown) {
  const rawItems: unknown[] = Array.isArray(value) ? value : [];
  const eventLinks: AdminEventDebugLink[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const id = readAdminDebugString(record.id);
    if (!id) continue;
    eventLinks.push({
      id,
      title: readAdminDebugString(record.title) || null,
      category: readAdminDebugString(record.category) || null,
      publicSlug: readAdminDebugString(record.publicSlug) || null,
      primaryOutput: readAdminDebugString(record.primaryOutput) || null,
      createdVia: readAdminDebugString(record.createdVia) || null,
      sourceType: readAdminDebugString(record.sourceType) || null,
      createdAt: readAdminDebugString(record.createdAt) || null,
    });
  }

  return eventLinks;
}

function readAdminScanAttemptLinks(value: unknown): AdminScanAttemptDebugLink[] {
  const rawItems: unknown[] = Array.isArray(value) ? value : [];
  const attempts: AdminScanAttemptDebugLink[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const id = readAdminDebugString(record.id);
    const rawStatus = readAdminDebugString(record.status);
    if (!id || !["processed", "saved", "failed"].includes(rawStatus)) continue;
    attempts.push({
      id,
      title: readAdminDebugString(record.title) || "Untitled scan attempt",
      category: readAdminDebugString(record.category) || "Uncategorized",
      status: rawStatus as AdminScanAttemptDebugLink["status"],
      createdAt: readAdminDebugString(record.createdAt) || null,
    });
  }

  return attempts;
}

function readAdminDebugError(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return readAdminDebugString((value as Record<string, unknown>).error);
}

function readAdminDebugString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function _Th({ children }: { children: any }) {
  return (
    <th className="text-left font-semibold px-4 py-3 text-foreground/80 text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}

function _Td({ children, className }: { children: any; className?: string }) {
  return <td className={`px-4 py-3 text-muted-foreground ${className || ""}`}>{children}</td>;
}

function formatDate(value?: string | null, options?: { forceUsNumeric?: boolean }) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    if (options?.forceUsNumeric) {
      return new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).format(d);
    }
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

async function fetchUsers(q: string, cursor?: string | null, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/admin/users/search?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return (await res.json()) as AdminUserListPage;
}

async function fetchStatUsers(
  view: StatView,
  cursor?: string | null,
  limit?: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (cursor) params.set("cursor", cursor);
  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    params.set("limit", String(Math.floor(limit)));
  }
  const res = await fetch(`/api/admin/users/filter?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch ${view} users: ${res.status}`);
  return (await res.json()) as AdminUserListPage;
}

async function deleteAdminUser(userId: string) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || `Delete failed: ${res.status}`);
  }
  return json as { ok: boolean; userId: string };
}
