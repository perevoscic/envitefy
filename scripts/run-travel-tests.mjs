import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { execFileSync } from "node:child_process";
registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = specifier.startsWith("@/")
      ? pathToFileURL(path.resolve("src", specifier.slice(2))).href
      : specifier;
    try {
      return nextResolve(target, context);
    } catch (error) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" &&
        (specifier.startsWith(".") || specifier.startsWith("@/")) &&
        !/\.[a-z]+$/i.test(target)
      )
        return nextResolve(`${target}.ts`, context);
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".ts") && !url.includes("/node_modules/")) {
      const source =
        process.env.TRAVEL_TEST_RENDERER_BASELINE === "1" &&
        url.endsWith("/buildGymMeetDiscoveryContent.ts")
          ? execFileSync(
              "git",
              ["show", "HEAD:src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts"],
              { encoding: "utf8" },
            )
          : readFileSync(new URL(url), "utf8");
      return {
        format: "module",
        source: ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
for (const file of process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["src/lib/travel-accommodation-enrichment.test.ts"])
  await import(pathToFileURL(path.resolve(file)).href);
