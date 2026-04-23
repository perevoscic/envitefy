export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { readMarketingRunDetail } from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const detail = await readMarketingRunDetail(runId);
    if (!detail.request && !detail.status) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...detail });
  } catch (error) {
    return adminErrorResponse(error, "Failed to fetch marketing campaign run");
  }
}
