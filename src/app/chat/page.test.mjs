import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/chat is a signed-in concierge page, not an admin-only notFound page", () => {
  const page = readSource("src/app/chat/page.tsx");
  const client = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(page, /ConciergeChatClient/);
  assert.doesNotMatch(page, /isAdmin/);
  assert.doesNotMatch(page, /notFound\(/);
  assert.match(client, /What are we celebrating\?/);
  assert.match(client, /fetch\("\/api\/creation\/intake"/);
  assert.match(client, /const activeContext: ConciergeActiveContext =/);
  assert.match(client, /activeContext,/);
  assert.match(client, /"Thinking"/);
  assert.doesNotMatch(client, /Building draft/);
  assert.doesNotMatch(client, /activeContextForCandidate/);
  assert.doesNotMatch(client, /draft\.sourceContext\.candidates\?\.length/);
  assert.doesNotMatch(client, /fetch\("\/api\/history"/);
  assert.doesNotMatch(client, /buildConciergeHistoryPayload\(draft\)/);
  assert.doesNotMatch(client, /Still needed:/);
  assert.doesNotMatch(client, /draft\.missingFields\.slice\(0, 3\)\.map\(missingFieldLabel\)/);
  assert.doesNotMatch(client, /Keep adding details/);
  assert.doesNotMatch(client, /draft\.previewCopy\.headline/);
  assert.doesNotMatch(client, /rounded-2xl border border-\[#eee7ff\]/);
  assert.doesNotMatch(client, /canSave\s*\?\s*"Ready"\s*:\s*"Draft"/);
});
