export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

import fs from "node:fs/promises";
import path from "node:path";
import { after, NextResponse } from "next/server";
import {
  getMarketingRunsRoot,
  isMarketingCampaignBlobStorageEnabled,
  listMarketingRuns,
  persistMarketingRun,
  resolveMarketingCampaignProjectRoot,
} from "@/lib/admin/marketing-campaigns";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { spawnBackgroundNodeScript } from "@/lib/admin/spawn-background";

const MAX_REFERENCE_IMAGES = 8;
const MAX_REFERENCE_IMAGE_BYTES = 25 * 1024 * 1024;
const REFERENCE_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const BUILT_IN_BRAND_ASSETS = {
  wordmark: {
    sourceParts: ["public", "brand", "envitefy-wordmark.png"],
    fileName: "envitefy-wordmark-brand-reference.png",
    role: "brand-wordmark",
  },
  "app-icon": {
    sourceParts: ["public", "icons", "apple-touch-icon-120.png"],
    fileName: "envitefy-app-icon-brand-reference.png",
    role: "brand-app-icon",
  },
} as const;

type BuiltInBrandAssetId = keyof typeof BUILT_IN_BRAND_ASSETS;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeReferenceName(value: string, fallback: string) {
  return (
    clean(value)
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

async function parseCampaignRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return {
      body: await request.json(),
      referenceFiles: [] as File[],
    };
  }

  const formData = await request.formData();
  const rawPayload = formData.get("payload");
  const body = rawPayload && typeof rawPayload === "string" ? JSON.parse(rawPayload) : {};
  const referenceFiles = formData
    .getAll("referenceImages")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (referenceFiles.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Upload up to ${MAX_REFERENCE_IMAGES} reference images.`);
  }

  for (const file of referenceFiles) {
    if (!REFERENCE_IMAGE_TYPES.has(file.type)) {
      throw new Error("Reference images must be JPG, PNG, or WebP.");
    }
    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      throw new Error("Each reference image must be 25MB or smaller.");
    }
  }

  return { body, referenceFiles };
}

async function saveReferenceImages(runDir: string, referenceFiles: File[]) {
  if (!referenceFiles.length) return [];
  const referenceDir = path.join(runDir, "reference-images");
  await fs.mkdir(referenceDir, { recursive: true });

  const saved = [];
  for (let index = 0; index < referenceFiles.length; index += 1) {
    const file = referenceFiles[index];
    const ext = REFERENCE_IMAGE_TYPES.get(file.type) || path.extname(file.name) || ".png";
    const baseName = sanitizeReferenceName(
      path.basename(file.name, path.extname(file.name)),
      `reference-${index + 1}`,
    );
    const fileName = `${String(index + 1).padStart(2, "0")}-${baseName}${ext}`;
    const relativePath = path.join("reference-images", fileName);
    const filePath = path.join(runDir, relativePath);
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    saved.push({
      path: relativePath,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  }

  return saved;
}

function isBuiltInBrandAssetId(value: string): value is BuiltInBrandAssetId {
  return Object.hasOwn(BUILT_IN_BRAND_ASSETS, value);
}

async function saveBuiltInBrandAssets(runDir: string, values: unknown) {
  const assetIds = Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => clean(value).toLowerCase())
        .filter(isBuiltInBrandAssetId),
    ),
  );
  if (!assetIds.length) return [];

  const referenceDir = path.join(runDir, "reference-images");
  await fs.mkdir(referenceDir, { recursive: true });
  const saved = [];
  for (const assetId of assetIds) {
    const asset = BUILT_IN_BRAND_ASSETS[assetId];
    const sourcePath = path.join(process.cwd(), ...asset.sourceParts);
    const relativePath = path.join("reference-images", asset.fileName);
    const destinationPath = path.join(runDir, relativePath);
    await fs.copyFile(sourcePath, destinationPath);
    const fileStat = await fs.stat(destinationPath);
    saved.push({
      path: relativePath,
      originalName: asset.fileName,
      role: asset.role,
      mimeType: "image/png",
      size: fileStat.size,
    });
  }
  return saved;
}

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
    const { body, referenceFiles } = await parseCampaignRequest(request);
    const campaignRun = await import("../../../../../scripts/lib/campaign-run.mjs");
    let input = campaignRun.normalizeCampaignInput(body);
    if (!input.criteria && !input.looseInput?.rawPrompt) {
      return NextResponse.json({ error: "Campaign criteria is required" }, { status: 400 });
    }

    const workingProjectRoot = resolveMarketingCampaignProjectRoot();
    const isServerlessRuntime = workingProjectRoot !== process.cwd();
    if (isServerlessRuntime && !isMarketingCampaignBlobStorageEnabled()) {
      throw new Error(
        "Marketing campaign storage is not configured. Add BLOB_READ_WRITE_TOKEN to the production environment.",
      );
    }
    const runPaths = campaignRun.resolveRunPaths(process.cwd(), {
      outputRoot: isServerlessRuntime
        ? getMarketingRunsRoot(workingProjectRoot)
        : input.outputRoot,
      jobLabel: input.jobLabel || input.campaignName || input.productName || "marketing-campaign",
      rawPrompt: input.criteria || input.looseInput?.rawPrompt,
    });

    await fs.mkdir(runPaths.runDir, { recursive: true });
    const [brandReferenceImages, uploadedReferenceImages] = await Promise.all([
      saveBuiltInBrandAssets(runPaths.runDir, input.brandAssets),
      saveReferenceImages(runPaths.runDir, referenceFiles),
    ]);
    const referenceImages = [...brandReferenceImages, ...uploadedReferenceImages];
    if (referenceImages.length > 0) {
      input = campaignRun.normalizeCampaignInput({
        ...body,
        referenceImages,
      });
    }
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

    let pid: number | null = null;
    if (isServerlessRuntime) {
      await persistMarketingRun(runPaths.runDir);
      after(async () => {
        try {
          await campaignRun.runCampaign({
            campaignInput: input,
            projectRoot: process.cwd(),
            runDir: runPaths.runDir,
            autoRenderVideo: false,
          });
        } catch (error) {
          console.error("[marketing-campaigns] serverless campaign run failed", {
            runId: path.basename(runPaths.runDir),
            message: error instanceof Error ? error.message : String(error),
          });
        } finally {
          await persistMarketingRun(runPaths.runDir);
        }
      });
    } else {
      pid = spawnBackgroundNodeScript({
        scriptPath: path.join(process.cwd(), "scripts", "generate-marketing-campaign.mjs"),
        args: [
          "--request-file",
          runPaths.requestPath,
          "--run-dir",
          runPaths.runDir,
          "--skip-video",
        ],
        cwd: process.cwd(),
        logFile: path.join(runPaths.runDir, "runner.log"),
      });
    }

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
