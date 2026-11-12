import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";

const out = path.resolve("output/gymnastics-import-progress");
await fs.mkdir(out, { recursive: true });
const styles = new Map();
const mocks = {
  "next/navigation": `export function useRouter() { return {push(url) { (window.navigations ||= []).push(url); setTimeout(() => window.dispatchEvent(new CustomEvent("fixture-navigation", {detail: url})), window.fixtureNavigationDelay || 0); }}; }`,
  "next/link": `import React from "react"; export default function Link({children, prefetch, ...props}) { return <a {...props}>{children}</a>; }`,
  "next-auth/react": `export function useSession() { return {status: "authenticated", data: {user: {id: "fixture"}}}; }`,
};
const result = await Bun.build({
  entrypoints: [path.resolve("scripts/fixtures/gymnastics-import-progress.tsx")],
  outdir: out, naming: "fixture.js", target: "browser", minify: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [{ name: "gymnastics-import-progress-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/navigation|next\/link|next-auth\/react)$/ }, ({ path: name }) => ({ path: name, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({ contents: mocks[name], loader: "tsx" }));
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
      const css = transform({ filename, code: await fs.readFile(filename), cssModules: true });
      styles.set(filename, css.code.toString());
      return { loader: "js", contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(css.exports).map(([key, value]) => [key, value.name])))};` };
    });
    builder.onLoad({ filter: /\.css$/ }, async ({ path: filename }) => {
      styles.set(filename, await fs.readFile(filename, "utf8"));
      return { loader: "js", contents: "export default {};" };
    });
  } }],
});
assert.ok(result.success, result.logs.map(String).join("\n"));
const tailwindCss = await postcss([tailwind()]).process(
  '@import "tailwindcss" source(none); @source "../src/components/event-create"; @source "../src/components/CopyButton.tsx";',
  { from: path.resolve("scripts/gymnastics-import-progress.css") },
);
await fs.writeFile(path.join(out, "fixture.css"), [tailwindCss.css, ...styles.values()].join("\n"));
