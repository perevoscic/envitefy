import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event actions preserve event_history as source of truth and invalidate caches", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /ALLOWED_EVENT_PATCH_FIELDS/);
  assert.match(source, /"startAt"/);
  assert.match(source, /"startISO"/);
  assert.match(source, /"start"/);
  assert.match(source, /"location"/);
  assert.match(source, /"category"/);
  assert.match(source, /"status"/);
  assert.match(source, /normalizeCanonicalStartFields\(nextData\)/);
  assert.match(source, /syncLiveCardCopyFromPatch\(nextData, patch\)/);
  assert.match(source, /updateEventHistoryData\(params\.eventId, nextData\)/);
  assert.match(source, /invalidateUserHistory\(params\.userId\)/);
  assert.match(source, /invalidateUserDashboard\(params\.userId\)/);
});

test("create_asset writes event assets with matching event and user ids", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /createEventAsset\(\{/);
  assert.match(source, /userId: params\.userId/);
  assert.match(source, /eventId: params\.eventId/);
  assert.match(source, /assetType: action\.assetType/);
});

test("event updates keep generated live-card copy aligned", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /function syncLiveCardCopyFromPatch/);
  assert.match(source, /assignCopyField\("subheadline", theme \? `\$\{theme\} theme` : null\)/);
  assert.match(source, /data\.liveCard = liveCard/);
  assert.match(source, /data\.publicEvent = publicEvent/);
  assert.match(source, /data\.previewCopy = previewCopy/);
});

test("weather questions stay read-only and use bounded context", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /import \{ shouldResolveConciergeWeatherContext \}/);
  assert.match(source, /function buildWeatherPlan/);
  assert.match(source, /weatherContext\?\.message/);
  assert.match(source, /return buildWeatherPlan\(params\.weatherContext\)/);
  assert.doesNotMatch(source, /type: "update_event"[\s\S]{0,240}weatherContext/);
});
