import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("owner workspace keeps public actions in the header and not duplicated under live product", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");
  const globals = readSource("src/app/globals.css");
  const previewBlock = source.match(
    /function EventProductPreview[\s\S]*?(?=\nfunction OwnerWorkspaceHeader)/,
  );
  assert.ok(previewBlock, "expected EventProductPreview block");

  assert.match(source, /function OwnerWorkspaceHeader/);
  assert.match(source, /owner-workspace-glass/);
  assert.match(source, /owner-workspace-summary-card/);
  assert.match(source, /pt-\[calc\(var\(--app-mobile-topbar-offset,4rem\)\+1\.35rem\)\]/);
  assert.match(globals, /owner-workspace-glass-panel/);
  assert.match(globals, /\.owner-workspace-summary-card/);
  assert.match(globals, /0 -10px 30px rgba\(15, 23, 42, 0\.08\)/);
  assert.match(source, /flex items-center justify-between gap-3/);
  assert.match(source, /flex shrink-0 items-center gap-2/);
  assert.match(source, /aria-label="Share"/);
  assert.match(source, /aria-label="Preview"/);
  assert.match(source, /aria-label="Edit"/);
  assert.match(
    source,
    /className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700/,
  );
  assert.match(
    source,
    /className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950/,
  );
  assert.match(
    source,
    /className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-700/,
  );
  assert.match(source, /<ExternalLink size=\{20\}/);
  assert.match(source, /<Share2 size=\{21\}/);
  assert.match(
    source,
    /const \[isMobilePreviewOpen, setIsMobilePreviewOpen\] = useState\(false\);/,
  );
  assert.match(source, /onPreview=\{openMobilePreview\}/);
  assert.match(source, /function MobileOwnerPreviewDrawer/);
  assert.match(source, /isMobilePreviewOpen \? "-translate-x-10" : "translate-x-0"/);
  assert.match(source, /open \? "translate-x-0" : "translate-x-full"/);
  assert.doesNotMatch(source, /<span className="hidden sm:inline">Share<\/span>/);
  assert.doesNotMatch(source, /<span className="hidden sm:inline">Preview<\/span>/);
  assert.doesNotMatch(source, /<span className="hidden sm:inline">Edit<\/span>/);
  const headerBlock = source.match(
    /function OwnerWorkspaceHeader[\s\S]*?(?=\nfunction OwnerTabContent)/,
  );
  assert.ok(headerBlock, "expected OwnerWorkspaceHeader block");
  assert.match(
    headerBlock[0],
    /href=\{editHref\}[\s\S]*href=\{previewHref\}[\s\S]*onClick=\{onShare\}/,
  );
  assert.doesNotMatch(headerBlock[0], /rounded-2xl border border-slate-200 bg-white/);
  assert.doesNotMatch(headerBlock[0], /rounded-2xl bg-slate-950 text-white/);
  assert.doesNotMatch(headerBlock[0], /Edit card/);
  assert.doesNotMatch(headerBlock[0], /aria-label="Details"/);
  assert.doesNotMatch(headerBlock[0], /<span className="hidden sm:inline">Details<\/span>/);
  assert.doesNotMatch(headerBlock[0], /sm:order-3/);
  assert.match(
    source,
    /hidden min-w-0 lg:sticky lg:top-5 lg:flex lg:h-\[calc\(100dvh-2\.5rem\)\] lg:translate-x-6 lg:items-center lg:justify-end lg:self-start xl:translate-x-10/,
  );
  assert.match(source, /className="mx-auto w-full max-w-\[430px\]"/);
  assert.match(source, /heightMode="auto"/);
  assert.match(source, /flex min-h-full items-center justify-center/);

  assert.doesNotMatch(previewBlock[0], /onCopy/);
  assert.doesNotMatch(previewBlock[0], /onShare/);
  assert.doesNotMatch(previewBlock[0], /shareState/);
  assert.doesNotMatch(previewBlock[0], />\s*View\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Copy\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Share\s*</);
  assert.doesNotMatch(previewBlock[0], />\s*Live product\s*</);
  assert.match(previewBlock[0], /aria-label="Product preview"/);
  assert.match(previewBlock[0], /lg:h-\[min\(760px,calc\(100dvh-2\.5rem\)\)\]/);
  assert.match(previewBlock[0], /heightMode\?: "fixed" \| "auto";/);
  assert.match(previewBlock[0], /const autoHeight = heightMode === "auto";/);
  assert.match(previewBlock[0], /"flex h-full w-full items-center justify-center"/);
  assert.match(previewBlock[0], /"flex w-full items-center justify-center"/);
  assert.match(previewBlock[0], /!h-full !w-auto !max-w-full !rounded-\[28px\]/);
  assert.match(previewBlock[0], /!w-full !max-w-full !rounded-\[28px\]/);
  assert.doesNotMatch(previewBlock[0], /\bp-3\b/);
});

test("owner workspace exposes Dashboard RSVPs Messages and Design tabs", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");
  const sidebarSource = readSource("src/components/navigation/EventSidebar.tsx");
  const responseSource = readSource("src/components/EventResponseDashboard.tsx");

  assert.match(source, /const OWNER_WORKSPACE_TABS/);
  assert.match(source, /function OwnerWorkspaceTabs/);
  assert.match(source, /label: "Dashboard"/);
  assert.match(source, /label: "RSVPs"/);
  assert.match(source, /label: "Messages"/);
  assert.match(source, /label: "Design"/);
  assert.match(source, /const OWNER_TAB_HINT_INTERVAL_MS = 2000;/);
  assert.match(source, /const OWNER_TAB_HINT_CYCLES = 3;/);
  assert.match(source, /const OWNER_TAB_COMPACT_WIDTH = 44;/);
  assert.match(
    source,
    /const \[hintTab, setHintTab\] = useState<EventContextTab \| null>\(null\);/,
  );
  assert.match(source, /if \(activeTab !== "dashboard" \|\| tabs\.length < 2\)/);
  assert.match(source, /let step = tabs\.findIndex\(\(tab\) => tab\.key === activeTab\) \+ 1;/);
  assert.match(source, /window\.setInterval/);
  assert.match(source, /const isHinted = hintTab === tab\.key && !isActive;/);
  assert.match(source, /const isRevealed = isActive \|\| isHinted;/);
  assert.match(source, /aria-selected=\{isActive\}/);
  assert.match(source, /flex w-full items-center justify-between gap-1 sm:hidden/);
  assert.match(source, /hidden w-full grid-cols-4 gap-1 sm:grid/);
  assert.match(source, /inline-flex min-h-11 min-w-0 items-center justify-center gap-2/);
  assert.match(source, /<span className="truncate">\{tab\.label\}<\/span>/);
  assert.doesNotMatch(source, /Copy link/);
  assert.doesNotMatch(source, /Event settings/);
  assert.match(
    source,
    /const activeOwnerTab: EventContextTab =\s*rsvpEnabled \|\| initialTab === "design" \? initialTab : "design";/,
  );
  assert.match(source, /OWNER_WORKSPACE_TABS\.filter\(\(tab\) => tab\.key === "design"\)/);
  assert.match(source, /<OwnerWorkspaceTabs/);
  assert.match(source, /activeTab=\{activeOwnerTab\}/);
  assert.match(source, /tabs=\{ownerWorkspaceTabs\}/);
  assert.match(source, /if \(!rsvpEnabled \|\| activeTab === "design"\)/);
  assert.doesNotMatch(source, /RsvpDisabledPanel/);
  assert.match(source, /function buildOwnerPreviewHref/);
  assert.match(source, /parsed\.searchParams\.set\("preview", "owner"\)/);
  assert.match(source, /import \{ buildStudioCardPath \} from "@\/utils\/event-url";/);
  assert.match(source, /function shouldOpenPreviewInStudioCard/);
  assert.match(source, /ownerDefaultSurface === "card"/);
  assert.match(source, /ownerDefaultSurface === "event" \|\| ownerDefaultSurface === "signup"/);
  assert.match(
    source,
    /return buildStudioCardPath\(\s*eventId,\s*currentEventTitle \|\| eventTitle,/,
  );
  assert.match(source, /<OwnerPublicLinkPanel/);
  assert.match(source, /\/api\/events\/\$\{encodeURIComponent\(eventId\)\}\/public-slug/);
  assert.match(responseSource, /Response overview/);
  assert.match(
    responseSource,
    /type EventResponseDashboardTab = "dashboard" \| "rsvps" \| "messages";/,
  );
  assert.match(responseSource, /activeTab === "dashboard"/);
  assert.match(responseSource, /function RsvpResponsesPanel/);
  assert.match(responseSource, /function RsvpMessagesPanel/);
  assert.match(sidebarSource, /label: "RSVPs"/);
  assert.match(sidebarSource, /label: "Messages"/);
  assert.match(sidebarSource, /label: "Design"/);
  assert.doesNotMatch(responseSource, /Copy link/);
  assert.doesNotMatch(responseSource, /Public page/);
  assert.doesNotMatch(responseSource, /RSVP deadline/);
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

test("generated card artwork opens the dashboard Design tab without losing details edit", () => {
  const ownerTools = readSource("src/components/EventOwnerTools.tsx");
  const routeSource = readSource("src/utils/event-edit-route.ts");
  const studioSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const sanitizeSource = readSource("src/app/studio/studio-workspace-sanitize.ts");

  assert.match(routeSource, /export function resolveArtworkEditHref/);
  assert.match(routeSource, /hasEditableStudioArtwork\(eventData\)/);
  assert.match(routeSource, /normalizedOutputValues/);
  assert.match(routeSource, /record\.requestedOutputs/);
  assert.match(routeSource, /publicEvent\?\.primaryOutput/);
  assert.match(routeSource, /Boolean\(cleanString\(record\.thumbnail\)\)/);
  assert.match(routeSource, /\/studio\?editEvent=\$\{encodeURIComponent\(eventId\)\}/);
  assert.match(ownerTools, /const resolvedArtworkEditHref = useMemo/);
  assert.match(ownerTools, /const designHref = buildOwnerTabHref\(ownerHref, eventId, "design"\);/);
  assert.match(
    ownerTools,
    /const primaryEditHref = resolvedArtworkEditHref \? designHref : resolvedEditHref;/,
  );
  assert.match(
    ownerTools,
    /detailsEditHref=\{resolvedArtworkEditHref \? resolvedEditHref : null\}/,
  );
  assert.match(ownerTools, /detailsEditHref=\{editHref\}/);
  assert.match(ownerTools, /href=\{detailsEditHref\}/);
  assert.match(ownerTools, /className="flex shrink-0 items-center gap-2"/);
  assert.match(ownerTools, /!detailsEditHref \? \(/);
  assert.match(studioSource, /searchParams\.get\("editEvent"\)/);
  assert.match(studioSource, /createStudioMediaItemFromHistoryRow\(row\)/);
  assert.match(sanitizeSource, /export function createStudioMediaItemFromHistoryRow/);
  assert.match(sanitizeSource, /publishedEventId: eventId/);
  assert.match(ownerTools, /if \(!rsvpEnabled \|\| activeTab === "design"\)/);
  assert.match(ownerTools, /function OwnerDesignPanel/);
});

test("owner Design tab previews card edits before saving them", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");
  const designBlock = source.match(/function OwnerDesignPanel[\s\S]*?(?=\n$)/);
  assert.ok(designBlock, "expected OwnerDesignPanel block");

  assert.match(source, /type DesignPreviewCandidate = \{/);
  assert.match(
    source,
    /const \[candidate, setCandidate\] = useState<DesignPreviewCandidate \| null>\(null\);/,
  );
  assert.match(source, /status === "previewing" \|\| status === "saving"/);
  assert.match(source, /action: "preview"/);
  assert.match(source, /imageDataUrl: nextImageDataUrl/);
  assert.match(source, /persisted: false/);
  assert.match(source, /async function handleSaveChanges\(\)/);
  assert.match(source, /action: "save"/);
  assert.match(source, /imageDataUrl: candidate\.imageDataUrl/);
  assert.match(source, /setBaselineForm\(nextForm\)/);
  assert.match(source, /persisted: true/);
  assert.match(source, /import OwnerPreviewMobileTopbarSuppressor/);
  assert.match(source, /isMobilePreviewOpen \? <OwnerPreviewMobileTopbarSuppressor \/> : null/);
  assert.match(source, /fixed inset-0 z-\[7000\] lg:hidden/);
  assert.match(source, /aria-label="Back to dashboard"/);
  assert.match(source, /<ArrowLeft size=\{20\}/);
  assert.match(source, /grid grid-cols-2 gap-3 md:grid-cols-3/);
  assert.match(source, /text-slate-500 md:col-span-3/);
  assert.match(source, /text-slate-500 md:col-span-2/);
  assert.match(source, /block min-w-0 text-xs font-black uppercase/);
  assert.match(source, /\{status === "previewing" \? "Previewing" : "Preview"\}/);
  assert.match(source, /\{status === "saving" \? "Saving" : "Save"\}/);
  assert.match(source, /grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end/);
  assert.match(source, /min-h-12 min-w-0 items-center justify-center/);
  assert.doesNotMatch(designBlock[0], /min-h-\[520px\][\s\S]*lg:hidden/);
  assert.doesNotMatch(designBlock[0], /shareUrl=\{publicUrl\}/);
  assert.doesNotMatch(designBlock[0], /Concierge request/);
  assert.doesNotMatch(designBlock[0], /Change the card time to 2:00 PM/);
});

test("owner Design tab splits duplicated venue and address values", () => {
  const source = readSource("src/components/EventOwnerTools.tsx");

  assert.match(
    source,
    /function splitDesignVenueAndAddress\(venueName: unknown, location: unknown\)/,
  );
  assert.match(source, /const commaIndex = combined\.indexOf\(","\);/);
  assert.match(source, /venueName: combined\.slice\(0, commaIndex\)\.trim\(\)/);
  assert.match(source, /location: combined\.slice\(commaIndex \+ 1\)\.trim\(\)/);
  assert.match(source, /\.\.\.splitDesignVenueAndAddress\(/);
  assert.match(source, /function buildDesignEditFields\(form: DesignFormState\): DesignEditFields/);
});

test("scanned or uploaded events edit through owner tools instead of category builders", () => {
  const source = readSource("src/utils/event-edit-route.ts");

  assert.match(source, /function isScannedOrUploadedEvent\(eventData: unknown\): boolean/);
  assert.match(source, /\/\(ocr\|scan\|upload\)\/\.test\(createdVia\)/);
  assert.match(source, /if \(isScannedOrUploadedEvent\(eventData\)\) \{/);
  assert.match(source, /return `\/events\/\$\{encodeURIComponent\(eventId\)\}\/manage`;/);
});

test("edit route avoids self redirects and unsafe underimplemented builders", () => {
  const source = readSource("src/utils/event-edit-route.ts");

  assert.match(source, /genericManageCategories/);
  assert.match(source, /"general_event"/);
  assert.match(source, /"doctor_appointment"/);
  assert.match(source, /"workshop_class"/);
  assert.match(source, /"special_events"/);
  assert.match(
    source,
    /return `\/event\/football\/customize\?edit=\$\{encodeURIComponent\(eventId\)\}`;/,
  );
  assert.doesNotMatch(
    source,
    /return `\/event\/\$\{encodeURIComponent\(eventId\)\}\?edit=\$\{encodeURIComponent\(eventId\)\}`;/,
  );
});
