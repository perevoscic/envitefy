import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2ResourcePlanningCenter } from "@/lib/concierge-v2/resource-planning";
import ConciergeV2ResourcesClient from "./ConciergeV2ResourcesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2ResourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) redirect("/");
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
  return <ConciergeV2ResourcesClient eventId={id} initialResources={resources} />;
}
