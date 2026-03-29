import assert from "node:assert/strict";
import test from "node:test";

import { optimizePdfWithQpdf } from "./pdf-optimize.ts";

test("optimizePdfWithQpdf falls back to original bytes when qpdf is unavailable", async () => {
  const originalBin = process.env.QPDF_BIN;
  process.env.QPDF_BIN = "qpdf-does-not-exist";

  try {
    const input = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const result = await optimizePdfWithQpdf(input);
    assert.equal(result.optimizedByQpdf, false);
    assert.deepEqual(result.buffer, input);
  } finally {
    if (typeof originalBin === "string") {
      process.env.QPDF_BIN = originalBin;
    } else {
      delete process.env.QPDF_BIN;
    }
  }
});
