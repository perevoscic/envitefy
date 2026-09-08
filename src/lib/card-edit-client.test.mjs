import assert from "node:assert/strict";
import test from "node:test";
import { requestCardEdit } from "./card-edit-client.ts";
import { streamCardEditPreview } from "./studio/card-edit-preview.ts";

const request = { action: "preview", fields: { theme: "Add forgotten island movie theme to it" } };

test("theme preview reads streamed JSON without retrying image generation", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/events/event%2Fid/card/edit");
    assert.equal(options.credentials, "include");
    assert.deepEqual(JSON.parse(options.body), request);
    return streamCardEditPreview(async () => Response.json({ ok: true, imageDataUrl: "preview" }));
  });
  assert.equal((await requestCardEdit("event/id", request)).imageDataUrl, "preview");
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("HTTP 200 stream errors never enable Save", async (t) => {
  t.mock.method(globalThis, "fetch", async () => streamCardEditPreview(async () => Response.json({ error: "Image service busy" }, { status: 503 })));
  await assert.rejects(requestCardEdit("id", request), /Image service busy/);
});

test("lost mobile connections have a recovery message and are not retried automatically", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(requestCardEdit("id", request), /Your changes are still here.*try Preview again/);
  await assert.rejects(requestCardEdit("id", { ...request, action: "save" }), /Your preview is still here.*try Save again/);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("truncated streamed JSON offers recovery instead of a parse error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response('\n\n{"ok":'));
  await assert.rejects(requestCardEdit("id", request), /connection was interrupted/);
});

test("non-JSON gateway, authorization and payload errors are readable", async (t) => {
  for (const [status, message] of [[504, /connection was interrupted/], [401, /sign in again/], [413, /too large/]]) {
    const mock = t.mock.method(globalThis, "fetch", async () => new Response("<html>Error</html>", { status }));
    await assert.rejects(requestCardEdit("id", request), message);
    mock.mock.restore();
  }
});
