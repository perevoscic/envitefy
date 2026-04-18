import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace request and editor source wire image finish presets through state and prompt guidance", () => {
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");
  const editor = readSource("src/app/studio/workspace/StudioEditorStep.tsx");
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const sanitize = readSource("src/app/studio/studio-workspace-sanitize.ts");
  const types = readSource("src/app/studio/studio-workspace-types.ts");

  assert.match(types, /imageFinishPreset: string;/);
  assert.match(sanitize, /imageFinishPreset: "",/);
  assert.match(sanitize, /"imageFinishPreset",/);
  assert.match(
    builders,
    /const imageFinishPreset = resolveStudioImageFinishPreset\(\s*details\.category,\s*details\.imageFinishPreset,\s*\);/s,
  );
  assert.match(
    builders,
    /const imageFinishPresetDirection = imageFinishPreset\s*\?\s*`Selected image finish preset: \$\{imageFinishPreset\.label\}\. Apply a \$\{imageFinishPreset\.label\} finish with \$\{imageFinishPreset\.description\}\.`\s*:\s*"";/s,
  );
  assert.match(builders, /imageFinishPreset: imageFinishPreset\?\.label,/);
  assert.match(
    builders,
    /style:\s*\[\s*visualDirection,\s*categoryGuardrails,\s*imageFinishPresetDirection,\s*refinement,\s*studioGuardrails,\s*\]/s,
  );
  assert.match(
    editor,
    /const imageFinishPresets = getStudioImageFinishPresets\(details\.category\);/,
  );
  assert.match(editor, /imageFinishPreset: active \? "" : preset\.label,/);
  assert.match(workspace, /resolveStudioImageFinishPreset\(details\.category, details\.imageFinishPreset\)/);
});
