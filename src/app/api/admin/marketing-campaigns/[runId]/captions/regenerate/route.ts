export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const campaignRun = await import("../../../../../../../../scripts/lib/campaign-run.mjs");
    const result = await campaignRun.rerunSocialCopyForRun({ runId });
    return NextResponse.json({
      ok: true,
      socialCopy: result.socialCopy,
      frames: result.framesManifest?.frames || [],
      status: result.status,
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to regenerate captions");
  }
}
