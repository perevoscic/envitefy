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

test("pipeline normalizes graduation venue names before returning fields", async () => {
  const source = await readFile(new URL("./pipeline.ts", import.meta.url), "utf8");

  assert.match(source, /cleanGraduationVenueName/);
  assert.match(source, /category === "Graduations"/);
  assert.match(source, /fieldsGuess\.venue = cleanedVenue \|\| null/);
});
