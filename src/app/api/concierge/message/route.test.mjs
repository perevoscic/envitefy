import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("concierge message API requires server-side auth and never accepts body user ids", () => {
  const source = readSource("src/app/api/concierge/message/route.ts");

  assert.match(source, /export const runtime = "nodejs"/);
  assert.match(source, /getServerSession\(authOptions as any\)/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(source, /handleCreationIntake/);
  assert.match(source, /status: 401/);
  assert.doesNotMatch(source, /body\.user_id/);
  assert.doesNotMatch(source, /body\.userId/);
});

test("creation intake API owns session persistence and auth", () => {
  const source = readSource("src/app/api/creation/intake/route.ts");
  const intake = readSource("src/lib/concierge/intake.ts");
  const storage = readSource("src/lib/concierge/event-storage.ts");
  const sql = readSource("prisma/manual_sql/20260430_add_event_assets_conversations.sql");

  assert.match(source, /export const runtime = "nodejs"/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(source, /handleCreationIntake/);
  assert.match(intake, /upsertCreationSession/);
  assert.match(intake, /const shouldPersistSession =/);
  assert.match(intake, /draft\.canPersist \|\| draft\.requestedOutputs\.length > 0/);
  assert.match(storage, /create table if not exists creation_sessions/);
  assert.match(storage, /idx_creation_sessions_user_updated/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS creation_sessions/);
});
