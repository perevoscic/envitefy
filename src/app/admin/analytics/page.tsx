import {
  AdminMetricCard,
  AdminMobileRecordList,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import { getAdminAnalyticsSnapshot } from "@/lib/admin/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsSnapshot();
  const ga4ReportAvailable = analytics.ga4Report.status === "available";
  const ga4ConfigPresent = analytics.ga4.connected;
  const ga4StatusTone = ga4ReportAvailable ? "success" : ga4ConfigPresent ? "warning" : "warning";
  const ga4StatusLabel = ga4ReportAvailable
    ? "Connected"
    : ga4ConfigPresent
      ? "Needs access"
      : "Disconnected";
  const ga4Description = ga4ReportAvailable
    ? analytics.ga4.message
    : ga4ConfigPresent
      ? analytics.ga4Report.message
      : analytics.ga4.configurationError || analytics.ga4.message;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Measurement"
        title="Analytics"
        description="GA4 server configuration state and the v1 first-party tracking plan. No broad analytics event warehouse is introduced here."
      />

      <AdminPanel
        title="Google Analytics"
        description={ga4Description}
        action={<AdminStatusBadge tone={ga4StatusTone}>{ga4StatusLabel}</AdminStatusBadge>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Property ID
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {analytics.ga4.propertyIdConfigured ? analytics.ga4.propertyId : "Missing"}
            </p>
            {analytics.ga4.propertyIdConfigured && !analytics.ga4.propertyIdFormatValid ? (
              <p className="mt-2 text-xs text-amber-700">Use the numeric property ID.</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Credentials
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {analytics.ga4.credentialsValid
                ? `Configured via ${analytics.ga4.credentialsSource}`
                : analytics.ga4.credentialsConfigured
                  ? "Configured but invalid"
                  : "Missing"}
            </p>
            {analytics.ga4.serviceAccountEmail ? (
              <p className="mt-2 break-all text-xs text-slate-600">
                {analytics.ga4.serviceAccountEmail}
              </p>
            ) : null}
            {analytics.ga4.oauthEmail ? (
              <p className="mt-2 break-all text-xs text-slate-600">{analytics.ga4.oauthEmail}</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Setup
            </p>
            <p className="mt-2 text-sm text-slate-700">{analytics.ga4.setupHint}</p>
          </div>
        </div>
        {analytics.ga4.configurationError ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {analytics.ga4.configurationError}
          </p>
        ) : null}
      </AdminPanel>

      <AdminPanel
        title="GA4 Live Report"
        description={
          analytics.ga4Report.status === "available"
            ? "Last 30 days from the Google Analytics Data API."
            : analytics.ga4Report.message
        }
        action={
          <AdminStatusBadge
            tone={analytics.ga4Report.status === "available" ? "success" : "warning"}
          >
            {analytics.ga4Report.status}
          </AdminStatusBadge>
        }
      >
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <AdminMetricCard
            label="GA users now"
            value={analytics.ga4Report.totals.activeUsersNow.toLocaleString()}
          />
          <AdminMetricCard
            label="GA active users today"
            value={analytics.ga4Report.totals.activeUsersToday.toLocaleString()}
          />
          <AdminMetricCard
            label="GA active users 30d"
            value={analytics.ga4Report.totals.activeUsers30Days.toLocaleString()}
          />
          <AdminMetricCard
            label="GA sessions 30d"
            value={analytics.ga4Report.totals.sessions30Days.toLocaleString()}
          />
          <AdminMetricCard
            label="GA page views 30d"
            value={analytics.ga4Report.totals.screenPageViews30Days.toLocaleString()}
          />
          <AdminMetricCard
            label="GA events 30d"
            value={analytics.ga4Report.totals.eventCount30Days.toLocaleString()}
          />
        </section>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top Pages</h3>
            <div className="mt-3 space-y-2">
              {analytics.ga4Report.topPages.length ? (
                analytics.ga4Report.topPages.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-slate-700">{row.label}</span>
                    <span className="shrink-0 font-semibold text-slate-950">
                      {row.value.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  No page rows available.
                </p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top Events</h3>
            <div className="mt-3 space-y-2">
              {analytics.ga4Report.topEvents.length ? (
                analytics.ga4Report.topEvents.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-slate-700">{row.label}</span>
                    <span className="shrink-0 font-semibold text-slate-950">
                      {row.value.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  No event rows available.
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminPanel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Events 30d"
          value={analytics.firstParty.eventsLast30Days.toLocaleString()}
        />
        <AdminMetricCard
          label="Public events"
          value={analytics.firstParty.publicEvents.toLocaleString()}
        />
        <AdminMetricCard
          label="Shares 30d"
          value={analytics.firstParty.sharesLast30Days.toLocaleString()}
        />
        <AdminMetricCard
          label="RSVPs 30d"
          value={analytics.firstParty.rsvpsLast30Days.toLocaleString()}
        />
      </section>

      <AdminPanel title="Tracking Plan">
        <AdminMobileRecordList
          rows={analytics.trackingGaps.map((gap) => ({
            key: gap.eventName,
            title: gap.eventName,
            badge: (
              <AdminStatusBadge tone={gap.status === "missing" ? "warning" : "neutral"}>
                {gap.status}
              </AdminStatusBadge>
            ),
            fields: [
              { label: "Owner", value: gap.owner },
              { label: "Description", value: gap.description, wide: true },
            ],
          }))}
          emptyTitle="No tracking plan rows"
          emptyDescription="No tracking gaps are configured."
        />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-3 font-semibold">Event</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="py-2 pl-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.trackingGaps.map((gap) => (
                <tr key={gap.eventName}>
                  <td className="py-3 pr-3 font-mono text-xs text-slate-800">{gap.eventName}</td>
                  <td className="px-3 py-3">
                    <AdminStatusBadge tone={gap.status === "missing" ? "warning" : "neutral"}>
                      {gap.status}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{gap.owner}</td>
                  <td className="py-3 pl-3 text-slate-700">{gap.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
