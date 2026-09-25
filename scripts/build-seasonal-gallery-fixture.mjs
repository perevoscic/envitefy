import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";

const out = path.resolve("output/seasonal-gallery");
await fs.mkdir(out, { recursive: true });
const entry = path.join(out, "entry.tsx");
await fs.writeFile(
  entry,
  `
import React from "react";
import {createRoot} from "react-dom/client";
import GeneralGallery from "../../src/app/event/general/page";
import BirthdayGallery from "../../src/components/birthdays/BirthdayDesignGallery";
import WeddingGallery from "../../src/components/weddings/WeddingDesignGallery";
import {HOLIDAY_COLLECTIONS} from "../../src/lib/holiday-collections";
import {getPublicTemplates} from "../../src/lib/public-template-catalog";
import {GENERAL_EVENT_DESIGNS} from "../../src/lib/general-event-designs";
import {createEmptySignupTemplateForm} from "../../src/lib/signup-starters";

import PublicTemplateGallery from "../../src/components/templates/PublicTemplateGallery";
import {CUSTOM_EVENT_CATEGORIES, takeCustomEventPage} from "../../src/lib/event-custom-design";
import {takeSignupTheme} from "../../src/lib/signup-theme-handoff";
import {getCategoryCustomDesignProfile} from "../../src/lib/category-custom-design-profiles";
window.galleryFixture = {collections: HOLIDAY_COLLECTIONS, getPublicTemplates, generalDesigns: GENERAL_EVENT_DESIGNS, createEmptySignupTemplateForm};
window.fixture = {categories: [...Object.keys(CUSTOM_EVENT_CATEGORIES), "signup-forms"], profile: getCategoryCustomDesignProfile, takeCustomEventPage, takeSignupTheme};
const params = new URLSearchParams(location.search);
const category = params.get("category") || "weddings";
createRoot(document.getElementById("root")!).render(<main>
  {category === "signup-forms"
    ? <PublicTemplateGallery category="signup-forms" featured={params.get("featured") === "1"} customThemeRequested={params.get("customTheme") === "1"} />
    : category === "general" ? <GeneralGallery /> : category === "birthdays" ? <BirthdayGallery /> : <WeddingGallery />}
</main>);
`,
);
const styles = new Map();
const mocks = {
  "@/components/EventCreateWysiwyg": 'export default function Editor() {return null;}', 
  "next/navigation": `
    export function usePathname() { return location.pathname; }
    export function useSearchParams() { return new URLSearchParams(location.search); }
    export function useRouter() { return {push(url) { (window.navigations ||= []).push(url); }, replace() {}, refresh() {}}; }
  `,
  "next-auth/react": `
    import {useSyncExternalStore} from "react";
    let status = new URLSearchParams(location.search).get("status") || "authenticated";
    const listeners = new Set();
    const subscribe = fn => {listeners.add(fn); return () => listeners.delete(fn);};
    window.setTestSession = next => { status = next; listeners.forEach(fn => fn()); };
    export function useSession() { return {status: useSyncExternalStore(subscribe, () => status), update: async () => window.setTestSession("authenticated")}; }
    export const SessionProvider = ({children}) => children;
    export async function getSession() {return null;}
    export async function signIn() {}
    export async function signOut() {}
  `,
  "@/components/auth/AuthModal": `
    import React from "react";
    export default function Auth({open, onAuthenticated}) { return open ? <button onClick={() => onAuthenticated()}>Continue test sign-in</button> : null; }
  `,
  "next/dynamic": `
    import React, {lazy, Suspense} from "react";
    export default function dynamic(load) { const C = lazy(load); return props => <Suspense fallback={null}><C {...props}/></Suspense>; }
  `,
  "next/link":
    'import React from "react"; export default function Link({prefetch, ...props}) {return <a {...props}/>;}',
  "next/image":
    'import React from "react"; export default function Image({fill, priority, ...props}) {return <img {...props}/>;}',
  "@/components/CalendarAction": `
    import React from "react";
    export function useCalendarAction({links}) { return {links, label: "Add to calendar", dialog: null, open() {}}; }
    export default function CalendarAction() {return null;}
  `,
};
const result = await Bun.build({
  entrypoints: [entry],
  outdir: out,
  target: "browser",
  minify: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [
    {
      name: "category-fixture",
      setup(builder) {
        builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
          const css = transform({ filename, code: await fs.readFile(filename), cssModules: true });
          styles.set(filename, css.code.toString());
          return {
            loader: "js",
            contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(css.exports).map(([key, value]) => [key, value.name])))};`,
          };
        });
        for (const name of Object.keys(mocks)) {
          builder.onResolve(
            { filter: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) },
            () => ({ path: name, namespace: "fixture" }),
          );
        }
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({
          loader: "tsx",
          contents: mocks[name],
        }));
      },
    },
  ],
});
assert.ok(result.success, result.logs.map(String).join("\n"));
await fs.writeFile(path.join(out, "entry.css"), [...styles.values()].join("\n"));
const globals = (await fs.readFile("src/app/globals.css", "utf8")).replace(
  '@import "tailwindcss";',
  '@import "tailwindcss" source(none);\n@source "../components/events/CreateWithEnvitefyCallout.tsx";\n@source "../components/events/EventCustomThemeLauncher.tsx";\n@source "../components/templates/PublicTemplateGallery.tsx";\n@source "../components/events/SeasonalGalleryControls.tsx";\n@source "../components/events/EventDesignGallery.tsx";\n@source "../components/events/TemplateMasonryGallery.tsx";\n@source "../components/birthdays/BirthdayDesignGallery.tsx";\n@source "../components/weddings/WeddingDesignGallery.tsx";\n@source "./event/general/page.tsx";',
);
const css = await postcss([tailwind()]).process(globals, {
  from: path.resolve("src/app/globals.css"),
});
await fs.writeFile(path.join(out, "global.css"), css.css);
