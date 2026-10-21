import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./email-template.ts", import.meta.url), "utf8");

test("shared email template uses the public email wordmark", () => {
  assert.match(source, /EMAIL_WHITE_ASSETS\.wordmark/);
  assert.doesNotMatch(source, /Logo_stacked\.png/i);
  assert.doesNotMatch(source, />nvitefy<\/span>/i);
});

test("shared email template separates stable dark branding from the adaptive inbox body", () => {
  assert.match(source, /class="email-shell"/);
  assert.match(source, /emailDesignVersion === "legacy"/);
  assert.match(source, /class="email-brand email-brand-band"[^>]*background-color:#251F2D/);
  assert.match(source, /class="email-content email-surface"[^>]*background-color:#FFFFFF/);
  assert.match(source, /class="email-footer email-footer-band"[^>]*background-color:#251F2D/);
  assert.match(source, /\.email-page-cell\{padding:0!important;\}/);
  assert.doesNotMatch(source, /body, table, td, a \{ background-color:/);
  assert.doesNotMatch(source, /<!-- Main Card -->/);
});
