import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const sourceRoot = new URL("src/", root);
process.chdir(fileURLToPath(root));

// Resolve the app's aliases and extensionless TypeScript imports in Node, while
// leaving installed packages to Node's normal resolution and execution rules.
registerHooks({
  resolve(specifier, context, nextResolve) {
    let target;
    if (specifier.startsWith("@/")) {
      target = new URL(specifier.slice(2), sourceRoot);
    } else if (specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href)) {
      target = new URL(specifier, context.parentURL);
    }
    if (target) {
      if (!extname(target.pathname) && existsSync(new URL(`${target.href}.ts`))) {
        target = new URL(`${target.href}.ts`);
      }
      return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

for (const file of [
  "lib/media-upload.test.ts",
  "lib/pdf-raster.test.ts",
  "lib/pdf-optimize.test.ts",
  "lib/upload-config.test.ts",
  "lib/share-image.test.ts",
  "middleware.auth-routing.test.mjs",
  "app/landing/page.test.mjs",
  "lib/calendar-sync-pause.test.mjs",
  "lib/calendar-account-isolation.test.mjs",
]) {
  await import(new URL(file, sourceRoot).href);
}
await import("./dependency-compatibility.test.mjs");
