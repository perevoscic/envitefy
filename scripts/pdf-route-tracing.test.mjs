import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const loadConfig = require("next/dist/server/config").default;
const picomatch = require("next/dist/compiled/picomatch");
const root = fileURLToPath(new URL("../", import.meta.url));

test("Next traces PDF/canvas files only for PDF processing routes", async () => {
  const config = await loadConfig("phase-production-build", root);
  const includedFiles = (route) =>
    Object.entries(config.outputFileTracingIncludes).flatMap(([pattern, files]) =>
      picomatch(pattern, { contains: true, dot: true })(route) ? files : [],
    );
  const isPdfRuntime = (file) => /pdfjs-dist|@napi-rs\/canvas/.test(file);

  for (const route of [
    "/api/upload",
    "/api/ingest",
    "/api/ocr",
    "/api/scan/event-page",
    "/api/football/prefill",
    "/api/discovery/[eventId]/run",
    "/api/parse/[eventId]/enrich",
    "/api/events/[id]/original",
  ]) {
    const files = includedFiles(route);
    assert.ok(files.some((file) => file.includes("pdfjs-dist")), route);
    assert.ok(files.some((file) => file.includes("@napi-rs/canvas")), route);
  }

  for (const route of [
    "/landing",
    "/api/user/profile",
    "/api/user/profile/avatar",
    "/api/templates/media",
    "/api/uploads/birthday-asset",
    "/api/studio/generate",
    "/api/events/[id]/card/edit",
    "/api/discovery/intake",
    "/api/discovery/[eventId]/status",
    "/api/discovery/[eventId]/cancel",
  ]) {
    assert.equal(includedFiles(route).some(isPdfRuntime), false, route);
  }
  assert.equal(JSON.stringify(config.outputFileTracingIncludes).includes("pdf-parse"), false);
});
