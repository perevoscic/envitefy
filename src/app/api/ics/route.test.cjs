const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) { return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest); };
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { GET } = require("./route.ts");
test("ICS exports the approved clock, room and Unicode public instructions", async () => {
  const params = new URLSearchParams({ title: "September 23 Workshop", start: "2026-09-23T19:00:00.000Z", end: "2026-09-23T21:00:00.000Z", timezone: "America/Chicago", location: "Maple Center, Room B, 23 Oak Street", description: "Bring goggles.\nNo gifts, please.\n¡Bienvenidos!" });
  const res = await GET(new Request(`https://envitefy.com/api/ics?${params}`));
  assert.equal(res.status, 200);
  const body = (await res.text()).replace(/\r\n /g, "");
  assert.match(body, /\r\nDTSTART:20260923T190000Z\r\n/);
  assert.match(body, /\r\nDTEND:20260923T210000Z\r\n/);
  assert.match(body, /X-WR-TIMEZONE:America\/Chicago/);
  assert.match(body, /LOCATION:Maple Center\\, Room B\\, 23 Oak Street/);
  assert.match(body, /No gifts\\, please\./);
  assert.match(body, /¡Bienvenidos!/);
});
test("ICS preserves absolute timestamps across offsets and daylight-saving transitions", async () => {
  for (const [start, end, timezone, expectedStart, expectedEnd] of [
    ["2026-11-01T01:30:00-05:00", "2026-11-01T01:30:00-06:00", "America/Chicago", "20261101T063000Z", "20261101T073000Z"],
    ["2026-09-24T00:30:00+09:00", "2026-09-24T02:00:00+09:00", "Asia/Tokyo", "20260923T153000Z", "20260923T170000Z"],
  ]) {
    const params = new URLSearchParams({ start, end, timezone });
    const res = await GET(new Request(`https://envitefy.com/api/ics?${params}`));
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(body.includes(`\r\nDTSTART:${expectedStart}\r\n`), body);
    assert.ok(body.includes(`\r\nDTEND:${expectedEnd}\r\n`), body);
  }
});

test("all-day dates and explicitly floating times keep their requested representation", async () => {
  for (const [options, expected] of [
    [{ start: "2026-09-23", end: "2026-09-24", allDay: "true", timezone: "America/Chicago" }, "DTSTART;VALUE=DATE:20260923"],
    [{ start: "2026-09-23T14:00:00.000Z", floating: "1", timezone: "America/Chicago" }, "DTSTART:20260923T140000"],
  ]) {
    const res = await GET(new Request(`https://envitefy.com/api/ics?${new URLSearchParams(options)}`));
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes(`\r\n${expected}\r\n`));
  }
});
test("unknown end remains absent in ICS and invalid timestamps return 400", async () => {
  const res = await GET(new Request("https://envitefy.com/api/ics?title=Workshop&start=2026-09-23T19:00:00.000Z"));
  assert.equal(res.status, 200);
  assert.doesNotMatch(await res.text(), /DTEND|DURATION/);
  assert.equal((await GET(new Request("https://envitefy.com/api/ics?start=invalid"))).status, 400);
});
