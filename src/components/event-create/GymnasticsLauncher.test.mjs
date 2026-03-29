import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gymnastics launcher keeps file parsing determinate while routing URL sync through a live tail helper", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /const PROCESSING_PROGRESS_CAP = 90;/);
  assert.match(source, /const \[urlStatus, setUrlStatus\] = useState\(""\);/);
  assert.match(source, /const \[urlIndeterminate, setUrlIndeterminate\] = useState\(false\);/);
  assert.match(source, /parseProgress = Math\.min\(parseProgress \+ 3, PROCESSING_PROGRESS_CAP\)/);
  assert.match(source, /resolveGymnasticsUrlParseProgress\(0\)/);
  assert.match(source, /resolveGymnasticsUrlParseProgress\(Date\.now\(\) - parseStartedAt\)/);
  assert.match(source, /DiscoveryProgressPanel/);
  assert.match(source, /getDiscoveryStageLabel\("gymnastics-upload", uploadProgress\)/);
  assert.match(source, /urlStatus \|\| getDiscoveryStageLabel\("gymnastics-url", urlProgress\)/);
  assert.match(source, /setUrlIndeterminate\(status === GYMNASTICS_URL_PARSE_TAIL_LABEL\)/);
  assert.match(source, /indeterminate=\{urlIndeterminate\}/);
  assert.match(source, /"Processing\.\.\."/);
  assert.match(source, /uploadIndeterminate/);
  assert.doesNotMatch(source, /\b96\b/);
});
