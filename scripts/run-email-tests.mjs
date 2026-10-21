import { registerHooks } from "node:module";

const sourceRoot = new URL("../src/", import.meta.url);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = new URL(specifier.slice(2), sourceRoot);
      if (!/\.[a-z]+$/i.test(target.pathname)) target.pathname += ".ts";
      return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

try {
  for (const file of [
    "lib/email-templates/magazine-1.test.ts",
    "lib/email-templates/features-oct26.test.ts",
    "lib/admin/email-generator.test.ts",
    "lib/admin/email-generation-guide.test.ts",
    "lib/admin/email-campaigns.test.ts",
    "lib/email-template.source.test.mjs",
    "lib/email.rsvp-image.source.test.mjs",
    "lib/email-design.test.cjs",
    "lib/admin/email-design-version.test.cjs",
  ]) await import(new URL(file, sourceRoot).href);
} finally {
  hooks.deregister();
}
