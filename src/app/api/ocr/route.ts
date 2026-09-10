import { corsPreflight } from "@/lib/cors";
import { handleOcrRequest } from "@/lib/ocr/pipeline";
import { after } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const response = await handleOcrRequest(request);
  if (response.ok) {
    after(async () => {
      try {
        const { processScanDiagnosticJobs } = await import("@/lib/scan-diagnostic-worker");
        await processScanDiagnosticJobs();
      } catch {
        console.error("[scan-diagnostics] background processing deferred to retry worker");
      }
    });
  }
  return response;
}
