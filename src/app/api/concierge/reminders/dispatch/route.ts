import { NextResponse } from "next/server";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { dispatchDueConciergeV2Reminders } from "@/lib/concierge-v2/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function assertAuthorized(req: Request) {
  const secret = cleanString(process.env.CONCIERGE_V2_CRON_SECRET, 500);
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CONCIERGE_V2_CRON_SECRET is required to dispatch reminders.");
    }
    return;
  }
  const header = cleanString(req.headers.get("authorization"), 600);
  if (header !== `Bearer ${secret}`) throw new Error("Unauthorized reminder dispatch.");
}

export async function POST(req: Request) {
  try {
    assertConciergeV2Enabled();
    if (!isConciergeV2FlagEnabled("ENABLE_REMINDER_ENGINE")) {
      throw new Error("Reminder engine is disabled.");
    }
    assertAuthorized(req);
    const body = await req.json().catch(() => ({}));
    const result = await dispatchDueConciergeV2Reminders({
      dryRun: body?.dryRun !== false,
      limit: body?.limit,
      now: cleanString(body?.now, 100) || undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    const message = String(error?.message || "Unable to dispatch reminders.");
    const status = /unauthorized/i.test(message) ? 401 : /disabled/i.test(message) ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
