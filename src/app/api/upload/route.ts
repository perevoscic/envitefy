import { NextResponse } from "next/server";
import { processPublicUpload } from "@/lib/media-upload";
import { isUploadUsage } from "@/lib/upload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let scanAttemptId: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const usageRaw = String(formData.get("usage") || "").trim().toLowerCase();
    const eventId = String(formData.get("eventId") || "").trim() || null;
    const uploadToken = String(formData.get("uploadToken") || "").trim() || null;
    scanAttemptId = String(formData.get("scanAttemptId") || "").trim() || null;

    if (!(file instanceof File)) {
      return badRequest("Missing file");
    }
    if (!isUploadUsage(usageRaw)) {
      return badRequest('Invalid usage. Expected "attachment" or "header".');
    }

    const response = await processPublicUpload({
      file,
      usage: usageRaw,
      eventId,
      uploadToken,
      scanAttemptId,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status =
      error && typeof error === "object" && "status" in error && Number.isFinite((error as any).status)
        ? Number((error as any).status)
        : 500;

    if (status >= 500) {
      console.error("[api/upload] failed", {
        status,
        message,
        scanAttemptId,
      });
    }

    return badRequest(message, status);
  }
}
