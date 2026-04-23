import assert from "node:assert/strict";
import test from "node:test";

import {
  isLoopbackHost,
  resolveAbsoluteUrlOrigin,
  rewriteLoopbackUrlToRelativePath,
  sanitizePersistedMediaUrl,
} from "./absolute-url.ts";

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

test("rewriteLoopbackUrlToRelativePath strips loopback origin and keeps path + query", () => {
  assert.equal(
    rewriteLoopbackUrlToRelativePath("http://localhost:3000/api/blob/event-media/foo.webp?v=1"),
    "/api/blob/event-media/foo.webp?v=1",
  );
  assert.equal(
    rewriteLoopbackUrlToRelativePath("http://127.0.0.1:3000/api/blob/x"),
    "/api/blob/x",
  );
});

test("rewriteLoopbackUrlToRelativePath returns null for non-loopback and non-URL values", () => {
  assert.equal(rewriteLoopbackUrlToRelativePath(""), null);
  assert.equal(rewriteLoopbackUrlToRelativePath(null), null);
  assert.equal(rewriteLoopbackUrlToRelativePath("/api/blob/x"), null);
  assert.equal(
    rewriteLoopbackUrlToRelativePath("data:image/png;base64,AAAA"),
    null,
  );
  assert.equal(
    rewriteLoopbackUrlToRelativePath("https://prod.blob.vercel-storage.com/x.webp"),
    null,
  );
});

test("sanitizePersistedMediaUrl rewrites loopback URLs and passes everything else through", () => {
  assert.equal(
    sanitizePersistedMediaUrl("http://localhost:3000/api/blob/event-media/foo.webp"),
    "/api/blob/event-media/foo.webp",
  );
  assert.equal(
    sanitizePersistedMediaUrl("https://abc.public.blob.vercel-storage.com/foo.webp"),
    "https://abc.public.blob.vercel-storage.com/foo.webp",
  );
  assert.equal(
    sanitizePersistedMediaUrl("/api/events/123/thumbnail?variant=attachment"),
    "/api/events/123/thumbnail?variant=attachment",
  );
  assert.equal(
    sanitizePersistedMediaUrl("data:image/png;base64,AAAA"),
    "data:image/png;base64,AAAA",
  );
  assert.equal(sanitizePersistedMediaUrl(null), null);
  assert.equal(sanitizePersistedMediaUrl("   "), null);
});
