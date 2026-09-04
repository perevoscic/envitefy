export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  hydrateMarketingRun,
  persistMarketingRun,
  syncMarketingCopyDeskForRun,
} from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const body = await request.json();
    const captions = Array.isArray(body?.captions) ? body.captions : [];
    const runDir = await hydrateMarketingRun(runId);
    const campaignRun = await import("../../../../../../../scripts/lib/campaign-run.mjs");
    const result = await campaignRun.saveCaptionEditsForRun({ runId, runDir, captions });
    const copyDesk = await syncMarketingCopyDeskForRun(runDir);
    await persistMarketingRun(runDir);
    return NextResponse.json({
      ok: true,
      frames: result.framesManifest?.frames || [],
      copyDesk,
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to save captions");
  }
}
