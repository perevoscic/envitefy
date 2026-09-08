import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(new URL("./page.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);
const module = { exports: {} };
const dependencies = {
  "next/navigation": {
    permanentRedirect: (destination) => {
      throw new Error(`redirect:${destination}`);
    },
  },
  "@/lib/landing-showcase": {
    resolveLandingShowcaseSnapshot: (value) => value === "birthday" ? { slug: "birthday" } : null,
    buildLandingShowcasePath: (slug) => `/showcase/${slug}`,
  },
};
new Function("require", "module", "exports", outputText)(
  (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports,
);
const StudioPage = module.exports.default;

test("retired Studio visits go to the Concierge introduction", async () => {
  for (const params of [undefined, {}, { step: "details", auth: "login" }, { showcase: "missing" }]) {
    await assert.rejects(
      StudioPage({ searchParams: params ? Promise.resolve(params) : undefined }),
      { message: "redirect:/envitefy-concierge" },
    );
  }
});

test("legacy showcase and saved-event bookmarks retain their destination", async () => {
  for (const [params, target] of [
    [{ showcase: "birthday" }, "/showcase/birthday"],
    [{ showcase: ["birthday", "ignored"] }, "/showcase/birthday"],
    [{ editEvent: "old-event" }, "/event/old-event"],
    [{ editEvent: ["old-event", "ignored"] }, "/event/old-event"],
    [{ editEvent: "//external.test/path" }, "/event/%2F%2Fexternal.test%2Fpath"],
  ]) {
    await assert.rejects(StudioPage({ searchParams: Promise.resolve(params) }), {
      message: `redirect:${target}`,
    });
  }
});
