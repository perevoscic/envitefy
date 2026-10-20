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
  module.sportsArtworkReviewDeps.createClient = () => ({ chat: { completions: {
    create: async (request, options) => {
      assert.equal(options.maxRetries, 0);
      const instructions = request.messages[0].content;
      assert.match(instructions, /Trace supporting feet or hands/);
      assert.match(instructions, /Never classify, infer, score or reject race/);
      assert.ok(!JSON.stringify(request.messages).includes("Atlanta"));
      return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(answer) } }] };
    },
  } } });
  try {
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "failed");
    answer = { issues: [] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "passed");
    answer = { issues: [{ code: "race", detail: "Invalid issue category" }] };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "unavailable");
    module.sportsArtworkReviewDeps.createClient = () => { throw new Error("provider timeout"); };
    assert.equal((await module.reviewImportedSportsArtwork("data:image/webp;base64,aA==", "gymnastics")).status, "unavailable");
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
