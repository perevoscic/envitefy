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
  assert.match(client, /label: "Live Card"/);
  assert.match(client, /label: "Details"/);
  assert.match(client, /label: "Assets"/);
  assert.match(client, /label: "Guests"/);
  assert.match(client, /label: "Assistant"/);
  assert.match(client, /useState<WorkspaceTab>\("live-card"\)/);
  assert.match(client, /role="tablist"/);
  assert.match(client, /aria-selected=\{activeTab === tab\.key\}/);
  assert.match(client, /fetch\(`\/api\/concierge\/events\/\$\{eventId\}\/message`/);
  assert.match(client, /fetch\(`\/api\/events\/\$\{eventId\}\/assets\/\$\{assetId\}`/);
});

test("saved concierge drafts stay in chat with a generated workspace preview", () => {
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");
  const preview = readSource("src/app/chat/ChatProductPreview.tsx");
  const chatSurface = `${client}\n${preview}`;

  assert.match(client, /generateProductForDraft/);
  assert.match(client, /setLiveCardEventId\(savedEventId\)/);
  assert.doesNotMatch(chatSurface, /Event Workspace/);
  assert.match(chatSurface, /Create preview/);
  assert.match(chatSurface, /View product/);
  assert.doesNotMatch(chatSurface, /Open workspace/);
  assert.doesNotMatch(client, /router\.push\(`\/events\/\$\{savedEventId\}\/workspace`\)/);
  assert.doesNotMatch(client, /Opening your event workspace\./);
});
