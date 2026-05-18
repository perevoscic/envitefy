import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("shared card route prefers the public-safe cover image url", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const dbSource = readSource("src/lib/db.ts");

  assert.match(
    pageSource,
    /async function normalizeSharedCardImageUrl\(value: unknown\): Promise<string>/,
  );
  assert.match(pageSource, /if \(raw\.startsWith\("\/"\)\) return absoluteUrl\(raw\);/);
  assert.match(
    pageSource,
    /if \(isLoopbackHostname\(parsed\.hostname\)\) \{\s*return absoluteUrl\(`\$\{parsed\.pathname\}\$\{parsed\.search\}`\);\s*\}/s,
  );
  assert.match(
    pageSource,
    /const imageUrl = await normalizeSharedCardImageUrl\(\s*readString\(data\.coverImageUrl\)\s*\|\|\s*readString\(studioCard\?\.imageUrl\)[\s\S]*resolveConciergeLiveCardImagePath\(data\)/,
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

test("shared card route can render concierge live-card events", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const historyPayloadSource = readSource("src/lib/concierge/history-payload.ts");

  assert.match(pageSource, /function resolveConciergeLiveCardImagePath/);
  assert.match(
    pageSource,
    /readString\(publicEvent\?\.renderer\)\.toLowerCase\(\) === "live_card"/,
  );
  assert.match(pageSource, /hasLiveCardOutput\(data\)/);
  assert.match(pageSource, /birthday: "\/studio\/birthday\.webp"/);
  assert.match(pageSource, /import \{ sanitizeGuestCopy, sanitizeGuestTitle \}/);
  assert.match(pageSource, /liveCard\?\.headline/);
  assert.match(pageSource, /publicEvent\?\.headline/);
  assert.match(pageSource, /function sanitizeInvitationData/);
  assert.match(pageSource, /sanitizeInvitationData\(studioCard\.invitationData\)/);
  assert.match(pageSource, /shareNote: sanitizeGuestCopy\(interactiveMetadata\.shareNote\)/);
  assert.match(pageSource, /themeStyle: sanitizeGuestCopy\(theme\.themeStyle\) \|\| ""/);
  assert.match(pageSource, /specialInstructions: ""/);
  assert.match(
    pageSource,
    /heroTextMode: heroTextMode \|\| \(hasLiveCardOutput\(data\) \? "image" : undefined\)/,
  );
  assert.match(historyPayloadSource, /coverImageUrl: liveCardImageUrl/);
  assert.match(historyPayloadSource, /studioCard: \{/);
  assert.match(historyPayloadSource, /invitationData: liveCardInvitationData/);
});

test("shared card route carries direct RSVP metadata into live-card actions", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(pageSource, /function withDirectRsvpInvitationData/);
  assert.match(pageSource, /eventId: args\.row\.id/);
  assert.match(pageSource, /rsvpMode: readFirstString\(eventDetails\.rsvpMode, "envitefy"\)/);
  assert.match(
    pageSource,
    /rsvpUrl: `\$\{buildEventPath\(\s*args\.row\.id,\s*args\.title,\s*undefined,\s*args\.row\.public_slug,\s*\)\}#event-rsvp`/,
  );
  assert.match(surfaceSource, /eventId\?: string;/);
  assert.match(surfaceSource, /const hasDirectEnvitefyRsvp = Boolean/);
  assert.match(
    surfaceSource,
    /fetch\(`\/api\/events\/\$\{encodeURIComponent\(directRsvpEventId\)\}\/rsvp`/,
  );
  assert.match(surfaceSource, />\s*Your name\s*</);
  assert.match(surfaceSource, />\s*Email\s*</);
  assert.doesNotMatch(surfaceSource, />\s*Phone optional\s*</);
  assert.doesNotMatch(surfaceSource, />\s*Note optional\s*</);
  assert.match(surfaceSource, /Choose yes, no, or maybe to RSVP from the card\./);
  assert.match(surfaceSource, /const directRsvpVenueLabel =/);
  assert.match(surfaceSource, /Thank you for RSVP-ing\./);
  assert.match(surfaceSource, /See you at \$\{directRsvpVenueLabel\}\./);
  assert.match(surfaceSource, /new CustomEvent\("rsvp-submitted"/);
});

test("shared card page keeps public shares in a centered live-card frame", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const conditionalFooter = readSource("src/components/ConditionalFooter.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const mainWrapperSource = readSource("src/components/MainContentWrapper.tsx");

  assert.match(conditionalFooter, /const isStudioCardSharePath = \(pathname: string\) => \{/);
  assert.match(conditionalFooter, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(
    conditionalFooter,
    /if \(\(isEventShare && hasNoSession\) \|\| isStudioCardShare \|\| isLandingShowcase\) \{/,
  );
  assert.match(sharedPageSource, /Created by Envitefy Studio/);
  assert.match(sharedPageSource, /href="\/studio"/);
  assert.match(sharedPageSource, /text: props\.title \|\| "Envitefy invitation"/);
  assert.doesNotMatch(sharedPageSource, /interactiveMetadata\?\.shareNote \|\|/);
  assert.match(pageSource, /function sanitizeInternalReturnHref\(value: string\): string/);
  assert.match(pageSource, /readSearchParam\(awaitedSearchParams\.preview\) === "owner"/);
  assert.match(pageSource, /getServerSession\(authOptions as any\)/);
  assert.match(pageSource, /const userId = await resolveSessionUserId\(session\);/);
  assert.match(
    pageSource,
    /const isOwner = Boolean\(userId && sharedCard\.row\.user_id && userId === sharedCard\.row\.user_id\);/,
  );
  assert.match(
    pageSource,
    /const explicitOwnerPreview = readSearchParam\(awaitedSearchParams\.preview\) === "owner";/,
  );
  assert.match(pageSource, /canShowOwnerRsvpDashboard\(sharedCard\.row\.data as any\)/);
  assert.match(
    pageSource,
    /const ownerWorkspaceHref = `\$\{buildEventPath\(\s*sharedCard\.row\.id,\s*sharedCard\.title,\s*undefined,\s*sharedCard\.row\.public_slug,\s*\)\}\?tab=\$\{ownerWorkspaceTab\}`;/,
  );
  assert.match(
    pageSource,
    /if \(isOwner && !explicitOwnerPreview\) \{\s*redirect\(ownerWorkspaceHref\);\s*\}/s,
  );
  assert.match(pageSource, /buildOwnerPreviewSearch\(returnHref\)/);
  assert.match(sharedPageSource, /returnHref\?: string \| null;/);
  assert.match(sharedPageSource, /aria-label="Close preview"/);
  assert.match(sharedPageSource, /inline-flex h-11 w-11 items-center justify-center rounded-full/);
  assert.match(sharedPageSource, /lg:left-\[calc\(20rem\+/);
  assert.doesNotMatch(sharedPageSource, /Back to dashboard/);
  assert.match(sharedPageSource, /export function SharedStudioCardFrame/);
  assert.match(sharedPageSource, /relative flex min-h-\[100dvh\] w-full flex-col bg-neutral-950/);
  assert.match(sharedPageSource, /<main className="relative z-0 flex min-h-0 flex-1 flex-col">/);
  assert.match(
    sharedPageSource,
    /const usesPosterArtFrame = invitationData\?\.heroTextMode === "image";/,
  );
  assert.match(sharedPageSource, /\* 2 \/ 3\)\)"/);
  assert.match(sharedPageSource, /usesPosterArtFrame \? "aspect-\[2\/3\]" : "aspect-\[9\/16\]"/);
  assert.match(
    sharedPageSource,
    /style=\{\{ width: props\.style\?\.width \? undefined : cardFrameWidth \}\}/,
  );
  assert.match(
    sharedPageSource,
    /className="absolute inset-0 h-full w-full object-cover object-center"/,
  );
  assert.match(sharedPageSource, /LiveCardHeroTextOverlay/);
  assert.match(
    surfaceSource,
    /absolute bottom-32 left-1\/2 z-50 w-\[calc\(100%-1rem\)\] max-w-\[22rem\] -translate-x-1\/2/,
  );
  assert.match(surfaceSource, /pointer-events-none absolute inset-0 flex flex-col[\s\S]*md:p-8/);
  assert.match(
    surfaceSource,
    /const defaultActionRailClassName = `grid w-full min-w-0 grid-flow-col auto-cols-fr items-stretch/,
  );
  assert.match(surfaceSource, /: defaultActionRailClassName;/);
  assert.match(mainWrapperSource, /isStudioCardShare/);
  assert.match(mainWrapperSource, /paddingTop = isStudioCardShare\s*\?\s*"0px"/);
});

test("shared card route and page preserve overlay hero text mode for live cards", () => {
  const pageSource = readSource("src/app/card/[id]/page.tsx");
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(
    pageSource,
    /const heroTextMode =\s*data\.heroTextMode === "overlay" \|\| data\.heroTextMode === "image"/,
  );
  assert.match(pageSource, /heroTextMode:/);
  assert.match(surfaceSource, /heroTextMode\?: "image" \| "overlay"/);
  assert.match(sharedPageSource, /<LiveCardHeroTextOverlay invitationData=\{invitationData\} \/>/);
});

test("poster-first shared cards keep floating controls with overlay studio credit", () => {
  const sharedPageSource = readSource("src/components/studio/SharedStudioCardPage.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(
    surfaceSource,
    /export function isPosterFirstHeroCard\(invitationData\?: LiveCardInvitationData \| null\)/,
  );
  assert.match(
    sharedPageSource,
    /const posterFirstHeroCard = isPosterFirstHeroCard\(invitationData\);/,
  );
  assert.match(sharedPageSource, /\{posterFirstHeroCard \? \(/);
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
