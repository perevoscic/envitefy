export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, query } from "@/lib/db";
import type { CampaignAudienceFilter } from "@/lib/admin/email-campaigns";
import { isFullHtmlDocument } from "@/lib/admin/email-campaigns";
import {
  CampaignSendError,
  processDueCampaigns,
  upsertCampaignDraft,
} from "@/lib/admin/email-campaign-send";

/**
 * GET /api/admin/campaigns
 * List email campaigns (admin only). Optionally process due queued sends first.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const processDue = searchParams.get("processDue") !== "0";

    let dueSummary: Awaited<ReturnType<typeof processDueCampaigns>> | null = null;
    if (processDue) {
      try {
        dueSummary = await processDueCampaigns({ limit: 5, logPrefix: "[campaigns]" });
      } catch (error) {
        console.warn("[campaigns] process-due on list failed", error);
      }
    }

    let whereClause = "";
    const queryParams: Array<string | number> = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex += 1;
    }

    const campaignsQuery = `
      SELECT
        c.id,
        c.subject,
        c.body_html,
        c.from_email,
        c.audience_filter,
        c.recipient_count,
        c.sent_count,
        c.failed_count,
        c.status,
        c.error_message,
        c.scheduled_at,
        c.sent_at,
        c.created_at,
        c.updated_at,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name
      FROM email_campaigns c
      LEFT JOIN users u ON c.created_by_user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const campaignsResult = await query(campaignsQuery, queryParams);
    const countQuery = `SELECT COUNT(*) as total FROM email_campaigns ${whereClause}`;
    const countResult = await query(countQuery, status ? [status] : []);
    const total = parseInt(String(countResult.rows[0].total), 10);

    const campaigns = campaignsResult.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      subject: row.subject,
      bodyHtml: row.body_html,
      fromEmail: row.from_email,
      audienceFilter: row.audience_filter,
      recipientCount: row.recipient_count,
      sentCount: row.sent_count,
      failedCount: row.failed_count,
      status: row.status,
      errorMessage: row.error_message,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: {
        email: row.creator_email,
        firstName: row.creator_first_name,
        lastName: row.creator_last_name,
      },
    }));

    return NextResponse.json({
      ok: true,
      campaigns,
      total,
      limit,
      offset,
      dueProcessed: dueSummary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaigns";
    console.error("[campaigns] Fetch failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/campaigns
 * Create or update a draft campaign (no send).
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
      id,
      subject,
      body: emailBody,
      fromEmail,
      audienceFilter,
      buttonText,
      buttonUrl,
    }: {
      id?: string;
      subject: string;
      body: string;
      fromEmail?: string;
      audienceFilter?: CampaignAudienceFilter;
      buttonText?: string;
      buttonUrl?: string;
    } = body;

    const result = await upsertCampaignDraft({
      adminUserId: user.id,
      campaignId: id || null,
      subject,
      bodyHtml: emailBody,
      fromEmail,
      audienceFilter: audienceFilter || {},
      buttonText,
      buttonUrl,
      rawHtml: typeof emailBody === "string" ? isFullHtmlDocument(emailBody) : false,
    });

    return NextResponse.json({ ok: true, campaignId: result.id, status: result.status });
  } catch (error: unknown) {
    if (error instanceof CampaignSendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to save draft";
    console.error("[campaigns] Save draft failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
