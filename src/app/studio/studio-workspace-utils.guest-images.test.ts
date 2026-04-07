import assert from "node:assert/strict";
import test from "node:test";

import { STUDIO_GUEST_IMAGE_URL_MAX, sanitizeGuestImageUrls } from "./studio-workspace-utils.ts";

test("sanitizeGuestImageUrls dedupes trims caps and skips non-strings", () => {
  const out = sanitizeGuestImageUrls([
    " https://a.com/1 ",
    "https://a.com/1",
    "https://b.com/2",
    123 as unknown as string,
    "",
    ...Array.from({ length: 10 }, (_, i) => `https://x.test/${i}.png`),
  ]);
  assert.equal(out.length, STUDIO_GUEST_IMAGE_URL_MAX);
  assert.deepEqual(out[0], "https://a.com/1");
  assert.deepEqual(out[1], "https://b.com/2");
  assert.ok(out.every((u) => u.startsWith("https://")));
});

test("sanitizeGuestImageUrls returns empty for non-array", () => {
  assert.deepEqual(sanitizeGuestImageUrls(null), []);
  assert.deepEqual(sanitizeGuestImageUrls("x"), []);
});
