import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2CalendarCenter } from "@/lib/concierge-v2/calendar";
import ConciergeV2CalendarCenterClient from "./ConciergeV2CalendarCenterClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2CalendarCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const calendar = await getConciergeV2CalendarCenter({
    eventHistoryId: id,
    userId,
  });
  return <ConciergeV2CalendarCenterClient eventId={id} initialCalendar={calendar} />;
}
