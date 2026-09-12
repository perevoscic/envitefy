import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football discovery keeps access-control normalization stable", () => {
  const source = readSource("src/lib/football-discovery.ts");

  assert.ok(
    /baseData\?\.accessControl\s*\? await normalizeAccessControlPayload\(\s*baseData.accessControl,\s*baseData.accessControl,?\s*\)/.test(source),
    "football discovery should preserve existing access control through the normalizer"
  );
  assert.ok(
    /mode: "public",\s*requirePasscode: false/.test(source),
    "football discovery should emit a stable public access-control payload when no passcode exists"
  );
  assert.ok(
    source.includes("accessControl: nextAccessControl"),
    "football discovery should assign the normalized access control directly"
  );
});
