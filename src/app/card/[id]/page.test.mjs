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

test("shared card page uses studio-aligned 9:16 shell layout (not full-viewport card canvas)", () => {
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const mainWrapperSource = readSource("src/components/MainContentWrapper.tsx");

  assert.match(conditionalFooter, /const isStudioCardSharePath = \(pathname: string\) => \{/);
  assert.match(conditionalFooter, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(conditionalFooter, /if \(\(isEventShare && hasNoSession\) \|\| isStudioCardShare\) \{/);
  assert.match(sharedPageSource, /Created by Envitefy Studio/);
  assert.match(sharedPageSource, /href="\/studio"/);
  assert.match(sharedPageSource, /min-h-\[100dvh\][\s\S]*flex-col/);
  assert.match(sharedPageSource, /aspect-\[9\/16\][\s\S]*rounded-\[3rem\]/);
  assert.match(sharedPageSource, /max-h-\[calc\(100dvh-5\.5rem\)\]/);
  assert.match(sharedPageSource, /object-cover/);
  assert.match(sharedPageSource, /LiveCardHeroTextOverlay/);
  assert.match(sharedPageSource, /absolute bottom-32 left-6 right-6/);
  assert.match(
    sharedPageSource,
    /pointer-events-none absolute inset-0 flex flex-col p-8/,
  );
  assert.match(
    sharedPageSource,
    /flex flex-nowrap items-end justify-center gap-4/,
  );
  assert.doesNotMatch(
    sharedPageSource,
    /<main[^>]*h-screen[\s\S]*h-\[100dvh\]/,
  );
  assert.match(
    sharedPageSource,
    /<footer[^>]*shrink-0[\s\S]*Created by Envitefy Studio[\s\S]*<\/footer>/s,
  );
  assert.match(mainWrapperSource, /isStudioCardShare/);
  assert.match(mainWrapperSource, /paddingTop = isStudioCardShare\s*\?\s*"0px"/);
});

test("shared card route and page preserve overlay hero text mode for live cards", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");

  assert.match(pageSource, /const heroTextMode =\s*data\.heroTextMode === "overlay" \|\| data\.heroTextMode === "image"/);
  assert.match(pageSource, /heroTextMode,/);
  assert.match(sharedPageSource, /heroTextMode\?: "image" \| "overlay"/);
  assert.match(sharedPageSource, /<LiveCardHeroTextOverlay invitationData=\{invitationData\} \/>/);
});
