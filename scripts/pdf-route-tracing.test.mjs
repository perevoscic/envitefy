import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const loadConfig = require("next/dist/server/config").default;
const picomatch = require("next/dist/compiled/picomatch");
const root = fileURLToPath(new URL("../", import.meta.url));
// File-tracing rules are shared across phases. Reading them in development
// avoids regenerating runtime CSS while the packaging tests run.
const config = await loadConfig("phase-development-server", root);
const includedFiles = (route) =>
  Object.entries(config.outputFileTracingIncludes).flatMap(([pattern, files]) =>
    picomatch(pattern, { contains: true, dot: true })(route) ? files : [],
  );

test("Next traces PDF/canvas files only for PDF processing routes", () => {
  const isPdfRuntime = (file) => /pdfjs-dist|@napi-rs\/canvas/.test(file);

  for (const route of [
    "/api/upload",
    "/api/ingest",
    "/api/ocr",
    "/api/scan/event-page",
    "/api/football/prefill",
    "/api/discovery/intake",
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
    "/api/discovery/[eventId]/status",
    "/api/discovery/[eventId]/cancel",
  ]) {
    assert.equal(includedFiles(route).some(isPdfRuntime), false, route);
  }
  assert.equal(JSON.stringify(config.outputFileTracingIncludes).includes("pdf-parse"), false);
});

test("FFmpeg is bundled for encoding routes without leaking into adjacent routes", () => {
  const includesFfmpeg = (route) =>
    includedFiles(route).some((file) => file.startsWith("./node_modules/ffmpeg-static/ffmpeg"));

  for (const route of [
    "/api/create/extract",
    "/api/discovery/intake",
    "/api/discovery/[eventId]/run",
    "/api/event-themes/generate",
    "/api/events/[id]/source-updates",
    "/api/history",
    "/api/livecard-builder/jobs",
    "/api/ocr",
    "/api/parse/[eventId]/enrich",
    "/api/signup-themes/generate",
    "/api/templates/media",
    "/api/upload",
    "/api/uploads/birthday-asset",
  ]) {
    assert.equal(includesFfmpeg(route), true, route);
  }

  for (const route of [
    "/api/create/classify",
    "/api/discovery/[eventId]/status",
    "/api/discovery/[eventId]/cancel",
    "/api/history/[id]",
    "/api/history/[id]/carpool",
    "/api/history/[id]/signup/recover",
    "/api/livecard-builder/location",
    "/api/uploads/unrelated",
    "/api/user/profile/avatar",
  ]) {
    assert.equal(includesFfmpeg(route), false, route);
  }
});
