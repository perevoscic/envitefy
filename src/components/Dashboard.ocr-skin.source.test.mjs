import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("dashboard scan saves forward ocrSkin metadata for invite OCR persistence", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /ocrSkin\?: OcrSkinSelection \| null;/);
  assert.match(source, /thumbnailFocus\?: ThumbnailFocus \| null;/);
  assert.match(source, /openHouse\?: Record<string, unknown> \| null;/);
  assert.match(source, /ocrSkin: data\?\.ocrSkin \|\| null,/);
  assert.match(source, /openHouse: openHouseFromScan,/);
  assert.match(source, /thumbnailFocus: normalizeThumbnailFocus\(data\?\.thumbnailFocus\),/);
  assert.match(source, /const normalizedOcrSkin =/);
  assert.match(source, /const normalizedOpenHouse =/);
  assert.match(source, /const isOpenHouseOcrEvent =/);
  assert.match(source, /normalizedOcrCategory = "Open House";/);
  assert.match(
    source,
    /const normalizedThumbnailFocus = normalizeThumbnailFocus\(ocrMeta\?\.thumbnailFocus\);/,
  );
  assert.match(source, /isBasketballOcrSkinCandidate/);
  assert.match(source, /isFootballOcrSkinCandidate/);
  assert.match(source, /isPickleballOcrSkinCandidate/);
  assert.match(source, /const isPickleballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.sportKind === "pickleball"/);
  assert.match(source, /normalizedOcrCategory = "Sport Events";/);
  assert.match(source, /const isBasketballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.category === "basketball"/);
  assert.match(source, /if \(isBasketballOcrEvent\) \{\s*normalizedOcrCategory = "Sport Events";/);
  assert.match(source, /const isFootballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.category === "football"/);
  assert.match(source, /if \(isFootballOcrEvent\) \{\s*normalizedOcrCategory = "Sport Events";/);
  assert.match(
    source,
    /isBasketballOcrEvent \|\|\s*isFootballOcrEvent \|\|\s*isPickleballOcrEvent/,
  );
  assert.match(source, /flyerColors = normalizedOcrSkin\.palette;/);
  assert.match(
    source,
    /ocrSkin:\s*isInviteOcrEvent \? normalizedOcrSkin \|\| undefined : undefined,/,
  );
  assert.match(source, /thumbnailFocus:\s*normalizedThumbnailFocus \|\| undefined/);
  assert.match(source, /"ocr-pickleball-skin"/);
  assert.match(source, /"ocr-football-skin"/);
  assert.match(source, /"ocr-basketball-skin"/);
  assert.match(source, /"ocr-open-house-skin"/);
  assert.match(source, /"ocr-invite-skin"/);
  assert.match(
    source,
    /openHouse:\s*isOpenHouseOcrEvent \? normalizedOpenHouse \|\| undefined : undefined/,
  );
  assert.doesNotMatch(source, /templateId: isBirthdayOcrEvent/);
  assert.doesNotMatch(source, /variationId: isBirthdayOcrEvent/);
  assert.match(source, /const venueFromScan =/);
  assert.match(source, /venue: venueFromScan \|\| undefined/);
  assert.match(source, /venue:\s*typeof eventInput\.venue === "string"/);
  assert.match(source, /const extractRsvpName =/);
  assert.match(source, /import \{ cleanRsvpContactLabel \} from "@\/utils\/rsvp";/);
  assert.match(source, /const cleanedName = cleanRsvpContactLabel\(name\);/);
  assert.match(source, /const rawHostNameFromScan =/);
  assert.match(source, /const hostNameFromScan = rawHostNameFromScan/);
  assert.match(source, /cleanRsvpContactLabel\(rawHostNameFromScan\)/);
  assert.match(source, /rsvpName:\s*rsvpNameFromScan \|\|/);
  assert.match(source, /rsvpName:\s*typeof eventInput\.rsvpName === "string"/);
});

test("dashboard OCR save derives ownership from source intent, not OCR category", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /resolveSourceIntent/);
  assert.match(source, /const sourceIntent = resolveSourceIntent/);
  assert.match(source, /const detectedSourceIntent = sourceIntent\.detectedSourceIntent;/);
  assert.match(
    source,
    /const historyOwnership = detectedSourceIntent === "received_invite" \? "invited" : "owned";/,
  );
  assert.match(source, /ownership:\s*historyOwnership,/);
  assert.match(source, /invitedFromScan:\s*detectedSourceIntent === "received_invite",/);
  assert.match(source, /detectedSourceIntent,/);
  assert.match(source, /confidence:\s*sourceIntent\.confidence,/);
  assert.match(source, /requiresUserConfirmation:\s*sourceIntent\.requiresUserConfirmation,/);
  assert.doesNotMatch(source, /ownership:\s*"invited",\s*invitedFromScan:\s*true,/);
});

test("dashboard OCR save returns owned uploads to My Events owner workspace", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /ownership: "owned" \| "invited";/);
  assert.match(
    source,
    /return \{ ok: true, eventId, ownership: historyOwnership, savedTitle, publicSlug \};/,
  );
  assert.match(
    source,
    /ownership === "owned" \? \{ created: true, tab: "dashboard" \} : \{ created: true \}/,
  );
  assert.match(
    source,
    /setEventContextSourcePage\(ownership === "owned" \? "myEvents" : "invitedEvents"\);/,
  );
});

test("dashboard snap upload hard-navigates to the created event after save", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /const eventHref = buildEventPath\(/);
  assert.match(source, /stage: "event-navigation-start"/);
  assert.match(source, /window\.location\.replace\(eventHref\);/);
  assert.match(source, /router\.replace\(eventHref\);/);
  assert.doesNotMatch(source, /router\.push\(eventHref\);/);
});
