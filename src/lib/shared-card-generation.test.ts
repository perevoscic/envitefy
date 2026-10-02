import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import { createLiveCardForm } from "./livecard-builder";
import { generateSharedCard, sharedCardGenerationDeps } from "./shared-card-generation";

test("Design consumes an unsaved image reference in memory without fetching or uploading", async (t) => {
  const original = { ...sharedCardGenerationDeps };
  t.after(() => Object.assign(sharedCardGenerationDeps, original));
  const webp = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#ddddee" } }).webp().toBuffer();
  const image = `data:image/webp;base64,${webp.toString("base64")}`;
  sharedCardGenerationDeps.createClient = () => ({ chat: { completions: { create: async () => ({
    choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ font: "classic", typography: "editorial", ink: "#000000", accent: "#111111", surface: "#ffffff" }) } }],
  }) } } }) as any;
  sharedCardGenerationDeps.references = async () => { throw new Error("Unsaved references must not be fetched"); };
  sharedCardGenerationDeps.generateImage = async (_prompt, references) => {
    assert.deepEqual(references, [{ mimeType: "image/webp", data: webp.toString("base64") }]);
    return { ok: true, imageDataUrl: image, warnings: [] };
  };
  sharedCardGenerationDeps.verify = async () => ({ status: "passed", issues: [] });
  sharedCardGenerationDeps.encode = async (bytes) => bytes;
  const stages: string[] = [];
  const result = await generateSharedCard({ ...createLiveCardForm(), eventType: "Graduation", design: "Mountain sunrise", referenceUrl: image }, undefined, (stage) => stages.push(stage));
  assert.equal(result.backgroundUrl, image);
  assert.deepEqual(stages, ["preparing", "generating", "checking", "encoding"]);
  await assert.rejects(
    generateSharedCard({ ...createLiveCardForm(), eventType: "Graduation", design: "Mountain sunrise", referenceUrl: "data:image/webp;base64,bm90IGFuIGltYWdl" }),
    /reference image could not be opened/,
  );
  const builder = readFileSync(new URL("../app/live-cards/LiveCardBuilder.tsx", import.meta.url), "utf8");
  const generateBody = builder.slice(builder.indexOf("  async function generate()"), builder.indexOf("  async function save("));
  assert.doesNotMatch(generateBody, /persistReference|persistImageMediaValue|persistBackground/);
});
