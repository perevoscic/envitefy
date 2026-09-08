import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { mock } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2)))
    : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  if (url && existsSync(new URL(`${url}.ts`))) return next(`${url}.ts`, context);
  return next(specifier, context);
} });
const { generateStudioInvitation, studioGenerationDeps: deps } = await import("./generate.ts");
const { generateAndPersistInvitation, generationResponseDeps, invitationResponseStream } = await import("./generation-response.ts");
const { readGenerationStream } = await import("./generation-progress.ts");
const { createInitialDetails, sanitizeInvitationData, sanitizeStudioGenerateResponse } = await import("../../app/studio/studio-workspace-sanitize.ts");
const { refreshLiveCardInvitationData } = await import("../../app/studio/studio-workspace-builders.ts");

const image = "data:image/png;base64,ZmluYWw=";
const request = { mode: "image", product: "live_card", surface: "page", event: { title: "LIVIA IS TURNING 10!", category: "Birthday", links: [] }, imageEdit: { sourceImageDataUrl: image, editInstruction: "Add stars" } };
const result = () => ({ ok: true, mode: "image", product: "live_card", qualityCheck: "passed", imageDataUrl: image, liveCard: null, invitation: null, warnings: [], timings: { totalMs: 5, stagesMs: { generating: 4, checking: 1 }, imageAttempts: 1, firstPreviewMs: 2 } });
function setup() {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => ({ riskLevel: "safe" }));
  mock.method(deps, "applyStudioThemeNormalization", (value) => value);
  mock.method(deps, "resolveStudioReferenceImages", async () => []);
  mock.method(deps, "editInvitationImageWithOpenAi", async (_prompt, _source, _product, options) => {
    options.onPartialImage?.("data:image/png;base64,cGFydGlhbA==");
    return { ok: true, imageDataUrl: image, warnings: [] };
  });
  mock.method(deps, "composeFlyerExport", async (value) => value);
}
test.afterEach(() => mock.restoreAll());

test("the completed image is previewed before QA, but completion waits for QA", async () => {
  setup();
  const events = [];
  let releaseQA;
  let announceQA;
  const checking = new Promise((resolve) => { announceQA = resolve; });
  const gate = new Promise((resolve) => { releaseQA = resolve; });
  mock.method(deps, "verifyStudioArtwork", async () => { announceQA(); return gate; });
  let completed = false;
  const running = generateStudioInvitation(request, { onProgress: (event) => events.push(event) }).then((value) => { completed = true; return value; });
  await checking;
  assert.equal(completed, false);
  assert.deepEqual(events.slice(-2), [{ type: "preview", imageDataUrl: image, partial: false }, { type: "stage", stage: "checking" }]);
  assert.ok(events.some((event) => event.type === "preview" && event.partial));
  releaseQA({ status: "passed", issues: [] });
  const generated = await running;
  assert.equal(generated.ok, true);
  assert.equal(generated.imageDataUrl, image);
  assert.equal(generated.timings.imageAttempts, 1);
});
test("failed artwork gets one visible repair and never becomes the saved result", async () => {
  setup();
  const events = [];
  mock.method(deps, "verifyStudioArtwork", async () => ({ status: "failed", issues: ["missing_subject"], repairInstructions: ["Restore the toy performers"] }));
  const generated = await generateStudioInvitation(request, { onProgress: (event) => events.push(event) });
  assert.equal(generated.ok, false);
  assert.equal(generated.imageDataUrl, null);
  assert.equal(generated.timings.imageAttempts, 2);
  assert.equal(events.filter((event) => event.type === "stage" && event.stage === "repairing").length, 1);
  assert.equal(events.filter((event) => event.type === "preview" && !event.partial).length, 2);
});
test("persistence follows generation checks and publishes a final durable URL with timings", async () => {
  let uploaded = false;
  mock.method(generationResponseDeps, "generateStudioInvitation", async (_request, options) => {
    options.onProgress({ type: "preview", imageDataUrl: image, partial: false });
    options.onProgress({ type: "stage", stage: "checking" });
    assert.equal(uploaded, false);
    return result();
  });
  mock.method(generationResponseDeps, "processBufferUpload", async () => { uploaded = true; return { stored: { display: { url: "/api/blob/verified.webp" } } }; });
  const events = [];
  const final = await readGenerationStream(invitationResponseStream((options) => generateAndPersistInvitation(request, options)), (event) => events.push(event));
  assert.equal(final.imageUrl, "/api/blob/verified.webp");
  assert.equal(final.imageDataUrl, null);
  assert.equal(final.qualityCheck, "passed");
  assert.ok(final.timings.stagesMs.saving >= 0);
  assert.equal(events.at(-1).stage, "saving");
});
test("stream cancellation aborts in-flight generation", async () => {
  let providerSignal;
  const stream = invitationResponseStream(async (options) => {
    providerSignal = options.signal;
    await new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true }));
    return result();
  });
  await stream.cancel();
  assert.equal(providerSignal.aborted, true);
});
test("transport failures after a preview remain errors", async () => {
  const stream = invitationResponseStream(async (options) => {
    options.onProgress({ type: "preview", imageDataUrl: image, partial: false });
    throw new Error("Provider connection failed");
  });
  await assert.rejects(readGenerationStream(stream), /Provider connection failed/);
});
test("artwork contract and QA notice survive saving, reopening, and detail refreshes", () => {
  const details = { ...createInitialDetails(), name: "Livia", eventTitle: "LIVIA IS TURNING 10!", category: "Birthday" };
  const previous = refreshLiveCardInvitationData(details, { artworkTextMode: "headline", artworkNotice: "Please review" });
  const restored = sanitizeInvitationData(previous, details);
  const updated = refreshLiveCardInvitationData({ ...details, date: "2026-10-25" }, restored);
  assert.equal(updated.artworkTextMode, "headline");
  assert.equal(updated.artworkNotice, "Please review");
  const generated = sanitizeStudioGenerateResponse({ ...result(), artworkTextMode: "headline" });
  assert.equal(generated.artworkTextMode, "headline");
  assert.equal(generated.timings.firstPreviewMs, 2);
  assert.equal(sanitizeStudioGenerateResponse({ ...result(), timings: { totalMs: -1, stagesMs: {} } }).timings, undefined);
});
