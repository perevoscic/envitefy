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

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {error && (
        <div className="rounded bg-red-100 text-red-800 p-3">{error}</div>
      )}

      <section>
        <h2 className="text-xl font-medium mb-3">Overview</h2>
        {!overview ? (
          <div>Loading overview…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat label="Users" value={overview.totalUsers} />
            <Stat label="Events" value={overview.totalEvents} />
            <Stat label="Shares" value={overview.totalShares} />
            <Stat label="Paid users" value={overview.usersPaid} />
            <Stat label="FF users" value={overview.usersFF} />
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="text-left font-medium px-3 py-2">{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td className="px-3 py-2">{children}</td>;
}
