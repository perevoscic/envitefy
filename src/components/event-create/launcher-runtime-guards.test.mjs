import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("launcher URL sync flows add explicit timeout handling and start logs", () => {
  const gymnasticsSource = readSource("src/components/event-create/GymnasticsLauncher.tsx");
  const footballSource = readSource("src/components/event-create/FootballLauncher.tsx");

  assert.match(gymnasticsSource, /const INGEST_REQUEST_TIMEOUT_MS = 15_000;/);
  assert.match(gymnasticsSource, /resolveDiscoveryClientParseTimeoutMs\(inputType\)/);
  assert.match(gymnasticsSource, /resolveParseTimeoutMs\(file \? "file" : "url"\)/);
  assert.match(gymnasticsSource, /resolveGymnasticsUrlParseProgress\(Date\.now\(\) - parseStartedAt\)/);
  assert.match(gymnasticsSource, /indeterminate=\{urlIndeterminate\}/);
  assert.match(gymnasticsSource, /URL sync requested/);
  assert.match(gymnasticsSource, /ingest url request timed out/);
  assert.match(gymnasticsSource, /Live URL Sync timed out before the server responded/);

  assert.match(footballSource, /const INGEST_REQUEST_TIMEOUT_MS = 15_000;/);
  assert.match(footballSource, /from "@\/lib\/discovery-budget"/);
  assert.match(footballSource, /resolveDiscoveryClientParseTimeoutMs\(inputType\)/);
  assert.match(footballSource, /resolveParseTimeoutMs\(file \? "file" : "url"\)/);
  assert.match(footballSource, /URL sync requested/);
  assert.match(footballSource, /ingest url request timed out/);
  assert.match(footballSource, /Football URL sync timed out before the server responded/);
});

test("dev server startup isolates non-default ports and checks for occupied ports", () => {
  const devSingleSource = readSource("scripts/dev-single.js");
  const nextConfigSource = readSource("next.config.ts");

  assert.match(devSingleSource, /Port \$\{devPort\} is already in use/);
  assert.match(devSingleSource, /if \(explicitPortArg\) \{\s*process\.env\.PORT = explicitPortArg;/);
  assert.match(devSingleSource, /devPort === "3000" \? "\.next-dev\.lock" : `\.next-dev-\$\{devPort\}\.lock`/);
  assert.match(nextConfigSource, /return `\.next-dev-\$\{sanitizedPort\}`;/);
});
