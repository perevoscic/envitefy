import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedStudioReferenceImageUrl,
  resolveStudioReferenceImageUrl,
  resolveStudioReferenceImages,
} from "./reference-image-url.ts";

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
  if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = prev;
});

test("saved media paths resolve against the app and load through its media proxy", async (t) => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://envitefy.com";
  t.after(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });
  const path = "/api/blob/event-media/saved-card/header/display.webp";
  const bytes = Buffer.from("saved artwork");
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return new Response(bytes, { headers: { "content-type": "image/webp" } });
  });
  assert.deepEqual(await resolveStudioReferenceImages([path]), [
    { mimeType: "image/webp", data: bytes.toString("base64") },
  ]);
  assert.deepEqual(requests, [{ url: `https://envitefy.com${path}`, options: { redirect: "manual" } }]);
  for (const invalid of [
    "//evil.example/image.webp", "/\\evil.example/image.webp",
    "https://envitefy.com.evil.example/image.webp", "https://envitefy.com:8080/image.webp",
    "https://user:password@envitefy.com/image.webp", "https://169.254.169.254/image.webp",
  ]) {
    assert.equal(resolveStudioReferenceImageUrl(invalid), null, invalid);
    assert.deepEqual(await resolveStudioReferenceImages([invalid]), []);
  }
  assert.equal(requests.length, 1, "untrusted references never fetch");
});

test("media failures remain retryable and non-images cannot become artwork", async (t) => {
  const url = "https://abc.public.blob.vercel-storage.com/invite/x.webp";
  let response = new Response("Not found", { status: 404 });
  t.mock.method(globalThis, "fetch", async () => response);
  assert.deepEqual(await resolveStudioReferenceImages([url]), []);
  response = new Response("Login", { headers: { "content-type": "text/html" } });
  assert.deepEqual(await resolveStudioReferenceImages([url]), []);
  response = new Response("image bytes", { headers: { "content-type": "image/webp" } });
  assert.equal((await resolveStudioReferenceImages([url])).length, 1);
});

test("trusted image redirects work while untrusted redirects and loops stop", async (t) => {
  const url = "https://abc.public.blob.vercel-storage.com/invite/x.webp";
  let destination = "/invite/current.webp";
  const requests = [];
  t.mock.method(globalThis, "fetch", async (target) => {
    requests.push(target);
    return target.endsWith("/current.webp")
      ? new Response("artwork", { headers: { "content-type": "image/webp" } })
      : new Response(null, { status: 307, headers: { location: destination } });
  });
  assert.equal((await resolveStudioReferenceImages([url])).length, 1);
  assert.equal(requests.length, 2);
  requests.length = 0;
  destination = "https://169.254.169.254/image.webp";
  assert.deepEqual(await resolveStudioReferenceImages([url]), []);
  assert.deepEqual(requests, [url], "redirect targets must pass the same allowlist before fetching");
  requests.length = 0;
  destination = url;
  assert.deepEqual(await resolveStudioReferenceImages([url]), []);
  assert.equal(requests.length, 4, "redirect loops are bounded");
});

test("rejects unknown hosts and non-http(s)", () => {
  assert.equal(isAllowedStudioReferenceImageUrl("https://evil.example.com/file.webp"), false);
  assert.equal(isAllowedStudioReferenceImageUrl("ftp://x.com/a"), false);
  assert.equal(isAllowedStudioReferenceImageUrl(""), false);
});
