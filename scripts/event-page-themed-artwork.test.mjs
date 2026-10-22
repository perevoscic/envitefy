import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const script = path.join(root, "scripts/event-page-themed-artwork.mjs");
const fixtureParent = path.join(root, ".qa");
mkdirSync(fixtureParent, { recursive: true });
const hash = (data) => createHash("sha256").update(data).digest("hex");
const writeJson = (filename, value) => { mkdirSync(path.dirname(filename), { recursive: true }); writeFileSync(filename, JSON.stringify(value)); };
const review = {
  evidence: "qa-review.json", method: "Human visual inspection of fixture",
  technicalReview: { pass: true },
  diversityReview: { pass: true, cohortEvidence: "cohort.webp", observed: {
    medium: "Photography", viewpoint: "Direct overhead", scale: "Wide venue", placement: "Lower left",
    lighting: "Cool daylight", setting: "Baseball park", narrative: "Empty chalked field",
  } },
};

async function fixture(run) {
  const directory = mkdtempSync(path.join(fixtureParent, "themed-installer-"));
  try {
    const buffer = await sharp({ create: { width: 2, height: 3, channels: 3, background: "#163c47" } }).webp().toBuffer();
    const legacy = { id: "bridal-showers--frozen", collection: "bridal-showers", output: "public/templates/event-pages/bridal-showers/frozen.webp", width: 2, height: 3, sha256: hash(buffer), status: "reviewed", visuallyReviewed: true, verifiedDecode: true };
    const modern = { id: "baseball--v2-park-empty", collection: "baseball", output: "public/templates/event-pages/v2/baseball/park-empty.webp", width: 2, height: 3, sha256: hash(buffer), status: "reviewed", visuallyReviewed: true, verifiedDecode: true, visualReview: structuredClone(review) };
    for (const asset of [legacy, modern]) { mkdirSync(path.dirname(path.join(directory, asset.output)), { recursive: true }); writeFileSync(path.join(directory, asset.output), buffer); }
    writeFileSync(path.join(directory, "cohort.webp"), buffer);
    writeJson(path.join(directory, "docs/event-page-themed-artwork.json"), { assets: [modern] });
    writeJson(path.join(directory, "docs/event-page-themed-artwork-v1.json"), { assets: [legacy] });
    writeJson(path.join(directory, "src/data/event-page-themed-legacy.json"), { readyDesignIds: [legacy.id], designs: [{ id: legacy.id }] });
    writeJson(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), { version: 2, readyDesignIds: [legacy.id] });
    const call = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: "utf8", timeout: 30_000 });
    await run({ directory, legacy, modern, call });
  } finally {
    // Only this freshly-created child of the known workspace QA directory is removed.
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(fixtureParent));
    rmSync(directory, { recursive: true, force: true });
  }
}

test("publisher retains hash-verified frozen v1 addresses alongside reviewed v2 artwork", async () => fixture(({ directory, legacy, modern, call }) => {
  const result = call("publish");
  assert.equal(result.status, 0, result.stderr);
  const available = JSON.parse(readFileSync(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), "utf8"));
  assert.deepEqual(new Set(available.readyDesignIds), new Set([legacy.id, modern.id]));
}));

test("v2 visuallyReviewed alone cannot bypass observed diversity evidence", async () => fixture(({ directory, legacy, modern, call }) => {
  delete modern.visualReview.diversityReview.observed;
  writeJson(path.join(directory, "docs/event-page-themed-artwork.json"), { assets: [modern] });
  const result = call("publish");
  assert.equal(result.status, 0, result.stderr);
  const available = JSON.parse(readFileSync(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), "utf8"));
  assert.deepEqual(available.readyDesignIds, [legacy.id]);
  assert.equal(JSON.parse(readFileSync(path.join(directory, "docs/event-page-themed-artwork.json"), "utf8")).assets[0].status, "generated");
}));

test("v2 review-file requires a matching hash and separate technical and observed cohort decisions", async () => fixture(({ directory, modern, call }) => {
  assert.notEqual(call("reviewed", modern.id).status, 0);
  writeJson(path.join(directory, "review.json"), { entries: [{ id: modern.id, sha256: modern.sha256, pass: true }] });
  assert.notEqual(call("review-file", "--file", "review.json").status, 0);
  // The entry schema stores the two review objects directly, not under visualReview.
  writeJson(path.join(directory, "review.json"), { entries: [{ id: modern.id, sha256: modern.sha256, technicalReview: { pass: true }, diversityReview: {
    pass: true, cohortEvidence: "cohort.webp", observed: { medium: "Photograph", viewpoint: "Overhead", scale: "Wide", placement: "Left", lighting: "Daylight", setting: "Field", narrative: "Empty diamond" },
  } }] });
  const result = call("review-file", "--file", "review.json");
  assert.equal(result.status, 0, result.stderr);
  const installed = JSON.parse(readFileSync(path.join(directory, "output/event-page-themed-artwork/results", `${modern.id}.json`), "utf8"));
  assert.equal(installed.visualReview.diversityReview.observed.viewpoint, "Overhead");
}));

test("publisher rejects altered legacy bytes and leaves existing availability intact", async () => fixture(({ directory, legacy, call }) => {
  writeFileSync(path.join(directory, legacy.output), "corrupted bytes");
  const result = call("publish");
  assert.notEqual(result.status, 0);
  assert.deepEqual(JSON.parse(readFileSync(path.join(directory, "src/data/event-page-themed-artwork-availability.json"), "utf8")).readyDesignIds, [legacy.id]);
}));
