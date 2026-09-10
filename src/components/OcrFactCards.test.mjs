import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { coalesceFactValues } from "../lib/ocr/facts.ts";
import { combinePhoneAndFaxCards, contactNumberLabel } from "../lib/ocr/contact-numbers.ts";
import { splitEventDetailLinks } from "../utils/event-detail-links.ts";
import { buildPreferredDirectionsHref } from "../lib/directions.ts";

const repoRoot = process.cwd();

function loadComponent(filename) {
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(repoRoot, "src/components", filename), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name === "lucide-react") return new Proxy({}, { get: () => (props) => createElement("svg", props) });
      if (name === "@/lib/ocr/facts") return { coalesceFactValues };
      if (name === "@/lib/ocr/contact-numbers") return { combinePhoneAndFaxCards, contactNumberLabel };
      if (name === "../utils/event-detail-links") return { splitEventDetailLinks };
      if (name === "@/lib/directions") return { buildPreferredDirectionsHref };
      if (name === "./EventDetailText") return loadComponent("EventDetailText.tsx");
      if (name === "./LocationLink") return loadComponent("LocationLink.tsx");
      return require(name);
    },
  });
  return module.exports;
}

test("OcrFactCards coalesces host fragments and avoids 2-col for short pairs", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/components/OcrFactCards.tsx"), "utf8");

  assert.match(source, /coalesceFactValues/);
  assert.match(source, /iconForFactLabel/);
  assert.match(source, /Users className="h-5 w-5"/);
  assert.match(source, /fact\.values\.length >= 3 && fact\.values\.every/);
  assert.match(source, /compact \? "sm:grid-cols-2" : "grid-cols-2"/);
  assert.match(source, /space-y-2/);
});

test("medical contact details render as one card with labelled Phone and Fax values", () => {
  const OcrFactCards = loadComponent("OcrFactCards.tsx").default;
  const facts = [
    { label: "Phone", value: "(555) 010-0100" },
    { label: "Fax", value: "(555) 010-0101" },
  ];
  const markup = renderToStaticMarkup(
    createElement(OcrFactCards, { facts, compact: true, combinePhoneAndFax: true }),
  );
  assert.equal((markup.match(/<section\b/g) || []).length, 1);
  assert.match(markup, /Phone &amp; Fax/);
  assert.match(markup, /<dt[^>]*>Phone<\/dt><dd[^>]*><a href="tel:5550100100"[^>]*>\(555\) 010-0100<\/a><\/dd>/);
  assert.match(markup, /<dt[^>]*>Fax<\/dt><dd[^>]*><a href="tel:5550100101"[^>]*>\(555\) 010-0101<\/a><\/dd>/);
  const separate = renderToStaticMarkup(createElement(OcrFactCards, { facts }));
  assert.equal((separate.match(/<section\b/g) || []).length, 2);
});

test("contact facts render email and maps links while preview facts stay inert", () => {
  const OcrFactCards = loadComponent("OcrFactCards.tsx").default;
  const facts = [
    { label: "Email", value: "care@example.com" },
    { label: "Address", value: "123 Main St, Chicago, IL 60601" },
    { label: "Patient ID", value: "1234567890" },
  ];
  const markup = renderToStaticMarkup(createElement(OcrFactCards, { facts }));
  assert.match(markup, /href="mailto:care@example.com"/);
  assert.match(markup, /href="https:\/\/www.google.com\/maps\/search\/\?api=1&amp;query=123%20Main%20St%2C%20Chicago%2C%20IL%2060601"/);
  assert.doesNotMatch(markup, /tel:1234567890/);
  assert.match(markup, /focus-visible:outline-2/);
  const preview = renderToStaticMarkup(createElement(OcrFactCards, { facts, interactive: false }));
  assert.doesNotMatch(preview, /<a\b/);
  assert.match(preview, /care@example.com/);
});
