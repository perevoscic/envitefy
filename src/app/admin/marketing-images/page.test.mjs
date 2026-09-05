import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { choosePreviewVersion } from "./studio-state.ts";

const source = await readFile(new URL("./legacy/page.tsx", import.meta.url), "utf8");
const studio = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const studioUi = await readFile(new URL("./studio-components.tsx", import.meta.url), "utf8");
const composer = await readFile(new URL("./studio-composer.tsx", import.meta.url), "utf8");
const library = await readFile(new URL("./studio-library.tsx", import.meta.url), "utf8");
const studioState = await readFile(new URL("./use-content-studio.ts", import.meta.url), "utf8");

test("content studio starts with one composer and keeps production diagnostics out of the main page", () => {
  assert.match(studio, /Content Studio/);
  assert.match(studio, /Creative conversation/);
  assert.match(studio, /<StudioComposer/);
  assert.match(composer, /Content output/);
  assert.match(composer, /Social platform/);
  assert.doesNotMatch(studio, /Campaign Workspace|Stage JSON|Creative QA|Post Concepts/);
  assert.match(library, /Earlier campaigns/);
  assert.match(library, /legacy\?run=/);
  assert.match(studioUi, /Dialog\.Title/);
});

test("studio resumes only an explicitly selected conversation and saves exact edited prompts", () => {
  assert.match(studioState, /searchParams\.set\("conversation", id\)/);
  assert.doesNotMatch(studioState, /setConversation\(conversations\[0\]/);
  assert.match(studioUi, /Save prompt/);
  assert.match(studioUi, /promptOverride: prompt/);
  assert.match(studioState, /clientRequestId: pendingRequest\.current\.id/);
});

test("mobile creation switches between conversation and preview with a route back to the composer", () => {
  assert.match(studio, /aria-label="Creation view"/);
  assert.match(studio, /aria-pressed=\{mobileView === panel\}/);
  assert.match(studio, /id="studio-conversation-panel"/);
  assert.match(studio, /id="studio-preview-panel"/);
  assert.match(studio, /onClick=\{focusConversation\}/);
  assert.match(studio, /requestAnimationFrame\(\(\) => composer\.current\?\.focus\(\)\)/);
  assert.match(studio, /What would you like to create\?/);
  assert.doesNotMatch(studio, /max-h-\[320px\]|making today/);
});

function version(id, output, status, assetId) {
  return {
    id,
    output,
    status,
    result: { prompt: "saved prompt", ...(assetId ? { assetId } : {}) },
  };
}

test("a pending or failed media result keeps the previous usable preview", () => {
  const ready = version("one", "image", "ready", "asset-one");
  const pending = version("two", "video", "running");
  const failed = version("three", "image", "failed");
  assert.equal(choosePreviewVersion([ready, pending], pending), ready);
  assert.equal(choosePreviewVersion([ready, failed], failed), ready);
  assert.equal(choosePreviewVersion([pending], pending), null);
});

test("selected earlier results remain selected and prompt-only results need no asset", () => {
  const old = version("one", "image", "ready", "asset-one");
  const recent = version("two", "image", "ready", "asset-two");
  const prompt = version("three", "prompt", "ready");
  assert.equal(choosePreviewVersion([old, recent], old), old);
  assert.equal(choosePreviewVersion([old, recent, prompt], prompt), prompt);
  assert.equal(choosePreviewVersion([version("bad", "image", "ready")], null), null);
});
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
