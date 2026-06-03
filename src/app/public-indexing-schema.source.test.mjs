import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("public event pages emit guarded metadata and Event JSON-LD", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(source, /function publicEventRequiresPasscode/);
  assert.match(source, /function isPublicEventIndexable/);
  assert.match(source, /robots: \{ index: false, follow: false \}/);
  assert.match(source, /id="ld-public-event"/);
  assert.match(source, /"@type": "Event"/);
  assert.match(source, /https:\/\/schema\.org\/EventScheduled/);
});

test("smart signup pages are noindexed by default and index only explicit public forms", () => {
  const source = readSource("src/app/smart-signup-form/[id]/page.tsx");
  const indexing = readSource("src/lib/smart-signup-indexing.ts");
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(source, /export async function generateMetadata/);
  assert.match(source, /robots: \{ index: false, follow: false \}/);
  assert.match(source, /id="ld-smart-signup-form"/);
  assert.match(source, /viewerKind: "owner" \| "guest" \| "readonly"/);
  assert.match(source, /"@type": "RegisterAction"/);
  assert.match(indexing, /explicitlyPublic/);
  assert.match(indexing, /explicitlyNoindexed/);
  assert.match(sitemap, /isIndexablePublicSmartSignupData\(row\.data\)/);
});
