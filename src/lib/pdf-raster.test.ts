import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { extractPdfTextWithPdfJs } from "./pdf-raster.ts";

test("extractPdfTextWithPdfJs reads text and pages from the sample parent info PDF", async () => {
  const pdfPath = path.join(process.cwd(), "docs", "2026wgaspparentinfo.pdf");
  const buffer = await readFile(pdfPath);
  const result = await extractPdfTextWithPdfJs(buffer);

  assert.ok(result.text.length > 1000);
  assert.ok(result.pages.length >= 4);
  assert.match(result.text, /Gasparilla Classic/i);
});
