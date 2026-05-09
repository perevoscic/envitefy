import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("card edit route is owner-only and previews existing live-card artwork", () => {
  const source = readSource("src/app/api/events/[id]/card/edit/route.ts");

  assert.match(source, /getServerSession\(authOptions as any\)/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(
    source,
    /return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/,
  );
  assert.match(source, /existing\.user_id !== userId/);
  assert.match(source, /return NextResponse\.json\(\{ error: "Forbidden" \}, \{ status: 403 \}\)/);
  assert.match(source, /createStudioMediaItemFromHistoryRow\(existing\)/);
  assert.match(source, /function readAction\(value: unknown\): CardEditAction/);
  assert.match(source, /return readString\(value\) === "save" \? "save" : "preview";/);
  assert.match(
    source,
    /async function previewCardEdit\(item: MediaItem, fields: Record<string, unknown>\)/,
  );
  assert.match(source, /buildStudioRequest\(\s*nextDetails,\s*"image",\s*"page",/s);
  assert.match(source, /item\.url,\s*item\.details,/s);
  assert.match(source, /generateStudioInvitation\(request\)/);
  assert.match(source, /action: "preview"/);
  assert.match(source, /imageDataUrl: result\.imageDataUrl/);

  const previewBlock = source.match(
    /async function previewCardEdit[\s\S]*?(?=\nasync function saveCardEdit)/,
  );
  assert.ok(previewBlock, "expected previewCardEdit block");
  assert.doesNotMatch(previewBlock[0], /processBufferUpload/);
  assert.doesNotMatch(previewBlock[0], /updateEventHistory/);
});

test("card edit route normalizes duplicated venue and address fields", () => {
  const source = readSource("src/app/api/events/[id]/card/edit/route.ts");

  assert.match(source, /function splitVenueAndAddress\(venueName: string, location: string\)/);
  assert.match(source, /const commaIndex = combined\.indexOf\(","\);/);
  assert.match(source, /venueName: combined\.slice\(0, commaIndex\)\.trim\(\)/);
  assert.match(source, /location: combined\.slice\(commaIndex \+ 1\)\.trim\(\)/);
  assert.match(source, /function normalizeDesignFields\(fields: Record<string, unknown>\)/);
  assert.match(source, /normalized\.venueName = splitLocation\.venueName;/);
  assert.match(source, /normalized\.location = splitLocation\.location;/);
  assert.match(source, /const normalizedFields = normalizeDesignFields\(fields\);/);
});

test("card edit route saves selected preview data and invalidates owner and recipient caches", () => {
  const source = readSource("src/app/api/events/[id]/card/edit/route.ts");

  assert.match(
    source,
    /function buildUpdatedInvitationData\(nextDetails: EventDetails, item: MediaItem\)/,
  );
  assert.match(source, /refreshLiveCardInvitationData\(nextDetails, item\.data \|\| undefined\)/);
  assert.match(source, /scheduleLine: buildDeterministicScheduleLine\(nextDetails\)/);
  assert.match(
    source,
    /themeStyle: readString\(nextDetails\.theme\) \|\| refreshed\.theme\.themeStyle/,
  );
  assert.match(source, /async function saveCardEdit\(params: \{/);
  assert.match(source, /parseDataUrlBase64\(params\.imageDataUrl\)/);
  assert.match(source, /processBufferUpload\(\{/);
  assert.match(source, /const invitationData = buildUpdatedInvitationData\(nextDetails, item\)/);
  assert.match(source, /buildStudioPublishPayload\(nextItem, imageUrl\)/);
  assert.match(source, /updateEventHistoryTitle\(params\.id, payload\.title\)/);
  assert.match(source, /updateEventHistoryDataMerge\(params\.id, payload\.data\)/);
  assert.match(source, /invalidateHistoryAndDashboardForUser\(params\.userId\)/);
  assert.match(source, /async function invalidateSharedHistoryViewers\(eventId: string\)/);
  assert.match(source, /listShareRecipientUserIdsForEvent\(eventId\)/);
  assert.match(source, /invalidateHistoryAndDashboardForUser\(recipientUserId\)/);
  assert.match(source, /if \(action === "save"\) \{/);
  assert.match(
    source,
    /return await saveCardEdit\(\{ id, item, userId, fields, imageDataUrl \}\);/,
  );
});
