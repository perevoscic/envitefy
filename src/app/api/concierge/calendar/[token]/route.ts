import { buildConciergeV2CalendarIcsByToken } from "@/lib/concierge-v2/calendar";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError ? error.status : 500;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const feed = await buildConciergeV2CalendarIcsByToken(token);
    return new Response(feed.ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${feed.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return new Response(String(error?.message || "Calendar feed not found."), {
      status: statusFor(error),
    });
  }
}
