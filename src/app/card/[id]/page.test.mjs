import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("shared card route prefers the public-safe cover image url", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const dbSource = readSource("src/lib/db.ts");

  assert.match(pageSource, /async function normalizeSharedCardImageUrl\(value: unknown\): Promise<string>/);
  assert.match(pageSource, /if \(raw\.startsWith\("\/"\)\) return absoluteUrl\(raw\);/);
  assert.match(pageSource, /if \(isLoopbackHostname\(parsed\.hostname\)\) \{\s*return absoluteUrl\(`\$\{parsed\.pathname\}\$\{parsed\.search\}`\);\s*\}/s);
  assert.match(
    pageSource,
    /const imageUrl = await normalizeSharedCardImageUrl\(\s*readString\(data\.coverImageUrl\)\s*\|\|\s*readString\(studioCard\?\.imageUrl\)/s,
  );
  assert.match(
    dbSource,
    /function buildEventHistoryPublicDataProjectionSql\(dataSql: string, idSql: string\): string \{/,
  );
  assert.match(
    dbSource,
    /jsonb_build_object\(\s*'coverImageUrl',\s*\$\{buildDashboardCoverImageUrlSql\(dataSql, idSql\)\}/s,
  );
});

test("shared card page uses a full-viewport responsive layout", () => {
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");

  assert.match(sharedPageSource, /min-h-screen\s+min-h-\[100svh\]\s+min-h-\[100dvh\]/);
  assert.match(sharedPageSource, /h-screen\s+h-\[100svh\]\s+h-\[100dvh\]/);
  assert.match(sharedPageSource, /object-contain/);
  assert.doesNotMatch(sharedPageSource, /max-w-md overflow-hidden rounded-\[3rem\]/);
});
