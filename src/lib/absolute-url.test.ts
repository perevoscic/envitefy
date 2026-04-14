import assert from "node:assert/strict";
import test from "node:test";

import { isLoopbackHost, resolveAbsoluteUrlOrigin } from "./absolute-url.ts";

test("isLoopbackHost recognizes loopback hosts with or without protocol", () => {
  assert.equal(isLoopbackHost("localhost:3000"), true);
  assert.equal(isLoopbackHost("http://127.0.0.1:3000"), true);
  assert.equal(isLoopbackHost("https://envitefy.com"), false);
});

test("resolveAbsoluteUrlOrigin prefers configured public fallback over loopback forwarded host", () => {
  const origin = resolveAbsoluteUrlOrigin({
    headerHost: "localhost:3000",
    headerProto: "http",
    fallbackHost: "envitefy.com",
    fallbackProto: "https",
  });

  assert.deepEqual(origin, {
    host: "envitefy.com",
    proto: "https",
  });
});

test("resolveAbsoluteUrlOrigin keeps loopback host in local development", () => {
  const origin = resolveAbsoluteUrlOrigin({
    headerHost: "localhost:3000",
    headerProto: "http",
    fallbackHost: "localhost:3000",
    fallbackProto: "http",
  });

  assert.deepEqual(origin, {
    host: "localhost:3000",
    proto: "http",
  });
});
