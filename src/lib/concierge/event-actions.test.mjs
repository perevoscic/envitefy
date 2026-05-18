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
  assert.match(source, /sanitizeConciergePublicEventData\(nextData\)/);
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
  assert.match(source, /params\.event\.user_id !== params\.userId/);
  assert.match(source, /eventAssistantActionKey/);
  assert.match(source, /listEventAssets\(params\.eventId, params\.userId\)/);
  assert.match(source, /asset\.metadata\?\.eventAssistantActionKey === eventAssistantActionKey/);
});

test("event updates keep generated live-card copy aligned", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /function syncLiveCardCopyFromPatch/);
  assert.doesNotMatch(source, /assignCopyField\("subheadline", theme/);
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

test("event assistant constrains persona and refuses unsafe event requests", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /Use concise, warm, professional language/);
  assert.match(source, /Never use markdown, bullets, numbered lists/);
  assert.match(source, /Ask at most two short questions/);
  assert.match(source, /Do not claim an action was completed unless/);
  assert.match(source, /Do not execute destructive guest response changes/);
  assert.match(source, /guardedEventAssistantPlan/);
  assert.match(source, /Do not put API keys, passwords, or secrets in an invite/);
  assert.match(source, /I can't help scrape private RSVP data or bulk-change guest responses/);
  assert.match(source, /isExternalPlatformActionRequest/);
  assert.match(source, /I can't post to Facebook/);
});

test("event assistant bounds off-domain support without event mutations", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");
  const guardBlock = source.match(/function isOffDomainEventAssistantRequest[\s\S]*?function guardedEventAssistantPlan/);
  const offDomainPlanBlock = source.match(/if \(isOffDomainEventAssistantRequest\(message\)\) \{[\s\S]*?return null;/);

  assert.match(source, /isOffDomainEventAssistantRequest/);
  assert.match(source, /jokes\?\|toasts\?\|speeches\?/);
  assert.match(source, /printer\|wifi\|wi-fi\|router/);
  assert.match(source, /tax\(\?:es\)\?\|spreadsheet/);
  assert.match(
    source,
    /I can help edit this event, RSVP settings, guest-facing copy, assets, or weather planning/,
  );
  assert.doesNotMatch(guardBlock?.[0] || "", /type: "update_event"/);
  assert.doesNotMatch(offDomainPlanBlock?.[0] || "", /type: "update_event"|type: "create_asset"/);
});
