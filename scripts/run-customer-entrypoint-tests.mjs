import { registerHooks } from "node:module";

const sourceRoot = new URL("../src/", import.meta.url);

// Node's TypeScript runner does not read the Next.js @/ path alias from tsconfig.
// Keep resolution scoped to application imports so dependency loading is unchanged.
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
    "app/studio/customer-entrypoints.test.mjs",
    "app/studio/retired-route.test.mjs",
    "app/guides/page.test.mjs",
    "lib/email-templates/magazine-1.test.ts",
    "lib/admin/email-generation-guide.test.ts",
    "lib/guest-chat/respond.test.mjs",
    "components/navigation/marketing-hero-nav.test.mjs",
  ]) {
    await import(new URL(file, sourceRoot).href);
  }
} finally {
  hooks.deregister();
}
