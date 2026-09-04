import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildRunAssetUrl,
  getMarketingRunsRoot,
  readMarketingRunDetail,
  resolveMarketingCampaignProjectRoot,
  resolveRunAssetPath,
  resolveRunThumbnailUrl,
  syncMarketingCopyDeskForRun,
} from "./marketing-campaigns.ts";

test("serverless marketing runs use the writable temporary filesystem", () => {
  const previousVercel = process.env.VERCEL;
  process.env.VERCEL = "1";
  try {
    const projectRoot = resolveMarketingCampaignProjectRoot("/var/task");
    assert.equal(projectRoot, path.join(os.tmpdir(), "envitefy-marketing"));
    assert.equal(
      getMarketingRunsRoot(projectRoot),
      path.join(os.tmpdir(), "envitefy-marketing", "qa-artifacts", "storyboard-runs"),
    );
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});

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

  const thumbnailUrl = await resolveRunThumbnailUrl(runId, runDir);
  assert.match(thumbnailUrl || "", /frame-01\.png/);
});

test("readMarketingRunDetail attaches an adapted copy desk from shared social copy", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-marketing-copy-"));
  const runId = "20260422-140000-copy-desk";
  const runDir = path.join(projectRoot, "qa-artifacts", "storyboard-runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(
    path.join(runDir, "request.json"),
    JSON.stringify({
      input: {
        campaignName: "Fridge Invite",
        channels: ["instagram", "facebook", "tiktok", "youtube"],
        targetVertical: "Birthday",
        callToAction: "Create the birthday page",
      },
    }),
  );
  await fs.writeFile(
    path.join(runDir, "social-copy.json"),
    JSON.stringify({
      hook: "the invite is still on the fridge",
      endCard: "start your event page",
      frames: [{ frameNumber: 1, text: "still texting details", voiceover: "One link replaces the texts." }],
    }),
  );

  const detail = await readMarketingRunDetail(runId, projectRoot);
  assert.equal(detail.copyDesk.available, true);
  assert.equal(detail.copyDesk.source, "adapted");
  assert.deepEqual(
    detail.copyDesk.packs.map((pack) => pack.channel),
    ["instagram", "facebook", "tiktok", "youtube"],
  );
  const instagram = detail.copyDesk.packs.find((pack) => pack.channel === "instagram");
  const facebook = detail.copyDesk.packs.find((pack) => pack.channel === "facebook");
  assert.ok(instagram?.fields.some((field) => field.key === "caption"));
  assert.ok(instagram?.fields.some((field) => field.key === "hashtags"));
  assert.ok(facebook?.fields.some((field) => field.key === "postBody"));
  assert.notEqual(
    instagram?.fields.find((field) => field.key === "caption")?.value,
    facebook?.fields.find((field) => field.key === "postBody")?.value,
  );

  const synced = await syncMarketingCopyDeskForRun(runDir);
  const persisted = JSON.parse(await fs.readFile(path.join(runDir, "social-copy.json"), "utf8"));
  assert.equal(synced.available, true);
  assert.ok(persisted.platformPacks.instagram.caption);
  assert.ok(persisted.platformPacks.youtube.title);
  assert.equal(persisted.hook, "the invite is still on the fridge");
});
