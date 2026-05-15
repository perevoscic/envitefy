import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { insertEventHistory } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { processPublicUpload } from "@/lib/media-upload";
import { normalizeOcrLocationFields } from "@/lib/ocr/field-normalization";
import { handleOcrRequest } from "@/lib/ocr/pipeline";
import { enrichOcrVenueAddress } from "@/lib/ocr/place-enrichment";
import {
  buildScanEventPageHistoryPayload,
  type ScanEventPageOcrResult,
  type ScanEventPageSource,
} from "@/lib/scan-event-page";
import { buildEventPath } from "@/utils/event-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function normalizeScanSource(value: FormDataEntryValue | null): ScanEventPageSource {
  return String(value || "").trim().toLowerCase() === "camera" ? "camera" : "upload";
}

function normalizeScanAttemptId(value: FormDataEntryValue | null): string | null {
  const raw = String(value || "").trim();
  return raw ? raw.slice(0, 120) : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function buildOcrLocationContext(ocr: ScanEventPageOcrResult): {
  fieldsGuess: Record<string, unknown>;
  context: string;
} {
  const fieldsGuess = asRecord(ocr.fieldsGuess);
  const context = [
    typeof ocr.ocrText === "string" ? ocr.ocrText : "",
    fieldsGuess.title,
    fieldsGuess.description,
    fieldsGuess.location,
    fieldsGuess.address,
    fieldsGuess.venue,
    fieldsGuess.venueName,
  ]
    .map(cleanString)
    .filter(Boolean)
    .join("\n");
  return { fieldsGuess, context };
}

async function runScanOcr(params: {
  requestUrl: string;
  file: File;
  scanAttemptId: string | null;
}): Promise<{ ok: true; payload: ScanEventPageOcrResult } | { ok: false; response: NextResponse }> {
  const ocrUrl = new URL(params.requestUrl);
  ocrUrl.pathname = "/api/ocr";
  ocrUrl.searchParams.set("fast", "0");

  const formData = new FormData();
  formData.set("file", params.file);
  if (params.scanAttemptId) formData.set("scanAttemptId", params.scanAttemptId);

  const response = await handleOcrRequest(
    new Request(ocrUrl.toString(), {
      method: "POST",
      body: formData,
    }),
  );
  const payload = (await response.json().catch(() => null)) as ScanEventPageOcrResult | null;
  if (!response.ok || !payload) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error:
            (payload as { error?: string; detail?: string } | null)?.error ||
            (payload as { error?: string; detail?: string } | null)?.detail ||
            "OCR route failed",
        },
        { status: response.status || 500 },
      ),
    };
  }
  return { ok: true, payload };
}

export async function POST(request: Request) {
  let scanAttemptId: string | null = null;
  try {
    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    const userId = await resolveSessionUserId(session);
    if (sessionUser && !userId) {
      return jsonError("Unable to resolve signed-in account", 409);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    scanAttemptId = normalizeScanAttemptId(formData.get("scanAttemptId"));
    const source = normalizeScanSource(formData.get("source"));

    if (!(file instanceof File)) {
      return jsonError("Missing file");
    }

    const ocr = await runScanOcr({ requestUrl: request.url, file, scanAttemptId });
    if (!ocr.ok) return ocr.response;
    const { fieldsGuess, context: locationContext } = buildOcrLocationContext(ocr.payload);
    const normalizedLocation = normalizeOcrLocationFields({
      venue: fieldsGuess.venue,
      venueName: fieldsGuess.venueName,
      location: fieldsGuess.location,
      address: fieldsGuess.address,
      context: locationContext,
    });
    const locationEnrichment = await enrichOcrVenueAddress({
      venue: normalizedLocation.venue,
      location: normalizedLocation.location,
      context: locationContext,
    });

    const media = await processPublicUpload({
      file,
      usage: "attachment",
      scanAttemptId,
    });

    const payload = buildScanEventPageHistoryPayload({
      ocr: ocr.payload,
      media,
      scanAttemptId,
      source,
      locationEnrichment,
    });
    const row = await insertEventHistory({
      userId: userId || null,
      title: payload.title,
      data: payload.data,
    });

    if (userId) {
      invalidateUserHistory(userId);
      invalidateUserDashboard(userId);
    }

    const eventPath = buildEventPath(row.id, row.title, { created: true }, row.public_slug);
    return NextResponse.json({
      ok: true,
      eventId: row.id,
      title: row.title,
      publicSlug: row.public_slug,
      eventPath,
      ownership: payload.ownership,
      data: row.data,
    });
  } catch (error) {
    console.error("[scan-event-page] failed", {
      scanAttemptId,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonError(
      error instanceof Error && error.message.trim()
        ? error.message
        : "Unable to create event page from scan",
      500,
    );
  }
}
