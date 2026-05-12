import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event assistant route is event-scoped and owner-enforced", () => {
  const source = readSource("src/app/api/concierge/events/[id]/message/route.ts");

  assert.match(source, /export const runtime = "nodejs"/);
  assert.match(source, /getServerSession\(authOptions as any\)/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(source, /getEventHistoryById\(eventId\)/);
  assert.match(source, /event\.user_id !== userId/);
  assert.match(source, /status: 401/);
  assert.match(source, /status: 404/);
  assert.doesNotMatch(source, /body\.user_id/);
  assert.doesNotMatch(source, /body\.userId/);
});

test("event assistant persists private thread history and applies server actions", () => {
  const source = readSource("src/app/api/concierge/events/[id]/message/route.ts");
  const applyIndex = source.indexOf("applyEventActions({");
  const userAppendIndex = source.indexOf('role: "user"');
  const assistantAppendIndex = source.indexOf('role: "assistant"');

  assert.match(source, /getOrCreateEventThread/);
  assert.match(source, /appendConversationMessage/);
  assert.match(source, /buildEventActionPlan/);
  assert.match(source, /applyEventActions/);
  assert.ok(applyIndex > 0);
  assert.ok(userAppendIndex > 0);
  assert.ok(userAppendIndex < applyIndex);
  assert.ok(assistantAppendIndex > applyIndex);
  assert.match(source, /acceptedAt: new Date\(\)\.toISOString\(\)/);
});

test("event assistant returns successful mutations even if assistant persistence fails", () => {
  const source = readSource("src/app/api/concierge/events/[id]/message/route.ts");
  const applyIndex = source.indexOf("applyEventActions({");
  const persistenceCatchIndex = source.indexOf(
    "Event assistant response persistence failed after action apply",
  );
  const successIndex = source.indexOf("ok: true");

  assert.ok(applyIndex > 0);
  assert.ok(persistenceCatchIndex > applyIndex);
  assert.ok(successIndex > persistenceCatchIndex);
  assert.match(source, /try \{[\s\S]*role: "assistant"[\s\S]*touchConversationThread/);
  assert.match(source, /console\.warn\("\[concierge\] Event assistant response persistence failed after action apply"/);
});

test("event assistant route emits optional timings and Server-Timing headers", () => {
  const source = readSource("src/app/api/concierge/events/[id]/message/route.ts");

  assert.match(source, /createServerTimingTracker\(isTimingRequested\(req\)\)/);
  assert.match(source, /timing\.time\("session"/);
  assert.match(source, /timing\.time\("user_lookup"/);
  assert.match(source, /timing\.time\("body_parse"/);
  assert.match(source, /timing\.time\("db_read"/);
  assert.match(source, /timing\.time\("weather_context"/);
  assert.match(source, /timing\.time\("db_write"/);
  assert.match(source, /timing\.time\("model_planning"/);
  assert.match(source, /timings: timing\.toObject\(\)/);
  assert.match(source, /timing\.applyHeader\(response\)/);
});

test("event assistant planner uses compact model context and deterministic fast actions", () => {
  const source = readSource("src/lib/concierge/event-actions.ts");

  assert.match(source, /buildCompactEventContext/);
  assert.match(source, /liveCardCopy/);
  assert.match(source, /recentMessages: params\.history\.slice\(-6\)/);
  assert.match(source, /max_completion_tokens: 650/);
  assert.match(source, /resolveConciergeOpenAiPlannerModel\(\{ simple, premium \}\)/);
  assert.match(source, /runWithConciergeOpenAiTimeout/);
  assert.match(source, /weatherContext: params\.weatherContext \|\| null/);
  assert.match(source, /shouldResolveConciergeWeatherContext\(params\.message\)/);
  assert.match(source, /isConciergeFastActionsEnabled\(\)/);
  assert.match(source, /shouldSkipOpenAiForEventAction\(params\.message\)/);
});
