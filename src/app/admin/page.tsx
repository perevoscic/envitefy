import Link from "next/link";
import {
  AdminBarList,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminSparkline,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import { getAdminOverviewData } from "@/lib/admin/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDelta(value: number) {
  if (value > 0) return `+${value.toLocaleString()}`;
  return value.toLocaleString();
}

function formatGa4GeneratedAt(value: string | null) {
  if (!value) return "No live report";
  return `Updated ${formatDate(value)}`;
}

export default async function AdminDashboardPage() {
  const overview = await getAdminOverviewData();
  const maxFunnel = Math.max(1, ...overview.funnel.map((step) => step.value));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations"
        title="Admin Dashboard"
        description="A first-party view of Envitefy growth, event creation, share activity, AI Concierge usage, and tracking readiness."
        action={
          <Link
            href="/admin/analytics"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-violet-300 hover:text-violet-800"
          >
            Review tracking
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Users"
          value={formatNumber(overview.kpis.users)}
          detail={`${formatNumber(overview.users.newUsers7Days)} new in 7 days`}
          href="/admin/users"
        />
        <AdminMetricCard
          label="Events"
          value={formatNumber(overview.kpis.events)}
          detail={`${formatNumber(overview.kpis.publicEvents)} public pages`}
          href="/admin/events"
        />
        <AdminMetricCard
          label="Scans"
          value={formatNumber(overview.kpis.scans)}
          detail="Saved uploads and snaps"
          href="/admin/scans"
        />
        <AdminMetricCard
          label="RSVPs"
          value={formatNumber(overview.kpis.rsvps)}
          detail={`${formatNumber(overview.kpis.shares)} event shares`}
          href="/admin/events"
        />
        <AdminMetricCard
          label="Email campaigns"
          value={formatNumber(overview.kpis.emailCampaigns)}
          detail="Bulk sends and tests"
          href="/admin/emails?tab=campaigns"
        />
        <AdminMetricCard
          label="Marketing runs"
          value={formatNumber(overview.kpis.marketingRuns)}
          detail="Storyboard asset runs"
          href="/admin/marketing-images"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <AdminPanel
            title="Platform Funnel"
            description="Current first-party counts. View, share-click, registry-click, and attribution events are documented as missing tracking below."
          >
            <div className="space-y-3">
              {overview.funnel.map((step) => {
                const width = `${Math.max(5, Math.round((step.value / maxFunnel) * 100))}%`;
                return (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="block rounded-md p-1 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{step.label}</span>
                      <span className="font-semibold text-slate-950">
                        {formatNumber(step.value)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-violet-600" style={{ width }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Event Category Performance"
            description="Event, scan, share, and RSVP mix by stored event category."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Events</th>
                    <th className="px-3 py-2 font-semibold">Scans</th>
                    <th className="px-3 py-2 font-semibold">Shares</th>
                    <th className="px-3 py-2 font-semibold">RSVPs</th>
                    <th className="py-2 pl-3 font-semibold">Latest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.categoryPerformance.map((category) => (
                    <tr key={category.category}>
                      <td className="py-3 pr-3 font-medium text-slate-900">{category.label}</td>
                      <td className="px-3 py-3 text-slate-700">{formatNumber(category.events)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatNumber(category.scans)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatNumber(category.shares)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatNumber(category.rsvps)}</td>
                      <td className="py-3 pl-3 text-slate-600">
                        {formatDate(category.lastCreatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Growth Insights"
            description="Seven-day first-party movement compared with the previous seven days."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {overview.growthInsights.map((insight) => (
                <div key={insight.label} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{insight.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Previous 7 days: {formatNumber(insight.previous7Days)}
                      </p>
                    </div>
                    <AdminStatusBadge tone={insight.delta >= 0 ? "success" : "warning"}>
                      {formatDelta(insight.delta)}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-4">
                    <AdminSparkline
                      label={`${insight.label} trend`}
                      values={[insight.previous7Days, insight.current7Days]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <aside className="space-y-5">
          <AdminPanel
            title="GA4 Snapshot"
            description={
              overview.ga4Report.status === "available"
                ? formatGa4GeneratedAt(overview.ga4Report.generatedAt)
                : "Server reporting is not connected"
            }
            action={
              <AdminStatusBadge
                tone={overview.ga4Report.status === "available" ? "success" : "warning"}
              >
                {overview.ga4Report.status === "available" ? "Connected" : "Disconnected"}
              </AdminStatusBadge>
            }
          >
            {overview.ga4Report.status === "available" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">Active users 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatNumber(overview.ga4Report.totals.activeUsers30Days)}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">Page views 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatNumber(overview.ga4Report.totals.screenPageViews30Days)}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">Sessions 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatNumber(overview.ga4Report.totals.sessions30Days)}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">GA events 30d</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatNumber(overview.ga4Report.totals.eventCount30Days)}
                    </p>
                  </div>
                </div>
                <AdminBarList
                  valueLabel="page views"
                  rows={overview.ga4Report.topPages.slice(0, 5)}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-700">
                {overview.ga4.configurationError ?? overview.ga4Report.message}
              </p>
            )}
            {overview.ga4Report.status !== "available" ? (
              <Link
                href="/admin/analytics"
                className="mt-4 inline-flex min-h-11 items-center rounded-md bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800"
              >
                Setup details
              </Link>
            ) : null}
          </AdminPanel>

          <AdminPanel
            title="AI Concierge"
            description="Draft session health"
            action={
              <Link href="/admin/concierge" className="text-sm font-semibold text-violet-700">
                Open
              </Link>
            }
          >
            <AdminBarList
              valueLabel="concierge statuses"
              rows={overview.concierge.statuses.slice(0, 5).map((status) => ({
                label: status.status.replace(/[_-]+/g, " "),
                value: status.count,
              }))}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-slate-500">Sessions</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(overview.concierge.summary.sessions)}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-slate-500">Active 7d</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(overview.concierge.summary.active7Days)}
                </p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Needs Attention">
            <div className="space-y-3">
              {overview.needsAttention.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-md border border-slate-200 p-3 hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <AdminStatusBadge tone={item.tone}>{item.tone}</AdminStatusBadge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Recent Activity">
            <div className="space-y-3">
              {overview.recentActivity.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.occurredAt || index}`}
                  className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-900">{activity.label}</p>
                    <AdminStatusBadge tone="neutral">{activity.type}</AdminStatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {activity.detail} · {formatDate(activity.occurredAt)}
                  </p>
                </div>
              ))}
            </div>
          </AdminPanel>
        </aside>
      </div>
    </div>
  );
}
