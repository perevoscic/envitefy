import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminEventsData } from "@/lib/admin/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    const events = await getAdminEventsData(25);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return adminErrorResponse(error, "Failed to load admin events");
  }
}
