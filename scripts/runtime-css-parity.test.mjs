import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { Scanner } from "@tailwindcss/oxide";
import { createRequire } from "node:module";
import config from "../postcss.config.mjs";

const project = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(project, "src");
const stylesheet = path.join(sourceRoot, "app/globals.css");
const { safelist } = createRequire(import.meta.url)("../tailwind.config.js");

async function runtimeFiles(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (["__tests__", "__fixtures__", "fixtures", "generated"].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await runtimeFiles(filename));
    else if (!/\.(?:test|spec|stories|story)\./.test(entry.name) && /\.(?:[cm]?[jt]sx?|json|mdx?|html)$/.test(entry.name)) result.push(filename);
  }
  return result;
}

function unescapeClass(selector) {
  return selector.slice(1).replace(/\\([\da-f]{1,6})(?:\s)?|\\(.)/gi, (_, hex, character) =>
    hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : character,
  );
}

function utilityRules(css) {
  const result = new Map();
  postcss.parse(css).walkAtRules("layer", (layer) => {
    if (layer.params !== "utilities") return;
    for (const node of layer.nodes || []) {
      if (node.type === "rule" && node.selector.startsWith(".")) {
        result.set(unescapeClass(node.selector), node.toString());
      }
    }
  });
  return result;
}

function fontFaces(css) {
  const result = [];
  postcss.parse(css).walkAtRules("font-face", (node) => result.push(node.toString()));
  return result;
}

test("runtime CSS keeps application utilities and every font while excluding verification and tooling", { timeout: 60000 }, async () => {
  const options = config.plugins["@tailwindcss/postcss"];
  assert.equal(path.resolve(options.base), sourceRoot);
  const source = await fs.readFile(stylesheet, "utf8");
  // Keep the original import available to fixtures that provide their own explicit sources.
  assert.ok(source.includes('@import "tailwindcss";'));
  const broadSource = source.replace(/^@source not .*;\r?\n/gm, "");
  const broad = await postcss([tailwind({ base: project, optimize: false })]).process(broadSource, { from: stylesheet });
  const scoped = await postcss([tailwind({ ...options, optimize: false })]).process(source, { from: stylesheet });
  const broadRules = utilityRules(broad.css);
  const scopedRules = utilityRules(scoped.css);

  // Scan the real runtime files independently of PostCSS's configured directory/glob scanner.
  const files = await runtimeFiles(sourceRoot);
  const candidates = new Set(new Scanner({}).scanFiles(await Promise.all(files.map(async (file) => ({
    content: await fs.readFile(file, "utf8"),
    extension: path.extname(file).slice(1),
  })))));
  let checked = 0;
  for (const candidate of candidates) {
    if (!broadRules.has(candidate)) continue;
    assert.equal(scopedRules.get(candidate), broadRules.get(candidate), `runtime utility changed: ${candidate}`);
    checked++;
  }
  assert.ok(checked > 1000, `expected broad application coverage, checked ${checked} utilities`);
  for (const candidate of safelist) {
    assert.ok(broadRules.has(candidate), `configured dynamic utility exists: ${candidate}`);
    assert.equal(scopedRules.get(candidate), broadRules.get(candidate), `configured dynamic utility changed: ${candidate}`);
  }
  assert.deepEqual(fontFaces(scoped.css), fontFaces(broad.css), "font descriptors and Unicode coverage stay identical");
  assert.deepEqual(scoped.warnings().map((warning) => warning.text), []);

  const dependencies = scoped.messages.filter((message) => message.type === "dependency").map((message) => message.file);
  assert.ok(dependencies.every((file) => !/\.(?:test|spec|stories|story)\./.test(file)), "colocated verification sources are excluded");
  assert.ok(dependencies.every((file) => !file.startsWith(path.join(project, "scripts") + path.sep)), "tooling cannot add production classes");
  assert.ok(dependencies.every((file) => !file.startsWith(path.join(project, "docs") + path.sep)), "documentation cannot add production classes");
  const directories = scoped.messages.filter((message) => message.type === "dir-dependency").map((message) => message.dir);
  assert.ok(directories.length > 0);
  assert.ok(directories.every((directory) => directory === sourceRoot || directory.startsWith(sourceRoot + path.sep)), "automatic source watching stays inside src");

  const output = path.join(project, "output/performance-css");
  await fs.mkdir(output, { recursive: true });
  const optimized = [];
  for (const [label, input, base] of [["before", broadSource, project], ["after", source, sourceRoot]]) {
    const result = await postcss([tailwind({ base, optimize: { minify: true } })]).process(input, { from: stylesheet });
    await fs.writeFile(path.join(output, `${label}-runtime-parity.css`), result.css);
    optimized.push({ label, decodedBytes: Buffer.byteLength(result.css), gzipBytes: gzipSync(result.css).length });
  }
  const evidence = {
    runtimeFiles: files.length,
    identicalRuntimeUtilities: checked,
    identicalSafelistedUtilities: new Set(safelist).size,
    identicalFontFaces: fontFaces(scoped.css).length,
    removedNonRuntimeUtilities: [...broadRules.keys()].filter((candidate) => !scopedRules.has(candidate)).length,
    stylesheets: optimized,
  };
  await fs.writeFile(path.join(output, "runtime-parity.json"), JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify(evidence));
});
