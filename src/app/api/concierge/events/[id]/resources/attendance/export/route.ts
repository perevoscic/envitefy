import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { exportConciergeV2AttendanceCsv } from "@/lib/concierge-v2/resource-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertResourcesEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) throw new Error("Resource planning is disabled.");
}

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in to export attendance." }, { status: 401 });
    const url = new URL(req.url);
    const exportFile = await exportConciergeV2AttendanceCsv({
      eventHistoryId: id,
      userId,
      occurrenceId: url.searchParams.get("occurrenceId"),
    });
    return new NextResponse(exportFile.csv, {
      headers: {
        "Content-Type": exportFile.contentType,
        "Content-Disposition": `attachment; filename="${exportFile.filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to export attendance.") },
      { status: statusFor(error) },
    );
  }
}
