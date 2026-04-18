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

test("shared card page keeps public shares in a centered live-card frame", () => {
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const mainWrapperSource = readSource("src/components/MainContentWrapper.tsx");

  assert.match(conditionalFooter, /const isStudioCardSharePath = \(pathname: string\) => \{/);
  assert.match(conditionalFooter, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(conditionalFooter, /if \(\(isEventShare && hasNoSession\) \|\| isStudioCardShare\) \{/);
  assert.match(sharedPageSource, /Created by Envitefy Studio/);
  assert.match(sharedPageSource, /href="\/studio"/);
  assert.match(sharedPageSource, /relative flex min-h-\[100dvh\] w-full flex-col bg-neutral-950/);
  assert.match(sharedPageSource, /<main className="relative z-0 flex min-h-0 flex-1 flex-col">/);
  assert.match(
    sharedPageSource,
    /const cardFrameWidth =\s*"min\(calc\(100vw - 2rem\), calc\(\(100dvh - 6\.5rem - env\(safe-area-inset-top, 0px\) - env\(safe-area-inset-bottom, 0px\)\) \* 9 \/ 16\)\)";/,
  );
  assert.match(
    sharedPageSource,
    /relative mx-auto aspect-\[9\/16\] overflow-hidden rounded-\[3rem\]/,
  );
  assert.match(sharedPageSource, /style=\{\{ width: cardFrameWidth \}\}/);
  assert.match(sharedPageSource, /object-cover/);
  assert.match(sharedPageSource, /LiveCardHeroTextOverlay/);
  assert.match(
    surfaceSource,
    /absolute bottom-32 left-1\/2 z-50 w-\[calc\(100%-1rem\)\] max-w-\[22rem\] -translate-x-1\/2/,
  );
  assert.match(
    surfaceSource,
    /pointer-events-none absolute inset-0 flex flex-col[\s\S]*md:p-8/,
  );
  assert.match(
    surfaceSource,
    /grid w-full min-w-0 grid-flow-col auto-cols-fr[\s\S]*md:gap-3/,
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

test("poster-first shared cards keep floating controls with overlay studio credit", () => {
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(surfaceSource, /export function isPosterFirstHeroCard\(invitationData\?: LiveCardInvitationData \| null\)/);
  assert.match(sharedPageSource, /const posterFirstHeroCard = isPosterFirstHeroCard\(invitationData\);/);
  assert.match(
    sharedPageSource,
    /const studioCreditClass = posterFirstHeroCard\s*\?/,
  );
  assert.match(
    surfaceSource,
    /border-white\/28 bg-white\/18 shadow-\[0_12px_28px_rgba\(0,0,0,0\.34\)/,
  );
  assert.match(
    surfaceSource,
    /max-md:min-h-\[min\(14svh,4rem\)\] min-h-\[min\(8svh,2\.4rem\)\] md:min-h-\[min\(6svh,2rem\)\]/,
  );
  assert.match(sharedPageSource, /<div className="shrink-0 px-4 py-3 text-center">/);
  assert.doesNotMatch(
    sharedPageSource,
    /absolute right-4 top-\[max\(0\.75rem,env\(safe-area-inset-top\)\)\] z-30/,
  );
});
