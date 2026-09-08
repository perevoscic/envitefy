import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { prepareCardEditPreviewImage, streamCardEditPreview } from "./card-edit-preview.ts";

test("large generated PNGs fit in both preview responses and save requests", async () => {
  const png = await sharp(randomBytes(1536 * 2048 * 3), {
    raw: { width: 1536, height: 2048, channels: 3 },
  }).png().toBuffer();
  const original = `data:image/png;base64,${png.toString("base64")}`;
  assert.ok(original.length > 4.5 * 1024 * 1024, "reproduce an oversized generated image");
  const imageDataUrl = await prepareCardEditPreviewImage(original);
  const bytes = Buffer.from(imageDataUrl.split(",")[1], "base64");
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1536);
  assert.equal(metadata.height, 2048);
  assert.ok(bytes.length <= 2 * 1024 * 1024);
  const fields = { title: "Livia is turning 10", theme: "Add forgotten island movie theme to it" };
  for (const action of ["preview", "save"]) {
    assert.ok(Buffer.byteLength(JSON.stringify({ action, fields, imageDataUrl })) < 3 * 1024 * 1024);
  }
});

test("invalid image data is rejected before it becomes a preview", async () => {
  await assert.rejects(prepareCardEditPreviewImage("data:text/plain;base64,aGVsbG8="), /valid image/);
});

test("preview sends immediate and periodic keep-alives then valid JSON", async () => {
  let complete;
  const result = new Promise((resolve) => { complete = resolve; });
  const response = streamCardEditPreview(() => result, { heartbeatMs: 5 });
  assert.match(response.headers.get("cache-control"), /no-store, no-transform/);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const first = await reader.read();
  const second = await reader.read();
  assert.equal(decoder.decode(first.value), "\n");
  assert.equal(decoder.decode(second.value), "\n");
  complete(Response.json({ ok: true, imageDataUrl: "data:image/webp;base64,test" }));
  let body = "\n\n";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    body += decoder.decode(chunk.value);
  }
  assert.equal(JSON.parse(body).ok, true);
});

test("provider failures remain readable in a response whose headers are already sent", async () => {
  const response = streamCardEditPreview(async () => Response.json({ error: "Image service busy" }, { status: 503 }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { error: "Image service busy" });
});

test("hung generation ends with an actionable timeout before the runtime deadline", async () => {
  const response = streamCardEditPreview(() => new Promise(() => {}), { timeoutMs: 10, heartbeatMs: 2 });
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.match(payload.error, /took too long.*try Preview again/);
});

test("a disconnected preview does not write into a closed stream when generation finishes", async () => {
  let complete;
  const result = new Promise((resolve) => { complete = resolve; });
  const response = streamCardEditPreview(() => result, { heartbeatMs: 2, timeoutMs: 10 });
  const reader = response.body.getReader();
  await reader.read();
  await reader.cancel();
  complete(Response.json({ ok: true }));
  await new Promise((resolve) => setTimeout(resolve, 15));
});
