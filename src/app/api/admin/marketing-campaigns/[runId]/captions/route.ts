export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
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
    const campaignRun = await import("../../../../../../../scripts/lib/campaign-run.mjs");
    const result = await campaignRun.saveCaptionEditsForRun({ runId, captions });
    return NextResponse.json({
      ok: true,
      frames: result.framesManifest?.frames || [],
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to save captions");
  }
}
