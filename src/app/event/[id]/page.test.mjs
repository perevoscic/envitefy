import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event route branches football discovery/template events into the football renderer", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(
    source,
    /const FootballDiscoveryContent = nextDynamic\(\s*\(\) => import\("@\/components\/football-discovery\/FootballDiscoveryContent"\),/m,
    "FootballDiscoveryContent should be dynamically imported",
  );
  assert.match(source, /isGymMeetTemplateId/);
  assert.match(source, /resolveFootballSeasonTemplateChrome/);
  assert.match(source, /const footballPageTemplateId =/);
  assert.match(source, /const footballPublicChrome =/);
  assert.match(source, /pageTemplateId/);
  assert.match(source, /chrome=\{footballPublicChrome\}/);
  assert.match(source, /pageTemplateId=\{footballPageTemplateId\}/);
  assert.match(source, /hideOwnerActions=\{Boolean\(discoveryEditConfig\)\}/);
  assert.ok(
    source.includes("const shouldRenderFootballPage ="),
    "football renderer gate is missing",
  );
  assert.ok(
    source.indexOf("if (shouldRenderFootballPage)") < source.indexOf("if (isSimpleTemplate)"),
    "football renderer branch should run before the generic SimpleTemplateView branch",
  );
  assert.match(source, /if \(editParam && canEditCreatedEvent && isFootballDiscoveryTemplate\) \{/);
  assert.match(source, /redirect\("\/event"\)/);
  assert.match(source, /import BasketballSkin from "@\/components\/BasketballSkin";/);
  assert.match(source, /import BirthdaySkin from "@\/components\/BirthdaySkin";/);
  assert.match(source, /import FootballSkin from "@\/components\/FootballSkin";/);
  assert.match(source, /import PickleballSkin from "@\/components\/PickleballSkin";/);
  assert.match(source, /import OpenHouseSkin from "@\/components\/OpenHouseSkin";/);
  assert.match(source, /import GenericEventSkin from "@\/components\/GenericEventSkin";/);
  assert.match(source, /getPrimaryEventProductOutput/);
  assert.match(source, /isCardFirstEventProduct/);
  assert.match(source, /buildStudioCardPath/);
  assert.match(
    source,
    /const cardFirstCanonical = isCardFirstEventProduct\(primaryProductOutput\)/,
  );
  assert.match(
    source,
    /if \(cardFirstCanonical && !ownerToolsTab\) \{\s*redirect\(cardFirstCanonical\);/,
  );
  assert.ok(
    source.indexOf("if (cardFirstCanonical && !ownerToolsTab)") <
      source.indexOf("const discoveryWorkflow ="),
    "card-first event URLs should redirect before public renderer setup",
  );
  assert.doesNotMatch(source, /title="Manage event"/);
  assert.doesNotMatch(source, /href=\{`\/events\/\$\{row\.id\}\/manage`\}/);
  assert.doesNotMatch(source, /BirthdayTemplateView/);
  assert.match(source, /import \{ cleanGraduationVenueName \} from "@\/lib\/ocr\/text";/);
  assert.match(source, /function sanitizeScannedOcrDisplayTitle/);
  assert.match(source, /titleSegmentLooksLikeOcrVenueNarrative/);
  assert.match(source, /const title = sanitizeScannedOcrDisplayTitle\(row\.title as string, data\);/);
  assert.match(source, /const rawVenueText =/);
  assert.match(source, /const isGraduationCategory =/);
  assert.match(source, /categoryNormalized === "graduations" \|\| categoryNormalized === "graduation"/);
  assert.match(source, /isGraduationCategory \? cleanGraduationVenueName\(rawVenueText\)/);
  assert.match(source, /if \(isGraduationCategory\) \{/);
  assert.match(source, /<GraduationSkin/);
  assert.match(
    source,
    /const birthdayOcrSkin = normalizeOcrSkinSelection\(\(data as any\)\?\.ocrSkin, "birthday", undefined, \{/,
  );
  assert.match(
    source,
    /const isBirthdaySkinEvent =\s*categoryNormalized === "birthdays" && isOcrEvent && Boolean\(birthdayOcrSkin\);/,
  );
  assert.match(source, /if \(isBirthdaySkinEvent\) \{/);
  assert.match(source, /const ocrSkin = birthdayOcrSkin;/);
  assert.match(source, /<BirthdaySkin/);
  assert.match(source, /calendarLinks=\{calendarLinks\}/);
  assert.match(source, /skinId=\{ocrSkin\?\.skinId \|\| null\}/);
  assert.match(source, /palette=\{ocrSkin\?\.palette \|\| null\}/);
  assert.match(source, /background=\{ocrSkin\?\.background \|\| null\}/);
  assert.match(source, /rsvpName=\{rsvpName\}/);
  assert.match(source, /rsvpPhone=\{rsvpPhone\}/);
  assert.match(source, /rsvpEmail=\{rsvpEmail\}/);
  assert.match(source, /rsvpUrl=\{publicRsvpUrl\}/);
  assert.match(source, /normalizeOcrLocationFields/);
  assert.match(source, /normalizeOcrRsvpFields/);
  assert.match(source, /const rsvpPhone = explicitRsvpDisabled \? "" : rawRsvpPhone;/);
  assert.match(source, /const rsvpEmail = explicitRsvpDisabled \? "" : rawRsvpEmail;/);
  assert.match(source, /const rsvpUrl = explicitRsvpDisabled \? "" : rawRsvpUrl;/);
  assert.match(source, /const publicRsvpUrl = normalizedPublicRsvp\.rsvpUrl \|\| ""/);
  assert.doesNotMatch(source, /findFirstEmail\(data\)/);
  assert.match(source, /const hasPublicRsvpAction = Boolean\(/);
  assert.match(
    source,
    /const showPublicRsvp = !explicitRsvpDisabled && hasPublicRsvpAction;/,
  );
  assert.match(source, /planCopy=\{birthdayPlanCopy\}/);
  assert.match(source, /ocrFacts=\{scannedInviteOcrFacts\}/);
  assert.ok(
    source.indexOf("if (isBirthdaySkinEvent)") <
      source.indexOf("if (isBirthdayTemplate || isBirthdayRendererEvent)"),
    "birthday OCR skin branch should run before the birthday renderer branch",
  );
  assert.match(source, /const isBirthdayRendererEvent =/);
  assert.match(source, /categoryNormalized === "birthdays" && createdVia === "birthday-renderer"/);
  assert.match(source, /const birthdayThemeId = variationId \|\| BIRTHDAY_THEMES\[0\]\?\.id;/);
  assert.match(source, /const birthdayThemeBase = data\.theme\?\.layout/);
  assert.match(source, /const hideHostDashboard =/);
  assert.match(
    source,
    /const canEditCreatedEvent = canManageCreatedEvent && !isScannedOrUploadedEventData\(data\);/,
  );
  assert.match(source, /const ownerRsvpDashboardEnabled = canShowOwnerRsvpDashboard\(data\);/);
  assert.match(
    source,
    /const showHostDashboard =\s*canManageCreatedEvent && !hideHostDashboard && ownerRsvpDashboardEnabled;/,
  );
  assert.match(
    source,
    /const showOwnerWorkspace = canManageCreatedEvent && !isScannedOrUploadedEventData\(data\);/,
  );
  assert.match(source, /ownerToolsTab && !ownerRsvpDashboardEnabled && ownerToolsTab !== "design"/);
  assert.match(source, /redirect\(`\$\{ownerEventHref\}\?tab=\$\{resolvedOwnerToolsTab\}`\);/);
  assert.match(source, /if \(showOwnerWorkspace && resolvedOwnerToolsTab\) \{/);
  assert.match(source, /showHostDashboard=\{showHostDashboard\}/);
  assert.match(
    source,
    /const ScannedWeddingInviteView = nextDynamic\(\s*\(\) => import\("@\/components\/weddings\/ScannedWeddingInviteView"\),/m,
    "ScannedWeddingInviteView should be dynamically imported",
  );
  assert.match(source, /const isScannedWeddingInviteEvent =/);
  assert.match(source, /const weddingOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /Boolean\(weddingOcrSkin\)/);
  assert.match(source, /if \(isScannedWeddingInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = weddingOcrSkin;/);
  assert.match(source, /<ScannedWeddingInviteView/);
  assert.match(source, /eventId=\{row\.id\}/);
  assert.match(source, /flyerColors=\{ocrSkin\?\.palette \|\| flyerColors\}/);
  assert.match(source, /skinId=\{ocrSkin\?\.skinId \|\| null\}/);
  assert.match(source, /background=\{ocrSkin\?\.background \|\| null\}/);
  assert.match(source, /scheduleRows=\{scannedWeddingSchedule\}/);
  assert.match(source, /rsvpName=\{rsvpName\}/);
  assert.match(source, /rsvpPhone=\{rsvpPhone\}/);
  assert.match(source, /rsvpEmail=\{rsvpEmail\}/);
  assert.match(source, /rsvpUrl=\{publicRsvpUrl\}/);
  assert.match(source, /rsvpDeadline=\{rsvpDeadline \|\| null\}/);
  assert.match(source, /registryCards=\{registryCards\}/);
  assert.match(source, /ocrFacts=\{scannedInviteOcrFacts\}/);
  assert.match(source, /showPublicShareAction=\{!isReadOnly && canManageCreatedEvent\}/);
  assert.ok(
    source.indexOf("if (isScannedWeddingInviteEvent)") <
      source.indexOf("if (isGenericScannedInviteEvent)"),
    "scanned wedding branch should run before the generic scanned invite branch",
  );
  assert.match(source, /const isScannedPickleballInviteEvent =/);
  assert.match(source, /const pickleballOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /Boolean\(pickleballOcrSkin\)/);
  assert.match(source, /isPickleballOcrSkinCandidate/);
  assert.match(
    source,
    /String\(\(data as any\)\?\.ocrSkin\?\.sportKind \|\| ""\)\.toLowerCase\(\) === "pickleball"/,
  );
  assert.match(source, /createdVia === "ocr-pickleball-skin"/);
  assert.match(source, /if \(isScannedPickleballInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = pickleballOcrSkin;/);
  assert.match(source, /sportKind: "pickleball"/);
  assert.match(source, /<PickleballSkin/);
  assert.ok(
    source.indexOf("if (isScannedPickleballInviteEvent)") <
      source.indexOf("if (isScannedBasketballInviteEvent)"),
    "scanned pickleball branch should run before the scanned basketball branch",
  );
  assert.match(source, /const isScannedFootballInviteEvent =/);
  assert.match(source, /const footballOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /Boolean\(footballOcrSkin\)/);
  assert.match(source, /isFootballOcrSkinCandidate/);
  assert.match(
    source,
    /String\(\(data as any\)\?\.ocrSkin\?\.category \|\| ""\)\.toLowerCase\(\) === "football"/,
  );
  assert.match(source, /if \(isScannedFootballInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = footballOcrSkin;/);
  assert.match(source, /<FootballSkin/);
  assert.ok(
    source.indexOf("if (isScannedFootballInviteEvent)") <
      source.indexOf("if (isScannedBasketballInviteEvent)"),
    "scanned football branch should run before the scanned basketball branch",
  );
  assert.match(source, /const isScannedBasketballInviteEvent =/);
  assert.match(source, /const basketballOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /Boolean\(basketballOcrSkin\)/);
  assert.match(source, /isBasketballOcrSkinCandidate/);
  assert.match(
    source,
    /String\(\(data as any\)\?\.ocrSkin\?\.category \|\| ""\)\.toLowerCase\(\) === "basketball"/,
  );
  assert.match(source, /if \(isScannedBasketballInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = basketballOcrSkin;/);
  assert.match(source, /<BasketballSkin/);
  assert.ok(
    source.indexOf("if (isScannedBasketballInviteEvent)") <
      source.indexOf("if (isGenericScannedInviteEvent)"),
    "scanned basketball branch should run before the generic scanned invite branch",
  );
  assert.match(source, /const isScannedOpenHouseInviteEvent =/);
  assert.match(source, /const openHouseOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /Boolean\(openHouseOcrSkin\)/);
  assert.match(source, /createdVia === "ocr-open-house-skin"/);
  assert.match(source, /categoryNormalized === "open house"/);
  assert.match(source, /Boolean\(\(data as any\)\?\.openHouse\)/);
  assert.match(source, /if \(isScannedOpenHouseInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = openHouseOcrSkin;/);
  assert.match(source, /<OpenHouseSkin/);
  assert.match(source, /openHouse=\{\(\(data as any\)\?\.openHouse as any\) \|\| null\}/);
  assert.ok(
    source.indexOf("if (isScannedOpenHouseInviteEvent)") <
      source.indexOf("if (isGenericScannedInviteEvent)"),
    "scanned open house branch should run before the generic scanned invite branch",
  );
  assert.match(source, /const isGenericScannedInviteEvent =/);
  assert.match(source, /const genericOcrSkin = normalizeOcrSkinSelection/);
  assert.match(source, /isOcrInviteCategory\(categoryRaw\)/);
  assert.match(source, /Boolean\(genericOcrSkin\)/);
  assert.match(source, /if \(isGenericScannedInviteEvent\) \{/);
  assert.match(source, /const ocrSkin = genericOcrSkin;/);
  assert.match(source, /<GenericEventSkin/);
  assert.match(source, /categoryLabel=\{categoryRaw \|\| "General Event"\}/);
  assert.match(source, /skinId=\{ocrSkin\?\.skinId \|\| null\}/);
  assert.match(source, /palette=\{ocrSkin\?\.palette \|\| null\}/);
  assert.match(source, /background=\{ocrSkin\?\.background \|\| null\}/);
  assert.ok(
    source.indexOf("if (isGenericScannedInviteEvent)") <
      source.indexOf("const isBabyShowerTemplate ="),
    "generic scanned invite branch should run before later template fallbacks",
  );
});

test("event route disconnects the retired legacy event page fallback", () => {
  const source = readSource("src/app/event/[id]/page.tsx");
  const simpleTemplateBranch = source.indexOf("if (isSimpleTemplate)");
  const notFoundAfterTemplates = source.indexOf("notFound();", simpleTemplateBranch);
  const retiredFallback = source.indexOf("event-modern-page");

  assert.notEqual(simpleTemplateBranch, -1);
  assert.notEqual(notFoundAfterTemplates, -1);
  assert.notEqual(retiredFallback, -1);
  assert.ok(
    notFoundAfterTemplates < retiredFallback,
    "unknown events should 404 before the retired legacy event page can render",
  );
});

test("event route shows deleted event copy for missing event rows", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(source, /function DeletedEventNotice\(\)/);
  assert.match(source, /This event was deleted/);
  assert.match(source, /if \(!row\) return <DeletedEventNotice \/>;/);
  assert.doesNotMatch(source, /if \(!row\) return notFound\(\);/);
});

test("event route owner preview mode includes a dashboard return control", () => {
  const source = readSource("src/app/event/[id]/page.tsx");
  const suppressorSource = readSource("src/components/OwnerPreviewMobileTopbarSuppressor.tsx");

  assert.match(source, /function OwnerPreviewReturnLink\(\{ href \}: \{ href: string \}\)/);
  assert.match(source, /ArrowLeft,\s*[\s\S]*?\} from "lucide-react";/);
  assert.match(
    source,
    /import OwnerPreviewMobileTopbarSuppressor from "@\/components\/OwnerPreviewMobileTopbarSuppressor";/,
  );
  assert.match(source, /<OwnerPreviewMobileTopbarSuppressor \/>/);
  assert.match(source, /aria-label="Back to dashboard"/);
  assert.match(source, /inline-flex h-11 items-center justify-center gap-2 rounded-full/);
  assert.match(source, /<ArrowLeft size=\{18\}/);
  assert.match(source, /<span>Dashboard<\/span>/);
  assert.match(source, /lg:left-\[calc\(20rem\+/);
  assert.doesNotMatch(source, /aria-label="Close preview"/);
  assert.doesNotMatch(source, /<X size=\{18\}/);
  assert.match(suppressorSource, /root\.dataset\.mobileTopbarHidden = "true";/);
  assert.match(
    suppressorSource,
    /root\.style\.setProperty\("--app-mobile-topbar-offset", "0px"\);/,
  );
  assert.match(source, /function sanitizeInternalReturnHref\(value: string\): string/);
  assert.match(
    source,
    /readRouteSearchParam\(\(awaitedSearchParams as any\)\?\.preview\) === "owner"/,
  );
  assert.match(source, /const ownerPreviewEmbedded =/);
  assert.match(
    source,
    /readRouteSearchParam\(\(awaitedSearchParams as any\)\?\.embed\) === "dashboard-preview"/,
  );
  assert.match(source, /ownerPreviewMode && !ownerPreviewEmbedded/);
  assert.match(source, /ownerPreviewEmbedded \? <OwnerPreviewMobileTopbarSuppressor \/> : null/);
  assert.match(source, /<OwnerPreviewReturnLink href=\{ownerPreviewReturnHref\} \/>/);
});

test("event route sanitizes stored RSVP names before host fallback", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(source, /cleanRsvpContactLabel\(data\.hostName\.trim\(\)\)/);
  assert.match(source, /const storedRsvpNameRaw =/);
  assert.match(
    source,
    /const storedRsvpName = storedRsvpNameRaw \? cleanRsvpContactLabel\(storedRsvpNameRaw\) : "";/,
  );
  assert.match(
    source,
    /storedRsvpName \|\|\s*publicRsvpField \|\|\s*rsvpEmail \|\|\s*\(hasPublicRsvpAction \? hostName : ""\)/,
  );
});

test("event route renders concierge live cards with public details and direct RSVP", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(source, /const liveCardRecord = asPlainRecord\(data\?\.liveCard\);/);
  assert.match(source, /import \{ sanitizeGuestCopy, sanitizeGuestTitle \}/);
  assert.match(source, /const publicEventRecord = asPlainRecord\(data\?\.publicEvent\);/);
  assert.match(
    source,
    /const publicEventPrimaryOutput = cleanDisplayString\(publicEventRecord\.primaryOutput\)/,
  );
  assert.match(
    source,
    /const publicEventRenderer = cleanDisplayString\(publicEventRecord\.renderer\)/,
  );
  assert.match(source, /const isConciergeLiveCardEvent =/);
  assert.match(source, /discoveryCreatedVia === "concierge"/);
  assert.match(source, /publicEventPrimaryOutput === "live_card"/);
  assert.match(source, /publicEventRenderer === "live_card"/);
  assert.doesNotMatch(
    source,
    /Boolean\(firstDisplayString\(liveCardRecord\.headline, liveCardCopyRecord\.headline\)\)/,
  );
  assert.match(source, /const publicEventSubheadline = isConciergeVisualProduct/);
  assert.match(source, /firstGuestTitleString\(/);
  assert.match(source, /firstGuestCopyString\(/);
  assert.match(source, /liveCardRecord\.subheadline/);
  assert.match(source, /publicEventRecord\.subheadline/);
  assert.match(source, /liveCardRecord\.scheduleLine/);
  assert.match(source, /publicEventRecord\.scheduleLine/);
  assert.match(source, /const publicSourceSections = Array\.isArray\(publicEventRecord\.sourceSections\)/);
  assert.match(source, /data\?\.whenLabel/);
  assert.match(source, /const directRsvpEnabled =/);
  assert.match(source, /Boolean\(rsvpRecord\?\.isEnabled\)/);
  assert.match(source, /Boolean\(rsvpRecord\?\.direct\)/);
  assert.match(source, /const showPublicRsvp =/);
  assert.match(source, /allowDirectRsvp=\{directRsvpEnabled\}/);
  assert.match(source, /eventTitle=\{publicEventTitle\}/);
  assert.match(source, /\{publicEventSubheadline\}/);
});

test("event route renders concierge event pages as full website products", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(
    source,
    /import ConciergeEventWebsite from "@\/components\/concierge\/ConciergeEventWebsite";/,
  );
  assert.match(
    source,
    /const hasEventPageOutput = requestedOutputValues\.includes\("event_page"\);/,
  );
  assert.match(source, /const isConciergeEventPageProduct =/);
  assert.doesNotMatch(source, /isScanEventPageCreatedVia/);
  assert.match(source, /publicEventPrimaryOutput === "event_page"/);
  assert.match(source, /publicEventRenderer === "event_page"/);
  assert.match(
    source,
    /const isConciergeVisualProduct = isConciergeLiveCardEvent \|\| isConciergeEventPageProduct;/,
  );

  const conciergeEventPageBranch = source.indexOf("if (isConciergeEventPageProduct)");
  const genericScannedInviteBranch = source.indexOf("if (isGenericScannedInviteEvent)");

  assert.notEqual(conciergeEventPageBranch, -1);
  assert.notEqual(genericScannedInviteBranch, -1);
  assert.ok(
    conciergeEventPageBranch < genericScannedInviteBranch,
    "chat-created event pages should reach ConciergeEventWebsite before scanned-invite fallbacks",
  );
  assert.match(source, /<ConciergeEventWebsite\s+eventId=\{row\.id\}/);
  assert.match(source, /showRsvp=\{showPublicRsvp\}/);
  assert.match(source, /directRsvpEnabled=\{directRsvpEnabled\}/);
  assert.match(source, /registryLinks=\{registryCards\}/);
  assert.match(source, /calendarLinks=\{calendarLinks\}/);
  assert.match(source, /imageUrl=\{headerImageUrl\}/);
  assert.match(source, /sourceSections=\{publicSourceSections\}/);

  const websiteSource = readSource("src/components/concierge/ConciergeEventWebsite.tsx");
  assert.match(websiteSource, /aria-label="Event sections"/);
  assert.match(websiteSource, /Toggle menu/);
  assert.match(websiteSource, /#source-details/);
  assert.match(websiteSource, /Pulled from the upload/);
  assert.match(websiteSource, /#event-rsvp/);
  assert.match(websiteSource, /<EventRsvpPrompt/);
  assert.match(websiteSource, /#registry/);
});

test("direct Envitefy RSVP prompt does not require an outbound composer", () => {
  const source = readSource("src/components/EventRsvpPrompt.tsx");

  assert.match(source, /const isDirectOnlyRsvp = contactMode === "direct";/);
  assert.match(source, /if \(!isDirectOnlyRsvp\) \{\s*openOutboundComposerForIntent\(intent\);/s);
  assert.match(source, /We.ll send your RSVP directly to the host\./);
  assert.match(source, /isDirectOnlyRsvp \? "Send RSVP" : "Continue"/);
});
