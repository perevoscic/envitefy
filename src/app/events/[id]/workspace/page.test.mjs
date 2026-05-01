import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("event workspace is owner-only and exposes assistant plus assets tabs", () => {
  const page = readSource("src/app/events/[id]/workspace/page.tsx");
  const client = readSource("src/app/events/[id]/workspace/EventWorkspaceClient.tsx");

  assert.match(page, /resolveSessionUserId\(session\)/);
  assert.match(page, /event\.user_id !== userId/);
  assert.match(page, /notFound\(\)/);
  assert.match(client, /label: "Assistant"/);
  assert.match(client, /label: "Assets"/);
  assert.match(client, /fetch\(`\/api\/concierge\/events\/\$\{eventId\}\/message`/);
  assert.match(client, /fetch\(`\/api\/events\/\$\{eventId\}\/assets\/\$\{assetId\}`/);
});

test("saved concierge drafts route users into the event workspace", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(client, /router\.push\(`\/events\/\$\{savedEventId\}\/workspace`\)/);
  assert.match(client, /Open workspace/);
});
