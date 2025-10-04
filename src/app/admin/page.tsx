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

  async function handleLoadMore() {
    if (!q.trim() || !usersCursor) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetchUsers(q.trim(), usersCursor);
      setUsers((prev) => [...prev, ...(res.items || [])]);
      setUsersCursor(res.nextCursor || null);
    } catch (e: any) {
      setUsersError(e?.message || String(e));
    } finally {
      setUsersLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
      suppressHydrationWarning
    >
      <div
        className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <h1
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
            suppressHydrationWarning
          >
            Admin Dashboard
          </h1>
          <p
            className="text-slate-600 dark:text-slate-400 text-sm"
            suppressHydrationWarning
          >
            Platform insights, user analytics, and administrative tools
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4"
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
            className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200"
            suppressHydrationWarning
          >
            Platform Overview
          </h2>
          {!overview ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="flex items-center gap-3 text-slate-600 dark:text-slate-400"
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
              />
              <StatCard
                label="Events"
                value={overview.totalEvents}
                icon="📅"
                gradient="from-emerald-500 to-teal-500"
              />
              <StatCard
                label="Event Shares"
                value={overview.totalShares}
                icon="🔗"
                gradient="from-orange-500 to-rose-500"
              />
              <StatCard
                label="Paid Users"
                value={overview.usersPaid}
                icon="💳"
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                label="FF Lifetime"
                value={overview.usersFF}
                icon="⭐"
                gradient="from-amber-500 to-yellow-500"
              />
            </div>
          )}
        </section>

        {/* User Search */}
        <section suppressHydrationWarning>
          <div
            className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
            suppressHydrationWarning
          >
            <div
              className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
              suppressHydrationWarning
            >
              <h2
                className="text-lg font-semibold text-slate-800 dark:text-slate-200"
                suppressHydrationWarning
              >
                User Search
              </h2>
              <p
                className="text-sm text-slate-600 dark:text-slate-400 mt-1"
                suppressHydrationWarning
              >
                Search for users by email, first name, or last name
              </p>
            </div>
            <div className="p-6">
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
                    className="w-full pl-11 pr-10 py-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    suppressHydrationWarning
                  />
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      title="Clear search"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400 dark:text-slate-500"
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
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 text-sm mb-4">
                  {usersError}
                </div>
              )}

              {hasSearched && users.length === 0 && !usersLoading && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
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
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Email
                            </p>
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {u.email}
                            </p>
                          </div>
                          <PlanBadge plan={u.subscription_plan} />
                        </div>

                        {(u.first_name || u.last_name) && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Name
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {[u.first_name, u.last_name]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Scans
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {u.scans_total ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Shares
                            </p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {u.shares_sent ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Credits
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {u.credits ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                              Joined
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm">
                              {formatDate(u.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Paid:
                          </span>
                          {u.ever_paid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">
                              No
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div
                    className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
                    suppressHydrationWarning
                  >
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Plan</th>
                          <th className="px-4 py-3">Paid</th>
                          <th className="px-4 py-3 text-right">Credits</th>
                          <th className="px-4 py-3 text-right">Scans</th>
                          <th className="px-4 py-3 text-right">Shares</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/30">
                        {users.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              {[u.first_name, u.last_name]
                                .filter(Boolean)
                                .join(" ") || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <PlanBadge plan={u.subscription_plan} />
                            </td>
                            <td className="px-4 py-3">
                              {u.ever_paid ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                              {u.credits ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                              {u.scans_total ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                              {u.shares_sent ?? 0}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {formatDate(u.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {users.length} result
                      {users.length !== 1 ? "s" : ""}
                    </p>
                    {usersCursor && (
                      <button
                        onClick={handleLoadMore}
                        disabled={usersLoading}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
}: {
  label: string;
  value: number;
  icon: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {value.toLocaleString()}
            </p>
          </div>
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg flex-shrink-0`}
          >
            {icon}
          </div>
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${gradient} opacity-60`} />
    </div>
  );
}

function PlanBadge({ plan }: { plan?: string | null }) {
  if (!plan)
    return <span className="text-slate-400 dark:text-slate-500">—</span>;

  const styles: Record<string, string> = {
    free: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    monthly:
      "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50",
    yearly:
      "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50",
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
    <th className="text-left font-semibold px-4 py-3 text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: any; className?: string }) {
  return (
    <td
      className={`px-4 py-3 text-slate-600 dark:text-slate-400 ${
        className || ""
      }`}
    >
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
