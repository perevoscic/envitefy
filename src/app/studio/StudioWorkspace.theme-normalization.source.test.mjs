import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace keeps theme rewrite notes ephemeral and visible in the preview shell", () => {
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStepSource = readSource("src/app/studio/workspace/StudioFormStep.tsx");

  assert.match(workspaceSource, /const \[generationNote, setGenerationNote\] = useState<string \| null>\(null\);/);
  assert.match(workspaceSource, /setGenerationNote\(response\.themeNormalization\?\.note \|\| null\);/);
  assert.match(workspaceSource, /setGenerationNote\(null\);/);
  assert.match(workspaceSource, /generationNote=\{generationNote\}/);
  assert.match(formStepSource, /generationNote: string \| null;/);
  assert.match(formStepSource, /{generationNote \? \(/);
});
