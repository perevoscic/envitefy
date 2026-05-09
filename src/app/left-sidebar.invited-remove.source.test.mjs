import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("invited events render a visible remove action without sharing controls", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(source, /onDeleteRow=\{viewModel\.removeInvitedEventFromList\}/);
  assert.match(source, /showShareAction=\{false\}/);
  assert.doesNotMatch(source, /showShareAction=\{false\}\s+actionsAlwaysVisible/);
  assert.match(source, /deleteActionTitle="Remove invited event"/);
});

test("invited event removal revokes shares before falling back to own history delete", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(source, /removeInvitedEventFromList/);
  assert.match(source, /\/api\/events\/share\/remove/);
  assert.match(source, /\(data as any\)\.shared/);
  assert.match(source, /\/api\/history\/\$\{eventId\}/);
});
