import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";

const out = path.resolve("output/category-custom-design");
await fs.mkdir(out, { recursive: true });
const entry = path.join(out, "entry.tsx");
await fs.writeFile(
  entry,
  `
import React from "react";
import {createRoot} from "react-dom/client";
import EventCustomEditor from "../../src/components/events/custom/EventCustomEditor";
import CustomEventPageContent from "../../src/components/events/custom/CustomEventPageContent";
import EventCustomThemeLauncher from "../../src/components/events/EventCustomThemeLauncher";
import PublicTemplateGallery from "../../src/components/templates/PublicTemplateGallery";
import {CUSTOM_EVENT_CATEGORIES, takeCustomEventPage} from "../../src/lib/event-custom-design";
import {takeSignupTheme} from "../../src/lib/signup-theme-handoff";
import {getCategoryCustomDesignProfile} from "../../src/lib/category-custom-design-profiles";
import UnsavedProgressProvider from "@/components/UnsavedProgressProvider";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {fixtureRouter} from "next/navigation";
window.fixture = {categories: [...Object.keys(CUSTOM_EVENT_CATEGORIES), "signup-forms"], profile: getCategoryCustomDesignProfile, takeCustomEventPage, takeSignupTheme};
const params = new URLSearchParams(location.search);
const category = params.get("category") || "weddings";
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={fixtureRouter}><UnsavedProgressProvider><main>
  {params.get("guest") === "1" ? <CustomEventPageContent page={window.testEditorPage} eventId={params.get("eventId") || undefined} /> : params.get("editor") === "1" ? <EventCustomEditor initialPage={window.testEditorPage} /> : category === "signup-forms"
    ? <PublicTemplateGallery category="signup-forms" featured={params.get("featured") === "1"} customThemeRequested={params.get("customTheme") === "1"} />
    : <EventCustomThemeLauncher category={category} />}
</main></UnsavedProgressProvider></AppRouterContext.Provider>);
`,
);
const styles = new Map();
const mocks = {
  "@/components/UnsavedProgressProvider": `
    import Provider, {useUnsavedProgress as useRealProgress} from "real-unsaved-progress";
    export default Provider;
    export {useEventProgress, useProgressNavigation} from "real-unsaved-progress";
    export function useUnsavedProgress(progress) { window.editorProgress = progress; return useRealProgress(progress); }
  `,
  "@/utils/media-upload-client": `
    export function validateClientUploadFile() {return null;}
    export function createObjectUrlPreview() {return null;}
    export function revokeObjectUrl() {}
    export function getUploadAcceptAttribute() {return "image/*";}
    export function mergeUploadedEventMedia(value) {return value;}
    export async function uploadMediaFile() {throw new Error("Unexpected fixture upload");}
    export async function persistImageMediaValue({value}) { if (!value.startsWith("data:")) return value; (window.imageUploads ||= []).push(value); return "/api/blob/event-media/replacement.webp"; }
  `,
  "next/navigation": `
    import {useContext} from "react";
    import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";
    export function usePathname() { return location.pathname; }
    export function useSearchParams() { return new URLSearchParams(location.search); }
    export const fixtureRouter = {push(url) { (window.navigations ||= []).push(url); }, replace() {}, refresh() {}};
    export function useRouter() { return useContext(AppRouterContext) || fixtureRouter; }
  `,
  "next/dist/shared/lib/app-router-context.shared-runtime": `
    import {createContext} from "react";
    export const AppRouterContext = createContext(null);
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
        builder.onResolve({ filter: /^real-unsaved-progress$/ }, () => ({path: path.resolve("src/components/UnsavedProgressProvider.tsx"), namespace: "file"}));
        builder.onResolve({ filter: /^\.\.\/src\/utils\/media-upload-client$/, namespace: "fixture" }, () => ({path: path.resolve("src/utils/media-upload-client.ts"), namespace: "file"}));
        builder.onLoad({ filter: /\.module\.css$/ }, async ({ path: filename }) => {
          const css = transform({ filename, code: await fs.readFile(filename), cssModules: true });
          styles.set(filename, css.code.toString());
          return {
            loader: "js",
            contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(css.exports).map(([key, value]) => [key, value.name])))};`,
          };
        });
        builder.onLoad({ filter: /\.css$/ }, async ({ path: filename }) => {
          styles.set(filename, await fs.readFile(filename, "utf8"));
          return { loader: "js", contents: "export default {};" };
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
          resolveDir: path.resolve("scripts"),
        }));
      },
    },
  ],
});
assert.ok(result.success, result.logs.map(String).join("\n"));
await fs.writeFile(path.join(out, "entry.css"), [...styles.values()].join("\n"));
const globals = (await fs.readFile("src/app/globals.css", "utf8")).replace(
  '@import "tailwindcss";',
  '@import "tailwindcss" source(none);\n@source "../components/events/CreateWithEnvitefyCallout.tsx";\n@source "../components/events/EventCustomThemeLauncher.tsx";\n@source "../components/events/HeroImageEditor.tsx";\n@source "../components/templates/PublicTemplateGallery.tsx";\n@source "../components/UnsavedProgressProvider.tsx";',
);
const css = await postcss([tailwind()]).process(globals, {
  from: path.resolve("src/app/globals.css"),
});
await fs.writeFile(path.join(out, "global.css"), css.css);
