import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  applyCreativeQaFrameConstraints,
  buildImageModelComplianceError,
  finalFrameIsGraphicLogoPayoff,
  inferFramePhoneDominance,
  mimeTypeForImagePath,
  normalizeCampaignInput,
  normalizeCreativeQaForStoryboardBudget,
  normalizeSocialCopyForFramePlan,
  repairStoryboardFrameBudget,
  repairStoryboardSceneSpecForBudget,
  resolveImageModel,
  resolveRunPaths,
  validateStoryboardFrameBudget,
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
  const resolvedRunDir = path.resolve("/tmp/envitefy", runDir);

  assert.equal(runPaths.runDir, resolvedRunDir);
  assert.equal(runPaths.statusPath, path.join(resolvedRunDir, "status.json"));
  assert.equal(runPaths.captionedImagesDir, path.join(resolvedRunDir, "images-captioned"));
  assert.equal(runPaths.creativeQaPath, path.join(resolvedRunDir, "creative-qa.json"));
  assert.equal(runPaths.videoPath, path.join(resolvedRunDir, "video.mp4"));
});

test("applyCreativeQaFrameConstraints can cut duplicate ending frames and renumber the scene spec", () => {
  const sceneSpec = normalizeSceneSpec(
    {
      rawPrompt: "birthday ad",
      overrides: {},
      extraNotes: "",
    },
    { numberOfFrames: 10 },
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

test("normalizeCampaignInput carries reference images into the run input", () => {
  const input = normalizeCampaignInput({
    criteria: "birthday campaign",
    referenceImages: [
      {
        path: "reference-images/01-kitchen.png",
        originalName: "kitchen.png",
        mimeType: "image/png",
        size: 1024,
      },
    ],
  });

  assert.equal(input.referenceImages.length, 1);
  assert.equal(input.referenceImages[0].path, "reference-images/01-kitchen.png");
  assert.equal(input.looseInput.referenceImages[0].originalName, "kitchen.png");
  assert.match(input.looseInput.rawPrompt, /Reference images: kitchen\.png/);
});

test("normalizeCampaignInput normalizes envitefye.com typo to envitefy.com", () => {
  const input = normalizeCampaignInput({
    criteria: "Show why envitefye.com helps hosts launch quickly",
    callToAction: "Start at envitefye.com today",
    looseInput: {
      extraNotes: "Never misspell envitefye.com in screen text",
    },
  });

  assert.match(input.criteria, /envitefy\.com/);
  assert.doesNotMatch(input.criteria, /envitefye\.com/);
  assert.match(input.callToAction, /envitefy\.com/);
  assert.match(input.looseInput.extraNotes, /envitefy\.com/);
});

test("resolveImageModel is pinned to gpt-image-2", () => {
  process.env.STORYBOARD_OPENAI_IMAGE_MODEL = "gpt-image-1";
  process.env.STUDIO_OPENAI_IMAGE_MODEL = "gpt-image-1";

  assert.equal(resolveImageModel(), "gpt-image-2");

  delete process.env.STORYBOARD_OPENAI_IMAGE_MODEL;
  delete process.env.STUDIO_OPENAI_IMAGE_MODEL;
});

test("buildImageModelComplianceError returns hard blocker when effective model drifts", () => {
  const message = buildImageModelComplianceError(
    [
      { frameNumber: 1, effectiveImageModel: "gpt-image-2" },
      { frameNumber: 2, effectiveImageModel: "gpt-image-1" },
      { frameNumber: 3, effectiveImageModel: "gpt-image-1.5" },
    ],
    "gpt-image-2",
  );

  assert.match(message, /Image model compliance failure/);
  assert.match(message, /frame 2=gpt-image-1/);
  assert.match(message, /frame 3=gpt-image-1.5/);
});

test("buildImageModelComplianceError passes when all effective models are gpt-image-2", () => {
  const message = buildImageModelComplianceError(
    [
      { frameNumber: 1, effectiveImageModel: "gpt-image-2" },
      { frameNumber: 2, effectiveImageModel: "gpt-image-2" },
    ],
    "gpt-image-2",
  );

  assert.equal(message, "");
});

test("mimeTypeForImagePath preserves supported reference image mime types", () => {
  assert.equal(mimeTypeForImagePath("reference-images/01-logo.png", ""), "image/png");
  assert.equal(mimeTypeForImagePath("reference-images/photo.jpeg", ""), "image/jpeg");
  assert.equal(mimeTypeForImagePath("reference-images/art.webp", ""), "image/webp");
  assert.equal(mimeTypeForImagePath("reference-images/safe-name", "image/png"), "image/png");
  assert.equal(mimeTypeForImagePath("reference-images/safe-name", "application/octet-stream"), "image/png");
});

test("normalizeCampaignInput expands short birthday delay prompts into digital-only guardrails", () => {
  const input = normalizeCampaignInput({
    criteria: "daughter birthday flyer delayed",
  });

  assert.match(input.criteria, /modern digital problem/i);
  assert.match(input.criteria, /phone or laptop/i);
  assert.match(input.criteria, /Do not invent extra tabletop planning props/i);
  assert.doesNotMatch(input.criteria, /flyers will not arrive/i);
  assert.match(input.looseInput.rawPrompt, /envitefy\.com/i);
});

test("campaign image generation uses real image references for consistency", async () => {
  const source = await readFile(new URL("./lib/campaign-run.mjs", import.meta.url), "utf8");

  assert.match(source, /import \{ toFile \} from "openai\/uploads";/);
  assert.match(source, /client\.images\.edit/);
  assert.match(source, /frame-01-character-reference\.png/);
  assert.match(source, /do not copy its pose, camera angle, color palette, table setup, prop layout/i);
  assert.match(source, /not a style board or prop board/i);
});

test("normalizeSocialCopyForFramePlan pads missing captions to match frame count", () => {
  const framePlan = Array.from({ length: 10 }, (_value, index) => ({
    frameNumber: index + 1,
    title: `Frame ${index + 1}`,
    persuasionRole: index === 9 ? "final payoff" : "product proof",
    emotionalBeat: "calm progress",
    proofTarget: "caption fallback",
  }));
  const socialCopy = {
    hook: "party planning got easier",
    endCard: "start your event page",
    frames: framePlan.slice(0, 8).map((frame) => ({
      frameNumber: frame.frameNumber,
      text: `caption ${frame.frameNumber}`,
      emphasisWord: "caption",
      voiceover: "voiceover",
      durationSec: 2,
      transition: "cut",
      kineticStyle: "static",
      captionRole: "proof",
    })),
  };

  const normalized = normalizeSocialCopyForFramePlan(socialCopy, framePlan);

  assert.equal(normalized.frames.length, 10);
  assert.deepEqual(
    normalized.frames.map((frame) => frame.frameNumber),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.equal(normalized.frames[8].text.length > 0, true);
  assert.equal(normalized.frames[9].text, "start your event page");
});

function buildBudgetFramePlan(overrides = {}) {
  const shotFamilies = [
    "wide-environment",
    "environment-detail",
    "hands-action",
    "over-shoulder",
    "phone-proof",
    "reaction",
    "social-proof",
    "phone-proof",
    "reaction",
    "final-hero",
  ];

  return shotFamilies.map((shotFamily, index) => {
    const frameNumber = index + 1;
    return {
      frameNumber,
      title: `Frame ${frameNumber}`,
      actionBeat: "progress the ad",
      cameraShot: "varied camera shot",
      composition: "varied composition",
      mood: "focused",
      persuasionRole: frameNumber === 10 ? "final-payoff" : "proof",
      screenState: "story state",
      propFocus: "allowed props",
      emotionalBeat: "progress",
      proofTarget: "prove value",
      mustDifferFromPrevious: "change shot family",
      shotFamily,
      phoneDominance: ["phone-proof"].includes(shotFamily) ? "dominant" : "secondary",
      brandingPresence: shotFamily === "phone-proof" ? "screen" : "none",
      disallowedPropRisk: "",
      ...(overrides[frameNumber] || {}),
    };
  });
}

test("validateStoryboardFrameBudget fails excessive phone-dominant frames", () => {
  const framePlan = buildBudgetFramePlan(
    Object.fromEntries(Array.from({ length: 7 }, (_value, index) => [index + 1, { phoneDominance: "dominant" }])),
  );

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Excessive phone-dominant frames/);
  assert.match(review.reasons.join(" "), /Only frames 3, 5, 8 should remain phone-dominant/);
  assert.equal(review.feedback.framesToCut.length, 0);
  assert.equal(review.feedback.singleFinalPayoffFrame, 10);
  assert.equal(review.feedback.source, "storyboard-budget");
  assert.equal(review.feedback.discardExistingFramePlan, true);
  assert.equal(review.feedback.maxPhoneDominantFrames, 3);
  assert.deepEqual(review.feedback.strictShotBudgetMap.slice(0, 2), [
    "1 wide-environment none",
    "2 environment-detail none",
  ]);
  assert.match(review.feedback.rewriteBrief, /phoneDominance dominant reserved for frames 3, 5, 8 only/);
  assert.match(review.feedback.rewriteBrief, /10 final-hero none/);
});

test("repairStoryboardFrameBudget replaces phone-heavy plans with a compliant map", () => {
  const sceneSpec = normalizeSceneSpec(
    {
      rawPrompt: "birthday ad",
      overrides: { numberOfFrames: 10 },
      extraNotes: "",
    },
    {},
  );
  const badPlan = buildBudgetFramePlan(
    Object.fromEntries(
      Array.from({ length: 10 }, (_value, index) => [
        index + 1,
        {
          phoneDominance: "dominant",
          actionBeat: "holding the phone toward camera with the app screen visible",
          composition: "phone screen fills the frame",
        },
      ]),
    ),
  );

  const repaired = repairStoryboardFrameBudget(sceneSpec, badPlan, { product: "Envitefy" });
  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec,
    framePlan: repaired,
    brief: {},
  });
  const repairedWithoutPrompts = repaired.map(({ prompt: _prompt, ...frame }) => frame);

  assert.equal(repaired.length, 10);
  assert.equal(repaired[0].shotFamily, "wide-environment");
  assert.doesNotMatch(JSON.stringify(repairedWithoutPrompts), /Bright Stars|facility lobby|athlete|medal|trophy/i);
  assert.doesNotMatch(JSON.stringify(repairedWithoutPrompts), /envelope|package slip|physical mail|mail handoff|letter/i);
  assert.match(repaired[0].composition, /ordinary home context/i);
  assert.match(repaired[0].composition, /clean counter/i);
  assert.match(repaired[0].actionBeat, /walks from the hallway into the kitchen/i);
  assert.doesNotMatch(repaired[1].actionBeat, /sort the source flyer/i);
  assert.match(repaired[1].actionBeat, /laptop on the counter shows/i);
  assert.match(repaired[1].composition, /clean counter surface/i);
  assert.match(repaired[1].proofTarget, /offline plan is not shareable/i);
  assert.match(repaired[2].actionBeat, /searches for a faster digital invite/i);
  assert.equal(repaired[2].phoneDominance, "dominant");
  assert.match(repaired[3].composition, /no device foreground/i);
  assert.equal(repaired[3].phoneDominance, "none");
  assert.equal(repaired[3].brandingPresence, "none");
  assert.equal(repaired[4].phoneDominance, "dominant");
  assert.match(repaired[4].composition, /phone lies flat screen-up/i);
  assert.match(repaired[4].composition, /no upright or leaning phone/i);
  assert.equal(repaired[7].phoneDominance, "dominant");
  assert.match(repaired[7].composition, /phone lies flat screen-up with full contact/i);
  assert.equal(repaired[9].shotFamily, "final-hero");
  assert.match(repaired[9].composition, /no extra tabletop planning props/i);
  assert.match(repaired[9].screenState, /live card has been shared/i);
  assert.match(repaired[9].propFocus, /digital invitation result/i);
  assert.equal(repaired[9].brandingPresence, "none");
  assert.equal(review.pass, true);
});

test("repairStoryboardSceneSpecForBudget removes unsellable paper and screen locks", () => {
  const repaired = repairStoryboardSceneSpecForBudget({
    flyerLock: { value: "large delayed flyer with DELAYED headline", source: "inferred" },
    screenProofRequirements: {
      value: "show Google search and phone screens in every frame",
      source: "inferred",
    },
    disallowedProps: { value: "", source: "empty" },
  });

  assert.match(repaired.flyerLock.value, /digital delay evidence/i);
  assert.match(repaired.screenProofRequirements.value, /approved phone-proof frames/i);
  assert.match(repaired.disallowedProps.value, /no large readable fake printed words/i);
  assert.match(repaired.disallowedProps.value, /no gymnastics/i);
  assert.match(repaired.disallowedProps.value, /no completed party table/i);
  assert.match(repaired.disallowedProps.value, /no extra tabletop planning props/i);
  assert.match(repaired.disallowedProps.value, /no offline delay props/i);
  assert.match(repaired.framingBaseline.value, /planning pressure/i);
  assert.match(repaired.framingBaseline.value, /do not repeat static kitchen or seated table shots/i);
  assert.doesNotMatch(repaired.screenProofRequirements.value, /every frame/i);
});

test("repairStoryboardSceneSpecForBudget prevents inferred lavender takeover", () => {
  const repaired = repairStoryboardSceneSpecForBudget({
    outfitLock: { value: "same lavender sweater and lavender accessories", source: "inferred" },
    phoneLock: { value: "same lavender phone case", source: "inferred" },
    locationLock: { value: "lavender curtains, towels, pillows, mug, vase, and notes", source: "inferred" },
    backgroundAnchors: { value: "lavender notes and fake corkboard text", source: "inferred" },
    styleContinuityLock: { value: "all lavender premium palette", source: "inferred" },
  });

  assert.match(repaired.outfitLock.value, /neutral colors/i);
  assert.match(repaired.outfitLock.value, /no lavender or purple sweater/i);
  assert.match(repaired.phoneLock.value, /neutral black or dark/i);
  assert.match(repaired.phoneLock.value, /not as a matching lavender phone case/i);
  assert.match(repaired.locationLock.value, /mostly neutral decor/i);
  assert.match(repaired.locationLock.value, /one or two small accents/i);
  assert.match(repaired.backgroundAnchors.value, /no fake readable corkboard planning notes/i);
  assert.match(repaired.backgroundAnchors.value, /no repeated matching lavender decor set/i);
  assert.match(repaired.styleContinuityLock.value, /avoid a monochrome purple or lavender palette/i);
});

test("repairStoryboardSceneSpecForBudget preserves explicit user color locks", () => {
  const repaired = repairStoryboardSceneSpecForBudget({
    outfitLock: { value: "same lavender sweater requested by the founder", source: "user" },
    phoneLock: { value: "same lavender phone case requested by the founder", source: "user" },
  });

  assert.equal(repaired.outfitLock.value, "same lavender sweater requested by the founder");
  assert.equal(repaired.phoneLock.value, "same lavender phone case requested by the founder");
});

test("inferFramePhoneDominance catches phone-heavy text even when mislabeled", () => {
  assert.equal(
    inferFramePhoneDominance({
      phoneDominance: "secondary",
      shotFamily: "over-shoulder",
      actionBeat: "the mom opens a Google search on her phone",
      composition: "over-the-shoulder view of search results",
    }),
    "dominant",
  );
  assert.equal(
    inferFramePhoneDominance({
      phoneDominance: "secondary",
      shotFamily: "reaction",
      actionBeat: "the mom smiles with the phone down on the counter",
      composition: "side-angle room reaction with phone secondary",
    }),
    "secondary",
  );
});

test("validateStoryboardFrameBudget fails inferred phone dominance and missing social proof", () => {
  const framePlan = buildBudgetFramePlan({
    3: {
      phoneDominance: "secondary",
      actionBeat: "the mom opens Google search on her phone",
      composition: "over-the-shoulder search results on the phone screen",
      shotFamily: "over-shoulder",
    },
    5: { phoneDominance: "secondary", actionBeat: "typing into the phone" },
    6: { phoneDominance: "secondary", composition: "app screen close-up fills the frame" },
    7: { phoneDominance: "secondary", actionBeat: "tapping the phone to finish the invite" },
    8: { shotFamily: "reaction", phoneDominance: "secondary", brandingPresence: "none" },
    9: { phoneDominance: "secondary", actionBeat: "holding her phone while checking the invite" },
    10: { shotFamily: "final-hero", phoneDominance: "none" },
  }).map((frame) => (frame.shotFamily === "social-proof" ? { ...frame, shotFamily: "reaction" } : frame));

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Excessive phone-dominant frames: 4/);
  assert.match(review.reasons.join(" "), /Missing social-proof frame/);
  assert.match(review.feedback.rewriteBrief, /replace Google-search/i);
  assert.match(review.feedback.rewriteBrief, /social-proof or trust-signal/i);
});

test("validateStoryboardFrameBudget fails phone-dominant frames outside approved slots", () => {
  const framePlan = buildBudgetFramePlan({
    4: { phoneDominance: "dominant", actionBeat: "the mom holds the phone toward camera" },
    7: { shotFamily: "social-proof", phoneDominance: "dominant", actionBeat: "RSVP proof appears on phone screen" },
  });

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Phone-dominant frames outside approved proof slots: 4, 7/);
  assert.match(review.reasons.join(" "), /Social-proof frames must not be phone demos: 7/);
  assert.ok(review.feedback.framesToRewrite.includes(4));
  assert.ok(review.feedback.framesToRewrite.includes(7));
});

test("validateStoryboardFrameBudget fails phone-dominant final frames and disallowed props", () => {
  const framePlan = buildBudgetFramePlan({
    7: { disallowedPropRisk: "introduces a tablet despite disallowed props" },
    10: { phoneDominance: "dominant", brandingPresence: "screen" },
  });

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Final frame must not be phone-dominant/);
  assert.match(review.reasons.join(" "), /Disallowed prop risk/);
  assert.deepEqual(review.feedback.framesToCut, []);
});

test("validateStoryboardFrameBudget fails graphic logo final payoff", () => {
  const framePlan = buildBudgetFramePlan({
    10: {
      shotFamily: "final-hero",
      phoneDominance: "none",
      brandingPresence: "hero",
      actionBeat: "graphic logo shot with Invitefy.com CTA card",
      composition: "standalone logo on a solid background",
    },
  });

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(finalFrameIsGraphicLogoPayoff(framePlan[9]), true);
  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /in-scene emotional payoff/);
  assert.ok(review.feedback.framesToRewrite.includes(10));
});

test("validateStoryboardFrameBudget fails non-final-hero frame ten", () => {
  const framePlan = buildBudgetFramePlan({
    10: { shotFamily: "reaction", phoneDominance: "none", brandingPresence: "none" },
  });

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Final frame must use shotFamily final-hero/);
  assert.ok(review.feedback.framesToRewrite.includes(10));
});

test("validateStoryboardFrameBudget gives specific branding rewrite slots", () => {
  const framePlan = buildBudgetFramePlan({
    1: { brandingPresence: "screen" },
    2: { brandingPresence: "screen" },
    3: { brandingPresence: "screen" },
    4: { brandingPresence: "screen" },
    5: { brandingPresence: "screen" },
    8: { brandingPresence: "none" },
    9: { brandingPresence: "hero" },
    10: { brandingPresence: "hero" },
  });

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, false);
  assert.match(review.reasons.join(" "), /Too many screen-branding frames: 5/);
  assert.match(review.reasons.join(" "), /Only frames 5, 8 may use brandingPresence screen/);
  assert.match(review.reasons.join(" "), /Only frame 10 may use brandingPresence hero/);
  assert.match(review.feedback.rewriteBrief, /brandingPresence screen only on frames 5, 8/);
  assert.match(review.feedback.rewriteBrief, /brandingPresence hero only on frame 10/);
});

test("validateStoryboardFrameBudget passes a varied ten-frame plan", () => {
  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan: buildBudgetFramePlan(),
    brief: {},
  });

  assert.equal(review.pass, true);
});

test("validateStoryboardFrameBudget passes a nine-frame non-demo plan with explicit no-risk strings", () => {
  const framePlan = [
    {
      frameNumber: 1,
      title: "Planning pressure",
      actionBeat: "the mom organizes birthday details in a clean kitchen",
      cameraShot: "wide observational room shot",
      composition: "clean kitchen island, no phone foreground",
      mood: "busy",
      persuasionRole: "hook",
      screenState: "no product proof yet",
      propFocus: "person and clean room",
      emotionalBeat: "pressure",
      proofTarget: "show the planning problem",
      mustDifferFromPrevious: "establish environment",
      shotFamily: "wide-environment",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 2,
      title: "Details gathered",
      actionBeat: "she reviews details on a laptop at the counter",
      cameraShot: "environment detail",
      composition: "laptop interface is visible but the phone is absent",
      mood: "focused",
      persuasionRole: "pain-proof",
      screenState: "event details still unresolved",
      propFocus: "hands and counter",
      emotionalBeat: "friction",
      proofTarget: "make the task concrete",
      mustDifferFromPrevious: "move to detail",
      shotFamily: "environment-detail",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 3,
      title: "Product entry",
      actionBeat: "she opens Envitefy on a naturally held phone",
      cameraShot: "hands action",
      composition: "phone screen visible in two hands",
      mood: "decisive",
      persuasionRole: "product-entry",
      screenState: "product entry begins",
      propFocus: "phone action",
      emotionalBeat: "decision",
      proofTarget: "show product turn",
      mustDifferFromPrevious: "change to phone action",
      shotFamily: "hands-action",
      phoneDominance: "dominant",
      brandingPresence: "subtle",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 4,
      title: "Momentum",
      actionBeat: "she moves through the room with the task under control",
      cameraShot: "over shoulder",
      composition: "no device foreground",
      mood: "calmer",
      persuasionRole: "transition",
      screenState: "product action underway",
      propFocus: "person moving",
      emotionalBeat: "relief begins",
      proofTarget: "avoid another demo",
      mustDifferFromPrevious: "change to room movement",
      shotFamily: "over-shoulder",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 5,
      title: "Live page proof",
      actionBeat: "a polished Envitefy live event page appears on a phone lying flat",
      cameraShot: "proof close-up",
      composition: "phone screen close-up with full surface support",
      mood: "polished",
      persuasionRole: "product-proof",
      screenState: "live page is underway",
      propFocus: "Envitefy screen",
      emotionalBeat: "control",
      proofTarget: "prove creation",
      mustDifferFromPrevious: "change to product proof",
      shotFamily: "phone-proof",
      phoneDominance: "dominant",
      brandingPresence: "screen",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 6,
      title: "Relief",
      actionBeat: "she smiles with her child nearby",
      cameraShot: "reaction",
      composition: "same bright home, no phone visible",
      mood: "relieved",
      persuasionRole: "emotional-release",
      screenState: "product reduced uncertainty",
      propFocus: "faces and posture",
      emotionalBeat: "relief",
      proofTarget: "prove the emotional shift",
      mustDifferFromPrevious: "change away from product proof",
      shotFamily: "reaction",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 7,
      title: "Send-ready proof",
      actionBeat: "the send-ready live invite is visible on a supported phone",
      cameraShot: "tight angled proof",
      composition: "phone screen close-up, held naturally in two hands",
      mood: "confident",
      persuasionRole: "send-ready-proof",
      screenState: "finished invite ready to share",
      propFocus: "finished live-card proof",
      emotionalBeat: "certainty",
      proofTarget: "prove finished result",
      mustDifferFromPrevious: "change to final product proof",
      shotFamily: "phone-proof",
      phoneDominance: "dominant",
      brandingPresence: "screen",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 8,
      title: "Social confidence",
      actionBeat: "her child reacts happily in the room",
      cameraShot: "candid social proof",
      composition: "no phone foreground, no extra screens",
      mood: "warm",
      persuasionRole: "social-proof",
      screenState: "confidence comes from the real reaction",
      propFocus: "human response",
      emotionalBeat: "confidence",
      proofTarget: "show social approval without a phone demo",
      mustDifferFromPrevious: "change to human validation",
      shotFamily: "social-proof",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
    {
      frameNumber: 9,
      title: "Final payoff",
      actionBeat: "the mom holds her phone naturally at her side while smiling in the clean kitchen",
      cameraShot: "final in-scene hero",
      composition: "no phone screen visible, no device foreground, no logo card",
      mood: "proud",
      persuasionRole: "final-payoff",
      screenState: "single final emotional payoff",
      propFocus: "host transformation",
      emotionalBeat: "conversion",
      proofTarget: "land the benefit",
      mustDifferFromPrevious: "end on a human payoff",
      shotFamily: "final-hero",
      phoneDominance: "none",
      brandingPresence: "none",
      disallowedPropRisk: "none",
    },
  ];

  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 9 } },
    sceneSpec: { numberOfFrames: { value: 9 } },
    framePlan,
    brief: {},
  });

  assert.equal(review.pass, true);
  assert.equal(inferFramePhoneDominance(framePlan[1]), "none");
  assert.equal(inferFramePhoneDominance(framePlan[8]), "none");
});

test("repairStoryboardFrameBudget creates a compliant compact five-frame plan", () => {
  const sceneSpec = normalizeSceneSpec(
    {
      rawPrompt: "birthday pool party live event page ad",
      overrides: { numberOfFrames: 5 },
      extraNotes: "",
    },
    {},
  );
  const badPlan = Array.from({ length: 5 }, (_value, index) => ({
    frameNumber: index + 1,
    title: `Bad ${index + 1}`,
    actionBeat: "holding the phone toward camera with the app screen visible",
    cameraShot: "phone demo",
    composition: "phone screen fills the frame",
    mood: "flat",
    persuasionRole: index === 4 ? "final-payoff" : "proof",
    screenState: "phone screen",
    propFocus: "phone",
    emotionalBeat: "demo",
    proofTarget: "phone demo",
    mustDifferFromPrevious: "screen changes",
    shotFamily: index === 4 ? "phone-proof" : "phone-proof",
    phoneDominance: "dominant",
    brandingPresence: "screen",
    disallowedPropRisk: "none",
  }));

  const repaired = repairStoryboardFrameBudget(sceneSpec, badPlan, { product: "Envitefy" });
  const review = validateStoryboardFrameBudget({
    requestPayload: { input: { frameCount: 5 } },
    sceneSpec,
    framePlan: repaired,
    brief: {},
  });

  assert.equal(repaired.length, 5);
  assert.equal(repaired[2].phoneDominance, "dominant");
  assert.equal(repaired[4].shotFamily, "final-hero");
  assert.equal(review.pass, true);
});

test("repairStoryboardFrameBudget preserves explicit child and event context in compact repair", () => {
  const sceneSpec = normalizeSceneSpec(
    {
      rawPrompt: "busy mom creates a live event page for Caleb's birthday pool party",
      overrides: { numberOfFrames: 5 },
      extraNotes: "Use the same mom and child across all frames.",
    },
    {},
  );
  const badPlan = Array.from({ length: 5 }, (_value, index) => ({
    frameNumber: index + 1,
    title: `Bad ${index + 1}`,
    actionBeat: "holding the phone toward camera with the app screen visible",
    cameraShot: "phone demo",
    composition: "phone screen fills the frame",
    mood: "flat",
    persuasionRole: index === 4 ? "final-payoff" : "proof",
    screenState: "phone screen",
    propFocus: "phone",
    emotionalBeat: "demo",
    proofTarget: "phone demo",
    mustDifferFromPrevious: "screen changes",
    shotFamily: "phone-proof",
    phoneDominance: "dominant",
    brandingPresence: "screen",
    disallowedPropRisk: "none",
  }));

  const repaired = repairStoryboardFrameBudget(sceneSpec, badPlan, {
    product: "Envitefy",
    campaignInput: {
      criteria: "Show a busy mom creating a live event page for Caleb's 7th birthday pool party.",
      looseInput: { extraNotes: "Use the same mom and child across all frames." },
    },
  });
  const serialized = JSON.stringify(repaired);

  assert.match(repaired[0].actionBeat, /Caleb/);
  assert.match(repaired[2].actionBeat, /Caleb's birthday pool-party live invite/);
  assert.match(repaired[4].actionBeat, /host and Caleb relax together/i);
  assert.match(repaired[4].composition, /no phone visible/i);
  assert.match(serialized, /same neutral home/i);
  assert.doesNotMatch(serialized, /soft branded color accents in the room/i);
});

test("normalizeCreativeQaForStoryboardBudget passes soft notes when hard budget passes", () => {
  const result = normalizeCreativeQaForStoryboardBudget({
    creativeQa: {
      pass: false,
      reasons: [
        "Phone frames are at the upper limit and the proof shots could use more visual separation.",
        "Social proof could be more authentic and captions need polish.",
      ],
      captionIssues: ["Some captions label visible objects."],
      framesToRewrite: [5, 8],
      framesToCut: [],
      blockedCaptionPatterns: ["literal object labels"],
      requiredShotFamilies: ["wide-environment", "social-proof", "final-hero"],
      singleFinalPayoffFrame: 10,
      maxPhoneDominantFrames: 2,
      valueClarityScore: 2,
      visualVarietyScore: 2,
      productProofScore: 3,
      rewriteBrief: "Loosen the social proof and vary the product proof angles.",
    },
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan: buildBudgetFramePlan(),
    brief: {},
  });

  assert.equal(result.softened, true);
  assert.equal(result.creativeQa.pass, true);
  assert.equal(result.creativeQa.valueClarityScore, 3);
  assert.equal(result.creativeQa.visualVarietyScore, 3);
  assert.deepEqual(result.creativeQa.framesToRewrite, []);
  assert.equal(result.creativeQa.rewriteBrief, "");
});

test("normalizeCreativeQaForStoryboardBudget keeps hard blockers failed", () => {
  const result = normalizeCreativeQaForStoryboardBudget({
    creativeQa: {
      pass: false,
      reasons: ["Disallowed prop risk: frame 7 introduces a tablet."],
      captionIssues: [],
      framesToRewrite: [7],
      framesToCut: [],
      blockedCaptionPatterns: [],
      requiredShotFamilies: [],
      singleFinalPayoffFrame: 10,
      maxPhoneDominantFrames: 2,
      valueClarityScore: 3,
      visualVarietyScore: 3,
      productProofScore: 3,
      rewriteBrief: "Remove the tablet.",
    },
    requestPayload: { input: { frameCount: 10 } },
    sceneSpec: { numberOfFrames: { value: 10 } },
    framePlan: buildBudgetFramePlan(),
    brief: {},
  });

  assert.equal(result.softened, false);
  assert.equal(result.creativeQa.pass, false);
});
