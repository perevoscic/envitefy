import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import sharp from "sharp";
import ts from "typescript";
import * as state from "./original-display-state.ts";
import { encodeScanDisplayWebp } from "./original-display-webp.ts";

const require = createRequire(import.meta.url);
function harness({
  fail = false,
  larger = false,
  replaceDuringUpload = false,
  owner = "owner",
} = {}) {
  const source = Buffer.from("exact original camera photo with metadata");
  const h = {
    data: {
      createdVia: "ocr",
      attachment: { dataUrl: "source", type: "image/jpeg", storageKind: "encrypted-blob" },
    },
    conversions: 0,
    uploads: [],
    queries: [],
    invalidations: [],
  };
  state.prepareSavedScanDisplay(h.data);
  const query = async (sql, args) => {
    h.queries.push({ sql, args });
    if (owner !== args[1]) return { rows: [] };
    const original = h.data.attachment;
    const copy = original.displayCopy;
    if (sql.includes("RETURNING data")) {
      if (
        copy?.sourceUrl === original.dataUrl &&
        copy.status !== "pending" &&
        !(["generating", "failed"].includes(copy.status) && copy.updatedAt < args[3])
      )
        return { rows: [] };
      original.displayCopy = { ...JSON.parse(args[2]), sourceUrl: original.dataUrl };
      return { rows: [{ data: structuredClone(h.data) }] };
    }
    if (copy.token === args[3] && original.dataUrl === args[4])
      original.displayCopy = JSON.parse(args[2]);
    return { rows: [] };
  };
  const mocks = {
    "@/lib/db": { query },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => h.invalidations.push("dashboard") },
    "@/lib/history-cache": { invalidateUserHistory: () => h.invalidations.push("history") },
    "./original-display-state": state,
    "./private-original": {
      readScanOriginalBytes: async () => Buffer.from("ciphertext"),
      decryptScanOriginal: (bytes, userId) => {
        assert.equal(userId, "owner");
        assert.equal(bytes.toString(), "ciphertext");
        return source;
      },
      encryptScanOriginal: (bytes, userId) => {
        assert.equal(userId, "owner");
        return Buffer.concat([Buffer.from("encrypted:"), bytes]);
      },
    },
    "./original-display-webp": {
      encodeScanDisplayWebp: async (bytes) => {
        h.conversions++;
        assert.deepEqual(bytes, source);
        if (fail) throw new Error("FFmpeg failed");
        return {
          bytes: larger ? Buffer.alloc(100) : Buffer.from("webp"),
          width: 1200,
          height: 1600,
        };
      },
    },
    "@/lib/media-upload": {
      uploadPublicBinaryAsset: async (asset) => {
        h.uploads.push(asset);
        if (replaceDuringUpload) h.data.attachment.dataUrl = "replacement";
        return {
          url: "https://test.public.blob.vercel-storage.com/private-scan-originals/display.bin",
        };
      },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(readFileSync(new URL("./original-display.ts", import.meta.url), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || require(name),
      Buffer,
      console: { error() {} },
    },
  );
  return Object.assign(h, { run: () => module.exports.generateSavedScanDisplay("event", "owner") });
}

test("background conversion has one claim, encrypts WebP, and preserves original metadata", async () => {
  const h = harness();
  const original = { ...h.data.attachment };
  await Promise.all([h.run(), h.run()]);
  assert.equal(h.conversions, 1);
  assert.equal(h.uploads.length, 1);
  assert.equal(h.uploads[0].contentType, "application/octet-stream");
  assert.match(h.uploads[0].pathname, /^private-scan-originals\/.+-display.bin$/);
  assert.equal(h.uploads[0].bytes.toString(), "encrypted:webp");
  assert.equal(h.data.attachment.dataUrl, original.dataUrl);
  assert.equal(h.data.attachment.type, original.type);
  assert.equal(h.data.attachment.storageKind, original.storageKind);
  assert.equal(state.readyScanDisplayCopy(h.data.attachment)?.type, "image/webp");
  assert.deepEqual(h.invalidations, ["history", "dashboard"]);
  assert.match(h.queries[0].sql, /user_id = \$2/);
  assert.match(h.queries.at(-1).sql, /dataUrl' = \$5/);
});

test("larger output is discarded and conversion failure leaves a retryable source", async () => {
  for (const options of [{ larger: true }, { fail: true }]) {
    const h = harness(options);
    await h.run();
    assert.equal(h.uploads.length, 0);
    assert.equal(h.data.attachment.displayCopy.status, options.fail ? "failed" : "skipped");
    assert.equal(h.data.attachment.dataUrl, "source");
    await h.run();
    assert.equal(h.conversions, 1, "ready/skipped/recent failed work is not duplicated");
  }
});

test("stale work resumes, wrong owners cannot claim, and source replacements reject late results", async () => {
  const resumed = harness();
  resumed.data.attachment.displayCopy.status = "generating";
  resumed.data.attachment.displayCopy.updatedAt = new Date(0).toISOString();
  await resumed.run();
  assert.equal(resumed.data.attachment.displayCopy.status, "ready");
  const denied = harness({ owner: "someone else" });
  await denied.run();
  assert.equal(denied.conversions, 0);
  const replaced = harness({ replaceDuringUpload: true });
  await replaced.run();
  assert.equal(replaced.data.attachment.dataUrl, "replacement");
  assert.equal(state.readyScanDisplayCopy(replaced.data.attachment), null);
});

test("only saved image scans are queued; PDF and unrelated event saves are untouched", () => {
  for (const data of [
    { createdVia: "manual", attachment: { dataUrl: "source", type: "image/jpeg" } },
    { createdVia: "ocr", attachment: { dataUrl: "source", type: "application/pdf" } },
    { createdVia: "ocr", attachment: null },
  ])
    assert.equal(state.prepareSavedScanDisplay(data), false);
  for (const [createdVia, type] of [
    ["ocr", "image/jpeg"],
    ["ocr-camera", "image/png"],
    ["scan-event-page", "image/webp"],
  ]) {
    const data = {
      createdVia,
      attachment: {
        dataUrl: "source",
        type,
        displayCopy: { status: "ready", dataUrl: "client-controlled" },
      },
    };
    assert.equal(state.prepareSavedScanDisplay(data), true);
    assert.equal(data.attachment.displayCopy.status, "pending");
    assert.equal(data.attachment.displayCopy.dataUrl, undefined);
  }
});

test("real FFmpeg conversion orients phone photos, limits display size, and preserves source bytes", async () => {
  const original = await sharp({
    create: { width: 3200, height: 2400, channels: 3, background: "#ddd8ce" },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="3200" height="2400"><text x="180" y="320" font-size="90">Phone: (555) 123-4567</text></svg>',
        ),
      },
    ])
    .jpeg({ quality: 97 })
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const saved = Buffer.from(original);
  const converted = await encodeScanDisplayWebp(original);
  const metadata = await sharp(converted.bytes).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(converted.width, 1800);
  assert.equal(converted.height, 2400);
  assert.ok(converted.bytes.length < original.length);
  assert.deepEqual(original, saved);
  await sharp(converted.bytes).raw().toBuffer();
});

test("both save routes register conversion after saving, without awaiting it in the response path", () => {
  for (const path of ["../../app/api/history/route.ts", "../../app/api/scan/event-page/route.ts"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /needsScanDisplay[^\n]*after\(async \(\) => \{/);
    assert.ok(
      source.indexOf("const row = await insertEventHistory") <
        source.indexOf("await generateSavedScanDisplay(row.id, userId)"),
    );
  }
});
