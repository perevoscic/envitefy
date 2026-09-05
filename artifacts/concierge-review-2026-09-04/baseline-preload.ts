import { plugin } from "bun";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = new Set([
  "src/lib/concierge/creation-intent.ts",
  "src/lib/concierge/extract.ts",
  "src/lib/concierge/fallback.ts",
  "src/lib/concierge/intake.ts",
  "src/lib/concierge/persona.ts",
  "src/lib/concierge/types.ts",
  "src/lib/concierge/public-copy.ts",
]);
plugin({ name: "concierge-baseline", setup(builder) {
  builder.onLoad({ filter: /concierge[\\/].*\.ts$/ }, (args) => {
    const relative = args.path.replaceAll("\\", "/").split("/envitefy/")[1];
    if (!files.has(relative)) return { contents: readFileSync(args.path, "utf8"), loader: "ts" };
    return { contents: execFileSync("git", ["show", `HEAD:${relative}`], { encoding: "utf8" }), loader: "ts" };
  });
} });
