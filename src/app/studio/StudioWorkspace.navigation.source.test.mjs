import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace splits create and library at the top level and uses query state", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const shell = readSource("src/app/studio/workspace/StudioWorkspaceShell.tsx");
  const createFlow = readSource("src/app/studio/workspace/StudioCreateFlow.tsx");

  assert.match(workspace, /const \[view, setView\] = useState<StudioWorkspaceView>/);
  assert.match(workspace, /const \[createStep, setCreateStep\] = useState<StudioCreateStep>/);
  assert.match(workspace, /parseStudioWorkspaceView\(searchParams\.get\("view"\)\)/);
  assert.match(workspace, /parseStudioCreateStep\(searchParams\.get\("step"\)\)/);
  assert.match(workspace, /const navigateWorkspace = useCallback\(/);
  assert.match(workspace, /params\.set\("view", nextView\);/);
  assert.match(workspace, /params\.set\("step", resolvedCreateStep\);/);
  assert.match(workspace, /params\.delete\("step"\);/);
  assert.doesNotMatch(
    workspace,
    /useEffect\(\(\) => \{\s*const params = new URLSearchParams\(searchParams\.toString\(\)\);[\s\S]*router\.replace/,
  );
  assert.match(shell, /Create/);
  assert.match(shell, /Library/);
  assert.match(createFlow, /label: "Type"/);
  assert.match(createFlow, /label: "Details"/);
  assert.match(createFlow, /label: "Editor"/);
  assert.doesNotMatch(createFlow, /label: "Studio"/);
});
