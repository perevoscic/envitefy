const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../../scripts/lib/event-messages-test-loader.cjs");
const pdfUrl = "https://meet.test/s/2027travel.pdf";
const website = { version: 1, eventYear: 2027, sources: [], coverage: [], participatingClubs: [], attractions: [],
  schedule: { status: "partial", notice: "Boys schedule TBD", links: [{ label: "Girls travel schedule", url: pdfUrl }, { label: "Official schedule", url: "https://meet.test/schedule" }] } };
const imported = { days: [29, 30, 31].map(day => ({ isoDate: `2027-01-${day}`, sessions: ["Gym A", "Gym B", "Gym C"].map(label => ({ code: "", label, group: "Level 6-8", startTime: "", warmupTime: "", note: "", clubs: [] })) })),
  source: { fileName: "2027travel.pdf", text: "2027 Atlanta Centennial Classic\nTravel Schedule\nFull schedule will be published by 12/1/26\nFriday, January 29\nGym A Level 6-8" } };
function fixture() {
  const mod = load("src/lib/discovery/schedule-enrichment.ts", {
    "@/lib/create/read-source": { readPublicCreateUrl: null }, "@/lib/gymnastics-schedule-reader": { readGymnasticsSchedule: null },
  });
  const reads = [];
  mod.linkedScheduleDeps.read = async (url) => { reads.push(url); return { bytes: Buffer.from("%PDF fixture"), mimeType: "application/pdf", url: "https://static1.squarespace.com/2027travel.pdf" }; };
  mod.linkedScheduleDeps.parse = async file => { assert.equal(file.name, "2027travel.pdf"); return structuredClone(imported); };
  return { ...mod, reads };
}
test("official schedule PDF links are opened and parsed as dated assignments with blank times", async () => {
  const state = fixture();
  const result = await state.enrichLinkedMeetSchedules({ websiteImport: website, sourceUrl: "https://meet.test/", title: "2027 Atlanta Centennial Classic", year: 2027 });
  assert.deepEqual(state.reads, [pdfUrl]);
  assert.equal(result.imports[0].days.length, 3);
  assert.equal(result.imports[0].days.flatMap(day => day.sessions).length, 9);
  assert.equal(result.imports[0].source.url, pdfUrl);
  assert.equal(result.documents[0].status, "parsed");
  assert.deepEqual(result.notes, ["Full schedule will be published by 12/1/26"]);
});
test("wrong editions, foreign-event paths and provider failures retain explicit failure evidence", async () => {
  const state = fixture();
  let result = await state.enrichLinkedMeetSchedules({ websiteImport: website, sourceUrl: "https://meet.test/", year: 2026 });
  assert.equal(result.imports.length, 0);
  assert.equal(result.documents[0].status, "failed");
  state.linkedScheduleDeps.read = async () => { throw Error("Source unavailable (503)"); };
  result = await state.enrichLinkedMeetSchedules({ websiteImport: website, sourceUrl: "https://meet.test/", year: 2027 });
  assert.match(result.documents[0].reason, /503/);
  assert.equal(result.imports.length, 0);
  state.reads.length = 0;
  const foreign = { ...website, schedule: { ...website.schedule, links: [{ label: "Another event", url: "https://meet.test/events/other-meet/2027/schedule.pdf" }] } };
  result = await state.enrichLinkedMeetSchedules({ websiteImport: foreign, sourceUrl: "https://meet.test/events/atlanta/2027/", year: 2027 });
  assert.equal(result.documents.length, 0);
  assert.deepEqual(state.reads, []);
});

test("uploaded packets reuse their completed text and page images without another download or OCR", async () => {
  const state = fixture();
  const sourceDocument = { fileName: "meet-packet.pdf", text: imported.source.text, images: ["data:image/png;base64,fixture"] };
  state.linkedScheduleDeps.read = async () => { throw Error("Unexpected network or file download"); };
  let calls = 0;
  state.linkedScheduleDeps.parseSource = async (source, fileName) => {
    calls++;
    assert.equal(source, sourceDocument);
    assert.equal(fileName, "meet-packet.pdf");
    return { ...structuredClone(imported), source: { fileName, text: source.text } };
  };
  const result = await state.enrichLinkedMeetSchedules({ sourceDocument, title: "2027 Atlanta Centennial Classic", year: 2027 });
  assert.equal(calls, 1);
  assert.equal(result.imports[0].days.length, 3);
  assert.equal(result.imports[0].source.fileName, "meet-packet.pdf");
  assert.equal(result.documents[0].status, "parsed");
});
