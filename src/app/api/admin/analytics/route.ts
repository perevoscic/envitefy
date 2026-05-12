import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminAnalyticsSnapshot } from "@/lib/admin/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const analytics = await getAdminAnalyticsSnapshot();
    return NextResponse.json({ ok: true, analytics });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load analytics admin data");
  }
}
