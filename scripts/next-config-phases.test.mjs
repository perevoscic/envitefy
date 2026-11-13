import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

test("only a production build generates runtime CSS; dev and typegen never rewrite the watched manifest", async () => {
  const phases = createRequire(import.meta.url)("next/constants");
  let generated = 0;
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(new URL("../next.config.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "next/constants") return phases;
    if (name === "./src/data/baby-shower-retired-designs.json") return {};
    if (name === "./src/data/repository-image-migrations.json") return [];
    if (name === "./scripts/lib/runtime-styles.mjs") return { generateRuntimeStyles: async () => { generated++; } };
    throw new Error(`Unexpected config dependency: ${name}`);
  }, module, module.exports);
  for (const phase of [phases.PHASE_DEVELOPMENT_SERVER, phases.PHASE_PRODUCTION_SERVER, undefined]) {
    await module.exports.default(phase);
    assert.equal(generated, 0);
  }
  const development = await module.exports.default(phases.PHASE_DEVELOPMENT_SERVER);
  assert.match(development.distDir, /^\.next-dev/);
  await module.exports.default(phases.PHASE_PRODUCTION_BUILD);
  assert.equal(generated, 1, "production still generates canonical and landing styles before compilation");
});
