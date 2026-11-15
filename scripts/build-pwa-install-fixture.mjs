import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";

const base = path.resolve("output/pwa-install-browser");
await fs.mkdir(base, { recursive: true });
const out = await fs.mkdtemp(path.join(base, "run-"));
const entry = path.join(out, "entry.tsx");
const component = path.relative(out, path.resolve("src/components/PwaInstallToast.tsx")).replaceAll("\\", "/");
await fs.writeFile(entry, `import {useEffect} from "react";
import {createRoot} from "react-dom/client";
import PwaInstallToast from ${JSON.stringify(component)};
function Fixture(){useEffect(()=>{window.__pwaMounted=true;},[]);return <><h1>Install fixture</h1><PwaInstallToast/></>;}
createRoot(document.getElementById("root")).render(<Fixture/>);`);
const styles = [];
const build = await Bun.build({ entrypoints: [entry], outdir: out, target: "browser",
  define: { "process.env.NODE_ENV": JSON.stringify("test") },
  plugins: [{ name: "pwa-install", setup(builder) {
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
      const result = transform({ filename, code: await fs.readFile(filename), cssModules: true });
      styles.push(result.code.toString());
      return { loader: "js", contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(result.exports).map(([key, value]) => [key, value.name])))};` };
    });
  } }],
});
assert.ok(build.success, build.logs.map(String).join("\n"));
const globals = (await fs.readFile("src/app/globals.css", "utf8")).replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/PwaInstallToast.tsx";');
const css = await postcss([tailwind()]).process(globals, { from: path.resolve("src/app/globals.css") });
await fs.writeFile(path.join(out, "fixture.css"), [css.css, ...styles].join("\n"));
console.log(`Built PWA install fixture in ${out}`);
