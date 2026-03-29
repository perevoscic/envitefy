import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("discovery progress copy includes staged meet and football sync messaging", () => {
  const source = readSource("src/components/event-create/discovery-progress.ts");

  assert.match(source, /"gymnastics-url"/);
  assert.match(source, /"Gathering meet info\.\.\."/);
  assert.match(source, /"Searching for gym\.\.\."/);
  assert.match(source, /GYMNASTICS_URL_PARSE_TAIL_LABEL = "Finalizing meet schedule\.\.\."/);
  assert.match(source, /resolveGymnasticsUrlParseProgress/);
  assert.match(source, /"Checking parking and arrival\.\.\."/);
  assert.match(source, /"football-url"/);
  assert.match(source, /"Finding roster and travel info\.\.\."/);
  assert.match(source, /"Checking gate info\.\.\."/);
});
