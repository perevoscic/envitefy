import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("every legacy signup design has a verified new WebP and a matching manifest reference", () => {
  const plan = JSON.parse(readFileSync("docs/signup-artwork-catalog.json", "utf8"));
  const manifest = JSON.parse(readFileSync("public/templates/signup/manifest.json", "utf8"));
  const entries = Object.values(manifest).flat();
  const paths = new Set(entries.map((entry) => entry.path));
  assert.equal(plan.assets.length, paths.size);
  assert.equal(new Set(plan.assets.map((asset) => asset.output)).size, paths.size);
  for (const asset of plan.assets) {
    assert.equal(asset.status, "generated", asset.id);
    assert.equal(asset.visuallyReviewed, true, asset.id);
    assert.equal(asset.verifiedDecode, true, asset.id);
    assert.equal(asset.originalDeleted, true, asset.id);
    assert.equal(existsSync(asset.source), false, asset.id);
    const bytes = readFileSync(asset.output);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", asset.id);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", asset.id);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.id);
    assert.deepEqual(asset.verifiedDimensions, [1536, 1024], asset.id);
    const matching = entries.filter((entry) => entry.path === asset.legacyPath);
    assert.ok(matching.length, asset.id);
    for (const entry of matching) {
      assert.equal(entry.artworkPath, `/${asset.output.replace(/^public\//, "")}`);
      assert.ok(existsSync(path.join("public", entry.artworkPath)), asset.id);
      assert.ok(
        existsSync(path.join("public", entry.path)),
        "Previously saved artwork remains available",
      );
    }
  }
});
