import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio provider resolution defaults to gemini and allows openai via env", () => {
  const source = readSource("src/lib/studio/provider.ts");

  assert.match(source, /process\.env\.STUDIO_PROVIDER/);
  assert.match(source, /provider === "openai" \|\| provider === "gemini"/);
  assert.match(source, /return normalizeStudioProvider\(process\.env\.STUDIO_PROVIDER\) \|\| "gemini";/);
});

test("studio generation dispatches text and image calls through the resolved provider", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(source, /const provider = resolveStudioProvider\(\);/);
  assert.match(source, /import \{ buildInvitationImagePrompt, buildLiveCardPrompt \} from "@\/lib\/studio\/prompts";/);
  assert.match(source, /const textPrompt = buildLiveCardPrompt\(request\.event, request\.guidance\);/);
  assert.match(source, /const imagePrompt = buildInvitationImagePrompt\(request\.event, request\.guidance, liveCard, \{/);
  assert.match(source, /provider === "openai"/);
  assert.match(source, /generateStudioLiveCardWithOpenAi/);
  assert.match(source, /generateInvitationImageWithOpenAi/);
  assert.match(source, /editInvitationImageWithOpenAi/);
  assert.match(source, /generateStudioLiveCardWithGemini/);
  assert.match(source, /generateInvitationImageWithGemini/);
  assert.match(source, /editInvitationImageWithGemini/);
});
