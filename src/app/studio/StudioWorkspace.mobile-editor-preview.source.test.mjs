import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio editor shifts mobile users from prompt composer to preview after generation", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

  assert.match(workspace, /const STUDIO_EDITOR_MOBILE_BREAKPOINT = "\(max-width: 767px\)";/);
  assert.match(
    workspace,
    /const \[mobileEditorPane, setMobileEditorPane\] = useState<"composer" \| "preview">\("composer"\);/,
  );
  assert.match(workspace, /setMobileEditorPane\("preview"\);/);
  assert.match(workspace, /showPromptComposer=\{\(\) => setMobileEditorPane\("composer"\)\}/);
  assert.match(workspace, /showPreviewPane=\{\(\) => setMobileEditorPane\("preview"\)\}/);
  assert.match(editorStep, /transform: mobilePane === "preview" \? "translateX\(-50%\)" : "translateX\(0\)"/);
  assert.match(editorStep, />\s*Editor\s*</);
  assert.match(editorStep, />\s*Preview\s*</);
  assert.match(editorStep, /Back To Prompt/);
});
