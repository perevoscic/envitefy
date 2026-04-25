import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildRunAssetUrl, readMarketingRunDetail, resolveRunAssetPath } from "./marketing-campaigns.ts";

test("buildRunAssetUrl encodes nested run asset paths", () => {
  const url = buildRunAssetUrl("20260422-140000-test-run", "images/frame-01.png");
  assert.equal(
    url,
    "/api/admin/marketing-campaigns/20260422-140000-test-run/asset?file=images%2Fframe-01.png",
  );
});

test("resolveRunAssetPath blocks traversal outside the run dir", () => {
  const projectRoot = path.resolve("/tmp/envitefy");
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

test("readMarketingRunDetail only exposes frame asset urls for files that exist", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-marketing-"));
  const runId = "20260422-140000-test-run";
  const runDir = path.join(projectRoot, "qa-artifacts", "storyboard-runs", runId);
  await fs.mkdir(path.join(runDir, "images"), { recursive: true });
  await fs.writeFile(path.join(runDir, "images", "frame-01.png"), Buffer.from("png"));
  await fs.writeFile(
    path.join(runDir, "frames.json"),
    JSON.stringify({
      frames: [
        { frameNumber: 1, imageFile: "images/frame-01.png" },
        { frameNumber: 2, imageFile: "images\\frame-02.png" },
      ],
    }),
  );

  const detail = await readMarketingRunDetail(runId, projectRoot);
  const normalizedFrames = detail.frames?.frames || [];

  assert.match(normalizedFrames[0].imageUrl, /frame-01\.png/);
  assert.equal(normalizedFrames[1].imageUrl, null);
});
