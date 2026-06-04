import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { parseConciergeInputWithProvider } from "@/lib/concierge-v2/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 12000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function POST(req: Request) {
  try {
    assertConciergeV2Enabled();
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to use Concierge V2." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const inputText = cleanString(body?.message || body?.inputText || body?.text);
    if (!inputText) {
      return NextResponse.json({ ok: false, error: "Tell Envitefy what is happening." }, { status: 400 });
    }

    const parsed = await parseConciergeInputWithProvider(inputText, {
      sourceKind: cleanString(body?.sourceKind, 80) || "text",
      referenceDate: cleanString(body?.referenceDate, 80) || undefined,
      timezone: cleanString(body?.timezone, 80) || undefined,
    });
    return NextResponse.json({
      ok: true,
      draft: parsed.draft,
      provider: {
        provider: parsed.provider,
        model: parsed.model,
        fallbackUsed: parsed.fallbackUsed,
        errorMessage: parsed.errorMessage || null,
      },
    });
  } catch (error: any) {
    const status = /disabled/i.test(String(error?.message || "")) ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Concierge V2 parse failed.") },
      { status },
    );
  }
}
