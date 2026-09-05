import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  parseStudioByteRange,
  resolveLocalStudioAsset,
  safeStudioAssetName,
  studioAssetResponse,
  studioStoragePath,
} from "./assets.ts";
import type { StudioAsset } from "./types.ts";

const id = "10000000-0000-4000-8000-000000000001";
const asset: StudioAsset = {
  id,
  conversationId: id,
  versionId: null,
  name: "My creation.mp4",
  mimeType: "video/mp4",
  size: 10,
  url: `/api/admin/marketing-studio/assets/${id}`,
};

test("video previews support closed, open-ended, and suffix ranges", () => {
  assert.deepEqual(parseStudioByteRange("bytes=2-4", 10), { start: 2, end: 4 });
  assert.deepEqual(parseStudioByteRange("bytes=7-", 10), { start: 7, end: 9 });
  assert.deepEqual(parseStudioByteRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(parseStudioByteRange("bytes=8-999", 10), { start: 8, end: 9 });
  assert.deepEqual(parseStudioByteRange("bytes=-99", 10), { start: 0, end: 9 });
  assert.equal(parseStudioByteRange(null, 10), null);
  for (const value of [
    "bytes=10-",
    "bytes=5-2",
    "bytes=-0",
    "bytes=-",
    "bytes=0-1,5-7",
    "words=1-2",
    "bytes=9007199254740992-",
  ]) {
    assert.throws(() => parseStudioByteRange(value, 10), /range is not available/);
  }
});

test("media responses return correct seek bytes, headers, downloads and 416 lengths", async () => {
  const bytes = Buffer.from("0123456789");
  const partial = studioAssetResponse(asset, bytes, "bytes=2-4", false);
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), "bytes 2-4/10");
  assert.equal(partial.headers.get("content-length"), "3");
  assert.equal(await partial.text(), "234");
  const full = studioAssetResponse(asset, bytes, null, true);
  assert.equal(full.status, 200);
  assert.match(full.headers.get("content-disposition") || "", /^attachment;.*My%20creation\.mp4/);
  assert.equal(full.headers.get("cache-control"), "private, no-store");
  const punctuated = studioAssetResponse(
    { ...asset, name: "Sam's (party).mp4" },
    bytes,
    null,
    true,
  );
  assert.equal(
    punctuated.headers.get("content-disposition"),
    "attachment; filename*=UTF-8''Sam%27s%20%28party%29.mp4",
  );
  const rejected = studioAssetResponse(asset, bytes, "bytes=40-", false);
  assert.equal(rejected.status, 416);
  assert.equal(rejected.headers.get("content-range"), "bytes */10");
});

test("immutable asset paths cannot escape local storage and filenames cannot inject headers", () => {
  const storagePath = studioStoragePath(id, id, "video/mp4");
  const root = path.resolve("workspace-test");
  assert.equal(
    resolveLocalStudioAsset(storagePath, root),
    path.join(root, "qa-artifacts", "admin-marketing-studio", id, `${id}.mp4`),
  );
  assert.throws(
    () => resolveLocalStudioAsset("../../secrets.txt", root),
    /Invalid media storage path/,
  );
  assert.throws(() => studioStoragePath(id, "../secret", "image/png"), /Invalid asset ID/);
  assert.throws(() => studioStoragePath(id, id, "text/html"), /Unsupported media type/);
  assert.equal(safeStudioAssetName("folder\\nested/hello\r\n.png"), "hello.png");
});
