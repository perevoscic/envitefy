import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event asset APIs enforce owner access and never accept body ownership", () => {
  const collectionRoute = readSource("src/app/api/events/[id]/assets/route.ts");
  const itemRoute = readSource("src/app/api/events/[id]/assets/[assetId]/route.ts");

  for (const source of [collectionRoute, itemRoute]) {
    assert.match(source, /getServerSession\(authOptions as any\)/);
    assert.match(source, /resolveSessionUserId\(session\)/);
    assert.match(source, /getEventHistoryById\(eventId\)/);
    assert.match(source, /event\.user_id !== userId/);
    assert.doesNotMatch(source, /body\.user_id/);
    assert.doesNotMatch(source, /body\.userId/);
  }

  assert.match(collectionRoute, /createEventAsset\(\{/);
  assert.match(collectionRoute, /userId: owned\.userId/);
  assert.match(itemRoute, /updateEventAsset\(\{/);
  assert.match(itemRoute, /deleteEventAsset\(\{/);
});
