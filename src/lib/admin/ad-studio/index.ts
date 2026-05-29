import fs from "node:fs/promises";
import path from "node:path";
import { compositeFinalFrames } from "@/lib/admin/ad-studio/agents/compositing-agent";
import { runCreativeDirectorAgent } from "@/lib/admin/ad-studio/agents/creative-director-agent";
import { buildExportPackage } from "@/lib/admin/ad-studio/agents/export-agent";
import { runFrameDirectorAgent } from "@/lib/admin/ad-studio/agents/frame-director-agent";
import { generateBaseImageFrames } from "@/lib/admin/ad-studio/agents/image-generation-agent";
import { runInvitationDesignAgent } from "@/lib/admin/ad-studio/agents/invitation-design-agent";
import { runProductUiAgent } from "@/lib/admin/ad-studio/agents/product-ui-agent";
import { runCampaignImageQa } from "@/lib/admin/ad-studio/agents/qa-agent";
import { runScriptAgent } from "@/lib/admin/ad-studio/agents/script-agent";
import { generateVeoPromptPackage } from "@/lib/admin/ad-studio/agents/veo-prompt-agent";
import {
  getAdminAdStudioProviderStatuses,
  resolveAdStudioImageModel,
  resolveAdStudioImageProvider,
  resolveAdStudioTextModel,
  resolveAdStudioTextProvider,
  resolveAdStudioVideoModel,
  resolveAdStudioVideoProvider,
} from "@/lib/admin/ad-studio/providers";
import { renderInvitationSvg } from "@/lib/admin/ad-studio/renderers/invitation-renderer";
import { renderPhoneUiSvg } from "@/lib/admin/ad-studio/renderers/phone-ui-renderer";
import type {
  AdStudioCampaign,
  AdStudioEventType,
  AdStudioFailure,
  AdStudioFormat,
  AdStudioImagesRequest,
  AdStudioRequest,
  AdStudioTone,
  AdStudioVideoLength,
  AdStudioVideoRequest,
  AdStudioVisualStyle,
  PipelineStepId,
  PipelineStepStatus,
  RenderedAsset,
} from "@/lib/admin/ad-studio/types";
import {
  AD_STUDIO_CTAS,
  AD_STUDIO_EVENT_TYPES,
  AD_STUDIO_FORMATS,
  AD_STUDIO_TONES,
  AD_STUDIO_VIDEO_LENGTHS,
  AD_STUDIO_VISUAL_STYLES,
} from "@/lib/admin/ad-studio/types";

export * from "@/lib/admin/ad-studio/types";
export { getAdminAdStudioProviderStatuses };

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const RUN_ID_PATTERN = /^\d{8}-\d{6}-[a-z0-9-]+$/;

export class AdminAdStudioGenerationError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  campaign?: AdStudioCampaign;

  constructor(
    code: string,
    message: string,
    options: { status?: number; retryable?: boolean; campaign?: AdStudioCampaign } = {},
  ) {
    super(message);
    this.code = code;
    this.status = options.status ?? 500;
    this.retryable = options.retryable ?? true;
    this.campaign = options.campaign;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function trimTo(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength).trim();
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42) || "ad-hub"
  );
}

function timestampForRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join("-");
}

function isVideoLength(value: number): value is AdStudioVideoLength {
  return AD_STUDIO_VIDEO_LENGTHS.includes(value as AdStudioVideoLength);
}

function isFormat(value: string): value is AdStudioFormat {
  return AD_STUDIO_FORMATS.includes(value as AdStudioFormat);
}

function isEventType(value: string): value is AdStudioEventType {
  return AD_STUDIO_EVENT_TYPES.includes(value as AdStudioEventType);
}

function isTone(value: string): value is AdStudioTone {
  return AD_STUDIO_TONES.includes(value as AdStudioTone);
}

function isVisualStyle(value: string): value is AdStudioVisualStyle {
  return AD_STUDIO_VISUAL_STYLES.includes(value as AdStudioVisualStyle);
}

function step(id: PipelineStepId, status: PipelineStepStatus["status"], summary: string) {
  const labels: Record<PipelineStepId, string> = {
    "creative-concept": "Creative concept",
    script: "Script",
    "invitation-design": "Invitation design",
    "product-ui": "Product UI",
    "frame-plan": "Frame plan",
    "base-image-generation": "Base image generation",
    compositing: "Compositing",
    qa: "QA",
    "veo-prompt-package": "Veo prompt package",
    export: "Export",
  };
  return {
    id,
    label: labels[id],
    status,
    summary,
    error: null,
    updatedAt: status === "pending" ? null : nowIso(),
  };
}

function initialSteps(): PipelineStepStatus[] {
  return [
    step("creative-concept", "pending", "Waiting for instruction."),
    step("script", "pending", "Waiting for concept."),
    step("invitation-design", "pending", "Waiting for script."),
    step("product-ui", "pending", "Waiting for invitation data."),
    step("frame-plan", "pending", "Waiting for product UI."),
    step("base-image-generation", "pending", "Waiting for frame plan."),
    step("compositing", "pending", "Waiting for base frames."),
    step("qa", "pending", "Waiting for composited frames."),
    step("veo-prompt-package", "pending", "Waiting for accepted frames."),
    step("export", "pending", "Waiting for Veo prompt package."),
  ];
}

function updateStep(
  steps: PipelineStepStatus[],
  id: PipelineStepId,
  status: PipelineStepStatus["status"],
  summary: string,
  error: string | null = null,
): PipelineStepStatus[] {
  return steps.map((item) =>
    item.id === id ? { ...item, status, summary, error, updatedAt: nowIso() } : item,
  );
}

export function getAdminAdStudioRunsRoot(projectRoot = process.cwd()): string {
  return path.join(projectRoot, "qa-artifacts", "ad-studio-runs");
}

export function sanitizeAdminAdStudioRunId(value: string): string {
  if (!RUN_ID_PATTERN.test(value)) {
    throw new AdminAdStudioGenerationError("invalid_run_id", "Invalid ad-studio run id.", {
      status: 400,
      retryable: false,
    });
  }
  return value;
}

export function resolveAdminAdStudioRunDir(runId: string, projectRoot = process.cwd()): string {
  return path.join(getAdminAdStudioRunsRoot(projectRoot), sanitizeAdminAdStudioRunId(runId));
}

export function buildAdminAdStudioAssetUrl(runId: string, file: string): string {
  return `/api/admin/ad-studio/assets/${encodeURIComponent(runId)}?file=${encodeURIComponent(file)}`;
}

export function resolveAdminAdStudioAssetPath(
  runId: string,
  file: string,
  projectRoot = process.cwd(),
): string {
  const runDir = path.resolve(resolveAdminAdStudioRunDir(runId, projectRoot));
  const assetPath = path.resolve(runDir, file);
  if (!assetPath.startsWith(`${runDir}${path.sep}`) && assetPath !== runDir) {
    throw new AdminAdStudioGenerationError("invalid_file", "Invalid asset file.", {
      status: 400,
      retryable: false,
    });
  }
  return assetPath;
}

function createRunId(campaignTitle: string): string {
  return `${timestampForRunId()}-${slugify(campaignTitle)}`;
}

function withFreshUrls(campaign: AdStudioCampaign): AdStudioCampaign {
  const buildUrl = (file: string) => buildAdminAdStudioAssetUrl(campaign.runId, file);
  return {
    ...campaign,
    deterministicAssets: campaign.deterministicAssets
      ? {
          invitation: {
            ...campaign.deterministicAssets.invitation,
            url: buildUrl(campaign.deterministicAssets.invitation.file),
          },
          phoneUi: {
            ...campaign.deterministicAssets.phoneUi,
            url: buildUrl(campaign.deterministicAssets.phoneUi.file),
          },
        }
      : null,
    baseFrames: campaign.baseFrames.map((frame) => ({ ...frame, url: buildUrl(frame.file) })),
    compositeFrames: campaign.compositeFrames.map((frame) => ({
      ...frame,
      finalUrl: buildUrl(frame.finalFile),
    })),
  };
}

async function writeCampaign(
  runDir: string,
  campaign: AdStudioCampaign,
): Promise<AdStudioCampaign> {
  await fs.mkdir(runDir, { recursive: true });
  const next = { ...campaign, updatedAt: nowIso() };
  await fs.writeFile(path.join(runDir, "run.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return withFreshUrls(next);
}

async function readCampaign(runDir: string): Promise<AdStudioCampaign | null> {
  try {
    const raw = await fs.readFile(path.join(runDir, "run.json"), "utf8");
    return withFreshUrls(JSON.parse(raw) as AdStudioCampaign);
  } catch {
    return null;
  }
}

function parseCampaign(value: unknown): AdStudioCampaign | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 2) return null;
  if (!safeString(record.runId)) return null;
  if (!record.request || typeof record.request !== "object") return null;
  return record as AdStudioCampaign;
}

export function parseAdminAdStudioGenerateRequest(input: unknown): ParseResult<AdStudioRequest> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = input as Record<string, unknown>;
  const instruction = trimTo(safeString(record.instruction) || safeString(record.brief), 4000);
  if (!instruction) return { ok: false, error: "Describe the promo video before generating." };

  const videoLengthRaw = Number(record.videoLength);
  const videoLength = isVideoLength(videoLengthRaw) ? videoLengthRaw : 15;
  const formatRaw = safeString(record.format || record.outputFormat);
  const eventTypeRaw = safeString(record.eventType);
  const toneRaw = safeString(record.tone);
  const visualStyleRaw = safeString(record.visualStyle);
  const ctaRaw = safeString(record.cta);

  return {
    ok: true,
    value: {
      instruction,
      videoLength,
      format: isFormat(formatRaw) ? formatRaw : "vertical",
      eventType: isEventType(eventTypeRaw) ? eventTypeRaw : "general-event",
      tone: isTone(toneRaw) ? toneRaw : "premium",
      visualStyle: isVisualStyle(visualStyleRaw) ? visualStyleRaw : "cinematic-realistic",
      cta: AD_STUDIO_CTAS.includes(ctaRaw as AdStudioRequest["cta"])
        ? (ctaRaw as AdStudioRequest["cta"])
        : "snap-share-celebrate",
      customCta: trimTo(safeString(record.customCta), 80) || null,
    },
  };
}

export function parseAdminAdStudioImagesRequest(
  input: unknown,
): ParseResult<AdStudioImagesRequest> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = input as Record<string, unknown>;
  const campaign = parseCampaign(record.campaign);
  if (!campaign) return { ok: false, error: "Campaign is required before generating frames." };
  const frameNumberRaw = Number(record.frameNumber);
  return {
    ok: true,
    value: {
      runId: safeString(record.runId) || campaign.runId,
      campaign,
      frameNumber: Number.isInteger(frameNumberRaw) && frameNumberRaw >= 1 ? frameNumberRaw : null,
    },
  };
}

export function parseAdminAdStudioVideoRequest(input: unknown): ParseResult<AdStudioVideoRequest> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = input as Record<string, unknown>;
  const campaign = parseCampaign(record.campaign);
  if (!campaign)
    return { ok: false, error: "Campaign is required before generating video prompts." };
  return {
    ok: true,
    value: {
      runId: safeString(record.runId) || campaign.runId,
      campaign,
    },
  };
}

async function writeDeterministicAssets({
  runDir,
  runId,
  campaign,
}: {
  runDir: string;
  runId: string;
  campaign: AdStudioCampaign;
}): Promise<{ invitation: RenderedAsset; phoneUi: RenderedAsset }> {
  const assetsDir = path.join(runDir, "deterministic-assets");
  await fs.mkdir(assetsDir, { recursive: true });
  const invitationSvg = renderInvitationSvg(campaign.invitationDesign);
  const phoneUiSvg = renderPhoneUiSvg(campaign.phoneUiDesign);
  const invitationFile = "deterministic-assets/invitation.svg";
  const phoneUiFile = "deterministic-assets/phone-ui.svg";
  await fs.writeFile(path.join(runDir, invitationFile), invitationSvg, "utf8");
  await fs.writeFile(path.join(runDir, phoneUiFile), phoneUiSvg, "utf8");
  return {
    invitation: {
      kind: "invitation",
      file: invitationFile,
      url: buildAdminAdStudioAssetUrl(runId, invitationFile),
      width: 700,
      height: 980,
      svg: invitationSvg,
    },
    phoneUi: {
      kind: "phone-ui",
      file: phoneUiFile,
      url: buildAdminAdStudioAssetUrl(runId, phoneUiFile),
      width: 420,
      height: 860,
      svg: phoneUiSvg,
    },
  };
}

async function writeExports(runDir: string, campaign: AdStudioCampaign): Promise<void> {
  if (!campaign.exportPackage) return;
  const outputDir = path.join(runDir, "exports");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(runDir, campaign.exportPackage.campaignJsonFile),
    campaign.exportPackage.campaignJson,
    "utf8",
  );
  await fs.writeFile(
    path.join(runDir, campaign.exportPackage.markdownFile),
    campaign.exportPackage.markdownBrief,
    "utf8",
  );
  await fs.writeFile(
    path.join(runDir, campaign.exportPackage.veoPromptFile),
    campaign.exportPackage.veoPromptText,
    "utf8",
  );
  await fs.writeFile(
    path.join(runDir, campaign.exportPackage.voiceoverFile),
    campaign.exportPackage.voiceoverScript,
    "utf8",
  );
  await fs.writeFile(
    path.join(runDir, campaign.exportPackage.captionFile),
    campaign.exportPackage.captionsSrt,
    "utf8",
  );
}

export async function generateAdminAdStudioConfig(
  request: AdStudioRequest,
): Promise<{ campaign: AdStudioCampaign; model: string; runId: string; warnings: string[] }> {
  const warnings: string[] = [];
  let steps = initialSteps();

  steps = updateStep(
    steps,
    "creative-concept",
    "running",
    "Creative Director Agent is shaping the concept.",
  );
  const creative = await runCreativeDirectorAgent(request);
  warnings.push(...creative.warnings);
  steps = updateStep(steps, "creative-concept", "passed", creative.output.adAngle);

  steps = updateStep(steps, "script", "running", "Script Agent is timing the ad.");
  const script = await runScriptAgent(request, creative.output);
  warnings.push(...script.warnings);
  steps = updateStep(steps, "script", "passed", `${script.output.scenes.length} timed scenes.`);

  steps = updateStep(
    steps,
    "invitation-design",
    "running",
    "Invitation Design Agent is creating renderer data.",
  );
  const invitation = await runInvitationDesignAgent(request, creative.output, script.output);
  warnings.push(...invitation.warnings);
  steps = updateStep(
    steps,
    "invitation-design",
    "passed",
    `${invitation.output.theme} deterministic 5x7 invitation.`,
  );

  steps = updateStep(steps, "product-ui", "running", "Product UI Agent is creating phone UI data.");
  const phoneUi = await runProductUiAgent(
    request,
    creative.output,
    script.output,
    invitation.output,
  );
  warnings.push(...phoneUi.warnings);
  steps = updateStep(steps, "product-ui", "passed", "Deterministic Envitefy phone UI ready.");

  steps = updateStep(
    steps,
    "frame-plan",
    "running",
    "Frame Director Agent is planning base scenes.",
  );
  const framePlan = await runFrameDirectorAgent({
    request,
    brief: creative.output,
    script: script.output,
    invitation: invitation.output,
    phoneUi: phoneUi.output,
  });
  warnings.push(...framePlan.warnings);
  steps = updateStep(
    steps,
    "frame-plan",
    "passed",
    `${framePlan.output.frames.length} base frames with blank composite surfaces.`,
  );

  const runId = createRunId(creative.output.campaignTitle);
  const runDir = resolveAdminAdStudioRunDir(runId);
  const campaign: AdStudioCampaign = {
    version: 2,
    runId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    request,
    providerModels: {
      textProvider: resolveAdStudioTextProvider(),
      textModel: resolveAdStudioTextModel(),
      imageProvider: resolveAdStudioImageProvider(),
      imageModel: resolveAdStudioImageModel(),
      videoProvider: resolveAdStudioVideoProvider(),
      videoModel: resolveAdStudioVideoModel(),
    },
    steps,
    campaignBrief: creative.output,
    script: script.output,
    invitationDesign: invitation.output,
    phoneUiDesign: phoneUi.output,
    framePlan: framePlan.output,
    deterministicAssets: null,
    baseFrames: [],
    compositeFrames: [],
    qaResults: [],
    veoPromptPackage: null,
    exportPackage: null,
    warnings,
  };
  campaign.deterministicAssets = await writeDeterministicAssets({ runDir, runId, campaign });
  const saved = await writeCampaign(runDir, campaign);
  return { campaign: saved, model: resolveAdStudioTextModel(), runId, warnings };
}

function mergeByFrame<T extends { frameNumber: number }>(existing: T[], next: T[]): T[] {
  const map = new Map<number, T>();
  for (const item of existing) map.set(item.frameNumber, item);
  for (const item of next) map.set(item.frameNumber, item);
  return Array.from(map.values()).sort((a, b) => a.frameNumber - b.frameNumber);
}

export async function generateAdminAdStudioImages(
  request: AdStudioImagesRequest,
): Promise<{ runId: string; model: string; campaign: AdStudioCampaign; warnings: string[] }> {
  const runId = sanitizeAdminAdStudioRunId(request.runId || request.campaign.runId);
  const runDir = resolveAdminAdStudioRunDir(runId);
  const existing = await readCampaign(runDir);
  const campaign = existing || request.campaign;
  const warnings = [...campaign.warnings];

  if (!campaign.deterministicAssets) {
    campaign.deterministicAssets = await writeDeterministicAssets({ runDir, runId, campaign });
  }

  campaign.steps = updateStep(
    campaign.steps,
    "base-image-generation",
    "running",
    "Image Generation Agent is creating realistic base scenes only.",
  );
  await writeCampaign(runDir, campaign);

  const generated = await generateBaseImageFrames({
    runDir,
    plan: campaign.framePlan,
    frameNumber: request.frameNumber,
    buildAssetUrl: (file) => buildAdminAdStudioAssetUrl(runId, file),
  });
  warnings.push(...generated.warnings);
  campaign.baseFrames = mergeByFrame(campaign.baseFrames, generated.frames);
  campaign.steps = updateStep(
    campaign.steps,
    "base-image-generation",
    "passed",
    `${campaign.baseFrames.length} base frames generated with blank surfaces.`,
  );

  campaign.steps = updateStep(
    campaign.steps,
    "compositing",
    "running",
    "Compositing deterministic assets.",
  );
  campaign.compositeFrames = await compositeFinalFrames({
    runDir,
    plan: campaign.framePlan,
    baseFrames: campaign.baseFrames,
    invitationAsset: campaign.deterministicAssets.invitation,
    phoneUiAsset: campaign.deterministicAssets.phoneUi,
    buildAssetUrl: (file) => buildAdminAdStudioAssetUrl(runId, file),
  });
  campaign.steps = updateStep(
    campaign.steps,
    "compositing",
    "passed",
    `${campaign.compositeFrames.length} final frames composited.`,
  );

  campaign.steps = updateStep(
    campaign.steps,
    "qa",
    "running",
    "QA Agent is checking composited frames.",
  );
  campaign.qaResults = runCampaignImageQa({
    plan: campaign.framePlan,
    baseFrames: campaign.baseFrames,
    compositeFrames: campaign.compositeFrames,
  });
  const failedQa = campaign.qaResults.find((result) => !result.passed);
  if (failedQa) {
    campaign.steps = updateStep(
      campaign.steps,
      "qa",
      "failed",
      failedQa.failureReason || "Image QA failed.",
      failedQa.failureReason || "Image QA failed.",
    );
    campaign.warnings = warnings;
    const saved = await writeCampaign(runDir, campaign);
    throw new AdminAdStudioGenerationError(
      "image_qa_failed",
      failedQa.failureReason || "Image QA failed.",
      { status: 422, retryable: true, campaign: saved },
    );
  }
  campaign.steps = updateStep(campaign.steps, "qa", "passed", "All required frames passed QA.");

  campaign.steps = updateStep(
    campaign.steps,
    "veo-prompt-package",
    "running",
    "Veo Prompt Agent is packaging accepted frames.",
  );
  try {
    campaign.veoPromptPackage = generateVeoPromptPackage({
      campaign,
      compositeFrames: campaign.compositeFrames,
      qaResults: campaign.qaResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Veo prompt package failed.";
    campaign.steps = updateStep(campaign.steps, "veo-prompt-package", "failed", message, message);
    const saved = await writeCampaign(runDir, campaign);
    throw new AdminAdStudioGenerationError("image_qa_failed", message, {
      status: 422,
      retryable: true,
      campaign: saved,
    });
  }
  campaign.steps = updateStep(
    campaign.steps,
    "veo-prompt-package",
    "passed",
    "Master and per-scene Veo prompts ready.",
  );

  campaign.steps = updateStep(
    campaign.steps,
    "export",
    "running",
    "Export Agent is writing packages.",
  );
  campaign.warnings = warnings;
  campaign.steps = updateStep(
    campaign.steps,
    "export",
    "passed",
    "Campaign JSON, prompts, captions, and brief ready.",
  );
  campaign.exportPackage = buildExportPackage(campaign);
  await writeExports(runDir, campaign);
  const saved = await writeCampaign(runDir, campaign);
  return { runId, model: resolveAdStudioImageModel(), campaign: saved, warnings };
}

export async function generateAdminAdStudioVideo(request: AdStudioVideoRequest): Promise<{
  runId: string;
  video: {
    provider: string;
    model: string;
    status: "ready" | "queued";
    promptPackage: NonNullable<AdStudioCampaign["veoPromptPackage"]>;
  };
  warnings: string[];
}> {
  const runId = sanitizeAdminAdStudioRunId(request.runId || request.campaign.runId);
  const runDir = resolveAdminAdStudioRunDir(runId);
  const campaign = (await readCampaign(runDir)) || request.campaign;
  if (!campaign.veoPromptPackage) {
    throw new AdminAdStudioGenerationError(
      "image_qa_failed",
      "Accepted composited frames are required before generating Veo output.",
      { status: 422, retryable: true, campaign },
    );
  }
  return {
    runId,
    video: {
      provider: resolveAdStudioVideoProvider(),
      model: resolveAdStudioVideoModel(),
      status: "ready",
      promptPackage: campaign.veoPromptPackage,
    },
    warnings: campaign.warnings,
  };
}

export function adStudioFailure(
  error: AdminAdStudioGenerationError,
): AdStudioFailure & { campaign?: AdStudioCampaign } {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    },
    campaign: error.campaign,
  };
}
