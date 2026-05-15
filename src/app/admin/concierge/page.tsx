import {
  AdminBarList,
  AdminMetricCard,
  AdminMobileRecordList,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPrimitives";
import { getAdminConciergeData } from "@/lib/admin/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export default async function AdminConciergePage() {
  const concierge = await getAdminConciergeData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="AI Concierge"
        title="AI Concierge"
        description="Creation sessions, draft statuses, conversation threads, and message volume."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Sessions" value={concierge.summary.sessions.toLocaleString()} />
        <AdminMetricCard label="Drafts" value={concierge.summary.drafts.toLocaleString()} />
        <AdminMetricCard label="Published" value={concierge.summary.published.toLocaleString()} />
        <AdminMetricCard label="Messages" value={concierge.summary.messages.toLocaleString()} />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title="Session Statuses">
          <AdminBarList
            rows={concierge.statuses.map((status) => ({
              label: status.status.replace(/[_-]+/g, " "),
              value: status.count,
            }))}
            valueLabel="concierge sessions"
          />
        </AdminPanel>

        <AdminPanel title="Recent Sessions">
          {concierge.available ? (
            <>
              <AdminMobileRecordList
                rows={concierge.recentSessions.map((session) => ({
                  key: session.id,
                  title: session.id,
                  subtitle: session.ownerEmail || "No owner email",
                  fields: [
                    { label: "Status", value: session.status },
                    { label: "Created", value: formatDate(session.createdAt) },
                    { label: "Updated", value: formatDate(session.updatedAt) },
                  ],
                }))}
                emptyTitle="No recent sessions"
                emptyDescription="No creation sessions are available."
              />
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Session</th>
                      <th className="px-3 py-2 font-semibold">Owner</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Created</th>
                      <th className="py-2 pl-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {concierge.recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="max-w-[220px] truncate py-3 pr-3 font-mono text-xs text-slate-700">
                          {session.id}
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-slate-700">
                          {session.ownerEmail || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{session.status}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="py-3 pl-3 text-slate-700">
                          {formatDate(session.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Creation session tables are not available in this database.
            </p>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
