import assert from "node:assert/strict";
import test from "node:test";
import { createGenerationTracker, readGenerationStream } from "./generation-progress.ts";
import { streamOpenAiImage } from "./openai-image-stream.ts";
import OpenAI, { toFile } from "openai";

const preview = { type: "preview", imageDataUrl: "data:image/png;base64,cHJldmlldw==", partial: true };
function fragmentedStream(value) {
  const bytes = new TextEncoder().encode(value);
  return new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
    controller.close();
  } });
}
test("NDJSON tolerates fragmented UTF-8, emits previews, and waits for completion", async () => {
  const events = [];
  const result = { ok: true, title: "Livia’s fête" };
  assert.deepEqual(await readGenerationStream(fragmentedStream([
    { type: "stage", stage: "generating" }, preview, { type: "complete", result },
  ].map(JSON.stringify).join("\n")), (event) => events.push(event)), result);
  assert.deepEqual(events, [{ type: "stage", stage: "generating" }, preview]);
});
test("a partial image never turns a truncated or failed stream into success", async () => {
  await assert.rejects(readGenerationStream(fragmentedStream(JSON.stringify(preview))), /before the final result/);
  await assert.rejects(readGenerationStream(fragmentedStream(`${JSON.stringify(preview)}\n${JSON.stringify({ type: "error", message: "Review failed" })}\n`)), /Review failed/);
  for (const invalid of [{ type: "stage", stage: "made_up" }, { ...preview, imageDataUrl: "javascript:alert(1)" }]) {
    await assert.rejects(readGenerationStream(fragmentedStream(JSON.stringify(invalid))), /Invalid generation update/);
  }
  await assert.rejects(readGenerationStream(fragmentedStream(`${JSON.stringify({ type: "complete", result: {} })}\n${JSON.stringify(preview)}`)), /after generation completed/);
});
test("tracker records real stages, preview time, and repair attempts", async () => {
  const events = [];
  const tracker = createGenerationTracker({ onProgress: (event) => events.push(event) });
  await tracker.measure("generating", async () => tracker.preview(preview.imageDataUrl, true));
  await tracker.measure("checking", async () => {});
  await tracker.measure("repairing", async () => {});
  const timings = tracker.finish();
  assert.equal(timings.imageAttempts, 2);
  assert.ok(timings.firstPreviewMs >= 0 && timings.firstPreviewMs <= timings.totalMs);
  assert.deepEqual(Object.keys(timings.stagesMs), ["generating", "checking", "repairing"]);
  assert.equal(events[1].type, "preview");
});

const body = { model: "gpt-image-2", prompt: "Test", size: "1024x1536", quality: "high", background: "opaque", n: 1 };
function providerClient(events, inspect = () => {}) {
  return new OpenAI({ apiKey: "test-key", fetch: async (url, init) => {
    await inspect(url, init);
    return new Response(fragmentedStream(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("") + "data: [DONE]\n\n"), { headers: { "Content-Type": "text/event-stream" } });
  } });
}
test("generation streams partials using the installed SDK transport and returns only completed art", async () => {
  const seen = [];
  const client = providerClient([
    { type: "image_generation.partial_image", b64_json: "cGFydGlhbA==" },
    { type: "image_generation.completed", b64_json: "ZmluYWw=" },
  ], (url, init) => {
    assert.match(String(url), /\/images\/generations$/);
    assert.deepEqual(JSON.parse(init.body), { ...body, stream: true, partial_images: 2, output_format: "png" });
  });
  assert.equal(await streamOpenAiImage(client, body, { onPartialImage: (url) => seen.push(url) }), "data:image/png;base64,ZmluYWw=");
  assert.deepEqual(seen, ["data:image/png;base64,cGFydGlhbA=="]);
});
test("image edits send multipart references and accept edit streaming events", async () => {
  const image = await toFile(Buffer.from("reference"), "reference.png", { type: "image/png" });
  const seen = [];
  const client = providerClient([
    { type: "image_edit.partial_image", b64_json: "cGFydGlhbA==" },
    { type: "image_edit.completed", b64_json: "ZmluYWw=" },
  ], async (url, init) => {
    assert.match(String(url), /\/images\/edits$/);
    assert.match(new Headers(init.headers).get("content-type"), /multipart\/form-data/);
    const chunks = [];
    for await (const chunk of init.body) chunks.push(Buffer.from(chunk));
    const multipart = Buffer.concat(chunks).toString();
    assert.match(multipart, /name="stream"\r\n\r\ntrue/);
    assert.match(multipart, /name="partial_images"\r\n\r\n2/);
    assert.match(multipart, /name="image\[\]"; filename="reference.png"/);
  });
  assert.equal(await streamOpenAiImage(client, { ...body, image: [image] }, { onPartialImage: (url) => seen.push(url) }), "data:image/png;base64,ZmluYWw=");
  assert.equal(seen.length, 1);
});
test("image streaming fails on missing final frames and does not silently retry provider failures", async () => {
  await assert.rejects(streamOpenAiImage(providerClient([{ type: "image_generation.partial_image", b64_json: "cGFydGlhbA==" }]), body, {}), /without a completed image/);
  let requests = 0;
  const client = new OpenAI({ apiKey: "test-key", fetch: async () => {
    requests++;
    return new Response(JSON.stringify({ error: { message: "Unavailable" } }), { status: 503, headers: { "Content-Type": "application/json" } });
  } });
  await assert.rejects(streamOpenAiImage(client, body, {}), /503/);
  assert.equal(requests, 1);
});
