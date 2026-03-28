import assert from "node:assert/strict";
import test from "node:test";

import { buildMediaResponse } from "./media-response.ts";

test("buildMediaResponse redirects remote urls", () => {
  const response = buildMediaResponse("https://blob.example.com/display.webp");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://blob.example.com/display.webp");
});

test("buildMediaResponse returns inline image bytes for data urls", async () => {
  const response = buildMediaResponse("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sYdLfQAAAAASUVORK5CYII=");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length > 0);
});

test("buildMediaResponse rejects non-image inline payloads", () => {
  const response = buildMediaResponse("data:application/pdf;base64,Zm9v");
  assert.equal(response.status, 400);
});
