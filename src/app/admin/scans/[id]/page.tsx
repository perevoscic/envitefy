import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AdminPanel, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import { getAdminScanAttemptById } from "@/lib/admin/scans";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordPrivateDataAccess } from "@/lib/private-data-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "long",
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
  return <AdminStatusBadge tone="warning">Processed, not saved</AdminStatusBadge>;
}

export default async function AdminScanAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const { email } = await requireAdminSession();
  const attempt = await getAdminScanAttemptById(id);
  if (!attempt) notFound();
  await recordPrivateDataAccess({
    actorEmail: email,
    action: "view_scan_detail",
    resourceId: id,
    headers: await headers(),
  });

  const fieldsJson = JSON.stringify(attempt.fieldsGuess ?? {}, null, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
            Scan troubleshooting
          </p>
          <h1 className="mt-1 text-wrap break-words text-2xl font-semibold text-slate-950 md:text-3xl">
            {attempt.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Private diagnostic content from {attempt.userEmail}.
          </p>
        </div>
        <Link
          href="/admin/scans"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        >
          Back to scans
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <AdminPanel
          title="Uploaded Preview"
          description="Downscaled private copy retained for admin troubleshooting."
        >
          {attempt.hasPreview ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image
                src={`/api/admin/scan-attempts/${attempt.id}/preview`}
                alt={`Uploaded scan preview for ${attempt.title}`}
                width={1400}
                height={1400}
                unoptimized
                className="mx-auto h-auto max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">No preview retained</p>
              <p className="mt-1 text-sm text-slate-600">
                Extraction metadata may still be available below.
              </p>
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Attempt Details">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Status
              </dt>
              <dd className="mt-1">{statusBadge(attempt.status)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                User
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                {attempt.userName ? `${attempt.userName} · ` : ""}
                {attempt.userEmail}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Attempt ID
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                {attempt.scanAttemptId}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Attempted
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(attempt.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Saved
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(attempt.savedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Category
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{attempt.category}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                OCR source
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {attempt.ocrSource || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                File
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                {attempt.fileName || "-"}
              </dd>
              <dd className="mt-0.5 text-xs text-slate-500">
                {[attempt.mimeType, formatFileSize(attempt.fileSize)].filter((value) => value !== "-").join(" · ") || "-"}
              </dd>
            </div>
            {attempt.eventId ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Saved event
                </dt>
                <dd className="mt-1">
                  <Link
                    href={`/event/${attempt.eventId}`}
                    target="_blank"
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
                  >
                    Open event
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Extracted Text"
        description="OCR output retained for troubleshooting extraction and classification."
      >
        {attempt.ocrText ? (
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            {attempt.ocrText}
          </pre>
        ) : (
          <p className="text-sm text-slate-600">No extracted text was retained.</p>
        )}
      </AdminPanel>

      <AdminPanel title="Extracted Fields">
        <pre className="max-h-[40rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {fieldsJson}
        </pre>
      </AdminPanel>
    </div>
  );
}
