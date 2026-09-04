import test from "node:test";
import assert from "node:assert/strict";
import { hubStatusLabel, campaignChannels, campaignTitle } from "./marketing-hub.ts";

test("hubStatusLabel hides pipeline jargon from the library", () => {
  assert.equal(hubStatusLabel("running"), "Generating");
  assert.equal(hubStatusLabel("queued"), "Generating");
  assert.equal(hubStatusLabel("awaiting_caption_review"), "Ready");
  assert.equal(hubStatusLabel("done"), "Done");
  assert.equal(hubStatusLabel("failed"), "Failed");
});

test("campaign helpers read stored request fields", () => {
  const run = {
    runId: "run-1",
    request: {
      input: {
        campaignName: "Birthday delay",
        channels: ["instagram", "tiktok"],
      },
    },
  };
  assert.equal(campaignTitle(run), "Birthday delay");
  assert.deepEqual(campaignChannels(run), ["instagram", "tiktok"]);
});
