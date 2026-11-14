import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

test("Next config discovery retains project code and route types without walking archived runtimes", () => {
  const config = JSON.parse(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"));
  const entries = {
    "/project": { files: ["next.config.ts"], directories: ["src", "scripts", "tests", ".next", "android", "ios", "output", "artifacts", "video-studio", "tmp", "qa-artifacts"] },
    "/project/src": { files: ["page.tsx", "page.test.ts"], directories: [] },
    "/project/scripts": { files: ["verify.mjs"], directories: [] },
    "/project/tests": { files: ["workflow.test.ts"], directories: [] },
    "/project/.next": { files: [], directories: ["types"] },
    "/project/.next/types": { files: ["routes.d.ts"], directories: [] },
    "/project/android": { files: [], directories: ["scripts", "app"] },
    "/project/android/scripts": { files: ["verify.mjs"], directories: [] },
    "/project/android/app": { files: [], directories: ["build"] },
    "/project/ios": { files: [], directories: ["scripts", "Pods", "build"] },
    "/project/ios/scripts": { files: ["verify.mjs"], directories: [] },
  };
  // TypeScript may list an excluded directory itself, but must never descend
  // into its runtime tree or include the archived source files it contains.
  for (const directory of ["output", "artifacts", "video-studio", "tmp", "qa-artifacts", "ios/Pods", "ios/build"]) {
    entries[`/project/${directory}`] = { files: ["archive.ts"], directories: ["runtime"] };
  }
  const visited = new Set();
  const parsed = ts.parseJsonConfigFileContent(config, {
    useCaseSensitiveFileNames: true,
    fileExists: () => false,
    readFile: () => undefined,
    readDirectory: (root, extensions, excludes, includes, depth) => ts.matchFiles(
      root, extensions, excludes, includes, true, "/project", depth,
      (directory) => {
        visited.add(directory);
        assert.ok(entries[directory], `TypeScript descended into generated/archive directory ${directory}`);
        return entries[directory];
      },
      (filename) => filename,
    ),
  }, "/project");
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.fileNames.length, 8);
  for (const filename of ["next.config.ts", "src/page.tsx", "src/page.test.ts", "scripts/verify.mjs", "tests/workflow.test.ts", ".next/types/routes.d.ts", "android/scripts/verify.mjs", "ios/scripts/verify.mjs"]) {
    assert.ok(parsed.fileNames.includes(`/project/${filename}`), `Lost project input ${filename}`);
  }
  assert.ok(visited.has("/project/src"));
});
