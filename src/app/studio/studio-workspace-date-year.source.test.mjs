import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio prompt date logic only includes event year for weddings", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /function shouldIncludeStudioEventYear\(details: EventDetails\): boolean \{/);
  assert.match(source, /return details\.category === "Wedding";/);
  assert.match(source, /function formatStudioPromptDate\(details: EventDetails\): string \{/);
  assert.match(source, /const rawDate = getStudioEventDate\(details\);/);
  assert.match(source, /if \(shouldIncludeStudioEventYear\(details\)\) return rawDate;/);
  assert.match(source, /const match = rawDate\.match\(\/\^\\d\{4\}-\(\\d\{2\}\)-\(\\d\{2\}\)\$\/\);/);
  assert.match(source, /return `\$\{match\[1\]\}\/\$\{match\[2\]\}`;/);
  assert.match(
    source,
    /eventYear: shouldIncludeStudioEventYear\(details\) \? getStudioEventYear\(details\) \|\| null : null,/,
  );
  assert.match(source, /date: formatStudioPromptDate\(details\) \|\| null,/);
});
