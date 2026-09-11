import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createScanOriginalCache } from "./original-cache.ts";
import * as publicAssetUrl from "../public-asset-url.ts";

const require = createRequire(import.meta.url);

function harness({ fetchOriginal, getOriginal } = {}) {
  const uploads = [];
  const mocks = {
    "./original-cache": { scanOriginalCache: createScanOriginalCache() },
    "../public-asset-url": publicAssetUrl,
    "@vercel/blob": {
      get:
        getOriginal ||
        (async () => {
          throw new Error("not requested");
        }),
    },
    "../media-upload": {
      uploadPublicBinaryAsset: async (asset) => {
        uploads.push(asset);
        return {
          url: "https://test.public.blob.vercel-storage.com/private-scan-originals/test.bin",
        };
      },
    },
    "../upload-config": {
      validateUploadFileMeta: () => ({ ok: true, kind: "image", mimeType: "image/png" }),
    },
  };
  const compiled = ts.transpileModule(
    readFileSync(new URL("./private-original.ts", import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => mocks[name] || require(name),
    process: { env: { SCAN_ORIGINAL_ENCRYPTION_KEY: "test-only-key" } },
    Buffer,
    URL,
    Response,
    AbortSignal,
    fetch:
      fetchOriginal ||
      (() => {
        throw new Error("unexpected network request");
      }),
  });
  return { ...module.exports, uploads };
}

test("encrypted originals restore exact bytes only for their owner and reject tampering", () => {
  const h = harness();
  const original = Buffer.from("Original file bytes including DOB");
  const encrypted = h.encryptScanOriginal(original, "owner");
  assert.equal(encrypted.includes(original), false);
  assert.deepEqual(h.decryptScanOriginal(encrypted, "owner"), original);
  assert.throws(() => h.decryptScanOriginal(encrypted, "other"));
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => h.decryptScanOriginal(encrypted, "owner"));
});

test("repeated protected storage reads reuse the exact stored ciphertext", async () => {
  let reads = 0;
  let encrypted;
  const h = harness({
    getOriginal: async () => {
      reads++;
      return { statusCode: 200, stream: new Response(encrypted).body };
    },
  });
  encrypted = h.encryptScanOriginal(Buffer.from("exact medical original"), "owner");
  const first = await h.readScanOriginalBytes("/api/blob/private-scan-originals/sample.bin");
  const second = await h.readScanOriginalBytes("/api/blob/private-scan-originals/sample.bin");
  assert.equal(reads, 1);
  assert.deepEqual(first, encrypted);
  assert.deepEqual(second, encrypted);
  assert.equal(h.decryptScanOriginal(second, "owner").toString(), "exact medical original");
  assert.throws(() => h.decryptScanOriginal(second, "other"));
});

test("a replacement source URL loads its own bytes instead of the previous cached file", async () => {
  const reads = [];
  const h = harness({
    fetchOriginal: async (url) => {
      reads.push(url.pathname);
      return new Response(url.pathname);
    },
  });
  const base = "https://test.public.blob.vercel-storage.com/";
  assert.equal((await h.readScanOriginalBytes(`${base}old.png`)).toString(), "/old.png");
  assert.equal((await h.readScanOriginalBytes(`${base}old.png`)).toString(), "/old.png");
  assert.equal((await h.readScanOriginalBytes(`${base}new.png`)).toString(), "/new.png");
  assert.deepEqual(reads, ["/old.png", "/new.png"]);
});

test("legacy app proxy URLs read exact blob bytes and share the relative path cache", async () => {
  const reads = [];
  const original = Buffer.from("exact invitation file");
  const h = harness({
    getOriginal: async (pathname, options) => {
      reads.push({ pathname, access: options.access });
      return { statusCode: 200, stream: new Response(original).body };
    },
  });
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "https://envitefy.com", ""]) {
    const bytes = await h.readScanOriginalBytes(`${origin}/api/blob/event-media/invitation%20original.webp?v=1#preview`);
    assert.deepEqual(bytes, original);
  }
  assert.deepEqual(reads, [{ pathname: "event-media/invitation original.webp", access: "private" }]);
});

test("medical upload stores only ciphertext and never a readable preview", async () => {
  const h = harness();
  const original = Buffer.from("exact original image bytes");
  const response = await h.processPrivateScanUpload(
    new File([original], "appointment.png", { type: "image/png" }),
    "owner",
  );
  assert.equal(h.uploads.length, 1);
  assert.match(h.uploads[0].pathname, /^private-scan-originals\/.+\.bin$/);
  assert.equal(h.uploads[0].contentType, "application/octet-stream");
  assert.deepEqual(h.decryptScanOriginal(h.uploads[0].bytes, "owner"), original);
  assert.equal(response.eventMedia.attachment.storageKind, "encrypted-blob");
  assert.equal(response.eventMedia.thumbnail, undefined);
  assert.equal(Object.keys(response.stored).length, 0);
});

test("original reading accepts inline originals and rejects arbitrary network destinations", async () => {
  const h = harness();
  assert.equal(
    (await h.readScanOriginalBytes("data:application/pdf;base64,ZXhhY3Q=")).toString(),
    "exact",
  );
  for (const url of [
    "http://localhost/admin",
    "https://example.com/document",
    "/api/blob/private-scan-originals/../key",
    "/api/blob/secrets/key",
    "https://example.com/api/blob/event-media/invitation.webp",
    "http://localhost:3000/api/blob/private-scan-originals/../event-media/key",
    "http://localhost:3000/api/blob/event-media/%2e%2e/private-scan-originals/key",
    "http://localhost:3000/api/blob/event-media/%5c/key",
    "http://user@localhost:3000/api/blob/event-media/key",
  ]) {
    await assert.rejects(h.readScanOriginalBytes(url));
  }
});
