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
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");

  assert.match(conditionalFooter, /const isStudioCardSharePath = \(pathname: string\) => \{/);
  assert.match(conditionalFooter, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(conditionalFooter, /if \(\(isEventShare && hasNoSession\) \|\| isStudioCardShare\) \{/);
  assert.match(sharedPageSource, /Created by Envitefy Studio/);
  assert.match(sharedPageSource, /href="\/studio"/);
  assert.match(sharedPageSource, /min-h-screen\s+min-h-\[100svh\]\s+min-h-\[100dvh\]/);
  assert.match(sharedPageSource, /h-screen\s+h-\[100svh\]\s+h-\[100dvh\]/);
  assert.match(sharedPageSource, /object-contain/);
  assert.match(
    sharedPageSource,
    /className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-center gap-3 px-2 pt-16 sm:gap-4 sm:px-4"/,
  );
  assert.match(sharedPageSource, /paddingBottom: "calc\(env\(safe-area-inset-bottom\) \+ 1\.35rem\)"/);
  assert.match(
    sharedPageSource,
    /<main className="relative h-screen h-\[100svh\] h-\[100dvh\] w-full overflow-hidden bg-neutral-950">[\s\S]*<\/main>\s*<div className="border-t border-white\/10 bg-neutral-950 px-4 py-3 text-center">/,
  );
  assert.doesNotMatch(sharedPageSource, /max-w-md overflow-hidden rounded-\[3rem\]/);
});
