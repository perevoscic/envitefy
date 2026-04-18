import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio editor shifts mobile users from prompt composer to preview after generation", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");

  assert.match(workspace, /const STUDIO_EDITOR_MOBILE_BREAKPOINT = "\(max-width: 767px\)";/);
  assert.match(
    workspace,
    /const \[mobileEditorPane, setMobileEditorPane\] = useState<"composer" \| "preview">\("composer"\);/,
  );
  assert.match(workspace, /setMobileEditorPane\("preview"\);/);
  assert.match(workspace, /showPromptComposer=\{\(\) => setMobileEditorPane\("composer"\)\}/);
  assert.match(workspace, /showPreviewPane=\{\(\) => setMobileEditorPane\("preview"\)\}/);
  assert.match(formStep, /transform:\s*\n?\s*mobilePane === "preview" \? "translateX\(-50%\)" : "translateX\(0\)"/);
  assert.match(formStep, />\s*Editor\s*</);
  assert.match(formStep, />\s*Preview\s*</);
});
