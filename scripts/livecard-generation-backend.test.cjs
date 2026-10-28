const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const { generateSharedCard, sharedCardGenerationDeps } = loadTs("src/lib/shared-card-generation.ts", {}, cache);
const { createLiveCardForm } = loadTs("src/lib/livecard-builder.ts", {}, cache);
const { liveCardGenerationErrorResponse } = loadTs("src/lib/livecard-generation-failure.ts", {}, cache);

test("background generation retains usable artwork through all checker findings", async (t) => {
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
  const advisoryIssues = [
    "unexpected_text", "incorrect_title", "unsafe_placement", "reference_mismatch",
    "unreadable_text", "missing_copy", "weak_composition", "style_mismatch",
    "requested_change_not_applied", "faux_controls", "device_frame", "forbidden_footer", "essential_clipping",
  ];
  for (const issue of advisoryIssues) {
    sharedCardGenerationDeps.verify = async (_image, _event, _product, context) => {
      assert.equal(context.safetyOnly, true, "the background receives a focused content-safety check");
      return { status: "failed", issues: [issue, "private@example.com"] };
    };
    const stages = [];
    const result = await generateSharedCard(form, undefined, (stage) => stages.push(stage));
    assert.match(result.backgroundUrl, /^data:image\/webp;base64,/);
    assert.deepEqual(stages, ["preparing", "generating", "checking", "encoding"]);
  }
  assert.equal(generations, advisoryIssues.length, "each explicit generation finishes without automatic retry");
  assert.doesNotMatch(JSON.stringify(logs), /private@example|Private title|woodland party/);
  assert.ok(logs.every(([, entry]) => entry.outcome === "success"), "advisory findings are completed generation");
  sharedCardGenerationDeps.verify = async () => ({ status: "failed", issues: ["safety_mismatch", "private@example.com"] });
  assert.match((await generateSharedCard(form)).backgroundUrl, /^data:image\/webp;base64,/);
  assert.equal(generations, advisoryIssues.length + 1, "checker findings do not reject artwork or request another image");
  sharedCardGenerationDeps.verify = async () => ({ status: "unavailable", issues: [], unavailableReason: "checker_error" });
  assert.match((await generateSharedCard(form)).backgroundUrl, /^data:image\/webp;base64,/);
  assert.equal(logs.at(-1)[1].outcome, "verification_unavailable");
  sharedCardGenerationDeps.verify = async () => ({ status: "passed", issues: [] });
  assert.match((await generateSharedCard(form)).backgroundUrl, /^data:image\/webp;base64,/);
  sharedCardGenerationDeps.generateImage = async () => ({ ok: true, imageDataUrl: "data:image/png;base64,bm90YW5pbWFnZQ==" });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "invalid_artwork");
  assert.equal(logs.filter(([name]) => name === "livecard_generation").at(-1)[1].outcome, "invalid_artwork");
  sharedCardGenerationDeps.generateImage = async () => ({ ok: false, error: { code: "safety_refused", message: "Provider declined the request" } });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "safety_refused");
  sharedCardGenerationDeps.generateImage = async () => ({ ok: false, error: { message: "Provider temporarily unavailable" } });
  await assert.rejects(generateSharedCard(form), (error) => error.code === "generation_failed");
});
