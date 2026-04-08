import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedStudioReferenceImageUrl } from "./reference-image-url.ts";

test("allows Vercel Blob public host and same app host", () => {
  assert.equal(
    isAllowedStudioReferenceImageUrl(
      "https://abc.public.blob.vercel-storage.com/invite/x.webp",
    ),
    true,
  );
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://envitefy.com";
  assert.equal(isAllowedStudioReferenceImageUrl("https://envitefy.com/media/x.webp"), true);
  process.env.NEXT_PUBLIC_APP_URL = prev;
});

test("rejects unknown hosts and non-http(s)", () => {
  assert.equal(isAllowedStudioReferenceImageUrl("https://evil.example.com/file.webp"), false);
  assert.equal(isAllowedStudioReferenceImageUrl("ftp://x.com/a"), false);
  assert.equal(isAllowedStudioReferenceImageUrl(""), false);
});
