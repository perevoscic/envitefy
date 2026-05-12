import { AdminPageHeader, AdminPanel, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import { getAdminGa4Status } from "@/lib/admin/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const ga4 = getAdminGa4Status();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Read-only v1 configuration checks for admin operations."
      />

      <AdminPanel
        title="Measurement"
        description="Server-side GA4 reporting configuration."
        action={
          <AdminStatusBadge tone={ga4.connected ? "success" : "warning"}>
            {ga4.connected ? "Ready" : "Needs setup"}
          </AdminStatusBadge>
        }
      >
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              GOOGLE_ANALYTICS_PROPERTY_ID
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {ga4.propertyIdConfigured
                ? ga4.propertyIdFormatValid
                  ? "Configured"
                  : "Configured but not numeric"
                : "Missing"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Google credentials
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {ga4.credentialsValid
                ? `Configured via ${ga4.credentialsSource}`
                : ga4.credentialsConfigured
                  ? "Configured but invalid"
                  : "Missing"}
            </dd>
          </div>
        </dl>
        {ga4.configurationError ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {ga4.configurationError}
          </p>
        ) : null}
      </AdminPanel>
    </div>
  );
}
