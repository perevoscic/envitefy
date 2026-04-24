export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, query } from "@/lib/db";
import {
  buildStoredCampaignAudienceFilter,
  type CampaignAudienceFilter,
  isIndividualCampaignAudience,
} from "@/lib/admin/email-campaigns";
import { sendBulkEmail } from "@/lib/resend";

/**
 * POST /api/admin/campaigns/send-raw
 *
 * Sends a campaign where the full HTML document is provided by the caller.
 * No header/footer/button wrapping is applied — the HTML is sent exactly as
 * authored in the admin HTML editor. Still supports {{greeting}},
 * {{firstName}} and {{lastName}} substitution per recipient.
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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const adminUserId = user.id;

    const body = await req.json();
    const {
      subject,
      html,
      fromEmail,
      audienceFilter,
    }: {
      subject: string;
      html: string;
      fromEmail?: string;
      audienceFilter: CampaignAudienceFilter;
    } = body;

    if (!subject || !html) {
      return NextResponse.json(
        { error: "Subject and html are required" },
        { status: 400 },
      );
    }

    let recipients: Array<{
      email: string;
      firstName: string | null;
      lastName: string | null;
    }>;

    if (audienceFilter?.testEmail) {
      const emails = audienceFilter.testEmail
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.includes("@"));

      recipients = emails.map((email) => ({
        email,
        firstName: null,
        lastName: null,
      }));

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "No valid email addresses provided" },
          { status: 400 },
        );
      }
    } else {
      const whereConditions: string[] = ["email IS NOT NULL"];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (
        typeof audienceFilter?.minScans === "number" &&
        audienceFilter.minScans > 0
      ) {
        whereConditions.push(`scans_total >= $${paramIndex}`);
        queryParams.push(audienceFilter.minScans);
        paramIndex++;
      }
      if (
        typeof audienceFilter?.maxScans === "number" &&
        audienceFilter.maxScans > 0
      ) {
        whereConditions.push(`scans_total <= $${paramIndex}`);
        queryParams.push(audienceFilter.maxScans);
        paramIndex++;
      }
      if (audienceFilter?.lastActiveAfter) {
        whereConditions.push(`last_active_at >= $${paramIndex}`);
        queryParams.push(audienceFilter.lastActiveAfter);
        paramIndex++;
      }
      if (audienceFilter?.lastActiveBefore) {
        whereConditions.push(`last_active_at <= $${paramIndex}`);
        queryParams.push(audienceFilter.lastActiveBefore);
        paramIndex++;
      }

      const recipientsResult = await query(
        `
        SELECT id, email, first_name, last_name
        FROM users
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY created_at DESC
      `,
        queryParams,
      );
      recipients = recipientsResult.rows.map((row: any) => ({
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
      }));

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "No recipients match the selected audience" },
          { status: 400 },
        );
      }
    }

    const isTestMode = isIndividualCampaignAudience(audienceFilter);
    const campaignResult = await query(
      `
      INSERT INTO email_campaigns (
        created_by_user_id,
        subject,
        body_html,
        from_email,
        audience_filter,
        recipient_count,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'sending')
      RETURNING id
    `,
      [
        adminUserId,
        subject,
        html,
        fromEmail || null,
        JSON.stringify(
          buildStoredCampaignAudienceFilter(audienceFilter, recipients.length, {
            rawHtml: true,
          }),
        ),
        recipients.length,
      ],
    );
    campaignId = campaignResult.rows[0].id;

    console.log(
      `[campaigns-raw] ${isTestMode ? `Sending to ${recipients.length} individual recipient(s)` : `Sending campaign ${campaignId} to ${recipients.length} recipient(s)`}...`,
    );

    const result = await sendBulkEmail({
      subject,
      body: html,
      fromEmail,
      recipients,
      rawHtml: true,
    });

    if (campaignId) {
      const finalStatus =
        result.failed === 0 ? "sent" : result.sent === 0 ? "failed" : "sent";
      await query(
        `
        UPDATE email_campaigns
        SET
          status = $1,
          sent_count = $2,
          failed_count = $3,
          error_message = $4,
          sent_at = now()
        WHERE id = $5
      `,
        [
          finalStatus,
          result.sent,
          result.failed,
          result.errors.length > 0
            ? JSON.stringify(result.errors.slice(0, 10))
            : null,
          campaignId,
        ],
      );
    }

    return NextResponse.json({
      ok: true,
      campaignId,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      isTest: isTestMode,
    });
  } catch (error: any) {
    if (campaignId) {
      try {
        await query(
          `
          UPDATE email_campaigns
          SET
            status = 'failed',
            error_message = $1,
            sent_at = now()
          WHERE id = $2
        `,
          [error?.message || "Failed to send campaign", campaignId],
        );
      } catch (updateError) {
        console.error(
          "[campaigns-raw] Failed to mark campaign as failed:",
          updateError,
        );
      }
    }

    console.error("[campaigns-raw] Send failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send campaign" },
      { status: 500 },
    );
  }
}
