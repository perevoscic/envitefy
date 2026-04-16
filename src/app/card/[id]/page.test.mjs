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
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
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
  assert.match(
    surfaceSource,
    /absolute bottom-32 left-2 right-2[\s\S]*md:left-6 md:right-6/,
  );
  assert.match(
    surfaceSource,
    /pointer-events-none absolute inset-0 flex flex-col[\s\S]*md:p-8/,
  );
  assert.match(
    surfaceSource,
    /grid w-full min-w-0 grid-flow-col auto-cols-fr[\s\S]*md:gap-3/,
  );
  assert.doesNotMatch(
    sharedPageSource,
    /<main[^>]*h-screen[\s\S]*h-\[100dvh\]/,
  );
  assert.match(mainWrapperSource, /isStudioCardShare/);
  assert.match(mainWrapperSource, /paddingTop = isStudioCardShare\s*\?\s*"0px"/);
});

test("shared card route and page preserve overlay hero text mode for live cards", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(pageSource, /const heroTextMode =\s*data\.heroTextMode === "overlay" \|\| data\.heroTextMode === "image"/);
  assert.match(pageSource, /heroTextMode,/);
  assert.match(surfaceSource, /heroTextMode\?: "image" \| "overlay"/);
  assert.match(sharedPageSource, /<LiveCardHeroTextOverlay invitationData=\{invitationData\} \/>/);
});

test("poster-first shared cards keep floating controls without a dark footer strip", () => {
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(surfaceSource, /export function isPosterFirstHeroCard\(invitationData\?: LiveCardInvitationData \| null\)/);
  assert.match(sharedPageSource, /const posterFirstHeroCard = isPosterFirstHeroCard\(invitationData\);/);
  assert.match(
    surfaceSource,
    /border-white\/28 bg-white\/18 shadow-\[0_12px_28px_rgba\(0,0,0,0\.34\)/,
  );
  assert.match(
    surfaceSource,
    /max-md:min-h-\[min\(14svh,4rem\)\] min-h-\[min\(8svh,2\.4rem\)\] md:min-h-\[min\(6svh,2rem\)\]/,
  );
  assert.match(
    sharedPageSource,
    /posterFirstHeroCard \? \(\s*<div className="shrink-0 px-4 py-3 text-center">/s,
  );
  assert.match(
    sharedPageSource,
    /<footer className="shrink-0 border-t border-white\/10 bg-neutral-950 px-4 py-3 text-center">/,
  );
});
