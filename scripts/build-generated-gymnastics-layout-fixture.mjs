import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { transform } from "lightningcss";

const out = path.resolve("output/generated-gymnastics-layout");
await fs.mkdir(out, { recursive: true });
const styles = new Map();
const result = await Bun.build({
  entrypoints: [path.resolve("scripts/fixtures/event-section-layout.tsx")],
  outdir: out,
  naming: "fixture.js",
  target: "browser",
  minify: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [
    {
      name: "generated-gymnastics-layout-fixture",
      setup(builder) {
        builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
          const css = transform({
            filename,
            code: await fs.readFile(filename),
            cssModules: true,
          });
          styles.set(filename, css.code.toString());
          return {
            loader: "js",
            contents: `export default ${JSON.stringify(
              Object.fromEntries(
                Object.entries(css.exports).map(([key, value]) => [key, value.name]),
              ),
            )};`,
          };
        });
        builder.onLoad({ filter: /\.css$/ }, async ({ path: filename }) => {
          styles.set(filename, await fs.readFile(filename, "utf8"));
          return { loader: "js", contents: "export default {};" };
        });
      },
    },
  ],
});

assert.ok(result.success, result.logs.map(String).join("\n"));
await fs.writeFile(path.join(out, "fixture.css"), [...styles.values()].join("\n"));
