import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("AppShell hides workspace chrome on marketing and full live-card routes", () => {
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(appShell, /MARKETING_PATHS/);
  assert.match(appShell, /"\/snap"/);
  assert.match(appShell, /"\/gymnastics"/);
  assert.match(appShell, /"\/landing"/);
  assert.match(appShell, /function isStudioCardSharePath\(pathname: string\)/);
  assert.match(appShell, /segments\.length === 2 && segments\[0\] === "card"/);
  assert.match(appShell, /const isStudioCardShare = isStudioCardSharePath\(pathname\);/);
  assert.match(appShell, /showWorkspaceChrome/);
  assert.match(
    appShell,
    /const showWorkspaceChrome = isAuthenticated && !onMarketing && !isStudioCardShare;/,
  );
  assert.match(appShell, /isRedirectingFromMarketing/);
  assert.match(appShell, /router\.replace\("\/"\)/);
  assert.match(appShell, /animate-spin/);
  assert.match(appShell, /AUTH_TRANSITION_EVENT/);
  assert.match(appShell, /authTransitionMessage/);
});
