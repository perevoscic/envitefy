import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
const native = createRequire(import.meta.url);
function load(file) {
  file = path.resolve(file);
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const require = (name) => {
    if (!name.startsWith("@/") && !name.startsWith(".")) return native(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name);
    return load([base, `${base}.ts`].find(existsSync));
  };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const { changeSignupStart, copySignupForm } = load("src/lib/signup-editor.ts");
const { validateSignupPublish } = load("src/lib/signup-validation.ts");
const { createDefaultSignupForm } = load("src/utils/signup.ts");
const form = () => ({
  ...createDefaultSignupForm(), title: "Parent conferences", locationMode: "tba",
  timezone: "America/Chicago", start: "2026-10-22T15:00", end: "2026-10-22T16:00",
  sections: [{ id: "day", title: "Thursday", slots: [{ id: "slot", label: "Conference", capacity: 1, startTime: "15:00", endTime: "15:15" }] }],
});

test("moving the event date preserves duration and permits publication without altering slots", () => {
  const original = form();
  const moved = changeSignupStart(original, "2026-10-31T15:00");
  assert.equal(moved.end, "2026-10-31T16:00");
  assert.deepEqual(validateSignupPublish(moved), []);
  assert.deepEqual(moved.sections, original.sections);
  assert.equal(original.end, "2026-10-22T16:00");
  assert.equal(changeSignupStart(original, "2026-10-20T13:00").end, "2026-10-20T14:00");
});

test("event-local times survive stored UTC, DST, midnight and multi-day moves", () => {
  const original = { ...form(), start: "2026-10-22T20:00:00Z", end: "2026-10-22T21:00:00Z" };
  assert.equal(changeSignupStart(original, "2026-11-05T15:00").end, "2026-11-05T16:00");
  assert.equal(changeSignupStart({ ...form(), start: "2026-10-22T23:00", end: "2026-10-23T01:00" }, "2026-12-31T23:00").end, "2027-01-01T01:00");
  assert.equal(changeSignupStart({ ...form(), end: "2026-10-24T16:00" }, "2026-11-05T15:00").end, "2026-11-07T16:00");
});

test("optional ends stay absent; invalid ends remain actionable; all-day same-date events publish", () => {
  assert.equal(changeSignupStart({ ...form(), end: null }, "2026-10-31T15:00").end, null);
  const invalid = { ...form(), end: "2026-10-20T16:00" };
  assert.equal(changeSignupStart(invalid, "2026-10-31T15:00").end, invalid.end);
  assert.match(validateSignupPublish(invalid)[0].message, /Choose a later end date and time/);
  const allDay = changeSignupStart({ ...form(), allDay: true, start: "2026-10-22", end: "2026-10-22" }, "2026-10-31");
  assert.equal(allDay.end, "2026-10-31");
  assert.deepEqual(validateSignupPublish(allDay), []);
  assert.ok(validateSignupPublish({ ...form(), end: form().start }).length);
});

test("copies preserve design and restrictions but have no responses, availability or signup window", () => {
  const original = { ...form(), visibility: "restricted", enabled: false, revision: 6,
    responses: [{ name: "Private participant" }], availability: [{ confirmed: 1 }],
    header: { backgroundImage: { dataUrl: "blob:in-memory-artwork" } },
    settings: { ...form().settings, signupOpensAt: "2026-10-01T09:00", signupClosesAt: "2026-10-22T09:00" },
  };
  const copy = copySignupForm(original);
  assert.equal(copy.title, "Parent conferences (copy)");
  assert.equal(copy.visibility, "restricted");
  assert.deepEqual(copy.responses, []);
  assert.equal(copy.availability, undefined);
  assert.equal(copy.revision, 0);
  assert.equal(copy.enabled, true);
  assert.equal(copy.settings.signupClosesAt, null);
  assert.equal(copy.settings.signupOpensAt, null);
  assert.deepEqual(copy.header, original.header);
  copy.sections[0].slots[0].label = "Changed copy";
  assert.equal(original.sections[0].slots[0].label, "Conference");
  assert.equal(original.responses.length, 1);
});
