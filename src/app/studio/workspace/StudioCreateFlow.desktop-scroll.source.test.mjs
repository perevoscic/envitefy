import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio create flow lets the type step use normal document flow on desktop", () => {
  const createFlowSource = readSource("src/app/studio/workspace/StudioCreateFlow.tsx");
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const shellSource = readSource("src/app/studio/workspace/StudioWorkspaceShell.tsx");

  assert.match(createFlowSource, /if \(createStep === "type"\) \{/);
  assert.match(createFlowSource, /return <>\{typeContent\}<\/>;/);
  assert.doesNotMatch(createFlowSource, /lg:overflow-y-auto/);
  assert.match(
    workspaceSource,
    /allowDesktopDocumentFlow=\{view === "create" && createStep === "type"\}/,
  );
  assert.match(shellSource, /allowDesktopDocumentFlow\?: boolean;/);
  assert.match(shellSource, /allowDesktopDocumentFlow = false/);
  assert.match(createFlowSource, /<section className="min-w-0 lg:flex-1 lg:min-h-0">/);
  assert.match(shellSource, /allowDesktopDocumentFlow \? "" : "lg:h-screen lg:overflow-hidden"/);
  assert.match(
    shellSource,
    /allowDesktopDocumentFlow \? "lg:pb-12" : "lg:h-full lg:min-h-0 lg:flex-1 lg:pb-0"/,
  );
  assert.match(shellSource, /allowDesktopDocumentFlow[\s\S]*"lg:flex lg:flex-col"[\s\S]*"lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"/);
});
