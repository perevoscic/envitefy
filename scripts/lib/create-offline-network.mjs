import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";

// Loaded only by the offline regression command. Test doubles can still replace
// fetch; real requests are limited to isolated loopback fixture servers.
function assertLoopback(input) {
  const host = typeof input === "string" || input instanceof URL
    ? new URL(input).hostname
    : input?.url ? new URL(input.url).hostname : input?.hostname || input?.host || "localhost";
  if (!/^(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::\d+)?$/i.test(host)) {
    throw new Error("Offline Create tests blocked an external network request.");
  }
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  assertLoopback(input);
  return originalFetch(input, options);
};
for (const transport of [http, https]) {
  for (const method of ["request", "get"]) {
    const original = transport[method];
    transport[method] = function (input, ...args) {
      assertLoopback(input);
      return original.call(this, input, ...args);
    };
  }
}
syncBuiltinESMExports();
