import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { Scanner } from "@tailwindcss/oxide";
import {
  compileRuntimeStyles,
  createLandingStylesheet,
  describeRuntimeStylesheet,
  LANDING_STYLE_SOURCES,
  selectGalleryFontFaces,
  writeRuntimeStyles,
} from "./lib/runtime-styles.mjs";

const root = path.resolve(import.meta.dirname, "..");

function fontDescriptors(css) {
  const faces = [];
  postcss.parse(css).walkAtRules("font-face", (rule) => {
    faces.push(rule.nodes.map((node) => `${node.prop}:${node.value}`).join(";"));
  });
  return faces.sort();
}

async function sourceFiles(filename) {
  const entry = await stat(filename);
  if (!entry.isDirectory()) return /\.(?:[cm]?[jt]sx?|json|mdx?|html)$/.test(filename) ? [filename] : [];
  const files = [];
  for (const name of await readdir(filename)) {
    if (["__tests__", "__fixtures__", "fixtures"].includes(name) || /\.(?:test|spec|stories|story)\./.test(name)) continue;
    files.push(...await sourceFiles(path.join(filename, name)));
  }
  return files;
}

function utilityRules(css) {
  const rules = new Map();
  postcss.parse(css).walkAtRules("layer", (layer) => {
    if (layer.params !== "utilities") return;
    for (const node of layer.nodes || []) {
      if (node.type !== "rule" || !node.selector.startsWith(".")) continue;
      const candidate = node.selector.slice(1).replace(/\\([\da-f]{1,6})(?:\s)?|\\(.)/gi,
        (_, hex, character) => hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : character);
      rules.set(candidate, node.toString());
    }
  });
  return rules;
}

test("landing CSS uses explicit sources and preserves base rules and negative source boundaries", () => {
  const input = '@import "tailwindcss";\n@import "./gallery-fonts.css";\n@source "../../tailwind.config.js";\n@source not "../**/*.test.*";\n:root { --app-ink: black; }';
  const output = createLandingStylesheet(input, { sources: ["./landing", "../components/auth"] });
  assert.match(output, /@import "tailwindcss" source\(none\)/);
  assert.match(output, /@source "\.\/landing"/);
  assert.match(output, /@source not "\.\.\/\*\*\/\*\.test\.\*"/);
  assert.match(output, /--app-ink: black/);
  assert.doesNotMatch(output, /gallery-fonts|tailwind\.config/);
  assert.throws(() => createLandingStylesheet(input, { sources: ['bad"path'] }), /Invalid/);
  assert.throws(() => createLandingStylesheet('@import "tailwindcss";'), /canonical/);
});

test("public font detection retains complete families, language ranges and referenced font variables", () => {
  const faces = [
    "@font-face{font-family:'Example Sans';font-weight:100 900;src:url(/example-latin.woff2);unicode-range:U+0000-00FF}",
    "@font-face{font-family:'Example Sans';font-weight:100 900;src:url(/example-greek.woff2);unicode-range:U+0370-03FF}",
    "@font-face{font-family:'Other Serif';font-weight:400;src:url(/other.woff2)}",
  ];
  const catalog = faces.join("\n");
  assert.equal(selectGalleryFontFaces(catalog, "font-family:var(--font-example)", ":root{--font-example:'Example Sans',sans-serif}"), faces.slice(0, 2).join("\n"));
  assert.equal(selectGalleryFontFaces(catalog, "font-family:Other Serif;"), faces[2]);
  assert.equal(selectGalleryFontFaces(catalog, 'const family = "Other Serif, Georgia";'), faces[2]);
  assert.equal(selectGalleryFontFaces(catalog, "Example Sans is mentioned in a comment"), "");
  const input = '@import "tailwindcss";\n@import "./gallery-fonts.css";\n@import "./base.css";\nbody{margin:0}';
  const output = createLandingStylesheet(input, { sources: [], galleryFontCss: faces[2] });
  assert.ok(output.indexOf('@import "./base.css"') < output.indexOf("@font-face"), "font substitution must not invalidate subsequent CSS imports");
});

test("hashed assets are deterministic, preserve older versions and avoid unchanged writes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "envitefy-runtime-css-"));
  try {
    const options = { outputDirectory: path.join(directory, "assets"), manifestPath: path.join(directory, "manifest.json"), deploymentId: "" };
    const css = ":root{--app-ink:#000}";
    const application = { css, ...describeRuntimeStylesheet(css, "application") };
    const landing = { css: ".flex{display:flex}", ...describeRuntimeStylesheet(".flex{display:flex}", "landing") };
    const first = await writeRuntimeStyles({ application, landing }, options);
    const filename = path.join(options.outputDirectory, path.basename(first.application.href));
    const original = await stat(filename);
    assert.deepEqual(await writeRuntimeStyles({ application, landing }, options), first);
    assert.equal((await stat(filename)).mtimeMs, original.mtimeMs);
    const changed = "body{color:#222}";
    const second = await writeRuntimeStyles({ application: { css: changed, ...describeRuntimeStylesheet(changed, "application") }, landing }, options);
    assert.notEqual(second.application.href, first.application.href);
    assert.equal(await readFile(filename, "utf8"), css);
    assert.equal((await readdir(options.outputDirectory)).length, 3);
    assert.deepEqual(JSON.parse(await readFile(options.manifestPath, "utf8")), second);
    const pinned = await writeRuntimeStyles({ application, landing }, { ...options, deploymentId: "dpl_example/value" });
    assert.equal(pinned.application.href, `${first.application.href}?dpl=dpl_example%2Fvalue`);
    assert.equal(pinned.landing.href, `${first.landing.href}?dpl=dpl_example%2Fvalue`);
    assert.equal((await readdir(options.outputDirectory)).length, 3, "deployment pins do not create differently named CSS files");
    assert.equal(await readFile(filename, "utf8"), css);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("production application CSS preserves the canonical output and landing retains public utilities and fonts", { timeout: 60000 }, async () => {
  const compiled = await compileRuntimeStyles({ root });
  const filename = path.join(root, "src/app/globals.css");
  const reference = await postcss([
    tailwind({ base: path.join(root, "src"), optimize: { minify: true } }),
  ]).process(await readFile(filename, "utf8"), { from: filename, map: false });
  assert.equal(compiled.application.css, reference.css, "the complete application CSS must remain identical");
  const fullFaces = fontDescriptors(compiled.application.css);
  const publicFaces = fontDescriptors(compiled.landing.css);
  assert.ok(fullFaces.length > 650, "every catalog font remains in the full stylesheet");
  assert.ok(publicFaces.length >= 27, "birthday and brand font descriptors remain available");
  for (const face of publicFaces) assert.ok(fullFaces.includes(face), `public font changed: ${face}`);
  for (const utility of [".fixed{", ".flex{", ".sr-only{", ".antialiased{", ".pointer-events-none{"]) {
    assert.ok(compiled.landing.css.includes(utility), `public utility absent: ${utility}`);
  }
  assert.ok(compiled.landing.gzipBytes < compiled.application.gzipBytes * 0.65,
    `expected substantial public CSS reduction: ${compiled.landing.gzipBytes}/${compiled.application.gzipBytes}`);
  assert.deepEqual(describeRuntimeStylesheet(compiled.landing.css, "landing"),
    Object.fromEntries(Object.entries(compiled.landing).filter(([key]) => key !== "css")));

  // Independently scan the conservative public dependency set. Every candidate
  // that produces a canonical utility must retain its exact declarations.
  const source = await readFile(filename, "utf8");
  const files = [...new Set((await Promise.all(LANDING_STYLE_SOURCES.map((entry) =>
    sourceFiles(path.resolve(path.dirname(filename), entry))))).flat())];
  const candidates = new Set(new Scanner({}).scanFiles(await Promise.all(files.map(async (file) => ({
    content: await readFile(file, "utf8"), extension: path.extname(file).slice(1),
  })))));
  const full = await postcss([tailwind({ base: path.join(root, "src"), optimize: false })])
    .process(source, { from: filename, map: false });
  const lean = await postcss([tailwind({ base: path.join(root, "src"), optimize: false })])
    .process(createLandingStylesheet(source), { from: path.join(root, "src/app/.runtime-landing.css"), map: false });
  const fullRules = utilityRules(full.css);
  const publicRules = utilityRules(lean.css);
  let checked = 0;
  for (const candidate of candidates) {
    if (!fullRules.has(candidate)) continue;
    assert.equal(publicRules.get(candidate), fullRules.get(candidate), `public utility changed: ${candidate}`);
    checked++;
  }
  assert.ok(checked > 400, `expected substantial public utility coverage, checked ${checked}`);
});
