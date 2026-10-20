import assert from "node:assert/strict";
import test from "node:test";
import loadTs from "../../../../scripts/lib/event-messages-test-loader.cjs";

test("public event artwork streams from storage while the database is unavailable", async () => {
  const calls = [];
  const route = loadTs("src/app/media/[...path]/route.ts", {
    "@/lib/db": { query() { throw Error("EMAXCONNSESSION"); } },
    "@vercel/blob": { async get(pathname, options) {
      calls.push({ pathname, options });
      return { statusCode: 200, stream: new Uint8Array([82, 73, 70, 70]), headers: new Headers({ "content-type": "image/webp", "content-length": "4" }) };
    } },
  });
  const response = await route.GET(new Request("https://envitefy.com/media/event-media/meet/theme.webp"), { params: Promise.resolve({ path: ["event-media", "meet", "theme.webp"] }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.match(response.headers.get("cache-control"), /public.*immutable/);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [82, 73, 70, 70]);
  assert.deepEqual(calls, [{ pathname: "event-media/meet/theme.webp", options: { access: "private" } }]);
  assert.equal((await route.GET(null, { params: Promise.resolve({ path: ["private-scan-originals", "source.bin"] }) })).status, 404);
  assert.equal(calls.length, 1);
});
