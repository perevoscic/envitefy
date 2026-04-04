import { corsPreflight } from "@/lib/cors";
import { handleOcrRequest } from "@/lib/ocr/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  return handleOcrRequest(request);
}
