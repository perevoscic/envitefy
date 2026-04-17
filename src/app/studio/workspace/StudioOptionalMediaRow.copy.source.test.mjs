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
  assert.match(
    source,
    /We will preserve an uploaded invite's visual direction and add live-card buttons, or use/,
  );
  assert.match(source, /photo\(s\) to design the invitation around them\./);
  assert.match(source, /Upload flyer/);
  assert.match(source, /Upload photo\(s\)/);
});
