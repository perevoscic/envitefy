import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("update-theme requires event ownership and invalidates owner and recipient caches", () => {
  const source = readSource("src/app/api/events/[id]/update-theme/route.ts");

  assert.match(source, /getServerSession\(authOptions as any\)/);
  assert.match(source, /resolveSessionUserId\(session\)/);
  assert.match(
    source,
    /return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/,
  );
  assert.match(source, /existing\.user_id !== userId/);
  assert.match(source, /return NextResponse\.json\(\{ error: "Forbidden" \}, \{ status: 403 \}\)/);
  assert.match(source, /invalidateUserHistory\(userId\)/);
  assert.match(source, /invalidateUserDashboard\(userId\)/);
  assert.match(source, /listShareRecipientUserIdsForEvent\(awaitedParams\.id\)/);
  assert.match(source, /for \(const recipientUserId of recipientUserIds\)/);
  assert.match(source, /invalidateUserHistory\(recipientUserId\)/);
  assert.match(source, /invalidateUserDashboard\(recipientUserId\)/);
});
