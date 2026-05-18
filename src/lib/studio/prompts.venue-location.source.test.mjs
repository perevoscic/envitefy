import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");

test("studio prompts keep visible non-open-house location copy on the venue name", () => {
  assert.match(source, /function resolveVisibleLocationLineForStudioEvent/);
  assert.match(source, /if \(occasionType === "open_house"\) return visible;/);
  assert.match(source, /if \(looksLikeStreetAddress\(visible\)\) return venue;/);
  assert.match(source, /locationLine: resolveVisibleLocationLineForStudioEvent\(/);
  assert.match(source, /locationLine` must use the Venue Name only for non-Open-House events/);
  assert.match(source, /visible place text must use the venue name only/);
});
