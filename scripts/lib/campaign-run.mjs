import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import {
  alignActionSequence,
  createFramesManifest,
  buildRunPaths,
  materializeSceneSpec,
  normalizeFramePlan,
  normalizeSceneSpec,
  resolveImageSize,
} from "./storyboard-generator.mjs";
import {
  normalizeSocialCopyFrame,
  runArtDirectionAgent,
  runBriefAgent,
  runCoordinatorAgent,
  runCreativeQaAgent,
  runCritiqueAgent,
  runPersonaAgent,
  runSocialCopyAgent,
} from "./campaign-agents.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseOptionalInt(value, minimum = 1, maximum = 24) {
  const parsed = Number.parseInt(`${value ?? ""}`.trim(), 10);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  if (normalized < minimum || normalized > maximum) return null;
  return normalized;
}

function clampDuration(value) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 2;
  return Math.min(3.5, Math.max(1.2, numeric));
}

function buildStageRecord(file) {
  return {
    status: "pending",
    file,
    updatedAt: null,
    error: null,
  };
}

function createStatusDocument(runPaths, requestPayload) {
  return {
    generatedAt: new Date().toISOString(),
    run: {
      outputRoot: runPaths.outputRoot,
      runDir: runPaths.runDir,
      slug: runPaths.slug,
      timestamp: runPaths.timestamp,
    },
    state: "pending",
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
    request: {
      productName: requestPayload?.input?.productName || "",
      targetVertical: requestPayload?.input?.targetVertical || "",
      tone: requestPayload?.input?.tone || "",
      callToAction: requestPayload?.input?.callToAction || "",
      frameCount: normalizeFrameCountValue(
        requestPayload?.input?.looseInput?.overrides?.numberOfFrames ??
          requestPayload?.input?.frameCount,
        0,
      ),
    },
    stages: {
      brief: buildStageRecord("brief.json"),
      persona: buildStageRecord("persona.json"),
      critique: buildStageRecord("critique.json"),
      "art-direction": buildStageRecord("scene-spec.json"),
      coordinator: buildStageRecord("frame-plan.json"),
      "social-copy": buildStageRecord("social-copy.json"),
      "creative-qa": buildStageRecord("creative-qa.json"),
      "image-generation": buildStageRecord("frames.json"),
      video: buildStageRecord("video.mp4"),
    },
  };
}

function summarizeFrameCounts(frames) {
  const summary = {
    total: Array.isArray(frames) ? frames.length : 0,
    pending: 0,
    generating: 0,
    done: 0,
    error: 0,
  };

  for (const frame of Array.isArray(frames) ? frames : []) {
    const status = clean(frame?.status) || "pending";
    if (status === "done") summary.done += 1;
    else if (status === "generating") summary.generating += 1;
    else if (status === "error") summary.error += 1;
    else summary.pending += 1;
  }

  return summary;
}

function normalizePositiveIntegers(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => Number.parseInt(`${value ?? ""}`, 10))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.trunc(value)),
    ),
  ).sort((a, b) => a - b);
}

function normalizeFrameCountValue(value, fallback = 1) {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

function setStageStatus(statusDoc, stageKey, nextStatus, extras = {}) {
  const stage = asObject(statusDoc?.stages?.[stageKey]);
  statusDoc.stages[stageKey] = {
    ...stage,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    error: extras.error ?? null,
  };
}

function pushWarning(statusDoc, message) {
  const normalized = clean(message);
  if (!normalized) return;
  if (!Array.isArray(statusDoc.warningMessages)) statusDoc.warningMessages = [];
  if (!statusDoc.warningMessages.includes(normalized)) {
    statusDoc.warningMessages.push(normalized);
  }
}

function resetStageRecord(statusDoc, stageKey) {
  const stage = asObject(statusDoc?.stages?.[stageKey]);
  statusDoc.stages[stageKey] = {
    ...stage,
    status: "pending",
    updatedAt: new Date().toISOString(),
    error: null,
  };
}

function resetStoryboardStageState(statusDoc) {
  for (const stageKey of ["coordinator", "social-copy", "creative-qa", "image-generation", "video"]) {
    resetStageRecord(statusDoc, stageKey);
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function removeIfExists(filePath) {
  await fs.rm(filePath, { force: true }).catch(() => {});
}

function normalizeCaptionValue(caption) {
  const source = asObject(caption);
  const text = clean(source.text);
  const words = text.split(/\s+/).filter(Boolean);
  const emphasisWord = clean(source.emphasisWord) || (words[0] || "");
  return {
    text,
    emphasisWord,
    voiceover: clean(source.voiceover),
    durationSec: clampDuration(source.durationSec),
    transition: clean(source.transition) || "cut",
    kineticStyle: clean(source.kineticStyle) || "static",
    captionRole: clean(source.captionRole),
    status: clean(source.status) || "pending",
    dirty: source.dirty !== false,
    updatedAt: clean(source.updatedAt) || new Date().toISOString(),
  };
}

function mergeSocialCopyIntoFrames(framesManifest, socialCopy) {
  const captionFrames = new Map(
    (Array.isArray(socialCopy?.frames) ? socialCopy.frames : [])
      .map((frame) => normalizeSocialCopyFrame(frame))
      .filter((frame) => frame.frameNumber > 0)
      .map((frame) => [frame.frameNumber, frame]),
  );

  const nextFrames = (framesManifest?.frames || []).map((frame) => {
    const copy = captionFrames.get(frame.frameNumber);
    if (!copy) {
      return {
        ...frame,
        caption: normalizeCaptionValue(frame.caption),
      };
    }

    return {
      ...frame,
      caption: normalizeCaptionValue({
        ...frame.caption,
        ...copy,
        status: "pending",
        dirty: true,
      }),
    };
  });

  return {
    ...framesManifest,
    frames: nextFrames,
    socialCopy: {
      hook: clean(socialCopy?.hook),
      endCard: clean(socialCopy?.endCard),
    },
  };
}

async function clearRenderedRunArtifacts(runPaths) {
  await Promise.all([
    removeIfExists(runPaths.videoPath),
    removeIfExists(runPaths.captionsPath),
    removeIfExists(runPaths.concatPath),
  ]);
}

const IMAGE_MODEL_FALLBACK_CHAIN = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"];

function shouldRetryWithImageFallback(error) {
  const message = clean(error?.message || error);
  if (!message) return true;
  return /model|not found|not exist|unsupported|invalid|unavailable|access|permission|verified/i.test(message);
}

function buildImageModelAttemptOrder(requestedModel) {
  const primary = clean(requestedModel);
  if (!primary) return [...IMAGE_MODEL_FALLBACK_CHAIN];
  const index = IMAGE_MODEL_FALLBACK_CHAIN.indexOf(primary);
  if (index >= 0) return IMAGE_MODEL_FALLBACK_CHAIN.slice(index);
  return [primary];
}

async function generateImageBuffer({ client, requestedModel, prompt, size, user }) {
  const attempts = buildImageModelAttemptOrder(requestedModel);
  const firstModel = attempts[0];
  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const model = attempts[index];
    try {
      const response = await client.images.generate({
        model,
        prompt,
        size,
        quality: resolveImageQuality(),
        background: "opaque",
        user: clean(user) || undefined,
        n: 1,
      });
      const b64 = response.data?.[0]?.b64_json || "";
      if (!b64) throw new Error(`No image payload returned from ${model}.`);

      return {
        buffer: Buffer.from(b64, "base64"),
        effectiveModel: model,
        warning:
          model === firstModel
            ? null
            : `Image model fallback: requested ${firstModel}, succeeded with ${model}.`,
      };
    } catch (error) {
      lastError = error;
      const isLast = index === attempts.length - 1;
      if (isLast || !shouldRetryWithImageFallback(error)) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export function resolveTextModel() {
  return process.env.STORYBOARD_OPENAI_TEXT_MODEL || process.env.STUDIO_OPENAI_TEXT_MODEL || "gpt-4.1-mini";
}

export function resolveImageModel() {
  return process.env.STORYBOARD_OPENAI_IMAGE_MODEL || process.env.STUDIO_OPENAI_IMAGE_MODEL || "gpt-image-2";
}

export function resolveImageQuality() {
  const raw = `${process.env.STORYBOARD_OPENAI_IMAGE_QUALITY || ""}`.trim().toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "auto") return raw;
  return "medium";
}

export function createOpenAiClient() {
  const apiKey = clean(process.env.OPENAI_API_KEY);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey });
}

function normalizeOverrideBlock(rawInput = {}) {
  const input = asObject(rawInput);
  const rawOverrides = asObject(input.overrides);
  const looseOverrides = asObject(input.looseInput?.overrides);
  return {
    numberOfFrames:
      parseOptionalInt(
        rawOverrides.numberOfFrames ??
          rawOverrides.frames ??
          input.frameCount ??
          looseOverrides.numberOfFrames,
      ) ?? undefined,
    characterLock: clean(rawOverrides.characterLock || looseOverrides.characterLock),
    outfitLock: clean(rawOverrides.outfitLock || looseOverrides.outfitLock),
    phoneLock: clean(rawOverrides.phoneLock || looseOverrides.phoneLock),
    flyerLock: clean(rawOverrides.flyerLock || looseOverrides.flyerLock),
    accessoryLock: clean(rawOverrides.accessoryLock || looseOverrides.accessoryLock),
    locationLock: clean(rawOverrides.locationLock || looseOverrides.locationLock),
    backgroundAnchors: clean(rawOverrides.backgroundAnchors || looseOverrides.backgroundAnchors),
    screenLock: clean(rawOverrides.screenLock || looseOverrides.screenLock),
    composition: clean(rawOverrides.composition || looseOverrides.composition),
    mood: clean(rawOverrides.mood || looseOverrides.mood),
    mainCharacterDetails: clean(rawOverrides.mainCharacterDetails || looseOverrides.mainCharacterDetails),
    locationEnvironment: clean(rawOverrides.locationEnvironment || looseOverrides.locationEnvironment),
    propsKeyObjects: clean(rawOverrides.propsKeyObjects || looseOverrides.propsKeyObjects),
    visualStyle: clean(rawOverrides.visualStyle || looseOverrides.visualStyle),
    cameraFormat: clean(rawOverrides.cameraFormat || looseOverrides.cameraFormat),
    frameToFrameChanges: clean(rawOverrides.frameToFrameChanges || looseOverrides.frameToFrameChanges),
    actionSequence: Array.isArray(rawOverrides.actionSequence)
      ? rawOverrides.actionSequence
      : Array.isArray(looseOverrides.actionSequence)
        ? looseOverrides.actionSequence
        : [],
  };
}

export function normalizeCampaignInput(rawInput = {}) {
  const input = asObject(rawInput);
  const criteria =
    clean(input.criteria) ||
    clean(input.prompt) ||
    clean(input.rawPrompt) ||
    clean(input.looseInput?.rawPrompt);
  const productName = clean(input.productName);
  const targetVertical = clean(input.targetVertical);
  const tone = clean(input.tone);
  const callToAction = clean(input.callToAction || input.cta);
  const jobLabel = clean(input.jobLabel || input.job);
  const outputRoot = clean(input.outputRoot);
  const extraNotes =
    clean(input.notes) || clean(input.extraNotes) || clean(input.looseInput?.extraNotes);
  const overrides = normalizeOverrideBlock(input);
  const rawPrompt = [
    criteria,
    productName ? `Product: ${productName}` : "",
    targetVertical ? `Target vertical: ${targetVertical}` : "",
    tone ? `Tone: ${tone}` : "",
    callToAction ? `CTA: ${callToAction}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    criteria,
    productName,
    targetVertical,
    tone,
    callToAction,
    jobLabel,
    outputRoot,
    looseInput: {
      rawPrompt,
      overrides,
      extraNotes,
      jobLabel,
      outputRoot,
    },
  };
}

export function getStoryboardRunsRoot(projectRoot = process.cwd()) {
  return path.join(projectRoot, "qa-artifacts", "storyboard-runs");
}

export function resolveRunPaths(projectRoot = process.cwd(), options = {}) {
  if (clean(options.runId)) {
    const runId = clean(options.runId);
    const runDir = path.join(getStoryboardRunsRoot(projectRoot), runId);
    return resolveRunPaths(projectRoot, { runDir });
  }

  if (clean(options.runDir)) {
    const runDir = path.resolve(projectRoot, clean(options.runDir));
    const base = path.basename(runDir);
    const outputRoot = path.dirname(runDir);
    const match = base.match(/^(\d{8}-\d{6})-(.+)$/);
    const timestamp = match?.[1] || base.slice(0, 15);
    const slug = match?.[2] || base;
    return {
      outputRoot,
      timestamp,
      slug,
      runDir,
      imagesDir: path.join(runDir, "images"),
      captionedImagesDir: path.join(runDir, "images-captioned"),
      requestPath: path.join(runDir, "request.json"),
      statusPath: path.join(runDir, "status.json"),
      briefPath: path.join(runDir, "brief.json"),
      personaPath: path.join(runDir, "persona.json"),
      critiquePath: path.join(runDir, "critique.json"),
      sceneSpecPath: path.join(runDir, "scene-spec.json"),
      framePlanPath: path.join(runDir, "frame-plan.json"),
      socialCopyPath: path.join(runDir, "social-copy.json"),
      creativeQaPath: path.join(runDir, "creative-qa.json"),
      framesPath: path.join(runDir, "frames.json"),
      concatPath: path.join(runDir, "frames.concat.txt"),
      captionsPath: path.join(runDir, "captions.srt"),
      videoPath: path.join(runDir, "video.mp4"),
    };
  }

  return buildRunPaths(projectRoot, options);
}

async function loadRunArtifacts(runPaths) {
  const [request, status, brief, persona, critique, sceneSpec, framePlan, socialCopy, creativeQa, frames] =
    await Promise.all([
      readJson(runPaths.requestPath, null),
      readJson(runPaths.statusPath, null),
      readJson(runPaths.briefPath, null),
      readJson(runPaths.personaPath, null),
      readJson(runPaths.critiquePath, null),
      readJson(runPaths.sceneSpecPath, null),
      readJson(runPaths.framePlanPath, null),
      readJson(runPaths.socialCopyPath, null),
      readJson(runPaths.creativeQaPath, null),
      readJson(runPaths.framesPath, null),
    ]);
  return { request, status, brief, persona, critique, sceneSpec, framePlan, socialCopy, creativeQa, frames };
}

export async function getRunSnapshot({ projectRoot = process.cwd(), runId, runDir }) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const artifacts = await loadRunArtifacts(runPaths);
  const videoExists = await exists(runPaths.videoPath);
  return {
    runPaths,
    ...artifacts,
    videoExists,
  };
}

function creativeQaPassed(creativeQa) {
  return Boolean(
    creativeQa?.pass &&
      creativeQa?.valueClarityScore >= 3 &&
      creativeQa?.visualVarietyScore >= 3 &&
      creativeQa?.productProofScore >= 3,
  );
}

function resolveRequestedFrameCount(requestPayload, sceneSpec) {
  const requested = normalizeFrameCountValue(
    requestPayload?.input?.looseInput?.overrides?.numberOfFrames ?? requestPayload?.input?.frameCount,
    0,
  );
  if (requested > 0) return requested;
  return normalizeFrameCountValue(sceneSpec?.numberOfFrames?.value, 1);
}

function assertStoryboardFrameAlignment({ requestPayload, sceneSpec, framePlan, socialCopy }) {
  const requestedCount = resolveRequestedFrameCount(requestPayload, sceneSpec);
  const sceneSpecCount = normalizeFrameCountValue(sceneSpec?.numberOfFrames?.value, 0);
  const framePlanCount = Array.isArray(framePlan) ? framePlan.length : 0;
  const socialCopyCount = Array.isArray(socialCopy?.frames) ? socialCopy.frames.length : 0;

  if (
    requestedCount !== sceneSpecCount ||
    requestedCount !== framePlanCount ||
    requestedCount !== socialCopyCount
  ) {
    throw new Error(
      `Storyboard frame-count mismatch: requested ${requestedCount}, scene spec ${sceneSpecCount}, frame plan ${framePlanCount}, social copy ${socialCopyCount}.`,
    );
  }
}

export function applyCreativeQaFrameConstraints(sceneSpec, qaFeedback) {
  if (!sceneSpec || !qaFeedback) return sceneSpec;
  if (clean(sceneSpec?.numberOfFrames?.source) === "user") {
    return sceneSpec;
  }

  const currentCount = normalizeFrameCountValue(sceneSpec?.numberOfFrames?.value, 1);
  const framesToCut = normalizePositiveIntegers(qaFeedback?.framesToCut).filter(
    (frameNumber) => frameNumber <= currentCount,
  );
  const payoffFrame = normalizeFrameCountValue(qaFeedback?.singleFinalPayoffFrame, 0);

  let targetCount = currentCount;
  if (framesToCut.length > 0) {
    targetCount = Math.max(1, currentCount - framesToCut.length);
  }
  if (payoffFrame > 0) {
    targetCount = Math.min(targetCount, payoffFrame);
  }

  if (targetCount === currentCount && framesToCut.length === 0) {
    return sceneSpec;
  }

  const currentActions = Array.isArray(sceneSpec?.actionSequence?.value)
    ? sceneSpec.actionSequence.value.map((item) => clean(item)).filter(Boolean)
    : [];
  const filteredActions =
    framesToCut.length > 0
      ? currentActions.filter((_item, index) => !framesToCut.includes(index + 1))
      : currentActions;
  const nextActions = alignActionSequence(filteredActions.slice(0, targetCount), targetCount);

  return {
    ...sceneSpec,
    numberOfFrames: {
      ...(sceneSpec.numberOfFrames || {}),
      value: targetCount,
      source: "qa",
    },
    actionSequence: {
      ...(sceneSpec.actionSequence || {}),
      value: nextActions,
      source: "qa",
    },
  };
}

async function runStoryboardPlanningLoop({
  client,
  model,
  runPaths,
  statusDoc,
  requestPayload,
  sceneSpec,
  brief,
  persona,
  critique,
  tone,
  persistStatus,
  initialQaFeedback = null,
  currentFramePlan = [],
  currentSocialCopy = null,
}) {
  let framePlan = Array.isArray(currentFramePlan) ? currentFramePlan : [];
  let socialCopy = currentSocialCopy || null;
  let creativeQa = initialQaFeedback;
  let qaFeedback = initialQaFeedback;
  let workingSceneSpec = sceneSpec;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const hasQaFeedback = Boolean(qaFeedback);
    const constrainedSceneSpec = applyCreativeQaFrameConstraints(workingSceneSpec, qaFeedback);
    if (constrainedSceneSpec !== workingSceneSpec) {
      workingSceneSpec = constrainedSceneSpec;
      await writeJson(runPaths.sceneSpecPath, workingSceneSpec);
    }
    const materializedSceneSpec = materializeSceneSpec(workingSceneSpec);

    setStageStatus(statusDoc, "coordinator", "running");
    await persistStatus(
      hasQaFeedback ? "Rewriting storyboard frames from Creative QA" : "Planning storyboard frames",
      "running",
      "coordinator",
    );
    const coordinator = await runCoordinatorAgent({
      client,
      model,
      sceneSpec: materializedSceneSpec,
      brief,
      persona,
      critique,
      qaFeedback,
      currentFramePlan: framePlan,
    });
    framePlan = normalizeFramePlan(workingSceneSpec, coordinator?.frames);
    await writeJson(runPaths.framePlanPath, { frames: framePlan });
    setStageStatus(statusDoc, "coordinator", "done");

    setStageStatus(statusDoc, "social-copy", "running");
    await persistStatus(
      hasQaFeedback ? "Rewriting social captions from Creative QA" : "Writing social captions",
      "running",
      "social-copy",
    );
    socialCopy = await runSocialCopyAgent({
      client,
      model,
      brief,
      persona,
      critique,
      sceneSpec: materializedSceneSpec,
      frames: framePlan,
      tone,
      qaFeedback,
      currentSocialCopy: socialCopy,
    });
    await writeJson(runPaths.socialCopyPath, socialCopy);
    setStageStatus(statusDoc, "social-copy", "done");

    assertStoryboardFrameAlignment({
      requestPayload,
      sceneSpec: workingSceneSpec,
      framePlan,
      socialCopy,
    });

    setStageStatus(statusDoc, "creative-qa", "running");
    await persistStatus("Reviewing storyboard before image generation", "running", "creative-qa");
    creativeQa = await runCreativeQaAgent({
      client,
      model,
      brief,
      persona,
      critique,
      sceneSpec: materializedSceneSpec,
      framePlan,
      socialCopy,
    });
    await writeJson(runPaths.creativeQaPath, creativeQa);

    if (creativeQaPassed(creativeQa)) {
      setStageStatus(statusDoc, "creative-qa", "done");
      return { sceneSpec: workingSceneSpec, framePlan, socialCopy, creativeQa };
    }

    setStageStatus(statusDoc, "creative-qa", "warning", {
      error: Array.isArray(creativeQa?.reasons) ? creativeQa.reasons.join(" | ") : "Creative QA failed",
    });
    qaFeedback = creativeQa;
  }

  const softReason =
    Array.isArray(creativeQa?.reasons) && creativeQa.reasons.length > 0
      ? creativeQa.reasons.join(" | ")
      : "Creative QA flagged issues but did not block image generation.";
  pushWarning(statusDoc, `Creative QA soft-fail: ${softReason}`);
  setStageStatus(statusDoc, "creative-qa", "warning", { error: softReason });
  await persistStatus("Creative QA flagged issues — proceeding to images", "running", "creative-qa");
  return { sceneSpec: workingSceneSpec, framePlan, socialCopy, creativeQa };
}

async function generateStoryboardImagesForRun({
  client,
  requestedImageModel,
  runPaths,
  sceneSpec,
  framePlan,
  socialCopy,
  requestModels = {},
  statusDoc,
  persistStatus,
  autoRenderVideo = false,
}) {
  setStageStatus(statusDoc, "image-generation", "running");
  await persistStatus("Generating storyboard images", "running", "image-generation");
  let framesManifest = createFramesManifest(runPaths, sceneSpec, framePlan, {
    textModel: clean(requestModels.textModel) || resolveTextModel(),
    imageModel: clean(requestModels.imageModel) || requestedImageModel,
  });
  framesManifest = mergeSocialCopyIntoFrames(framesManifest, socialCopy);
  await writeJson(runPaths.framesPath, framesManifest);

  const imageSize = resolveImageSize(sceneSpec.cameraFormat.value);

  for (const frame of framesManifest.frames) {
    frame.status = "generating";
    frame.error = null;
    statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);
    await writeJson(runPaths.framesPath, framesManifest);
    await persistStatus(
      `Generating frame ${frame.frameNumber} of ${framesManifest.frames.length}`,
      "running",
      "image-generation",
    );

    try {
      const imageResult = await generateImageBuffer({
        client,
        requestedModel: requestedImageModel,
        prompt: frame.prompt,
        size: imageSize,
        user: runPaths.slug,
      });
      if (imageResult.warning) pushWarning(statusDoc, imageResult.warning);
      const outputPath = path.join(runPaths.runDir, frame.imageFile);
      await fs.writeFile(outputPath, imageResult.buffer);
      frame.status = "done";
      frame.effectiveImageModel = imageResult.effectiveModel;
    } catch (error) {
      frame.status = "error";
      frame.error = error instanceof Error ? error.message : "Image generation failed.";
    }

    statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);
    await writeJson(runPaths.framesPath, framesManifest);
    await writeJson(runPaths.statusPath, statusDoc);
  }

  const hadError = framesManifest.frames.some((frame) => frame.status === "error");
  if (hadError) {
    setStageStatus(statusDoc, "image-generation", "error", {
      error: "One or more storyboard frames failed to generate.",
    });
    statusDoc.error = "One or more storyboard frames failed to generate.";
    await persistStatus("Image generation failed", "error", "image-generation");
    throw new Error(statusDoc.error);
  }

  setStageStatus(statusDoc, "image-generation", "done");
  statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);
  await persistStatus(
    autoRenderVideo ? "Storyboard ready for video rendering" : "Review captions before rendering video",
    autoRenderVideo ? "render-queued" : "awaiting_caption_review",
    autoRenderVideo ? "video" : "image-generation",
  );

  return framesManifest;
}

export async function runCampaign({
  campaignInput,
  projectRoot = process.cwd(),
  runDir = "",
  autoRenderVideo = false,
}) {
  const normalizedInput = normalizeCampaignInput(campaignInput);
  if (!normalizedInput.criteria && !normalizedInput.looseInput?.rawPrompt) {
    throw new Error("Campaign criteria is required.");
  }

  const client = createOpenAiClient();
  const textModel = resolveTextModel();
  const imageModel = resolveImageModel();
  const runPaths = clean(runDir)
    ? resolveRunPaths(projectRoot, { runDir })
    : buildRunPaths(projectRoot, {
        outputRoot: normalizedInput.outputRoot,
        jobLabel: normalizedInput.jobLabel || normalizedInput.productName || "marketing-campaign",
        rawPrompt: normalizedInput.criteria || normalizedInput.looseInput.rawPrompt,
      });

  await fs.mkdir(runPaths.imagesDir, { recursive: true });
  await fs.mkdir(runPaths.captionedImagesDir, { recursive: true });

  const requestPayload = {
    generatedAt: new Date().toISOString(),
    input: normalizedInput,
    models: {
      textModel,
      imageModel,
    },
    run: {
      outputRoot: runPaths.outputRoot,
      runDir: runPaths.runDir,
      slug: runPaths.slug,
      timestamp: runPaths.timestamp,
    },
  };

  const statusDoc = createStatusDocument(runPaths, requestPayload);

  async function persistStatus(message, state, currentStage = statusDoc.currentStage) {
    statusDoc.generatedAt = new Date().toISOString();
    statusDoc.message = message;
    statusDoc.state = state;
    statusDoc.currentStage = currentStage;
    await writeJson(runPaths.statusPath, statusDoc);
  }

  await writeJson(runPaths.requestPath, requestPayload);
  await persistStatus("Starting campaign run", "running", "brief");

  try {
    setStageStatus(statusDoc, "brief", "running");
    await persistStatus("Generating campaign brief", "running", "brief");
    const brief = await runBriefAgent({ client, model: textModel, campaignInput: normalizedInput });
    await writeJson(runPaths.briefPath, brief);
    setStageStatus(statusDoc, "brief", "done");

    setStageStatus(statusDoc, "persona", "running");
    await persistStatus("Generating persona", "running", "persona");
    const persona = await runPersonaAgent({ client, model: textModel, brief });
    await writeJson(runPaths.personaPath, persona);
    setStageStatus(statusDoc, "persona", "done");

    setStageStatus(statusDoc, "critique", "running");
    await persistStatus("Generating focus-group critique", "running", "critique");
    const critique = await runCritiqueAgent({ client, model: textModel, brief, persona });
    await writeJson(runPaths.critiquePath, critique);
    setStageStatus(statusDoc, "critique", "done");

    setStageStatus(statusDoc, "art-direction", "running");
    await persistStatus("Locking scene art direction", "running", "art-direction");
    const inferredSceneSpec = await runArtDirectionAgent({
      client,
      model: textModel,
      campaignInput: normalizedInput,
      brief,
      persona,
      critique,
    });
    const sceneSpec = normalizeSceneSpec(normalizedInput.looseInput, inferredSceneSpec);
    await writeJson(runPaths.sceneSpecPath, sceneSpec);
    setStageStatus(statusDoc, "art-direction", "done");

    const { sceneSpec: plannedSceneSpec, framePlan, socialCopy } = await runStoryboardPlanningLoop({
      client,
      model: textModel,
      runPaths,
      statusDoc,
      requestPayload,
      sceneSpec,
      brief,
      persona,
      critique,
      tone: normalizedInput.tone,
      persistStatus,
    });

    await generateStoryboardImagesForRun({
      client,
      requestedImageModel: imageModel,
      runPaths,
      sceneSpec: plannedSceneSpec,
      framePlan,
      socialCopy,
      requestModels: requestPayload.models,
      statusDoc,
      persistStatus,
      autoRenderVideo,
    });

    return {
      runPaths,
      requestPayload,
      status: statusDoc,
    };
  } catch (error) {
    statusDoc.error = error instanceof Error ? error.message : "Campaign run failed.";
    if (statusDoc.currentStage && statusDoc.stages[statusDoc.currentStage]) {
      setStageStatus(statusDoc, statusDoc.currentStage, "error", { error: statusDoc.error });
    }
    await persistStatus(statusDoc.error, "error", statusDoc.currentStage);
    throw error;
  }
}

export async function rerunSocialCopyForRun({ projectRoot = process.cwd(), runId, runDir }) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const { request, brief, persona, critique, sceneSpec, framePlan, frames, status } =
    await loadRunArtifacts(runPaths);
  if (!request || !brief || !persona || !critique || !sceneSpec || !framePlan) {
    throw new Error("Run is missing required campaign artifacts for social-copy regeneration.");
  }

  const statusDoc = status || createStatusDocument(runPaths, request);
  const client = createOpenAiClient();
  const socialCopy = await runSocialCopyAgent({
    client,
    model: resolveTextModel(),
    brief,
    persona,
    critique,
    sceneSpec: materializeSceneSpec(sceneSpec),
    frames: framePlan.frames || [],
    tone: request?.input?.tone || "",
  });

  let framesManifest = frames;
  if (!framesManifest) {
    framesManifest = createFramesManifest(runPaths, sceneSpec, framePlan.frames || [], request.models || {});
  }
  framesManifest = mergeSocialCopyIntoFrames(framesManifest, socialCopy);

  setStageStatus(statusDoc, "social-copy", "done");
  statusDoc.state = "awaiting_caption_review";
  statusDoc.currentStage = "social-copy";
  statusDoc.message = "Captions regenerated";
  statusDoc.error = null;
  statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);

  await writeJson(runPaths.socialCopyPath, socialCopy);
  await writeJson(runPaths.framesPath, framesManifest);
  await writeJson(runPaths.statusPath, statusDoc);

  return { runPaths, framesManifest, socialCopy, status: statusDoc };
}

export async function rerunStoryboardForRun({ projectRoot = process.cwd(), runId, runDir }) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const { request, brief, persona, critique, sceneSpec, framePlan, socialCopy, creativeQa, status } =
    await loadRunArtifacts(runPaths);
  if (!request || !brief || !persona || !critique || !sceneSpec || !framePlan || !socialCopy) {
    throw new Error("Run is missing required campaign artifacts for storyboard regeneration.");
  }

  const framesToRewrite = normalizePositiveIntegers(creativeQa?.framesToRewrite);
  const framesToCut = normalizePositiveIntegers(creativeQa?.framesToCut);
  if (!creativeQa || (!framesToRewrite.length && !framesToCut.length && !clean(creativeQa?.rewriteBrief))) {
    throw new Error("Creative QA feedback is required before regenerating the storyboard.");
  }

  const statusDoc = status || createStatusDocument(runPaths, request);
  statusDoc.error = null;
  statusDoc.warningMessages = Array.isArray(statusDoc.warningMessages) ? statusDoc.warningMessages : [];
  statusDoc.frameCounts = {
    total: 0,
    pending: 0,
    generating: 0,
    done: 0,
    error: 0,
  };
  resetStoryboardStageState(statusDoc);

  async function persistStatus(message, state, currentStage = statusDoc.currentStage) {
    statusDoc.generatedAt = new Date().toISOString();
    statusDoc.message = message;
    statusDoc.state = state;
    statusDoc.currentStage = currentStage;
    await writeJson(runPaths.statusPath, statusDoc);
  }

  await clearRenderedRunArtifacts(runPaths);
  await persistStatus("Rewriting storyboard from Creative QA", "running", "coordinator");

  try {
    const client = createOpenAiClient();
    const textModel = clean(request?.models?.textModel) || resolveTextModel();
    const imageModel = clean(request?.models?.imageModel) || resolveImageModel();
    const { sceneSpec: nextSceneSpec, framePlan: nextFramePlan, socialCopy: nextSocialCopy } =
      await runStoryboardPlanningLoop({
        client,
        model: textModel,
        runPaths,
        statusDoc,
        requestPayload: request,
        sceneSpec,
        brief,
      persona,
      critique,
      tone: request?.input?.tone || "",
      persistStatus,
      initialQaFeedback: creativeQa,
      currentFramePlan: framePlan.frames || [],
      currentSocialCopy: socialCopy,
    });

    const framesManifest = await generateStoryboardImagesForRun({
      client,
      requestedImageModel: imageModel,
      runPaths,
      sceneSpec: nextSceneSpec,
      framePlan: nextFramePlan,
      socialCopy: nextSocialCopy,
      requestModels: request?.models || {},
      statusDoc,
      persistStatus,
      autoRenderVideo: false,
    });

    return {
      runPaths,
      framePlan: nextFramePlan,
      socialCopy: nextSocialCopy,
      framesManifest,
      status: statusDoc,
    };
  } catch (error) {
    statusDoc.error = error instanceof Error ? error.message : "Storyboard regeneration failed.";
    if (statusDoc.currentStage && statusDoc.stages[statusDoc.currentStage]) {
      setStageStatus(statusDoc, statusDoc.currentStage, "error", { error: statusDoc.error });
    }
    await persistStatus(statusDoc.error, "error", statusDoc.currentStage);
    throw error;
  }
}

export async function saveCaptionEditsForRun({
  projectRoot = process.cwd(),
  runId,
  runDir,
  captions = [],
}) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const framesManifest = await readJson(runPaths.framesPath, null);
  if (!framesManifest?.frames) throw new Error("frames.json not found for run.");

  const edits = new Map(
    (Array.isArray(captions) ? captions : [])
      .map((entry) => [Number.parseInt(`${entry?.frameNumber ?? ""}`, 10), entry])
      .filter(([frameNumber]) => Number.isFinite(frameNumber)),
  );

  framesManifest.frames = framesManifest.frames.map((frame) => {
    const edit = edits.get(frame.frameNumber);
    if (!edit) return frame;
    return {
      ...frame,
      caption: normalizeCaptionValue({
        ...frame.caption,
        ...edit,
        status: "pending",
        dirty: true,
        updatedAt: new Date().toISOString(),
      }),
    };
  });

  await writeJson(runPaths.framesPath, framesManifest);

  const statusDoc = await readJson(runPaths.statusPath, null);
  if (statusDoc) {
    statusDoc.state = "awaiting_caption_review";
    statusDoc.message = "Captions updated";
    await writeJson(runPaths.statusPath, statusDoc);
  }

  return { runPaths, framesManifest };
}
