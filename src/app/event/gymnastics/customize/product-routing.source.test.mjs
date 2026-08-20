import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("gymnastics saves persist an event-page product route", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/app/event/gymnastics/customize/page.tsx"),
    "utf8",
  );

  assert.match(source, /primaryOutput:\s*"event_page"/);
  assert.match(source, /requestedOutputs:\s*\["event_page"\]/);
});
