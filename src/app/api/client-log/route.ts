import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1024;

function cleanString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "Log payload too large" }, { status: 413 });
    }
    const body = JSON.parse(raw || "{}") as Record<string, unknown>;
    const logPayload = {
      area: cleanString(body.area, 80),
      stage: cleanString(body.stage, 120),
      scanAttemptId: cleanString(body.scanAttemptId, 120),
      details: body.details && typeof body.details === "object" ? body.details : null,
      error: body.error && typeof body.error === "object" ? body.error : null,
      environment: body.environment && typeof body.environment === "object" ? body.environment : null,
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
