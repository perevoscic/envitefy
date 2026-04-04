import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("AppShell hides workspace chrome on marketing routes and redirects signed-in users to root", () => {
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(appShell, /MARKETING_PATHS/);
  assert.match(appShell, /"\/snap"/);
  assert.match(appShell, /"\/gymnastics"/);
  assert.match(appShell, /"\/landing"/);
  assert.match(appShell, /showWorkspaceChrome/);
  assert.match(appShell, /isRedirectingFromMarketing/);
  assert.match(appShell, /router\.replace\("\/"\)/);
  assert.match(appShell, /animate-spin/);
});
