import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { transform } from "lightningcss";
import sharp from "sharp";
import { buildAppearanceBootstrap } from "../src/lib/appearance.ts";

const out = path.resolve("output/public-dark-audit");
await fs.mkdir(out, { recursive: true });
const entry = path.join(out, "entry.tsx");
await fs.writeFile(entry, `import React from "react";
import {createRoot} from "react-dom/client";
import AppearanceProvider from "../../src/components/AppearanceProvider";
import UnsavedProgressProvider from "../../src/components/UnsavedProgressProvider";
import {SidebarProvider} from "../../src/app/sidebar-context";
import About from "../../src/app/about/page";
import Contact from "../../src/app/contact/page";
import Faq from "../../src/app/faq/page";
import Guides from "../../src/app/guides/page";
import {GuidePageView,guidePages} from "../../src/app/guides/guide-content";
import HowItWorks from "../../src/app/how-it-works/page";
import Privacy from "../../src/app/privacy/page";
import Terms from "../../src/app/terms/page";
import Forgot from "../../src/app/forgot/page";
import Reset from "../../src/app/reset/ResetPasswordPageClient";
import Verify from "../../src/app/verify-request/page";
import Unsubscribe from "../../src/app/unsubscribe/page";
import Category from "../../src/app/category-pages/CategoryLandingView";
import {getUseCasePageByPath} from "../../src/app/category-pages/category-page-data";
import Birthdays from "../../src/app/birthdays/BirthdaysLandingView";
import Weddings from "../../src/app/weddings/WeddingsLandingView";
import Sports from "../../src/components/sports-landing/SportsLandingPage";
import Gymnastics from "../../src/components/gymnastics-landing/GymnasticsLanding";
import Snap from "../../src/components/snap-landing/SnapLanding";
const p=new URLSearchParams(location.search),screen=p.get("screen")||"about";
const views={about:<About/>,contact:<Contact/>,faq:<Faq/>,guides:<Guides/>,"how-it-works":<HowItWorks/>,privacy:<Privacy/>,terms:<Terms/>,forgot:<Forgot/>,reset:<Reset/>,"verify-request":<Verify/>,birthdays:<Birthdays page={getUseCasePageByPath("/birthdays")!}/>,weddings:<Weddings page={getUseCasePageByPath("/weddings")!}/>,sports:<Sports/>,gymnastics:<Gymnastics/>,snap:<Snap/>};
let view=screen==="guide"?<GuidePageView slug={p.get("slug")||guidePages[0].slug}/>:screen==="category"?<Category page={getUseCasePageByPath(p.get("path")||"/baby-showers")!}/>:views[screen];
if(screen==="unsubscribe") view=await Unsubscribe({searchParams:Promise.resolve({token:p.get("token")||""})});
createRoot(document.getElementById("root")!).render(<AppearanceProvider><SidebarProvider><UnsavedProgressProvider>{view}</UnsavedProgressProvider></SidebarProvider></AppearanceProvider>);`);
const styles = new Map();
const mocks = {
  "@/app/providers": `export {useTheme} from ${JSON.stringify(path.resolve("src/components/AppearanceProvider").replaceAll("\\","/"))};`,
  "@/lib/marketing-unsubscribe": 'export async function verifyMarketingUnsubscribeToken(token){return token==="valid"?"casey@example.test":null;}',
  "@/hooks/useRecaptcha": 'export function useRecaptcha(){return {executeRecaptcha:async()=>null,recaptchaConfigured:false,recaptchaReady:true};}',
  "next/script": 'export default function Script(){return null;}',
  "next/navigation": 'const params=new URLSearchParams(location.search);export function usePathname(){return location.pathname;}export function useSearchParams(){return params;}export function useRouter(){return {push(){},replace(){},refresh(){},prefetch(){}};}export function notFound(){throw new Error("Unknown fixture path");}',
  "next-auth/react": 'import {createContext} from "react";export const SessionContext=createContext({data:null,status:"unauthenticated"});export function useSession(){return {status:"unauthenticated",data:null,update:async()=>{}};}export function SessionProvider({children}){return children;}export async function getSession(){return null;}export async function signIn(){}export async function signOut(){}',
  "next/dynamic": 'import React,{lazy,Suspense} from "react";export default function dynamic(load){const C=lazy(async()=>{const result=await load();return {default:result.default||result};});return props=><Suspense fallback={null}><C {...props}/></Suspense>;}',
  "next/link": 'import React from "react";export default function Link({prefetch,...props}){return <a {...props}/>;}',
  "next/image": 'import React from "react";export function getImageProps({fill,priority,quality,unoptimized,...props}){const s=props.src;return {props:{...props,src:typeof s==="object"?s.src:s,width:fill?undefined:props.width||s?.width,height:fill?undefined:props.height||s?.height,style:fill?{position:"absolute",inset:0,width:"100%",height:"100%",...props.style}:props.style}};}export default function Image(props){return <img {...getImageProps(props).props}/>;}',
  "next/dist/shared/lib/app-router-context.shared-runtime": 'import {createContext} from "react";export const AppRouterContext=createContext(null);',
};
const build = await Bun.build({entrypoints:[entry],outdir:out,target:"browser",minify:false,external:["/fonts/*"],define:{"process.env":JSON.stringify({NODE_ENV:"test"})},plugins:[{name:"public-real-components",setup(builder){
  builder.onLoad({filter:/\.module\.css$/},async({path:filename})=>{const result=transform({filename,code:await fs.readFile(filename),cssModules:true});styles.set(filename,result.code.toString());return {loader:"js",contents:`export default ${JSON.stringify(Object.fromEntries(Object.entries(result.exports).map(([key,value])=>[key,value.name])))};`};});
  builder.onLoad({filter:/\.(png|webp|jpe?g)$/},async({path:filename})=>{const metadata=await sharp(filename).metadata();const src=`/${path.relative(path.resolve("public"),filename).replaceAll("\\","/")}`;return {loader:"js",contents:`export default ${JSON.stringify({src,width:metadata.width,height:metadata.height})};`};});
  for(const name of Object.keys(mocks))builder.onResolve({filter:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`)},()=>({path:name,namespace:"fixture"}));
  builder.onLoad({filter:/.*/,namespace:"fixture"},({path:name})=>({loader:"tsx",contents:mocks[name]}));
}}]});
assert.ok(build.success,build.logs.map(String).join("\n"));
await fs.writeFile(path.join(out,"entry.css"),[...(await Promise.all(build.outputs.filter(file=>file.path.endsWith(".css")).map(file=>file.text()))),...styles.values()].join("\n"));
const globals=(await fs.readFile("src/app/globals.css","utf8")).replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components";\n@source "./about";\n@source "./contact";\n@source "./faq";\n@source "./guides";\n@source "./how-it-works";\n@source "./privacy";\n@source "./terms";\n@source "./forgot";\n@source "./reset";\n@source "./verify-request";\n@source "./unsubscribe";\n@source "./category-pages";\n@source "./birthdays";\n@source "./weddings";');
const css=await postcss([tailwind()]).process(globals,{from:path.resolve("src/app/globals.css")});
await fs.writeFile(path.join(out,"global.css"),css.css);
await fs.writeFile(path.join(out,"bootstrap.js"),buildAppearanceBootstrap());
console.log(`Built real public/help/account/category components in ${out}`);
