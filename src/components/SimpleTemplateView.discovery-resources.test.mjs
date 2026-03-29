import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/SimpleTemplateView.tsx"),
  "utf8"
);

test("discovery meet-details renderer keeps posting-soon resource cards", () => {
  assert.match(source, /const pendingResourceCards = uniqueBy\(/);
  assert.match(source, /Posting Soon/);
  assert.match(source, /Expected \$\{dateLabel\}/);
});
