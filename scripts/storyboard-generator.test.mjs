import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  DEFAULT_CHARACTER_LOCK,
  DEFAULT_CONTINUITY_CONTRACT,
  DEFAULT_FRAME_COUNT,
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_SCREEN_LOCK,
  DEFAULT_VISUAL_STYLE,
  alignActionSequence,
  buildFallbackFramePlan,
  buildRunPaths,
  createFramesManifest,
  normalizeFramePlan,
  normalizeSceneSpec,
  resolveImageSize,
  resolveRenderDimensions,
} from "./lib/storyboard-generator.mjs";

test("normalizeSceneSpec defaults to the Envitefy lock values", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a cinematic ad sequence",
      overrides: {},
      extraNotes: "",
    },
    {},
  );

  assert.equal(spec.numberOfFrames.value, DEFAULT_FRAME_COUNT);
  assert.equal(spec.numberOfFrames.source, "default");
  assert.equal(spec.characterLock.value, DEFAULT_CHARACTER_LOCK);
  assert.equal(spec.characterLock.source, "default");
  assert.equal(spec.screenLock.value, DEFAULT_SCREEN_LOCK);
  assert.equal(spec.screenLock.source, "default");
  assert.equal(spec.visualStyle.value, DEFAULT_VISUAL_STYLE);
  assert.equal(spec.visualStyle.source, "default");
  assert.equal(spec.cameraFormat.value, "vertical");
  assert.equal(spec.cameraFormat.source, "default");
  assert.doesNotMatch(spec.flyerLock.value, /gymnastics|gym\b|athlete|medal|trophy/i);
  assert.doesNotMatch(spec.locationLock.value, /gymnastics|gym\b|facility lobby|front desk/i);
  assert.doesNotMatch(spec.backgroundAnchors.value, /gymnastics|gym\b|bulletin board|front desk/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no gym, no gymnastics/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no party setup/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no floating phone/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no phone standing upright/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no open notebook as the main prop/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no offline props for the delay/i);
  assert.match(DEFAULT_NEGATIVE_PROMPT, /no party-decor clutter/i);
  assert.match(spec.screenLock.value, /envitefy-wordmark-email\.png/i);
  assert.match(spec.screenLock.value, /favicon\.png/i);
});

test("normalizeSceneSpec scrubs gymnastics drift from birthday campaigns unless explicitly requested", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a mom fixes a delayed flyer for her daughter's birthday using Envitefy",
      overrides: {},
      extraNotes: "",
    },
    {
      locationLock: "bright gymnastics facility lobby with athlete posters and medals",
      flyerLock: "colorful gymnastics meet flyer",
      backgroundAnchors: "front desk, trophies, gymnastics bulletin board",
      composition: "mother in a gymnastics lobby holding a flyer",
      propsKeyObjects: "smartphone and gymnastics flyer",
    },
  );

  assert.equal(spec.locationLock.source, "birthday-safety");
  assert.equal(spec.flyerLock.source, "birthday-safety");
  assert.doesNotMatch(spec.locationLock.value, /facility lobby|athlete|medal|trophy|Bright Stars/i);
  assert.doesNotMatch(spec.flyerLock.value, /gymnastics meet|athlete|medal|trophy|Bright Stars/i);
  assert.match(spec.propsKeyObjects.value, /live birthday card/i);
});

test("normalizeSceneSpec prefers overrides and maps legacy fields into lock fields", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a woman scans a flyer",
      overrides: {
        numberOfFrames: 6,
        outfitLock: "the same navy blazer, dark jeans, white sneakers",
        mainCharacterDetails: "mom in casual modern clothes",
        locationEnvironment: "gymnastics meet venue lobby",
        visualStyle: "realistic cinematic startup ad photography",
        cameraFormat: "square",
      },
      extraNotes: "keep it clean",
    },
    {
      numberOfFrames: 10,
      visualStyle: "editorial lifestyle",
      cameraFormat: "vertical",
    },
  );

  assert.equal(spec.numberOfFrames.value, 6);
  assert.equal(spec.numberOfFrames.source, "user");
  assert.equal(spec.characterLock.value, "mom in casual modern clothes");
  assert.equal(spec.characterLock.source, "user");
  assert.equal(spec.locationLock.value, "gymnastics meet venue lobby");
  assert.equal(spec.locationLock.source, "user");
  assert.equal(spec.outfitLock.value, "the same navy blazer, dark jeans, white sneakers");
  assert.equal(spec.outfitLock.source, "user");
  assert.equal(spec.visualStyle.value, "realistic cinematic startup ad photography");
  assert.equal(spec.visualStyle.source, "user");
  assert.equal(spec.cameraFormat.value, "square");
  assert.equal(spec.cameraFormat.source, "user");
  assert.equal(spec.extraNotes.value, "keep it clean");
  assert.equal(spec.extraNotes.source, "user");
});

test("alignActionSequence truncates or pads to the requested frame count", () => {
  assert.deepEqual(alignActionSequence(["one", "two", "three"], 2), ["one", "two"]);

  const padded = alignActionSequence(["enter venue", "notice flyer"], 4);
  assert.equal(padded.length, 4);
  assert.deepEqual(padded.slice(0, 2), ["enter venue", "notice flyer"]);
});

test("buildFallbackFramePlan emits the sectioned lock prompt format", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a mom at a gymnastics meet scans a flyer",
      overrides: {
        numberOfFrames: 2,
        cameraFormat: "vertical",
        actionSequence: ["notices the flyer", "raises her phone to scan it"],
        composition: "phone and flyer in the foreground, mother midground, bright lobby in the background",
        mood: "curious, focused, premium",
      },
      extraNotes: "",
    },
    {},
  );

  const frames = buildFallbackFramePlan(spec);
  assert.equal(frames.length, 2);
  assert.match(frames[0].prompt, /^Frame 1 of 2, vertical image\./);
  assert.match(
    frames[0].prompt,
    new RegExp(DEFAULT_CONTINUITY_CONTRACT.split("\n")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.match(frames[0].prompt, /SCENE:/);
  assert.match(frames[0].prompt, /CHARACTER LOCK:/);
  assert.match(frames[0].prompt, /OUTFIT LOCK:/);
  assert.match(frames[0].prompt, /PROP LOCK:/);
  assert.match(frames[0].prompt, /LOCATION LOCK:/);
  assert.match(frames[0].prompt, /SCREEN LOCK:/);
  assert.match(frames[0].prompt, /envitefy-wordmark-email\.png/i);
  assert.match(frames[0].prompt, /favicon\.png/i);
  assert.match(frames[0].prompt, /COMPOSITION:\nphone and flyer in the foreground, mother midground, bright lobby in the background\./);
  assert.match(frames[0].prompt, /MOOD:\ncurious, focused, premium\./);
  assert.match(frames[0].prompt, /notices the flyer/);
  assert.match(frames[1].prompt, /raises her phone to scan it/);
  assert.match(frames[0].prompt, /Now generate the requested frame using the following fixed continuity details and scene content\./);
  assert.match(frames[0].prompt, new RegExp(DEFAULT_NEGATIVE_PROMPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("canonical birthday frame prompts require supported phones and natural paper orientation", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a mom creates a live card for her daughter's birthday after printed flyers are delayed",
      overrides: {
        numberOfFrames: 1,
        actionSequence: ["she enters the birthday details into Envitefy"],
      },
      extraNotes: "",
    },
    {},
  );

  const [frame] = buildFallbackFramePlan(spec);

  assert.match(frame.prompt, /PHYSICAL PROP RULES:/);
  assert.match(frame.prompt, /never show a phone floating/i);
  assert.match(frame.prompt, /place the phone flat on the table/i);
  assert.match(frame.prompt, /show delay only as a modern digital signal/i);
  assert.match(frame.prompt, /avoid open notebooks and planner pages/i);
  assert.match(frame.prompt, /facing the main character's natural reading direction/i);
  assert.match(frame.prompt, /BIRTHDAY SAFETY RULES:/);
  assert.match(frame.prompt, /before the party/i);
  assert.match(frame.prompt, /Do not show gymnastics/i);
  assert.match(frame.prompt, /Keep the home ordinary and pre-event/i);
  assert.match(frame.prompt, /digital Envitefy live birthday card/i);
});

test("legacy props input still appears in prop lock when explicit lock fields are absent", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a mom reviews the event handout",
      overrides: {
        numberOfFrames: 1,
        propsKeyObjects: "smartphone and flyer",
        actionSequence: ["reviews the flyer before scanning it"],
      },
      extraNotes: "",
    },
    {},
  );

  const [frame] = buildFallbackFramePlan(spec);
  assert.match(frame.prompt, /PROP LOCK:\n(?:.*\n)*the same smartphone and flyer/);
});

test("frame plans retain composition and mood metadata", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a founder reviews the campaign frames",
      overrides: {
        numberOfFrames: 1,
        composition: "phone in the foreground, founder centered, bright studio behind",
        mood: "confident, polished, premium",
        actionSequence: ["reviews the frame plan"],
      },
      extraNotes: "",
    },
    {},
  );

  const [frame] = buildFallbackFramePlan(spec);
  assert.equal(frame.composition, "phone in the foreground, founder centered, bright studio behind");
  assert.equal(frame.mood, "confident, polished, premium");
});

test("fallback frame plans use conversion roles and varied default shot families", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a founder reviews the campaign frames",
      overrides: {
        numberOfFrames: 5,
      },
      extraNotes: "",
    },
    {},
  );

  const frames = buildFallbackFramePlan(spec);
  assert.equal(frames[0].persuasionRole, "hook");
  assert.equal(frames[4].persuasionRole, "product-entry");
  assert.match(frames[0].cameraShot, /wide environmental hook shot/);
  assert.match(frames[1].cameraShot, /tight problem-detail insert/);
  assert.match(frames[2].mustDifferFromPrevious, /change the shot family/i);
  assert.equal(frames[0].shotFamily, "wide-environment");
  assert.equal(frames[0].phoneDominance, "none");
  assert.equal(frames[4].brandingPresence, "subtle");
  assert.equal(frames[0].disallowedPropRisk, "");
});

test("normalizeFramePlan preserves structured shot metadata", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a founder reviews the campaign frames",
      overrides: {
        numberOfFrames: 2,
      },
      extraNotes: "",
    },
    {},
  );

  const frames = normalizeFramePlan(spec, [
    {
      title: "context",
      actionBeat: "reviews a cluttered table",
      cameraShot: "wide context",
      composition: "wide room with phone secondary",
      mood: "focused",
      persuasionRole: "hook",
      screenState: "no screen proof",
      propFocus: "planning table",
      emotionalBeat: "pressure",
      proofTarget: "show pain",
      mustDifferFromPrevious: "baseline",
      shotFamily: "wide-environment",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "",
    },
    {
      title: "proof",
      actionBeat: "checks the finished invite",
      cameraShot: "angled close-up",
      composition: "phone angled on counter",
      mood: "relieved",
      persuasionRole: "proof",
      screenState: "finished page",
      propFocus: "phone",
      emotionalBeat: "confidence",
      proofTarget: "show result",
      mustDifferFromPrevious: "change angle",
      shotFamily: "phone-proof",
      phoneDominance: "dominant",
      brandingPresence: "screen",
      disallowedPropRisk: "",
    },
  ]);

  assert.equal(frames[0].shotFamily, "wide-environment");
  assert.equal(frames[0].phoneDominance, "none");
  assert.equal(frames[1].shotFamily, "phone-proof");
  assert.equal(frames[1].phoneDominance, "dominant");
  assert.equal(frames[1].brandingPresence, "screen");
  assert.match(frames[1].prompt, /SHOT INTENT:/);
});

test("createFramesManifest includes caption and captioned image placeholders", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a founder reviews the campaign frames",
      overrides: {
        numberOfFrames: 1,
        actionSequence: ["reviews the frame plan"],
      },
      extraNotes: "",
    },
    {},
  );
  const runPaths = buildRunPaths("/tmp/envitefy", {
    timestamp: "20260421-111500",
    rawPrompt: "review campaign frames",
  });
  const manifest = createFramesManifest(runPaths, spec, buildFallbackFramePlan(spec), {
    textModel: "gpt-5.4-mini",
    imageModel: "gpt-image-2",
  });

  assert.equal(manifest.frames[0].captionedImageFile, path.join("images-captioned", "frame-01.png"));
  assert.equal(manifest.frames[0].shotFamily, "wide-environment");
  assert.equal(manifest.frames[0].phoneDominance, "none");
  assert.equal(manifest.frames[0].caption.text, "");
  assert.equal(manifest.frames[0].caption.status, "pending");
  assert.equal(manifest.frames[0].caption.dirty, true);
  assert.deepEqual(manifest.renderSize, {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    cameraFormat: "vertical",
  });
});

test("run paths use timestamp-slug folders and prefer job labels for slugs", () => {
  const projectRoot = "/tmp/envitefy";
  const fromJob = buildRunPaths(projectRoot, {
    timestamp: "20260421-093000",
    jobLabel: "Gymnastics Scan Ad",
    rawPrompt: "ignored prompt text",
  });
  assert.equal(
    fromJob.runDir,
    path.join(projectRoot, "qa-artifacts", "storyboard-runs", "20260421-093000-gymnastics-scan-ad"),
  );

  const fromPrompt = buildRunPaths(projectRoot, {
    timestamp: "20260421-093100",
    rawPrompt: "A woman scans a flyer at a gymnastics meet",
  });
  assert.match(fromPrompt.runDir, /20260421-093100-a-woman-scans-a-flyer-at-a-gymnastics-meet$/);
});

test("resolveImageSize maps camera formats to OpenAI sizes", () => {
  assert.equal(resolveImageSize("vertical"), "1024x1536");
  assert.equal(resolveImageSize("horizontal"), "1536x1024");
  assert.equal(resolveImageSize("square"), "1024x1024");
});

test("resolveRenderDimensions maps campaign formats to exact output sizes", () => {
  assert.deepEqual(resolveRenderDimensions("vertical"), {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    cameraFormat: "vertical",
  });
  assert.deepEqual(resolveRenderDimensions("horizontal"), {
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    cameraFormat: "horizontal",
  });
  assert.deepEqual(resolveRenderDimensions("square"), {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    cameraFormat: "square",
  });
});
