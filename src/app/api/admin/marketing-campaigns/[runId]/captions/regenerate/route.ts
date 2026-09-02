export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  hydrateMarketingRun,
  persistMarketingRun,
} from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const runDir = await hydrateMarketingRun(runId);
    const campaignRun = await import("../../../../../../../../scripts/lib/campaign-run.mjs");
    const result = await campaignRun.rerunSocialCopyForRun({ runId, runDir });
    await persistMarketingRun(runDir);
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
