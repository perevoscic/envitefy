import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const socialRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/[runId]/social-images/route.ts", import.meta.url),
  "utf8",
);
const campaignRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/route.ts", import.meta.url),
  "utf8",
);
const promptRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/prompt-ideas/route.ts", import.meta.url),
  "utf8",
);
const promptAgent = await readFile(
  new URL("../../../lib/admin/marketing-prompt-agent.ts", import.meta.url),
  "utf8",
);
const campaignRun = await readFile(
  new URL("../../../../scripts/lib/campaign-run.mjs", import.meta.url),
  "utf8",
);
const storyboardGenerator = await readFile(
  new URL("../../../../scripts/lib/storyboard-generator.mjs", import.meta.url),
  "utf8",
);

test("marketing creative studio separates social images from short-form video", () => {
  assert.match(source, /type AssetType = "social-image" \| "short-video"/);
  assert.match(source, /What should the prompt create\?/);
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

test("marketing hub creates an expert prompt before creative production", () => {
  assert.match(source, /Envitefy Marketing Agent/);
  assert.match(
    source,
    /Growth marketer, visual creator, flyer designer, and influencer strategist/,
  );
  assert.match(source, /Generate prompt idea/);
  assert.match(source, /Production Prompt/);
  assert.match(source, /Generate or write a production prompt to unlock creative production/);
  assert.match(source, /\/api\/admin\/marketing-campaigns\/prompt-ideas/);
  assert.match(promptRoute, /requireAdminSession/);
  assert.match(promptAgent, /senior AI Marketing Director/);
  assert.match(promptAgent, /buildEnvitefyMarketingCatalogPrompt/);
});

test("campaign library records channel and strategy context", () => {
  assert.match(source, /Campaign Library/);
  assert.match(source, /facebook/);
  assert.match(source, /instagram/);
  assert.match(source, /youtube/);
  assert.match(source, /tiktok/);
  assert.match(source, /campaignName: form\.campaignName/);
  assert.match(source, /channels: form\.channels/);
  assert.match(campaignRun, /campaignName/);
  assert.match(campaignRun, /channels/);
  assert.match(campaignRun, /audience/);
  assert.match(campaignRun, /objective/);
});

test("creative production includes selectable official Envitefy brand references", () => {
  assert.match(source, /Official Envitefy brand assets/);
  assert.match(source, /\/brand\/envitefy-wordmark\.png/);
  assert.match(source, /\/icons\/apple-touch-icon-120\.png/);
  assert.match(source, /brandAssets: form\.brandAssets/);
  assert.match(campaignRoute, /BUILT_IN_BRAND_ASSETS/);
  assert.match(campaignRoute, /fs\.copyFile/);
  assert.match(campaignRoute, /brand-wordmark/);
  assert.match(campaignRoute, /brand-app-icon/);
  assert.match(campaignRun, /When brandingPresence is none, keep the wordmark and app icon out/);
  assert.match(storyboardGenerator, /public\/brand\/envitefy-wordmark\.png/);
  assert.match(storyboardGenerator, /public\/icons\/apple-touch-icon-120\.png/);
});

test("production campaign runs use writable durable serverless storage", () => {
  assert.match(campaignRoute, /resolveMarketingCampaignProjectRoot/);
  assert.match(campaignRoute, /getMarketingRunsRoot\(workingProjectRoot\)/);
  assert.match(campaignRoute, /persistMarketingRun\(runPaths\.runDir\)/);
  assert.match(campaignRoute, /after\(async \(\) =>/);
  assert.match(campaignRoute, /campaignRun\.runCampaign/);
});
