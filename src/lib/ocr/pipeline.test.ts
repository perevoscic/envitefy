import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("pipeline keeps explicit early no-file guard", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");
  assert.match(source, /if \(!\(file instanceof File\)\)/);
  assert.match(source, /error: "No file"/);
});

test("pipeline still validates upload metadata before OCR work", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");
  assert.match(source, /validateUploadFileMeta/);
  assert.match(source, /if \(!validation\.ok\)/);
});

test("pipeline rejects empty or generic OCR instead of saving a placeholder event", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");

  assert.match(source, /function hasUsableOcrResult/);
  assert.match(source, /OPENAI_GENERIC/);
  assert.match(source, /OCR_NOT_CONFIGURED/);
  assert.match(source, /OCR_UNREADABLE/);
  assert.match(source, /Set OPENAI_API_KEY/);
});

test("pipeline normalizes graduation venue names before returning fields", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");

  assert.match(source, /cleanGraduationVenueName/);
  assert.match(source, /category === "Graduations"/);
  assert.match(source, /fieldsGuess\.venue = cleanedVenue \|\| null/);
});

test("pipeline classifies OCR categories from extracted context", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");
  const openAiSource = await readFile(new URL("./openai.ts", import.meta.url), "utf8");

  assert.match(openAiSource, /payload\?\.category/);
  assert.match(source, /const categoryDetectionText = \[/);
  assert.match(source, /llmImage\?\.category/);
  assert.match(source, /fieldsGuess\.title/);
  assert.match(source, /let category: string \| null = detectCategory\(categoryDetectionText\);/);
  assert.match(source, /fieldsGuess\.category = category;/);
});

test("pipeline keeps OCR skin inference optional and timeout bounded", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");
  const constants = await readFile(new URL("./constants.ts", import.meta.url), "utf8");

  assert.match(constants, /export const OCR_SKIN_TIMEOUT_MS = 3_500;/);
  assert.match(source, /const skinParam = String\(url\.searchParams\.get\("skin"\) \|\| ""\)/);
  assert.match(source, /const enableSkinInference = skinParam !== "0" && skinParam !== "false";/);
  assert.match(source, /async function withFallbackTimeout<T>/);
  assert.match(source, /withFallbackTimeout\(\s*inferOcrSkinSelection\(\{/);
  assert.match(source, /skinInferenceTimedOut = skinResult\.timedOut;/);
  assert.match(source, /enableSkinInference,/);
  assert.match(source, /skinTimeoutMs,/);
});

test("OpenAI OCR omits unsupported custom temperature for GPT-5 models", async () => {
  const openAiSource = await readFile(new URL("./openai.ts", import.meta.url), "utf8");

  assert.match(openAiSource, /function supportsCustomTemperature\(model: string\): boolean/);
  assert.match(openAiSource, /return !\/\^gpt-5\(\?:\[\.-\]\|\$\)\/i\.test\(model\.trim\(\)\);/);
  assert.match(openAiSource, /function buildChatPayload/);
  assert.match(openAiSource, /\.\.\.\(supportsCustomTemperature\(model\) \? \{ temperature \} : \{\}\)/);
  assert.match(openAiSource, /buildChatPayload\(\{\s*model,\s*temperature: 0\.1,/);
});
