import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("studio optional media row keeps the flyer and photo guidance copy", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/app/studio/workspace/StudioOptionalMediaRow.tsx"),
    "utf8",
  );

  assert.match(source, /Optional image source/);
  assert.match(source, /Flyer parsing fills Event Details when possible/);
  assert.match(
    source,
    /can preserve the invite(?:&apos;|')s\s+visual direction\./,
  );
  assert.match(source, /Add a Design Idea if you want to steer the look further/);
  assert.match(source, /photo\(s\) to design the invitation around them\./);
  assert.match(source, /grid grid-cols-2 gap-3 lg:col-span-6 lg:grid-cols-2/);
  assert.match(source, /flyerActive \? "Replace" : "Flyer"/);
  assert.match(source, />\s*Photos\s*</);
  assert.doesNotMatch(source, /Upload flyer/);
  assert.doesNotMatch(source, /Upload photo\(s\)/);
});
