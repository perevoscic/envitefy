import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2RsvpBoard } from "@/lib/concierge-v2/rsvp-board";
import ConciergeV2RsvpBoardClient from "./ConciergeV2RsvpBoardClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2RsvpBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const board = await getConciergeV2RsvpBoard({
    eventHistoryId: id,
    userId,
  });
  return <ConciergeV2RsvpBoardClient eventId={id} initialBoard={board} />;
}
