const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { gymnasticsScheduleRangeDates: dates, appendGymnasticsScheduleDays: append, appendGymnasticsSchedulePeriod: addPeriod, gymnasticsSchedulePeriods: periods, removeGymnasticsSchedulePeriod: removePeriod, gymnasticsScheduleEmptyMessage: emptyMessage } = loadTs("src/lib/gymnastics-schedule-range.ts");

test("weeks and calendar months retain exact calendar dates through DST, leap years and year boundaries", () => {
  assert.deepEqual(dates("week", "2027-03-12"), ["2027-03-12", "2027-03-13", "2027-03-14", "2027-03-15", "2027-03-16", "2027-03-17", "2027-03-18"]);
  assert.equal(dates("month", "2028-02").length, 29);
  assert.equal(dates("month", "2027-02").at(-1), "2027-02-28");
  assert.equal(dates("week", "2027-12-29").at(-1), "2028-01-04");
  assert.equal(dates("month", "2027-04").length, 30);
  assert.deepEqual(dates("week", "2027-02-29"), []);
  assert.deepEqual(dates("month", "2027-13"), []);
  assert.deepEqual(dates("month", ""), []);
});

test("day, week and month views share authored sessions through overlaps and JSON reload", () => {
  const existing = { id: "original", isoDate: "2027-01-03", sessions: [{ id: "finals", group: "Level 8", startTime: "09:00", clubs: [{ id: "club", name: "Host gym" }] }] };
  let sequence = 0;
  const createId = () => `new-${++sequence}`;
  let schedule = { days: append([existing], dates("month", "2027-01"), createId), periods: addPeriod([], { kind: "month", startDate: "2027-01-01" }) };
  schedule = { days: append(schedule.days, dates("week", "2027-01-03"), createId), periods: addPeriod(schedule.periods, { kind: "week", startDate: "2027-01-03" }) };
  schedule.periods = addPeriod(schedule.periods, { kind: "month", startDate: "2027-01-01" });
  assert.equal(schedule.days.length, 31);
  assert.equal(schedule.periods.length, 2, "repeated additions reuse the period");
  const views = periods(schedule);
  assert.equal(views.find(view => view.kind === "week").dates.length, 7);
  assert.equal(views.find(view => view.kind === "month").dates.length, 31);
  for (const view of views) assert.strictEqual(view.days.find(day => day.id === "original"), existing);
  const restored = JSON.parse(JSON.stringify(schedule));
  assert.deepEqual(periods(restored).map(view => view.label), views.map(view => view.label));
  assert.deepEqual(restored.days.find(day => day.id === "original").sessions, existing.sessions);
  assert.deepEqual(dates("day", "2027-01-03"), ["2027-01-03"]);
  assert.deepEqual(dates("day", "2027-02-30"), []);
});

test("legacy and moved days remain reachable without a migration or automatic save", () => {
  const schedule = { days: [{ id: "a", isoDate: "2027-01-01" }, { id: "b", isoDate: "2027-01-02" }, { id: "moved", isoDate: "2027-02-03" }, { id: "undated", date: "Finals" }], periods: [{ kind: "week", startDate: "2027-01-01" }] };
  const snapshot = JSON.stringify(schedule);
  const views = periods(schedule);
  assert.deepEqual(new Set(views.flatMap(view => view.days.map(day => day.id))), new Set(schedule.days.map(day => day.id)));
  assert.equal(JSON.stringify(schedule), snapshot);
  assert.deepEqual(periods({ days: schedule.days.slice(0, 2) }).map(view => view.dates), [["2027-01-01"], ["2027-01-02"]]);
});

test("period removal keeps overlapping authored dates, sessions and unrelated schedule metadata", () => {
  let sequence = 0;
  const days = append([], dates("month", "2027-01"), () => `day-${++sequence}`);
  const session = { id: "original-session", group: "Level 8", clubs: [{ name: "Host gym" }] };
  days.find(day => day.isoDate === "2027-01-10").sessions.push(session);
  const schedule = { days, periods: [{ kind: "month", startDate: "2027-01-01" }, { kind: "week", startDate: "2027-01-08" }, { kind: "day", startDate: "2027-01-10" }], notes: ["Keep these notes"], venueLabel: "Retained venue", source: { packet: "original" } };
  const snapshot = JSON.stringify(schedule);
  const withoutMonth = removePeriod(schedule, "month:2027-01-01");
  assert.equal(withoutMonth.days.length, 7);
  const withoutWeek = removePeriod(withoutMonth, "week:2027-01-08");
  assert.equal(withoutWeek.days.length, 1);
  assert.strictEqual(withoutWeek.days[0], days.find(day => day.isoDate === "2027-01-10"));
  assert.strictEqual(withoutWeek.days[0].sessions[0], session);
  const empty = removePeriod(withoutWeek, "day:2027-01-10");
  assert.equal(empty.days.length, 0);
  assert.equal(empty.periods.length, 0);
  assert.strictEqual(empty.notes, schedule.notes);
  assert.strictEqual(empty.source, schedule.source);
  assert.equal(empty.venueLabel, schedule.venueLabel);
  assert.equal(JSON.stringify(schedule), snapshot, "removal does not mutate saved data");
  assert.strictEqual(removePeriod(schedule, "missing"), schedule);
  assert.equal(removePeriod({ days }, "day:2027-01-01").days.length, 30, "ungrouped dates can be removed individually without migrating the record");
});

test("overlapping ranges retain existing meet sessions, IDs and unrecognized source data", () => {
  const session = { id: "session", label: "Level 8", startTime: "09:00", clubs: [{ name: "Host gym" }] };
  const day = { id: "authored", date: "Saturday, April 10, 2027", shortDate: "Finals", sessions: [session], source: "packet" };
  let sequence = 0;
  const createId = () => `day-${++sequence}`;
  const week = append([day], dates("week", "2027-04-08"), createId);
  assert.equal(week.length, 7);
  assert.strictEqual(week.find(item => item.id === "authored"), day);
  assert.strictEqual(week.find(item => item.id === "authored").sessions[0], session);
  assert.ok(week.filter(item => item.id !== "authored").every(item => item.sessions.length === 0));
  const month = append(week, dates("month", "2027-04"), createId);
  assert.equal(month.length, 30);
  assert.equal(new Set(month.map(item => item.id)).size, 30);
  assert.equal(append(month, dates("month", "2027-04"), createId).length, 30);
  assert.strictEqual(month.find(item => item.id === "authored"), day);
  assert.equal(month[0].isoDate, "2027-04-01");
  assert.equal(month.at(-1).isoDate, "2027-04-30");
});


test("imported dates without session data say no event scheduled; manual empty dates remain pending", () => {
  assert.equal(emptyMessage({ source: { fileName: "tampa2027.jpeg", importId: "original" } }), "No event scheduled.");
  assert.equal(emptyMessage({}), "Sessions to be announced.");
});
