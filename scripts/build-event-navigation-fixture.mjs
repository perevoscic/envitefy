import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import sharp from "sharp";

const base = path.resolve("output/event-navigation-browser");
await fs.mkdir(base, { recursive: true });
const out = await fs.mkdtemp(path.join(base, "run-"));
const styles = [];
const mocks = {
  "next/navigation": "export function usePathname(){return location.pathname;}",
  "next/link": 'import React from "react"; export default function Link({prefetch,...props}){return <a {...props}/>;}',
  "next/image": 'import React from "react"; export default function Image({priority,fill,quality,unoptimized,...props}){const s=props.src;return <img {...props} src={typeof s==="object"?s.src:s}/>;}',
};
const build = await Bun.build({
  entrypoints: ["scripts/fixtures/event-navigation.tsx"], outdir: out, target: "browser",
  external: ["/fonts/*"],
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [{ name: "event-navigation", setup(builder) {
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
      const result = transform({ filename, code: await fs.readFile(filename), cssModules: true });
      styles.push(result.code.toString());
      return { loader: "js", contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(result.exports).map(([key, value]) => [key, value.name])))};` };
    });
    builder.onLoad({ filter: /\.(png|webp|jpe?g)$/ }, async ({ path: filename }) => {
      const { width, height } = await sharp(filename).metadata();
      const src = `/${path.relative(path.resolve("public"), filename).replaceAll("\\", "/")}`;
      return { loader: "js", contents: `export default ${JSON.stringify({ src, width, height })};` };
    });
    for (const name of Object.keys(mocks)) {
      builder.onResolve({ filter: new RegExp(`^${name}$`) }, () => ({ path: name, namespace: "fixture" }));
    }
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({ loader: "tsx", contents: mocks[name] }));
  } }],
});
assert.ok(build.success, build.logs.map(String).join("\n"));
const source = (await fs.readFile("src/app/globals.css", "utf8")).replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/navigation/MobileNavHeader.tsx";\n@source "../components/event-skin-layout.ts";\n@source "../components/MainContentWrapper.tsx";\n@source "../components/EventPreviewViewport.tsx";\n@source "../components/EventCanvas.tsx";');
const globals = await postcss([tailwind()]).process(source, { from: path.resolve("src/app/globals.css") });
const bundledCss = await Promise.all(build.outputs.filter(file => file.path.endsWith(".css")).map(file => file.text()));
await fs.writeFile(path.join(out, "fixture.css"), [globals.css, ...bundledCss, ...styles].join("\n"));
console.log(`Built event navigation fixture in ${out}`);
