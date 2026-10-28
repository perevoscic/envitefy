import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import React from "react";
import { renderToString } from "react-dom/server";
import plugin from "./lib/runtime-utility-postcss.cjs";
import { homepageRuntimeSources, sha256, sourceHash, utilityDigest, utilityEntries, utilityNodes } from "./lib/runtime-utility-source.mjs";

const project = path.resolve(import.meta.dirname, "..");
const stylesheet = path.join(project, "src/app/globals.css");
const metadataFile = path.join(project, "config/runtime-utilities.generated.json");
const require = createRequire(import.meta.url);
const loadTs = require("./lib/event-messages-test-loader.cjs");
const serial = (entry) => `${entry.key}\n${entry.node.toString()}`;

function withoutUtilities(root) {
  const copy = root.clone();
  copy.walkAtRules("layer", (layer) => { if (layer.params === "utilities") layer.remove(); });
  return copy.toString();
}

test("production critical utilities and complete deferred catalog preserve every original rule and cascade", { timeout: 60000 }, async () => {
  const metadata = JSON.parse(await fs.readFile(metadataFile, "utf8"));
  const source = await fs.readFile(stylesheet, "utf8");
  const full = await postcss([tailwind({ base: path.join(project, "src"), optimize: false })]).process(source, { from: stylesheet });
  const fullEntries = utilityEntries(full.root);
  assert.equal(utilityDigest(fullEntries), metadata.fullUtilityHash);
  const critical = await postcss([tailwind({ base: path.join(project, "src"), optimize: false }), plugin()]).process(source, { from: stylesheet });
  const criticalEntries = utilityEntries(critical.root);
  const selected = new Set(metadata.criticalSelectors);
  assert.deepEqual(criticalEntries.map(serial), fullEntries.filter((entry) => selected.has(entry.key)).map(serial), "critical overlap preserves declarations, duplicate selectors, ancestry and original relative order");
  assert.equal(withoutUtilities(critical.root), withoutUtilities(full.root), "all foundation, theme, properties, appearance, brand fonts and navigation rules stay byte-identical");
  assert.ok(criticalEntries.length < fullEntries.length / 3, "homepage receives a bounded utility subset");
  const catalogSource = "@layer properties,theme,base,components,utilities;\n@layer utilities {\n" + utilityNodes(full.root).map((node) => node.toString()).join("\n") + "\n}\n";
  const expected = transform({ filename: "runtime-utilities.css", code: Buffer.from(catalogSource), minify: true }).code;
  const catalog = await fs.readFile(path.join(project, "public", metadata.href));
  assert.deepEqual(catalog, expected, "full deferred stylesheet retains every original utility, including critical overlap, in original cascade order");
  assert.match(catalog.toString(), /^@layer properties,theme,base,components(?:,utilities;|;@layer utilities\{)/, "layer ordering is stable even when the full resource arrives before root CSS");
  assert.ok(metadata.href.includes(sha256(catalog).slice(0, 12)), "static utility asset is content-versioned");
  assert.deepEqual([...new Set([...criticalEntries, ...fullEntries].map(serial))].sort(), [...new Set(fullEntries.map(serial))].sort(), "critical plus deferred union is exactly the original utility set");
  const { files, dynamicImports } = await homepageRuntimeSources(project);
  for (const [relative, content] of files) assert.equal(metadata.sourceHashes[relative], sourceHash(content), `current homepage dependency covered: ${relative}`);
  for (const target of ["@/components/auth/AuthModal", "@/components/navigation/MenuBottomSheet", "@/components/navigation/ConciergeSheet", "@/components/landing/LandingLiveCardShowcase"]) assert.ok(dynamicImports.some((entry) => entry.target === target), `first-open widget retained: ${target}`);
  const stale = full.root.clone();
  utilityEntries(stale)[0].node.append({ prop: "--stale-test", value: "true" });
  await assert.rejects(postcss([plugin()]).process(stale, { from: stylesheet }), /Runtime utility delivery is stale.*npm run build/);
});

test("development keeps complete globals and production loader covers SSR route/session states", async () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "development";
    const dev = (await import("../postcss.config.mjs?runtime-development-test")).default;
    assert.equal(dev.plugins["./scripts/lib/runtime-utility-postcss.cjs"], undefined, "development never filters watched utility output");
    const render = (pathname, status) => {
      const Component = loadTs("src/components/RuntimeUtilityStyles.tsx", {
        "next/navigation": { usePathname: () => pathname },
        "next-auth/react": { useSession: () => ({ status }) },
      }).default;
      return renderToString(React.createElement(Component));
    };
    assert.equal(render("/birthdays/templates", "unauthenticated"), "", "development has no extra full-catalog request");
    process.env.NODE_ENV = "production";
    const prod = (await import("../postcss.config.mjs?runtime-production-test")).default;
    assert.deepEqual(prod.plugins["./scripts/lib/runtime-utility-postcss.cjs"], {});
    for (const pathname of ["/", "/landing"]) {
      assert.equal(render(pathname, "unauthenticated"), "");
      assert.equal(render(pathname, "loading"), "");
      assert.match(render(pathname, "authenticated"), /data-precedence="runtime-utilities".*href="\/styles\/runtime-utilities-|href="\/styles\/runtime-utilities-.*data-precedence="runtime-utilities"/);
    }
    for (const pathname of ["/birthdays/templates", "/birthdays/templates/example/customize", "/event/saved", null]) assert.match(render(pathname, "unauthenticated"), /rel="stylesheet".*\/styles\/runtime-utilities-/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test("LF and CRLF checkouts produce the same manifest keys, utility digest and delivered CSS", { timeout: 60000 }, async () => {
  const source = (await fs.readFile(stylesheet, "utf8")).replaceAll("\r\n", "\n");
  const metadata = JSON.parse(await fs.readFile(metadataFile, "utf8"));
  const originalCatalog = await fs.readFile(path.join(project, "public", metadata.href));
  const variants = [];
  for (const input of [source, source.replaceAll("\n", "\r\n")]) {
    const full = await postcss([tailwind({ base: path.join(project, "src"), optimize: false })]).process(input, { from: stylesheet });
    const entries = utilityEntries(full.root);
    assert.equal(utilityDigest(entries), metadata.fullUtilityHash, "platform line endings do not stale the declaration manifest");
    const catalogSource = "@layer properties,theme,base,components,utilities;\n@layer utilities {\n" + utilityNodes(full.root).map((node) => node.toString()).join("\n") + "\n}\n";
    assert.deepEqual(transform({ filename: "runtime-utilities.css", code: Buffer.from(catalogSource), minify: true }).code, originalCatalog, "full catalog bytes remain platform-independent");
    const critical = await postcss([plugin()]).process(full.root.clone(), { from: stylesheet });
    variants.push({ keys: utilityEntries(critical.root).map((entry) => entry.key), css: transform({ filename: "globals.css", code: Buffer.from(critical.css), minify: true }).code });
  }
  assert.deepEqual(variants[0].keys, variants[1].keys, "multiline auth selectors and keyframes have stable manifest keys");
  assert.deepEqual(variants[0].css, variants[1].css, "critical stylesheet output is unchanged by checkout line endings");
});
