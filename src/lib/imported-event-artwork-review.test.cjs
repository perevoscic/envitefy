const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

test("sports visual review validates output and checks physical contact without classifying demographics", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  const module = loadTs("src/lib/imported-event-artwork-review.ts", {
    "./creation/openai-workloads": {
      creationModelBudget: () => ({}), creationTimeoutMs: () => 30000, recordCreationModelRun: () => {},
    },
  });
  let answer = { issues: [{ code: "unsupported_pose", detail: "Left supporting foot has no contact with the beam." }] };
  let expectedCity = "";
  let expectedReference;
  module.sportsArtworkReviewDeps.createClient = () => ({ chat: { completions: {
    create: async (request, options) => {
      assert.equal(options.maxRetries, 0);
      const instructions = request.messages[0].content;
      assert.match(instructions, /Trace supporting feet or hands/);
      assert.match(instructions, /airborne phase of a credible leap or jump needs no foot contact/);
      assert.match(instructions, /destination montage/);
      assert.match(instructions, /Never classify, infer, score or reject race/);
      assert.equal(JSON.parse(request.messages[1].content[0].text).city, expectedCity);
      assert.match(instructions, /report unexpected_person/i);
      assert.match(instructions, /report venue_mismatch/);
      assert.match(instructions, /City scenery is not required/);
      const images = request.messages[1].content.filter(part => part.type === "image_url");
      assert.equal(images.length, expectedReference ? 2 : 1);
      if (expectedReference) assert.equal(images[1].image_url.url, "data:image/jpeg;base64,cGhvdG8=");
      return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(answer) } }] };
    },
  } } });
  try {
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "failed");
    answer = { issues: [] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "passed");
    expectedCity = "Palmetto, FL";
    expectedReference = { venue: "Bradenton Area Convention Center", image: { mimeType: "image/jpeg", data: "cGhvdG8=" } };
    for (const code of ["unexpected_person", "missing_venue", "venue_mismatch"]) {
      answer = { issues: [{ code, detail: "Visible brief mismatch." }] };
      assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics", expectedCity, expectedReference)).status, "failed");
    }
    expectedReference = undefined;
    expectedCity = "";
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "failed", "the venue brief applies even without a city");
    expectedCity = "Palmetto, FL";
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "football", expectedCity)).status, "passed", "venue architecture requirements are gymnastics-only");
    expectedCity = "";
    answer = { issues: [{ code: "missing_venue", detail: "No venue building." }] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics", "", undefined, "town")).status, "passed", "town fallback never requires a venue");
    answer = { issues: [{ code: "missing_town", detail: "Only oversized accessories appear." }] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics", "", undefined, "town")).status, "failed");
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "passed", "venue illustrations are not required to depict town scenery");
    answer = { issues: [{ code: "race", detail: "Invalid issue category" }] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "unavailable");
    module.sportsArtworkReviewDeps.createClient = () => { throw new Error("provider timeout"); };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "unavailable");
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
