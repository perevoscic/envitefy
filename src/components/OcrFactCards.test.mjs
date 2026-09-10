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

const repoRoot = process.cwd();

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
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(path.join(repoRoot, "src/components/OcrFactCards.tsx"), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
      require: (name) =>
      name === "lucide-react"
        ? new Proxy({}, { get: () => (props) => createElement("svg", props) })
        : name === "@/lib/ocr/facts"
        ? { coalesceFactValues }
        : name === "@/lib/ocr/contact-numbers"
          ? { combinePhoneAndFaxCards, contactNumberLabel }
          : require(name),
  });
  const facts = [
    { label: "Phone", value: "(555) 010-0100" },
    { label: "Fax", value: "(555) 010-0101" },
  ];
  const markup = renderToStaticMarkup(
    createElement(module.exports.default, { facts, compact: true, combinePhoneAndFax: true }),
  );
  assert.equal((markup.match(/<section\b/g) || []).length, 1);
  assert.match(markup, /Phone &amp; Fax/);
  assert.match(markup, /<dt[^>]*>Phone<\/dt><dd[^>]*>\(555\) 010-0100<\/dd>/);
  assert.match(markup, /<dt[^>]*>Fax<\/dt><dd[^>]*>\(555\) 010-0101<\/dd>/);
  const separate = renderToStaticMarkup(createElement(module.exports.default, { facts }));
  assert.equal((separate.match(/<section\b/g) || []).length, 2);
});
