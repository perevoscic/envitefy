import path from "node:path";

export const DEFAULT_FRAME_COUNT = 10;
export const DEFAULT_CAMERA_FORMAT = "vertical";
export const DEFAULT_FRAME_TO_FRAME_CHANGES = "pose, action, camera angle, framing";
export const DEFAULT_VISUAL_STYLE =
  "cinematic ad photography, realistic, premium startup commercial, clean modern lifestyle, natural lighting, shallow depth of field, subtle motion realism, polished brand-ad look.";
export const DEFAULT_CHARACTER_LOCK =
  "the same young mother in her early 30s, shoulder-length brown hair, natural makeup";
export const DEFAULT_OUTFIT_LOCK =
  "the same light beige sweater, blue jeans, white sneakers";
export const DEFAULT_PHONE_LOCK = "the same black modern smartphone";
export const DEFAULT_FLYER_LOCK =
  "the same colorful gymnastics meet flyer with athlete photos, schedule sections, icons, and bold headers";
export const DEFAULT_LOCATION_LOCK =
  "the same bright modern gymnastics facility lobby with a bulletin board, wood accents, front desk, pendant light, large window, and soft daylight";
export const DEFAULT_BACKGROUND_ANCHORS =
  "bulletin board, wood accents, front desk, pendant light, large window, soft daylight";
export const DEFAULT_SCREEN_LOCK =
  "the same clean Envitefy-style mobile event page, modern white interface, simple typography";
export const DEFAULT_COMPOSITION =
  "foreground flyer or phone detail, the mother in the midground, and the bright gymnastics lobby anchors in the background";
export const DEFAULT_MOOD = "focused, modern, warm, premium";
export const DEFAULT_CONTINUITY_RULE =
  "This must look like the same ad campaign sequence as the previous frames, keeping the same character, same outfit, same props, same flyer, same environment, same lighting, same branding, and same premium commercial aesthetic.";
export const DEFAULT_NEGATIVE_PROMPT =
  "no character change, no wardrobe change, no different location, no different flyer design, no different phone, no split image, no collage, no watermark, no floating text, single frame only.";

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
      characterLock: clean(parsedArgs["character-lock"]),
      outfitLock: clean(parsedArgs["outfit-lock"]),
      phoneLock: clean(parsedArgs["phone-lock"]),
      flyerLock: clean(parsedArgs["flyer-lock"]),
      accessoryLock: clean(parsedArgs["accessory-lock"]),
      locationLock: clean(parsedArgs["location-lock"]),
      backgroundAnchors: clean(parsedArgs["background-anchors"]),
      screenLock: clean(parsedArgs["screen-lock"]),
      composition: clean(parsedArgs.composition),
      mood: clean(parsedArgs.mood),
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

function pickLegacyAwareStringField(overrideValues, inferredValues, defaultValue = "") {
  const overrideList = Array.isArray(overrideValues) ? overrideValues : [overrideValues];
  for (const value of overrideList) {
    const cleaned = clean(value);
    if (cleaned) return toSourceValue(cleaned, "user");
  }

  const inferredList = Array.isArray(inferredValues) ? inferredValues : [inferredValues];
  for (const value of inferredList) {
    const cleaned = clean(value);
    if (cleaned) return toSourceValue(cleaned, "inferred");
  }

  const fallback = clean(defaultValue);
  if (fallback) return toSourceValue(fallback, "default");

  return toSourceValue("", "empty");
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
  const hasLegacyPropsLock = Boolean(
    clean(looseInput?.overrides?.propsKeyObjects) || clean(inferredSpec.propsKeyObjects),
  );
  const actionSource =
    overrideActions.length > 0 ? "user" : inferredActions.length > 0 ? "inferred" : "default";

  return {
    rawPrompt: clean(looseInput?.rawPrompt),
    numberOfFrames,
    characterLock: pickLegacyAwareStringField(
      [looseInput?.overrides?.characterLock, looseInput?.overrides?.mainCharacterDetails],
      [inferredSpec.characterLock, inferredSpec.mainCharacterDetails],
      DEFAULT_CHARACTER_LOCK,
    ),
    outfitLock: pickStringField(looseInput?.overrides?.outfitLock, inferredSpec.outfitLock, DEFAULT_OUTFIT_LOCK),
    phoneLock: pickStringField(
      looseInput?.overrides?.phoneLock,
      inferredSpec.phoneLock,
      hasLegacyPropsLock ? "" : DEFAULT_PHONE_LOCK,
    ),
    flyerLock: pickStringField(
      looseInput?.overrides?.flyerLock,
      inferredSpec.flyerLock,
      hasLegacyPropsLock ? "" : DEFAULT_FLYER_LOCK,
    ),
    accessoryLock: pickStringField(looseInput?.overrides?.accessoryLock, inferredSpec.accessoryLock),
    locationLock: pickLegacyAwareStringField(
      [looseInput?.overrides?.locationLock, looseInput?.overrides?.locationEnvironment],
      [inferredSpec.locationLock, inferredSpec.locationEnvironment],
      DEFAULT_LOCATION_LOCK,
    ),
    backgroundAnchors: pickStringField(
      looseInput?.overrides?.backgroundAnchors,
      inferredSpec.backgroundAnchors,
      DEFAULT_BACKGROUND_ANCHORS,
    ),
    screenLock: pickStringField(looseInput?.overrides?.screenLock, inferredSpec.screenLock, DEFAULT_SCREEN_LOCK),
    composition: pickStringField(
      looseInput?.overrides?.composition,
      inferredSpec.composition,
      DEFAULT_COMPOSITION,
    ),
    mood: pickStringField(looseInput?.overrides?.mood, inferredSpec.mood, DEFAULT_MOOD),
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
    visualStyle: pickStringField(
      looseInput?.overrides?.visualStyle,
      inferredSpec.visualStyle,
      DEFAULT_VISUAL_STYLE,
    ),
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
    characterLock: clean(sceneSpec?.characterLock?.value),
    outfitLock: clean(sceneSpec?.outfitLock?.value),
    phoneLock: clean(sceneSpec?.phoneLock?.value),
    flyerLock: clean(sceneSpec?.flyerLock?.value),
    accessoryLock: clean(sceneSpec?.accessoryLock?.value),
    locationLock: clean(sceneSpec?.locationLock?.value),
    backgroundAnchors: clean(sceneSpec?.backgroundAnchors?.value),
    screenLock: clean(sceneSpec?.screenLock?.value),
    composition: clean(sceneSpec?.composition?.value),
    mood: clean(sceneSpec?.mood?.value),
    mainCharacterDetails: clean(sceneSpec?.mainCharacterDetails?.value),
    locationEnvironment: clean(sceneSpec?.locationEnvironment?.value),
    propsKeyObjects: clean(sceneSpec?.propsKeyObjects?.value),
    visualStyle: clean(sceneSpec?.visualStyle?.value) || DEFAULT_VISUAL_STYLE,
    cameraFormat: clean(sceneSpec?.cameraFormat?.value) || DEFAULT_CAMERA_FORMAT,
    frameToFrameChanges:
      clean(sceneSpec?.frameToFrameChanges?.value) || DEFAULT_FRAME_TO_FRAME_CHANGES,
    actionSequence: Array.isArray(sceneSpec?.actionSequence?.value)
      ? sceneSpec.actionSequence.value.map((item) => clean(item)).filter(Boolean)
      : [],
    extraNotes: clean(sceneSpec?.extraNotes?.value),
  };
}

function buildPropLockLines(materialized) {
  const lines = [materialized.phoneLock, materialized.flyerLock, materialized.accessoryLock]
    .map((value) => clean(value))
    .filter(Boolean);

  if (lines.length > 0) return lines.map((value) => value);

  const legacyProps = clean(materialized.propsKeyObjects);
  return legacyProps ? [`the same ${legacyProps}`] : [];
}

export function buildCanonicalFramePrompt(sceneSpec, frameDetails) {
  const materialized = materializeSceneSpec(sceneSpec);
  const frameNumber = frameDetails?.frameNumber ?? 1;
  const actionBeat = clean(frameDetails?.actionBeat) || "hold the moment";
  const cameraShot = clean(frameDetails?.cameraShot) || `${materialized.cameraFormat} campaign still`;
  const composition = clean(frameDetails?.composition) || materialized.composition || DEFAULT_COMPOSITION;
  const mood = clean(frameDetails?.mood) || materialized.mood || DEFAULT_MOOD;
  const propLines = buildPropLockLines(materialized);
  const locationLock = clean(materialized.locationLock) || DEFAULT_LOCATION_LOCK;
  const backgroundAnchors = clean(materialized.backgroundAnchors) || DEFAULT_BACKGROUND_ANCHORS;
  const screenLock = clean(materialized.screenLock) || DEFAULT_SCREEN_LOCK;
  const visualStyle = clean(materialized.visualStyle) || DEFAULT_VISUAL_STYLE;
  const notes = clean(materialized.extraNotes);

  return [
    `Frame ${frameNumber} of ${materialized.numberOfFrames}, ${materialized.cameraFormat} image.`,
    "",
    "SCENE:",
    actionBeat.endsWith(".") ? actionBeat : `${actionBeat}.`,
    "",
    "CHARACTER LOCK:",
    `${clean(materialized.characterLock) || DEFAULT_CHARACTER_LOCK}`,
    "",
    "OUTFIT LOCK:",
    `${clean(materialized.outfitLock) || DEFAULT_OUTFIT_LOCK}`,
    "",
    "PROP LOCK:",
    ...propLines,
    "",
    "LOCATION LOCK:",
    `${locationLock}`,
    `The same background anchors: ${backgroundAnchors}.`,
    "",
    "SCREEN LOCK:",
    screenLock.endsWith(".") ? screenLock : `${screenLock}.`,
    "",
    "CAMERA:",
    cameraShot,
    "",
    "COMPOSITION:",
    composition.endsWith(".") ? composition : `${composition}.`,
    "",
    "MOOD:",
    mood.endsWith(".") ? mood : `${mood}.`,
    "",
    "CONTINUITY RULE:",
    DEFAULT_CONTINUITY_RULE,
    "",
    "STYLE:",
    visualStyle,
    "",
    "NEGATIVE:",
    DEFAULT_NEGATIVE_PROMPT,
    notes ? "" : null,
    notes ? `Extra notes: ${notes}.` : null,
  ]
    .filter((value) => value != null)
    .join("\n");
}

export function buildFallbackFramePlan(sceneSpec) {
  const materialized = materializeSceneSpec(sceneSpec);

  return materialized.actionSequence.map((actionBeat, index) => ({
    frameNumber: index + 1,
    title: `Frame ${index + 1}`,
    actionBeat,
    cameraShot: `${materialized.cameraFormat} campaign still`,
    prompt: buildCanonicalFramePrompt(sceneSpec, {
      frameNumber: index + 1,
      actionBeat,
      cameraShot: `${materialized.cameraFormat} campaign still`,
    }),
  }));
}

export function normalizeFramePlan(sceneSpec, rawFrames) {
  const fallback = buildFallbackFramePlan(sceneSpec);
  if (!Array.isArray(rawFrames) || rawFrames.length === 0) return fallback;

  return fallback.map((defaultFrame, index) => {
    const candidate = rawFrames[index] || {};
    return {
      frameNumber: index + 1,
      title: clean(candidate.title) || defaultFrame.title,
      actionBeat: clean(candidate.actionBeat) || defaultFrame.actionBeat,
      cameraShot: clean(candidate.cameraShot) || defaultFrame.cameraShot,
      prompt: buildCanonicalFramePrompt(sceneSpec, {
        frameNumber: index + 1,
        actionBeat: clean(candidate.actionBeat) || defaultFrame.actionBeat,
        cameraShot: clean(candidate.cameraShot) || defaultFrame.cameraShot,
        composition: clean(candidate.composition),
        mood: clean(candidate.mood),
      }),
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
