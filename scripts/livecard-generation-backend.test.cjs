const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const { generateSharedCard, sharedCardGenerationDeps } = loadTs("src/lib/shared-card-generation.ts", {}, cache);
const { createLiveCardForm } = loadTs("src/lib/livecard-builder.ts", {}, cache);
const { liveCardGenerationErrorResponse } = loadTs("src/lib/livecard-generation-failure.ts", {}, cache);

test("background failures expose a specific reason, never auto-retry, and keep diagnostics bounded", async (t) => {
  const original = { ...sharedCardGenerationDeps };
  t.after(() => Object.assign(sharedCardGenerationDeps, original));
  const image = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#aabbcc" } }).png().toBuffer();
  sharedCardGenerationDeps.createClient = () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ font: "classic", typography: "storybook", ink: "#000000", accent: "#111111", surface: "#ffffff" }) } }] }) } } });
  sharedCardGenerationDeps.references = async () => [];
  let generations = 0;
  sharedCardGenerationDeps.generateImage = async () => {
    generations++;
    return { ok: true, imageDataUrl: `data:image/png;base64,${image.toString("base64")}` };
  };
  sharedCardGenerationDeps.encode = async (bytes) => sharp(bytes).webp().toBuffer();
  const logs = [];
  t.mock.method(console, "info", (...args) => logs.push(args));
  const form = { ...createLiveCardForm(), eventType: "Birthday", design: "A woodland party", title: "Private title" };
  sharedCardGenerationDeps.verify = async () => ({ status: "failed", issues: ["unexpected_text", "private@example.com"] });
  await assert.rejects(generateSharedCard(form), (error) => {
    assert.equal(error.code, "quality_rejected");
    assert.match(error.message, /included lettering/);
    assert.doesNotMatch(error.message, /previous artwork/);
    assert.deepEqual(liveCardGenerationErrorResponse(error, "design").issues, ["unexpected_text"]);
    return true;
  });
  assert.equal(generations, 1);
  assert.doesNotMatch(JSON.stringify(logs), /private@example|Private title|woodland party/);
  sharedCardGenerationDeps.verify = async () => ({ status: "failed", issues: ["style_mismatch"] });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "quality_rejected" && /design check/.test(error.message));
  assert.equal(generations, 2);
  sharedCardGenerationDeps.verify = async () => ({ status: "passed", issues: [] });
  assert.match((await generateSharedCard(form)).backgroundUrl, /^data:image\/webp;base64,/);
  sharedCardGenerationDeps.generateImage = async () => ({ ok: true, imageDataUrl: "data:image/png;base64,bm90YW5pbWFnZQ==" });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "invalid_artwork");
  assert.equal(logs.filter(([name]) => name === "livecard_generation").at(-1)[1].outcome, "invalid_artwork");
  sharedCardGenerationDeps.generateImage = async () => ({ ok: false, error: { message: "Provider temporarily unavailable" } });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "generation_failed");
});
