import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const hubPage = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubPage.tsx", import.meta.url),
  "utf8",
);
const library = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubLibrary.tsx", import.meta.url),
  "utf8",
);
const newCampaign = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubNewCampaign.tsx", import.meta.url),
  "utf8",
);
const workspace = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubWorkspace.tsx", import.meta.url),
  "utf8",
);
const creatives = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubCreatives.tsx", import.meta.url),
  "utf8",
);
const edit = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubEdit.tsx", import.meta.url),
  "utf8",
);
const production = await readFile(
  new URL("../../../components/admin/marketing-hub/MarketingHubProduction.tsx", import.meta.url),
  "utf8",
);
const copyDeskComponent = await readFile(
  new URL("../../../components/admin/MarketingCopyDesk.tsx", import.meta.url),
  "utf8",
);
const copyDeskLib = await readFile(
  new URL("../../../lib/admin/marketing-copy-desk.ts", import.meta.url),
  "utf8",
);
const socialRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/[runId]/social-images/route.ts", import.meta.url),
  "utf8",
);
const campaignRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/route.ts", import.meta.url),
  "utf8",
);
const middleware = await readFile(new URL("../../../middleware.ts", import.meta.url), "utf8");
const promptRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/prompt-ideas/route.ts", import.meta.url),
  "utf8",
);
const promptAgent = await readFile(
  new URL("../../../lib/admin/marketing-prompt-agent.ts", import.meta.url),
  "utf8",
);
const captionsRoute = await readFile(
  new URL("../../api/admin/marketing-campaigns/[runId]/captions/route.ts", import.meta.url),
  "utf8",
);
const captionsRegenerateRoute = await readFile(
  new URL(
    "../../api/admin/marketing-campaigns/[runId]/captions/regenerate/route.ts",
    import.meta.url,
  ),
  "utf8",
);
const campaignRun = await readFile(
  new URL("../../../../scripts/lib/campaign-run.mjs", import.meta.url),
  "utf8",
);
const marketingHubLib = await readFile(
  new URL("../../../lib/admin/marketing-hub.ts", import.meta.url),
  "utf8",
);
const storyboardGenerator = await readFile(
  new URL("../../../../scripts/lib/storyboard-generator.mjs", import.meta.url),
  "utf8",
);

test("marketing images page is a thin Marketing Hub entry", () => {
  assert.match(page, /export \{ MarketingHubPage as default \}/);
  assert.doesNotMatch(page, /Marketing Creative Studio/);
  assert.doesNotMatch(page, /1 · Create prompt/);
});

test("marketing hub default journey is Library, New campaign, then workspace", () => {
  assert.match(hubPage, /useState<MarketingHubView>\("library"\)/);
  assert.match(library, /Library/);
  assert.match(library, /New campaign/);
  assert.match(newCampaign, /New campaign/);
  assert.match(workspace, /Campaign workspace/);
  assert.match(workspace, /MarketingHubCreatives/);
  assert.match(workspace, /MarketingCopyDesk/);
  assert.match(workspace, /MarketingHubEdit/);
  assert.match(workspace, /MarketingHubProduction/);
});

test("new campaign is a short form with one Generate button", () => {
  assert.match(marketingHubLib, /export type AssetType = "social-image" \| "short-video"/);
  assert.match(newCampaign, /Finished, downloadable posts/);
  assert.match(newCampaign, /Storyboard, captions, MP4/);
  assert.match(newCampaign, /aria-pressed=\{selected\}/);
  assert.match(newCampaign, /\{submitting \? "Generating…" : "Generate"\}/);
  assert.match(newCampaign, /canGenerate/);
  assert.match(newCampaign, /form\.idea\.trim\(\) \|\| form\.criteria\.trim\(\)/);
  assert.doesNotMatch(newCampaign, /Generate or write a production prompt to unlock/);
  assert.doesNotMatch(newCampaign, /Envitefy Marketing Agent/);
});

test("prompt agent and production locks stay in collapsed Advanced", () => {
  assert.match(newCampaign, /aria-expanded=\{showAdvanced\}/);
  assert.match(newCampaign, /Advanced/);
  assert.match(newCampaign, /showAdvanced/);
  assert.match(newCampaign, /ADVANCED_FORM_FIELDS/);
  assert.match(marketingHubLib, /Character Lock/);
  assert.match(newCampaign, /Official Envitefy brand assets/);
  assert.match(newCampaign, /BRAND_ASSETS/);
  assert.match(marketingHubLib, /\/brand\/envitefy-wordmark\.png/);
  assert.match(marketingHubLib, /\/icons\/apple-touch-icon-120\.png/);
  assert.match(newCampaign, /Refine idea into a production prompt/);
  assert.match(hubPage, /\/api\/admin\/marketing-campaigns\/prompt-ideas/);
  assert.match(promptRoute, /requireAdminSession/);
  assert.match(promptAgent, /senior AI Marketing Director/);
  assert.match(promptAgent, /buildEnvitefyMarketingCatalogPrompt/);
});

test("generate uses the idea as criteria and still posts campaign payload", () => {
  assert.match(hubPage, /const criteria = form\.criteria\.trim\(\) \|\| form\.idea\.trim\(\);/);
  assert.match(hubPage, /campaignName: form\.campaignName/);
  assert.match(hubPage, /channels: form\.channels/);
  assert.match(hubPage, /brandAssets: form\.brandAssets/);
  assert.match(hubPage, /setHubView\("workspace"\)/);
  assert.match(campaignRun, /campaignName/);
  assert.match(campaignRun, /channels/);
  assert.match(campaignRun, /audience/);
  assert.match(campaignRun, /objective/);
  assert.match(campaignRun, /clean\(input\.idea\)/);
});

test("campaign library uses a thumbnail card grid", () => {
  assert.match(library, /grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4/);
  assert.match(library, /max-w-\[220px\]/);
  assert.match(library, /aspect-square/);
  assert.match(library, /line-clamp-2/);
  assert.match(library, /thumbnailUrl/);
  assert.match(library, /MARKETING_CHANNELS/);
  assert.match(library, /hubStatusLabel/);
  assert.match(library, /onOpenCampaign/);
  assert.doesNotMatch(library, /space-y-2/);
  assert.doesNotMatch(library, /ChannelChip/);
  assert.match(campaignRoute, /thumbnailUrl: entry\.thumbnailUrl \|\| null/);
  assert.match(campaignRoute, /requireAdminSession/);
});

test("workspace keeps creatives, copy desk, and secondary edit only", () => {
  assert.match(creatives, /Creatives/);
  assert.match(creatives, /Download PNG/);
  assert.match(creatives, /Open MP4/);
  assert.match(creatives, /Open SRT/);
  assert.match(creatives, /max-w-\[400px\]/);
  assert.match(creatives, /max-h-\[240px\]/);
  assert.match(creatives, /object-contain/);
  assert.match(creatives, /max-w-\[280px\]/);
  assert.match(creatives, /w-\[160px\]/);
  assert.doesNotMatch(creatives, /sm:grid-cols-2 xl:grid-cols-3/);
  assert.match(edit, />Edit</);
  assert.match(edit, /Regenerate copy/);
  assert.match(edit, /Save captions/);
  assert.match(production, /Production details/);
  assert.match(production, /Hidden from the default campaign journey/);
  assert.doesNotMatch(workspace, /Current Stage/);
  assert.doesNotMatch(workspace, /Social Post Review/);
  assert.doesNotMatch(workspace, /Stage JSON/);
});

test("social image workflow still prepares PNGs through the existing export API", () => {
  assert.match(marketingHubLib, /Instagram \+ Facebook/);
  assert.match(creatives, /Prepare PNG downloads/);
  assert.match(socialRoute, /layout: "social-post"/);
  assert.match(socialRoute, /composeCaptionedFramesForRun/);
  assert.match(socialRoute, /Social posts ready/);
});

test("creative production still ships official Envitefy brand references", () => {
  assert.match(newCampaign, /brandAssets/);
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

test("copy desk adapts shared captions into per-platform paste packs", () => {
  assert.match(workspace, /Copy desk/);
  assert.match(workspace, /MarketingCopyDesk/);
  assert.match(hubPage, /buildMarketingCopyDesk/);
  assert.match(hubPage, /preferStoredPacks: false/);
  assert.match(workspace, /Instagram, Facebook, TikTok, and YouTube/);
  assert.match(copyDeskComponent, /Copy all/);
  assert.match(copyDeskComponent, /Copy \$\{pack\.label\} \$\{field\.label\.toLowerCase\(\)\}/);
  assert.match(copyDeskLib, /instagram: \{ label: "Instagram"/);
  assert.match(copyDeskLib, /facebook: \{ label: "Facebook"/);
  assert.match(copyDeskLib, /tiktok: \{ label: "TikTok"/);
  assert.match(copyDeskLib, /youtube: \{ label: "YouTube"/);
  assert.match(copyDeskLib, /makePack\("instagram"/);
  assert.match(copyDeskLib, /key: "hashtags"/);
  assert.match(copyDeskLib, /key: "postBody"/);
  assert.match(copyDeskLib, /key: "title"/);
  assert.match(copyDeskLib, /key: "description"/);
  assert.match(copyDeskLib, /generatedAltText/);
  assert.match(captionsRoute, /requireAdminSession/);
  assert.match(captionsRoute, /syncMarketingCopyDeskForRun/);
  assert.match(captionsRegenerateRoute, /requireAdminSession/);
  assert.match(captionsRegenerateRoute, /syncMarketingCopyDeskForRun/);
  assert.doesNotMatch(hubPage, /Connect account|Schedule post|Publish now|Blotato|Metricool/);
  assert.doesNotMatch(workspace, /Connect account|Schedule post|Publish now|Blotato|Metricool/);
  assert.doesNotMatch(copyDeskComponent, /oauth|schedule-to-network|Blotato|Metricool/);
  assert.doesNotMatch(copyDeskLib, /openai|chat\.completions|images\.generate/);
});

test("unsigned /chat is not a public unauth path", () => {
  const publicPaths = middleware.match(/const PUBLIC_UNAUTH_PATHS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";
  assert.doesNotMatch(publicPaths, /"\/chat"/);
  assert.match(publicPaths, /"\/studio"/);
  assert.match(middleware, /url\.pathname = "\/";/);
});
