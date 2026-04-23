export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { listMarketingRuns } from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { spawnBackgroundNodeScript } from "@/lib/admin/spawn-background";

async function readRunArtifact(runDir: string, fileName: string) {
  try {
    const raw = await fs.readFile(path.join(runDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await requireAdminSession();
    const runs = await listMarketingRuns();
    return NextResponse.json({
      ok: true,
      runs: runs.map((entry) => ({
        runId: entry.runId,
        runDir: entry.runDir,
        status: entry.status,
        request: entry.request,
      })),
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to list marketing campaigns");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const campaignRun = await import("../../../../../scripts/lib/campaign-run.mjs");
    const input = campaignRun.normalizeCampaignInput(body);
    if (!input.criteria && !input.looseInput?.rawPrompt) {
      return NextResponse.json({ error: "Campaign criteria is required" }, { status: 400 });
    }

    const runPaths = campaignRun.resolveRunPaths(process.cwd(), {
      outputRoot: input.outputRoot,
      jobLabel: input.jobLabel || input.productName || "marketing-campaign",
      rawPrompt: input.criteria || input.looseInput?.rawPrompt,
    });

    await fs.mkdir(runPaths.runDir, { recursive: true });
    await fs.writeFile(
      runPaths.requestPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), input }, null, 2)}\n`,
      "utf8",
    );
    await fs.writeFile(
      runPaths.statusPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          run: {
            outputRoot: runPaths.outputRoot,
            runDir: runPaths.runDir,
            slug: runPaths.slug,
            timestamp: runPaths.timestamp,
          },
          state: "queued",
          currentStage: null,
          message: "Queued",
          error: null,
          warningMessages: [],
          frameCounts: {
            total: 0,
            pending: 0,
            generating: 0,
            done: 0,
            error: 0,
          },
          stages: {},
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const pid = spawnBackgroundNodeScript({
      scriptPath: path.join(process.cwd(), "scripts", "generate-marketing-campaign.mjs"),
      args: ["--request-file", runPaths.requestPath, "--run-dir", runPaths.runDir, "--skip-video"],
      cwd: process.cwd(),
      logFile: path.join(runPaths.runDir, "runner.log"),
    });

    const requestPayload = await readRunArtifact(runPaths.runDir, "request.json");

    return NextResponse.json({
      ok: true,
      runId: path.basename(runPaths.runDir),
      runDir: runPaths.runDir,
      pid,
      request: requestPayload,
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to start marketing campaign run");
  }
}
