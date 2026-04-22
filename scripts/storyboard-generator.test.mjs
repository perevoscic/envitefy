import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  DEFAULT_CHARACTER_LOCK,
  DEFAULT_FRAME_COUNT,
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_SCREEN_LOCK,
  DEFAULT_VISUAL_STYLE,
  alignActionSequence,
  buildFallbackFramePlan,
  buildRunPaths,
  normalizeSceneSpec,
  resolveImageSize,
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
  assert.match(frames[0].prompt, /SCENE:/);
  assert.match(frames[0].prompt, /CHARACTER LOCK:/);
  assert.match(frames[0].prompt, /OUTFIT LOCK:/);
  assert.match(frames[0].prompt, /PROP LOCK:/);
  assert.match(frames[0].prompt, /LOCATION LOCK:/);
  assert.match(frames[0].prompt, /SCREEN LOCK:/);
  assert.match(frames[0].prompt, /COMPOSITION:\nphone and flyer in the foreground, mother midground, bright lobby in the background\./);
  assert.match(frames[0].prompt, /MOOD:\ncurious, focused, premium\./);
  assert.match(frames[0].prompt, /notices the flyer/);
  assert.match(frames[1].prompt, /raises her phone to scan it/);
  assert.match(frames[0].prompt, new RegExp(DEFAULT_NEGATIVE_PROMPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
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
