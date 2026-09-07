import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./birthday-party-details.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { getBirthdayGuestNotes, getBirthdayEndLocal, birthdayLocalDateParts } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("guest guidance hides empty fields and keeps host-provided text without inventing policies", () => {
  assert.deepEqual(getBirthdayGuestNotes(), []);
  assert.deepEqual(getBirthdayGuestNotes({ parking: "  ", allergies: "" }), []);
  assert.deepEqual(getBirthdayGuestNotes({ siblings: " Siblings welcome with an RSVP. ", allergies: "Contact the host before bringing food.\nNo food sharing." }), [
    { key: "siblings", label: "Siblings & extra guests", value: "Siblings welcome with an RSVP." },
    { key: "allergies", label: "Food & allergies", value: "Contact the host before bringing food.\nNo food sharing." },
  ]);
});

test("party end is optional, later than start, and supports explicit overnight dates", () => {
  assert.equal(getBirthdayEndLocal("2026-10-07", "14:00", ""), undefined);
  assert.equal(getBirthdayEndLocal("2026-10-07", "14:00", "16:30"), "2026-10-07T16:30");
  assert.equal(getBirthdayEndLocal("2026-10-07", "14:00", "14:00"), undefined);
  assert.equal(getBirthdayEndLocal("2026-10-07", "14:00", "13:00"), undefined);
  assert.equal(getBirthdayEndLocal("2026-10-07", "20:00", "09:00", "2026-10-08"), "2026-10-08T09:00");
  assert.equal(getBirthdayEndLocal("invalid", "14:00", "16:00"), undefined);
});

test("saved event times reload in the same local clock used by the editor", () => {
  const instant = new Date(2026, 9, 7, 14, 30).toISOString();
  assert.deepEqual(birthdayLocalDateParts(instant), { date: "2026-10-07", time: "14:30" });
  assert.deepEqual(birthdayLocalDateParts("invalid"), { date: "", time: "" });
});

test("editor persists and previews end time and guest guidance and public page preserves it", () => {
  const editor = readFileSync(new URL("../app/event/birthdays/customize/page.tsx", import.meta.url), "utf8");
  const viewer = readFileSync(new URL("../app/event/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(editor, /end: getBirthdayEndLocal\(data.date, data.time, data.endTime, data.endDate\)/);
  assert.match(editor, /endISO = endLocal \? new Date\(endLocal\).toISOString\(\) : null/);
  assert.match(editor, /partyDetails: data.partyDetails/);
  assert.match(editor, /endTime: existing.endTime \?\? loadedEnd.time/);
  assert.match(viewer, /party: \{ \.\.\.data.party, \.\.\.data.partyDetails \}/);
});
