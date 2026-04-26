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
  "the same small delayed invitation order notice and birthday planning notes, kept secondary and not used as readable hero props";
export const DEFAULT_LOCATION_LOCK =
  "the same modern home kitchen and living room planning space with warm daylight, a table or counter, subtle birthday planning details, and no party already underway";
export const DEFAULT_BACKGROUND_ANCHORS =
  "home kitchen or living room, table or counter, warm daylight, small planning notes, subtle birthday details";
export const DEFAULT_SCREEN_LOCK =
  "the same clean Envitefy mobile event page, modern white interface, simple typography, the Envitefy wordmark in the header matching public/email/envitefy-wordmark-email.png, and the Envitefy app icon matching public/favicon.png anywhere a launcher icon, favicon, or small app badge appears";
export const DEFAULT_COMPOSITION =
  "varied candid vertical ad frames mixing home environment, tabletop detail, over-the-shoulder action, supported phone proof, and final digital live-card result";
export const DEFAULT_MOOD = "focused, modern, warm, premium";
export const DEFAULT_CONTINUITY_RULE =
  "This must look like the same ad campaign sequence as the previous frames, keeping the same character, same outfit, same props, same flyer, same environment, same lighting, same branding, and same premium commercial aesthetic.";
export const DEFAULT_NEGATIVE_PROMPT =
  "no character change, no wardrobe change, no different location, no different phone, no split image, no collage, no watermark, no floating text, no garbled readable text on paper props, no gym, no gymnastics, no sports venue, no dance studio, no studio lobby, no trophies, no medals, no athlete posters, no physical birthday cake unless explicitly requested, no completed party scene, no children unless explicitly requested, no floating phone, no camera-facing notebook staging, no upside-down planner text from the character's perspective, single frame only.";
export const DEFAULT_CONTINUITY_CONTRACT = `You are generating a sequence of highly consistent images for a visual story.

Your goal is to preserve continuity across all frames.

Global continuity rules:
- Keep the same main character identity in every image.
- Keep the same face, age, hairstyle, body type, and overall appearance unless a change is explicitly requested.
- Keep the same outfit in every image unless a change is explicitly requested.
- Keep the same environment and layout across all frames unless a change is explicitly requested.
- Keep the same props and key objects consistent across all frames.
- Keep the same photographic style, color tone, lighting style, and mood across all frames.
- Keep the same framing style unless a change is explicitly requested.
- Make each frame feel like part of the same short cinematic ad or photo sequence.
- Preserve realism and visual continuity.

Output requirements:
- Generate the image based on the scene description provided.
- Follow the scene-specific action carefully.
- Do not redesign the character, room, or objects.
- Only change the action, pose, expression, and small camera shift needed for that scene.
- Maintain a premium, polished, believable visual style.

Now generate the requested frame using the following fixed continuity details and scene content.`;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullable(value) {
  const normalized = clean(value);
  return normalized || null;
}

const BIRTHDAY_CONTEXT_REGEX = /\b(birthday|daughter'?s birthday|son'?s birthday|birthday party)\b/i;
const GYMNASTICS_CONTEXT_REGEX = /\b(gymnastics|gymnast|gym\b|sports?\s+venue|athlete|meet\b|trophy|medal|dance studio)\b/i;

function isBirthdayCampaign(looseInput = {}) {
  const haystack = [
    looseInput.rawPrompt,
    looseInput.overrides?.targetVertical,
    looseInput.overrides?.category,
    looseInput.extraNotes,
  ]
    .map((value) => clean(value))
    .filter(Boolean)
    .join("\n");
  return BIRTHDAY_CONTEXT_REGEX.test(haystack);
}

function explicitlyAllowsGymnastics(looseInput = {}) {
  const haystack = [
    looseInput.rawPrompt,
    looseInput.extraNotes,
    looseInput.overrides?.targetVertical,
    looseInput.overrides?.locationLock,
    looseInput.overrides?.locationEnvironment,
    looseInput.overrides?.flyerLock,
    looseInput.overrides?.propsKeyObjects,
  ]
    .map((value) => clean(value))
    .filter(Boolean)
    .join("\n");
  return GYMNASTICS_CONTEXT_REGEX.test(haystack);
}

function containsGymnasticsDrift(value) {
  return GYMNASTICS_CONTEXT_REGEX.test(clean(value));
}

function birthdayDefaultForField(fieldName, defaultValue) {
  const birthdayDefaults = {
    flyerLock:
      "one small delayed invitation order notice and simple birthday planning notes, kept secondary; no big readable flyer headline, no duplicate printed flyers, and no sports or activity-venue content",
    locationLock:
      "the same modern home kitchen and living room planning space with warm daylight, a table or counter, subtle birthday planning details, and no party already underway",
    backgroundAnchors:
      "home kitchen or living room, table or counter, warm daylight, small planning notes, subtle birthday details, no gym or sports decor",
    composition:
      "varied candid vertical ad frames showing the pre-party problem, supported phone product proof, and the digital Envitefy live-card result; no completed party scene",
    propsKeyObjects:
      "same supported smartphone, small birthday planning checklist, one small delayed-order notice, and the digital Envitefy live birthday card as the final result",
  };
  return birthdayDefaults[fieldName] || defaultValue;
}

function pickBirthdayAwareStringField(looseInput, fieldName, overrideValue, inferredValue, defaultValue = "") {
  const override = clean(overrideValue);
  if (override) return toSourceValue(override, "user");

  const birthdayCampaign = isBirthdayCampaign(looseInput);
  const allowGymnastics = explicitlyAllowsGymnastics(looseInput);
  const birthdayDefault = birthdayDefaultForField(fieldName, defaultValue);
  const inferred = clean(inferredValue);
  if (inferred && !(birthdayCampaign && !allowGymnastics && containsGymnasticsDrift(inferred))) {
    return toSourceValue(inferred, "inferred");
  }
  if (birthdayCampaign) return toSourceValue(birthdayDefault, inferred ? "birthday-safety" : "default");

  const fallback = clean(defaultValue);
  if (fallback) return toSourceValue(fallback, "default");
  return toSourceValue("", "empty");
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
    "the high-stakes moment hits in the real environment",
    "the mess or friction is visible in specific proof",
    "outside pressure or social stakes escalate the tension",
    "the character reaches a decision point instead of circling",
    "the product enters the scene with intent",
    "capture turns the messy source into clean input",
    "the event or page takes visible shape",
    "the result looks polished and send-ready",
    "confidence replaces hesitation in the room",
    "single final payoff frame with the CTA",
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

function pickStoryboardDefault(list, index, fallback) {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  return clean(list[index]) || fallback;
}

const SHOT_FAMILIES = new Set([
  "wide-environment",
  "environment-detail",
  "hands-action",
  "over-shoulder",
  "phone-proof",
  "reaction",
  "social-proof",
  "final-hero",
]);

const PHONE_DOMINANCE_VALUES = new Set(["none", "secondary", "dominant"]);
const BRANDING_PRESENCE_VALUES = new Set(["none", "subtle", "screen", "hero"]);

function normalizeEnumValue(value, allowedValues, fallback) {
  const normalized = clean(value).toLowerCase();
  return allowedValues.has(normalized) ? normalized : fallback;
}

function buildDefaultFrameMetadata(frameCount) {
  const roles = alignActionSequence(
    [
      "hook",
      "pain-proof",
      "chaos-escalation",
      "decision-point",
      "product-entry",
      "capture-proof",
      "creation-proof",
      "send-ready-proof",
      "emotional-release",
      "final-payoff",
    ],
    frameCount,
  );

  const shots = alignActionSequence(
    [
      "wide environmental hook shot",
      "tight problem-detail insert",
      "over-the-shoulder pressure shot",
      "profile reaction medium shot",
      "clean product-entry close-up",
      "hands-in-action capture close-up",
      "three-quarter progress reveal",
      "balanced send-ready proof shot",
      "relief portrait medium shot",
      "hero payoff end-card shot",
    ],
    frameCount,
  );

  const shotFamilies = alignActionSequence(
    [
      "wide-environment",
      "environment-detail",
      "reaction",
      "hands-action",
      "over-shoulder",
      "phone-proof",
      "social-proof",
      "phone-proof",
      "reaction",
      "final-hero",
    ],
    frameCount,
  );

  const phoneDominance = alignActionSequence(
    [
      "none",
      "none",
      "secondary",
      "secondary",
      "secondary",
      "dominant",
      "secondary",
      "dominant",
      "none",
      "none",
    ],
    frameCount,
  );

  const brandingPresence = alignActionSequence(
    [
      "none",
      "none",
      "none",
      "none",
      "subtle",
      "screen",
      "subtle",
      "screen",
      "none",
      "hero",
    ],
    frameCount,
  );

  const screenStates = alignActionSequence(
    [
      "problem context with no clean output yet",
      "messy or incomplete source proof",
      "pressure is visible and the task still feels unresolved",
      "the decision to use the product is about to happen",
      "the product is now visible and usable",
      "capture is converting the messy source into clean structured input",
      "the draft event or page is visibly taking shape",
      "the final result reads as polished and send-ready",
      "the product has removed uncertainty and the user is emotionally calmer",
      "single final CTA or payoff state only",
    ],
    frameCount,
  );

  const propFocus = alignActionSequence(
    [
      "environment and people stakes over the phone",
      "the messy proof artifact or source material",
      "pressure props that show why the moment matters now",
      "the person deciding what to do next",
      "the product entry moment without over-explaining the UI",
      "hands, source material, and capture proof",
      "the emerging result on screen plus one supporting prop",
      "the polished result rather than the mechanism",
      "the person and the emotional release in the room",
      "brand and payoff with no duplicate end card",
    ],
    frameCount,
  );

  const emotionalBeats = alignActionSequence(
    [
      "tension",
      "friction",
      "pressure",
      "decision",
      "relief begins",
      "control",
      "confidence building",
      "certainty",
      "relief",
      "conversion",
    ],
    frameCount,
  );

  const proofTargets = alignActionSequence(
    [
      "show why the moment matters right now",
      "prove the pain with concrete visual evidence",
      "show the cost of staying stuck",
      "make the turn toward the product feel earned",
      "introduce the product clearly",
      "prove the product action",
      "prove the event creation or page-building result",
      "prove the result is send-ready",
      "prove the emotional transformation",
      "land the single final payoff and CTA",
    ],
    frameCount,
  );

  return {
    roles,
    shots,
    shotFamilies,
    phoneDominance,
    brandingPresence,
    screenStates,
    propFocus,
    emotionalBeats,
    proofTargets,
  };
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
    flyerLock: pickBirthdayAwareStringField(
      looseInput,
      "flyerLock",
      looseInput?.overrides?.flyerLock,
      inferredSpec.flyerLock,
      hasLegacyPropsLock ? "" : DEFAULT_FLYER_LOCK,
    ),
    accessoryLock: pickStringField(looseInput?.overrides?.accessoryLock, inferredSpec.accessoryLock),
    locationLock: pickBirthdayAwareStringField(
      looseInput,
      "locationLock",
      looseInput?.overrides?.locationLock || looseInput?.overrides?.locationEnvironment,
      inferredSpec.locationLock || inferredSpec.locationEnvironment,
      DEFAULT_LOCATION_LOCK,
    ),
    backgroundAnchors: pickBirthdayAwareStringField(
      looseInput,
      "backgroundAnchors",
      looseInput?.overrides?.backgroundAnchors,
      inferredSpec.backgroundAnchors,
      DEFAULT_BACKGROUND_ANCHORS,
    ),
    screenLock: pickStringField(looseInput?.overrides?.screenLock, inferredSpec.screenLock, DEFAULT_SCREEN_LOCK),
    composition: pickBirthdayAwareStringField(
      looseInput,
      "composition",
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
    propsKeyObjects: pickBirthdayAwareStringField(
      looseInput,
      "propsKeyObjects",
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
    environmentStrategy: pickStringField("", inferredSpec.environmentStrategy, ""),
    propPriority: pickStringField("", inferredSpec.propPriority, ""),
    disallowedProps: pickStringField("", inferredSpec.disallowedProps, ""),
    screenProofRequirements: pickStringField("", inferredSpec.screenProofRequirements, ""),
    visualArc: pickStringField("", inferredSpec.visualArc, ""),
    identityLock: pickStringField("", inferredSpec.identityLock, ""),
    appearanceLock: pickStringField("", inferredSpec.appearanceLock, ""),
    environmentLayoutLock: pickStringField("", inferredSpec.environmentLayoutLock, ""),
    propContinuityLock: pickStringField("", inferredSpec.propContinuityLock, ""),
    styleContinuityLock: pickStringField("", inferredSpec.styleContinuityLock, ""),
    framingBaseline: pickStringField("", inferredSpec.framingBaseline, ""),
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
    environmentStrategy: clean(sceneSpec?.environmentStrategy?.value),
    propPriority: clean(sceneSpec?.propPriority?.value),
    disallowedProps: clean(sceneSpec?.disallowedProps?.value),
    screenProofRequirements: clean(sceneSpec?.screenProofRequirements?.value),
    visualArc: clean(sceneSpec?.visualArc?.value),
    identityLock: clean(sceneSpec?.identityLock?.value),
    appearanceLock: clean(sceneSpec?.appearanceLock?.value),
    environmentLayoutLock: clean(sceneSpec?.environmentLayoutLock?.value),
    propContinuityLock: clean(sceneSpec?.propContinuityLock?.value),
    styleContinuityLock: clean(sceneSpec?.styleContinuityLock?.value),
    framingBaseline: clean(sceneSpec?.framingBaseline?.value),
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
  const shotFamily = clean(frameDetails?.shotFamily);
  const phoneDominance = clean(frameDetails?.phoneDominance);
  const brandingPresence = clean(frameDetails?.brandingPresence);
  const propLines = buildPropLockLines(materialized);
  const locationLock = clean(materialized.locationLock) || DEFAULT_LOCATION_LOCK;
  const backgroundAnchors = clean(materialized.backgroundAnchors) || DEFAULT_BACKGROUND_ANCHORS;
  const screenLock = clean(materialized.screenLock) || DEFAULT_SCREEN_LOCK;
  const visualStyle = clean(materialized.visualStyle) || DEFAULT_VISUAL_STYLE;
  const notes = clean(materialized.extraNotes);
  const birthdayCampaign = BIRTHDAY_CONTEXT_REGEX.test(materialized.rawPrompt);
  const physicalPropRules = [
    "Phone physics: any phone must be visibly held by a hand with natural fingers around it or physically resting flat/supported on a table, counter, or stand; never show a phone floating in air.",
    "Paper orientation: notebooks, planners, receipts, notices, and papers must face the main character's natural reading direction, not be staged toward the camera; avoid upside-down writing from her perspective.",
    "Paper text discipline: paper prop text should be partial, minimal, or unreadable unless the scene explicitly requires a readable UI-like proof.",
  ];
  const birthdaySafetyRules = birthdayCampaign
    ? [
        "Birthday campaign safety: this is before the party; show the mother solving an invitation delay, not hosting a party already in progress.",
        "Do not show gymnastics, gym facilities, sports venues, dance studios, athlete posters, trophies, medals, or invented venues such as Bright Stars Gymnastics.",
        "Do not show a physical birthday cake, completed party table, or children unless the user's prompt explicitly requests them.",
        "The final result is the digital Envitefy live birthday card or share confirmation, not a printed flyer or party scene.",
      ]
    : [];
  const continuityDetails = [
    `Main character identity: ${clean(materialized.characterLock) || DEFAULT_CHARACTER_LOCK}.`,
    `Overall appearance: ${clean(materialized.appearanceLock) || clean(materialized.characterLock) || DEFAULT_CHARACTER_LOCK}.`,
    `Outfit: ${clean(materialized.outfitLock) || DEFAULT_OUTFIT_LOCK}.`,
    `Environment and layout: ${clean(materialized.environmentLayoutLock) || locationLock}.`,
    `Props and key objects: ${clean(materialized.propContinuityLock) || propLines.join(", ")}.`,
    `Photographic style and mood: ${clean(materialized.styleContinuityLock) || `${visualStyle} ${mood}`}.`,
    `Framing baseline: ${clean(materialized.framingBaseline) || composition}.`,
    clean(materialized.identityLock),
    clean(materialized.environmentStrategy),
    clean(materialized.propPriority) ? `Prop priority: ${clean(materialized.propPriority)}.` : "",
    clean(materialized.disallowedProps) ? `Disallowed props: ${clean(materialized.disallowedProps)}.` : "",
    clean(materialized.screenProofRequirements)
      ? `Screen proof requirements: ${clean(materialized.screenProofRequirements)}.`
      : "",
    clean(materialized.visualArc) ? `Visual arc: ${clean(materialized.visualArc)}.` : "",
  ].filter(Boolean);

  return [
    `Frame ${frameNumber} of ${materialized.numberOfFrames}, ${materialized.cameraFormat} image.`,
    "",
    "CONTINUITY CONTRACT:",
    DEFAULT_CONTINUITY_CONTRACT,
    "",
    "FIXED CONTINUITY DETAILS:",
    ...continuityDetails,
    "",
    "PHYSICAL PROP RULES:",
    ...physicalPropRules,
    birthdaySafetyRules.length ? "" : null,
    birthdaySafetyRules.length ? "BIRTHDAY SAFETY RULES:" : null,
    ...birthdaySafetyRules,
    "",
    "Now generate the requested frame using the following fixed continuity details and scene content.",
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
    shotFamily || phoneDominance || brandingPresence ? "" : null,
    shotFamily || phoneDominance || brandingPresence ? "SHOT INTENT:" : null,
    shotFamily ? `Shot family: ${shotFamily}.` : null,
    phoneDominance ? `Phone dominance: ${phoneDominance}.` : null,
    brandingPresence ? `Branding presence: ${brandingPresence}.` : null,
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
  const defaults = buildDefaultFrameMetadata(materialized.actionSequence.length);

  return materialized.actionSequence.map((actionBeat, index) => ({
    frameNumber: index + 1,
    title: `Frame ${index + 1}`,
    actionBeat,
    cameraShot:
      `${materialized.cameraFormat} ${pickStoryboardDefault(
        defaults.shots,
        index,
        "campaign still",
      )}`,
    composition: materialized.composition || DEFAULT_COMPOSITION,
    mood: materialized.mood || DEFAULT_MOOD,
    persuasionRole: pickStoryboardDefault(defaults.roles, index, "progression"),
    screenState: pickStoryboardDefault(defaults.screenStates, index, "same product world, advancing state"),
    propFocus:
      clean(materialized.propPriority) ||
      pickStoryboardDefault(defaults.propFocus, index, "same core props with tighter emphasis per frame"),
    emotionalBeat: pickStoryboardDefault(defaults.emotionalBeats, index, "transition"),
    proofTarget: pickStoryboardDefault(defaults.proofTargets, index, "move closer to product proof"),
    mustDifferFromPrevious:
      index === 0
        ? "establish the baseline world"
        : "change the shot family, action, pose, expression, screen state, prop focus, or camera distance without redesigning the scene",
    shotFamily: normalizeEnumValue(
      pickStoryboardDefault(defaults.shotFamilies, index, "environment-detail"),
      SHOT_FAMILIES,
      "environment-detail",
    ),
    phoneDominance: normalizeEnumValue(
      pickStoryboardDefault(defaults.phoneDominance, index, "secondary"),
      PHONE_DOMINANCE_VALUES,
      "secondary",
    ),
    brandingPresence: normalizeEnumValue(
      pickStoryboardDefault(defaults.brandingPresence, index, "none"),
      BRANDING_PRESENCE_VALUES,
      "none",
    ),
    disallowedPropRisk: "",
    prompt: buildCanonicalFramePrompt(sceneSpec, {
      frameNumber: index + 1,
      actionBeat,
      cameraShot:
        `${materialized.cameraFormat} ${pickStoryboardDefault(
          defaults.shots,
          index,
          "campaign still",
        )}`,
      composition: materialized.composition || DEFAULT_COMPOSITION,
      mood: materialized.mood || DEFAULT_MOOD,
      shotFamily: normalizeEnumValue(
        pickStoryboardDefault(defaults.shotFamilies, index, "environment-detail"),
        SHOT_FAMILIES,
        "environment-detail",
      ),
      phoneDominance: normalizeEnumValue(
        pickStoryboardDefault(defaults.phoneDominance, index, "secondary"),
        PHONE_DOMINANCE_VALUES,
        "secondary",
      ),
      brandingPresence: normalizeEnumValue(
        pickStoryboardDefault(defaults.brandingPresence, index, "none"),
        BRANDING_PRESENCE_VALUES,
        "none",
      ),
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
      composition: clean(candidate.composition) || clean(defaultFrame.composition) || DEFAULT_COMPOSITION,
      mood: clean(candidate.mood) || clean(defaultFrame.mood) || DEFAULT_MOOD,
      persuasionRole: clean(candidate.persuasionRole) || clean(defaultFrame.persuasionRole),
      screenState: clean(candidate.screenState) || clean(defaultFrame.screenState),
      propFocus: clean(candidate.propFocus) || clean(defaultFrame.propFocus),
      emotionalBeat: clean(candidate.emotionalBeat) || clean(defaultFrame.emotionalBeat),
      proofTarget: clean(candidate.proofTarget) || clean(defaultFrame.proofTarget),
      mustDifferFromPrevious:
        clean(candidate.mustDifferFromPrevious) || clean(defaultFrame.mustDifferFromPrevious),
      shotFamily: normalizeEnumValue(candidate.shotFamily, SHOT_FAMILIES, defaultFrame.shotFamily),
      phoneDominance: normalizeEnumValue(
        candidate.phoneDominance,
        PHONE_DOMINANCE_VALUES,
        defaultFrame.phoneDominance,
      ),
      brandingPresence: normalizeEnumValue(
        candidate.brandingPresence,
        BRANDING_PRESENCE_VALUES,
        defaultFrame.brandingPresence,
      ),
      disallowedPropRisk: clean(candidate.disallowedPropRisk),
      prompt: buildCanonicalFramePrompt(sceneSpec, {
        frameNumber: index + 1,
        actionBeat: clean(candidate.actionBeat) || defaultFrame.actionBeat,
        cameraShot: clean(candidate.cameraShot) || defaultFrame.cameraShot,
        composition:
          clean(candidate.composition) || clean(defaultFrame.composition) || DEFAULT_COMPOSITION,
        mood: clean(candidate.mood) || clean(defaultFrame.mood) || DEFAULT_MOOD,
        shotFamily: normalizeEnumValue(candidate.shotFamily, SHOT_FAMILIES, defaultFrame.shotFamily),
        phoneDominance: normalizeEnumValue(
          candidate.phoneDominance,
          PHONE_DOMINANCE_VALUES,
          defaultFrame.phoneDominance,
        ),
        brandingPresence: normalizeEnumValue(
          candidate.brandingPresence,
          BRANDING_PRESENCE_VALUES,
          defaultFrame.brandingPresence,
        ),
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

export function resolveRenderDimensions(cameraFormat) {
  const normalized = normalizeCameraFormat(cameraFormat) || DEFAULT_CAMERA_FORMAT;
  if (normalized === "horizontal") {
    return { width: 1920, height: 1080, aspectRatio: "16:9", cameraFormat: "horizontal" };
  }
  if (normalized === "square") {
    return { width: 1080, height: 1080, aspectRatio: "1:1", cameraFormat: "square" };
  }
  return { width: 1080, height: 1920, aspectRatio: "9:16", cameraFormat: "vertical" };
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

export function createFramesManifest(runPaths, sceneSpec, frames, models) {
  return {
    generatedAt: new Date().toISOString(),
    run: {
      outputRoot: runPaths.outputRoot,
      runDir: runPaths.runDir,
      imagesDir: runPaths.imagesDir,
      captionedImagesDir: runPaths.captionedImagesDir,
      slug: runPaths.slug,
      timestamp: runPaths.timestamp,
    },
    models,
    imageSize: resolveImageSize(sceneSpec?.cameraFormat?.value),
    renderSize: resolveRenderDimensions(sceneSpec?.cameraFormat?.value),
    sceneSpec: materializeSceneSpec(sceneSpec),
    frames: frames.map((frame) => ({
      ...frame,
      composition: clean(frame.composition),
      mood: clean(frame.mood),
      shotFamily: clean(frame.shotFamily),
      phoneDominance: clean(frame.phoneDominance),
      brandingPresence: clean(frame.brandingPresence),
      disallowedPropRisk: clean(frame.disallowedPropRisk),
      imageFile:
        clean(frame.imageFile) || path.join("images", `frame-${String(frame.frameNumber).padStart(2, "0")}.png`),
      captionedImageFile:
        clean(frame.captionedImageFile) ||
        path.join("images-captioned", `frame-${String(frame.frameNumber).padStart(2, "0")}.png`),
      status: clean(frame.status) || "pending",
      error: cleanNullable(frame.error),
      effectiveImageModel: cleanNullable(frame.effectiveImageModel),
      caption: {
        text: clean(frame.caption?.text),
        emphasisWord: clean(frame.caption?.emphasisWord),
        voiceover: clean(frame.caption?.voiceover),
        durationSec:
          typeof frame.caption?.durationSec === "number" && Number.isFinite(frame.caption.durationSec)
            ? frame.caption.durationSec
            : null,
        transition: clean(frame.caption?.transition),
        kineticStyle: clean(frame.caption?.kineticStyle),
        captionRole: clean(frame.caption?.captionRole),
        status: clean(frame.caption?.status) || "pending",
        dirty: frame.caption?.dirty !== false,
        updatedAt: cleanNullable(frame.caption?.updatedAt),
      },
    })),
  };
}
