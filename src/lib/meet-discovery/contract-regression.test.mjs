import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("./core.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("core.ts", source, ts.ScriptTarget.Latest, true);
function loadFunction(name, dependencies) {
  const declaration = parsed.statements.find((node) => node.name?.text === name);
  assert.ok(declaration, `Missing function ${name}`);
  const compiled = ts.transpileModule(`${declaration.getText(parsed)}\nreturn ${name};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(dependencies), compiled)(...Object.values(dependencies));
}

test("retired schedule extraction is absent without restoring its public parse contract", () => {
  assert.doesNotMatch(source, /ParseResult\["schedule"\]/);
  assert.doesNotMatch(source, /GYMNASTICS_SCHEDULE_JSON_SCHEMA|function _deriveScheduleFromImages|function _callOpenAiScheduleParse/);
  const contract = parsed.statements.find((node) => node.name?.text === "ParseResult");
  assert.doesNotMatch(contract.getText(parsed), /\bschedule\s*:/);
});

test("resolved discovery hooks include the browser collector and preserve an injected offline collector", async () => {
  const called = [];
  const defaults = Object.fromEntries([
    "fetchWithLimit", "extractTextFromPdf", "extractTextFromImage", "extractGymLayoutImageFromPdf",
    "openAiExtractGymLayoutZones", "toOptimizedImageDataUrl",
  ].map((name) => [name, async () => { throw new Error(`Unexpected ${name}`); }]));
  const defaultBrowser = async (url) => { called.push(["default", url]); return { pages: [] }; };
  const customBrowser = async (url) => { called.push(["custom", url]); return { pages: [] }; };
  for (const custom of [null, { collectBrowserData: customBrowser }]) {
    const resolve = loadFunction("getUrlDiscoveryHooks", { ...defaults, urlDiscoveryTestHooks: custom, collectDiscoveryBrowserData: defaultBrowser });
    const hooks = resolve();
    assert.equal(hooks.collectBrowserData, custom?.collectBrowserData || defaultBrowser);
    await hooks.collectBrowserData("https://example.invalid/september-23-2026-meet");
  }
  assert.deepEqual(called.map(([name]) => name), ["default", "custom"]);
});

test("attendee-first parse profiles keep their deterministic order and parent-only shortcut", () => {
  const select = loadFunction("selectParsePromptProfiles", {
    uniqueBy: (items, key) => [...new Map(items.map((item) => [key(item), item])).values()],
  });
  assert.deepEqual(select({ documentProfile: "parent_packet", contentMix: { registrationHeavy: false } }), ["parent_public"]);
  for (const documentProfile of ["meet_overview", "registration_packet", "unknown"])
    assert.deepEqual(select({ documentProfile, contentMix: { registrationHeavy: true } }), ["overview_core", "parent_public"]);
});

test("image helpers preserve optional artifact provenance and perform no implicit debug write", async () => {
  for (const name of ["openAiOcrTextFromImage", "openAiAnalyzeGymLayoutPage", "openAiExtractGymLayoutZones"]) {
    const calls = [];
    const run = loadFunction(name, {
      process: { env: { OPENAI_API_KEY: "offline-stub" } },
      safeString: (value) => typeof value === "string" ? value.trim() : "",
      resolveOpenAiMiniModel: () => "offline-model",
      resolveDiscoveryVisionModel: () => "offline-model",
      openAiChatCompatibilityParams: () => ({}),
      persistVisionInputDebugArtifact: async (_buffer, artifact) => calls.push({ type: "artifact", artifact }),
      fetch: async () => { calls.push({ type: "mocked-request" }); return { ok: false }; },
    });
    const args = [Buffer.from("offline fixture"), "image/webp"];
    if (name !== "openAiOcrTextFromImage") args.push(undefined);
    await run(...args);
    assert.deepEqual(calls, [{ type: "mocked-request" }], name);
    calls.length = 0;
    await run(...args, { stage: "september-23-2026-ocr", workflow: "gymnastics", page: 2 });
    assert.deepEqual(calls, [
      { type: "artifact", artifact: { stage: "september-23-2026-ocr", workflow: "gymnastics", page: 2, mimeType: "image/webp" } },
      { type: "mocked-request" },
    ], name);
  }
});

test("browser resource candidates retain only the defined discovery kinds", () => {
  const build = loadFunction("toCrawlCandidateFromBrowserDiscovery", {
    safeString: (value) => typeof value === "string" ? value.trim() : "",
    normalizeUrl: (value) => { try { return new URL(value).toString(); } catch { return null; } },
    isAssetUrl: (url) => /\.pdf$/.test(url.pathname),
    normalizeResourceLinkLabel: (label) => label,
    fallbackLinkLabel: () => "Resource",
    scoreDiscoveryCandidate: () => 10,
  });
  const root = new URL("https://example.invalid/september-23-2026");
  for (const [url, sameHost, expected] of [
    ["https://example.invalid/packet.pdf", true, "asset"],
    ["https://example.invalid/venue", true, "html"],
    ["https://other.invalid/results", false, "external"],
  ]) {
    assert.equal(build({ url, sameHost, label: "Details", depth: 0, sourceUrl: root.toString() }, root).kind, expected);
  }
  assert.equal(build({ url: "invalid", sameHost: true, depth: 0 }, root), null);
});
