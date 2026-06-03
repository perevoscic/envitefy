export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, query } from "@/lib/db";
import {
  buildIndividualCampaignRecipients,
  buildStoredCampaignAudienceFilter,
  type CampaignEmailRecipient,
  type CampaignRecipientNameRow,
  type CampaignAudienceFilter,
  isIndividualCampaignAudience,
  parseIndividualCampaignEmails,
} from "@/lib/admin/email-campaigns";
import { sendBulkEmail } from "@/lib/resend";

function isFullHtmlDocument(value: string): boolean {
  const html = value.trim().toLowerCase();
  return (
    html.startsWith("<!doctype html") ||
    html.includes("<html") ||
    html.includes("<body")
  );
}

/**
 * POST /api/admin/campaigns/send
 * Create and send a bulk email campaign
 */
export async function POST(req: NextRequest) {
  let campaignId: string | null = null;

  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const adminUserId = user.id;

    // Parse request body
    const body = await req.json();
    const {
      subject,
      body: emailBody,
      fromEmail,
      audienceFilter,
      buttonText,
      buttonUrl,
    }: {
      subject: string;
      body: string;
      fromEmail?: string;
      audienceFilter: CampaignAudienceFilter;
      buttonText?: string;
      buttonUrl?: string;
    } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Handle test mode
    let recipients: CampaignEmailRecipient[];
    
    if (audienceFilter.testEmail) {
      // Individual recipients mode: send to specified email addresses (comma-separated)
      const emails = parseIndividualCampaignEmails(audienceFilter.testEmail);

      if (emails.length === 0) {
        return NextResponse.json(
          { error: "No valid email addresses provided" },
          { status: 400 }
        );
      }

      const usersResult = await query<CampaignRecipientNameRow>(
        `
        SELECT email, first_name, last_name
        FROM users
        WHERE lower(email) = ANY($1::text[])
      `,
        [emails.map((email) => email.toLowerCase())],
      );

      recipients = buildIndividualCampaignRecipients(emails, usersResult.rows);
    } else {
      // Build SQL query to find recipients based on audience filter
      const whereConditions: string[] = ["email IS NOT NULL"];
      const queryParams: any[] = [];
      let paramIndex = 1;

    if (
      typeof audienceFilter.minScans === "number" &&
      audienceFilter.minScans > 0
    ) {
      whereConditions.push(`scans_total >= $${paramIndex}`);
      queryParams.push(audienceFilter.minScans);
      paramIndex++;
    }

      if (
        typeof audienceFilter.maxScans === "number" &&
        audienceFilter.maxScans > 0
      ) {
        whereConditions.push(`scans_total <= $${paramIndex}`);
        queryParams.push(audienceFilter.maxScans);
        paramIndex++;
      }

      if (audienceFilter.lastActiveAfter) {
        whereConditions.push(`last_active_at >= $${paramIndex}`);
        queryParams.push(audienceFilter.lastActiveAfter);
        paramIndex++;
      }

      if (audienceFilter.lastActiveBefore) {
        whereConditions.push(`last_active_at <= $${paramIndex}`);
        queryParams.push(audienceFilter.lastActiveBefore);
        paramIndex++;
      }

      const recipientsQuery = `
        SELECT id, email, first_name, last_name
        FROM users
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY created_at DESC
      `;

      const recipientsResult = await query(recipientsQuery, queryParams);
      recipients = recipientsResult.rows.map((row: any) => ({
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
      }));

      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "No recipients match the selected audience" },
          { status: 400 }
        );
      }
    }

    // Persist every send so the admin history reflects individual and bulk sends.
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
        emailBody,
        fromEmail || null,
        JSON.stringify(
          buildStoredCampaignAudienceFilter(audienceFilter, recipients.length),
        ),
        recipients.length,
      ]
    );

    campaignId = campaignResult.rows[0].id;

    // Send emails
    console.log(
      `[campaigns] ${isTestMode ? `Sending to ${recipients.length} individual recipient(s)` : `Sending campaign ${campaignId} to ${recipients.length} recipient(s)`}...`
    );

    const result = await sendBulkEmail({
      subject,
      body: emailBody,
      fromEmail,
      recipients,
      buttonText,
      buttonUrl,
      rawHtml: isFullHtmlDocument(emailBody),
    });

    // Update the stored campaign with send results.
    if (campaignId) {
      const finalStatus =
        result.failed === 0
          ? "sent"
          : result.sent === 0
          ? "failed"
          : "sent"; // partial success still counts as sent

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
            : null, // Store first 10 errors
          campaignId,
        ]
      );

      console.log(
        `[campaigns] Campaign ${campaignId} completed: ${result.sent} sent, ${result.failed} failed`
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
          [error?.message || "Failed to send campaign", campaignId]
        );
      } catch (updateError) {
        console.error("[campaigns] Failed to mark campaign as failed:", updateError);
      }
    }

    console.error("[campaigns] Send failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send campaign" },
      { status: 500 }
    );
  }
}
