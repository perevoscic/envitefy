import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("registry URL normalizer keeps only direct links and drops Amazon roots", () => {
  const source = readFileSync(new URL("./registry-url.ts", import.meta.url), "utf8");
  assert.match(source, /isAmazonRootUrl/);
  assert.match(source, /return null/);
  assert.doesNotMatch(source, /baby-reg\/homepage/);
  assert.doesNotMatch(source, /registries\/birthday/);
  assert.doesNotMatch(source, /chooseAmazonRegistryUrlFromEventType/);
  assert.doesNotMatch(source, /registered\\s\+at\\s\+amazon/);
});
