import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function loadBrandImage() {
  const filename = path.resolve("src/components/branding/EnvitefyBrandImage.tsx");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = (specifier) => specifier.endsWith(".module.css")
    ? { imageSwitch: "image-switch", colorImage: "color-image", whiteImage: "white-image" }
    : require(specifier);
  loaded._compile(compiled, filename);
  return loaded.exports.default;
}

test("prepared brand images use their static URLs with real Next Image delivery", () => {
  const BrandImage = loadBrandImage();
  const sources = ["/brand/wordmark-v2/envitefy-wordmark.webp", "/brand/wordmark-v2/envitefy-wordmark-white.webp"];
  const html = renderToStaticMarkup(React.createElement(BrandImage, {
    src: { src: sources[0], width: 1094, height: 401 },
    whiteSrc: { src: sources[1], width: 1094, height: 401 },
    width: 196, height: 72, priority: true, alt: "Envitefy",
  }));
  const images = html.match(/<img\b[^>]*>/g) || [];
  assert.equal(images.length, 2);
  for (const [index, source] of sources.entries()) {
    assert.ok(images[index].includes(`src="${source}"`), `missing direct brand asset ${source}`);
    assert.ok(images[index].includes('width="196"') && images[index].includes('height="72"'), "rendered size remains explicit");
    assert.ok(images[index].includes(index ? 'class="white-image' : 'class="color-image'), "both appearance variants remain available to CSS");
    assert.ok(images[index].includes('aria-hidden="true"'), "appearance variants do not duplicate the accessible name");
  }
  assert.ok(!html.includes("/_next/image"), "brand delivery must not depend on an optimizer request");
  assert.ok(html.includes('aria-label="Envitefy"'), "the pair retains one accessible brand name");
});

test("responsive prepared wordmarks preserve static delivery and reserve truthful proportions", () => {
  const BrandImage = loadBrandImage();
  const html = renderToStaticMarkup(React.createElement(BrandImage, {
    src: "/brand/wordmark-v2/envitefy-wordmark.webp",
    whiteSrc: "/brand/wordmark-v2/envitefy-wordmark-white.webp",
    preparedSrcSet: "/brand/responsive-v1/wordmark-150.webp 150w, /brand/responsive-v1/wordmark-300.webp 300w",
    whitePreparedSrcSet: "/brand/responsive-v1/wordmark-white-150.webp 150w, /brand/responsive-v1/wordmark-white-300.webp 300w",
    width: 1194, height: 402, sizes: "150px", alt: "Envitefy",
  }));
  const images = html.match(/<img\b[^>]*>/g) || [];
  assert.equal(images.length, 2);
  for (const img of images) {
    assert.ok(img.includes('width="1194"') && img.includes('height="402"'));
    assert.ok(img.includes('sizes="150px"') && img.includes('srcSet="/brand/responsive-v1/'));
    assert.ok(img.includes('loading="lazy"'), "hidden header appearance variants are not eagerly fetched");
  }
  assert.ok(!html.includes('rel="preload"'), "the header does not preload both appearance variants");
  assert.ok(!html.includes("/_next/image"));
  assert.equal((html.match(/aria-label="Envitefy"/g) || []).length, 1);
});
