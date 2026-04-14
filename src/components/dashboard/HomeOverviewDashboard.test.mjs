import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dashboard invitation actions keep mobile buttons on one row", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /const primaryButtonClassName = `group\/btn inline-flex min-w-0 flex-1.*sm:min-w-\[170px\]/s,
  );
  assert.match(
    source,
    /const secondaryButtonClassName =\s*"inline-flex min-w-0 flex-1.*sm:min-w-\[170px\]/s,
  );
  assert.match(source, /<div className="flex gap-3 sm:gap-4">/);
});
