import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
const out = path.resolve(".qa/livecard-builder");
await fs.mkdir(out, { recursive: true });
const entry = path.join(out, "entry.tsx");
await fs.writeFile(
  entry,
  `import React from "react";
import { createRoot } from "react-dom/client";
import LiveCardBuilder from "../../src/app/livacards-invites/LiveCardBuilder";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
createRoot(document.getElementById("root")!).render(<UnsavedProgressProvider><a href="/leave" id="leave">Leave editor</a><LiveCardBuilder initialEventId={new URLSearchParams(location.search).get("edit")} /></UnsavedProgressProvider>);`,
);
const build = await Bun.build({
  entrypoints: [entry],
  outdir: out,
  target: "browser",
  minify: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [
    {
      name: "isolated-browser-shell",
      setup(builder) {
        builder.onResolve({ filter: /^next\/image$/ }, () => ({
          path: "image",
          namespace: "fixture",
        }));
        builder.onResolve(
          { filter: /^next\/dist\/shared\/lib\/app-router-context.shared-runtime$/ },
          () => ({ path: "router", namespace: "fixture" }),
        );
        builder.onResolve({ filter: /^@\/components\/CalendarAction$/ }, () => ({
          path: "calendar",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({
          loader: "tsx",
          contents:
            name === "image"
              ? 'import React from "react"; export default function Image({fill,fetchPriority,...props}) { return <img {...props} />; }'
              : name === "router"
                ? 'import {createContext} from "react"; export const AppRouterContext = createContext(null);'
                : 'export function useCalendarAction({links}) { return { links, label: "Add to calendar", hasDefault: false, dialog: null, open() {} }; }',
        }));
      },
    },
  ],
});
assert.ok(build.success, build.logs.map(String).join("\n"));
const globals = (await fs.readFile("src/app/globals.css", "utf8")).replace(
  '@import "tailwindcss";',
  '@import "tailwindcss" source(none);\n@source "./livacards-invites/LiveCardBuilder.tsx";\n@source "../components/UnsavedProgressProvider.tsx";\n@source "../components/ArtworkPreviewDialog.tsx";\n@source "../components/studio/StudioShowcaseLiveCard.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";',
);
const css = await postcss([tailwind()]).process(globals, {
  from: path.resolve("src/app/globals.css"),
});
await fs.writeFile(path.join(out, "global.css"), css.css);
