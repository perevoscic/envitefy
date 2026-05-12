"use client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  type LucideIcon,
  Mail,
  Megaphone,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { buildEventProductPath } from "@/utils/event-product-route";

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

const ADMIN_ACTIONS: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    href: "/admin/campaigns",
    label: "Email campaigns",
    description: "Compose, preview, and send bulk user updates.",
    icon: Mail,
    tone: "bg-[#f4efff] text-[#6f57c8]",
  },
  {
    href: "/admin/emails",
    label: "Email templates",
    description: "Review transactional and marketing email designs.",
    icon: FileText,
    tone: "bg-[#f3f7ff] text-[#566fbd]",
  },
  {
    href: "/admin/marketing-images",
    label: "Creative runs",
    description: "Storyboard, caption, QA, and render marketing assets.",
    icon: ImageIcon,
    tone: "bg-[#edf9f5] text-[#287e65]",
  },
];

const ADMIN_CONCIERGE_PROMPTS = [
  "Summarize platform health",
  "Find users with scans but no events",
  "Spot RSVP setup issues",
  "Audit event ownership drift",
  "Suggest campaign audience",
];

type Overview = {
  totalUsers: number;
  totalEvents: number;
  totalShares: number;
  totalScans: number;
  eventsByCategory: EventCategoryTotals;
  scansByCategory: EventCategoryTotals;
};

type StatView = "all" | "scans" | "shares" | null;
type UserOpsTab = "directory" | "contact";

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
  const [activeUserOpsTab, setActiveUserOpsTab] = useState<UserOpsTab>("directory");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const categoryStats = overview ? getEventTypeStats(overview.eventsByCategory) : [];
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
      const res = await fetchStatUsers(
        view,
        null,
        view === "all" ? Math.min(200, Math.max(100, overview?.totalUsers || 0)) : undefined,
      );
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
        ? await fetchStatUsers(
            activeStatView,
            usersCursor,
            activeStatView === "all"
              ? Math.min(200, Math.max(100, overview?.totalUsers || 0))
              : undefined,
          )
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
    if (activeStatView === "scans") return "Users by Total Scans";
    if (activeStatView === "shares") return "Users by Shares Sent";
    return "User Search";
  }

  async function handleDeleteUser(user: any) {
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
      setUsers((prev) => prev.filter((entry) => entry.id !== user.id));

      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        setOverview(json.overview);
      } catch {}
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div
      className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,#ffffff_0,#faf8ff_34%,#f1edfb_100%)] text-[#24193f] transition-colors"
      suppressHydrationWarning
    >
      <div
        className="mx-auto max-w-[1500px] space-y-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8"
        suppressHydrationWarning
      >
        {/* Header */}
        <div
          className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_80px_rgba(76,57,140,0.12)] backdrop-blur md:flex-row md:items-end md:justify-between"
          suppressHydrationWarning
        >
          <div className="max-w-3xl space-y-3" suppressHydrationWarning>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[#e6ddfb] bg-[#f7f2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#735cc5]"
              suppressHydrationWarning
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Internal admin
            </div>
            <div className="space-y-2" suppressHydrationWarning>
              <h1
                className="text-balance text-3xl font-semibold tracking-normal text-[#24193f] sm:text-4xl"
                suppressHydrationWarning
              >
                Admin Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[#766a99]" suppressHydrationWarning>
                Platform health, creator activity, event intelligence, and the operational tools
                needed to keep Envitefy moving.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex" suppressHydrationWarning>
            <Link
              href="/admin/campaigns"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#dfd6f6] bg-white px-4 text-sm font-semibold text-[#5b469c] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Mail className="h-4 w-4" />
              Campaigns
            </Link>
            <Link
              href="/admin/marketing-images"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#24193f] px-4 text-sm font-semibold text-white shadow-lg shadow-[#6f57c8]/20 transition hover:-translate-y-0.5"
            >
              <ImageIcon className="h-4 w-4" />
              Creative
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" suppressHydrationWarning>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {ADMIN_ACTIONS.map((action) => (
              <AdminActionCard key={action.href} {...action} />
            ))}
          </div>
          <AdminConciergeCard overview={overview} />
        </section>

        {error && (
          <div
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
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <section suppressHydrationWarning>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div suppressHydrationWarning>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f80bd]">
                Platform Overview
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#24193f]" suppressHydrationWarning>
                Creator activity at a glance
              </h2>
            </div>
            {overview && (
              <p className="text-sm text-[#766a99]" suppressHydrationWarning>
                {overview.totalEvents.toLocaleString()} events from{" "}
                {overview.totalUsers.toLocaleString()} users
              </p>
            )}
          </div>
          {!overview ? (
            <div className="flex items-center justify-center rounded-[1.5rem] border border-[#e5def6] bg-white/75 py-14 shadow-sm">
              <div
                className="flex items-center gap-3 text-sm font-medium text-[#766a99]"
                suppressHydrationWarning
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading overview...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Users"
                value={overview.totalUsers}
                description="Search, review, and triage accounts."
                icon={Users}
                onClick={() => handleStatClick("all")}
                isActive={activeStatView === "all"}
              />
              <ScanBreakdownCard
                label="Total Scans"
                scanStats={scanStats}
                total={overview.totalScans}
                onClick={() => handleStatClick("scans")}
                isActive={activeStatView === "scans"}
              />
              <CategoryBreakdownCard
                label="Total Events Created"
                categoryStats={categoryStats}
                total={overview.totalEvents}
              />
              <StatCard
                label="Shares Sent"
                value={overview.totalShares}
                description="Creators actively distributing event links."
                icon={Megaphone}
                onClick={() => handleStatClick("shares")}
                isActive={activeStatView === "shares"}
              />
            </div>
          )}
        </section>

        {/* User Search */}
        <section suppressHydrationWarning>
          <div
            className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 shadow-[0_24px_70px_rgba(76,57,140,0.14)] backdrop-blur"
            suppressHydrationWarning
          >
            <div
              className="flex flex-col gap-3 border-b border-[#ebe5f8] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6"
              suppressHydrationWarning
            >
              <div suppressHydrationWarning>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f80bd]">
                  User operations
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#24193f]" suppressHydrationWarning>
                  {getActiveViewTitle()}
                </h2>
                <p className="mt-1 text-sm text-[#766a99]" suppressHydrationWarning>
                  {activeStatView
                    ? `Showing ${
                        activeStatView === "all"
                          ? "all users"
                          : activeStatView === "scans"
                            ? "users sorted by total scans"
                            : "users sorted by shares sent"
                      }`
                    : "Search users, inspect event URLs, and clean up test accounts."}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f7f3ff] px-3 py-2 text-xs font-semibold text-[#6f57c8]">
                Dev event URLs available
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e3daf7] bg-[#faf7ff] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f80bd]">Total users</p>
                  <p className="text-lg font-semibold text-[#3f2f73]">
                    {overview?.totalUsers?.toLocaleString() || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3daf7] bg-[#faf7ff] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f80bd]">
                    Total result set
                  </p>
                  <p className="text-lg font-semibold text-[#3f2f73]">{users.length.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#e3daf7] bg-[#faf7ff] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f80bd]">Active mode</p>
                  <p className="text-sm font-semibold text-[#3f2f73]">
                    {activeUserOpsTab === "directory" ? "User directory" : "Contact details"}
                  </p>
                </div>
              </div>
              {activeStatView && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#d8cdf4] bg-[#f7f2ff] px-4 py-3">
                  <span className="text-sm text-[#6f57c8] font-medium">
                    Active Filter: {getActiveViewTitle()}
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="flex items-center gap-1 text-sm font-semibold text-[#6f57c8] transition hover:text-[#5a42b7]"
                  >
                    <X className="h-4 w-4" />
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
                  <Search
                    className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#998fc0]"
                    suppressHydrationWarning
                  />
                  {q && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-[#f1edff]"
                      title="Clear search"
                    >
                      <X className="h-4 w-4 text-[#998fc0]" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={usersLoading || !!activeStatView}
                  className="px-6 py-3 text-sm font-semibold overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b70de] to-[#6f57c8] hover:from-[#7f63d8] hover:to-[#5f49bb] text-white shadow-lg shadow-[#8b70de]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {usersLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
              <div className="mb-4 inline-flex rounded-2xl border border-[#d8cdf4] bg-[#f7f2ff] p-1">
                <button
                  type="button"
                  onClick={() => setActiveUserOpsTab("directory")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeUserOpsTab === "directory"
                      ? "bg-white text-[#5b469c] shadow-sm"
                      : "text-[#7d6ab5] hover:text-[#5b469c]"
                  }`}
                >
                  User directory
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUserOpsTab("contact")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeUserOpsTab === "contact"
                      ? "bg-white text-[#5b469c] shadow-sm"
                      : "text-[#7d6ab5] hover:text-[#5b469c]"
                  }`}
                >
                  Contact details
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
                      const eventBreakdown = getUserEventTypeStats(u);
                      const scanBreakdown = getEventTypeStats(u);
                      const eventTotal = getFiniteNumber(
                        u.events_total,
                        eventBreakdown.reduce((sum, item) => sum + item.count, 0),
                      );
                      const eventLinks = getUserEventDebugLinks(u);
                      const scanLinks = getUserScanDebugLinks(u);
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
                              {activeUserOpsTab === "contact" && (
                                <>
                                  <p className="text-xs uppercase tracking-[0.3em] text-[#8b7fb6]">
                                    Email
                                  </p>
                                  <p className="text-sm text-[#5b4d86] break-words">{u.email}</p>
                                </>
                              )}
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
                                  eventLinks={eventLinks}
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
                                  eventLinks={scanLinks}
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
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f0b8c7] bg-[#fff2f5] px-3 py-2 text-sm font-semibold text-[#b84367] transition-colors hover:bg-[#ffe7ee] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingUserId === u.id ? "Deleting..." : "Delete"}
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
                          {activeUserOpsTab === "contact" && <th className="px-4 py-3">Email</th>}
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
                          const eventLinks = getUserEventDebugLinks(u);
                          const scanLinks = getUserScanDebugLinks(u);
                          const scanTotal =
                            typeof u.scans_total === "number" && Number.isFinite(u.scans_total)
                              ? u.scans_total
                              : 0;
                          return (
                            <tr key={u.id} className="hover:bg-[#f8f4ff] transition-colors">
                              <td className="px-4 py-3 text-foreground/80">
                                {[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}
                              </td>
                              {activeUserOpsTab === "contact" && (
                                <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                              )}
                              <td className="px-4 py-3 text-right font-semibold text-foreground">
                                <BreakdownPopup
                                  label="Scans"
                                  count={scanTotal}
                                  breakdown={scanBreakdown}
                                  eventLinks={scanLinks}
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground/80">
                                <BreakdownPopup
                                  label="Events"
                                  count={eventTotal}
                                  breakdown={eventBreakdown}
                                  eventLinks={eventLinks}
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
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f0b8c7] bg-[#fff2f5] px-3 py-2 text-sm font-semibold text-[#b84367] transition-colors hover:bg-[#ffe7ee] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {deletingUserId === u.id ? "Deleting..." : "Delete"}
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

function AdminActionCard({
  href,
  label,
  description,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[156px] flex-col justify-between rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_55px_rgba(76,57,140,0.1)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(76,57,140,0.16)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-[#b4a9d6] transition group-hover:translate-x-0.5 group-hover:text-[#735cc5]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-[#24193f]">{label}</h3>
        <p className="text-sm leading-5 text-[#766a99]">{description}</p>
      </div>
    </Link>
  );
}

function AdminConciergeCard({ overview }: { overview: Overview | null }) {
  const engagementSummary = overview
    ? `${overview.totalEvents.toLocaleString()} events, ${overview.totalScans.toLocaleString()} scans`
    : "Waiting for platform stats";

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e4dbf7] bg-[#24193f] p-5 text-white shadow-[0_24px_80px_rgba(36,25,63,0.22)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_10%,rgba(197,177,255,0.34),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(123,214,187,0.22),transparent_40%)]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-[#e8ddff] ring-1 ring-white/15">
            <WandSparkles className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#e8ddff]">
            Concierge preview
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Ask Concierge what needs attention</h3>
          <p className="mt-1 text-sm leading-6 text-[#d9d0ef]">
            Turn admin data into practical next steps for campaigns, event setup, and creator
            follow-up.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-[#f0eaff] ring-1 ring-white/10">
          <BarChart3 className="h-4 w-4 text-[#c8bbff]" />
          {engagementSummary}
        </div>
        <div className="flex flex-wrap gap-2">
          {ADMIN_CONCIERGE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f4efff] ring-1 ring-white/10 transition hover:bg-white/15"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  onClick,
  isActive,
  description,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  onClick?: () => void;
  isActive?: boolean;
  description?: string;
}) {
  const Icon = icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.5rem] border bg-white/88 p-5 shadow-[0_18px_55px_rgba(76,57,140,0.1)] ring-1 ring-white/70 transition ${
        isActive ? "border-[#7f67d3] shadow-[0_24px_70px_rgba(111,87,200,0.22)]" : "border-white/80"
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f80bd]">{label}</p>
          <p className="mt-2 truncate text-3xl font-semibold text-[#24193f]">
            {value.toLocaleString()}
          </p>
          {description && <p className="mt-2 text-sm leading-5 text-[#766a99]">{description}</p>}
        </div>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f4efff] text-[#6f57c8] ring-1 ring-[#e4dbf7]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdownCard({
  label,
  categoryStats,
  total,
  onClick,
  isActive,
}: {
  label: string;
  categoryStats: Array<{ key: EventTypeKey; label: string; count: number }>;
  total: number;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border bg-white/88 p-5 shadow-[0_18px_55px_rgba(76,57,140,0.1)] ring-1 ring-white/70 transition ${
        isActive ? "border-[#7f67d3] shadow-[0_24px_70px_rgba(111,87,200,0.22)]" : "border-white/80"
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f80bd]">
              {label}
            </p>
            <p className="mt-2 truncate text-3xl font-semibold text-[#24193f]">
              {total.toLocaleString()}
            </p>
            <p className="mt-2 text-sm leading-5 text-[#766a99]">
              Published and draft events by type.
            </p>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f4efff] text-[#6f57c8] ring-1 ring-[#e4dbf7]">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
        </div>
        <div className="border-t border-[#eee8f8] pt-4">
          {categoryStats.length > 0 ? (
            <div className="space-y-2">
              {categoryStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-[#5b4d86]">{item.label}</span>
                  <span className="whitespace-nowrap font-semibold text-[#24193f]">
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
    </div>
  );
}

function ScanBreakdownCard({
  label,
  scanStats,
  total,
  onClick,
  isActive,
}: {
  label: string;
  scanStats: Array<{ key: EventTypeKey; label: string; count: number }>;
  total: number;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border bg-white/88 p-5 shadow-[0_18px_55px_rgba(76,57,140,0.1)] ring-1 ring-white/70 transition ${
        isActive ? "border-[#7f67d3] shadow-[0_24px_70px_rgba(111,87,200,0.22)]" : "border-white/80"
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f80bd]">
              {label}
            </p>
            <p className="mt-2 truncate text-3xl font-semibold text-[#24193f]">
              {total.toLocaleString()}
            </p>
            <p className="mt-2 text-sm leading-5 text-[#766a99]">
              Input volume from uploads and snaps.
            </p>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f4efff] text-[#6f57c8] ring-1 ring-[#e4dbf7]">
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="border-t border-[#eee8f8] pt-4">
          {scanStats.length > 0 ? (
            <div className="space-y-2">
              {scanStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-[#5b4d86]">{item.label}</span>
                  <span className="whitespace-nowrap font-semibold text-[#24193f]">
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
    </div>
  );
}

type BreakdownPopupVariant = "popover" | "inline";

type BreakdownPopupProps = {
  label: string;
  count: number;
  breakdown: Array<{ key: EventTypeKey; label: string; count: number }>;
  eventLinks?: AdminEventDebugLink[];
  variant?: BreakdownPopupVariant;
};

function BreakdownPopup({
  label,
  count,
  breakdown,
  eventLinks = [],
  variant = "popover",
}: BreakdownPopupProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const normalizedCount = Number.isFinite(count) ? count : 0;
  const hasItems = breakdown.length > 0;
  const hasEventLinks = eventLinks.length > 0;
  const isScanBreakdown = label.toLowerCase() === "scans";
  const debugLinksHeading = isScanBreakdown ? "Dev scan URLs" : "Dev event URLs";
  const showMissingScanLinks = isScanBreakdown && normalizedCount > 0 && !hasEventLinks;

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
      {showMissingScanLinks && (
        <p className="mt-3 border-t border-[#e8e1fb] pt-3 text-xs text-[#9186bb]">
          No saved scan URLs yet
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

function getUserEventDebugLinks(source: Record<string, unknown> | null | undefined) {
  return readAdminDebugLinks(source, "event_debug_links");
}

function getUserScanDebugLinks(source: Record<string, unknown> | null | undefined) {
  return readAdminDebugLinks(source, "scan_debug_links");
}

function readAdminDebugLinks(
  source: Record<string, unknown> | null | undefined,
  key: "event_debug_links" | "scan_debug_links",
) {
  const rawValue = source?.[key];
  const rawItems: unknown[] = Array.isArray(rawValue) ? rawValue : [];
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

function formatDate(value?: string, options?: { forceUsNumeric?: boolean }) {
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

async function fetchStatUsers(view: StatView, cursor?: string | null, limit?: number) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (cursor) params.set("cursor", cursor);
  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    params.set("limit", String(Math.floor(limit)));
  }
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
