import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminOverviewData } from "@/lib/admin/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const overview = await getAdminOverviewData();
    return NextResponse.json({ ok: true, overview });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load admin overview");
  }
}
