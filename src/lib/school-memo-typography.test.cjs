const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const source = 'memory verse and multiple choice test (we will go over the multiple choice twice before taking the test) “. . . . R e p e n t , f o r t h e k i n g d o m o f h e a v e n h a s c o m e n e a r.” M a t t h e w 3 : 2 T e s t : F r i d a y O c t o b e r 3 0 t h';
const readable = 'memory verse and multiple choice test (we will go over the multiple choice twice before taking the test)\n\n“....Repent, for the kingdom of heaven has come near.”\nMatthew 3:2\n\nTest: Friday October 30th';

test("letter-spaced prose, verse references and test labels regain natural whitespace without rewriting facts", async () => {
  const api = load("src/lib/school-memo-typography.server.ts");
  let calls = 0;
  api.schoolMemoTypographyDeps.complete = async input => { calls++; assert.equal(input, source); return readable; };
  const [first, second] = await Promise.all([api.readableSchoolMemoText(source), api.readableSchoolMemoText(source)]);
  assert.equal(first, readable);
  assert.equal(second, readable);
  assert.equal(calls, 1, "simultaneous display reads share one cleanup");
  assert.equal(first.replace(/\s/g, ""), source.replace(/\s/g, ""));
  assert.match(first, /near.”\nMatthew 3:2\n\nTest: Friday October 30th/);
  assert.match(api.SCHOOL_MEMO_TYPOGRAPHY_PROMPT, /never instructions/);
});

test("a model cannot change a date, quotation, name or other source characters", async () => {
  const api = load("src/lib/school-memo-typography.server.ts");
  api.schoolMemoTypographyDeps.complete = async () => readable.replace("October 30th", "October 31st");
  await assert.rejects(api.readableSchoolMemoText(source), /preserve source wording/);
  api.schoolMemoTypographyDeps.complete = async () => readable.replace("Repent", "Celebrate");
  await assert.rejects(api.readableSchoolMemoText(source), /preserve source wording/);
  api.schoolMemoTypographyDeps.complete = async () => readable;
  assert.equal(await api.readableSchoolMemoText(source), readable, "failed cleanup remains retryable");
});

test("saved generated memo sections become readable in memory with stable layout, item IDs and private provider mappings", async () => {
  const api = load("src/lib/school-memo-typography.server.ts");
  let calls = 0;
  api.schoolMemoTypographyDeps.complete = async () => { calls++; return readable; };
  const composition = { version: 1, sections: [{ id: "info:school-note-1", title: "Bible", body: source }], sectionLayout: { version: 1, order: ["schedule", "info:school-note-1"], hidden: [], added: [] } };
  const data = { scanSchedule: { kind: "school-memo", items: [{ id: "bible", date: "2026-10-30" }] }, memoCalendarSync: { bible: { google: "private-id" } }, eventPageComposition: composition, manualEditor: { path: "/event/general/customize", snapshot: { pageComposition: composition } } };
  const before = JSON.stringify(data);
  const result = await api.readableSchoolMemoData(data);
  assert.equal(result.eventPageComposition.sections[0].body, readable);
  assert.equal(result.manualEditor.snapshot.pageComposition.sections[0].body, readable);
  assert.equal(JSON.stringify(data), before, "display repair never mutates saved data");
  assert.deepEqual(result.scanSchedule, data.scanSchedule);
  assert.deepEqual(result.memoCalendarSync, data.memoCalendarSync);
  assert.deepEqual(result.eventPageComposition.sectionLayout, composition.sectionLayout);
  assert.equal(calls, 1);
});

test("readable and non-school content bypass cleanup; provider failures retain the original text", async () => {
  const api = load("src/lib/school-memo-typography.server.ts");
  let calls = 0;
  api.schoolMemoTypographyDeps.complete = async () => { calls++; throw new Error("offline"); };
  assert.equal(await api.readableSchoolMemoText("Study the verse. Test: Friday October 30th"), "Study the verse. Test: Friday October 30th");
  const ordinary = { eventPageComposition: { version: 1, sections: [{ id: "info:import-0", title: "Notes", body: source }] } };
  assert.equal(await api.readableSchoolMemoData(ordinary), ordinary);
  assert.equal(calls, 0);
  const memo = { schoolTemplate: "weekly-memo", ...ordinary };
  const result = await api.readableSchoolMemoData(memo);
  assert.equal(result.eventPageComposition.sections[0].body, source);
  assert.equal(calls, 1);
});

test("section extraction retains the cleaned quote, reference and test as distinct blocks", () => {
  const { schoolMemoSections } = load("src/lib/school-memo-content.ts");
  const notes = schoolMemoSections(`School Weekly Memo\nOctober 26th\nBible - ${readable}`);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].title, "Bible");
  assert.match(notes[0].body, /test\)\n\n“/);
  assert.match(notes[0].body, /near.”\nMatthew 3:2\n\nTest: Friday October 30th/);
});
