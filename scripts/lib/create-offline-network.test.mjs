import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import test from "node:test";
import "./create-offline-network.mjs";

test("the offline runner blocks real external fetch and HTTP transports before sending", () => {
  for (const request of [
    () => fetch("https://api.openai.com/v1/responses"),
    () => https.request(new URL("https://example.com/provider")),
    () => https.get({ hostname: "api.openai.com", path: "/v1/images/generations" }),
    () => http.get("http://example.com/"),
  ]) assert.throws(request, /Offline Create tests blocked/);
});

test("isolated loopback fixtures remain usable with the offline network guard", async () => {
  const server = http.createServer((_request, response) => response.end("offline fixture"));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await response.text(), "offline fixture");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
