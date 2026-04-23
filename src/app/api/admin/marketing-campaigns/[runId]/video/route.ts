export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readJsonFile, resolveRunDir } from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { spawnBackgroundNodeScript } from "@/lib/admin/spawn-background";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const runDir = resolveRunDir(runId);
    const status = await readJsonFile<any>(path.join(runDir, "status.json"), null);

    if (status?.stages?.video?.status === "running") {
      return NextResponse.json({ ok: true, runId, alreadyRunning: true }, { status: 202 });
    }

    if (status) {
      status.state = "rendering_video";
      status.currentStage = "video";
      status.message = "Rendering captioned video";
      status.stages = status.stages || {};
      status.stages.video = {
        ...(status.stages.video || {}),
        status: "running",
        updatedAt: new Date().toISOString(),
        error: null,
      };
      await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
    }

    const pid = spawnBackgroundNodeScript({
      scriptPath: path.join(process.cwd(), "scripts", "assemble-storyboard-video.mjs"),
      args: ["--run-dir", runDir],
      cwd: process.cwd(),
      logFile: path.join(runDir, "video.log"),
    });

    return NextResponse.json({ ok: true, runId, pid });
  } catch (error) {
    return adminErrorResponse(error, "Failed to start video render");
  }
}
