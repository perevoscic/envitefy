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

  assert.match(source, /getOrCreateEventThread/);
  assert.match(source, /appendConversationMessage/);
  assert.match(source, /buildEventActionPlan/);
  assert.match(source, /applyEventActions/);
});
