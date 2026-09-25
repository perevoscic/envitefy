import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url), cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  const module = { exports: {} };
  cache.set(file, module);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const require = (name) => {
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync));
  };
  new Function("require", "module", "exports", source)(require, module, module.exports);
  return module.exports;
}
const { HOLIDAY_COLLECTIONS: collections } = load("src/lib/holiday-collections.ts");
const { orderSeasonalTemplates: order, holidayWindows, localGalleryDay, seasonalCollectionScores, templateOccasion } = load("src/lib/seasonal-template-order.ts");
const dates = (id, year) => holidayWindows(collections.find((c) => c.id === id).date, year).map(({ start, end }) => [start, end].map((day) => new Date(day * 86400000).toISOString().slice(0, 10)));
const templates = collections.flatMap((collection) => collection.designs.map((design) => ({ id: `holidays--${collection.id}--${design.slug}`, occasion: collection.id })));

test("all eleven federal holidays and the requested seasonal/cultural collections have ten distinct designs", () => {
  assert.equal(collections.length, 44);
  assert.equal(collections.filter((c) => c.kind === "Federal holidays").length, 11);
  for (const id of ["corn-maze", "trunk-or-treat", "memorial-day", "july-fourth", "summer-camp", "hanukkah", "kwanzaa", "lunar-new-year", "eid-al-fitr", "eid-al-adha", "diwali"]) assert.ok(collections.some((c) => c.id === id), id);
  assert.equal(new Set(templates.map((item) => item.id)).size, 440);
  for (const collection of collections) {
    assert.equal(collection.designs.length, 10, collection.id);
    assert.equal(new Set(collection.designs.map((d) => d.scene)).size, 10, collection.id);
  }
});

test("federal holidays use real holiday dates and weekday rules across years", () => {
  assert.deepEqual(dates("memorial-day", 2026), [["2026-05-25", "2026-05-25"]]);
  assert.deepEqual(dates("memorial-day", 2027), [["2027-05-31", "2027-05-31"]]);
  assert.deepEqual(dates("thanksgiving", 2026), [["2026-11-26", "2026-11-26"]]);
  assert.deepEqual(dates("labor-day", 2026), [["2026-09-07", "2026-09-07"]]);
  assert.deepEqual(dates("mlk-day", 2027), [["2027-01-18", "2027-01-18"]]);
  assert.deepEqual(dates("july-fourth", 2026), [["2026-07-04", "2026-07-04"]], "not the federal Friday office closure");
});

test("movable observances follow their own calendars, including eves and multi-day celebrations", () => {
  assert.deepEqual(dates("easter", 2026), [["2026-04-05", "2026-04-05"]]);
  assert.deepEqual(dates("easter", 2027), [["2027-03-28", "2027-03-28"]]);
  assert.deepEqual(dates("mardi-gras", 2026), [["2026-02-17", "2026-02-17"]]);
  assert.deepEqual(dates("lunar-new-year", 2026), [["2026-02-17", "2026-03-03"]]);
  assert.deepEqual(dates("hanukkah", 2026), [["2026-12-04", "2026-12-12"]]);
  assert.deepEqual(dates("rosh-hashanah", 2026), [["2026-09-11", "2026-09-13"]]);
  assert.deepEqual(dates("eid-al-fitr", 2026), [["2026-03-19", "2026-03-22"]]);
  assert.deepEqual(dates("diwali", 2026), [["2026-11-07", "2026-11-09"]]);
  assert.deepEqual(dates("diwali", 2032), [["2032-10-01", "2032-11-30"]], "unverified years use a planning season, not a guessed date");
});

test("September mixes corn mazes, trunk-or-treat, Halloween and harvest while retaining every design", () => {
  const original = structuredClone(templates);
  const result = order(templates, "2026-09-25");
  const firstPage = result.slice(0, 12).map((t) => t.occasion);
  for (const id of ["corn-maze", "trunk-or-treat", "halloween", "fall-harvest"]) assert.ok(firstPage.includes(id), id);
  assert.equal(new Set(firstPage).size, firstPage.length, "no single collection monopolizes the first page");
  assert.deepEqual(templates, original, "catalog order is never mutated");
  assert.deepEqual(new Set(result.map((t) => t.id)), new Set(templates.map((t) => t.id)));
});

test("May surfaces Memorial Day, July Fourth and summer camps together", () => {
  const firstPage = order(templates, "2026-05-01").slice(0, 12).map((t) => t.occasion);
  for (const id of ["memorial-day", "july-fourth", "summer-camp"]) assert.ok(firstPage.includes(id), id);
});

test("past holidays stop being promoted immediately; next year and cross-year windows work", () => {
  assert.equal(seasonalCollectionScores("2026-11-01").get("halloween"), -1);
  assert.ok(seasonalCollectionScores("2026-11-01").get("thanksgiving") > 0);
  assert.ok(seasonalCollectionScores("2026-12-30").get("new-years-day") > 0);
  assert.ok(seasonalCollectionScores("2027-01-01").get("kwanzaa") > 0);
  assert.ok(seasonalCollectionScores("2028-02-29").get("season:winter") > 0);
});

test("original order, unavailable/invalid local dates, subsets and evergreen designs remain stable", () => {
  for (const day of [null, "not-a-date", "2026-02-30"]) assert.deepEqual(order(templates, day), templates);
  assert.deepEqual(order(templates, "2026-09-25", "original"), templates);
  const subset = templates.filter((t) => t.occasion === "corn-maze").slice(2, 6);
  assert.deepEqual(order(subset, "2026-09-25"), subset, "search/filter subsets cannot reintroduce excluded designs");
  const mixed = [{ id: "neutral-a" }, { id: "summer", season: "Summer" }, { id: "neutral-b" }, { id: "fall", season: "Fall" }];
  assert.deepEqual(order(mixed, "2026-09-25").map((d) => d.id), ["fall", "neutral-a", "neutral-b", "summer"]);
  assert.equal(templateOccasion({ id: "school-and-education--teacher-appreciation-breakfast" }), undefined, "do not mislabel a different occasion");
  assert.equal(templateOccasion({ id: "some-birthday", occasion: "Birthday" }), undefined);
  assert.equal(localGalleryDay(new Date(2026, 8, 25, 23, 59)), "2026-09-25");
});
