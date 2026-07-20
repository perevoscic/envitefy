import type { ReactNode } from "react";
import {
  AdminBarList,
  AdminMetricCard,
  AdminMobileRecordList,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPrimitives";
import { getAdminEventsData, type AdminEventListItem } from "@/lib/admin/events";
import { buildEventProductPath } from "@/utils/event-product-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US");
}

function adminPublicEventHref(event: Pick<AdminEventListItem, "id" | "title" | "publicSlug">) {
  return buildEventProductPath({
    eventId: event.id,
    title: event.title,
    publicSlug: event.publicSlug,
  });
}

function AdminPublicEventLink({
  event,
  children,
  className,
}: {
  event: Pick<AdminEventListItem, "id" | "title" | "publicSlug">;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={adminPublicEventHref(event)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title="Open public event page"
    >
      {children}
    </a>
  );
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <AdminMetricCard label="Total events" value={events.summary.totalEvents.toLocaleString()} />
        <AdminMetricCard
          label="Public pages"
          value={events.summary.publicEvents.toLocaleString()}
        />
        <AdminMetricCard label="Created 7d" value={events.summary.events7Days.toLocaleString()} />
        <AdminMetricCard label="RSVPs" value={events.summary.rsvps.toLocaleString()} />
        <AdminMetricCard
          label="URL visitors"
          value={events.summary.publicEventVisitors.toLocaleString()}
        />
        <AdminMetricCard label="Link clicks" value={events.summary.linkClicks.toLocaleString()} />
      </section>

      <AdminPanel
        title="Recent Events"
        description="Visitors are unique browsers or signed-in users that opened the public event URL. Views are total page loads. Click an event name or public slug to open the public page in a new tab."
      >
        <AdminMobileRecordList
          rows={events.recentEvents.map((event) => ({
            key: event.id,
            title: (
              <AdminPublicEventLink
                event={event}
                className="text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900"
              >
                {event.title}
              </AdminPublicEventLink>
            ),
            subtitle: event.ownerEmail || "No owner email",
            fields: [
              { label: "Category", value: event.category },
              { label: "Shares", value: event.shares.toLocaleString() },
              { label: "RSVPs", value: event.rsvps.toLocaleString() },
              { label: "Visitors", value: event.publicEventVisitors.toLocaleString() },
              { label: "Views", value: event.publicEventViews.toLocaleString() },
              { label: "Clicks", value: event.linkClicks.toLocaleString() },
              { label: "Created", value: formatDate(event.createdAt) },
              {
                label: "Public slug",
                value: event.publicSlug ? (
                  <AdminPublicEventLink
                    event={event}
                    className="font-mono text-xs text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900"
                  >
                    {event.publicSlug}
                  </AdminPublicEventLink>
                ) : (
                  "-"
                ),
                className: "font-mono text-xs",
              },
            ],
          }))}
          emptyTitle="No recent events"
          emptyDescription="No event rows are available."
        />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-3 font-semibold">Event</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Shares</th>
                <th className="px-3 py-2 font-semibold">RSVPs</th>
                <th className="px-3 py-2 font-semibold">Visitors</th>
                <th className="px-3 py-2 font-semibold">Views</th>
                <th className="px-3 py-2 font-semibold">Clicks</th>
                <th className="px-3 py-2 font-semibold">Registry</th>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="py-2 pl-3 font-semibold">Public slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="max-w-[240px] truncate py-3 pr-3 font-medium text-slate-900">
                    <AdminPublicEventLink
                      event={event}
                      className="text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900"
                    >
                      {event.title}
                    </AdminPublicEventLink>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-slate-700">
                    {event.ownerEmail || "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{event.category}</td>
                  <td className="px-3 py-3 text-slate-700">{event.shares.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-700">{event.rsvps.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-700">
                    {event.publicEventVisitors.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {event.publicEventViews.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {event.linkClicks.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {event.registryClicks.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(event.createdAt)}</td>
                  <td className="max-w-[180px] truncate py-3 pl-3 font-mono text-xs text-slate-600">
                    {event.publicSlug ? (
                      <AdminPublicEventLink
                        event={event}
                        className="text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900"
                      >
                        {event.publicSlug}
                      </AdminPublicEventLink>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel
          title="Top Clicked Links"
          description="First-party clicks grouped by event, destination, and link label."
        >
          <AdminMobileRecordList
            rows={events.topLinks.map((link) => ({
              key: `${link.eventId}-${link.eventName}-${link.targetUrl || link.targetLabel || "link"}`,
              title: link.targetLabel || link.targetDomain || link.eventName,
              subtitle: link.eventTitle,
              fields: [
                { label: "Clicks", value: link.clicks.toLocaleString() },
                { label: "People", value: link.uniqueVisitors.toLocaleString() },
                { label: "Type", value: link.eventName },
                { label: "Last click", value: formatDate(link.lastClickedAt) },
                {
                  label: "URL",
                  value: link.targetUrl || "-",
                  wide: true,
                  className: "font-mono text-xs",
                },
              ],
            }))}
            emptyTitle="No tracked link clicks"
            emptyDescription="Link click rows will appear after guests use share or registry links."
          />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Link</th>
                  <th className="px-3 py-2 font-semibold">Event</th>
                  <th className="px-3 py-2 font-semibold">Clicks</th>
                  <th className="px-3 py-2 font-semibold">People</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="py-2 pl-3 font-semibold">Last click</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.topLinks.map((link) => (
                  <tr
                    key={`${link.eventId}-${link.eventName}-${link.targetUrl || link.targetLabel || "link"}`}
                  >
                    <td className="max-w-[320px] py-3 pr-3">
                      <p className="truncate font-medium text-slate-900">
                        {link.targetLabel || link.targetDomain || "Tracked link"}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-slate-500">
                        {link.targetUrl || "-"}
                      </p>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-700">
                      {link.eventTitle}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{link.clicks.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-700">
                      {link.uniqueVisitors.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600">
                      {link.eventName}
                    </td>
                    <td className="py-3 pl-3 text-slate-700">{formatDate(link.lastClickedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel title="Top Categories">
          <AdminBarList
            rows={events.categories.map((category) => ({
              key: category.category,
              label: category.label,
              value: category.events,
              detail: `${category.publicEventVisitors.toLocaleString()} visitors · ${category.linkClicks.toLocaleString()} clicks`,
            }))}
            valueLabel="event categories"
          />
        </AdminPanel>
      </div>
    </div>
  );
}
