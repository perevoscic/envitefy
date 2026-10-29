import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import postcss from "postcss";

const out = path.resolve("output/settings-workspace-browser");
await fs.mkdir(out, { recursive: true });
const entry = path.resolve("scripts/fixtures/settings-workspace.tsx");
const moduleStyles = new Map();
const result = await Bun.build({
  entrypoints: [entry],
  outdir: out,
  target: "browser",
  minify: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [
    {
      name: "settings-offline-next-shell",
      setup(builder) {
        builder.onResolve({ filter: /^next-auth\/react$/ }, () => ({ path: entry }));
        builder.onResolve({ filter: /^next\/(image|link|navigation)$/ }, ({ path: name }) => ({
          path: name,
          namespace: "settings-shell",
        }));
        builder.onLoad({ filter: /.*/, namespace: "settings-shell" }, ({ path: name }) => ({
          loader: "tsx",
          contents:
            name === "next/image"
              ? 'import React from "react"; export default function Image({fill,unoptimized,priority,fetchPriority,style,...props}) { return <img {...props} style={fill ? {...style,position:"absolute",inset:0,width:"100%",height:"100%"} : style} />; }'
              : name === "next/link"
                ? 'import React from "react"; export default function Link({prefetch,replace,scroll,...props}) { return <a {...props} />; }'
                : "export function useSearchParams() { return new URLSearchParams(window.location.search); } export function usePathname() { return window.location.pathname; } export function useRouter() { return { push(href) { window.location.assign(href); }, replace(href) { window.location.replace(href); }, refresh() {} }; }",
        }));
        builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
          const css = transform({ filename, code: await fs.readFile(filename), cssModules: true });
          moduleStyles.set(filename, css.code.toString());
          return {
            loader: "js",
            contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(css.exports).map(([key, value]) => [key, value.name])))};`,
          };
        });
      },
    },
  ],
});
assert.ok(result.success, result.logs.map(String).join("\n"));
const sources = [
  "./settings/page.tsx",
  "../components/MainContentWrapper.tsx",
  "../components/ui/gradient-backgrounds.tsx",
  "../components/account/CategoryFavoritesSettings.tsx",
  "../components/account/CategoryInterestPicker.tsx",
  "../components/account/CreationAccessSettings.tsx",
  "../components/account/ProfileAccountDeletion.tsx",
  "../components/account/AccountDeletionRequestForm.tsx",
  "../components/AppleCalendarConnection.tsx",
  "../components/AppearanceSelector.tsx",
  "../components/ui/MobileActionBar.tsx",
];
const source = (await fs.readFile("src/app/globals.css", "utf8")).replace(
  '@import "tailwindcss";',
  `@import "tailwindcss" source(none);\n${sources.map((file) => `@source "${file}";`).join("\n")}`,
);
const globalCss = (
  await postcss([tailwind()]).process(source, { from: path.resolve("src/app/globals.css") })
).css;
await fs.writeFile(path.join(out, "fixture.css"), [globalCss, ...moduleStyles.values()].join("\n"));
