import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminConciergeData } from "@/lib/admin/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const concierge = await getAdminConciergeData();
    return NextResponse.json({ ok: true, concierge });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load AI Concierge admin data");
  }
}
