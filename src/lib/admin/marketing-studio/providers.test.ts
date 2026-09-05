import assert from "node:assert/strict";
import test from "node:test";
import { buildStudioCreativeContext, createOmniProvider, googleVideoDownloadUrl, parseOmniInteraction } from "./providers.ts";
import { StudioProviderError } from "./provider-errors.ts";
import { DEFAULT_STUDIO_SETTINGS, type StudioConversation, type StudioVersion } from "./types.ts";

function json(value: object, status = 200): Response { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); }

test("a delayed generation uses only messages that existed when its turn was submitted", () => {
  const version: StudioVersion = {
    id: "pending", conversationId: "conversation", parentVersionId: null, output: "image", status: "queued",
    input: { clientRequestId: "request", text: "Keep the warm style", settings: DEFAULT_STUDIO_SETTINGS, parentVersionId: null, referenceAssetIds: [] },
    result: null, provider: {}, error: null, createdAt: "2026-09-04T12:00:00.000Z", updatedAt: "2026-09-04T12:05:00.000Z",
  };
  const conversation: StudioConversation = {
    id: "conversation", title: "Ideas", settings: DEFAULT_STUDIO_SETTINGS, draft: "", referenceAssetIds: [], selectedVersionId: version.id,
    updatedAt: "2026-09-04T12:05:00.000Z", latestVersion: version, versions: [version], attachments: [],
    messages: [
      { id: "before", versionId: "previous", role: "user", text: "Use a warm editorial style", createdAt: "2026-09-04T11:59:00.000Z" },
      { id: "current", versionId: version.id, role: "user", text: "Keep the warm style", createdAt: version.createdAt },
      { id: "later", versionId: "another-tab", role: "user", text: "Change everything to a dark futuristic look", createdAt: "2026-09-04T12:01:00.000Z" },
      { id: "late-result", versionId: "previous", role: "assistant", text: "A result completed after this turn was submitted", createdAt: "2026-09-04T12:02:00.000Z" },
    ],
  };
  const context = buildStudioCreativeContext({ version, parent: null, conversation });
  assert.deepEqual(context.recentConversation, [{ role: "user", text: "Use a warm editorial style" }]);
  assert.equal(context.request, "Keep the warm style");
});

test("Omni submits one background, stored 720p interaction with the selected parent", async () => {
  let calls = 0;
  const video = createOmniProvider({ apiKey: "test-key", fetch: async (url, init) => {
    calls++; assert.equal(String(url), "https://generativelanguage.googleapis.com/v1beta/interactions");
    assert.equal(init?.method, "POST"); assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-key");
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.model, "gemini-omni-1.1-flash"); assert.equal(payload.background, true); assert.equal(payload.store, true);
    assert.equal(payload.previous_interaction_id, "parent"); assert.equal(payload.input, "Exact prompt");
    assert.deepEqual(payload.response_format, { type: "video", aspect_ratio: "9:16", resolution: "720p", delivery: "uri" });
    return json({ id: "interaction", status: "in_progress" });
  } });
  const result = await video.submit({ prompt: "Exact prompt", format: "vertical", references: [], previousInteractionId: "parent" });
  assert.equal(result.status, "running"); assert.equal(calls, 1);
});

test("Omni uploads actual reference bytes and a restored clip using documented user_input content", async () => {
  const video = createOmniProvider({ apiKey: "test", fetch: async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.input[0].type, "user_input"); assert.equal(payload.input[0].content[0].type, "image");
    assert.equal(payload.input[0].content[0].data, Buffer.from("picture").toString("base64"));
    assert.equal(payload.input[0].content[1].type, "video"); assert.equal(payload.input[0].content[1].mime_type, "video/mp4");
    assert.equal(payload.response_format.aspect_ratio, "16:9"); assert.equal(payload.previous_interaction_id, undefined);
    return json({ id: "new", status: "in_progress" });
  } });
  await video.submit({ prompt: "Change the light", format: "horizontal", references: [{ name: "image.png", mimeType: "image/png", bytes: Buffer.from("picture") }], restoredVideo: { name: "original.mp4", mimeType: "video/mp4", bytes: Buffer.from("saved-movie") } });
});

test("Omni reads the real REST model_output steps and ignores user input video", () => {
  const result = parseOmniInteraction({ id: "one", status: "completed", steps: [
    { type: "user_input", content: [{ type: "video", data: Buffer.from("original").toString("base64") }] },
    { type: "model_output", content: [{ type: "video", mime_type: "video/mp4", data: Buffer.from("generated-with-audio").toString("base64") }] },
  ] });
  assert.equal(result.videoBytes?.toString(), "generated-with-audio"); assert.equal(result.status, "completed");
});

test("Omni accepts URI creation responses and base64 GET results", async () => {
  assert.equal(parseOmniInteraction({ id: "one", status: "completed", steps: [{ type: "model_output", content: [{ type: "video", uri: "files/one" }] }] }).videoUri, "files/one");
  const video = createOmniProvider({ apiKey: "test", fetch: async () => json({ id: "one", status: "completed", steps: [{ type: "model_output", content: [{ type: "video", data: Buffer.from("mp4").toString("base64") }] }] }) });
  assert.equal((await video.poll("one")).videoBytes?.toString(), "mp4");
});

test("a timed-out or 5xx submission is ambiguous and makes only one request", async () => {
  for (const failure of ["network", "500"]) {
    let calls = 0;
    const video = createOmniProvider({ apiKey: "test", fetch: async () => { calls++; if (failure === "network") throw new TypeError("Network failed"); return json({ error: { message: "Internal" } }, 500); } });
    await assert.rejects(video.submit({ prompt: "Idea", format: "vertical", references: [] }), error => error instanceof StudioProviderError && error.outcome === "ambiguous");
    assert.equal(calls, 1);
  }
});

test("expired interaction is distinguishable from model access failure", async () => {
  for (const [message, expected] of [["Previous interaction expired", "expired_context"], ["Requested entity was not found", "expired_context"], ["Model not found", "rejected"]]) {
    const video = createOmniProvider({ apiKey: "test", fetch: async () => json({ error: { message } }, 404) });
    await assert.rejects(video.submit({ prompt: "Idea", format: "vertical", references: [], previousInteractionId: "old" }), error => error instanceof StudioProviderError && error.outcome === expected);
  }
});

test("media downloads wait for Google ACTIVE then retain exact bytes including audio", async () => {
  const calls: string[] = [];
  const video = createOmniProvider({ apiKey: "test", fetch: async (url, init) => {
    calls.push(String(url)); assert.equal(init?.redirect, String(url).endsWith("files/video-id") ? "error" : "manual");
    if (String(url).endsWith("files/video-id")) return json({ state: "ACTIVE" });
    return new Response("mp4-audio-and-video", { headers: { "content-type": "video/mp4" } });
  } });
  assert.equal((await video.download("files/video-id"))?.toString(), "mp4-audio-and-video");
  assert.equal(calls.length, 2); assert.equal(calls[1], "https://generativelanguage.googleapis.com/v1beta/files/video-id:download?alt=media");
});

test("processing videos are left pending instead of downloaded prematurely", async () => {
  let calls = 0;
  const video = createOmniProvider({ apiKey: "test", fetch: async () => { calls++; return json({ state: "PROCESSING" }); } });
  assert.equal(await video.download("files/video-id"), null); assert.equal(calls, 1);
});

test("signed Google storage redirects never receive the API credential", async () => {
  let calls = 0;
  const video = createOmniProvider({ apiKey: "secret", fetch: async (url, init) => {
    calls++;
    if (String(url).endsWith("files/video-id")) return json({ state: "ACTIVE" });
    if (String(url).includes(":download")) return new Response(null, { status: 302, headers: { location: "https://storage.googleapis.com/generated/movie.mp4?signature=signed" } });
    assert.equal(String(url), "https://storage.googleapis.com/generated/movie.mp4?signature=signed");
    assert.equal(new Headers(init?.headers).has("x-goog-api-key"), false);
    return new Response("movie");
  } });
  assert.equal((await video.download("files/video-id"))?.toString(), "movie"); assert.equal(calls, 3);
});

test("Google file redirects to arbitrary destinations are never followed", async () => {
  let calls = 0;
  const video = createOmniProvider({ apiKey: "secret", fetch: async url => {
    calls++;
    if (String(url).endsWith("files/video-id")) return json({ state: "ACTIVE" });
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secrets" } });
  } });
  await assert.rejects(video.download("files/video-id"), StudioProviderError); assert.equal(calls, 2);
});

test("media URI validation prevents SSRF and credential forwarding", () => {
  for (const uri of ["http://127.0.0.1/private", "https://evil.com/v1beta/files/id", "https://user:pass@generativelanguage.googleapis.com/v1beta/files/id", "https://generativelanguage.googleapis.com:444/v1beta/files/id", "https://generativelanguage.googleapis.com/v1beta/files/id/../../secret"]) assert.throws(() => googleVideoDownloadUrl(uri), StudioProviderError);
  assert.equal(googleVideoDownloadUrl("https://generativelanguage.googleapis.com/v1beta/files/id?key=old-secret&untrusted=x").toString(), "https://generativelanguage.googleapis.com/v1beta/files/id:download?alt=media");
});
