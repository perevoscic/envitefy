import assert from "node:assert/strict";
import test from "node:test";

import { optimizePdfWithQpdf } from "./pdf-optimize.ts";

test("optimizePdfWithQpdf falls back to original bytes when qpdf is unavailable", async () => {
  const originalBin = process.env.QPDF_BIN;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const warnings: unknown[][] = [];
  const infos: unknown[][] = [];
  process.env.QPDF_BIN = "qpdf-does-not-exist";
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  console.info = (...args: unknown[]) => {
    infos.push(args);
  };

  try {
    const input = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const result = await optimizePdfWithQpdf(input);
    assert.equal(result.optimizedByQpdf, false);
    assert.equal(result.warning, "qpdf-unavailable");
    assert.deepEqual(result.buffer, input);
    assert.equal(warnings.length, 0);
    assert.equal(infos.length, 1);
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;
    if (typeof originalBin === "string") {
      process.env.QPDF_BIN = originalBin;
    } else {
      delete process.env.QPDF_BIN;
    }
  }
});
