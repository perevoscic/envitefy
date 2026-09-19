import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import { EventEmitter } from "node:events";
import { chromium } from "playwright";
import { createCampaignResponseCapture } from "./create-campaign-network.mjs";

async function captureFixture(options = {}) {
  const session = new EventEmitter();
  const page = new EventEmitter();
  session.send = async () => ({});
  session.detach = async () => session.emit("close");
  const capture = await createCampaignResponseCapture({ newCDPSession: async () => session }, page, { timeoutMs: 30, ...options });
  const response = { url: () => "http://127.0.0.1/api/studio/generate", request: () => ({ method: () => "POST" }) };
  const start = () => session.emit("Network.requestWillBeSent", { requestId: "fixture", request: { url: response.url(), method: "POST" } });
  return { session, page, capture, response, start };
}

test("captured body times out if loadingFinished never arrives or CDP body retrieval hangs", async () => {
  for (const loadingFinished of [false, true]) {
    const f = await captureFixture();
    f.session.send = () => new Promise(() => {});
    f.start();
    if (loadingFinished) f.session.emit("Network.loadingFinished", { requestId: "fixture" });
    await assert.rejects(f.capture.text(f.response), error => error.code === "harness_interaction" && /Response body.*timed out/.test(error.message));
    await f.capture.close();
  }
});

test("capture close and spontaneous CDP/page close reject pending bodies promptly", async () => {
  for (const closeWith of ["capture", "session", "page"]) {
    const f = await captureFixture({ timeoutMs: 10_000 });
    f.start();
    const pending = f.capture.text(f.response);
    if (closeWith === "capture") await f.capture.close();
    else f[closeWith].emit("close");
    await assert.rejects(pending, error => error.code === "harness_interaction" && /cancelled.*capture closed/.test(error.message));
    await f.capture.close();
    assert.equal(f.page.listenerCount("close"), 0);
  }
});

test("detach rejection does not strand body consumers and repeated close is stable", async () => {
  const f = await captureFixture({ timeoutMs: 10_000 });
  f.session.detach = async () => { throw new Error("CDP detach failed"); };
  f.start();
  const pending = f.capture.text(f.response);
  const closing = f.capture.close();
  assert.equal(f.capture.close(), closing);
  await assert.rejects(closing, /CDP detach failed/);
  await assert.rejects(pending, /harness_interaction:.*cancelled/);
});

test("fallback response text also has a bounded wait", async () => {
  const f = await captureFixture();
  f.response.text = () => new Promise(() => {});
  await assert.rejects(f.capture.text(f.response), /harness_interaction: Fallback response body.*timed out/);
  await f.capture.close();
});

test("dedicated Chromium capture retains large streamed generation bodies and serial replies", async () => {
  const payload = `${JSON.stringify({ type: "preview", imageDataUrl: `data:image/png;base64,${"A".repeat(12 * 1024 * 1024)}` })}\n${JSON.stringify({ type: "complete", result: { ok: true, imageUrl: "fixture.webp" } })}\n`;
  const server = http.createServer((req, res) => {
    if (req.method === "POST") {
      res.writeHead(200, { "content-type": "application/x-ndjson" });
      for (let offset = 0; offset < payload.length; offset += 64 * 1024) res.write(payload.slice(offset, offset + 64 * 1024));
      res.end();
    } else { res.writeHead(200, { "content-type": "text/html" }); res.end("<!doctype html><p>Capture fixture</p>"); }
  });
  let browser, capture;
  try {
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    capture = await createCampaignResponseCapture(context, page);
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    for (let index = 0; index < 2; index++) {
      const [response] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith("/api/studio/generate")),
        page.evaluate(() => fetch("/api/studio/generate", { method: "POST", body: "{}" }).then(response => response.text().then(text => text.length))),
      ]);
      assert.equal(await capture.text(response), payload);
    }
  } finally {
    await capture?.close();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
