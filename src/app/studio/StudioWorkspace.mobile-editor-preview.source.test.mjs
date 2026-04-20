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
  const previewStep = readSource("src/app/studio/workspace/StudioMobilePreviewStep.tsx");
  const ideaComposer = readSource("src/app/studio/workspace/StudioIdeaComposer.tsx");
  const shell = readSource("src/app/studio/workspace/StudioWorkspaceShell.tsx");
  const mainWrapper = readSource("src/components/MainContentWrapper.tsx");
  const leftSidebar = readSource("src/app/left-sidebar.tsx");

  assert.match(workspace, /const STUDIO_EDITOR_MOBILE_BREAKPOINT = "\(max-width: 767px\)";/);
  assert.match(workspace, /if \(value === "preview"\) return "preview";/);
  assert.match(workspace, /navigateWorkspace\("create", "preview"\);/);
  assert.match(workspace, /if \(view !== "create" \|\| createStep !== "preview" \|\| isMobileEditorViewport\) return;/);
  assert.match(workspace, /navigateWorkspace\("create", "details"\);/);
  assert.match(workspace, /previewContent=\{/);
  assert.match(workspace, /const \[ideaComposerDraft, setIdeaComposerDraft\] = useState\(""\);/);
  assert.match(workspace, /const \[isIdeaComposerOpen, setIsIdeaComposerOpen\] = useState\(false\);/);
  assert.match(workspace, /function openIdeaComposer\(\)/);
  assert.match(workspace, /function closeIdeaComposer\(\)/);
  assert.match(workspace, /async function submitIdeaComposer\(\)/);
  assert.match(workspace, /theme: nextIdea,\s*detailsDescription: nextIdea,/s);
  assert.match(workspace, /mobileFailureStep: "preview"/);
  assert.match(workspace, /shellMode=\{[\s\S]*"immersive-mobile-preview"/s);
  assert.doesNotMatch(workspace, /mobileEditorPane/);
  assert.doesNotMatch(formStep, /mobilePane:/);
  assert.doesNotMatch(formStep, />\s*Editor\s*</);
  assert.doesNotMatch(formStep, />\s*Preview\s*</);
  assert.match(previewStep, /showSaveButton=\{false\}/);
  assert.match(previewStep, /onOpenDetailsStep: \(\) => void;/);
  assert.match(previewStep, /onOpenIdeaComposer: \(\) => void;/);
  assert.match(previewStep, /ideaComposerSheet: ReactNode;/);
  assert.match(previewStep, /onClick=\{onOpenIdeaComposer\}/);
  assert.doesNotMatch(previewStep, />\s*Edit Details\s*</);
  assert.match(previewStep, />\s*Preview\s*</);
  assert.match(ideaComposer, /Update Preview/);
  assert.match(ideaComposer, /Edit Event Details/);
  assert.match(shell, /shellMode\?: "full" \| "immersive-mobile-preview";/);
  assert.match(shell, /const isImmersiveMobilePreview = shellMode === "immersive-mobile-preview";/);
  assert.match(mainWrapper, /searchParams\.get\("step"\) === "preview"/);
  assert.match(leftSidebar, /!viewModel\.isOpen && !isImmersiveStudioPreview/);
});
