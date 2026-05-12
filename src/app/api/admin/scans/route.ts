import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminScanData } from "@/lib/admin/scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const scans = await getAdminScanData(25);
    return NextResponse.json({ ok: true, scans });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load scan admin data");
  }
}
