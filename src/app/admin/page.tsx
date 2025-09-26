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

type TopUser = { email: string; scans: number; shares: number };

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [top, setTop] = useState<TopUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

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
        setTop(json.topUsers || []);
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

  async function handleSearch() {
    if (!q.trim()) {
      setUsers([]);
      setUsersCursor(null);
      setUsersError(null);
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
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
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Quick insights and tools. Inspired by Velzon’s clean cards and tables.
        </p>
      </div>

      {error && (
        <div className="rounded bg-red-100 text-red-800 p-3">{error}</div>
      )}

      <section>
        <h2 className="text-xl font-medium mb-3">Overview</h2>
        {!overview ? (
          <div>Loading overview…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat
              label="Users"
              value={overview.totalUsers}
              accent="from-indigo-500 to-sky-500"
            />
            <Stat
              label="Events"
              value={overview.totalEvents}
              accent="from-emerald-500 to-lime-500"
            />
            <Stat
              label="Shares"
              value={overview.totalShares}
              accent="from-rose-500 to-orange-500"
            />
            <Stat
              label="Paid users"
              value={overview.usersPaid}
              accent="from-fuchsia-500 to-pink-500"
            />
            <Stat
              label="FF users"
              value={overview.usersFF}
              accent="from-amber-500 to-yellow-500"
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-medium mb-3">Top users by scans</h2>
        {top.length === 0 ? (
          <div>No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[480px] w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Email</Th>
                  <Th>Scans</Th>
                  <Th>Shares</Th>
                </tr>
              </thead>
              <tbody>
                {top.map((u) => (
                  <tr key={u.email} className="border-t">
                    <Td>{u.email}</Td>
                    <Td>{u.scans}</Td>
                    <Td>{u.shares}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-medium mb-3">Users</h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Search by email, first or last name"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={usersLoading}
              className="px-4 py-2 text-sm rounded bg-indigo-600 text-white disabled:opacity-60"
            >
              {usersLoading ? "Searching…" : "Search"}
            </button>
          </div>
          {usersError && (
            <div className="rounded bg-red-100 text-red-800 p-2 text-sm">
              {usersError}
            </div>
          )}
          {users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Email</Th>
                    <Th>Name</Th>
                    <Th>Plan</Th>
                    <Th>Paid</Th>
                    <Th>Credits</Th>
                    <Th>Scans</Th>
                    <Th>Shares</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <Td>{u.email}</Td>
                      <Td>
                        {[u.first_name, u.last_name].filter(Boolean).join(" ")}
                      </Td>
                      <Td>{u.subscription_plan || "-"}</Td>
                      <Td>{u.ever_paid ? "Yes" : "No"}</Td>
                      <Td>{u.credits ?? "-"}</Td>
                      <Td>{u.scans_total ?? 0}</Td>
                      <Td>{u.shares_sent ?? 0}</Td>
                      <Td>{formatDate(u.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center gap-3">
            {users.length > 0 && (
              <button
                onClick={handleLoadMore}
                disabled={usersLoading || !usersCursor}
                className="px-4 py-2 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                {usersLoading
                  ? "Loading…"
                  : usersCursor
                  ? "Load more"
                  : "End of results"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded border p-4 bg-white">
      <div className={`text-xs uppercase tracking-wide text-gray-500 mb-1`}>
        {label}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-semibold">{value}</div>
        {accent && (
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${accent}`} />
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="text-left font-medium px-3 py-2">{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td className="px-3 py-2">{children}</td>;
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

// Keep component-level handlers after component to avoid re-creating functions per render
function handleSearch(this: any) {}
function handleLoadMore(this: any) {}
