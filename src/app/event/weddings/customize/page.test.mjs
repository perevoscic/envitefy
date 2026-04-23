import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("wedding customize preview opts into the scanned invite preview renderer", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");
  const rendererSource = readSource("src/components/weddings/WeddingRenderer.tsx");

  assert.match(customizeSource, /renderMode="scanned-invite-preview"/);
  assert.match(rendererSource, /renderMode\?: "default" \| "scanned-invite-preview"/);
  assert.match(rendererSource, /if \(renderMode === "scanned-invite-preview"\) \{/);
  assert.match(rendererSource, /<ScannedWeddingInviteView/);
  assert.match(rendererSource, /scheduleRows=\{previewScheduleRows\}/);
  assert.match(rendererSource, /previewMode/);
  assert.match(rendererSource, /showRsvpPreview=\{Boolean\(\(event as any\)\.rsvpEnabled\)\}/);
});
