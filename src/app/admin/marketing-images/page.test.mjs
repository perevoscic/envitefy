import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const socialRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/[runId]/social-images/route.ts", import.meta.url),
  "utf8",
);

test("marketing creative studio separates social images from short-form video", () => {
  assert.match(source, /type AssetType = "social-image" \| "short-video"/);
  assert.match(source, /What are you creating\?/);
  assert.match(source, /Finished, downloadable posts/);
  assert.match(source, /Storyboard, captions, MP4/);
  assert.match(source, /aria-pressed=\{selected\}/);
  assert.match(source, /detailAssetType === "social-image"/);
});

test("social image workflow exposes placements, prepared PNGs, and download actions", () => {
  assert.match(source, /Instagram \+ Facebook/);
  assert.match(source, /LinkedIn \+ X/);
  assert.match(source, /Prepare Social Posts/);
  assert.match(source, /Download finished post/);
  assert.match(socialRoute, /layout: "social-post"/);
  assert.match(socialRoute, /composeCaptionedFramesForRun/);
  assert.match(socialRoute, /Social posts ready/);
});
