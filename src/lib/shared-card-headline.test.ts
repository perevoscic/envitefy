import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { createLiveCardForm } from "./livecard-builder";
import { cardHeadlinePrompt, generateCardHeadline, headlineGenerationDeps } from "./shared-card-headline";

test("headline generation receives only approved title, opening line and visual direction", () => {
  const form = { ...createLiveCardForm(), title: "Livia is turning 10", headlineIntro: "Join us", design: "Lavender balloons and calligraphy", overview: "Only guests should read this", instructions: "Bring a jacket", hostEmail: "mia@example.com", date: "2026-09-26" };
  const prompt = cardHeadlinePrompt(form);
  assert.match(prompt, /Livia is turning 10/);
  assert.match(prompt, /Join us/);
  assert.doesNotMatch(prompt, /Only guests should|Bring a jacket|mia@example.com|2026-09-26/);
  assert.match(cardHeadlinePrompt({ ...form, headlineIntro: "" }), /Omit this line completely when empty/);
});

test("generated lettering requires verification, preserves exact text, and returns only WebP in memory", async () => {
  const original = { ...headlineGenerationDeps };
  const image = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#dddddd" } }).png().toBuffer();
  let status: "passed" | "failed" | "unavailable" = "passed";
  let calls = 0;
  const form = { ...createLiveCardForm(), title: "Livia is turning 10", headlineIntro: "You're invited", design: "Lavender balloons" };
  const design = { version: 1 as const, backgroundUrl: "/background.webp", font: "classic" as const, ink: "#522335", accent: "#876035", surface: "#fff4ec" };
  headlineGenerationDeps.references = async (urls) => { assert.deepEqual(urls, [design.backgroundUrl]); return [{ mimeType: "image/png", data: image.toString("base64") }]; };
  headlineGenerationDeps.generate = async () => { calls++; return { ok: true, imageDataUrl: `data:image/png;base64,${image.toString("base64")}`, warnings: [] }; };
  headlineGenerationDeps.verify = async (_image, event, product) => { assert.equal(product, "live_card"); assert.equal(event.title, form.title); assert.deepEqual(event.requiredArtworkLines, [form.headlineIntro]); return { status, issues: [] }; };
  headlineGenerationDeps.encode = async (buffer) => sharp(buffer).webp().toBuffer();
  try {
    const result = await generateCardHeadline(form, design);
    assert.equal(result.title, form.title);
    assert.equal(result.intro, form.headlineIntro);
    assert.match(result.imageUrl, /^data:image\/webp;base64,/);
    for (const value of ["failed", "unavailable"] as const) {
      status = value;
      await assert.rejects(generateCardHeadline(form, design), /could not be verified/);
    }
    assert.equal(calls, 3, "one model request per explicit attempt, without automatic paid retries");
  } finally { Object.assign(headlineGenerationDeps, original); }
});
