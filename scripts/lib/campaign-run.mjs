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

function collectNonCompliantImageModels(frames = [], expectedModel = "gpt-image-2") {
  const expected = clean(expectedModel).toLowerCase();
  return (Array.isArray(frames) ? frames : [])
    .map((frame) => ({
      frameNumber: Number.isFinite(Number(frame?.frameNumber)) ? Math.trunc(Number(frame.frameNumber)) : 0,
      effectiveImageModel: clean(frame?.effectiveImageModel),
    }))
    .filter(
      (frame) =>
        frame.frameNumber > 0 && frame.effectiveImageModel && frame.effectiveImageModel.toLowerCase() !== expected,
    );
}

export function buildImageModelComplianceError(frames = [], expectedModel = "gpt-image-2") {
  const mismatches = collectNonCompliantImageModels(frames, expectedModel);
  if (!mismatches.length) return "";
  const details = mismatches.map((item) => `frame ${item.frameNumber}=${item.effectiveImageModel}`).join(", ");
  return `Image model compliance failure: expected ${expectedModel} but got ${details}.`;
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

function normalizeReferenceImages(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((entry) => {
      const source = asObject(entry);
      const imagePath = clean(source.path || source.file || source.filePath);
      if (!imagePath) return null;
      return {
        path: imagePath,
        absolutePath: clean(source.absolutePath),
        originalName: clean(source.originalName || source.name || path.basename(imagePath)),
        mimeType: clean(source.mimeType || source.type),
        size: Number.isFinite(Number(source.size)) ? Number(source.size) : 0,
      };
    })
    .filter(Boolean)
    .slice(0, 16);
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

function fallbackSocialCopyForFrame(frame, index, total) {
  const role = clean(frame?.persuasionRole).toLowerCase();
  const title = clean(frame?.title).toLowerCase();
  const isFirst = index === 0;
  const isFinal = index === total - 1;
  let text = "the plan comes together";

  if (isFirst || /hook|pain|chaos|problem/.test(role)) {
    text = "too much to juggle";
  } else if (/product|action|entry|proof/.test(role)) {
    text = "the details fall into place";
  } else if (/send|share|ready/.test(role)) {
    text = "ready before the rush";
  } else if (/relief|release|calm/.test(role)) {
    text = "the pressure finally lifts";
  } else if (/premium|quality|finished|payoff/.test(role) || isFinal) {
    text = "start your event page";
  } else if (title) {
    text = title.split(/\s+/).slice(0, 6).join(" ");
  }

  const emphasisWord = text.split(/\s+/).find(Boolean) || "start";
  return {
    frameNumber: Number(frame?.frameNumber) || index + 1,
    text,
    emphasisWord,
    voiceover: clean(frame?.emotionalBeat) || clean(frame?.proofTarget) || text,
    durationSec: 2.2,
    transition: isFinal ? "whip" : "cut",
    kineticStyle: isFirst || isFinal ? "pop-in" : "word-by-word",
    captionRole: clean(frame?.persuasionRole) || (isFinal ? "final payoff" : "support story beat"),
  };
}

export function normalizeSocialCopyForFramePlan(socialCopy, framePlan = []) {
  const frames = Array.isArray(framePlan) ? framePlan : [];
  const existingByFrameNumber = new Map(
    (Array.isArray(socialCopy?.frames) ? socialCopy.frames : [])
      .map((frame) => normalizeSocialCopyFrame(frame))
      .filter((frame) => frame.frameNumber > 0)
      .map((frame) => [frame.frameNumber, frame]),
  );

  return {
    hook: clean(socialCopy?.hook),
    endCard: clean(socialCopy?.endCard),
    frames: frames.map((frame, index) => {
      const frameNumber = Number(frame?.frameNumber) || index + 1;
      const existing = existingByFrameNumber.get(frameNumber);
      if (existing) {
        return normalizeSocialCopyFrame({
          ...fallbackSocialCopyForFrame(frame, index, frames.length),
          ...existing,
          frameNumber,
        });
      }
      return normalizeSocialCopyFrame(fallbackSocialCopyForFrame(frame, index, frames.length));
    }),
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

const CANONICAL_BRAND_DOMAIN = "envitefy.com";
const BRAND_DOMAIN_TYPO_REGEX = /\benvitefye\.com\b/gi;
const IMAGE_MODEL_FALLBACK_CHAIN = ["gpt-image-2"];

function normalizeBrandDomainText(value) {
  const text = clean(value);
  if (!text) return text;
  return text.replace(BRAND_DOMAIN_TYPO_REGEX, CANONICAL_BRAND_DOMAIN);
}

function normalizeBrandDomainDeep(value) {
  if (typeof value === "string") return normalizeBrandDomainText(value);
  if (Array.isArray(value)) return value.map((entry) => normalizeBrandDomainDeep(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeBrandDomainDeep(entry)]),
    );
  }
  return value;
}

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

function resolveReferenceImagePaths(runPaths, referenceImages = []) {
  const runDir = path.resolve(runPaths.runDir);
  const normalizedRunDir = `${runDir}${path.sep}`;
  return normalizeReferenceImages(referenceImages)
    .map((reference) => {
      const absolutePath = path.resolve(runDir, reference.path);
      if (absolutePath === runDir || !absolutePath.startsWith(normalizedRunDir)) return null;
      return {
        ...reference,
        absolutePath,
      };
    })
    .filter(Boolean);
}

export function mimeTypeForImagePath(filePath, fallback = "") {
  const normalizedFallback = clean(fallback).toLowerCase();
  if (["image/jpeg", "image/png", "image/webp"].includes(normalizedFallback)) return normalizedFallback;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function buildReferencePrompt(prompt, referenceImages = []) {
  if (!referenceImages.length) return prompt;
  const names = referenceImages
    .map((reference, index) => `${index + 1}. ${reference.originalName || path.basename(reference.path)}`)
    .join("\n");
  return [
    prompt,
    "",
    "REFERENCE IMAGES:",
    names,
    "Use the attached reference images as visual guidance for character appearance, environment, wardrobe, props, product UI, color, mood, or composition when relevant.",
    "Do not copy unrelated artifacts from the references. Preserve the frame-specific action and camera instructions.",
  ].join("\n");
}

async function generateImageBuffer({ client, requestedModel, prompt, size, user, referenceImages = [] }) {
  const resolvedReferences = normalizeReferenceImages(referenceImages);
  const promptWithReferences =
    resolvedReferences.length > 0 ? buildReferencePrompt(prompt, resolvedReferences) : prompt;

  const attempts = buildImageModelAttemptOrder(requestedModel);
  const firstModel = attempts[0];
  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    const model = attempts[index];
    try {
      const response = await client.images.generate({
        model,
        prompt: promptWithReferences,
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
  return "gpt-image-2";
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
  const input = normalizeBrandDomainDeep(asObject(rawInput));
  const criteria = normalizeBrandDomainText(
    clean(input.criteria) ||
      clean(input.prompt) ||
      clean(input.rawPrompt) ||
      clean(input.looseInput?.rawPrompt),
  );
  const productName = normalizeBrandDomainText(clean(input.productName));
  const targetVertical = clean(input.targetVertical);
  const tone = clean(input.tone);
  const callToAction = normalizeBrandDomainText(clean(input.callToAction || input.cta));
  const jobLabel = clean(input.jobLabel || input.job);
  const outputRoot = clean(input.outputRoot);
  const extraNotes = normalizeBrandDomainText(
    clean(input.notes) || clean(input.extraNotes) || clean(input.looseInput?.extraNotes),
  );
  const overrides = normalizeOverrideBlock(input);
  const referenceImages = normalizeReferenceImages(input.referenceImages || input.looseInput?.referenceImages);
  const rawPrompt = [
    criteria,
    productName ? `Product: ${productName}` : "",
    targetVertical ? `Target vertical: ${targetVertical}` : "",
    tone ? `Tone: ${tone}` : "",
    callToAction ? `CTA: ${callToAction}` : "",
    referenceImages.length ? `Reference images: ${referenceImages.map((image) => image.originalName).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    criteria: normalizeBrandDomainText(criteria),
    productName: normalizeBrandDomainText(productName),
    targetVertical,
    tone,
    callToAction: normalizeBrandDomainText(callToAction),
    jobLabel,
    outputRoot,
    referenceImages,
    looseInput: {
      rawPrompt,
      overrides,
      extraNotes,
      jobLabel,
      outputRoot,
      referenceImages,
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

function summarizeCreativeQaFailure(creativeQa) {
  return Array.isArray(creativeQa?.reasons) && creativeQa.reasons.length > 0
    ? creativeQa.reasons.join(" | ")
    : "Creative QA blocked image generation.";
}

function scoreAtLeast(value, minimum) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(minimum, numeric) : minimum;
}

function creativeQaHardBlockerText(creativeQa) {
  return [
    ...(Array.isArray(creativeQa?.reasons) ? creativeQa.reasons : []),
    ...(Array.isArray(creativeQa?.captionIssues) ? creativeQa.captionIssues : []),
    ...(Array.isArray(creativeQa?.blockedCaptionPatterns) ? creativeQa.blockedCaptionPatterns : []),
    clean(creativeQa?.rewriteBrief),
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

function creativeQaHasHardBlocker(creativeQa) {
  const text = creativeQaHardBlockerText(creativeQa);
  if (!text) return false;
  return /frame[- ]count mismatch|disallowed prop|blocked prop|\btablet\b|\blaptop\b|missing product proof|no product proof|missing final payoff|multiple end cards|graphic logo|standalone logo|text-only end|cta card|brand naming|inconsistent brand|unreadable captions|captions are unusable|severe repeated product-demo loops/.test(
    text,
  );
}

export function normalizeCreativeQaForStoryboardBudget({
  creativeQa,
  requestPayload,
  sceneSpec,
  framePlan,
  brief,
}) {
  if (!creativeQa || creativeQaPassed(creativeQa)) {
    return { creativeQa, softened: false };
  }

  const budgetReview = validateStoryboardFrameBudget({ requestPayload, sceneSpec, framePlan, brief });
  if (!budgetReview.pass || creativeQaHasHardBlocker(creativeQa)) {
    return { creativeQa, softened: false };
  }

  return {
    creativeQa: {
      ...creativeQa,
      pass: true,
      valueClarityScore: scoreAtLeast(creativeQa.valueClarityScore, 3),
      visualVarietyScore: scoreAtLeast(creativeQa.visualVarietyScore, 3),
      productProofScore: scoreAtLeast(creativeQa.productProofScore, 3),
      framesToRewrite: [],
      framesToCut: [],
      rewriteBrief: "",
    },
    softened: true,
  };
}

function hasStoryboardRewritePlan(feedback) {
  return Boolean(
    feedback &&
      (normalizePositiveIntegers(feedback.framesToRewrite).length > 0 ||
        normalizePositiveIntegers(feedback.framesToCut).length > 0 ||
        clean(feedback.rewriteBrief)),
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

function dedupeNumbers(values) {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value) && value > 0))).sort(
    (a, b) => a - b,
  );
}

function storyboardAllowsDemoHeavy(requestPayload, brief) {
  const haystack = [
    requestPayload?.input?.targetVertical,
    requestPayload?.input?.tone,
    requestPayload?.input?.criteria,
    requestPayload?.input?.looseInput?.rawPrompt,
    brief?.campaignHook,
    brief?.proofMoment,
    brief?.mustInclude,
  ]
    .flat()
    .map((value) => clean(value).toLowerCase())
    .filter(Boolean)
    .join(" ");
  return /\b(product demo|demo-heavy|walkthrough|tutorial|screen recording|feature tour)\b/.test(haystack);
}

function isStoryboardBudgetFeedback(feedback) {
  return clean(feedback?.source) === "storyboard-budget";
}

function pickAllowedScreenBrandingFrames(frames) {
  const phoneProofFrames = frames
    .filter((frame) => clean(frame.shotFamily) === "phone-proof")
    .map((frame) => frame.frameNumber);
  if (phoneProofFrames.length > 0) return phoneProofFrames.slice(0, 2);

  return frames
    .filter((frame) => clean(frame.phoneDominance) === "dominant")
    .map((frame) => frame.frameNumber)
    .slice(0, 2);
}

function pickAllowedPhoneDominantFrames(frames) {
  const total = Array.isArray(frames) ? frames.length : 0;
  if (total >= 10) return [5, 8];
  if (total >= 8) return [Math.ceil(total / 2), Math.max(1, total - 2)];

  return frames
    .filter((frame) => clean(frame.shotFamily) === "phone-proof")
    .map((frame) => frame.frameNumber)
    .slice(0, 2);
}

function frameSearchText(frame) {
  return [
    frame?.title,
    frame?.actionBeat,
    frame?.cameraShot,
    frame?.composition,
    frame?.screenState,
    frame?.propFocus,
    frame?.emotionalBeat,
    frame?.proofTarget,
    frame?.mustDifferFromPrevious,
  ]
    .map((value) => clean(value).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

export function inferFramePhoneDominance(frame) {
  const declared = clean(frame?.phoneDominance);
  if (declared === "dominant") return "dominant";
  if (clean(frame?.shotFamily) === "phone-proof") return "dominant";

  const text = frameSearchText(frame);
  if (!text) return declared || "secondary";

  const phoneIsSecondary = /\b(phone|screen)\s+(?:is\s+)?secondary\b|\bsecondary\s+(?:phone|screen)\b|\bphone down\b|\bno phone\b|\bphone absent\b/.test(
    text,
  );
  const dominantPatterns = [
    /\bgoogle search\b/,
    /\bsearch results?\b/,
    /\bphone screen\b/,
    /\bscreen close-?up\b/,
    /\bclose-?up (?:of|on) (?:the )?phone\b/,
    /\bphone (?:close-?up|fills|dominates)\b/,
    /\bphone (?:in|as) (?:the )?foreground\b/,
    /\bapp screen\b/,
    /\bui\b/,
    /\binterface\b/,
    /\btyping (?:on|into) (?:the )?phone\b/,
    /\btapping (?:on )?(?:the )?phone\b/,
    /\bscrolling (?:on )?(?:the )?phone\b/,
    /\bholding (?:her |the )?phone\b/,
  ];

  const dominantSignalCount = dominantPatterns.filter((pattern) => pattern.test(text)).length;
  if (dominantSignalCount >= (phoneIsSecondary ? 2 : 1)) return "dominant";
  return declared === "none" ? "none" : "secondary";
}

export function finalFrameIsGraphicLogoPayoff(frame) {
  if (!frame) return false;
  const text = frameSearchText(frame);
  return /\b(graphic logo|logo shot|standalone logo|plain logo|end card|end-card|brand card|cta card|text-only|solid background|logo on)\b/.test(
    text,
  );
}

function sceneSpecStringField(value, source = "budget-repair") {
  return {
    value: clean(value),
    source,
  };
}

function replaceInferredSceneSpecField(sceneSpec, key, value) {
  const current = asObject(sceneSpec?.[key]);
  if (clean(current.source) === "user") return current;
  return sceneSpecStringField(value, "budget-repair");
}

export function repairStoryboardSceneSpecForBudget(sceneSpec) {
  if (!sceneSpec) return sceneSpec;
  return {
    ...sceneSpec,
    flyerLock: replaceInferredSceneSpecField(
      sceneSpec,
      "flyerLock",
      "one small birthday invitation order receipt or unfinished invite reference used only as background context; do not make a big readable flyer headline, do not show duplicate paper flyers, and do not put fake body copy on paper",
    ),
    screenLock: replaceInferredSceneSpecField(
      sceneSpec,
      "screenLock",
      "the same Envitefy mobile live-card flow appears only in the two approved phone-proof frames: frame 5 shows quick birthday invite creation, frame 8 shows a polished send-ready live invite or share confirmation; all other frames keep screens absent, face-down, or secondary",
    ),
    propsKeyObjects: replaceInferredSceneSpecField(
      sceneSpec,
      "propsKeyObjects",
      "same smartphone, a small birthday planning checklist, subtle pre-party planning details, and one small delayed-order reference; the product proof is the live digital invite, not paper handling",
    ),
    propPriority: replaceInferredSceneSpecField(
      sceneSpec,
      "propPriority",
      "prioritize the human problem, the clean Envitefy live-card result, and the host's relief; keep paper artifacts small, off-center, and non-readable except as context",
    ),
    disallowedProps: replaceInferredSceneSpecField(
      sceneSpec,
      "disallowedProps",
      "no laptop, no tablet, no extra screens, no children, no pets, no gym, no gymnastics, no sports venue, no dance studio, no trophies, no medals, no athlete posters, no physical birthday cake, no completed party table, no large readable fake printed words, no duplicate paper flyers, no delivery-delay paper as the hero object, and no graphic logo end card",
    ),
    screenProofRequirements: replaceInferredSceneSpecField(
      sceneSpec,
      "screenProofRequirements",
      "show product proof only twice: frame 5 quick invite creation on Envitefy, frame 8 polished live birthday invite ready to share; do not show Google search results, repeated UI close-ups, or phone screens in the final hero",
    ),
    visualArc: replaceInferredSceneSpecField(
      sceneSpec,
      "visualArc",
      "move from a real hosting deadline to quick digital resolution: pressure, decision, clean live-card proof, recipient confidence, then a final in-scene host payoff with no phone-led composition",
    ),
    propContinuityLock: replaceInferredSceneSpecField(
      sceneSpec,
      "propContinuityLock",
      "same phone, same small planning notes, same subtle pre-party birthday details, and one small delayed-order reference; paper stays secondary and never becomes the final proof",
    ),
    framingBaseline: replaceInferredSceneSpecField(
      sceneSpec,
      "framingBaseline",
      "varied candid framing with a saleable ad rhythm: environment, tactile context, human decision, two angled product-proof inserts, social validation, and a non-phone final hero",
    ),
  };
}

function budgetRepairFrameTemplates(brief = {}) {
  const product = clean(brief?.product) || "Envitefy";
  return [
    {
      title: "Deadline becomes real",
      actionBeat: "the host sees the birthday invitation plan is at risk before the party and pauses in the real home room, with paper details secondary on the table",
      cameraShot: "wide observational room shot",
      composition: "wide view of the host, pre-party home planning context, and a small delayed-order reference on the table; no gym decor, no cake, no completed party table, no large readable paper headline, and no device emphasis",
      mood: "concerned, candid, warm",
      persuasionRole: "hook",
      screenState: "no screen proof yet",
      propFocus: "host expression, room context, small party-planning details",
      emotionalBeat: "pressure",
      proofTarget: "show why she needs a shareable invite now",
      mustDifferFromPrevious: "establish the full environment and human stakes",
      shotFamily: "wide-environment",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Paper cannot solve it",
      actionBeat: "hands clear a small delayed-order reference away from the birthday details so the problem reads as urgency, not paper sorting",
      cameraShot: "tabletop environmental detail",
      composition: "close tabletop detail with the delayed-order reference small and off-center, birthday notes and simple planning texture in focus, papers oriented toward the host, no fake readable body copy, no cake, and no device foreground",
      mood: "specific, tactile, urgent",
      persuasionRole: "pain-proof",
      screenState: "offline details cannot be shared yet",
      propFocus: "small delay cue, party details, handwritten planning notes",
      emotionalBeat: "friction",
      proofTarget: "prove the offline plan is not shareable",
      mustDifferFromPrevious: "move from wide room context to tactile tabletop evidence",
      shotFamily: "environment-detail",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Details gathered",
      actionBeat: "the host gathers the key birthday details from notes and the original plan without making the paper artifact the hero",
      cameraShot: "hands-in-action side angle",
      composition: "hands moving date, time, and guest details into order, with the host partially visible from the side, paper facing her natural reading direction, and paper kept secondary",
      mood: "decisive, practical",
      persuasionRole: "decision-point",
      screenState: "the source details are ready to become an event page",
      propFocus: "hands, planning notes, birthday details",
      emotionalBeat: "decision",
      proofTarget: "show action without a generic search trope",
      mustDifferFromPrevious: "change from static tabletop evidence to active hands sorting details",
      shotFamily: "hands-action",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Decision turns into action",
      actionBeat: "the host shifts from overwhelm into action by organizing the invite details with intent",
      cameraShot: "over-the-shoulder side angle",
      composition: "the host leans over the table arranging source details and simple planning notes, with no device foreground, no cake, and no party scene",
      mood: "focused, calm shift",
      persuasionRole: "product-entry",
      screenState: "the source details are organized and ready for the product proof beat",
      propFocus: "host posture, source details, decor pieces",
      emotionalBeat: "relief begins",
      proofTarget: "make the turn toward the product feel earned",
      mustDifferFromPrevious: "change from hands-only action to over-the-shoulder human workflow",
      shotFamily: "over-shoulder",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Instant page proof",
      actionBeat: `${product} turns the gathered birthday details into a clean live invitation on an angled phone resting naturally on the table`,
      cameraShot: "angled product-proof close-up",
      composition: "phone rests naturally on the viewer-right side of the table at an angle, readable enough for proof, with small planning notes on the opposite side, visible table support, and no direct presentation pose",
      mood: "clear, useful, polished",
      persuasionRole: "product-proof",
      screenState: "birthday live-card creation is visibly underway",
      propFocus: "angled Envitefy live-card proof",
      emotionalBeat: "control",
      proofTarget: "prove the creation action",
      mustDifferFromPrevious: "change to the first allowed product-proof close-up",
      shotFamily: "phone-proof",
      phoneDominance: "dominant",
      brandingPresence: "screen",
    },
    {
      title: "Pressure drops",
      actionBeat: "the host steps back from the table and visibly relaxes as the work starts feeling manageable",
      cameraShot: "candid side-profile reaction",
      composition: "human reaction in the room with event materials behind her and no device emphasis",
      mood: "relieved, grounded",
      persuasionRole: "emotional-release",
      screenState: "the product has reduced uncertainty",
      propFocus: "face, posture, room context",
      emotionalBeat: "relief",
      proofTarget: "prove the emotional shift",
      mustDifferFromPrevious: "change from product proof to human reaction away from the device",
      shotFamily: "reaction",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Confidence spreads",
      actionBeat: "a nearby helper reacts to the polished invite direction in the real room, making the result feel socially approved rather than staged",
      cameraShot: "candid two-person social proof",
      composition: "natural side-angle interaction with pre-party birthday planning context visible, no extra screens, no cake, no completed party table, no paper flyer hero, and no staged phone demo",
      mood: "reassuring, credible",
      persuasionRole: "social-proof",
      screenState: "trust comes from another person reacting positively in the room",
      propFocus: "human response, source details, party context",
      emotionalBeat: "confidence",
      proofTarget: "show trust and design confidence through social reaction",
      mustDifferFromPrevious: "change from solo reaction to social proof and human validation",
      shotFamily: "social-proof",
      phoneDominance: "none",
      brandingPresence: "subtle",
    },
    {
      title: "Send-ready proof",
      actionBeat: `${product} shows the polished send-ready birthday live invite in one final angled product-proof moment`,
      cameraShot: "tight angled send-ready proof",
      composition: "phone supported on the viewer-right side of the table with the finished live invite visible, framed by subtle planning details only, no duplicate paper flyer, no cake, and no direct presentation pose",
      mood: "premium, finished, confident",
      persuasionRole: "send-ready-proof",
      screenState: "polished birthday live invite is ready to share",
      propFocus: "finished Envitefy live-card proof",
      emotionalBeat: "certainty",
      proofTarget: "prove the finished result is polished",
      mustDifferFromPrevious: "change from human social proof to the second and final allowed product-proof close-up",
      shotFamily: "phone-proof",
      phoneDominance: "dominant",
      brandingPresence: "screen",
    },
    {
      title: "Back in the moment",
      actionBeat: "the host returns attention to the room and pre-party planning details with the invite work no longer dominating her",
      cameraShot: "observational medium reaction",
      composition: "host in the home environment with a relaxed look after sharing the digital invite, no device foreground, no cake, and no party already underway",
      mood: "calm, capable",
      persuasionRole: "relief-proof",
      screenState: "the product proof is complete and the person is back in control",
      propFocus: "person, decor, room readiness",
      emotionalBeat: "confidence settled",
      proofTarget: "prove she gets time and confidence back",
      mustDifferFromPrevious: "change away from product proof to lived emotional benefit",
      shotFamily: "reaction",
      phoneDominance: "none",
      brandingPresence: "none",
    },
    {
      title: "Ready to host",
      actionBeat: "the host relaxes in the same home planning space with visible relief and confidence because the digital invite is already shared",
      cameraShot: "final in-scene hero payoff",
      composition: "warm hero view centered on the relieved host in the pre-party home setting, with no phone foreground, no paper flyer foreground, no cake, no completed party table, no activity-venue content, and no logo card",
      mood: "relieved, proud, ready",
      persuasionRole: "final-payoff",
      screenState: "single final emotional payoff after the Envitefy live card has been shared",
      propFocus: "host transformation and the handled digital invitation result",
      emotionalBeat: "conversion",
      proofTarget: "land the benefit of becoming ready without another product demo",
      mustDifferFromPrevious: "end on an in-scene emotional hero moment centered on the host",
      shotFamily: "final-hero",
      phoneDominance: "none",
      brandingPresence: "none",
    },
  ].map((frame, index) => ({
    frameNumber: index + 1,
    disallowedPropRisk: "",
    ...frame,
  }));
}

export function repairStoryboardFrameBudget(sceneSpec, framePlan, brief = {}) {
  const frames = Array.isArray(framePlan) ? framePlan : [];
  if (frames.length < 10) return frames;
  return normalizeFramePlan(sceneSpec, budgetRepairFrameTemplates(brief).slice(0, frames.length));
}

export function validateStoryboardFrameBudget({ requestPayload, sceneSpec, framePlan, brief }) {
  const frames = Array.isArray(framePlan) ? framePlan : [];
  const total = frames.length;
  if (total === 0) {
    return {
      pass: false,
      reasons: ["Frame plan is empty."],
      framesToRewrite: [],
      feedback: {
        source: "storyboard-budget",
        pass: false,
        reasons: ["Frame plan is empty."],
        framesToRewrite: [],
        framesToCut: [],
        requiredShotFamilies: [],
        singleFinalPayoffFrame: normalizeFrameCountValue(sceneSpec?.numberOfFrames?.value, 1),
        maxPhoneDominantFrames: 3,
        discardExistingFramePlan: true,
        rewriteBrief: "Return the requested frame count with complete storyboard frames.",
      },
    };
  }

  const demoHeavy = storyboardAllowsDemoHeavy(requestPayload, brief);
  const allowedPhoneDominantFrames = pickAllowedPhoneDominantFrames(frames);
  const maxPhoneDominantFrames = demoHeavy
    ? Math.max(3, Math.ceil(total / 2))
    : total >= 10
      ? allowedPhoneDominantFrames.length
      : 3;
  const dominantPhoneFrames = frames
    .filter((frame) => inferFramePhoneDominance(frame) === "dominant")
    .map((frame) => frame.frameNumber);
  const disallowedDominantPhoneFrames = dominantPhoneFrames.filter(
    (frameNumber) => !pickAllowedPhoneDominantFrames(frames).includes(frameNumber),
  );
  const distinctShotFamilies = new Set(frames.map((frame) => clean(frame.shotFamily)).filter(Boolean));
  const environmentalFrames = frames.filter((frame) =>
    ["wide-environment", "environment-detail"].includes(clean(frame.shotFamily)),
  );
  const nonPhoneFirstFrames = frames.filter((frame) =>
    ["none", "secondary"].includes(inferFramePhoneDominance(frame)),
  );
  const socialProofFrames = frames.filter((frame) => clean(frame.shotFamily) === "social-proof");
  const phoneDominantSocialProofFrames = socialProofFrames
    .filter((frame) => inferFramePhoneDominance(frame) === "dominant")
    .map((frame) => frame.frameNumber);
  const screenBrandingFrames = frames
    .filter((frame) => clean(frame.brandingPresence) === "screen")
    .map((frame) => frame.frameNumber);
  const heroBrandingFrames = frames
    .filter((frame) => clean(frame.brandingPresence) === "hero")
    .map((frame) => frame.frameNumber);
  const disallowedPropFrames = frames
    .filter((frame) => clean(frame.disallowedPropRisk))
    .map((frame) => frame.frameNumber);
  const finalFrame = frames[frames.length - 1];
  const allowedScreenBrandingFrames = pickAllowedScreenBrandingFrames(frames);
  const allowedHeroBrandingFrame = finalFrame?.frameNumber;

  const reasons = [];
  const rewriteFrameNumbers = [];
  const requiredShotFamilies = [];

  if (total >= 8 && !demoHeavy && dominantPhoneFrames.length > maxPhoneDominantFrames) {
    reasons.push(
      `Excessive phone-dominant frames: ${dominantPhoneFrames.length} out of ${total}; maximum is ${maxPhoneDominantFrames}. Only frames ${allowedPhoneDominantFrames.join(", ")} should remain phone-dominant unless the brief is explicitly demo-heavy.`,
    );
    rewriteFrameNumbers.push(...disallowedDominantPhoneFrames);
  }

  if (total >= 10 && !demoHeavy && disallowedDominantPhoneFrames.length > 0) {
    reasons.push(
      `Phone-dominant frames outside approved proof slots: ${disallowedDominantPhoneFrames.join(", ")}. Only frames ${allowedPhoneDominantFrames.join(", ")} may be phone-dominant.`,
    );
    rewriteFrameNumbers.push(...disallowedDominantPhoneFrames);
  }

  if (total >= 10 && distinctShotFamilies.size < 5) {
    reasons.push(`Insufficient shot variety: ${distinctShotFamilies.size} shot families; minimum is 5.`);
    rewriteFrameNumbers.push(...frames.map((frame) => frame.frameNumber));
    requiredShotFamilies.push(
      "wide-environment",
      "environment-detail",
      "hands-action",
      "over-shoulder",
      "phone-proof",
      "reaction",
      "social-proof",
      "final-hero",
    );
  }

  if (total >= 8 && environmentalFrames.length < 2) {
    reasons.push(`Insufficient environmental setup: ${environmentalFrames.length} context frames; minimum is 2.`);
    rewriteFrameNumbers.push(...frames.slice(0, Math.min(3, total)).map((frame) => frame.frameNumber));
    requiredShotFamilies.push("wide-environment", "environment-detail");
  }

  if (total >= 8 && nonPhoneFirstFrames.length < 2) {
    reasons.push(`Insufficient non-phone action coverage: ${nonPhoneFirstFrames.length} frames; minimum is 2.`);
    rewriteFrameNumbers.push(...dominantPhoneFrames.slice(0, Math.max(1, dominantPhoneFrames.length - 1)));
    requiredShotFamilies.push("hands-action", "reaction", "social-proof");
  }

  if (total >= 10 && socialProofFrames.length < 1) {
    reasons.push("Missing social-proof frame: add one trust or recipient-response beat.");
    rewriteFrameNumbers.push(...frames.slice(Math.max(0, total - 4), total - 1).map((frame) => frame.frameNumber));
    requiredShotFamilies.push("social-proof");
  }

  if (phoneDominantSocialProofFrames.length > 0) {
    reasons.push(`Social-proof frames must not be phone demos: ${phoneDominantSocialProofFrames.join(", ")}.`);
    rewriteFrameNumbers.push(...phoneDominantSocialProofFrames);
  }

  if (clean(finalFrame?.shotFamily) !== "final-hero") {
    reasons.push("Final frame must use shotFamily final-hero.");
    rewriteFrameNumbers.push(finalFrame?.frameNumber);
    requiredShotFamilies.push("final-hero");
  }

  if (inferFramePhoneDominance(finalFrame) === "dominant") {
    reasons.push("Final frame must not be phone-dominant.");
    rewriteFrameNumbers.push(finalFrame?.frameNumber);
  }

  if (finalFrameIsGraphicLogoPayoff(finalFrame)) {
    reasons.push("Final frame must be an in-scene emotional payoff, not a graphic logo or end-card shot.");
    rewriteFrameNumbers.push(finalFrame?.frameNumber);
  }

  if (disallowedPropFrames.length > 0) {
    reasons.push(`Disallowed prop risk on frames: ${disallowedPropFrames.join(", ")}.`);
    rewriteFrameNumbers.push(...disallowedPropFrames);
  }

  if (screenBrandingFrames.length > 2) {
    const overflowScreenBrandingFrames = screenBrandingFrames.filter(
      (frameNumber) => !allowedScreenBrandingFrames.includes(frameNumber),
    );
    reasons.push(
      `Too many screen-branding frames: ${screenBrandingFrames.length}; maximum is 2. Only frames ${allowedScreenBrandingFrames.join(", ") || "none"} may use brandingPresence screen.`,
    );
    rewriteFrameNumbers.push(...overflowScreenBrandingFrames);
  }

  if (heroBrandingFrames.length > 1) {
    const overflowHeroBrandingFrames = heroBrandingFrames.filter(
      (frameNumber) => frameNumber !== allowedHeroBrandingFrame,
    );
    reasons.push(
      `Too many hero-branding frames: ${heroBrandingFrames.length}; maximum is 1. Only frame ${allowedHeroBrandingFrame} may use brandingPresence hero.`,
    );
    rewriteFrameNumbers.push(...overflowHeroBrandingFrames);
  }

  if (reasons.length === 0) {
    return {
      pass: true,
      reasons: [],
      framesToRewrite: [],
      feedback: null,
    };
  }

  const framesToRewrite = dedupeNumbers(rewriteFrameNumbers);
  const uniqueRequiredShotFamilies = Array.from(new Set(requiredShotFamilies));
  return {
    pass: false,
    reasons,
    framesToRewrite,
    feedback: {
      source: "storyboard-budget",
      pass: false,
      reasons,
      framesToRewrite,
      framesToCut: [],
      captionIssues: [],
      blockedCaptionPatterns: [],
      requiredShotFamilies: uniqueRequiredShotFamilies,
      singleFinalPayoffFrame: total,
      maxPhoneDominantFrames,
      discardExistingFramePlan: true,
      strictShotBudgetMap:
        total >= 10
          ? [
              "1 wide-environment none",
              "2 environment-detail none",
              "3 hands-action none-or-secondary",
              "4 over-shoulder none",
              "5 phone-proof dominant",
              "6 reaction none",
              "7 social-proof none-or-secondary",
              "8 phone-proof dominant",
              "9 reaction none",
              "10 final-hero none",
            ]
          : [],
      valueClarityScore: 3,
      visualVarietyScore: 1,
      productProofScore: 3,
      rewriteBrief:
        `Preserve exactly ${total} frames. Rewrite the listed frames to satisfy the shot budget: ` +
        `at most ${maxPhoneDominantFrames} phone-dominant frames, with phoneDominance dominant reserved for frames ${allowedPhoneDominantFrames.join(", ")} only, at least two environmental/context frames, ` +
        "at least two phone-secondary or no-phone action/reaction frames, no disallowed props, " +
        "replace Google-search or generic phone-search beats with candid environmental action unless the search is essential, " +
        "include one social-proof or trust-signal frame that is not another phone demo, " +
        "for ten-frame ads use this map: 1 wide-environment none, 2 environment-detail none, 3 hands-action none or secondary, 4 over-shoulder none, 5 phone-proof dominant, 6 reaction none, 7 social-proof none or secondary, 8 phone-proof dominant, 9 reaction none, 10 final-hero none, " +
        "frame 10 must show the character's emotional transformation in the real scene and must not be a graphic logo, standalone logo, CTA card, or text-only end card, " +
        `brandingPresence screen only on frames ${allowedScreenBrandingFrames.join(", ") || "none"}, ` +
        `brandingPresence hero only on frame ${allowedHeroBrandingFrame}, all other branding must be subtle or none, ` +
        "and a non-phone final-hero payoff frame.",
    },
  };
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
      currentFramePlan: isStoryboardBudgetFeedback(qaFeedback) ? [] : framePlan,
    });
    framePlan = normalizeFramePlan(workingSceneSpec, coordinator?.frames);
    await writeJson(runPaths.framePlanPath, { frames: framePlan });

    const budgetReview = validateStoryboardFrameBudget({
      requestPayload,
      sceneSpec: workingSceneSpec,
      framePlan,
      brief,
    });
    if (!budgetReview.pass) {
      const budgetReason = budgetReview.reasons.join(" | ");
      setStageStatus(statusDoc, "coordinator", "warning", { error: budgetReason });
      pushWarning(statusDoc, `Storyboard budget rewrite: ${budgetReason}`);
      const repairedFramePlan = repairStoryboardFrameBudget(workingSceneSpec, framePlan, brief);
      const repairedBudgetReview = validateStoryboardFrameBudget({
        requestPayload,
        sceneSpec: workingSceneSpec,
        framePlan: repairedFramePlan,
        brief,
      });
      if (repairedBudgetReview.pass) {
        workingSceneSpec = repairStoryboardSceneSpecForBudget(workingSceneSpec);
        await writeJson(runPaths.sceneSpecPath, workingSceneSpec);
        framePlan = normalizeFramePlan(workingSceneSpec, repairedFramePlan);
        await writeJson(runPaths.framePlanPath, { frames: framePlan });
        pushWarning(statusDoc, "Storyboard budget repair applied deterministically.");
      } else if (attempt < 1) {
        qaFeedback = budgetReview.feedback;
        await persistStatus("Rewriting storyboard to satisfy shot budget", "running", "coordinator");
        continue;
      } else {
        await writeJson(runPaths.creativeQaPath, budgetReview.feedback);
        await persistStatus("Storyboard budget blocked image generation", "awaiting_storyboard_review", "coordinator");
        throw new Error(budgetReason);
      }
    }

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
    const rawSocialCopyCount = Array.isArray(socialCopy?.frames) ? socialCopy.frames.length : 0;
    socialCopy = normalizeSocialCopyForFramePlan(socialCopy, framePlan);
    if (rawSocialCopyCount !== socialCopy.frames.length) {
      pushWarning(
        statusDoc,
        `Social copy returned ${rawSocialCopyCount} captions for ${framePlan.length} frames; filled missing captions from frame plan fallbacks.`,
      );
    }
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
    const normalizedCreativeQa = normalizeCreativeQaForStoryboardBudget({
      creativeQa,
      requestPayload,
      sceneSpec: workingSceneSpec,
      framePlan,
      brief,
    });
    creativeQa = normalizedCreativeQa.creativeQa;
    if (normalizedCreativeQa.softened) {
      pushWarning(statusDoc, "Creative QA soft notes accepted after storyboard budget passed.");
    }
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

  const qaReason = summarizeCreativeQaFailure(creativeQa);
  pushWarning(statusDoc, `Creative QA blocked images: ${qaReason}`);
  setStageStatus(statusDoc, "creative-qa", "warning", { error: qaReason });
  await persistStatus("Creative QA blocked image generation", "awaiting_storyboard_review", "creative-qa");
  throw new Error(qaReason);
}

async function generateStoryboardImagesForRun({
  client,
  requestedImageModel,
  runPaths,
  sceneSpec,
  framePlan,
  socialCopy,
  requestModels = {},
  referenceImages = [],
  statusDoc,
  persistStatus,
  autoRenderVideo = false,
}) {
  setStageStatus(statusDoc, "image-generation", "running");
  await persistStatus("Generating storyboard images", "running", "image-generation");
  await fs.mkdir(runPaths.imagesDir, { recursive: true });
  await fs.mkdir(runPaths.captionedImagesDir, { recursive: true });
  let framesManifest = createFramesManifest(runPaths, sceneSpec, framePlan, {
    textModel: clean(requestModels.textModel) || resolveTextModel(),
    imageModel: clean(requestModels.imageModel) || requestedImageModel,
  });
  framesManifest = mergeSocialCopyIntoFrames(framesManifest, socialCopy);
  await writeJson(runPaths.framesPath, framesManifest);

  const imageSize = resolveImageSize(sceneSpec.cameraFormat.value);
  const resolvedReferenceImages = resolveReferenceImagePaths(runPaths, referenceImages);
  if (resolvedReferenceImages.length > 0) {
    framesManifest.referenceImages = resolvedReferenceImages.map(({ absolutePath: _absolutePath, ...reference }) => reference);
    await writeJson(runPaths.framesPath, framesManifest);
  }

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
        referenceImages: resolvedReferenceImages,
      });
      if (imageResult.warning) pushWarning(statusDoc, imageResult.warning);
      const outputPath = path.join(runPaths.runDir, frame.imageFile);
      await fs.writeFile(outputPath, imageResult.buffer);
      frame.status = "done";
      frame.effectiveImageModel = imageResult.effectiveModel;
      const modelComplianceError = buildImageModelComplianceError([frame], "gpt-image-2");
      if (modelComplianceError) {
        frame.status = "error";
        frame.error = modelComplianceError;
      }
    } catch (error) {
      frame.status = "error";
      frame.error = error instanceof Error ? error.message : "Image generation failed.";
    }

    statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);
    await writeJson(runPaths.framesPath, framesManifest);
    await writeJson(runPaths.statusPath, statusDoc);
  }

  const hadError = framesManifest.frames.some((frame) => frame.status === "error");
  const modelComplianceError = buildImageModelComplianceError(framesManifest.frames, "gpt-image-2");
  if (modelComplianceError) {
    setStageStatus(statusDoc, "image-generation", "error", {
      error: modelComplianceError,
    });
    statusDoc.error = modelComplianceError;
    await persistStatus("Image generation failed model compliance checks", "error", "image-generation");
    throw new Error(statusDoc.error);
  }

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
      referenceImages: normalizedInput.referenceImages,
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
    if (statusDoc.state === "awaiting_storyboard_review") {
      await writeJson(runPaths.statusPath, statusDoc);
      return {
        runPaths,
        requestPayload,
        status: statusDoc,
      };
    }
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
  const normalizedSocialCopy = normalizeSocialCopyForFramePlan(socialCopy, framePlan.frames || []);

  let framesManifest = frames;
  if (!framesManifest) {
    framesManifest = createFramesManifest(runPaths, sceneSpec, framePlan.frames || [], request.models || {});
  }
  framesManifest = mergeSocialCopyIntoFrames(framesManifest, normalizedSocialCopy);

  setStageStatus(statusDoc, "social-copy", "done");
  statusDoc.state = "awaiting_caption_review";
  statusDoc.currentStage = "social-copy";
  statusDoc.message = "Captions regenerated";
  statusDoc.error = null;
  statusDoc.frameCounts = summarizeFrameCounts(framesManifest.frames);

  await writeJson(runPaths.socialCopyPath, normalizedSocialCopy);
  await writeJson(runPaths.framesPath, framesManifest);
  await writeJson(runPaths.statusPath, statusDoc);

  return { runPaths, framesManifest, socialCopy: normalizedSocialCopy, status: statusDoc };
}

export async function rerunStoryboardForRun({ projectRoot = process.cwd(), runId, runDir }) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const { request, brief, persona, critique, sceneSpec, framePlan, socialCopy, creativeQa, status } =
    await loadRunArtifacts(runPaths);
  if (!request || !brief || !persona || !critique || !sceneSpec || !framePlan) {
    throw new Error("Run is missing required campaign artifacts for storyboard regeneration.");
  }

  let storyboardFeedback = creativeQa;
  if (!hasStoryboardRewritePlan(storyboardFeedback)) {
    const budgetReview = validateStoryboardFrameBudget({
      requestPayload: request,
      sceneSpec,
      framePlan: framePlan.frames || [],
      brief,
    });
    if (!budgetReview.pass) {
      storyboardFeedback = budgetReview.feedback;
      await writeJson(runPaths.creativeQaPath, storyboardFeedback);
    }
  }

  if (!hasStoryboardRewritePlan(storyboardFeedback)) {
    throw new Error("Storyboard budget or Creative QA feedback is required before regenerating the storyboard.");
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
  await persistStatus(
    isStoryboardBudgetFeedback(storyboardFeedback)
      ? "Rewriting storyboard from shot-budget feedback"
      : "Rewriting storyboard from Creative QA",
    "running",
    "coordinator",
  );

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
        initialQaFeedback: storyboardFeedback,
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
      referenceImages: request?.input?.referenceImages || request?.input?.looseInput?.referenceImages || [],
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
