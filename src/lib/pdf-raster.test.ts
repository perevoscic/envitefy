import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";
import { createPdfPageRasterizer, extractPdfAnnotationLinks, extractPdfTextWithPdfJs } from "./pdf-raster.ts";

test("extractPdfTextWithPdfJs reads text and pages from the sample parent info PDF", async () => {
  const pdfPath = path.join(process.cwd(), "docs", "2026wgaspparentinfo.pdf");
  const buffer = await readFile(pdfPath);
  const result = await extractPdfTextWithPdfJs(buffer);

  assert.ok(result.text.length > 1000);
  assert.ok(result.pages.length >= 4);
  assert.match(result.text, /Gasparilla Classic/i);
  assert.match(result.text, /March 6-8, 2026/i);
  assert.match(result.text, /Doors Open\s*:\s*7:00am each day/i);
});

test("text extraction can retain annotation destinations in its existing page pass", async () => {
  const buffer = await readFile(path.join(process.cwd(), "docs", "2026wgaspparentinfo.pdf"));
  const result = await extractPdfTextWithPdfJs(buffer, { includeAnnotations: true });
  const links = await extractPdfAnnotationLinks(buffer);
  assert.ok(links.length > 0, "sample document should exercise hidden annotation destinations");
  assert.deepEqual(result.links, links);
  assert.ok(result.text.length > 1000);
});

test("one PDF reader renders multiple pages and closes explicitly", async () => {
  const buffer = await readFile(path.join(process.cwd(), "docs", "2026wgaspparentinfo.pdf"));
  const reader = createPdfPageRasterizer(buffer);
  try {
    for (const page of [0, 1]) {
      const rendered = await reader.rasterize(page);
      assert.ok(rendered, `page ${page + 1} should render`);
      const metadata = await sharp(rendered).metadata();
      assert.equal(metadata.format, "png");
      assert.ok((metadata.width || 0) > 500);
      assert.ok((metadata.height || 0) > 500);
    }
  } finally {
    await reader.dispose();
  }
  await assert.rejects(reader.rasterize(0), /PDF reader is closed/);
  await reader.dispose();
});

test("PDF rasterization honors cancellation before starting another page", async () => {
  const controller = new AbortController();
  const reader = createPdfPageRasterizer(Buffer.from("unused"), controller.signal);
  controller.abort();
  await assert.rejects(reader.rasterize(0), { name: "AbortError" });
  await reader.dispose();
});
