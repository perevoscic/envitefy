const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const parsed = { days: [{ isoDate: "", dateBasis: "session_rows", evidence: "Session S1 Juniors Level 7 Warm-up 8 AM Host Gym", sessions: [{ code: "S1", label: "Juniors", group: "Level 7", startTime: "", warmupTime: "8 AM", note: "", clubs: ["Host Gym"] }] }] };
class CreateSourceError extends Error {}
function reader(response, sourceText = "Session S1 Juniors Level 7 Warm-up 8 AM Host Gym") {
  const module = loadTs("src/lib/gymnastics-schedule-reader.ts", { "@/lib/create/read-source": { CreateSourceError, readCreateSource: null } });
  const calls = [];
  module.scheduleReaderDeps.read = async (input, signal, options) => { calls.push({ input, signal, options }); return { text: sourceText, images: ["data:image/jpeg;base64,fixture"] }; };
  module.scheduleReaderDeps.client = () => ({ chat: { completions: { create: async (input, options) => { calls.push({ input, options }); return response; } } } });
  return { read: module.readGymnasticsSchedule, calls };
}
test("reader uses table images and text and leaves missing dates/times blank", async () => {
  const { read, calls } = reader({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(parsed) } }] });
  const signal = new AbortController().signal;
  const result = await read(new File(["photo"], "schedule.jpg"), signal);
  assert.equal(result.days[0].isoDate, "");
  assert.equal(result.days[0].sessions[0].startTime, "");
  assert.deepEqual(calls[0].options, { skipBranding: true });
  assert.equal(calls[1].options.signal, signal);
  assert.equal(calls[1].input.messages[1].content[1].type, "image_url");
  assert.equal(result.source.fileName, "schedule.jpg");
});
test("partial, refused and malformed schedules are rejected", async () => {
  for (const choice of [
    { finish_reason: "length", message: { content: JSON.stringify(parsed) } },
    { finish_reason: "stop", message: { refusal: "Cannot read" } },
    { finish_reason: "stop", message: { content: '{"days":[]}' } },
    { finish_reason: "stop", message: { content: '{"days":[{"isoDate":"2027-04-10"}]}' } },
  ]) {
    const { read } = reader({ choices: [choice] });
    await assert.rejects(read(new File(["photo"], "schedule.jpg"), new AbortController().signal));
  }
});


test("Tampa title range does not create Sunday without printed schedule rows", async () => {
  const sourceText = "2027 Tampa Bay Invitational January 15th–17th, 2027\nFriday, January 15\nGYM A/B Session 2 Level 7 11:15am–2:45pm\nGYM C Session 3 XCEL Silver 1:30pm–4:45pm\nGYM A/B Session 4 Level 8 6:15pm–9:30pm\nSaturday, January 16\nGYM C Session 6 XCEL Gold 10:15am–1:45pm\nGYM A/B Session 8 Level 6 5:15pm–8:30pm";
  const session = (code, label, group, startTime) => ({ code, label, group, startTime, warmupTime: "", note: "", clubs: [] });
  const friday = { isoDate: "2027-01-15", dateBasis: "session_rows", evidence: "Friday, January 15", sessions: [
    session("Session 2", "GYM A/B", "Level 7", "11:15am–2:45pm"),
    session("Session 3", "GYM C", "XCEL Silver", "1:30pm–4:45pm"),
    session("Session 4", "GYM A/B", "Level 8", "6:15pm–9:30pm"),
  ] };
  const saturday = { isoDate: "2027-01-16", dateBasis: "session_rows", evidence: "Saturday, January 16", sessions: [
    session("Session 6", "GYM C", "XCEL Gold", "10:15am–1:45pm"),
    session("Session 8", "GYM A/B", "Level 6", "5:15pm–8:30pm"),
  ] };
  for (const sunday of [
    { dateBasis: "header_range", evidence: "January 15th–17th, 2027", sessions: [] },
    { dateBasis: "header_range", evidence: "January 15th–17th, 2027", sessions: friday.sessions },
    { dateBasis: "session_rows", evidence: "January 15th–17th, 2027", sessions: [] },
    { dateBasis: "session_rows", evidence: "January 15th–17th, 2027", sessions: [session("", "", "", "")] },
    { dateBasis: "explicit_no_events", evidence: "January 15th–17th, 2027", sessions: [] },
  ]) {
    const { read } = reader({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ days: [friday, saturday, { isoDate: "2027-01-17", ...sunday }] }) } }] }, sourceText);
    const result = await read(new File(["photo"], "tampa2027.jpeg"), new AbortController().signal);
    assert.deepEqual(result.days.map(day => day.isoDate), ["2027-01-15", "2027-01-16"]);
    assert.deepEqual(result.days.map(day => day.sessions.length), [3, 2]);
    assert.equal(result.days[0].sessions[0].startTime, "11:15am–2:45pm");
    assert.equal(result.days[1].sessions[1].warmupTime, "");
  }
});

test("explicit printed no-event days stay empty, without invented sessions", async () => {
  const empty = { isoDate: "2027-01-17", dateBasis: "explicit_no_events", evidence: "Sunday January 17: No events scheduled", sessions: [] };
  const { read } = reader({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ days: [empty] }) } }] }, empty.evidence);
  const result = await read(new File(["photo"], "sunday.jpg"), new AbortController().signal);
  assert.deepEqual(result.days, [{ isoDate: "2027-01-17", sessions: [] }]);
});
