export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readJsonFile, resolveRunDir } from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

type StageRecord = {
  status?: string;
  file?: string;
  updatedAt?: string | null;
  error?: string | null;
};

type CampaignStatus = {
  state?: string;
  currentStage?: string | null;
  message?: string;
  error?: string | null;
  stages?: Record<string, StageRecord>;
};

async function writeStatus(runDir: string, status: CampaignStatus) {
  await fs.writeFile(
    path.join(runDir, "status.json"),
    `${JSON.stringify(status, null, 2)}\n`,
    "utf8",
  );
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  let runDir = "";
  let status: CampaignStatus | null = null;

  try {
    await requireAdminSession();
    const { runId } = await context.params;
    runDir = resolveRunDir(runId);
    const requestPayload = await readJsonFile<{ input?: { assetType?: string } } | null>(
      path.join(runDir, "request.json"),
      null,
    );
    if (requestPayload?.input?.assetType !== "social-image") {
      return NextResponse.json(
        { error: "This run is configured for short-form video, not social image export." },
        { status: 409 },
      );
    }

    status = await readJsonFile<CampaignStatus | null>(path.join(runDir, "status.json"), null);
    if (status) {
      status.state = "rendering_images";
      status.currentStage = "social-export";
      status.message = "Preparing finished social posts";
      status.error = null;
      status.stages = status.stages || {};
      status.stages["social-export"] = {
        ...(status.stages["social-export"] || {}),
        file: "images-captioned",
        status: "running",
        updatedAt: new Date().toISOString(),
        error: null,
      };
      await writeStatus(runDir, status);
    }

    const videoAssembler = await import(
      "../../../../../../../scripts/lib/video-assembler.mjs"
    );
    const result = await videoAssembler.composeCaptionedFramesForRun({
      projectRoot: process.cwd(),
      runId,
      runDir,
      onlyDirty: true,
      layout: "social-post",
    });

    if (status) {
      status.state = "completed";
      status.currentStage = "social-export";
      status.message = "Social posts ready";
      status.error = null;
      status.stages = status.stages || {};
      status.stages["social-export"] = {
        ...(status.stages["social-export"] || {}),
        file: "images-captioned",
        status: "done",
        updatedAt: new Date().toISOString(),
        error: null,
      };
      await writeStatus(runDir, status);
    }

    return NextResponse.json({
      ok: true,
      runId,
      prepared: result.changed,
      total: result.framesManifest.frames.length,
    });
  } catch (error) {
    if (runDir && status) {
      const message = error instanceof Error ? error.message : "Failed to prepare social posts";
      status.state = "error";
      status.currentStage = "social-export";
      status.message = message;
      status.error = message;
      status.stages = status.stages || {};
      status.stages["social-export"] = {
        ...(status.stages["social-export"] || {}),
        file: "images-captioned",
        status: "error",
        updatedAt: new Date().toISOString(),
        error: message,
      };
      await writeStatus(runDir, status).catch(() => undefined);
    }
    return adminErrorResponse(error, "Failed to prepare social posts");
  }
}
