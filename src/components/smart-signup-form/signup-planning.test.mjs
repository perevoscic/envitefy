import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
function loadTs(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const localRequire = (id) => id.startsWith("@/") ? loadTs(`src/${id.slice(2)}.ts`) : require(id);
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports;
}
const { createDefaultSignupForm, sanitizeSignupForm } = loadTs("src/utils/signup.ts");

for (const empty of [false, true]) {
  test(`guest planning survives sanitization with ${empty ? "empty" : "active"} sections`, () => {
    const form = createDefaultSignupForm();
    form.sections = empty ? [] : [{ id: "section", title: "Volunteers", slots: [{ id: "slot", label: "Setup", capacity: 3 }] }];
    form.guestPlanning = { accessibility: "  Step-free entrance  ", dietary: "Tell the host about allergies", parking: "  ", invalid: "discard" };
    const saved = sanitizeSignupForm(form);
    assert.deepEqual(saved.guestPlanning, { accessibility: "Step-free entrance", dietary: "Tell the host about allergies" });
    assert.deepEqual(sanitizeSignupForm(saved).guestPlanning, saved.guestPlanning);
  });
}

test("guest planning does not change form or individual slot dates", () => {
  const form = createDefaultSignupForm();
  form.start = null;
  form.end = null;
  form.sections = [{ id: "day", title: "Saturday shifts", slots: [{ id: "shift", label: "Setup", capacity: 3, startTime: "08:00", endTime: "09:30" }] }];
  const before = sanitizeSignupForm(form);
  form.guestPlanning = { preparation: "Bring work gloves" };
  const saved = sanitizeSignupForm(form);
  assert.equal(saved.start, null);
  assert.equal(saved.end, null);
  assert.equal(saved.sections[0].slots[0].startTime, "08:00");
  assert.equal(saved.sections[0].slots[0].endTime, "09:30");
  assert.deepEqual(saved.sections, before.sections);
});
