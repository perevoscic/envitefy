import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const loadConfig = require("next/dist/server/config").default;
const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const { getPathMatch } = require("next/dist/shared/lib/router/utils/path-match");
const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("old Ad Studio bookmarks redirect to the admin dashboard", async () => {
  const config = await loadConfig(PHASE_PRODUCTION_BUILD, repoRoot, { silent: true });
  const redirects = await config.redirects();
  const redirect = redirects.find((candidate) =>
    getPathMatch(candidate.source, { strict: true })("/admin/ad-studio"),
  );

  assert.ok(redirect, "Next must handle the retired /admin/ad-studio URL");
  assert.equal(redirect.destination, "/admin");
  assert.ok(!redirect.has?.length && !redirect.missing?.length, "The redirect must be unconditional");
});

test("Ad Studio routes, implementation and compatibility exports are removed", async () => {
  for (const relativePath of [
    "src/app/admin/ad-studio",
    "src/app/api/admin/ad-studio",
    "src/lib/admin/ad-studio",
    "src/lib/admin/ad-studio.ts",
    "src/lib/admin/ad-studio-types.ts",
    "scripts/admin-ad-studio-tracing.test.mjs",
  ]) {
    await assert.rejects(
      fs.lstat(path.join(repoRoot, relativePath)),
      { code: "ENOENT" },
      `${relativePath} must not remain after retirement`,
    );
  }
});

async function productionSources(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && !["__tests__", "__fixtures__"].includes(entry.name)) {
      files.push(...(await productionSources(filename)));
    } else if (
      entry.isFile() &&
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !/\.(?:test|spec)\./.test(entry.name)
    ) {
      files.push(filename);
    }
  }
  return files;
}

test("production code contains no Ad Studio imports, links or API requests", async () => {
  const retiredPath = /(?:^|\/)ad-studio(?:-types)?(?:[/?#]|(?:\.[cm]?[jt]sx?)?$)/;
  const literalKinds = new Set([
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    ts.SyntaxKind.TemplateTail,
  ]);
  const references = [];
  for (const filename of await productionSources(path.join(repoRoot, "src"))) {
    const source = await fs.readFile(filename, "utf8");
    if (!source.includes("ad-studio")) continue;
    const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    function inspect(node) {
      if (literalKinds.has(node.kind) && retiredPath.test(node.text)) {
        const { line } = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
        references.push(`${path.relative(repoRoot, filename)}:${line + 1}: ${node.text}`);
      }
      ts.forEachChild(node, inspect);
    }
    inspect(parsed);
  }

  assert.deepEqual(references, [], `Retired feature references remain:\n${references.join("\n")}`);
});

test("Live Card, marketing workflows and their shared dependencies remain available", async () => {
  for (const relativePath of [
    "src/app/envitefy-create/page.tsx",
    "src/app/api/livecard-builder/jobs/route.ts",
    "src/app/api/livecard-builder/design/route.ts",
    "src/app/studio/page.tsx",
    "src/app/studio/StudioWorkspace.tsx",
    "src/app/api/studio/generate/route.ts",
    "src/lib/studio/openai.ts",
    "src/lib/studio/card-edit-preview.ts",
    "src/app/api/admin/marketing-campaigns/route.ts",
    "src/lib/admin/marketing-campaigns.ts",
    "scripts/generate-marketing-campaign.mjs",
    "scripts/lib/campaign-run.mjs",
    "video-studio/STUDIO-GUIDE.md",
    "src/lib/openai-chat-params.ts",
    "src/lib/brand-assets.ts",
    "public/brand/wordmark-v2/envitefy-wordmark.webp",
  ]) {
    const stat = await fs.stat(path.join(repoRoot, relativePath));
    assert.ok(stat.isFile(), `${relativePath} is shared with retained workflows`);
  }
  const manifest = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
  for (const dependency of ["openai", "sharp", "@napi-rs/canvas", "lucide-react"]) {
    assert.equal(typeof manifest.dependencies[dependency], "string", `${dependency} is shared`);
  }
});
