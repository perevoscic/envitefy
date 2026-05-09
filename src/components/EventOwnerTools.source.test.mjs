import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("owner workspace keeps public actions in the header and not duplicated under live product", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");
  const previewBlock = source.match(
    /function EventProductPreview[\s\S]*?(?=\nfunction OwnerWorkspaceHeader)/,
  );
  assert.ok(previewBlock, "expected EventProductPreview block");

  assert.match(source, /function OwnerWorkspaceHeader/);
  assert.match(source, />\s*Preview\s*</);
  assert.match(source, />\s*Share event\s*</);
  assert.match(source, />\s*Edit\s*</);
  assert.match(source, /hidden min-w-0 lg:sticky lg:top-5 lg:block lg:self-start/);

  assert.doesNotMatch(previewBlock[0], /onCopy/);
  assert.doesNotMatch(previewBlock[0], /onShare/);
  assert.doesNotMatch(previewBlock[0], /shareState/);
  assert.doesNotMatch(previewBlock[0], />\s*View\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Copy\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Share\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Live product\s*</);
  assert.match(previewBlock[0], /aria-label="Product preview"/);
  assert.match(previewBlock[0], /lg:h-\[min\(760px,calc\(100dvh-2\.5rem\)\)\]/);
  assert.match(previewBlock[0], /className="flex h-full w-full items-center justify-center"/);
  assert.match(previewBlock[0], /!h-full !w-auto !max-w-full !rounded-\[28px\]/);
  assert.doesNotMatch(previewBlock[0], /\bp-3\b/);
});

test("owner workspace removes duplicate tab strip and premature sections", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");
  const sidebarSource = readSource("src/components/navigation/EventSidebar.tsx");
  const responseSource = readSource("src/components/EventResponseDashboard.tsx");

  assert.doesNotMatch(source, /function OwnerWorkspaceTabs/);
  assert.doesNotMatch(source, /function OwnerMessagesPanel/);
  assert.doesNotMatch(source, /function OwnerSettingsPanel/);
  assert.doesNotMatch(source, /Copy link/);
  assert.doesNotMatch(source, /Event settings/);
  assert.doesNotMatch(source, /Messages/);
  assert.match(source, /const activeOwnerTab: EventContextTab = "dashboard";/);
  assert.match(source, /function buildOwnerPreviewHref/);
  assert.match(source, /parsed\.searchParams\.set\("preview", "owner"\)/);
  assert.match(responseSource, /Response overview/);
  assert.doesNotMatch(responseSource, /View RSVP board/);
  assert.doesNotMatch(sidebarSource, /RSVPs/);
  assert.doesNotMatch(responseSource, /Copy link/);
  assert.doesNotMatch(responseSource, /Public page/);
  assert.doesNotMatch(responseSource, /RSVP deadline/);
  assert.doesNotMatch(sidebarSource, /Communications/);
  assert.doesNotMatch(sidebarSource, /Settings/);
});

test("owner workspace live product uses card fallback data instead of a blank navy placeholder", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");

  assert.match(source, /const PREVIEW_IMAGE_BY_CATEGORY: Record<string, string>/);
  assert.match(source, /function resolveProductPreviewImageUrl/);
  assert.match(
    source,
    /PREVIEW_IMAGE_BY_CATEGORY\[category\] \|\| "\/studio\/custom-invite\.webp"/,
  );
  assert.match(source, /function buildFallbackInvitationData/);
  assert.match(source, /asRecord\(studioCard\?\.invitationData\) \|\| buildFallbackInvitationData/);
  assert.doesNotMatch(source, />\s*Event preview\s*</);
});

test("concierge-created products edit through their original chat thread", () => {
  const source = readSource("src/utils/event-edit-route.ts");

  assert.match(source, /function resolveConciergeEditHref\(eventData: unknown\): string \| null/);
  assert.match(source, /cleanString\(conciergeDraft\?\.creationSessionId\)/);
  assert.match(source, /\/chat\?thread=\$\{encodeURIComponent\(threadId\)\}/);
  assert.match(source, /const conciergeEditHref = resolveConciergeEditHref\(eventData\);/);
  assert.match(source, /if \(conciergeEditHref\) return conciergeEditHref;/);
});

test("scanned or uploaded events edit through owner tools instead of category builders", () => {
  const source = readSource("src/utils/event-edit-route.ts");

  assert.match(source, /function isScannedOrUploadedEvent\(eventData: unknown\): boolean/);
  assert.match(source, /\/\(ocr\|scan\|upload\)\/\.test\(createdVia\)/);
  assert.match(source, /if \(isScannedOrUploadedEvent\(eventData\)\) \{/);
  assert.match(source, /return `\/events\/\$\{encodeURIComponent\(eventId\)\}\/manage`;/);
});
