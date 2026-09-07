import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./event-guest-planning.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;

for (const timezone of ["America/Chicago", "America/Los_Angeles", "UTC", "Asia/Tokyo"]) {
  test(`guest calendar dates remain their supplied day in ${timezone}`, () => {
    const script = `
      import assert from "node:assert/strict";
      import { parseEventGuestDate, formatEventGuestDate } from ${JSON.stringify(moduleUrl)};
      for (const value of ["2026-11-07", "2026-03-08", "2027-01-01"]) {
        const date = parseEventGuestDate(value);
        assert.equal(date.getFullYear(), Number(value.slice(0, 4)));
        assert.equal(date.getMonth() + 1, Number(value.slice(5, 7)));
        assert.equal(date.getDate(), Number(value.slice(8, 10)));
      }
      assert.equal(formatEventGuestDate("2026-11-07"), "November 7, 2026");
      const instant = "2026-11-07T00:30:00Z";
      assert.equal(parseEventGuestDate(instant).getTime(), new Date(instant).getTime());
      assert.equal(formatEventGuestDate(instant), new Date(instant).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      assert.equal(formatEventGuestDate(null), "");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, TZ: timezone },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
  });
}
