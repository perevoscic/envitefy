import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2OperationsSummary } from "@/lib/concierge-v2/operations";
import ConciergeV2OpsClient from "./ConciergeV2OpsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2OpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const summary = await getConciergeV2OperationsSummary({
    eventHistoryId: id,
    userId,
    includePrivate: true,
  });
  return <ConciergeV2OpsClient eventId={id} initialSummary={summary} />;
}
