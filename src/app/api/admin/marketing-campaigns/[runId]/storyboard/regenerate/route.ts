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
    const [status, creativeQa] = await Promise.all([
      readJsonFile<any>(path.join(runDir, "status.json"), null),
      readJsonFile<any>(path.join(runDir, "creative-qa.json"), null),
    ]);

    if (["queued", "running", "render-queued", "rendering_video"].includes(status?.state || "")) {
      return NextResponse.json({ error: "This run is already active." }, { status: 409 });
    }

    const hasRewritePlan =
      (Array.isArray(creativeQa?.framesToRewrite) && creativeQa.framesToRewrite.length > 0) ||
      (Array.isArray(creativeQa?.framesToCut) && creativeQa.framesToCut.length > 0) ||
      Boolean(typeof creativeQa?.rewriteBrief === "string" && creativeQa.rewriteBrief.trim()) ||
      Boolean(status?.state === "awaiting_storyboard_review" && status?.stages?.coordinator?.error);
    if (!hasRewritePlan) {
      return NextResponse.json(
        { error: "Storyboard budget or Creative QA feedback is required before regenerating." },
        { status: 400 },
      );
    }

    if (status) {
      status.state = "running";
      status.currentStage = "coordinator";
      status.message = "Queued storyboard rewrite from Creative QA";
      status.error = null;
      status.frameCounts = {
        total: 0,
        pending: 0,
        generating: 0,
        done: 0,
        error: 0,
      };
      status.stages = status.stages || {};
      for (const stageKey of ["coordinator", "social-copy", "creative-qa", "image-generation", "video"]) {
        status.stages[stageKey] = {
          ...(status.stages[stageKey] || {}),
          status: stageKey === "coordinator" ? "running" : "pending",
          updatedAt: new Date().toISOString(),
          error: null,
        };
      }
      await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
    }

    const pid = spawnBackgroundNodeScript({
      scriptPath: path.join(process.cwd(), "scripts", "regenerate-marketing-storyboard.mjs"),
      args: ["--run-dir", runDir],
      cwd: process.cwd(),
      logFile: path.join(runDir, "storyboard-rerun.log"),
    });

    return NextResponse.json({ ok: true, runId, pid });
  } catch (error) {
    return adminErrorResponse(error, "Failed to regenerate storyboard");
  }
}
