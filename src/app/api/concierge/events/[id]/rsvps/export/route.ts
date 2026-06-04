import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { buildConciergeV2RsvpCsv } from "@/lib/concierge-v2/rsvp-board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

async function currentUserId() {
  const session: any = await getServerSession(authOptions as any);
  return resolveSessionUserId(session);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertConciergeV2Enabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return new Response("Sign in to export RSVPs.", { status: 401 });
    }
    const exportFile = await buildConciergeV2RsvpCsv({ eventHistoryId: id, userId });
    return new Response(exportFile.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFile.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return new Response(String(error?.message || "Unable to export RSVPs."), {
      status: statusFor(error),
    });
  }
}
