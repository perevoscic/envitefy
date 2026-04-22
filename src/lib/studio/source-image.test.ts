import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { resolveStudioSourceImage, studioSourceImageDeps } from "./source-image.ts";

function blobResult(bytes: Buffer, mimeType: string) {
  return {
    statusCode: 200,
    stream: new Response(bytes).body,
    headers: new Headers({ "content-type": mimeType }),
  };
}

test.afterEach(() => {
  mock.restoreAll();
});

test("resolveStudioSourceImage returns inline image bytes from a data url", async () => {
  const result = await resolveStudioSourceImage("data:image/png;base64,SGVsbG8=");

  assert.deepEqual(result, {
    mimeType: "image/png",
    data: "SGVsbG8=",
  });
});

test("resolveStudioSourceImage loads relative app blob proxy urls directly from Vercel Blob", async () => {
  const bytes = Buffer.from("blob-image");
  const getMock = mock.method(studioSourceImageDeps, "getBlob", async (pathname: string) => {
    assert.equal(pathname, "event-media/upload-123/header/display.webp");
    return blobResult(bytes, "image/webp");
  });
  const fetchMock = mock.method(studioSourceImageDeps, "fetchRemote", async () => {
    throw new Error("fetch should not be called for blob proxy urls");
  });

  const result = await resolveStudioSourceImage("/api/blob/event-media/upload-123/header/display.webp");

  assert.deepEqual(result, {
    mimeType: "image/webp",
    data: bytes.toString("base64"),
  });
  assert.equal(getMock.mock.calls.length, 1);
  assert.equal(fetchMock.mock.calls.length, 0);
});

test("resolveStudioSourceImage loads absolute same-site blob proxy urls directly from Vercel Blob", async () => {
  const bytes = Buffer.from("same-site-blob-image");
  const getMock = mock.method(studioSourceImageDeps, "getBlob", async (pathname: string) => {
    assert.equal(pathname, "event-media/upload-abc/header/display.webp");
    return blobResult(bytes, "image/png");
  });
  const fetchMock = mock.method(studioSourceImageDeps, "fetchRemote", async () => {
    throw new Error("fetch should not be called for blob proxy urls");
  });

  const result = await resolveStudioSourceImage(
    "https://envitefy.com/api/blob/event-media/upload-abc/header/display.webp",
  );

  assert.deepEqual(result, {
    mimeType: "image/png",
    data: bytes.toString("base64"),
  });
  assert.equal(getMock.mock.calls.length, 1);
  assert.equal(fetchMock.mock.calls.length, 0);
});

test("resolveStudioSourceImage fetches remote public image urls", async () => {
  const bytes = Buffer.from("remote-image");
  const fetchMock = mock.method(studioSourceImageDeps, "fetchRemote", async (url: string) => {
    assert.equal(url, "https://cdn.example.com/invite.png");
    return new Response(bytes, {
      status: 200,
      headers: { "content-type": "image/png; charset=utf-8" },
    });
  });
  const getMock = mock.method(studioSourceImageDeps, "getBlob", async () => {
    throw new Error("blob get should not be called for remote urls");
  });

  const result = await resolveStudioSourceImage("https://cdn.example.com/invite.png");

  assert.deepEqual(result, {
    mimeType: "image/png",
    data: bytes.toString("base64"),
  });
  assert.equal(fetchMock.mock.calls.length, 1);
  assert.equal(getMock.mock.calls.length, 0);
});

test("resolveStudioSourceImage rejects blob proxy content when the blob is not an image", async () => {
  const warnMock = mock.method(console, "warn", () => {});
  mock.method(studioSourceImageDeps, "getBlob", async () =>
    blobResult(Buffer.from("pdf-bytes"), "application/pdf"),
  );

  const result = await resolveStudioSourceImage("/api/blob/event-media/upload-123/attachment/source.pdf");

  assert.equal(result, null);
  const details = warnMock.mock.calls[0]?.arguments[1] as Record<string, unknown>;
  assert.equal(details?.sourceKind, "blob_proxy");
  assert.equal(details?.pathname, "event-media/upload-123/attachment/source.pdf");
  assert.equal(details?.reason, "non_image_content_type");
});

test("resolveStudioSourceImage returns null for missing blobs and failed remote fetches", async (t) => {
  await t.test("missing blob", async () => {
    const warnMock = mock.method(console, "warn", () => {});
    mock.method(studioSourceImageDeps, "getBlob", async () => ({
      statusCode: 404,
      stream: null,
      headers: new Headers(),
    }));

    const result = await resolveStudioSourceImage("/api/blob/event-media/upload-missing/header/display.webp");

    assert.equal(result, null);
    const details = warnMock.mock.calls[0]?.arguments[1] as Record<string, unknown>;
    assert.equal(details?.sourceKind, "blob_proxy");
    assert.equal(details?.pathname, "event-media/upload-missing/header/display.webp");
    assert.equal(details?.reason, "blob_not_found");
  });

  mock.restoreAll();

  await t.test("failed remote fetch", async () => {
    const warnMock = mock.method(console, "warn", () => {});
    mock.method(studioSourceImageDeps, "fetchRemote", async () => {
      throw new Error("socket hang up");
    });

    const result = await resolveStudioSourceImage("https://cdn.example.com/invite.png");

    assert.equal(result, null);
    const details = warnMock.mock.calls[0]?.arguments[1] as Record<string, unknown>;
    assert.equal(details?.sourceKind, "remote_url");
    assert.equal(details?.host, "cdn.example.com");
    assert.equal(details?.error, "socket hang up");
  });
});

test("resolveStudioSourceImage returns null for unsupported values", async (t) => {
  await t.test("browser blob url", async () => {
    const warnMock = mock.method(console, "warn", () => {});

    const result = await resolveStudioSourceImage("blob:https://envitefy.com/example");

    assert.equal(result, null);
    const details = warnMock.mock.calls[0]?.arguments[1] as Record<string, unknown>;
    assert.equal(details?.sourceKind, "unsupported");
    assert.equal(details?.reason, "browser_object_url");
  });

  mock.restoreAll();

  await t.test("empty value", async () => {
    const warnMock = mock.method(console, "warn", () => {});

    const result = await resolveStudioSourceImage("");

    assert.equal(result, null);
    const details = warnMock.mock.calls[0]?.arguments[1] as Record<string, unknown>;
    assert.equal(details?.sourceKind, "unsupported");
    assert.equal(details?.reason, "empty");
  });
});
