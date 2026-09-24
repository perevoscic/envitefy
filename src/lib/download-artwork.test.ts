import assert from "node:assert/strict";
import test from "node:test";
import { downloadArtwork } from "./download-artwork.ts";

test("Download keeps accepted JPEG bytes without recompressing and uses the real media extension", async (t) => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const events: string[] = [];
  const anchor = { href: "", download: "", style: { display: "" }, click() { events.push("click"); }, remove() { events.push("remove"); } };
  t.mock.method(globalThis, "fetch", async (url) => { assert.equal(url, "/accepted.jpg"); return new Response(bytes, { headers: { "Content-Type": "image/jpeg" } }); });
  t.mock.method(URL, "createObjectURL", (blob) => { assert.equal(blob.size, 4); return "blob:accepted"; });
  const beforeDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const beforeWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => anchor, body: { appendChild() { events.push("append"); } } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout() {} } });
  t.after(() => { if (beforeDocument) Object.defineProperty(globalThis, "document", beforeDocument); else Reflect.deleteProperty(globalThis, "document"); if (beforeWindow) Object.defineProperty(globalThis, "window", beforeWindow); else Reflect.deleteProperty(globalThis, "window"); });
  await downloadArtwork("/accepted.jpg", "September 23 workshop");
  assert.equal(anchor.download, "September-23-workshop.jpg");
  assert.equal(anchor.href, "blob:accepted");
  assert.deepEqual(events, ["append", "click", "remove"]);
});

test("Download does not claim success for an API error or HTML response", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("not an image", { headers: { "Content-Type": "text/html" } }));
  await assert.rejects(downloadArtwork("/accepted.webp", "Workshop"), /supported image/);
  await assert.rejects(downloadArtwork("javascript:alert(1)", "Workshop"), /not available/);
});
