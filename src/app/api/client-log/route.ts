import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1024;

function payloadTooLargeResponse() {
  return NextResponse.json({ ok: false, error: "Log payload too large" }, { status: 413 });
}

function contentLengthExceedsLimit(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > MAX_BODY_BYTES;
}

async function readTextWithLimit(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  let bytes = 0;
  let text = "";
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

function cleanString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    if (contentLengthExceedsLimit(request)) {
      return payloadTooLargeResponse();
    }
    const raw = await readTextWithLimit(request);
    if (raw === null) return payloadTooLargeResponse();

    const body = JSON.parse(raw || "{}") as Record<string, unknown>;
    const logPayload = {
      area: cleanString(body.area, 80),
      stage: cleanString(body.stage, 120),
      scanAttemptId: cleanString(body.scanAttemptId, 120),
      details: body.details && typeof body.details === "object" ? body.details : null,
      error: body.error && typeof body.error === "object" ? body.error : null,
      environment:
        body.environment && typeof body.environment === "object" ? body.environment : null,
      timestamp: cleanString(body.timestamp, 80),
    };
    console.error("[client-log]", logPayload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[client-log] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
