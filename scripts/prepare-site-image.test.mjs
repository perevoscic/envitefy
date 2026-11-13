import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import sharp from "sharp";

test("incoming artwork is verified and its staged original removed without adding a URL redirect", async () => {
  const staging = fs.mkdtempSync(path.resolve("output/image-preparation-test-"));
  const destinationDirectory = fs.mkdtempSync(path.resolve("public/images/image-preparation-test-"));
  const source = path.join(staging, "original.png");
  const destination = path.join(destinationDirectory, "final.webp");
  const manifest = fs.readFileSync("src/data/repository-image-migrations.json");
  try {
    const pixels = Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 40, 50, 60, 210]);
    await sharp(pixels, { raw: { width: 2, height: 2, channels: 4 } }).png().toFile(source);
    const output = execFileSync(process.execPath, ["scripts/prepare-site-image.mjs", "--input", source, "--output", destination], { encoding: "utf8", windowsHide: true });
    assert.match(output, /Original deleted before import; no redirect created/);
    assert.equal(fs.existsSync(source), false);
    const bytes = fs.readFileSync(destination);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 2);
    assert.equal(metadata.height, 2);
    const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer();
    for (let pixel = 0; pixel < 4; pixel++) assert.equal(decoded[pixel * 4 + 3], pixels[pixel * 4 + 3]);
    assert.deepEqual(fs.readFileSync("src/data/repository-image-migrations.json"), manifest);

    // Invalid inputs and occupied delivery URLs must retain the original.
    fs.writeFileSync(source, "invalid image");
    assert.throws(() => execFileSync(process.execPath, ["scripts/prepare-site-image.mjs", "--input", source, "--output", destination], { stdio: "pipe", windowsHide: true }), /Command failed/);
    assert.equal(fs.readFileSync(source, "utf8"), "invalid image");
    const otherDestination = path.join(destinationDirectory, "invalid.webp");
    assert.throws(() => execFileSync(process.execPath, ["scripts/prepare-site-image.mjs", "--input", source, "--output", otherDestination], { stdio: "pipe", windowsHide: true }), /Command failed/);
    assert.equal(fs.existsSync(source), true);
    assert.equal(fs.existsSync(otherDestination), false);
  } finally {
    for (const filename of [source, destination]) if (fs.existsSync(filename)) fs.unlinkSync(filename);
    fs.rmdirSync(destinationDirectory);
    fs.rmdirSync(staging);
  }
});
