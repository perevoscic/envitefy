"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EVENT_TYPE_LABELS = {
  scans_birthdays: "Birthdays",
  scans_weddings: "Weddings",
  scans_sport_events: "Sports",
  scans_appointments: "Appointments",
  scans_doctor_appointments: "Doctor",
  scans_play_days: "Play days",
  scans_general_events: "General",
  scans_car_pool: "Car pool",
} as const;

type EventTypeKey = keyof typeof EVENT_TYPE_LABELS;
type EventCategoryTotals = Partial<Record<EventTypeKey, number>>;

type Overview = {
  totalUsers: number;
  totalEvents: number;
  totalShares: number;
  usersPaid: number;
  usersFF: number;
  totalScans: number;
  eventsByCategory: EventCategoryTotals;
  scansByCategory: EventCategoryTotals;
};

type StatView = "all" | "paid" | "ff" | "scans" | "shares" | null;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeStatView, setActiveStatView] = useState<StatView>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const isAdmin = (session?.user as any)?.isAdmin;
    if (!isAdmin) return;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        setOverview(json.overview);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    };
    fetchStats();
  }, [status, session]);

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

  const isAdmin = (session?.user as any)?.isAdmin;
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const categoryStats = overview
    ? getEventTypeStats(overview.eventsByCategory)
    : [];
  const categorizedTotal = categoryStats.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const scanStats = overview ? getEventTypeStats(overview.scansByCategory) : [];

  function handleClearSearch() {
    setQ("");
    setUsers([]);
    setUsersCursor(null);
    setUsersError(null);
    setHasSearched(false);
    setActiveStatView(null);
  }

  async function handleSearch() {
    if (!q.trim()) {
      setUsers([]);
      setUsersCursor(null);
      setUsersError(null);
      setHasSearched(false);
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
    setHasSearched(true);
    setActiveStatView(null);
    try {
      const res = await fetchUsers(q.trim());
      setUsers(res.items || []);
      setUsersCursor(res.nextCursor || null);
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleStatClick(view: StatView) {
    setActiveStatView(view);
    setQ("");
    setHasSearched(true);
    setUsersLoading(true);
    setUsersError(null);

    try {
      const res = await fetchStatUsers(view);
      setUsers(res.items || []);
      setUsersCursor(res.nextCursor || null);
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleLoadMore() {
    if ((!q.trim() && !activeStatView) || !usersCursor) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = activeStatView
        ? await fetchStatUsers(activeStatView, usersCursor)
        : await fetchUsers(q.trim(), usersCursor);
      setUsers((prev) => [...prev, ...(res.items || [])]);
      setUsersCursor(res.nextCursor || null);
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setUsersLoading(false);
    }
  }

  function getActiveViewTitle(): string {
    if (activeStatView === "all") return "All Users";
    if (activeStatView === "paid") return "Paid Users";
    if (activeStatView === "ff") return "FF Lifetime Users";
    if (activeStatView === "scans") return "Users by Total Scans";
    if (activeStatView === "shares") return "Users by Shares Sent";
    return "User Search";
  }

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-[#ffffff] via-[#f6f3ff] to-[#f1ecff] text-[#3f3269] transition-colors"
      suppressHydrationWarning
    >
      <div
        className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <h1
            className="text-3xl font-bold bg-gradient-to-r from-[#6f57c8] to-[#9278e3] bg-clip-text text-transparent"
            suppressHydrationWarning
          >
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#8c80b6]" suppressHydrationWarning>
            Platform insights, user analytics, and administrative tools
          </p>
        </div>

        {/* Quick Actions */}
        <section suppressHydrationWarning>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/admin/campaigns"
              className="group relative overflow-hidden rounded-2xl border border-[#dcd4f5] bg-white shadow transition-all hover:shadow-lg"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b7fb6] mb-1.5">
                      Email Campaigns
                    </p>
                    <p className="text-sm text-[#5b4d86]">
                      Send bulk emails to users
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c9b9f9] to-[#9072e5] flex items-center justify-center text-xl shadow-lg flex-shrink-0 text-[#fff]">
                    EC
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-[#9f8ceb] to-[#6f57c8] opacity-80" />
            </Link>

            <Link
              href="/admin/emails"
              className="group relative overflow-hidden rounded-2xl border border-[#dcd4f5] bg-white shadow transition-all hover:shadow-lg"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b7fb6] mb-1.5">
                      Email Templates
                    </p>
                    <p className="text-sm text-[#5b4d86]">
                      Preview email designs
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c9b9f9] to-[#9072e5] flex items-center justify-center text-xl shadow-lg flex-shrink-0 text-[#fff]">
                    ET
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-[#b4a4ef] to-[#7b63cf] opacity-80" />
            </Link>
          </div>
        </section>

        {error && (
          <div
            className="rounded-lg border border-error/30 bg-error/10 text-error p-4"
            suppressHydrationWarning
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <section suppressHydrationWarning>
          <h2
            className="text-xl font-semibold mb-3 text-[#43366f]"
            suppressHydrationWarning
          >
            Platform Overview
          </h2>
          {!overview ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="flex items-center gap-3 text-muted-foreground"
                suppressHydrationWarning
              >
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                total={categorizedTotal}
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
            <div
              className="px-6 py-4 border-b border-[#e4def9]"
              suppressHydrationWarning
            >
              <h2
                className="text-lg font-semibold text-[#43366f]"
                suppressHydrationWarning
              >
                {getActiveViewTitle()}
              </h2>
              <p
                className="text-sm text-[#8c80b6] mt-1"
                suppressHydrationWarning
              >
                {activeStatView
                  ? `Showing ${
                      activeStatView === "all"
                        ? "all users"
                        : activeStatView === "paid"
                          ? "paid users"
                          : activeStatView === "ff"
                            ? "FF lifetime users"
                            : activeStatView === "scans"
                              ? "users sorted by total scans"
                              : "users sorted by shares sent"
                    }`
                  : "Search for users by email, first name, or last name"}
              </p>
            </div>
            <div className="p-6">
              {activeStatView && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[#cbbbf1] bg-[#f4efff] px-4 py-3">
                  <span className="text-sm text-[#6f57c8] font-medium">
                    Active Filter: {getActiveViewTitle()}
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm text-[#6f57c8] hover:text-[#5a42b7] font-semibold flex items-center gap-1"
                  >
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
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="Search by email, first or last name..."
                    disabled={!!activeStatView}
                    className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl border border-[#d8d0f3] bg-white text-[#483a74] placeholder:text-[#9a8fc0] focus:border-[#9b86df] focus:ring-2 focus:ring-[#baa9ea]/55 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                  disabled={usersLoading || !!activeStatView}
                  className="px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-[#8b70de] to-[#6f57c8] hover:from-[#7f63d8] hover:to-[#5f49bb] text-white shadow-lg shadow-[#8b70de]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {usersLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
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
                <div className="rounded-lg border border-error/30 bg-error/10 text-error p-3 text-sm mb-4">
                  {usersError}
                </div>
              )}

              {hasSearched && users.length === 0 && !usersLoading && (
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
                  <p className="text-sm mt-1">Try a different search query</p>
                </div>
              )}

              {users.length > 0 && (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {users.map((u) => {
                      const breakdown = getEventTypeStats(u);
                      const eventTotal = breakdown.reduce(
                        (sum, item) => sum + item.count,
                        0,
                      );
                      const scanTotal =
                        typeof u.scans_total === "number" &&
                        Number.isFinite(u.scans_total)
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
                                {[u.first_name, u.last_name]
                                  .filter(Boolean)
                                  .join(" ") || "-"}
                              </p>
                              <p className="text-xs uppercase tracking-[0.3em] text-[#8b7fb6]">
                                Email
                              </p>
                              <p className="text-sm text-[#5b4d86] break-words">
                                {u.email}
                              </p>
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
                                  breakdown={breakdown}
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
                                  breakdown={breakdown}
                                  variant="inline"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#e5defa]">
                            <p className="text-xs uppercase tracking-wider text-[#8b7fb6] mb-1">
                              Joined
                            </p>
                            <p className="text-sm text-[#5b4d86]">
                              {formatDate(u.created_at)}
                            </p>
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
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e1fb] bg-white">
                        {users.map((u) => {
                          const breakdown = getEventTypeStats(u);
                          const eventTotal = breakdown.reduce(
                            (sum, item) => sum + item.count,
                            0,
                          );
                          const scanTotal =
                            typeof u.scans_total === "number" &&
                            Number.isFinite(u.scans_total)
                              ? u.scans_total
                              : 0;
                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-[#f8f4ff] transition-colors"
                            >
                              <td className="px-4 py-3 text-foreground/80">
                                {[u.first_name, u.last_name]
                                  .filter(Boolean)
                                  .join(" ") || "-"}
                              </td>
                              <td className="px-4 py-3 font-medium text-foreground">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">
                                <BreakdownPopup
                                  label="Scans"
                                  count={scanTotal}
                                  breakdown={breakdown}
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground/80">
                                <BreakdownPopup
                                  label="Events"
                                  count={eventTotal}
                                  breakdown={breakdown}
                                />
                              </td>
                              <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                                {formatDate(u.created_at)}
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
  const activeBorderClass = isActive
    ? "border-2 border-[#7f67d3] shadow-2xl"
    : "";

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
            {helperText && (
              <p className="text-xs text-[#8c80b6] mt-1 line-clamp-2">
                {helperText}
              </p>
            )}
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
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-[#5b4d86] font-medium truncate">
                    {item.label}
                  </span>
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
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-[#5b4d86] font-medium truncate">
                    {item.label}
                  </span>
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

type BreakdownPopupProps = {
  label: string;
  count: number;
  breakdown: Array<{ key: EventTypeKey; label: string; count: number }>;
  variant?: BreakdownPopupVariant;
};

function BreakdownPopup({
  label,
  count,
  breakdown,
  variant = "popover",
}: BreakdownPopupProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const normalizedCount = Number.isFinite(count) ? count : 0;
  const hasItems = breakdown.length > 0;

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
          <div
            key={item.key}
            className="flex items-center justify-between text-xs text-[#4b3f72]"
          >
            <span className="truncate">{item.label}</span>
            <span className="font-semibold">{item.count.toLocaleString()}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-[#9186bb]">No {label.toLowerCase()} yet</p>
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
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-2xl border border-[#ddd5f6] bg-white p-3 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}

function getEventTypeStats(
  source: Partial<Record<EventTypeKey, number>> | null | undefined,
) {
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

function Th({ children }: { children: any }) {
  return (
    <th className="text-left font-semibold px-4 py-3 text-foreground/80 text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: any; className?: string }) {
  return (
    <td className={`px-4 py-3 text-muted-foreground ${className || ""}`}>
      {children}
    </td>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

async function fetchUsers(q: string, cursor?: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/admin/users/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return (await res.json()) as {
    ok: boolean;
    items: any[];
    nextCursor: string | null;
  };
}

async function fetchStatUsers(view: StatView, cursor?: string | null) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/admin/users/filter?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${view} users: ${res.status}`);
  return (await res.json()) as {
    ok: boolean;
    items: any[];
    nextCursor: string | null;
  };
}
