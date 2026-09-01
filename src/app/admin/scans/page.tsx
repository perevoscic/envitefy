import Link from "next/link";
import {
  AdminBarList,
  AdminMetricCard,
  AdminMobileRecordList,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
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

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(status: "processed" | "saved" | "failed") {
  if (status === "saved") return <AdminStatusBadge tone="success">Saved event</AdminStatusBadge>;
  if (status === "failed") return <AdminStatusBadge tone="danger">Failed</AdminStatusBadge>;
  return <AdminStatusBadge tone="warning">Not saved</AdminStatusBadge>;
}

export default async function AdminScansPage() {
  const scans = await getAdminScanData(25);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Acquisition"
        title="Scans & Traffic"
        description="Private OCR troubleshooting records, saved scan events, and first-party engagement flow."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Total attempts"
          value={scans.summary.totalScans.toLocaleString()}
          detail="Matches the aggregate shown on Users."
        />
        <AdminMetricCard
          label="Saved scan events"
          value={scans.summary.savedScans.toLocaleString()}
          detail={`${scans.summary.scans7Days.toLocaleString()} saved in the last 7 days.`}
        />
        <AdminMetricCard
          label="Not saved"
          value={scans.summary.unsavedAttempts.toLocaleString()}
          detail="Attempts without a saved event-history row."
        />
        <AdminMetricCard
          label="Tracked attempts 7d"
          value={scans.summary.attempts7Days.toLocaleString()}
          detail={`${scans.summary.trackedAttempts.toLocaleString()} detailed records retained.`}
        />
      </section>

      <AdminPanel
        title="Recent Scan Attempts"
        description="Open a private diagnostic record to inspect the uploaded preview, extracted text, and save status. Detailed tracking begins with this release; older counter-only attempts cannot be reconstructed."
      >
        <AdminMobileRecordList
          rows={scans.recentAttempts.map((attempt) => ({
            key: attempt.id,
            title: (
              <Link
                href={`/admin/scans/${attempt.id}`}
                className="underline decoration-violet-300 underline-offset-2 hover:text-violet-700"
              >
                {attempt.title}
              </Link>
            ),
            subtitle: attempt.userName
              ? `${attempt.userName} · ${attempt.userEmail}`
              : attempt.userEmail,
            badge: statusBadge(attempt.status),
            fields: [
              { label: "Category", value: attempt.category },
              { label: "Source", value: attempt.sourceType || "-" },
              { label: "File", value: attempt.fileName || "-", wide: true },
              { label: "Size", value: formatFileSize(attempt.fileSize) },
              { label: "Attempted", value: formatDateTime(attempt.createdAt) },
            ],
          }))}
          emptyTitle="No detailed attempts yet"
          emptyDescription="New OCR attempts will appear here even when the user does not finish saving an event."
        />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-3 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">User</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">File</th>
                <th className="px-3 py-2 font-semibold">Attempted</th>
                <th className="py-2 pl-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.recentAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="max-w-[240px] truncate py-3 pr-3 font-medium text-slate-900">
                    {attempt.title}
                  </td>
                  <td className="max-w-[240px] px-3 py-3 text-slate-700">
                    <span className="block truncate font-medium">
                      {attempt.userName || attempt.userEmail}
                    </span>
                    {attempt.userName ? (
                      <span className="block truncate text-xs text-slate-500">
                        {attempt.userEmail}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{statusBadge(attempt.status)}</td>
                  <td className="px-3 py-3 text-slate-700">{attempt.category}</td>
                  <td className="max-w-[180px] px-3 py-3 text-slate-700">
                    <span className="block truncate">{attempt.fileName || "-"}</span>
                    <span className="block text-xs text-slate-500">
                      {formatFileSize(attempt.fileSize)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                    {formatDateTime(attempt.createdAt)}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <Link
                      href={`/admin/scans/${attempt.id}`}
                      className="inline-flex min-h-11 items-center rounded-md border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                    >
                      View diagnostics
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!scans.recentAttempts.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-800">No detailed attempts yet</p>
              <p className="mt-1 text-sm text-slate-600">
                New OCR attempts will appear here even when no event is saved.
              </p>
            </div>
          ) : null}
        </div>
      </AdminPanel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title="Saved Scan Categories">
          <AdminBarList
            rows={scans.categories.map((category) => ({
              label: category.label,
              value: category.scans,
            }))}
            valueLabel="saved scan categories"
          />
        </AdminPanel>

        <AdminPanel
          title="Recent Saved Scan Events"
          description="Legacy and current event-history rows created from OCR, uploads, or snaps."
        >
          <AdminMobileRecordList
            rows={scans.recentScans.map((scan) => ({
              key: scan.id,
              title: scan.title,
              subtitle: scan.userEmail || "Unknown user",
              fields: [
                { label: "Category", value: scan.category },
                { label: "Source", value: scan.sourceType || "-" },
                { label: "Created via", value: scan.createdVia || "-" },
                { label: "Date", value: formatDate(scan.createdAt) },
              ],
            }))}
            emptyTitle="No saved scans"
            emptyDescription="No saved scan event rows are available."
          />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 font-semibold">Created via</th>
                  <th className="py-2 pl-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.recentScans.map((scan) => (
                  <tr key={scan.id}>
                    <td className="max-w-[260px] truncate py-3 pr-3 font-medium text-slate-900">
                      {scan.title}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-700">
                      {scan.userEmail || "-"}
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
