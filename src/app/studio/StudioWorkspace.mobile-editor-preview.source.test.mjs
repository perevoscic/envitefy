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
  assert.match(formStep, /mobilePane === "composer"\s*\?\s*"w-full"\s*:\s*"hidden"/);
  assert.match(formStep, /mobilePane === "preview"/);
  assert.match(formStep, /flex w-full flex-col bg-\[#121a34\]/);
  assert.match(formStep, /onClick=\{showPreviewPane\}/);
  assert.match(formStep, />\s*Preview\s*</);
  assert.match(formStep, />\s*Back\s*</);
  assert.match(formStep, /const liveCardActionLabel =[\s\S]*"Preview Live Card";/);
  assert.doesNotMatch(formStep, />\s*Editor\s*</);
});
