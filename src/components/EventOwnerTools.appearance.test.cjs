const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
test("owner dashboard is outside the authored guest canvas on the actual event route", () => {
  const route = fs.readFileSync("src/app/event/[id]/page.tsx", "utf8");
  const owner = route.slice(route.indexOf("  if (showOwnerWorkspace && resolvedOwnerToolsTab) {"), route.indexOf("  // Standalone signup"));
  assert.match(owner, /<EventOwnerTools/);
  assert.doesNotMatch(owner, /renderWithEventPageBackground|EventCanvas|EventPageBackgroundStyle/);
});
