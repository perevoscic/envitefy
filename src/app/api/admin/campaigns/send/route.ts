export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import type { CampaignAudienceFilter } from "@/lib/admin/email-campaigns";
import { isFullHtmlDocument } from "@/lib/admin/email-campaigns";
import { CampaignSendError, sendCampaignNow } from "@/lib/admin/email-campaign-send";

/**
 * POST /api/admin/campaigns/send
 * Create and send a bulk email campaign (or send an existing draft/queued row).
 */
export async function POST(req: NextRequest) {
  let campaignId: string | null = null;

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
      body: emailBody,
      fromEmail,
      audienceFilter,
      buttonText,
      buttonUrl,
    }: {
      campaignId?: string;
      subject: string;
      body: string;
      fromEmail?: string;
      audienceFilter: CampaignAudienceFilter;
      buttonText?: string;
      buttonUrl?: string;
    } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    campaignId = existingId || null;

    const result = await sendCampaignNow({
      adminUserId: user.id,
      campaignId,
      subject,
      bodyHtml: emailBody,
      fromEmail,
      audienceFilter: audienceFilter || {},
      buttonText,
      buttonUrl,
      rawHtml: isFullHtmlDocument(emailBody),
      logPrefix: "[campaigns]",
    });

    campaignId = result.campaignId;

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
    console.error("[campaigns] Send failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
