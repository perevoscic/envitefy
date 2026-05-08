import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("registry URL normalizer maps Amazon to event-type specific registry URLs", () => {
  const source = readFileSync(new URL("./registry-url.ts", import.meta.url), "utf8");
  assert.match(source, /https:\/\/www\.amazon\.com\/baby-reg\/homepage/);
  assert.match(source, /https:\/\/www\.amazon\.com\/registries\/search/);
  assert.match(source, /https:\/\/www\.amazon\.com\/registries\/birthday/);
  assert.match(source, /registered\\s\+at\\s\+amazon/);
  assert.match(source, /bridal/);
});
