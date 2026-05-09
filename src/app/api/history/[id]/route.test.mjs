import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("history item GET protects raw rows and exposes only sanitized public rows", () => {
  const source = readSource("src/app/api/history/[id]/route.ts");

  assert.match(source, /const session: any = await getServerSession\(authOptions as any\)/);
  assert.match(source, /const userId = await resolveSessionUserId\(session\)/);
  assert.match(source, /if \(userId && row\.user_id === userId\)/);
  assert.match(source, /const publicRequested =/);
  assert.match(source, /url\.searchParams\.get\("public"\) === "1"/);
  assert.match(
    source,
    /return NextResponse\.json\(\s*\{ error: userId \? "Forbidden" : "Unauthorized" \}/,
  );
  assert.match(source, /getEventHistoryPublicRenderById\(id\)/);
  assert.match(source, /sanitizeHistoryPublicData/);
  assert.match(source, /passcodeHash: undefined/);
  assert.match(source, /passcodePlain: undefined/);
  assert.match(source, /delete redacted\.conciergeDraft/);
  assert.match(source, /verifyEventAccessCookieValue/);
});

test("history item mutations invalidate owner and shared recipient caches", () => {
  const source = readSource("src/app/api/history/[id]/route.ts");

  assert.match(source, /async function invalidateSharedHistoryViewers\(eventId: string\)/);
  assert.match(source, /listShareRecipientUserIdsForEvent\(eventId\)/);
  assert.match(source, /invalidateHistoryAndDashboardForUser\(recipientUserId\)/);
  assert.match(source, /await invalidateSharedHistoryViewers\(id\)/);
});
