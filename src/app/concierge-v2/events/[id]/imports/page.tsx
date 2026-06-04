import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2ImportCenter } from "@/lib/concierge-v2/source-imports";
import ConciergeV2ImportCenterClient from "./ConciergeV2ImportCenterClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConciergeV2ImportCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_OCR_IMPORTS")) redirect("/");
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/");
  const { id } = await params;
  const imports = await getConciergeV2ImportCenter({
    eventHistoryId: id,
    userId,
  });
  return <ConciergeV2ImportCenterClient eventId={id} initialImports={imports} />;
}
