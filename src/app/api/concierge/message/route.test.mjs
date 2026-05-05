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
  assert.match(intake, /normalizeChatMessages/);
  assert.match(intake, /chatMessagesMetadata\(chatMessagesForUpsert\)/);
  assert.match(storage, /create table if not exists creation_sessions/);
  assert.match(storage, /idx_creation_sessions_user_updated/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS creation_sessions/);
});

test("creation intake resume reads the signed-in user's latest session only", () => {
  const source = readSource("src/app/api/creation/intake/route.ts");
  const intake = readSource("src/lib/concierge/intake.ts");
  const storage = readSource("src/lib/concierge/event-storage.ts");
  const types = readSource("src/lib/concierge/types.ts");

  assert.match(source, /export async function GET\(req: Request\)/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(source, /resumeLatestCreationSession/);
  assert.match(source, /status: 401/);
  assert.doesNotMatch(source, /body\.user_id/);
  assert.doesNotMatch(source, /body\.userId/);

  assert.match(intake, /getLatestCreationSession\(\{ userId: params\.userId \}\)/);
  assert.match(intake, /getSavedEventId\(creationSession\)/);
  assert.match(intake, /chatMessagesFromSession\(creationSession\)/);
  assert.match(intake, /savedEventId \? false : canSaveConciergeDraft\(draft\)/);
  assert.match(types, /CreationSessionResumeResponse/);
  assert.match(types, /CreationChatMessageSnapshot/);
  assert.match(types, /chatMessages\?: CreationChatMessageSnapshot\[\]/);

  assert.match(storage, /export async function getLatestCreationSession/);
  assert.match(storage, /where user_id = \$1/);
  assert.match(storage, /and status not in \('published', 'publishing'\)/);
  assert.match(storage, /and not \(metadata \? 'savedEventId'\)/);
  assert.match(storage, /order by updated_at desc, created_at desc/);
  assert.match(storage, /limit 1/);
});

test("saved creation sessions keep workspace continuation scoped to the owner", () => {
  const intake = readSource("src/lib/concierge/intake.ts");
  const storage = readSource("src/lib/concierge/event-storage.ts");

  assert.match(intake, /markCreationSessionSaved/);
  assert.match(intake, /claimCreationSessionSave/);
  assert.match(intake, /This workspace is already being created/);
  assert.match(intake, /draftStatus: "published"/);
  assert.match(intake, /savedEventId: saved\.eventId/);
  assert.match(intake, /metadata: chatMessagesMetadata\(saveChatMessages\)/);
  assert.match(storage, /export async function claimCreationSessionSave/);
  assert.match(storage, /status = 'publishing'/);
  assert.match(storage, /status not in \('published', 'publishing'\)/);
  assert.match(storage, /export async function markCreationSessionSaved/);
  assert.match(storage, /where id = \$1 and user_id = \$2/);
  assert.match(storage, /metadata = metadata \|\| \$4::jsonb/);
  assert.match(storage, /metadata\?: Record<string, unknown>/);
  assert.match(storage, /savedEventId: params\.eventId/);
});

test("concierge creation routes expose optional timing payloads and Server-Timing headers", () => {
  for (const routePath of [
    "src/app/api/concierge/message/route.ts",
    "src/app/api/creation/intake/route.ts",
  ]) {
    const source = readSource(routePath);

    assert.match(source, /createServerTimingTracker\(isTimingRequested\(req\)\)/);
    assert.match(source, /timing\.time\("session"/);
    assert.match(source, /timing\.time\("user_lookup"/);
    assert.match(source, /timing\.time\("body_parse"/);
    assert.match(source, /timing,/);
    assert.match(source, /timings: timing\.toObject\(\)/);
    assert.match(source, /timing\.applyHeader\(response\)/);
    assert.match(
      source,
      /timing\.enabled \? \{ \.\.\.payload, timings: timing\.toObject\(\) \} : payload/,
    );
  }

  const types = readSource("src/lib/concierge/types.ts");
  assert.match(types, /timings\?: Record<string, unknown>/);
});

test("creation intake times model extraction and DB writes inside the handler", () => {
  const source = readSource("src/lib/concierge/intake.ts");

  assert.match(source, /timing\?: TimingRecorder/);
  assert.match(source, /time\("model_extraction"/);
  assert.match(source, /time\("db_write"/);
});

test("creation threads list and resume authenticated user sessions only", () => {
  const route = readSource("src/app/api/creation/threads/route.ts");
  const deleteRoute = readSource("src/app/api/creation/threads/[id]/route.ts");
  const intakeRoute = readSource("src/app/api/creation/intake/route.ts");
  const intake = readSource("src/lib/concierge/intake.ts");
  const storage = readSource("src/lib/concierge/event-storage.ts");
  const types = readSource("src/lib/concierge/types.ts");

  assert.match(route, /resolveSessionUserId\(session\)/);
  assert.match(route, /listCreationSessions/);
  assert.match(route, /threads: threads\.map\(toThreadSummary\)/);
  assert.match(deleteRoute, /export async function DELETE/);
  assert.match(deleteRoute, /resolveSessionUserId\(session\)/);
  assert.match(deleteRoute, /deleteCreationSession/);
  assert.match(storage, /export async function listCreationSessions/);
  assert.match(storage, /export async function deleteCreationSession/);
  assert.match(storage, /where user_id = \$1/);
  assert.match(storage, /where id = \$1 and user_id = \$2/);
  assert.match(intakeRoute, /url\.searchParams\.get\("threadId"\)/);
  assert.match(intakeRoute, /resumeCreationSession/);
  assert.match(intake, /export async function resumeCreationSession/);
  assert.match(
    intake,
    /getCreationSession\(\{ userId: params\.userId, sessionId: params\.sessionId \}\)/,
  );
  assert.match(types, /export type CreationThreadSummary =/);
  assert.match(types, /export type CreationThreadsResponse =/);
});
