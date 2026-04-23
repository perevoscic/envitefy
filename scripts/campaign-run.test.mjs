import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  applyCreativeQaFrameConstraints,
  normalizeCampaignInput,
  resolveRunPaths,
} from "./lib/campaign-run.mjs";
import { normalizeSceneSpec } from "./lib/storyboard-generator.mjs";

test("normalizeCampaignInput folds structured campaign fields into storyboard loose input", () => {
  const input = normalizeCampaignInput({
    criteria: "show a mom discovering how fast the event page comes together",
    productName: "Envitefy",
    targetVertical: "Gymnastics",
    tone: "premium but warm",
    callToAction: "Start your event page",
    frameCount: 10,
    overrides: {
      cameraFormat: "vertical",
      characterLock: "the same mom in her early 30s",
    },
  });

  assert.equal(input.productName, "Envitefy");
  assert.equal(input.looseInput.overrides.numberOfFrames, 10);
  assert.equal(input.looseInput.overrides.cameraFormat, "vertical");
  assert.match(input.looseInput.rawPrompt, /Product: Envitefy/);
  assert.match(input.looseInput.rawPrompt, /CTA: Start your event page/);
});

test("resolveRunPaths can rebuild the full path set from an existing run dir", () => {
  const runDir = "/tmp/envitefy/qa-artifacts/storyboard-runs/20260422-140000-test-run";
  const runPaths = resolveRunPaths("/tmp/envitefy", { runDir });

  assert.equal(runPaths.runDir, runDir);
  assert.equal(runPaths.statusPath, path.join(runDir, "status.json"));
  assert.equal(runPaths.captionedImagesDir, path.join(runDir, "images-captioned"));
  assert.equal(runPaths.creativeQaPath, path.join(runDir, "creative-qa.json"));
  assert.equal(runPaths.videoPath, path.join(runDir, "video.mp4"));
});

test("applyCreativeQaFrameConstraints can cut duplicate ending frames and renumber the scene spec", () => {
  const sceneSpec = normalizeSceneSpec(
    {
      rawPrompt: "birthday ad",
      overrides: {
        numberOfFrames: 10,
      },
      extraNotes: "",
    },
    {},
  );

  const constrained = applyCreativeQaFrameConstraints(sceneSpec, {
    framesToCut: [10],
    singleFinalPayoffFrame: 9,
  });

  assert.equal(constrained.numberOfFrames.value, 9);
  assert.equal(constrained.numberOfFrames.source, "qa");
  assert.equal(constrained.actionSequence.value.length, 9);
  assert.equal(constrained.actionSequence.source, "qa");
});

test("normalizeCampaignInput carries the requested frame count into the loose overrides", () => {
  const input = normalizeCampaignInput({
    criteria: "birthday campaign",
    frameCount: 9,
  });

  assert.equal(input.looseInput.overrides.numberOfFrames, 9);
});
