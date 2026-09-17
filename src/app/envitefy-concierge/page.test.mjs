import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(new URL("./page.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);
const module = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (name) => {
    assert.equal(name, "next/navigation");
    return { permanentRedirect: (destination) => { throw new Error(destination); } };
  }, module, module.exports,
);

test("the former Concierge introduction redirects to Create with query parameters intact", async () => {
  for (const [params, destination] of [
    [undefined, "/envitefy-create"],
    [{}, "/envitefy-create"],
    [{ utm_source: "old email", ref: ["birthday", "wedding"], ignored: undefined }, "/envitefy-create?utm_source=old+email&ref=birthday&ref=wedding"],
  ]) {
    await assert.rejects(
      module.exports.default({ searchParams: params ? Promise.resolve(params) : undefined }),
      { message: destination },
    );
  }
});
