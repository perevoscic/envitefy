import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import { getAdminAdStudioProviderStatuses } from "@/lib/admin/ad-studio";
import AdStudioClient from "./AdStudioClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminAdStudioPage() {
  const providerStatuses = getAdminAdStudioProviderStatuses();
  const textProvider = providerStatuses.find((provider) => provider.id === "openaiText");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Creative Production"
        title="Envitefy Ad Hub"
        description="Generate short promo video campaigns from one instruction: strategy, script, deterministic assets, base frames, compositing, QA, Veo prompts, and export packages."
        action={
          <AdminStatusBadge tone={textProvider?.configured ? "success" : "warning"}>
            {textProvider?.configured ? "OpenAI ready" : "OpenAI key needed"}
          </AdminStatusBadge>
        }
      />
      <AdStudioClient providerStatuses={providerStatuses} />
    </div>
  );
}
