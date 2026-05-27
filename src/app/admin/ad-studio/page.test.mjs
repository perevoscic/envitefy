import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin ad studio is gated and uses server-side Gemini generation", () => {
  const page = readSource("src/app/admin/ad-studio/page.tsx");
  const route = readSource("src/app/api/admin/ad-studio/generate/route.ts");
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");
  const generator = readSource("src/lib/admin/ad-studio.ts");

  assert.match(page, /title="Ad Studio"/);
  assert.match(route, /requireAdminSession\(\)/);
  assert.match(route, /generateAdminAdStudioConfig/);
  assert.match(generator, /GoogleGenAI/);
  assert.match(generator, /GEMINI_API_KEY/);
  assert.doesNotMatch(client, /GEMINI_API_KEY/);
  assert.match(client, /\/api\/admin\/ad-studio\/generate/);
});

test("admin ad studio generates and serves Nano Banana frame assets", () => {
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");
  const imagesRoute = readSource("src/app/api/admin/ad-studio/images/route.ts");
  const videoRoute = readSource("src/app/api/admin/ad-studio/video/route.ts");
  const assetRoute = readSource("src/app/api/admin/ad-studio/assets/[runId]/route.ts");
  const generator = readSource("src/lib/admin/ad-studio.ts");

  assert.doesNotMatch(client, /envitefy-ad-player\/src\/assets\/images/);
  assert.match(client, /generatedFrame\.url/);
  assert.match(client, /Generate Nano Frames/);
  assert.match(generator, /gemini-2\.5-flash-image/);
  assert.match(generator, /qa-artifacts", "ad-studio-runs"/);
  assert.match(imagesRoute, /generateAdminAdStudioImages/);
  assert.match(videoRoute, /generateAdminAdStudioVideo/);
  assert.match(assetRoute, /resolveAdminAdStudioAssetPath/);
  assert.match(client, /Nano frames, 2\.5 seconds each/);
});

test("admin ad studio uses official brand assets and all video aspect ratios", () => {
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");
  const types = readSource("src/lib/admin/ad-studio-types.ts");
  const generator = readSource("src/lib/admin/ad-studio.ts");

  assert.match(client, /src="\/favicon\.png"/);
  assert.match(client, /src="\/email\/envitefy-wordmark-email\.png"/);
  assert.match(client, /envitefy\.com/);
  assert.match(types, /"vertical", "horizontal", "square"/);
  assert.match(client, /ratio: "9:16"/);
  assert.match(client, /ratio: "16:9"/);
  assert.match(client, /ratio: "1:1"/);
  assert.match(generator, /public\/favicon\.png/);
  assert.match(generator, /public\/email\/envitefy-wordmark-email\.png/);
});

test("admin ad studio mirrors debug ad-player face-safe overlay zones", () => {
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");

  assert.match(client, /SafeZoneCaption/);
  assert.match(client, /PlanningStressObjects/);
  assert.match(client, /IncomingQuestionObjects/);
  assert.match(client, /ProductShowcaseSlide/);
  assert.match(client, /Party Date\?/);
  assert.match(client, /Guest List/);
  assert.match(client, /Incoming Questions/);
  assert.match(client, /bottom-\[8%\]/);
  assert.doesNotMatch(client, /items-center justify-center px-1 text-center/);
});

test("admin ad studio swaps live copy before preview and exposes video download", () => {
  const client = readSource("src/app/admin/ad-studio/AdStudioClient.tsx");

  assert.match(client, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,390px\)\]/);
  assert.match(client, /lg:order-2[\s\S]*Phone Preview/);
  assert.match(client, /lg:order-1[\s\S]*Live Copy/);
  assert.match(client, /Download Video/);
  assert.match(client, /Generate \+ Download Video/);
  assert.match(client, /\/api\/admin\/ad-studio\/images/);
  assert.match(client, /\/api\/admin\/ad-studio\/video/);
  assert.match(client, /Nano Banana: /);
});
