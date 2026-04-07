import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("owned history queries exclude studio-created rows from list surfaces", () => {
  const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

  assert.match(source, /function buildOwnedHistoryStudioVisibilitySql\(dataSql: string\)/);
  assert.match(source, /createdVia', ''\)\) <> 'studio'/);
  assert.match(source, /where user_id = \$1\s*\n\s*and \$\{buildOwnedHistoryStudioVisibilitySql\("coalesce\(data, '\{\}'::jsonb\)"\)\}/s);
  assert.match(source, /where eh\.user_id = \$1\s*\n\s*and \$\{buildOwnedHistoryStudioVisibilitySql\(ownDataSql\)\}/s);
  assert.match(source, /where eh\.user_id = \$1\s*\n\s*and \$\{buildOwnedHistoryStudioVisibilitySql\(dataSql\)\}/s);
});
