export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import type { CampaignAudienceFilter } from "@/lib/admin/email-campaigns";
import { isFullHtmlDocument } from "@/lib/admin/email-campaigns";
import {
  CampaignSendError,
  cancelCampaign,
  scheduleCampaign,
  upsertCampaignDraft,
} from "@/lib/admin/email-campaign-send";

async function requireAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new CampaignSendError(401, "Unauthorized");
  }
  const user = await getUserByEmail(session.user.email);
  if (!user || !user.is_admin) {
    throw new CampaignSendError(403, "Admin access required");
  }
  return user;
}

/**
 * PATCH /api/admin/campaigns/[id]
 * Update draft content, schedule send, or cancel.
 *
 * Body.action:
 * - "save" | omitted → update draft fields, status=draft
 * - "schedule" → status=queued + scheduledAt
 * - "cancel" → status=cancelled
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminUser();
    const { id } = await context.params;
    const body = await req.json();
    const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "save";

    if (action === "cancel") {
      const result = await cancelCampaign(id);
      return NextResponse.json({ ok: true, campaignId: result.id, status: result.status });
    }

    if (action === "schedule") {
      const scheduledAtRaw = body.scheduledAt;
      const scheduledAt = new Date(typeof scheduledAtRaw === "string" ? scheduledAtRaw : "");
      const result = await scheduleCampaign({
        campaignId: id,
        scheduledAt,
        subject: body.subject,
        bodyHtml: body.body,
        fromEmail: body.fromEmail,
        audienceFilter: body.audienceFilter as CampaignAudienceFilter | undefined,
        buttonText: body.buttonText,
        buttonUrl: body.buttonUrl,
        rawHtml: typeof body.body === "string" ? isFullHtmlDocument(body.body) : undefined,
      });
      return NextResponse.json({
        ok: true,
        campaignId: result.id,
        status: "queued",
        scheduledAt: result.scheduledAt,
      });
    }

    const result = await upsertCampaignDraft({
      adminUserId: user.id,
      campaignId: id,
      subject: body.subject,
      bodyHtml: body.body,
      fromEmail: body.fromEmail,
      audienceFilter: (body.audienceFilter as CampaignAudienceFilter) || {},
      buttonText: body.buttonText,
      buttonUrl: body.buttonUrl,
      rawHtml: typeof body.body === "string" ? isFullHtmlDocument(body.body) : false,
    });

    return NextResponse.json({ ok: true, campaignId: result.id, status: result.status });
  } catch (error: unknown) {
    if (error instanceof CampaignSendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update campaign";
    console.error("[campaigns] PATCH failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
