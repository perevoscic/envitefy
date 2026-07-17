import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("scanned invite skin uses full-width prose Good to Know tiles", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/components/ScannedInviteSkin.tsx"), "utf8");

  assert.match(source, /label="Good to Know"/);
  assert.match(source, /fullWidth/);
  assert.match(source, /tone="prose"/);
  assert.match(source, /md:col-span-2/);
  assert.match(source, /text-base font-semibold leading-relaxed md:text-lg/);
  assert.match(source, /tone="compact"/);
});
