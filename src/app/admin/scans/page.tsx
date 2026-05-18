import {
  AdminBarList,
  AdminMetricCard,
  AdminMobileRecordList,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPrimitives";
import { getAdminScanData } from "@/lib/admin/scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export default async function AdminScansPage() {
  const scans = await getAdminScanData(25);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Acquisition"
        title="Scans & Traffic"
        description="Saved OCR/upload/snap rows plus first-party share, RSVP, public view, and link-click flow."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total scans" value={scans.summary.totalScans.toLocaleString()} />
        <AdminMetricCard label="Scans 7d" value={scans.summary.scans7Days.toLocaleString()} />
        <AdminMetricCard label="Uploads" value={scans.summary.uploads.toLocaleString()} />
        <AdminMetricCard label="Snaps" value={scans.summary.snaps.toLocaleString()} />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title="Scan Categories">
          <AdminBarList
            rows={scans.categories.map((category) => ({
              label: category.label,
              value: category.scans,
            }))}
            valueLabel="scan categories"
          />
        </AdminPanel>

        <AdminPanel
          title="Recent Scans"
          description="Rows inferred from createdVia/sourceContext scan markers."
        >
          <AdminMobileRecordList
            rows={scans.recentScans.map((scan) => ({
              key: scan.id,
              title: scan.title,
              fields: [
                { label: "Category", value: scan.category },
                { label: "Source", value: scan.sourceType || "-" },
                { label: "Created via", value: scan.createdVia || "-" },
                { label: "Date", value: formatDate(scan.createdAt) },
              ],
            }))}
            emptyTitle="No recent scans"
            emptyDescription="No scan rows are available."
          />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 font-semibold">Created via</th>
                  <th className="py-2 pl-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.recentScans.map((scan) => (
                  <tr key={scan.id}>
                    <td className="max-w-[280px] truncate py-3 pr-3 font-medium text-slate-900">
                      {scan.title}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{scan.category}</td>
                    <td className="px-3 py-3 text-slate-700">{scan.sourceType || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{scan.createdVia || "-"}</td>
                    <td className="py-3 pl-3 text-slate-700">{formatDate(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="First-Party Tracking">
        <div className="grid gap-3 md:grid-cols-3">
          {["Public event views", "Share link clicks", "Registry clicks"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            >
              <p className="text-sm font-semibold text-emerald-950">{label}</p>
              <p className="mt-1 text-sm text-emerald-800">
                Recorded in event_tracking_events and summarized on the Events and Analytics pages.
              </p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
