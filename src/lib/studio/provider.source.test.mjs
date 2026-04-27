import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = path.join(process.cwd(), "src", specifier.slice(2));
      const withExtension = /\.[a-z]+$/i.test(resolvedPath) ? resolvedPath : `${resolvedPath}.ts`;
      return nextResolve(pathToFileURL(withExtension).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const ORIGINAL_STUDIO_PROVIDER = process.env.STUDIO_PROVIDER;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const { resolveStudioProvider } = await import("./provider.ts");

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function restoreEnvValue(key, value) {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test.afterEach(() => {
  restoreEnvValue("STUDIO_PROVIDER", ORIGINAL_STUDIO_PROVIDER);
  restoreEnvValue("NODE_ENV", ORIGINAL_NODE_ENV);
});

test("studio provider resolution defaults production to openai and non-production to gemini", () => {
  const source = readSource("src/lib/studio/provider.ts");

  assert.match(source, /process\.env\.STUDIO_PROVIDER/);
  assert.match(source, /process\.env\.NODE_ENV === "production" \? "openai" : "gemini"/);
  assert.match(source, /provider === "openai" \|\| provider === "gemini"/);
  assert.match(source, /Invalid STUDIO_PROVIDER/);
});

test("resolveStudioProvider honors explicit providers", () => {
  process.env.NODE_ENV = "production";

  process.env.STUDIO_PROVIDER = "openai";
  assert.equal(resolveStudioProvider(), "openai");

  process.env.STUDIO_PROVIDER = "gemini";
  assert.equal(resolveStudioProvider(), "gemini");
});

test("resolveStudioProvider defaults by runtime environment", () => {
  delete process.env.STUDIO_PROVIDER;

  process.env.NODE_ENV = "production";
  assert.equal(resolveStudioProvider(), "openai");

  process.env.NODE_ENV = "development";
  assert.equal(resolveStudioProvider(), "gemini");

  process.env.NODE_ENV = "test";
  assert.equal(resolveStudioProvider(), "gemini");
});

test("resolveStudioProvider rejects invalid explicit provider", () => {
  process.env.NODE_ENV = "production";
  process.env.STUDIO_PROVIDER = "banana";

  assert.throws(() => resolveStudioProvider(), /Invalid STUDIO_PROVIDER/);
});

test("studio generation dispatches text and image calls through the resolved provider", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(source, /const provider = studioGenerationDeps\.resolveStudioProvider\(\);/);
  assert.match(source, /buildInvitationImagePrompt,\s*buildLiveCardPrompt,/);
  assert.match(source, /const textPrompt = buildLiveCardPrompt\(normalizedRequest\.event, normalizedRequest\.guidance\);/);
  assert.match(
    source,
    /const imagePrompt = buildInvitationImagePrompt\(\s*normalizedRequest\.event,\s*normalizedRequest\.guidance,\s*liveCard,\s*\{/s,
  );
  assert.match(source, /provider === "openai"/);
  assert.match(source, /generateStudioLiveCardWithOpenAi/);
  assert.match(source, /generateInvitationImageWithOpenAi/);
  assert.match(source, /editInvitationImageWithOpenAi/);
  assert.match(source, /generateStudioLiveCardWithGemini/);
  assert.match(source, /generateInvitationImageWithGemini/);
  assert.match(source, /editInvitationImageWithGemini/);
});
