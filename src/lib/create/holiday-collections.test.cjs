const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.resolve("src", request.slice(2)) : request, parent, ...rest);
};
for (const extension of [".ts", ".tsx"]) Module._extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
const { HOLIDAY_COLLECTIONS } = require("../holiday-collections.ts");
const { getCreationTemplates } = require("./template-selection.ts");
const { customCategoryForGuess } = require("./create-intent.ts");
const { getGeneralCreationDesigns } = require("./event-page-collections.ts");

test("Holidays & seasonal exposes only the 440 existing holiday designs", () => {
  const designs = getCreationTemplates({ category: "holidays-seasonal", sport: null });
  assert.equal(designs.length, 440);
  assert.equal(new Set(designs.map((design) => design.id)).size, 440);
  assert.ok(designs.every((design) => design.id.startsWith("holidays--")));
  assert.ok(designs.every((design) => fs.existsSync(path.join("public", design.imageUrl))));
  assert.ok(designs.every((design) => design.href.includes("collection=holidays-seasonal")));
  assert.equal(customCategoryForGuess({ category: "holidays-seasonal", sport: null }), "general");
});

test("each holiday choice stays within its ten real designs and carries the occasion into the editor", () => {
  assert.equal(HOLIDAY_COLLECTIONS.length, 44);
  for (const collection of HOLIDAY_COLLECTIONS) {
    const designs = getCreationTemplates({ category: "holidays-seasonal", sport: null, occasion: collection.id });
    assert.equal(designs.length, 10, collection.id);
    assert.ok(designs.every((design) => design.id.startsWith(`holidays--${collection.id}--`)), collection.id);
    assert.ok(designs.every((design) => new URL(design.href, "https://envitefy.local").searchParams.get("occasion") === collection.id));
    assert.deepEqual(getGeneralCreationDesigns("holidays-seasonal", collection.id).map((design) => design.id), designs.map((design) => design.id));
  }
  assert.equal(getCreationTemplates({ category: "general", sport: null }).length, 452);
  assert.equal(getGeneralCreationDesigns("holidays-seasonal", "invalid-occasion").length, 0);
});
