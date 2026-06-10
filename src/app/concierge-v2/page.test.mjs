import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const clientPath = new URL("./ConciergeV2Client.tsx", import.meta.url);

test("Concierge V2 uses a chat-first premium creation shell", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /type ChatMessage =/);
  assert.match(client, /WELCOME_MESSAGE/);
  assert.match(client, /role="log"/);
  assert.match(client, /data-testid="concierge-v2-event-brief"/);
  assert.match(client, /data-testid="concierge-v2-review-draft"/);
  assert.match(client, /data-testid="concierge-v2-create-event-page"/);
  assert.match(client, /Reading the brief and building the event workspace/);
  assert.match(client, /Publishing the event page and connecting the operating tools/);
  assert.match(client, /Retry brief/);
  assert.match(client, /type RetryRequest =/);
  assert.match(client, /retryLastRequest/);
  assert.match(client, /readJsonPayload/);
  assert.match(client, /handleSelectedUpload/);
  assert.match(client, /validateClientUploadFile\(file, "attachment"\)/);
  assert.match(client, /runSnapOcrUpload\(\{ file, scanAttemptId \}\)/);
  assert.match(client, /sourceKind: "upload"/);
  assert.match(client, /failedUpload/);
  assert.match(client, /Retry file/);
});

test("Concierge V2 chat shell keeps the existing V2 session endpoints and owner links", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /fetch\("\/api\/concierge\/sessions",\s*\{[\s\S]*method: "GET"/);
  assert.match(client, /resumeSession/);
  assert.match(client, /messagesFromSession/);
  assert.match(client, /fetch\("\/api\/concierge\/sessions"/);
  assert.match(client, /fetch\(`\/api\/concierge\/sessions\/\$\{encodeURIComponent\(sessionId\)\}`/);
  assert.match(client, /\/api\/concierge\/sessions\/\$\{session\.id\}\/apply/);
  assert.match(client, /sessionTitle/);
  assert.match(client, /\/hub/);
  assert.match(client, /\/resources/);
  assert.match(client, /\/imports/);
  assert.match(client, /\/rsvp/);
  assert.match(client, /\/ops/);
  assert.match(client, /\/schedule/);
  assert.match(client, /\/calendar/);
});

test("Concierge V2 preserves draft context for conversational refinements", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /buildRefinementBrief/);
  assert.match(client, /Current draft JSON/);
  assert.match(client, /Latest user correction/);
  assert.match(client, /Updating the draft with that detail/);
  assert.match(client, /askForMissingField/);
});
