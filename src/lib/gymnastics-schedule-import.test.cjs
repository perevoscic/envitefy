const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { normalizeScheduleImport, appendImportedSchedule } = loadTs("src/lib/gymnastics-schedule-import.ts");
const { gymnasticsSchedulePeriods } = loadTs("src/lib/gymnastics-schedule-range.ts");
const session = { code: "A1", label: "Junior session", group: "Level 6", startTime: "9 AM", warmupTime: "8:30 AM", note: "", clubs: ["Host Gym"] };
const imported = { days: [{ isoDate: "2027-04-10", sessions: [session] }], source: { fileName: "schedule.pdf", text: "April 10, 2027 A1 Level 6 8:30 AM 9 AM Host Gym" } };

test("unknown dates and missing times remain blank until reviewed", () => {
  const days = normalizeScheduleImport({ days: [{ isoDate: "April 10", sessions: [{ label: "Finals" }] }, { isoDate: "2027-02-29", sessions: [] }] });
  assert.equal(days[0].isoDate, "");
  assert.equal(days[0].sessions[0].startTime, "");
  assert.equal(days[0].sessions[0].warmupTime, "");
  assert.equal(days[1].isoDate, "");
  assert.throws(() => appendImportedSchedule({ days: [] }, { ...imported, days }, () => "new"), /Choose a date for every imported day/);
  assert.throws(() => normalizeScheduleImport({ days: [] }), /No readable schedule/);
});

test("additions retain authored IDs, sessions, clubs, metadata and source through reload and repeat import", () => {
  let sequence = 0;
  const id = () => `new-${++sequence}`;
  const authored = { id: "owner-session", code: "B1", label: "Authored finals", startTime: "3 PM", clubs: [{ id: "owner-club", name: "Visiting Gym", athleteCount: 12 }] };
  const current = { enabled: false, venueLabel: "Keep venue", notes: ["Owner note"], periods: [{ kind: "week", startDate: "2027-04-10" }],
    days: [{ id: "original-day", isoDate: "2027-04-10", shortDate: "Our Saturday", source: { old: true }, sessions: [authored] }] };
  const snapshot = JSON.stringify(current);
  const merged = appendImportedSchedule(current, imported, id);
  assert.equal(JSON.stringify(current), snapshot);
  assert.equal(merged.days[0].id, "original-day");
  assert.equal(merged.days[0].shortDate, "Our Saturday");
  assert.deepEqual(merged.days[0].source, { old: true });
  assert.strictEqual(merged.days[0].sessions[0], authored);
  assert.strictEqual(merged.notes, current.notes);
  assert.strictEqual(merged.periods, current.periods);
  assert.equal(merged.venueLabel, "Keep venue");
  assert.equal(merged.days[0].sessions[1].clubs[0].name, "Host Gym");
  assert.equal(merged.days[0].sessions[1].source.importId, merged.importSources[0].id);
  assert.equal(merged.importSources[0].text, imported.source.text);
  assert.equal(merged.enabled, true);
  const restored = JSON.parse(JSON.stringify(merged));
  assert.deepEqual(appendImportedSchedule(restored, imported, id), restored);
});

test("multiple rows on one date and empty dated days are preserved", () => {
  let i = 0;
  const next = appendImportedSchedule({}, { ...imported, days: [...imported.days, { isoDate: "2027-04-10", sessions: [{ ...session, code: "A2", startTime: "1 PM" }] }, { isoDate: "2027-04-11", sessions: [] }] }, () => `${++i}`);
  assert.equal(next.days.length, 2);
  assert.equal(next.days[0].sessions.length, 2);
  assert.deepEqual(next.days[1].sessions, []);
  assert.equal(next.days[1].source.importId, next.importSources[0].id);
});

test("two supplied dates show only those days in editor and reloaded schedules", () => {
  let sequence = 0;
  const supplied = { ...imported, days: [
    { isoDate: "2027-01-15", sessions: [session] },
    { isoDate: "2027-01-16", sessions: [{ ...session, code: "A2" }] },
  ] };
  const added = appendImportedSchedule({ days: [] }, supplied, () => `day-${++sequence}`);
  const snapshot = JSON.stringify(added);
  for (const schedule of [added, JSON.parse(snapshot)]) {
    const views = gymnasticsSchedulePeriods(schedule);
    assert.deepEqual(views.map(view => view.kind), ["day", "day"]);
    assert.deepEqual(views.flatMap(view => view.dates), ["2027-01-15", "2027-01-16"]);
    assert.deepEqual(views.flatMap(view => view.days.map(day => day.id)), schedule.days.map(day => day.id));
    assert.equal(schedule.days.length, 2);
  }
  assert.equal(JSON.stringify(added), snapshot, "rendering does not change the saved schedule");
});
