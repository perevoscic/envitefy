import assert from "node:assert/strict";
import test from "node:test";
import { runStudioVersion, type StudioWorkerDependencies } from "./worker-core.ts";
import { StudioProviderError } from "./provider-errors.ts";
import { DEFAULT_STUDIO_SETTINGS, type StudioAsset, type StudioConversation, type StudioVersion } from "./types.ts";

function fixture(output: StudioVersion["output"] = "image") {
  let version: StudioVersion = {
    id: "v1", conversationId: "conversation", parentVersionId: null, output, status: "queued",
    input: { clientRequestId: "request", text: "Turn scattered invitations into one clear event page", settings: { ...DEFAULT_STUDIO_SETTINGS, output }, parentVersionId: null, referenceAssetIds: [] },
    result: null, provider: {}, error: null, createdAt: "2026-09-04T00:00:00Z", updatedAt: "2026-09-04T00:00:00Z",
  };
  let claimed = false;
  const versions = new Map<string, StudioVersion>();
  const assets = new Map<string, { asset: StudioAsset; bytes: Buffer }>();
  const calls = { develop: 0, image: 0, video: 0, poll: 0, download: 0, save: 0, finish: 0 };
  const conversation: StudioConversation = { id: "conversation", title: "Idea", settings: { ...DEFAULT_STUDIO_SETTINGS }, draft: "", selectedVersionId: null, referenceAssetIds: [], latestVersion: null, updatedAt: version.updatedAt, messages: [], versions: [], attachments: [] };
  const dependencies: StudioWorkerDependencies = {
    now: () => Date.parse("2026-09-04T00:00:00Z"),
    async claimVersion() {
      if (claimed || ["ready", "failed", "submission_unknown"].includes(version.status)) return null;
      claimed = true;
      return { version: structuredClone(version), leaseToken: "lease" };
    },
    async updateClaimedVersion(_id, _token, patch, release = true) { if (!claimed) return false; version = { ...version, ...patch }; if (release) claimed = false; return true; },
    async getVersion(id) { return id === version.id ? version : versions.get(id) || null; },
    async getConversation() { return conversation; },
    async readAsset(id) { return assets.get(id) || null; },
    async saveAsset(input) {
      calls.save++;
      const id = `asset-${calls.save}`;
      const asset = { id, conversationId: input.conversationId, versionId: input.versionId, name: input.name, mimeType: input.mimeType, size: input.bytes.length, url: `/asset/${id}` };
      assets.set(id, { asset, bytes: input.bytes }); return asset;
    },
    async developIdea() { calls.develop++; return { prompt: "A clear event page in a warm editorial photo.", direction: "Show the benefit.", caption: "Your event, all in one place.", headline: "One shared plan" }; },
    async generateImage() { calls.image++; return { bytes: Buffer.from("generated-image"), mimeType: "image/png", model: "image-model" }; },
    async submitVideo() { calls.video++; return { id: "interaction-1", model: "omni", status: "running" }; },
    async pollVideo() { calls.poll++; return { id: "interaction-1", model: "omni", status: "running" }; },
    async downloadVideo() { calls.download++; return Buffer.from("video"); },
    async finishImage(bytes) { calls.finish++; return { bytes: Buffer.concat([bytes, Buffer.from("+finished")]), width: 1024, height: 1024 }; },
    async finishVideo(bytes) { calls.finish++; return { bytes, width: 720, height: 1280, durationSec: 10 }; },
  };
  return { dependencies, calls, assets, versions, conversation, get version() { return version; }, set version(value: StudioVersion) { version = value; }, async run() { await runStudioVersion("v1", dependencies); } };
}

test("one idea produces one image and separate raw and finished assets", async () => {
  const f = fixture(); await f.run();
  assert.equal(f.version.status, "ready"); assert.equal(f.calls.image, 1);
  assert.notEqual(f.version.result?.assetId, f.version.result?.rawAssetId);
  assert.equal(f.assets.get(f.version.result!.rawAssetId!)?.bytes.toString(), "generated-image");
  assert.equal(f.assets.get(f.version.result!.assetId!)?.bytes.toString(), "generated-image+finished");
});

test("saving a manually edited production prompt never calls providers or trims its bytes", async () => {
  const f = fixture("prompt"); f.version.input.promptOverride = "  My exact\nproduction prompt.  "; await f.run();
  assert.equal(f.version.status, "ready"); assert.equal(f.version.result?.prompt, "  My exact\nproduction prompt.  ");
  assert.equal(f.calls.develop + f.calls.image + f.calls.video, 0);
});

test("create image from an edited prompt sends that exact prompt to generation", async () => {
  const f = fixture(); const exact = " Preserve\nthis exact text. "; f.version.input.promptOverride = exact;
  f.dependencies.generateImage = async request => { assert.equal(request.prompt, exact); return { bytes: Buffer.from("image"), mimeType: "image/png", model: "model" }; };
  await f.run(); assert.equal(f.calls.develop, 0); assert.equal(f.version.status, "ready");
});

test("two concurrent workers claim a version once", async () => {
  const f = fixture(); await Promise.all([f.run(), f.run(), f.run()]);
  assert.equal(f.calls.image, 1); assert.equal(f.calls.develop, 1); assert.equal(f.version.status, "ready");
});

test("image follow-up edits the selected original image, never the captioned result", async () => {
  const f = fixture();
  const parent = { ...structuredClone(f.version), id: "earlier", status: "ready" as const, result: { prompt: "Previous composition", caption: "Caption", direction: "Direction", rawAssetId: "raw", assetId: "finished" } };
  f.versions.set(parent.id, parent); f.version.parentVersionId = parent.id;
  for (const id of ["raw", "finished", "attachment"]) f.assets.set(id, { asset: { id, conversationId: "conversation", versionId: parent.id, name: `${id}.png`, mimeType: "image/png", size: 3, url: "" }, bytes: Buffer.from(id) });
  f.version.input.referenceAssetIds = ["attachment"];
  f.dependencies.generateImage = async request => { assert.deepEqual(request.references.map(reference => reference.bytes.toString()), ["raw", "attachment"]); return { bytes: Buffer.from("edit"), mimeType: "image/png", model: "model" }; };
  await f.run(); assert.equal(f.version.status, "ready");
});

test("out-of-conversation reference fails before any image submission", async () => {
  const f = fixture(); f.version.input.referenceAssetIds = ["other"];
  f.assets.set("other", { asset: { id: "other", conversationId: "another", versionId: null, name: "other.png", mimeType: "image/png", size: 3, url: "" }, bytes: Buffer.from("raw") });
  await f.run(); assert.equal(f.version.status, "failed"); assert.equal(f.calls.image, 0);
});

test("ambiguous image submissions are terminal and never automatically repeated", async () => {
  const f = fixture(); f.dependencies.generateImage = async () => { f.calls.image++; throw new StudioProviderError("Connection lost", "ambiguous"); };
  await f.run(); await f.run(); assert.equal(f.version.status, "submission_unknown"); assert.equal(f.calls.image, 1);
});

test("a raw image storage failure after generation is ambiguous and never regenerated", async () => {
  const f = fixture(); f.dependencies.saveAsset = async () => { throw new Error("Storage unavailable"); };
  await f.run(); await f.run(); assert.equal(f.version.status, "submission_unknown"); assert.equal(f.calls.image, 1);
});

test("image finishing can retry the original bytes without another provider request", async () => {
  const f = fixture(); const finish = f.dependencies.finishImage;
  f.dependencies.finishImage = async () => { throw new Error("Compositor unavailable"); }; await f.run();
  assert.equal(f.version.status, "finalizing"); assert.ok(f.version.result?.rawAssetId);
  f.dependencies.finishImage = finish; await f.run(); assert.equal(f.version.status, "ready"); assert.equal(f.calls.image, 1);
});

test("video interaction persists and resumes after the browser closes", async () => {
  const f = fixture("video"); await f.run();
  assert.equal(f.version.status, "running"); assert.equal(f.version.provider.interactionId, "interaction-1");
  f.dependencies.pollVideo = async id => { assert.equal(id, "interaction-1"); return { id, model: "omni", status: "completed", videoBytes: Buffer.from("mp4-with-audio") }; };
  await f.run(); assert.equal(f.version.status, "ready"); assert.equal(f.calls.video, 1);
  assert.equal(f.assets.get(f.version.result!.assetId!)?.bytes.toString(), "mp4-with-audio");
});

test("download retries always retrieve the same saved provider output", async () => {
  const f = fixture("video");
  f.dependencies.submitVideo = async () => { f.calls.video++; return { id: "saved", model: "omni", status: "completed", videoUri: "files/result" }; };
  f.dependencies.downloadVideo = async uri => { f.calls.download++; assert.equal(uri, "files/result"); throw new StudioProviderError("Interrupted download", "retryable"); };
  await f.run(); assert.equal(f.version.status, "finalizing"); assert.equal(f.version.provider.interactionId, "saved");
  f.dependencies.downloadVideo = async uri => { assert.equal(uri, "files/result"); return Buffer.from("complete-mp4"); };
  await f.run(); assert.equal(f.version.status, "ready"); assert.equal(f.calls.video, 1);
});

test("video follow-up sends the selected provider interaction for true edits", async () => {
  const f = fixture("video");
  const parent = { ...structuredClone(f.version), id: "parent", status: "ready" as const, provider: { interactionId: "selected-interaction" }, result: { prompt: "previous", direction: "", caption: "", rawAssetId: "parent-video" } };
  f.versions.set(parent.id, parent); f.version.parentVersionId = parent.id;
  f.dependencies.submitVideo = async request => { assert.equal(request.previousInteractionId, "selected-interaction"); return { id: "new-interaction", model: "omni", status: "completed", videoBytes: Buffer.from("edited-video") }; };
  await f.run(); assert.equal(f.version.status, "ready"); assert.equal(f.version.provider.interactionId, "new-interaction");
});

test("an expired download URI recovers from the same saved interaction without regeneration", async () => {
  const f = fixture("video");
  f.dependencies.submitVideo = async () => { f.calls.video++; return { id: "saved-interaction", model: "omni", status: "completed", videoUri: "files/expired" }; };
  f.dependencies.downloadVideo = async () => { throw new StudioProviderError("File expired", "rejected", 404); };
  f.dependencies.pollVideo = async id => { assert.equal(id, "saved-interaction"); return { id, model: "omni", status: "completed", videoBytes: Buffer.from("saved-video") }; };
  await f.run(); assert.equal(f.version.status, "ready"); assert.equal(f.calls.video, 1);
});

test("only an explicit expired-context rejection restores the saved original clip", async () => {
  const f = fixture("video");
  const parent = { ...structuredClone(f.version), id: "parent", status: "ready" as const, provider: { interactionId: "expired" }, result: { prompt: "previous", direction: "", caption: "", rawAssetId: "parent-video", durationSec: 10 } };
  f.versions.set(parent.id, parent); f.version.parentVersionId = parent.id;
  f.assets.set("parent-video", { asset: { id: "parent-video", conversationId: "conversation", versionId: "parent", name: "original.mp4", mimeType: "video/mp4", size: 3, url: "" }, bytes: Buffer.from("saved-original") });
  f.dependencies.submitVideo = async request => {
    f.calls.video++;
    if (request.previousInteractionId) throw new StudioProviderError("Previous interaction expired", "expired_context");
    assert.equal(request.restoredVideo?.bytes.toString(), "saved-original");
    return { id: "restored", model: "omni", status: "completed", videoBytes: Buffer.from("restored-video") };
  };
  await f.run(); assert.equal(f.calls.video, 2); assert.equal(f.version.status, "ready"); assert.equal(f.version.provider.usedRestoredContext, true);
});

test("ambiguous video submission never retries by restoring context", async () => {
  const f = fixture("video"); f.dependencies.submitVideo = async () => { f.calls.video++; throw new StudioProviderError("Timed out", "ambiguous"); };
  await f.run(); await f.run(); assert.equal(f.calls.video, 1); assert.equal(f.version.status, "submission_unknown");
});

test("the worker stops before submitting when its lease is lost", async () => {
  const f = fixture(); f.dependencies.updateClaimedVersion = async () => false;
  await f.run(); assert.equal(f.calls.develop + f.calls.image + f.calls.video, 0);
});
