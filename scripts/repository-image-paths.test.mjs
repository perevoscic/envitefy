import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const records = JSON.parse(fs.readFileSync("src/data/repository-image-migrations.json", "utf8"));

test("every retired public image URL redirects to an existing WebP, including encoded filenames", async () => {
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync("next.config.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name.startsWith("./src/data/")) return JSON.parse(fs.readFileSync(name, "utf8"));
    return require(name);
  }, module, module.exports);
  const config = await module.exports.default(require("next/constants").PHASE_PRODUCTION_SERVER);
  const redirects = await config.redirects();
  const { getPathMatch } = require("next/dist/shared/lib/router/utils/path-match");
  for (const { source, destination } of records.filter(({ source }) => source.startsWith("public/"))) {
    const oldUrl = encodeURI(source.slice(6));
    const rule = redirects.find((entry) => getPathMatch(entry.source)(oldUrl));
    assert.ok(rule, `missing old URL redirect: ${oldUrl}`);
    assert.equal(rule.destination, encodeURI(destination.slice(6)));
    assert.equal(rule.permanent, true);
    assert.ok(fs.existsSync(destination), `missing destination: ${destination}`);
    assert.ok(!fs.existsSync(source), `verified original was not removed: ${source}`);
  }
});

test("current application and template code has no references to removed image paths", () => {
  const retired = records.flatMap(({ source }) => [source,
    ...(source.startsWith("public/") ? [source.slice(6)] : []),
    ...(source.startsWith("src/") ? [`@/${source.slice(4)}`] : []),
  ]);
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) { walk(filename); continue; }
      if (!/\.(tsx?|json|css)$/.test(filename) || filename.endsWith("repository-image-migrations.json")) continue;
      const source = fs.readFileSync(filename, "utf8");
      for (const old of retired) assert.ok(!source.includes(old), `${filename} still references ${old}`);
    }
  }
  walk("src");
  walk("templates");
});
