import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_EMAIL_GENERATION_GUIDE,
  bannedAdminEmailTextLinkPattern,
  buildAdminEmailAudienceGuidance,
  buildAdminEmailGuidePromptPayload,
  buildAdminEmailSystemPromptFromGuide,
} from "./email-generation-guide.ts";

test("email generation guide encodes must / must-not rules", () => {
  assert.ok(ADMIN_EMAIL_GENERATION_GUIDE.must.length >= 4);
  assert.ok(ADMIN_EMAIL_GENERATION_GUIDE.mustNot.length >= 4);
  assert.ok(ADMIN_EMAIL_GENERATION_GUIDE.bannedTextLinkLabels.includes("Turn a flyer into a live event card"));
  assert.equal(ADMIN_EMAIL_GENERATION_GUIDE.ctaDefaults.buttonText, "Create an event");
  assert.match(ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals.format, /never animated GIFs/i);
  assert.ok(ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals.rejectTraits.length >= 4);
});

test("guide builds audience-specific system prompts", () => {
  const individual = buildAdminEmailSystemPromptFromGuide("individual");
  const broadcast = buildAdminEmailSystemPromptFromGuide("broadcast");
  assert.match(individual, /individual/);
  assert.match(broadcast, /broadcast/);
  assert.match(individual, /intro copy only/i);
  assert.match(individual, /Do not put scenario rows/);
  assert.notEqual(individual, broadcast);
});

test("guide payload and banned-link pattern stay in sync", () => {
  const payload = buildAdminEmailGuidePromptPayload({
    audienceMode: "broadcast",
    generatedImageAssetsCount: 4,
  });
  assert.equal(payload.generatedImageAssetsCount, 4);
  assert.equal(payload.audienceGuidance, buildAdminEmailAudienceGuidance("broadcast"));
  assert.deepEqual(
    [...payload.generationGuide.bannedTextLinkLabels],
    [...ADMIN_EMAIL_GENERATION_GUIDE.bannedTextLinkLabels],
  );
  assert.match(bannedAdminEmailTextLinkPattern(), /Turn a flyer into a live event card/);
});
