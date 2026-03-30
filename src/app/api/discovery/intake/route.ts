import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { intakeGymnasticsDiscovery } from "@/lib/discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await intakeGymnasticsDiscovery({ request, userId });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      eventId: result.eventId,
      discoveryId: result.discoveryId,
      workflow: result.workflow,
      processingStage: result.processingStage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      Number.isFinite((error as any).status)
        ? Number((error as any).status)
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
