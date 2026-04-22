import path from "node:path";

export const DEFAULT_FRAME_COUNT = 10;
export const DEFAULT_CAMERA_FORMAT = "vertical";
export const DEFAULT_FRAME_TO_FRAME_CHANGES = "pose, action, camera angle, framing";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toSourceValue(value, source) {
  return { value, source };
}

export function slugify(value, fallback = "storyboard-run") {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return normalized || fallback;
}

export function parseCliArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }

    const eqIndex = token.indexOf("=");
    const key = token.slice(2, eqIndex >= 0 ? eqIndex : undefined);
    let value = eqIndex >= 0 ? token.slice(eqIndex + 1) : undefined;

    if (value == null) {
      const next = argv[index + 1];
      if (next != null && !next.startsWith("--")) {
        value = next;
        index += 1;
      } else {
        value = "true";
      }
    }

    if (Object.hasOwn(parsed, key)) {
      const current = parsed[key];
      parsed[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      parsed[key] = value;
    }
  }
  return parsed;
}

function parseOptionalInt(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }
  const raw = clean(value);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCameraFormat(value) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";
  if (raw === "portrait") return "vertical";
  if (raw === "landscape") return "horizontal";
  if (raw === "vertical" || raw === "horizontal" || raw === "square") return raw;
  if (raw === "1:1") return "square";
  return "";
}

function parseActionSequence(value) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }
  const raw = clean(value);
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => clean(item)).filter(Boolean);
      }
    } catch {}
  }
  return raw
    .split("|")
    .map((item) => clean(item))
    .filter(Boolean);
}

export function buildLooseInputFromCli(parsedArgs) {
  const rawPrompt = clean(parsedArgs.prompt) || parsedArgs._.map((item) => clean(item)).filter(Boolean).join(" ");

  return {
    rawPrompt,
    overrides: {
      numberOfFrames: parseOptionalInt(parsedArgs.frames || parsedArgs["number-of-frames"]),
      mainCharacterDetails: clean(parsedArgs["main-character-details"]),
      locationEnvironment: clean(parsedArgs["location-environment"]),
      propsKeyObjects: clean(parsedArgs["props-key-objects"]),
      visualStyle: clean(parsedArgs["visual-style"]),
      cameraFormat: normalizeCameraFormat(parsedArgs["camera-format"]),
      frameToFrameChanges: clean(parsedArgs["frame-to-frame-changes"]),
      actionSequence: parseActionSequence(parsedArgs["action-sequence"] || parsedArgs.action),
    },
    extraNotes: clean(parsedArgs.notes || parsedArgs["extra-notes"]),
    jobLabel: clean(parsedArgs.job || parsedArgs["job-label"]),
    outputRoot: clean(parsedArgs.output),
  };
}

function pickStringField(overrideValue, inferredValue, defaultValue = "") {
  const override = clean(overrideValue);
  if (override) return toSourceValue(override, "user");

  const inferred = clean(inferredValue);
  if (inferred) return toSourceValue(inferred, "inferred");

  const fallback = clean(defaultValue);
  if (fallback) return toSourceValue(fallback, "default");

  return toSourceValue("", "empty");
}

function pickNumberField(overrideValue, inferredValue, defaultValue) {
  const override = parseOptionalInt(overrideValue);
  if (override != null) return toSourceValue(override, "user");

  const inferred = parseOptionalInt(inferredValue);
  if (inferred != null) return toSourceValue(inferred, "inferred");

  return toSourceValue(defaultValue, "default");
}

function buildDefaultActionSequence(frameCount) {
  const base = [
    "establishing shot",
    "notices the key moment",
    "moves closer",
    "engages with the key object",
    "prepares to act",
    "captures the moment",
    "checks the result",
    "reacts positively",
    "keeps moving with confidence",
    "hero closing shot",
  ];

  if (frameCount <= base.length) {
    return base.slice(0, frameCount);
  }

  const out = [...base];
  while (out.length < frameCount) {
    out.splice(out.length - 1, 0, `progression beat ${out.length}`);
  }
  return out.slice(0, frameCount);
}

export function alignActionSequence(actions, frameCount) {
  const cleaned = Array.isArray(actions) ? actions.map((item) => clean(item)).filter(Boolean) : [];
  if (cleaned.length === frameCount) return cleaned;
  if (cleaned.length > frameCount) return cleaned.slice(0, frameCount);

  const defaults = buildDefaultActionSequence(frameCount);
  const out = [...cleaned];
  for (let index = out.length; index < frameCount; index++) {
    out.push(defaults[index] || `progression beat ${index + 1}`);
  }
  return out;
}

export function normalizeSceneSpec(looseInput, inferredSpec = {}) {
  const numberOfFrames = pickNumberField(
    looseInput?.overrides?.numberOfFrames,
    inferredSpec.numberOfFrames,
    DEFAULT_FRAME_COUNT,
  );
  const frameCount = numberOfFrames.value;
  const inferredActions = Array.isArray(inferredSpec.actionSequence) ? inferredSpec.actionSequence : [];
  const overrideActions = looseInput?.overrides?.actionSequence || [];
  const baseActions = overrideActions.length > 0 ? overrideActions : inferredActions;
  const actionSequence = alignActionSequence(
    baseActions.length > 0 ? baseActions : buildDefaultActionSequence(frameCount),
    frameCount,
  );
  const actionSource =
    overrideActions.length > 0 ? "user" : inferredActions.length > 0 ? "inferred" : "default";

  return {
    rawPrompt: clean(looseInput?.rawPrompt),
    numberOfFrames,
    mainCharacterDetails: pickStringField(
      looseInput?.overrides?.mainCharacterDetails,
      inferredSpec.mainCharacterDetails,
    ),
    locationEnvironment: pickStringField(
      looseInput?.overrides?.locationEnvironment,
      inferredSpec.locationEnvironment,
    ),
    propsKeyObjects: pickStringField(
      looseInput?.overrides?.propsKeyObjects,
      inferredSpec.propsKeyObjects,
    ),
    visualStyle: pickStringField(looseInput?.overrides?.visualStyle, inferredSpec.visualStyle),
    cameraFormat: pickStringField(
      looseInput?.overrides?.cameraFormat,
      normalizeCameraFormat(inferredSpec.cameraFormat),
      DEFAULT_CAMERA_FORMAT,
    ),
    frameToFrameChanges: pickStringField(
      looseInput?.overrides?.frameToFrameChanges,
      inferredSpec.frameToFrameChanges,
      DEFAULT_FRAME_TO_FRAME_CHANGES,
    ),
    actionSequence: toSourceValue(actionSequence, actionSource),
    extraNotes: pickStringField(looseInput?.extraNotes, "", ""),
  };
}

export function materializeSceneSpec(sceneSpec) {
  return {
    rawPrompt: clean(sceneSpec?.rawPrompt),
    numberOfFrames: sceneSpec?.numberOfFrames?.value ?? DEFAULT_FRAME_COUNT,
    mainCharacterDetails: clean(sceneSpec?.mainCharacterDetails?.value),
    locationEnvironment: clean(sceneSpec?.locationEnvironment?.value),
    propsKeyObjects: clean(sceneSpec?.propsKeyObjects?.value),
    visualStyle: clean(sceneSpec?.visualStyle?.value),
    cameraFormat: clean(sceneSpec?.cameraFormat?.value) || DEFAULT_CAMERA_FORMAT,
    frameToFrameChanges:
      clean(sceneSpec?.frameToFrameChanges?.value) || DEFAULT_FRAME_TO_FRAME_CHANGES,
    actionSequence: Array.isArray(sceneSpec?.actionSequence?.value)
      ? sceneSpec.actionSequence.value.map((item) => clean(item)).filter(Boolean)
      : [],
    extraNotes: clean(sceneSpec?.extraNotes?.value),
  };
}

export function buildFallbackFramePlan(sceneSpec) {
  const materialized = materializeSceneSpec(sceneSpec);
  const continuity = [
    materialized.mainCharacterDetails,
    materialized.locationEnvironment,
    materialized.propsKeyObjects,
    materialized.visualStyle,
  ]
    .filter(Boolean)
    .join("; ");

  return materialized.actionSequence.map((actionBeat, index) => ({
    frameNumber: index + 1,
    title: `Frame ${index + 1}`,
    actionBeat,
    cameraShot: `${materialized.cameraFormat} campaign still`,
    prompt: [
      `Create frame ${index + 1} of ${materialized.numberOfFrames} for the same visual sequence.`,
      `Base concept: ${materialized.rawPrompt}.`,
      continuity ? `Keep continuity with: ${continuity}.` : "",
      `This frame should show: ${actionBeat}.`,
      `Frame-to-frame variation should come from ${materialized.frameToFrameChanges}.`,
      materialized.extraNotes ? `Extra notes: ${materialized.extraNotes}.` : "",
      "Single cinematic still image, not a collage, not a contact sheet, no text overlay, no watermark.",
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

export function normalizeFramePlan(sceneSpec, rawFrames) {
  const fallback = buildFallbackFramePlan(sceneSpec);
  if (!Array.isArray(rawFrames) || rawFrames.length === 0) return fallback;

  return fallback.map((defaultFrame, index) => {
    const candidate = rawFrames[index] || {};
    const prompt = clean(candidate.prompt) || defaultFrame.prompt;
    return {
      frameNumber: index + 1,
      title: clean(candidate.title) || defaultFrame.title,
      actionBeat: clean(candidate.actionBeat) || defaultFrame.actionBeat,
      cameraShot: clean(candidate.cameraShot) || defaultFrame.cameraShot,
      prompt,
    };
  });
}

export function resolveImageSize(cameraFormat) {
  const normalized = normalizeCameraFormat(cameraFormat) || DEFAULT_CAMERA_FORMAT;
  if (normalized === "horizontal") return "1536x1024";
  if (normalized === "square") return "1024x1024";
  return "1024x1536";
}

export function formatRunTimestamp(date = new Date()) {
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

export function resolveRunSlug(jobLabel, rawPrompt) {
  return slugify(jobLabel || rawPrompt, "storyboard-run");
}

export function buildRunPaths(projectRoot, options = {}) {
  const outputRoot = clean(options.outputRoot)
    ? path.resolve(projectRoot, options.outputRoot)
    : path.join(projectRoot, "qa-artifacts", "storyboard-runs");
  const timestamp = options.timestamp || formatRunTimestamp(options.date);
  const slug = resolveRunSlug(options.jobLabel, options.rawPrompt);
  const runDir = path.join(outputRoot, `${timestamp}-${slug}`);
  return {
    outputRoot,
    timestamp,
    slug,
    runDir,
    imagesDir: path.join(runDir, "images"),
    requestPath: path.join(runDir, "request.json"),
    sceneSpecPath: path.join(runDir, "scene-spec.json"),
    framesPath: path.join(runDir, "frames.json"),
  };
}

export function createFramesManifest(runPaths, sceneSpec, frames, models) {
  return {
    generatedAt: new Date().toISOString(),
    run: {
      outputRoot: runPaths.outputRoot,
      runDir: runPaths.runDir,
      imagesDir: runPaths.imagesDir,
      slug: runPaths.slug,
      timestamp: runPaths.timestamp,
    },
    models,
    imageSize: resolveImageSize(sceneSpec?.cameraFormat?.value),
    sceneSpec: materializeSceneSpec(sceneSpec),
    frames: frames.map((frame) => ({
      ...frame,
      imageFile: path.join("images", `frame-${String(frame.frameNumber).padStart(2, "0")}.png`),
      status: "pending",
      error: null,
    })),
  };
}
