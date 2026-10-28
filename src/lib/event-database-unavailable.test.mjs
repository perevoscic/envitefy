import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { isDatabaseUnavailableError } from "./database-errors.ts";

const require = createRequire(import.meta.url);
const source = ts.createSourceFile("page.tsx", readFileSync(new URL("../app/event/[id]/page.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = new Set(["getEventMetadataRow", "EventPage"]);
const code = ts.transpileModule(source.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text)).map(node => node.getText(source)).join("\n") + "\nexport { getEventMetadataRow };", {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function harness(lookup) {
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, require, URLSearchParams,
    isDatabaseUnavailableError, console: { warn() {} },
    getCachedEventHistoryBySlugOrId: lookup, RenderEventPage: lookup,
  });
  return module.exports;
}

test("metadata preserves events and falls back only on database outages", async () => {
  const row = { id: "event", data: { title: "Party" } };
  assert.equal(await harness(async () => row).getEventMetadataRow("event"), row);
  assert.equal(await harness(async () => { throw new Error("timeout exceeded when trying to connect"); }).getEventMetadataRow("event"), null);
  const error = new Error("column does not exist");
  await assert.rejects(harness(async () => { throw error; }).getEventMetadataRow("event"), value => value === error);
});

test("event outages render a reload link with the original query and no missing-event cleanup", async () => {
  const h = harness(async () => { throw new Error("timeout exceeded when trying to connect"); });
  const html = renderToStaticMarkup(await h.default({ params: Promise.resolve({ id: "party" }), searchParams: Promise.resolve({ tab: "invitation", preview: ["1", "2"] }) }));
  assert.match(html, /temporarily unavailable/);
  assert.match(html, /href="\/event\/party\?tab=invitation&amp;preview=1&amp;preview=2"/);
  assert.doesNotMatch(html, /deleted|RemoveUnavailableEventFromLists/);
});

test("event wrapper preserves successful renders and rethrows application errors", async () => {
  assert.equal(await harness(async () => "event content").default({}), "event content");
  const error = new Error("NEXT_REDIRECT");
  await assert.rejects(harness(async () => { throw error; }).default({}), value => value === error);
});
