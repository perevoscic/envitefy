import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { mock } from "node:test";
import sharp from "sharp";
registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2))) : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  return url && existsSync(new URL(`${url}.ts`)) ? next(`${url}.ts`, context) : next(specifier, context);
} });
const { prepareStudioImageGeometry, validateStudioImageGeometry } = await import("./image-geometry.ts");
const { generateStudioInvitation, studioGenerationDeps: deps } = await import("./generate.ts");
async function picture(width, height) {
  return `data:image/png;base64,${(await sharp({ create: { width, height, channels: 3, background: "#123456" } }).png().toBuffer()).toString("base64")}`;
}
const portrait = await picture(1024, 1536);
const tall = await picture(1024, 2176);
const landscape = await picture(1536, 1024);
const wide = await picture(1280, 720);
const invalid = "data:image/png;base64,YmFk";
const event = { title: "September 23 Gathering", date: "2026-09-23", requiredArtworkLines: ["Welcome together"] };
test.afterEach(() => mock.restoreAll());
function setup() {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => ({ riskLevel: "safe" }));
  mock.method(deps, "applyStudioThemeNormalization", (value) => value);
  mock.method(deps, "resolveStudioReferenceImages", async () => []);
  mock.method(deps, "composeFlyerExport", async (image) => image);
  mock.method(deps, "generateStudioLiveCardWithOpenAi", async () => ({ ok: false, warnings: [], error: { provider: "openai", code: "offline_copy_fixture", message: "No model call", retryable: false } }));
  mock.method(deps, "verifyStudioArtwork", async () => ({ status: "passed", issues: [] }));
}
test("metadata-only success cannot accept truncated or undecodable image bytes", async () => {
  const expected = await prepareStudioImageGeometry("live_card");
  assert.equal((await validateStudioImageGeometry(tall, expected)).ok, true);
  assert.equal((await validateStudioImageGeometry(portrait, expected)).issue, "image_geometry_mismatch");
  assert.equal((await validateStudioImageGeometry(invalid, expected)).issue, "invalid_image");
  const bytes = Buffer.from(portrait.split(",")[1], "base64");
  const truncated = `data:image/png;base64,${bytes.subarray(0, Math.floor(bytes.length / 2)).toString("base64")}`;
  assert.equal((await validateStudioImageGeometry(truncated, expected)).issue, "invalid_image");
  assert.equal((await validateStudioImageGeometry(landscape, expected)).issue, "image_geometry_mismatch");
  assert.equal((await validateStudioImageGeometry(await picture(64, 96), expected)).issue, "image_geometry_mismatch");
});
test("new Live Cards generate at the tall mobile ratio and edits retain it", async () => {
  const expected = { width: 1024, height: 2176, size: "1024x2176" };
  assert.deepEqual(await prepareStudioImageGeometry("live_card"), expected);
  assert.deepEqual(await prepareStudioImageGeometry("live_card", tall), expected);
  assert.deepEqual(await prepareStudioImageGeometry("live_card", portrait), { width: 1024, height: 1536, size: "1024x1536" });
  setup();
  mock.method(deps, "generateInvitationImageWithOpenAi", async (_prompt, _refs, product, options) => {
    assert.equal(product, "live_card");
    assert.equal(options.size, "1024x2176");
    return { ok: true, warnings: [], imageDataUrl: tall };
  });
  const result = await generateStudioInvitation({ event, product: "live_card", mode: "image" });
  assert.equal(result.ok, true);
  assert.equal(result.imageDataUrl, tall);
});
test("source shape wins over a new-card default and unsupported ratios use auto without cropping", async () => {
  assert.deepEqual(await prepareStudioImageGeometry("live_card", landscape), { width: 1536, height: 1024, size: "1536x1024" });
  const expected = await prepareStudioImageGeometry("live_card", wide);
  assert.deepEqual(expected, { width: 1280, height: 720, size: "auto" });
  assert.equal((await validateStudioImageGeometry(wide, expected)).ok, true);
  assert.equal((await validateStudioImageGeometry(landscape, expected)).issue, "image_geometry_mismatch");
});
test("source geometry uses displayed EXIF orientation instead of raw JPEG header dimensions", async () => {
  const rotated = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#123456" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const expected = await prepareStudioImageGeometry("live_card", `data:image/jpeg;base64,${rotated.toString("base64")}`);
  assert.deepEqual(expected, { width: 1024, height: 1536, size: "1024x1536" });
  assert.equal((await validateStudioImageGeometry(portrait, expected)).ok, true);
});
test("damaged source is rejected before normalization or any provider call", async () => {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("Provider must not run"); });
  const result = await generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: invalid, editInstruction: "Darker background" } });
  assert.equal(result.errors.image.code, "invalid_source_geometry");
  assert.equal(result.timings.imageAttempts, 0);
});
test("initial wrong-orientation candidate repairs once and reaches QA only after shape is corrected", async () => {
  setup();
  let qaCalls = 0;
  let repairs = 0;
  mock.method(deps, "generateInvitationImageWithOpenAi", async () => ({ ok: true, warnings: [], imageDataUrl: portrait }));
  mock.method(deps, "editInvitationImageWithOpenAi", async (_prompt, _source, _refs, options) => {
    repairs++;
    assert.equal(options.size, "1536x1024");
    return { ok: true, warnings: [], imageDataUrl: landscape };
  });
  mock.method(deps, "verifyStudioArtwork", async () => { qaCalls++; return { status: "passed", issues: [] }; });
  const result = await generateStudioInvitation({ event, product: "event_page", mode: "image" });
  assert.equal(result.ok, true);
  assert.equal(result.imageDataUrl, landscape);
  assert.equal(repairs, 1);
  assert.equal(qaCalls, 1);
  assert.deepEqual(result.diagnostics.checks[0].issues, ["image_geometry_mismatch"]);
});
test("an edited valid source retains its source geometry despite product defaults", async () => {
  setup();
  mock.method(deps, "editInvitationImageWithOpenAi", async (_prompt, _source, _refs, options) => {
    assert.equal(options.size, "auto");
    return { ok: true, warnings: [], imageDataUrl: wide };
  });
  const result = await generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: wide, editInstruction: "Darker background" } });
  assert.equal(result.ok, true);
  assert.equal(result.imageDataUrl, wide);
});
test("a repair that changes geometry cannot replace accepted artwork or reach export", async () => {
  setup();
  let images = 0;
  let qaCalls = 0;
  mock.method(deps, "editInvitationImageWithOpenAi", async () => ({ ok: true, warnings: [], imageDataUrl: ++images === 1 ? portrait : landscape }));
  mock.method(deps, "verifyStudioArtwork", async () => { qaCalls++; return { status: "failed", issues: ["missing_copy"] }; });
  mock.method(deps, "composeFlyerExport", async () => { throw new Error("Rejected image cannot be exported"); });
  const result = await generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: portrait, editInstruction: "Darker background" } });
  assert.equal(result.ok, false);
  assert.equal(result.imageDataUrl, null);
  assert.equal(images, 2);
  assert.equal(qaCalls, 1);
  assert.deepEqual(result.diagnostics.checks[1].issues, ["image_geometry_mismatch"]);
});
test("an undecodable generated candidate is never previewed as complete, verified or exported", async () => {
  setup();
  const previews = [];
  mock.method(deps, "editInvitationImageWithOpenAi", async () => ({ ok: true, warnings: [], imageDataUrl: invalid }));
  mock.method(deps, "verifyStudioArtwork", async () => { throw new Error("Corrupt bytes must not reach vision"); });
  const result = await generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: portrait, editInstruction: "Darker background" } }, { onProgress: (progress) => { if (progress.type === "preview") previews.push(progress); } });
  assert.equal(result.ok, false);
  assert.equal(result.timings.imageAttempts, 1);
  assert.deepEqual(result.diagnostics.checks[0].issues, ["invalid_image"]);
  assert.deepEqual(previews, []);
});
