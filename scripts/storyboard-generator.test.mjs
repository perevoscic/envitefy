import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  DEFAULT_FRAME_COUNT,
  alignActionSequence,
  buildFallbackFramePlan,
  buildRunPaths,
  normalizeSceneSpec,
  resolveImageSize,
} from "./lib/storyboard-generator.mjs";

test("normalizeSceneSpec defaults frame count to 10 and leaves unsupported fields empty", () => {
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
  assert.equal(spec.mainCharacterDetails.value, "");
  assert.equal(spec.mainCharacterDetails.source, "empty");
  assert.equal(spec.visualStyle.value, "");
  assert.equal(spec.visualStyle.source, "empty");
  assert.equal(spec.cameraFormat.value, "vertical");
  assert.equal(spec.cameraFormat.source, "default");
});

test("normalizeSceneSpec prefers CLI overrides over inferred values", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a woman scans a flyer",
      overrides: {
        numberOfFrames: 6,
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

test("buildFallbackFramePlan keeps continuity details and frame-specific actions", () => {
  const spec = normalizeSceneSpec(
    {
      rawPrompt: "a mom at a gymnastics meet scans a flyer",
      overrides: {
        numberOfFrames: 2,
        mainCharacterDetails: "mom in casual modern clothes",
        locationEnvironment: "gymnastics meet venue lobby",
        propsKeyObjects: "smartphone and flyer",
        visualStyle: "cinematic ad photography",
        cameraFormat: "vertical",
        actionSequence: ["notices the flyer", "raises her phone to scan it"],
      },
      extraNotes: "",
    },
    {},
  );

  const frames = buildFallbackFramePlan(spec);
  assert.equal(frames.length, 2);
  assert.match(frames[0].prompt, /mom in casual modern clothes/);
  assert.match(frames[0].prompt, /gymnastics meet venue lobby/);
  assert.match(frames[0].prompt, /smartphone and flyer/);
  assert.match(frames[0].prompt, /notices the flyer/);
  assert.match(frames[1].prompt, /raises her phone to scan it/);
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
