import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const { nodeFileTrace } = require("next/dist/compiled/@vercel/nft");
const ts = require("typescript");
const load = require("./lib/event-messages-test-loader.cjs");
const root = fileURLToPath(new URL("../", import.meta.url));
const normalize = (value) => value.split(path.sep).join("/");

test("font filenames accept the bundled catalog and reject paths outside its directory", () => {
  const { CARD_FONTS } = load(path.join(root, "src/lib/shared-card-design.ts"));
  const { cardFontFilename } = load(path.join(root, "src/lib/card-font-coverage.ts"));
  for (const font of Object.values(CARD_FONTS)) {
    assert.equal(cardFontFilename(font.url), path.posix.basename(font.url), font.url);
  }
  for (const url of [
    "/fonts/gallery/playfairdisplay.ttf",
    "/templates/birthdays/card.ttf",
    "/fonts/birthday/../gallery/playfairdisplay.ttf",
    "/fonts/birthday/../../secret.ttf",
    "/fonts/birthday/%2e%2e/secret.ttf",
    "/fonts/birthday/nested/font.ttf",
    "/fonts/birthday/..\\secret.ttf",
    "\\fonts\\birthday\\playfairdisplay.ttf",
    "https://example.com/fonts/birthday/playfairdisplay.ttf",
    "//example.com/fonts/birthday/playfairdisplay.ttf",
    "/fonts/birthday/playfairdisplay.ttf?download=1",
    "/fonts/birthday/playfairdisplay.ttf#font",
    "/fonts/birthday/playfairdisplay.woff2",
    "playfairdisplay.ttf",
    "",
  ]) {
    assert.throws(() => cardFontFilename(url), undefined, url || "empty filename");
  }
});

test("font coverage traces bundled fonts without collecting unrelated public artwork", async () => {
  const { fileList, warnings } = await nodeFileTrace([path.join(root, "src/lib/card-font-coverage.ts")], {
    base: root,
    processCwd: root,
    async readFile(filename) {
      try {
        const source = await fs.readFile(filename, "utf8");
        return filename.endsWith(".ts")
          ? ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
          : source;
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "EISDIR") return null;
        throw error;
      }
    },
  });
  const parsingFailures = [...warnings].filter((warning) => warning.message.startsWith("Failed to parse"));
  assert.deepEqual(parsingFailures.map((warning) => warning.message), [], "the tracer must inspect valid application code");
  const publicFiles = [...fileList].map(normalize).filter((file) => file.startsWith("public/"));
  assert.ok(publicFiles.length > 0, "font files must remain deployable");
  assert.deepEqual(publicFiles.filter((file) => !file.startsWith("public/fonts/birthday/")), [], "a font read must not pull template galleries, images or videos into the function");
  const { CARD_FONTS } = load(path.join(root, "src/lib/shared-card-design.ts"));
  for (const font of Object.values(CARD_FONTS)) {
    assert.ok(publicFiles.includes(`public${font.url}`), `${font.url} must be available to the font reader`);
  }
  const publicBytes = (await Promise.all(publicFiles.map((file) => fs.stat(path.join(root, file)))))
    .reduce((sum, stat) => sum + stat.size, 0);
  assert.ok(publicBytes < 5_000_000, `bundled lettering fonts should stay below 5 MB; traced ${publicBytes} bytes`);
});

test("development campaign adapters do not infer QA evidence as production assets", async (t) => {
  // A clean checkout has no campaign evidence. Seed a small, owned fixture so
  // the positive control exercises the same asset inference on every machine.
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-adapter-trace-"));
  t.after(() => fs.rm(fixtureRoot, { recursive: true, force: true }));
  await fs.mkdir(path.join(fixtureRoot, "src/lib"), { recursive: true });
  await fs.mkdir(path.join(fixtureRoot, ".qa/create-campaign/run"), { recursive: true });
  await fs.writeFile(path.join(fixtureRoot, ".qa/create-campaign/run/evidence.txt"), "private QA evidence");
  await fs.writeFile(path.join(fixtureRoot, "package.json"), '{"type":"module"}');
  const entries = await Promise.all(["campaign-media.ts", "mail-transport.ts"].map(async filename => {
    const target = path.join(fixtureRoot, "src/lib", filename);
    await fs.copyFile(path.join(root, "src/lib", filename), target);
    return target;
  }));
  const campaignFile = entries[0];
  async function traceAdapters(legacyProbe = false) {
    const qaRequests = [];
    const result = await nodeFileTrace(entries, {
      base: fixtureRoot,
      processCwd: fixtureRoot,
      ignore(filename) {
        const relative = normalize(filename);
        if (/(?:^|\/)\.qa(?:\/|$)/.test(relative)) {
          qaRequests.push(relative);
          return true; // Detect the inference without scanning local evidence.
        }
        return /(?:^|\/)node_modules(?:\/|$)/.test(relative);
      },
      async readFile(filename) {
        try {
          let source = await fs.readFile(filename, "utf8");
          if (legacyProbe && path.resolve(filename) === campaignFile) {
            // Prove that this bounded probe detects the former static-root read.
            source += '\nexport async function legacyTraceProbe() { return realpath(path.join(process.cwd(), ".qa", "create-campaign")); }\n';
          }
          return filename.endsWith(".ts")
            ? ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
            : source;
        } catch (error) {
          if (error.code === "ENOENT" || error.code === "EISDIR") return null;
          throw error;
        }
      },
    });
    const parsingFailures = [...result.warnings].filter((warning) => warning.message.startsWith("Failed to parse"));
    assert.deepEqual(parsingFailures.map((warning) => warning.message), []);
    return qaRequests;
  }
  assert.deepEqual(await traceAdapters(), [], "development adapters must not request the QA directory tree");
  assert.ok((await traceAdapters(true)).length > 0, "the regression probe must detect the former absolute-root read");
});
