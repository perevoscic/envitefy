import test from "node:test";
import assert from "node:assert/strict";
import {
  ART_DIRECTION_SYSTEM_PROMPT,
  BRIEF_RESPONSE_FORMAT,
  BRIEF_SYSTEM_PROMPT,
  COORDINATOR_SYSTEM_PROMPT,
  CREATIVE_QA_RESPONSE_FORMAT,
  CREATIVE_QA_SYSTEM_PROMPT,
  FRAME_PLAN_RESPONSE_FORMAT,
  SOCIAL_COPY_RESPONSE_FORMAT,
  SOCIAL_COPY_SYSTEM_PROMPT,
} from "./lib/campaign-agents.mjs";

test("brief prompt requires one audience, one pain, one promise, and one proof moment", () => {
  assert.match(BRIEF_SYSTEM_PROMPT, /one audience, one pain, one product promise, and one proof moment/i);
  assert.match(BRIEF_SYSTEM_PROMPT, /Do not invent product features/i);
});

test("art direction and coordinator prompts enforce continuity plus meaningful variation", () => {
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /same person, outfit, props, room layout, phone, lighting, style, and framing baseline/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /do not freeze the campaign into one repeated composition/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /subject should usually seem unaware of the camera/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /birthday invite delay campaign must not become gymnastics/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /Phones must be physically held by visible fingers or lying flat screen-up/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /extra tabletop planning props unless the user explicitly requests them/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /Delay proof must be digital/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /Do not invent handoff scenes, offline delay props/i);
  assert.match(ART_DIRECTION_SYSTEM_PROMPT, /Do not build the first four frames as the same seated table scene/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /No more than two frames may use the same base composition/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /at least four distinct shot families/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /No more than three frames may be phone-dominant/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /Avoid direct phone presentation to camera/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /subject should not hold the phone up to the lens in an unnatural sales-demo pose/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /exactly one payoff or CTA frame, and it must be the final frame/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /Classify any Google search/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /invented gym locations such as Bright Stars Gymnastics/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /keep the home clean and ordinary/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /full surface support/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /Do not create handoff scenes or offline delay props/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /party-decor clutter/i);
  assert.match(COORDINATOR_SYSTEM_PROMPT, /Do not build frames 1-4 as four versions/i);
});

test("social copy prompt bans literal filler captions", () => {
  assert.match(SOCIAL_COPY_SYSTEM_PROMPT, /Ban filler like 'here we go'/i);
  assert.match(SOCIAL_COPY_SYSTEM_PROMPT, /must persuade rather than label/i);
  assert.match(SOCIAL_COPY_SYSTEM_PROMPT, /one less task/i);
});

test("brief, social copy, and creative qa schemas require the new fields", () => {
  const briefRequired = BRIEF_RESPONSE_FORMAT.json_schema.schema.required;
  assert.ok(briefRequired.includes("singleAudience"));
  assert.ok(briefRequired.includes("singlePain"));
  assert.ok(briefRequired.includes("proofMoment"));

  const framePlanRequired = FRAME_PLAN_RESPONSE_FORMAT.json_schema.schema.properties.frames.items.required;
  assert.ok(framePlanRequired.includes("shotFamily"));
  assert.ok(framePlanRequired.includes("phoneDominance"));
  assert.ok(framePlanRequired.includes("brandingPresence"));
  assert.ok(framePlanRequired.includes("disallowedPropRisk"));

  const socialCopyRequired = SOCIAL_COPY_RESPONSE_FORMAT.json_schema.schema.properties.frames.items.required;
  assert.ok(socialCopyRequired.includes("captionRole"));

  const creativeQaRequired = CREATIVE_QA_RESPONSE_FORMAT.json_schema.schema.required;
  assert.ok(creativeQaRequired.includes("framesToRewrite"));
  assert.ok(creativeQaRequired.includes("framesToCut"));
  assert.ok(creativeQaRequired.includes("blockedCaptionPatterns"));
  assert.ok(creativeQaRequired.includes("requiredShotFamilies"));
  assert.ok(creativeQaRequired.includes("singleFinalPayoffFrame"));
  assert.ok(creativeQaRequired.includes("rewriteBrief"));
});

test("creative qa prompt fails repeated phone-presentation loops", () => {
  assert.match(CREATIVE_QA_SYSTEM_PROMPT, /same person in the same room holding the same phone toward camera/i);
  assert.match(CREATIVE_QA_SYSTEM_PROMPT, /ten-frame plan normally fails when more than three frames are phone-dominant/i);
  assert.match(CREATIVE_QA_SYSTEM_PROMPT, /unnatural phone presentation poses/i);
});
