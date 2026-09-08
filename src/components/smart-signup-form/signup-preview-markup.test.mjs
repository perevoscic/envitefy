import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(relative, mocks, cache = new Map()) {
  const file = path.resolve(relative);
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  function require(name) {
    if (name in mocks) return mocks[name];
    if (name.endsWith(".css"))
      return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/")
      ? path.resolve("src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync), mocks, cache);
  }
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const baseMocks = {
  "next/navigation": { useRouter: () => ({}) },
  "@/components/EventDeleteModal": { __esModule: true, default: () => null },
  "@/components/templates/TemplateEditorContext": { useTemplateEditor: () => null },
  "@/utils/media-upload-client": { validateClientUploadFile: () => null },
  "@/utils/thumbnail": { readFileAsDataUrl: async () => "" },
};
const { createSignupThemeForm } = load("src/lib/signup-starters.ts", baseMocks);

test("every signup catalog item renders a square inert full-page preview with demo content", () => {
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts", baseMocks);
  const Preview = load(
    "src/components/smart-signup-form/SignupTemplatePreview.tsx",
    baseMocks,
  ).default;
  for (const template of getPublicTemplates("signup-forms")) {
    const html = renderToStaticMarkup(React.createElement(Preview, { template }));
    assert.match(html, /data-template-thumbnail-preview="true"/);
    assert.match(html, /aria-hidden="true" inert=""/);
    assert.match(html, /aspect-square/);
    assert.match(html, /scale-\[0\.25\]/);
    assert.match(html, /data-signup-theme=/);
    assert.match(html, /Hosted by/);
    assert.match(html, /2028/);
    assert.equal((html.match(/data-signup-slot="true"/g) || []).length, 4, template.id);
    assert.ok(!html.includes("Date to be announced"), template.id);
    assert.ok(!html.includes("Location to be announced"), template.id);
  }
});

function verifyMarkup(html) {
  let depth = 0;
  for (const tag of html.matchAll(/<\/?button\b[^>]*>/g)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    assert.ok(depth >= 0 && depth <= 1, "A button must never contain another button");
  }
  assert.equal(depth, 0);
  assert.equal((html.match(/aria-label="Use [^"]+ theme"/g) || []).length, 6);
  const thumbnails = [
    ...html.matchAll(/<div(?=[^>]*data-template-thumbnail-preview="true")[^>]*>/g),
  ];
  assert.ok(thumbnails.length >= 6);
  for (const [tag] of thumbnails) {
    assert.ok(tag.includes('aria-hidden="true"'));
    assert.ok(tag.includes('inert=""'));
  }
  // The whole preview must remain outside the selection button, even when passive today.
  const selectionButtons = [
    ...html.matchAll(/<button[^>]*aria-label="Use [^"]+ theme"[^>]*>([\s\S]*?)<\/button>/g),
  ];
  for (const [, contents] of selectionButtons) assert.ok(!contents.includes("data-signup-theme"));
}

test("theme picker renders real signup previews outside selection buttons", () => {
  const Panel = load("src/components/smart-signup-form/SignupDesignPanel.tsx", baseMocks).default;
  verifyMarkup(
    renderToStaticMarkup(
      React.createElement(Panel, { form: createSignupThemeForm("harvest-table"), onChange() {} }),
    ),
  );
});

test("theme-card HTML stays valid if a future preview includes an interactive control", () => {
  const Panel = load("src/components/smart-signup-form/SignupDesignPanel.tsx", {
    ...baseMocks,
    "./SignupPageRenderer": {
      __esModule: true,
      default: () =>
        React.createElement(
          "div",
          { "data-signup-theme": "test" },
          React.createElement("button", { type: "button", disabled: true }, "Select"),
        ),
    },
  }).default;
  verifyMarkup(
    renderToStaticMarkup(
      React.createElement(Panel, { form: createSignupThemeForm("harvest-table"), onChange() {} }),
    ),
  );
});
