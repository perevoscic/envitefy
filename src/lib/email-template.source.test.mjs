import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./email-template.ts", import.meta.url), "utf8");

test("shared email template uses the public email wordmark", () => {
  assert.match(source, /\/email\/envitefy-wordmark-email\.png/i);
  assert.doesNotMatch(source, /Logo_stacked\.png/i);
  assert.doesNotMatch(source, />nvitefy<\/span>/i);
});

test("shared email template uses one responsive content surface", () => {
  assert.match(source, /class="email-shell"/);
  assert.match(source, /class="email-brand"[^>]*background-color:#FFFFFF/);
  assert.match(source, /class="email-content"[^>]*background-color:#FFFFFF/);
  assert.match(source, /class="email-footer"[^>]*background-color:#FFFFFF/);
  assert.match(source, /\.email-page-cell \{ padding: 0 !important; \}/);
  assert.doesNotMatch(source, /body, table, td, a \{ background-color:/);
  assert.doesNotMatch(source, /<!-- Main Card -->/);
});
