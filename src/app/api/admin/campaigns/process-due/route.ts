export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { processDueCampaigns } from "@/lib/admin/email-campaign-send";

function cleanString(value: unknown, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function assertCronOrAdminAuthorized(req: Request, isAdmin: boolean) {
  const secret = cleanString(process.env.ADMIN_EMAIL_CRON_SECRET, 500);
  if (secret) {
    const header = cleanString(req.headers.get("authorization"), 600);
    if (header === `Bearer ${secret}`) return;
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_EMAIL_CRON_SECRET is required to process due campaigns.");
  }

  if (isAdmin) return;
  if (!secret && process.env.NODE_ENV !== "production") return;

  throw new Error("Unauthorized due-campaign dispatch.");
}

/**
 * POST /api/admin/campaigns/process-due
 * Send queued campaigns whose scheduled_at is due.
 * Auth: Bearer ADMIN_EMAIL_CRON_SECRET, or admin session (or open in non-production when secret unset).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let isAdmin = false;
    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email);
      isAdmin = Boolean(user?.is_admin);
    }

    assertCronOrAdminAuthorized(req, isAdmin);

    const body = await req.json().catch(() => ({}));
    const limit =
      typeof body?.limit === "number" && Number.isFinite(body.limit) ? body.limit : undefined;
    const now =
      typeof body?.now === "string" && body.now.trim() ? new Date(body.now) : undefined;

    const result = await processDueCampaigns({
      limit,
      now: now && !Number.isNaN(now.getTime()) ? now : undefined,
      logPrefix: "[campaigns]",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to process due campaigns.";
    const status = /unauthorized/i.test(message) ? 401 : 500;
    console.error("[campaigns] process-due failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
