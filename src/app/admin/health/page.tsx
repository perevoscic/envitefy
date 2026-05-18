import { AdminPageHeader, AdminPanel, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import { tableExists } from "@/lib/admin/data-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const tables = await Promise.all(
    [
      "users",
      "event_history",
      "event_shares",
      "event_tracking_events",
      "rsvp_responses",
      "email_campaigns",
      "creation_sessions",
      "conversation_threads",
      "conversation_messages",
    ].map(async (name) => ({ name, exists: await tableExists(name) })),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Runtime"
        title="Logs / Health"
        description="Lightweight data-source checks for the admin operations center."
      />

      <AdminPanel title="Database Tables">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tables.map((table) => (
            <div key={table.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm text-slate-800">{table.name}</p>
                <AdminStatusBadge tone={table.exists ? "success" : "warning"}>
                  {table.exists ? "found" : "missing"}
                </AdminStatusBadge>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
