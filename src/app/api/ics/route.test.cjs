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
  assert.match(body, /DTSTART(?:;[^:]*)?:20260923T(?:190000Z|140000)/);
  assert.match(body, /DTEND(?:;[^:]*)?:20260923T(?:210000Z|160000)/);
  assert.match(body, /LOCATION:Maple Center\\, Room B\\, 23 Oak Street/);
  assert.match(body, /No gifts\\, please\./);
  assert.match(body, /¡Bienvenidos!/);
});
test("unknown end remains absent in ICS and invalid timestamps return 400", async () => {
  const res = await GET(new Request("https://envitefy.com/api/ics?title=Workshop&start=2026-09-23T19:00:00.000Z"));
  assert.equal(res.status, 200);
  assert.doesNotMatch(await res.text(), /DTEND|DURATION/);
  assert.equal((await GET(new Request("https://envitefy.com/api/ics?start=invalid"))).status, 400);
});
