import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { sendBulkEmail } from "@/lib/resend";
import { Pool } from "pg";

interface AudienceFilter {
  plans?: string[]; // ["free", "monthly", "yearly", "FF"]
  minScans?: number | null;
  maxScans?: number | null;
  lastActiveAfter?: string | null; // ISO date
  lastActiveBefore?: string | null; // ISO date
  testEmail?: string | null; // For test sends
}

/**
 * POST /api/admin/campaigns/send
 * Create and send a bulk email campaign
 */
export async function POST(req: NextRequest) {
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

    // Get pool from environment
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
      audienceFilter: AudienceFilter;
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
    let recipients: Array<{ email: string; firstName: string | null; lastName: string | null }>;
    
    if (audienceFilter.testEmail) {
      // Test mode: send to single test email
      recipients = [{
        email: audienceFilter.testEmail,
        firstName: "Test",
        lastName: "User",
      }];
    } else {
      // Build SQL query to find recipients based on audience filter
      let whereConditions: string[] = ["email IS NOT NULL"];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (audienceFilter.plans && audienceFilter.plans.length > 0) {
        whereConditions.push(`subscription_plan = ANY($${paramIndex})`);
        queryParams.push(audienceFilter.plans);
        paramIndex++;
      }

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

      const recipientsResult = await pool.query(recipientsQuery, queryParams);
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

    // Create campaign record (skip for test sends)
    let campaignId: string | null = null;
    const isTestMode = !!audienceFilter.testEmail;

    if (!isTestMode) {
      const campaignResult = await pool.query(
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
          JSON.stringify(audienceFilter),
          recipients.length,
        ]
      );

      campaignId = campaignResult.rows[0].id;
    }

    // Send emails
    console.log(
      `[campaigns] ${isTestMode ? "Sending test email" : `Sending campaign ${campaignId}`} to ${recipients.length} recipient(s)...`
    );

    const result = await sendBulkEmail({
      subject,
      body: emailBody,
      fromEmail,
      recipients,
      buttonText,
      buttonUrl,
    });

    // Update campaign with results (skip for test sends)
    if (!isTestMode && campaignId) {
      const finalStatus =
        result.failed === 0
          ? "sent"
          : result.sent === 0
          ? "failed"
          : "sent"; // partial success still counts as sent

      await pool.query(
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
    } else {
      console.log(
        `[campaigns] Test email completed: ${result.sent} sent, ${result.failed} failed`
      );
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaignId || "test",
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      isTest: isTestMode,
    });
  } catch (error: any) {
    console.error("[campaigns] Send failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send campaign" },
      { status: 500 }
    );
  }
}

