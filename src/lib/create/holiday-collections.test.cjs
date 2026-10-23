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
const { expandEventTypeChoices } = require("./event-type-groups.ts");
const { AVAILABLE_HOLIDAY_TEMPLATE_IDS } = require("../../assets/holiday-template-availability.ts");

test("Holidays & seasonal exposes only reviewed, available holiday designs", () => {
  const designs = getCreationTemplates({ category: "holidays-seasonal", sport: null });
  assert.equal(designs.length, AVAILABLE_HOLIDAY_TEMPLATE_IDS.length);
  assert.deepEqual(new Set(designs.map((design) => design.id)), new Set(AVAILABLE_HOLIDAY_TEMPLATE_IDS));
  assert.ok(designs.every((design) => design.id.startsWith("holidays--")));
  assert.ok(designs.every((design) => fs.existsSync(path.join("public", design.imageUrl))));
  assert.ok(designs.every((design) => design.href.includes("collection=holidays-seasonal")));
  assert.equal(customCategoryForGuess({ category: "holidays-seasonal", sport: null }), "general");
});

test("each holiday plans sixty designs and exposes only its ready designs with the occasion carried into the editor", () => {
  assert.equal(HOLIDAY_COLLECTIONS.length, 44);
  assert.equal(HOLIDAY_COLLECTIONS.flatMap(collection => collection.designs).length, 2640);
  for (const collection of HOLIDAY_COLLECTIONS) {
    assert.equal(collection.designs.length, 60, collection.id);
    const available = AVAILABLE_HOLIDAY_TEMPLATE_IDS.filter(id => id.startsWith(`holidays--${collection.id}--`));
    const designs = getCreationTemplates({ category: "holidays-seasonal", sport: null, occasion: collection.id });
    assert.equal(designs.length, available.length, collection.id);
    assert.deepEqual(new Set(designs.map(design => design.id)), new Set(available), collection.id);
    for (const original of collection.designs.slice(0, 10)) {
      assert.ok(available.includes(`holidays--${collection.id}--${original.slug}`), `${collection.id}: original artwork remains available`);
    }
    assert.ok(designs.every((design) => design.id.startsWith(`holidays--${collection.id}--`)), collection.id);
    assert.ok(designs.every((design) => new URL(design.href, "https://envitefy.local").searchParams.get("occasion") === collection.id));
    assert.deepEqual(getGeneralCreationDesigns("holidays-seasonal", collection.id).map((design) => design.id), designs.map((design) => design.id));
  }
  assert.equal(getCreationTemplates({ category: "general", sport: null }).length, 12 + AVAILABLE_HOLIDAY_TEMPLATE_IDS.length);
  assert.equal(getGeneralCreationDesigns("holidays-seasonal", "invalid-occasion").length, 0);
});

test("All and holiday choices start with the nearest named holiday while retaining all occasions and other category order", () => {
  const base = [
    { category: "birthdays", sport: null },
    { category: "holidays-seasonal", sport: null },
    { category: "weddings", sport: null },
    { category: "sports", sport: "football" },
  ];
  const original = structuredClone(base), catalogOrder = HOLIDAY_COLLECTIONS.map(collection => collection.id);
  for (const [day, first] of [["2026-10-22", "halloween"], ["2026-11-20", "thanksgiving"], ["2026-12-20", "christmas"], ["2026-12-31", "new-years-eve"], ["2027-01-01", "new-years-day"]]) {
    const choices = expandEventTypeChoices(base, day);
    assert.equal(choices[0].category, "holidays-seasonal", `${day}: the default All list starts with a timely holiday`);
    assert.equal(choices[0].occasion, first, `${day}: the nearest named holiday comes before ordinary event types`);
    const ids = choices.filter(choice => choice.category === "holidays-seasonal").map(choice => choice.occasion);
    assert.equal(ids[0], first, day);
    assert.equal(ids.length, 44, day);
    assert.equal(new Set(ids).size, 44, day);
    assert.deepEqual(new Set(ids), new Set(catalogOrder), day);
    assert.deepEqual(choices.filter(choice => choice.category !== "holidays-seasonal"), base.filter(choice => choice.category !== "holidays-seasonal"), "seasonal ordering preserves other event types");
  }
  assert.deepEqual(expandEventTypeChoices(base, "2026-10-22").filter(choice => choice.category === "holidays-seasonal").slice(0, 4).map(choice => choice.occasion), ["halloween", "corn-maze", "trunk-or-treat", "fall-harvest"], "nearby seasonal activities follow Halloween");
  const autumn = expandEventTypeChoices(base, "2026-10-22");
  assert.deepEqual(autumn.slice(0, 4).map(choice => choice.occasion), ["halloween", "corn-maze", "trunk-or-treat", "fall-harvest"], "All opens with Halloween and the current seasonal activities");
  assert.ok(autumn.findIndex(choice => choice.category === "birthdays") < autumn.findIndex(choice => choice.occasion === "july-fourth"), "out-of-season holidays stay below the ordinary event types that preceded them");
  assert.deepEqual(expandEventTypeChoices(base).filter(choice => choice.category === "holidays-seasonal").map(choice => choice.occasion), catalogOrder, "the pre-hydration fallback retains catalog order");
  assert.equal(expandEventTypeChoices(base)[0].category, "birthdays", "the server fallback waits for the visitor's civil day before reordering");
  assert.equal(expandEventTypeChoices(base, "invalid")[0].category, "birthdays", "an invalid day never promotes unrelated holiday choices");
  assert.deepEqual(expandEventTypeChoices([base[0], base[3]], "2026-10-22"), [base[0], base[3]], "ordering cannot add holidays to an account's approved subset");
  assert.deepEqual(base, original, "ordering never mutates the caller's choices");
  assert.deepEqual(HOLIDAY_COLLECTIONS.map(collection => collection.id), catalogOrder, "ordering never mutates the shared catalog");
});
