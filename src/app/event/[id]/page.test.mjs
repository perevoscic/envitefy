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
  assert.match(
    source,
    /if \(editParam && canManageCreatedEvent && isFootballDiscoveryTemplate\) \{/,
  );
  assert.match(source, /redirect\("\/event"\)/);
  assert.match(source, /import BirthdaySkin from "@\/components\/BirthdaySkin";/);
  assert.match(source, /import ScannedInviteSkin from "@\/components\/ScannedInviteSkin";/);
  assert.match(source, /const isScannedBirthdayInviteEvent =/);
  assert.match(source, /categoryNormalized === "birthdays" && isScannedInviteEvent && isOcrEvent/);
  assert.match(source, /if \(isScannedBirthdayInviteEvent\) \{/);
  assert.match(
    source,
    /const ocrSkin = normalizeOcrSkinSelection\(\(data as any\)\?\.ocrSkin, "birthday", undefined, \{/,
  );
  assert.match(source, /<BirthdaySkin/);
  assert.match(source, /calendarLinks=\{calendarLinks\}/);
  assert.match(source, /skinId=\{ocrSkin\?\.skinId \|\| null\}/);
  assert.match(source, /palette=\{ocrSkin\?\.palette \|\| null\}/);
  assert.match(source, /background=\{ocrSkin\?\.background \|\| null\}/);
  assert.match(source, /rsvpName=\{rsvpName\}/);
  assert.match(source, /rsvpPhone=\{rsvpPhone\}/);
  assert.match(source, /rsvpEmail=\{rsvpEmail\}/);
  assert.match(source, /rsvpUrl=\{rsvpUrl\}/);
  assert.match(source, /planCopy=\{birthdayPlanCopy\}/);
  assert.ok(
    source.indexOf("if (isScannedBirthdayInviteEvent)") <
      source.indexOf("if (isBirthdayTemplate || isBirthdayRendererEvent)"),
    "scanned birthday branch should run before the old birthday renderer/template branch",
  );
  assert.match(source, /const isBirthdayRendererEvent =/);
  assert.match(source, /categoryNormalized === "birthdays" && createdVia === "birthday-renderer"/);
  assert.match(source, /const birthdayThemeId = variationId \|\| BIRTHDAY_THEMES\[0\]\?\.id;/);
  assert.match(source, /const hideHostDashboard =/);
  assert.match(source, /const showHostDashboard = canManageCreatedEvent && !hideHostDashboard/);
  assert.match(source, /showHostDashboard=\{showHostDashboard\}/);
  assert.match(
    source,
    /const ScannedWeddingInviteView = nextDynamic\(\s*\(\) => import\("@\/components\/weddings\/ScannedWeddingInviteView"\),/m,
    "ScannedWeddingInviteView should be dynamically imported",
  );
  assert.match(source, /const isScannedWeddingInviteEvent =/);
  assert.match(source, /categoryNormalized === "weddings" && isScannedInviteEvent && isOcrEvent/);
  assert.match(source, /if \(isScannedWeddingInviteEvent\) \{/);
  assert.match(
    source,
    /const ocrSkin = normalizeOcrSkinSelection\(\(data as any\)\?\.ocrSkin, "wedding", undefined, \{/,
  );
  assert.match(source, /<ScannedWeddingInviteView/);
  assert.match(source, /eventId=\{row\.id\}/);
  assert.match(source, /flyerColors=\{ocrSkin\?\.palette \|\| flyerColors\}/);
  assert.match(source, /skinId=\{ocrSkin\?\.skinId \|\| null\}/);
  assert.match(source, /background=\{ocrSkin\?\.background \|\| null\}/);
  assert.match(source, /scheduleRows=\{scannedWeddingSchedule\}/);
  assert.match(source, /rsvpName=\{rsvpName\}/);
  assert.match(source, /rsvpPhone=\{rsvpPhone\}/);
  assert.match(source, /rsvpEmail=\{rsvpEmail\}/);
  assert.match(source, /rsvpUrl=\{rsvpUrl\}/);
  assert.match(source, /rsvpDeadline=\{rsvpDeadline \|\| null\}/);
  assert.match(source, /registryCards=\{registryCards\}/);
  assert.match(source, /showPublicShareAction=\{!isReadOnly && canManageCreatedEvent\}/);
  assert.ok(
    source.indexOf("if (isScannedWeddingInviteEvent)") <
      source.indexOf("if (isGenericScannedInviteEvent)"),
    "scanned wedding branch should run before the generic scanned invite branch",
  );
  assert.match(source, /const isGenericScannedInviteEvent =/);
  assert.match(source, /isOcrInviteCategory\(categoryRaw\)/);
  assert.match(source, /if \(isGenericScannedInviteEvent\) \{/);
  assert.match(source, /<ScannedInviteSkin/);
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
