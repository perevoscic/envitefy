import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import sharp from "sharp";
import { buildAppearanceBootstrap } from "../src/lib/appearance.ts";

const out = path.resolve("output/dark-ui-browser");
await fs.mkdir(out, { recursive: true });
const entry = path.join(out, "entry.tsx");
await fs.writeFile(entry, `import React from "react";
import {createRoot} from "react-dom/client";
import ThemeProvider from "../../src/components/AppearanceProvider";
import AppearanceSelector from "../../src/components/AppearanceSelector";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import {SidebarProvider} from "../../src/app/sidebar-context";
import LiveCardBuilder from "../../src/app/live-cards/LiveCardBuilder";
import BirthdayDesignGallery from "../../src/components/birthdays/BirthdayDesignGallery";
import LandingExperience from "../../src/app/landing/LandingExperience";
import ConditionalFooter from "../../src/components/ConditionalFooter";
import SettingsPage from "../../src/app/settings/page";
import PwaInstallToast from "../../src/components/PwaInstallToast";
import HeroTopNav from "../../src/components/navigation/HeroTopNav";
import LeftSidebar from "../../src/app/left-sidebar";
import TopNav from "../../src/components/navigation/TopNav";
import {EventCacheProvider} from "../../src/app/event-cache-context";
import {MenuProvider} from "../../src/contexts/MenuContext";
const screen = new URLSearchParams(location.search).get("screen");
if(screen==="install") window.__snapInstallDeferredPrompt={prompt:async()=>{throw new Error("QA must not request actual installation");},userChoice:Promise.resolve({outcome:"dismissed",platform:"test"})};
const view = screen === "navigation" ? <EventCacheProvider><MenuProvider><LeftSidebar/><div data-testid="signed-in-navbar"><TopNav/></div><main data-testid="navigation-workspace" style={{minHeight:1800,paddingLeft:360,paddingTop:160}}><h1>Navigation QA workspace</h1></main></MenuProvider></EventCacheProvider> : screen === "install" ? <main><h1 className="p-8 text-foreground">Install Envitefy</h1><PwaInstallToast/></main> : screen === "settings" ? <SettingsPage/> : screen === "landing" ? <><LandingExperience/><ConditionalFooter/></>
  : screen === "gallery" ? <><HeroTopNav navLinks={[{label:"Home",href:"/"},{label:"Templates",href:"#templates"}]} authenticatedPrimaryHref="/" onGuestLoginAction={()=>{}} onGuestPrimaryAction={()=>{}}/><BirthdayDesignGallery/><ConditionalFooter/></>
  : <><div className="p-3"><AppearanceSelector compact/></div><LiveCardBuilder initialEventId={null}/></>;
createRoot(document.getElementById("root")!).render(<ThemeProvider><SidebarProvider><UnsavedProgressProvider>{view}</UnsavedProgressProvider></SidebarProvider></ThemeProvider>);`);
const styles = new Map();
const mocks = {
  "@/app/providers": 'export {useTheme} from "../../src/components/AppearanceProvider";',
  "@/lib/pwa/install-state": 'export function useInstalledAppState(){return {installState:{status:"not_installed"},markInstalled(){}};}',
  "next/navigation": `const params = new URLSearchParams(location.search); export function usePathname(){return location.pathname;} export function useSearchParams(){return params;} export function useRouter(){return {push(url){(window.navigations||=[]).push(url);},replace(){},refresh(){},prefetch(){}};}`,
  "next-auth/react": `import {createContext} from "react"; const signedIn=["settings","navigation"].includes(new URLSearchParams(location.search).get("screen"));const data=signedIn?{user:{id:"appearance-fixture",email:"casey@example.test",name:"Casey Example",productScopes:["snap","live_card","event_page","signup_form"]}}:null; export const SessionContext=createContext({data,status:signedIn?"authenticated":"unauthenticated"}); export function useSession(){return {status:signedIn?"authenticated":"unauthenticated",data,update:async()=>{}};} export function SessionProvider({children}){return children;} export async function getSession(){return null;} export async function signIn(){} export async function signOut(){}`,
  "next/dynamic": 'import React,{lazy,Suspense} from "react"; export default function dynamic(load){const C=lazy(async()=>{const result=await load();return {default:result.default||result};});return props=><Suspense fallback={null}><C {...props}/></Suspense>;}',
  "next/link": 'import React from "react"; export default function Link({prefetch,...props}){return <a {...props}/>;}',
  "next/image": 'import React from "react"; export function getImageProps({fill,priority,quality,unoptimized,...props}){const s=props.src;return {props:{...props,src:typeof s==="object"?s.src:s,width:props.width||s?.width,height:props.height||s?.height}};} export default function Image(props){return <img {...getImageProps(props).props}/>;}',
  "next/dist/shared/lib/app-router-context.shared-runtime": 'import {createContext} from "react"; export const AppRouterContext=createContext(null);',
};
const build = await Bun.build({
  entrypoints: [entry], outdir: out, target: "browser", minify: false, external: ["/fonts/*"],
  define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
  plugins: [{ name: "dark-ui-real-components", setup(builder) {
    builder.onLoad({ filter: /\.module\.css$/ }, async ({path: filename}) => {
      const result = transform({ filename, code: await fs.readFile(filename), cssModules: true });
      styles.set(filename, result.code.toString());
      return { loader: "js", contents: `export default ${JSON.stringify(Object.fromEntries(Object.entries(result.exports).map(([key,value])=>[key,value.name])))};` };
    });
    builder.onLoad({ filter: /\.(png|webp|jpe?g)$/ }, async ({path: filename}) => {
      const metadata = await sharp(filename).metadata();
      const src = `/${path.relative(path.resolve("public"), filename).replaceAll("\\", "/")}`;
      return { loader: "js", contents: `export default ${JSON.stringify({src,width:metadata.width,height:metadata.height})};` };
    });
    for (const name of Object.keys(mocks)) {
      builder.onResolve({ filter: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`) }, () => ({path:name,namespace:"fixture"}));
    }
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({path:name}) => ({ loader:"tsx", contents:mocks[name] }));
  }}],
});
assert.ok(build.success, build.logs.map(String).join("\n"));
await fs.writeFile(path.join(out,"entry.css"), [
  ...(await Promise.all(build.outputs.filter(file=>file.path.endsWith(".css")).map(file=>file.text()))),
  ...styles.values(),
].join("\n"));
const globals = (await fs.readFile("src/app/globals.css","utf8")).replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components";\n@source "./landing";\n@source "./live-cards";\n@source "./settings";\n@source "./left-sidebar.tsx";\n@source "./left-sidebar.model.ts";');
const css = await postcss([tailwind()]).process(globals,{from:path.resolve("src/app/globals.css")});
await fs.writeFile(path.join(out,"global.css"),css.css);
await fs.writeFile(path.join(out,"bootstrap.js"), buildAppearanceBootstrap());
console.log(`Built real Live Card, birthday gallery, marketing and navigation fixtures in ${out}`);
