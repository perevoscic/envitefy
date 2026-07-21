export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import type { CampaignAudienceFilter } from "@/lib/admin/email-campaigns";
import { CampaignSendError, sendCampaignNow } from "@/lib/admin/email-campaign-send";

/**
 * POST /api/admin/campaigns/send-raw
 *
 * Sends a campaign where the full HTML document is provided by the caller.
 * No header/footer/button wrapping is applied — the HTML is sent exactly as
 * authored in the admin HTML editor. Still supports {{greeting}},
 * {{firstName}} and {{lastName}} substitution per recipient.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      campaignId: existingId,
      subject,
      html,
      fromEmail,
      audienceFilter,
    }: {
      campaignId?: string;
      subject: string;
      html: string;
      fromEmail?: string;
      audienceFilter: CampaignAudienceFilter;
    } = body;

    if (!subject || !html) {
      return NextResponse.json({ error: "Subject and html are required" }, { status: 400 });
    }

    const result = await sendCampaignNow({
      adminUserId: user.id,
      campaignId: existingId || null,
      subject,
      bodyHtml: html,
      fromEmail,
      audienceFilter: audienceFilter || {},
      rawHtml: true,
      logPrefix: "[campaigns-raw]",
    });

    return NextResponse.json({
      ok: true,
      campaignId: result.campaignId,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      isTest: result.isTest,
    });
  } catch (error: unknown) {
    if (error instanceof CampaignSendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to send campaign";
    console.error("[campaigns-raw] Send failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
