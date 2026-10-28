const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { readArtworkJobResponse, ArtworkConnectionError, waitForArtworkPoll } = loadTs("src/lib/livecard-job-client.ts");
test("HTML and transient failures become reconnectable errors without exposing response bodies", async () => {
  for (const response of [new Response("<!DOCTYPE html><html>Proxy error</html>"), new Response("<html>Timeout</html>", { status: 502 }), Response.json({ job: { state: "ready" } })]) {
    await assert.rejects(readArtworkJobResponse(response), error => error instanceof ArtworkConnectionError && error.retryable && !/token|DOCTYPE|Proxy error/.test(error.message));
  }
  const job = { id: "same-job", state: "ready", stage: "ready" };
  assert.deepEqual(await readArtworkJobResponse(Response.json({ job })), job);
});
test("authentication and missing jobs require explicit recovery, with no automatic request replay", async () => {
  for (const status of [401, 403, 404]) await assert.rejects(readArtworkJobResponse(new Response("<html>Sign in</html>", { status })), error => error instanceof ArtworkConnectionError && !error.retryable);
});
test("cancellation interrupts the reconnect delay immediately", async () => {
  const controller = new AbortController();
  const waiting = waitForArtworkPoll(15000, controller.signal);
  controller.abort();
  await assert.rejects(waiting, { name: "AbortError" });
});
