import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  createConciergeV2Session,
  listConciergeV2Sessions,
} from "@/lib/concierge-v2/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 12000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

async function requireUser() {
  const session: any = await getServerSession(authOptions as any);
  return resolveSessionUserId(session);
}

export async function GET() {
  try {
    assertConciergeV2Enabled();
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to use Concierge V2." }, { status: 401 });
    }
    const sessions = await listConciergeV2Sessions({ userId, limit: 10 });
    return NextResponse.json({ ok: true, sessions });
  } catch (error: any) {
    const status = /disabled/i.test(String(error?.message || "")) ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load Concierge V2 sessions.") },
      { status },
    );
  }
}

export async function POST(req: Request) {
  try {
    assertConciergeV2Enabled();
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to use Concierge V2." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const inputText = cleanString(body?.message || body?.inputText || body?.text);
    if (!inputText) {
      return NextResponse.json({ ok: false, error: "Tell Envitefy what is happening." }, { status: 400 });
    }
    const session = await createConciergeV2Session({
      userId,
      inputText,
      sourceKind: cleanString(body?.sourceKind, 80) || "text",
      draft: body?.draft && typeof body.draft === "object" ? body.draft : null,
      referenceDate: cleanString(body?.referenceDate, 80) || null,
    });
    return NextResponse.json({ ok: true, session, draft: session.normalized_output_json });
  } catch (error: any) {
    const status = /disabled/i.test(String(error?.message || "")) ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to create Concierge V2 session.") },
      { status },
    );
  }
}
