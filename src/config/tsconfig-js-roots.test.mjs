import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("allowJs includes JavaScript root globs", () => {
  const tsconfig = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "tsconfig.json"), "utf8")
  );

  assert.equal(tsconfig.compilerOptions?.allowJs, true);

  const includes = new Set(tsconfig.include);
  for (const glob of ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"]) {
    assert.ok(includes.has(glob), `missing ${glob} from tsconfig include`);
  }
});
