/** Generate immutable full utility delivery before Next's parallel CSS workers. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import { filterUtilityEntries, homepageRuntimeSources, sha256, sourceHash, utilityDigest, utilityEntries, utilityNodes } from "./lib/runtime-utility-source.mjs";

const project = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(project, "src");
const stylesheet = path.join(sourceRoot, "app/globals.css");
const output = path.join(project, "output/runtime-utilities");
const source = await fs.readFile(stylesheet, "utf8");
const { files, dynamicImports } = await homepageRuntimeSources(project);
await fs.mkdir(output, { recursive: true });
const fixture = path.join(output, "homepage-runtime-sources.html");
await fs.writeFile(fixture, [...files.values()].join("\n"));
const criticalSource = source.replace('@import "tailwindcss";', '@import "tailwindcss" source(none);').replace(/^@source .*;\r?\n/gm, "") + `\n@source "${fixture.replaceAll("\\", "/")}";\n@source "../../tailwind.config.js";\n`;
const full = await postcss([tailwind({ base: sourceRoot, optimize: false })]).process(source, { from: stylesheet });
const critical = await postcss([tailwind({ base: sourceRoot, optimize: false })]).process(criticalSource, { from: stylesheet });
assert.deepEqual(full.warnings().map((warning) => warning.text), []);
assert.deepEqual(critical.warnings().map((warning) => warning.text), []);
const fullNodes = utilityNodes(full.root);
const fullEntries = utilityEntries(full.root);
const criticalEntries = utilityEntries(critical.root);
const fullRules = new Set(fullEntries.map(({ key, node }) => `${key}\n${node.toString()}`));
const criticalSelectors = criticalEntries.map(({ key }) => key);
for (const { key, node } of criticalEntries) assert.ok(fullRules.has(`${key}\n${node.toString()}`), `homepage utility changed: ${key}`);
// Explicit layer order keeps precedence identical if React hoists this resource
// before Next's root stylesheet on a direct request or a client transition.
const catalogSource = "@layer properties,theme,base,components,utilities;\n@layer utilities {\n" + fullNodes.map((node) => node.toString()).join("\n") + "\n}\n";
const minifiedCatalog = transform({ filename: "runtime-utilities.css", code: Buffer.from(catalogSource), minify: true }).code;
const catalogHash = sha256(minifiedCatalog).slice(0, 12);
const href = `/styles/runtime-utilities-${catalogHash}.css`;
const sourceHashes = Object.fromEntries([...files].map(([name, content]) => [name, sourceHash(content)]));
for (const name of ["scripts/build-runtime-utilities.mjs", "scripts/lib/runtime-utility-source.mjs", "scripts/lib/runtime-utility-postcss.cjs", "postcss.config.mjs", "tailwind.config.js", "src/app/globals.css"]) sourceHashes[name] = sourceHash(await fs.readFile(path.join(project, name)));
const metadata = {
  version: 1, href,
  fullUtilityHash: utilityDigest(fullEntries),
  fullUtilityRules: fullEntries.length,
  criticalUtilityRules: criticalEntries.length,
  criticalSelectors, sourceHashes, dynamicImports,
};
const outputs = new Map([
  [path.join(project, "public", href), minifiedCatalog],
  [path.join(project, "config/runtime-utilities.generated.json"), JSON.stringify(metadata, null, 2) + "\n"],
  [path.join(sourceRoot, "lib/runtime-utility-stylesheet.ts"), `// Generated before production compilation by scripts/build-runtime-utilities.mjs.\nexport const RUNTIME_UTILITY_STYLESHEET = "${href}";\n`],
]);
for (const [filename, content] of outputs) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (process.argv.includes("--check")) assert.deepEqual(await fs.readFile(filename), bytes, `stale utility delivery file: ${filename}; run node scripts/build-runtime-utilities.mjs`);
  else { await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(filename, bytes); }
}
const selected = new Set(criticalSelectors);
const filtered = full.root.clone();
filterUtilityEntries(filtered, selected);
const criticalMinified = transform({ filename: "globals.css", code: Buffer.from(filtered.toString()), minify: true }).code;
const fullMinified = transform({ filename: "globals.css", code: Buffer.from(full.css), minify: true }).code;
const evidence = { href, runtimeFiles: files.size, fullUtilityRules: fullEntries.length, criticalUtilityRules: criticalEntries.length, fullRoot: { bytes: fullMinified.length, gzipBytes: gzipSync(fullMinified).length }, criticalRoot: { bytes: criticalMinified.length, gzipBytes: gzipSync(criticalMinified).length }, utilityCatalog: { bytes: minifiedCatalog.length, gzipBytes: gzipSync(minifiedCatalog).length } };
await fs.writeFile(path.join(output, "generation.json"), JSON.stringify(evidence, null, 2));
await fs.writeFile(path.join(output, "full-utilities.unminified.css"), catalogSource);
await fs.writeFile(path.join(output, "critical-root.css"), criticalMinified);
console.log(JSON.stringify(evidence));
