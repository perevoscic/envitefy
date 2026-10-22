import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const script = fileURLToPath(new URL("./event-page-themed-artwork.mjs", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-artwork-provenance-"));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(`${path.resolve(os.tmpdir())}${path.sep}`));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const output = "public/templates/event-pages/bridal-showers/test-scene.webp";
  const source = path.join(directory, "source.png");
  const png = await sharp({ create: { width: 20, height: 30, channels: 3, background: "#386449" } }).png().toBuffer();
  const artwork = await sharp(png).webp().toBuffer();
  const asset = {
    id: "bridal-showers--test-scene",
    output,
    source,
    provider: "OpenAI built-in image_gen",
    width: 20,
    height: 30,
    sha256: hash(artwork),
    bytes: artwork.length,
    verifiedDecode: true,
    visuallyReviewed: true,
    status: "reviewed",
  };
  await fs.mkdir(path.join(directory, "docs"), { recursive: true });
  await fs.mkdir(path.join(directory, "src/data"), { recursive: true });
  await fs.mkdir(path.dirname(path.join(directory, output)), { recursive: true });
  await fs.writeFile(source, png);
  await fs.writeFile(path.join(directory, output), artwork);
  await fs.writeFile(path.join(directory, "docs/event-page-themed-artwork.json"), JSON.stringify({ version: 1, assets: [asset] }));
  await fs.writeFile(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), JSON.stringify({ version: 1, readyDesignIds: [asset.id] }));
  return { directory, asset, artwork, source };
}

function run(directory, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: directory,
    encoding: "utf8",
    timeout: 15000,
  });
  assert.ifError(result.error);
  return result;
}

test("publish preserves recorded reviewed artwork in a checkout without ignored result files", async (t) => {
  const { directory, asset } = await fixture(t);
  const result = run(directory, "publish");
  assert.equal(result.status, 0, result.stderr);
  const availability = JSON.parse(await fs.readFile(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), "utf8"));
  assert.deepEqual(availability.readyDesignIds, [asset.id]);
  const manifest = JSON.parse(await fs.readFile(path.join(directory, "docs/event-page-themed-artwork.json"), "utf8"));
  assert.equal(manifest.assets[0].sha256, asset.sha256);
  assert.equal(manifest.assets[0].status, "reviewed");
  await assert.rejects(fs.stat(path.join(directory, "output/event-page-themed-artwork/results")), { code: "ENOENT" });
});

test("install recognizes an existing checked-in asset through its recorded provenance", async (t) => {
  const { directory, asset, artwork, source } = await fixture(t);
  const result = run(directory, "install", "--id", asset.id, "--source", source);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { id: asset.id, status: "already-installed" });
  assert.deepEqual(await fs.readFile(path.join(directory, asset.output)), artwork);
});

test("publish and install reject tampered recorded artwork before changing availability", async (t) => {
  const { directory, asset, source } = await fixture(t);
  const tampered = await sharp({ create: { width: 20, height: 30, channels: 3, background: "#99442c" } }).webp().toBuffer();
  await fs.writeFile(path.join(directory, asset.output), tampered);
  for (const args of [["publish"], ["install", "--id", asset.id, "--source", source]]) {
    const result = run(directory, ...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Artwork verification failed/);
  }
  const availability = JSON.parse(await fs.readFile(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), "utf8"));
  assert.deepEqual(availability.readyDesignIds, [asset.id]);
  assert.deepEqual(await fs.readFile(path.join(directory, asset.output)), tampered);
});
