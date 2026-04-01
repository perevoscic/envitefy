import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("server PDF discovery path uses pdfjs in server mode without pdf-parse", () => {
  const rasterSource = readSource("src/lib/pdf-raster.ts");
  const meetSource = readSource("src/lib/meet-discovery/core.ts");
  const packageSource = readSource("package.json");
  const nextConfigSource = readSource("next.config.ts");

  assert.match(rasterSource, /PDF_TEXT_ENGINE_LABEL = "pdfjs-dist"/);
  assert.match(rasterSource, /disableWorker:\s*PDF_WORKER_DISABLED/);
  assert.match(rasterSource, /logPdfWarning\("pdfjs import failed", error\)/);
  assert.match(meetSource, /extractPdfTextWithPdfJs/);
  assert.doesNotMatch(rasterSource, /pdf-parse/);
  assert.doesNotMatch(meetSource, /pdf-parse/);
  assert.doesNotMatch(packageSource, /"pdf-parse"/);
  assert.match(nextConfigSource, /"@napi-rs\/canvas"/);
  assert.match(nextConfigSource, /outputFileTracingIncludes/);
  assert.match(nextConfigSource, /@napi-rs\/canvas-\*\/\*\*\/\*/);
});
