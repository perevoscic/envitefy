import { timingSafeEqual } from "node:crypto";
import { processScanDiagnosticJobs } from "@/lib/scan-diagnostic-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Worker authentication is not configured" }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await processScanDiagnosticJobs(5), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
