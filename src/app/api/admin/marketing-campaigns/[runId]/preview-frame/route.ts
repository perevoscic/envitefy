export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import path from "node:path";
import { NextResponse } from "next/server";
import { readJsonFile, resolveRunDir } from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const frameNumber = Number.parseInt(new URL(request.url).searchParams.get("frame") || "", 10);
    if (!Number.isFinite(frameNumber) || frameNumber <= 0) {
      return NextResponse.json({ error: "A valid frame number is required" }, { status: 400 });
    }

    const runDir = resolveRunDir(runId);
    const framesManifest = await readJsonFile<any>(path.join(runDir, "frames.json"), null);
    const frame = framesManifest?.frames?.find((item: any) => item?.frameNumber === frameNumber);
    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const compositor = await import("../../../../../../../scripts/lib/caption-compositor.mjs");
    const buffer = await compositor.renderCaptionedFrameBuffer({
      projectRoot: process.cwd(),
      inputPath: path.join(runDir, frame.imageFile),
      caption: frame.caption,
      cameraFormat: framesManifest?.renderSize?.cameraFormat || framesManifest?.sceneSpec?.cameraFormat,
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to preview frame");
  }
}
