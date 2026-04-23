import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildRunAssetUrl, resolveRunAssetPath } from "./marketing-campaigns.ts";

test("buildRunAssetUrl encodes nested run asset paths", () => {
  const url = buildRunAssetUrl("20260422-140000-test-run", "images/frame-01.png");
  assert.equal(
    url,
    "/api/admin/marketing-campaigns/20260422-140000-test-run/asset?file=images%2Fframe-01.png",
  );
});

test("resolveRunAssetPath blocks traversal outside the run dir", () => {
  const projectRoot = "/tmp/envitefy";
  const safe = resolveRunAssetPath("20260422-140000-test-run", "images/frame-01.png", projectRoot);
  assert.equal(
    safe,
    path.join(
      projectRoot,
      "qa-artifacts",
      "storyboard-runs",
      "20260422-140000-test-run",
      "images",
      "frame-01.png",
    ),
  );

  assert.throws(
    () => resolveRunAssetPath("20260422-140000-test-run", "../secrets.txt", projectRoot),
    /Invalid file path/,
  );
});
