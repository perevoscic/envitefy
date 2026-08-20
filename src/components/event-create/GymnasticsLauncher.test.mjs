import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gymnastics launcher reports server stages and opens as soon as the core draft is ready", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /const \[urlStatus, setUrlStatus\] = useState\(""\);/);
  assert.match(source, /resolveGymnasticsPipelineProgress/);
  assert.match(source, /draftReady: statusJson\?\.draftReady \?\? null/);
  assert.match(
    source,
    /statusJson\?\.draftReady === true \|\| statusJson\?\.builderReady === true/,
  );
  assert.match(source, /window\.setTimeout\(resolve, 1500\)/);
  assert.match(source, /DiscoveryProgressPanel/);
  assert.match(source, /expectation="Core draft usually opens in under a minute"/);
  assert.doesNotMatch(source, /GYM_DISCOVERY_STATUS_PHRASES/);
  assert.doesNotMatch(source, /parseProgressTimerRef/);
  assert.doesNotMatch(source, /urlIndeterminate/);
  assert.match(source, /showDetails=\{false\}/);
  assert.doesNotMatch(source, /Public pages may take a little longer to read/);
});

test("gymnastics launcher clearly explains and prioritizes its three creation paths", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /Create your meet page\./);
  assert.match(source, /Upload a meet packet/);
  assert.match(source, /Sync a live meet URL/);
  assert.match(source, /Start with a template/);
  assert.match(source, /Recommended/);
  assert.match(source, /Nothing publishes automatically/);
  assert.match(source, /Every detail stays editable/);
});

test("gymnastics launcher uses compact, touch-safe mobile actions", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /Upload packet/);
  assert.match(source, /placeholder="Paste public meet URL"/);
  assert.match(source, /Build from this link/);
  assert.match(source, /LIGHT_RAISED_BUTTON_CLASS/);
  assert.match(source, /lg:hidden/);
  assert.match(source, /lg:min-h-\[28rem\]/);
  assert.doesNotMatch(source, /selectedPath !== "url"/);
});

test("gymnastics launcher keeps actions content-sized and clears the mobile navigation", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /w-fit max-w-full/);
  assert.match(source, /rounded-full/);
  assert.match(source, /pt-24/);
  assert.match(source, /lg:pt-10/);
  assert.match(source, /mt-1\.5 block text-\[#6d35f5\] sm:mt-0/);
  assert.match(source, /space-y-3 text-center/);
});
