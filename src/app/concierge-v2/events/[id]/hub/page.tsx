import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2TeamClassHub } from "@/lib/concierge-v2/team-class-hub";
import ConciergeV2TeamClassHubClient from "./ConciergeV2TeamClassHubClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2TeamClassHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_TEAM_CLASS_HUB")) redirect("/");
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const hub = await getConciergeV2TeamClassHub({ eventHistoryId: id, userId });
  return <ConciergeV2TeamClassHubClient eventId={id} initialHub={hub} />;
}
