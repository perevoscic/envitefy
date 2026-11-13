import assert from "node:assert/strict";
import path from "node:path";

const result = await Bun.build({
  entrypoints: [path.resolve("scripts/fixtures/calendar-demand.tsx")],
  outdir: path.resolve("output/calendar-demand-browser"),
  naming: "fixture.js",
  target: "browser",
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
});
assert.ok(result.success, result.logs.map(String).join("\n"));
