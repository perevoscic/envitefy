import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import { getAdminAdStudioProviderStatuses } from "@/lib/admin/ad-studio";
import AdStudioClient from "./AdStudioClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminAdStudioPage() {
  const providerStatuses = getAdminAdStudioProviderStatuses();
  const gemini = providerStatuses.find((provider) => provider.id === "geminiText");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Creative"
        title="Ad Studio"
        description="Generate a 10-second Envitefy social ad from event or campaign details, then tune the live phone preview."
        action={
          <AdminStatusBadge tone={gemini?.configured ? "success" : "warning"}>
            {gemini?.configured ? "Gemini ready" : "Gemini key needed"}
          </AdminStatusBadge>
        }
      />
      <AdStudioClient providerStatuses={providerStatuses} />
    </div>
  );
}
