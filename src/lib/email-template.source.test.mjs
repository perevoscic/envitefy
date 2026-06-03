import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./email-template.ts", import.meta.url), "utf8");

test("shared email template uses the public email wordmark", () => {
  assert.match(source, /\/email\/envitefy-wordmark-email\.png/i);
  assert.doesNotMatch(source, /Logo_stacked\.png/i);
  assert.doesNotMatch(source, />nvitefy<\/span>/i);
});
