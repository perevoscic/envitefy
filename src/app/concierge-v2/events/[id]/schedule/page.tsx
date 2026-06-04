import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2ScheduleHub } from "@/lib/concierge-v2/schedule";
import ConciergeV2ScheduleHubClient from "./ConciergeV2ScheduleHubClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2ScheduleHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_SCHEDULE_HUB")) redirect("/");
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const schedule = await getConciergeV2ScheduleHub({
    eventHistoryId: id,
    userId,
  });
  return <ConciergeV2ScheduleHubClient eventId={id} initialSchedule={schedule} />;
}
