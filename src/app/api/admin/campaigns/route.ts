export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, query } from "@/lib/db";

/**
 * GET /api/admin/campaigns
 * List all email campaigns (admin only)
 */
export async function GET(req: NextRequest) {
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

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // optional: filter by status
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let whereClause = "";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Fetch campaigns with creator info
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

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM email_campaigns ${whereClause}`;
    const countResult = await query(
      countQuery,
      whereClause ? [status] : []
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const campaigns = campaignsResult.rows.map((row: any) => ({
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
    });
  } catch (error: any) {
    console.error("[campaigns] Fetch failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

