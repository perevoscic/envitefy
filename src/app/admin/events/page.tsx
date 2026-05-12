import {
  AdminBarList,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPrimitives";
import { getAdminEventsData } from "@/lib/admin/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US");
}

export default async function AdminEventsPage() {
  const events = await getAdminEventsData(25);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations"
        title="Events"
        description="Event_history rows, public page coverage, share counts, and RSVP totals from first-party data."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total events" value={events.summary.totalEvents.toLocaleString()} />
        <AdminMetricCard
          label="Public pages"
          value={events.summary.publicEvents.toLocaleString()}
        />
        <AdminMetricCard label="Created 7d" value={events.summary.events7Days.toLocaleString()} />
        <AdminMetricCard label="RSVPs" value={events.summary.rsvps.toLocaleString()} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title="Top Categories">
          <AdminBarList
            rows={events.categories.map((category) => ({
              label: category.label,
              value: category.events,
              detail: `${category.shares.toLocaleString()} shares · ${category.rsvps.toLocaleString()} RSVPs`,
            }))}
            valueLabel="event categories"
          />
        </AdminPanel>

        <AdminPanel
          title="Recent Events"
          description="Latest rows with owner, category, and public slug context."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Event</th>
                  <th className="px-3 py-2 font-semibold">Owner</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Shares</th>
                  <th className="px-3 py-2 font-semibold">RSVPs</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="py-2 pl-3 font-semibold">Public slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="max-w-[240px] truncate py-3 pr-3 font-medium text-slate-900">
                      {event.title}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-700">
                      {event.ownerEmail || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{event.category}</td>
                    <td className="px-3 py-3 text-slate-700">{event.shares.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-700">{event.rsvps.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-700">{formatDate(event.createdAt)}</td>
                    <td className="max-w-[180px] truncate py-3 pl-3 font-mono text-xs text-slate-600">
                      {event.publicSlug || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
