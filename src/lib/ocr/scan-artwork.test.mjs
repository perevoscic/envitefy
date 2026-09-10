import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import sharp from "sharp";
import ts from "typescript";
import { encodeScanArtworkWebp } from "./artwork-webp.ts";
import * as personal from "./personalization.ts";
import { normalizeScanArtwork } from "./scan-artwork-state.ts";
import * as scanMedia from "./scan-media.ts";
import * as ticket from "./scan-artwork-ticket.ts";

const require = createRequire(import.meta.url);
function harness({ fail = false, conversionFails = false } = {}) {
  const h = {
    state: { version: 1, status: "pending" },
    generated: 0,
    uploads: [],
    queries: [],
    invalidated: [],
    prompt: "",
  };
  const profile = personal.buildScanPersonalization({
    title: "ENT appointment",
    personName: "Maya",
    personAge: 7,
  });
  const query = async (sql, args) => {
    h.queries.push([sql, args]);
    if (sql.includes("RETURNING data")) {
      if (!["pending", ...(args[3] ? ["failed"] : [])].includes(h.state.status))
        return { rows: [] };
      h.state = JSON.parse(args[2]);
      return { rows: [{ data: { scanPersonalization: profile } }] };
    }
    if (h.state.token === args[3]) h.state = JSON.parse(args[2]);
    return { rows: [] };
  };
  const mocks = {
    "next/cache": { revalidatePath: () => h.invalidated.push("page") },
    "@/lib/db": { query },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => h.invalidated.push("dashboard") },
    "@/lib/history-cache": { invalidateUserHistory: () => h.invalidated.push("history") },
    "@/lib/media-upload": {
      uploadPublicBinaryAsset: async (params) => {
        h.uploads.push(params);
        return { url: "https://example.com/generated.webp" };
      },
    },
    "@/lib/studio/openai": {
      generateInvitationImageWithOpenAi: async (prompt) => {
        h.generated++;
        h.prompt = prompt;
        return fail ? { ok: false } : { ok: true, imageDataUrl: "data:image/png;base64,Ynl0ZXM=" };
      },
    },
    "./artwork-webp": {
      encodeScanArtworkWebp: async () => {
        if (conversionFails) throw new Error("conversion failed");
        return Buffer.from("verified webp");
      },
    },
    "./personalization": personal,
    "./scan-media": scanMedia,
    "./scan-artwork-ticket": ticket,
  };
  function load(name) {
    const source = readFileSync(new URL(name, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    });
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
      module,
      exports: module.exports,
      require: (name) => mocks[name] || require(name),
      Buffer,
      AbortSignal,
      console: { error: () => {} },
    });
    return module.exports;
  }
  mocks["./scan-artwork-render"] = load("./scan-artwork-render.ts");
  const module = { exports: load("./scan-artwork.ts") };
  return Object.assign(h, module.exports);
}

test("two concurrent generation attempts claim one event and upload only WebP", async () => {
  const h = harness();
  await Promise.all([
    h.generateSavedScanArtwork("event-id", "owner-id"),
    h.generateSavedScanArtwork("event-id", "owner-id"),
  ]);
  assert.equal(h.generated, 2);
  assert.equal(h.uploads.length, 2);
  assert.ok(h.state.heroImageUrl);
  assert.equal(h.uploads[0].contentType, "image/webp");
  assert.match(h.uploads[0].pathname, /^event-media\/event-id\/scan-artwork\/.+\.webp$/);
  assert.equal(h.state.status, "ready");
  assert.doesNotMatch(h.prompt, /Maya/);
  assert.deepEqual(h.invalidated.sort(), ["dashboard", "history", "page"]);
  assert.match(h.queries[0][0], /user_id = \$2/);
  assert.match(h.queries.at(-1)[0], /data->'scanArtwork'->>'token' = \$4/);
});
test("failed generation leaves a failed state, saves no original, and permits explicit retry", async () => {
  const h = harness({ fail: true });
  await h.generateSavedScanArtwork("event-id", "owner-id");
  assert.equal(h.state.status, "failed");
  assert.equal(h.uploads.length, 0);
  await h.generateSavedScanArtwork("event-id", "owner-id");
  assert.equal(h.generated, 2);
  await h.generateSavedScanArtwork("event-id", "owner-id", true);
  assert.equal(h.generated, 4);
});
test("failed WebP verification cannot persist generated originals", async () => {
  const h = harness({ conversionFails: true });
  await h.generateSavedScanArtwork("event-id", "owner-id");
  assert.equal(h.state.status, "failed");
  assert.equal(h.uploads.length, 0);
});
test("only saved OCR payloads with valid context initialize artwork", () => {
  const h = harness();
  assert.equal(h.prepareSavedScanArtwork({ createdVia: "manual" }), false);
  assert.equal(h.prepareSavedScanArtwork({ createdVia: "ocr" }), false);
  const data = {
    createdVia: "ocr",
    scanSourceKind: "paperwork",
    scanPersonalization: personal.buildScanPersonalization({ title: "Soccer practice" }),
    scanArtwork: { status: "ready", imageUrl: "https://example.com/untrusted.png" },
  };
  assert.equal(h.prepareSavedScanArtwork(data), true);
  assert.equal(data.scanArtwork.status, "pending");
  assert.equal(data.scanArtwork.imageUrl, undefined);
});
test("state validation rejects executable URLs and invalid ready states", () => {
  assert.equal(
    normalizeScanArtwork({ version: 1, status: "ready", imageUrl: "javascript:alert(1)" }).status,
    "failed",
  );
  assert.equal(
    normalizeScanArtwork({ version: 1, status: "ready", imageUrl: "/examples/background.webp" })
      .status,
    "ready",
  );
});

test("expired early work exposes retry without changing read-only status behavior", () => {
  assert.equal(
    normalizeScanArtwork({
      version: 1,
      status: "generating",
      earlyExpiresAt: new Date(Date.now() - 1000).toISOString(),
    }).status,
    "failed",
  );
  assert.equal(
    normalizeScanArtwork({
      version: 1,
      status: "generating",
      earlyExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    }).status,
    "generating",
  );
  assert.equal(normalizeScanArtwork({ version: 1, status: "generating" }).status, "generating");
});

test("designed invitations retain their original artwork without starting generation", () => {
  const h = harness();
  const data = {
    createdVia: "ocr",
    scanSourceKind: "designed",
    scanPersonalization: personal.buildScanPersonalization({ title: "Birthday party" }),
  };
  assert.equal(h.prepareSavedScanArtwork(data), false);
  assert.equal(data.scanHeroMode, "original");
  assert.equal(data.scanArtwork, undefined);
});
test("runtime FFmpeg output decodes as WebP and preserves dimensions and transparency", async () => {
  for (const alpha of [1, 0.4]) {
    const original = await sharp({
      create: { width: 64, height: 48, channels: 4, background: { r: 35, g: 160, b: 150, alpha } },
    })
      .png()
      .toBuffer();
    const output = await encodeScanArtworkWebp(original);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 64);
    assert.equal(metadata.height, 48);
    if (alpha < 1) assert.equal(metadata.hasAlpha, true);
  }
});

test("full-size artwork piped from FFmpeg has a finalized RIFF header and decodes", async () => {
  for (const [width, height] of [
    [1536, 1024],
    [1024, 1536],
  ]) {
    const pixels = Buffer.alloc(width * height * 3);
    let seed = 42;
    for (let index = 0; index < pixels.length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels[index] = seed >>> 24;
    }
    const original = await sharp(pixels, { raw: { width, height, channels: 3 } })
      .png()
      .toBuffer();
    const output = await encodeScanArtworkWebp(original);
    assert.ok(output.length > 32768, "exercise output larger than the muxer's seek buffer");
    assert.equal(output.toString("ascii", 0, 4), "RIFF");
    assert.equal(output.readUInt32LE(4), output.length - 8);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);
    await sharp(output).raw().toBuffer();
  }
});
