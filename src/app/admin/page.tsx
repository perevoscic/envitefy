"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Overview = {
  totalUsers: number;
  totalEvents: number;
  totalShares: number;
  usersPaid: number;
  usersFF: number;
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
      className="min-h-[100dvh] landing-dark-gradient bg-background text-foreground transition-colors"
      suppressHydrationWarning
    >
      <div
        className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <h1
            className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
            suppressHydrationWarning
          >
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            Platform insights, user analytics, and administrative tools
          </p>
        </div>

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
            className="text-xl font-semibold mb-3 text-foreground"
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard
                label="Total Users"
                value={overview.totalUsers}
                icon="👥"
                gradient="from-blue-500 to-cyan-500"
                onClick={() => handleStatClick("all")}
                isActive={activeStatView === "all"}
              />
              <StatCard
                label="Total Scans"
                value={overview.totalEvents}
                icon="📅"
                gradient="from-emerald-500 to-teal-500"
                onClick={() => handleStatClick("scans")}
                isActive={activeStatView === "scans"}
              />
              <StatCard
                label="Invites Send"
                value={overview.totalShares}
                icon="🔗"
                gradient="from-orange-500 to-rose-500"
                onClick={() => handleStatClick("shares")}
                isActive={activeStatView === "shares"}
              />
              <StatCard
                label="Paid Users"
                value={overview.usersPaid}
                icon="💳"
                gradient="from-purple-500 to-pink-500"
                onClick={() => handleStatClick("paid")}
                isActive={activeStatView === "paid"}
              />
              <StatCard
                label="FF Lifetime"
                value={overview.usersFF}
                icon="⭐"
                gradient="from-amber-500 to-yellow-500"
                onClick={() => handleStatClick("ff")}
                isActive={activeStatView === "ff"}
              />
            </div>
          )}
        </section>

        {/* User Search */}
        <section suppressHydrationWarning>
          <div
            className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-sm"
            suppressHydrationWarning
          >
            <div
              className="px-6 py-4 border-b border-border"
              suppressHydrationWarning
            >
              <h2
                className="text-lg font-semibold text-foreground"
                suppressHydrationWarning
              >
                {getActiveViewTitle()}
              </h2>
              <p
                className="text-sm text-muted-foreground mt-1"
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
                <div className="mb-4 flex items-center justify-between rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3">
                  <span className="text-sm text-secondary font-medium">
                    Active Filter: {getActiveViewTitle()}
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm text-secondary hover:text-secondary/80 font-semibold flex items-center gap-1"
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
                    className="w-full pl-11 pr-10 py-3 text-sm rounded-lg border border-border bg-surface/85 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    suppressHydrationWarning
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-surface/80"
                      title="Clear search"
                    >
                      <svg
                        className="w-4 h-4 text-muted-foreground"
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
                  className="px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
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
                <div className="text-center py-8 text-muted-foreground">
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
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-lg border border-border bg-surface/85 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Name:{" "}
                              <span className="text-foreground/80 font-bold">
                                {[u.first_name, u.last_name]
                                  .filter(Boolean)
                                  .join(" ") || "-"}
                              </span>
                            </p>
                            <p className="font-medium text-foreground truncate"></p>
                          </div>
                          <PlanBadge plan={u.subscription_plan} />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                            Email:{" "}
                            <span className="text-foreground/80 font-bold">
                              {u.email}
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Scans
                            </p>
                            <p className="font-semibold text-foreground">
                              {u.scans_total ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Shares
                            </p>
                            <p className="font-semibold text-foreground">
                              {u.shares_sent ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Credits
                            </p>
                            <p className="text-foreground/80">
                              {u.credits ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              Joined
                            </p>
                            <p className="text-foreground/80 text-sm">
                              {formatDate(u.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            Paid:
                          </span>
                          {u.ever_paid ? (
                            <span className="text-success font-medium">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div
                    className="hidden md:block overflow-x-auto rounded-lg border border-border"
                    suppressHydrationWarning
                  >
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface/80 text-xs uppercase tracking-wider font-semibold text-foreground/80 border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3">Paid</th>
                          <th className="px-4 py-3 text-right">Credits</th>
                          <th className="px-4 py-3 text-right">Scans</th>
                          <th className="px-4 py-3 text-right">Shares</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface/85">
                        {users.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-surface/75 transition-colors"
                          >
                            <td className="px-4 py-3 text-foreground/80">
                              {[u.first_name, u.last_name]
                                .filter(Boolean)
                                .join(" ") || "-"}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {u.email}
                            </td>
                            <td className="px-4 py-3">
                              <PlanBadge plan={u.subscription_plan} />
                            </td>
                            <td className="px-4 py-3">
                              {u.ever_paid ? (
                                <span className="text-success font-medium">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-foreground/80">
                              {u.credits ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                              {u.scans_total ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right text-foreground/80">
                              {u.shares_sent ?? 0}
                            </td>
                            <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                              {formatDate(u.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {users.length} result
                      {users.length !== 1 ? "s" : ""}
                    </p>
                    {usersCursor && (
                      <button
                        onClick={handleLoadMore}
                        disabled={usersLoading}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface/85 text-foreground/80 hover:bg-surface/80 hover:border-foreground/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
}: {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const activeBorderClass = isActive
    ? gradient.includes("blue")
      ? "border-2 border-blue-500 shadow-lg"
      : gradient.includes("emerald")
      ? "border-2 border-emerald-500 shadow-lg"
      : gradient.includes("orange")
      ? "border-2 border-orange-500 shadow-lg"
      : gradient.includes("purple")
      ? "border-2 border-purple-500 shadow-lg"
      : gradient.includes("amber")
      ? "border-2 border-amber-500 shadow-lg"
      : "border-2 border-indigo-500 shadow-lg"
    : "border-border hover:border-foreground/40";

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface transition-all shadow-sm cursor-pointer ring-1 ring-border/50 ${activeBorderClass} ${
        onClick ? "hover:shadow-md hover:scale-[1.02] hover:ring-border/80" : ""
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {value.toLocaleString()}
            </p>
          </div>
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-lg sm:text-xl shadow-lg flex-shrink-0 ${
              isActive ? "ring-2 ring-background" : ""
            }`}
          >
            {icon}
          </div>
        </div>
      </div>
      <div
        className={`h-1 bg-gradient-to-r ${gradient} ${
          isActive ? "opacity-100" : "opacity-60"
        }`}
      />
    </div>
  );
}

function PlanBadge({ plan }: { plan?: string | null }) {
  if (!plan) return <span className="text-muted-foreground">—</span>;

  const styles: Record<string, string> = {
    free: "bg-surface/80 text-foreground/80 border border-border",
    monthly: "bg-blue-500/15 text-blue-600 border border-blue-500/30",
    yearly: "bg-purple-500/15 text-purple-600 border border-purple-500/30",
    FF: "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
        styles[plan] || styles.free
      }`}
    >
      {plan === "FF" ? "⭐ Lifetime" : plan}
    </span>
  );
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
