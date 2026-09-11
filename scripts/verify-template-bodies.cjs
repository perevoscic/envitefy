// Local UI verification: real renderers, local assets, no event writes.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { createJiti } = require("jiti");
const root = path.resolve(__dirname, "..");
const work = path.join(root, "tmp", "template-body-review");
const output = path.join(work, "review");
fs.mkdirSync(output, { recursive: true });
const cssFiles = new Set();
const cssPrefix = (file) =>
  `v${crypto.createHash("sha1").update(path.relative(root, file)).digest("hex").slice(0, 7)}_`;
function moduleCss(file) {
  const source = fs.readFileSync(file, "utf8");
  const names = {};
  const prefix = cssPrefix(file);
  const result = require("postcss").parse(source);
  result.walkRules((rule) => {
    const globals = [];
    let selector = rule.selector.replace(
      /:global\(([^)]+)\)/g,
      (_, value) => `__GLOBAL_${globals.push(value) - 1}__`,
    );
    selector = selector.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
      names[name] = prefix + name;
      return "." + prefix + name;
    });
    rule.selector = selector.replace(/__GLOBAL_(\d+)__/g, (_, index) => globals[index]);
  });
  return { css: result.toString(), names };
}
fs.writeFileSync(
  path.join(work, "loader.cjs"),
  `const ts=require(${JSON.stringify(require.resolve("typescript"))});module.exports=function(source){return ts.transpileModule(source,{fileName:this.resourcePath,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;};`,
);
const cssLoader = path.join(work, "css-loader.cjs");
fs.writeFileSync(
  cssLoader,
  `const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');module.exports=function(source){const prefix='v'+crypto.createHash('sha1').update(path.relative(${JSON.stringify(root)},this.resourcePath)).digest('hex').slice(0,7)+'_';const names={};for(const match of source.replace(/:global\\(([^)]+)\\)/g,'').matchAll(/\\.([a-zA-Z_][\\w-]*)/g))names[match[1]]=prefix+match[1];return 'module.exports='+JSON.stringify(names);};`,
);
fs.writeFileSync(
  path.join(work, "mocks.tsx"),
  `
import React from 'react';
export const SessionContext=React.createContext({data:null,status:'unauthenticated'});
export const useSession=()=>({data:null,status:'unauthenticated'});
export const useRouter=()=>({push(){},replace(){},refresh(){},back(){}});
export const usePathname=()=>'/preview';
export const useSearchParams=()=>new URLSearchParams();
export const useParams=()=>({});
export const redirect=()=>{};
export default function Mock(props){return props.address?<div style={{height:180,background:'currentColor',opacity:.12}} aria-label="Map preview"/>:null;}
`,
);
const entry = path.join(work, "fixture.tsx");
fs.writeFileSync(
  entry,
  `
import React,{useState,useEffect} from 'react';
import EventCanvas from '@/components/EventCanvas';
import GymnasticsPreview from '@/components/gym-meet-templates/GymnasticsPreview';
import {getGymMeetTemplateMeta} from '@/components/gym-meet-templates/registry';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {SessionContext} from 'next-auth/react';
import Body from '@/components/templates/TemplateBodyLayout';
import {getTemplateBodyPresentation} from '@/lib/template-body-presentations';
import {getPublicTemplates} from '@/lib/public-template-catalog';
import {CELEBRATION_DESIGN_CATALOG} from '@/data/birthday-design-catalog';
import BirthdayBody from '@/components/birthdays/BirthdayExperienceBody';
import Baby from '@/components/BabyShowerTemplateView';
import Reveal from '@/components/GenderRevealTemplateView';
import SignupViewer from '@/components/smart-signup-form/SignupViewer';
import SignupPage from '@/components/smart-signup-form/SignupPageRenderer';
import {createSignupAppearance} from '@/lib/signup-themes';
import Simple from '@/components/SimpleTemplateView';
import Wedding from '@/components/weddings/WeddingRenderer';
import '@/components/birthdays/redesign/birthday-fonts.css';
const image='/templates/gymnastics/collection-2026/airborne-atlas.webp';
const copy='Celebrate a wonderful day with the people you love. Join us for a relaxed afternoon, good food, and memories to keep. We look forward to seeing you there.';
const names=['story','details','schedule','hosts','notes','gallery','registry','rsvp'];
const labels=['Our celebration','The details','The day together','Your hosts','Good to know','Our memories','Gifts and wishes','Join the celebration'];
const shared={eventId:'preview',eventTitle:'A day to remember',shareUrl:'',isOwner:false,isReadOnly:true,editHref:'',preview:true};
const event={date:'2028-09-21',time:'14:00',start:'2028-09-21T14:00:00',end:'2028-09-21T18:00:00',venue:'The Garden Pavilion',address:'123 Garden Lane',location:'The Garden Pavilion',description:copy,hosts:[{id:'a',name:'Alex Morgan',role:'Your host'},{id:'b',name:'Sam Rivera',role:'Your host'}],gallery:[1,2,3].map(i=>({id:String(i),url:image,caption:'A happy memory'})),registries:[{url:'https://example.test/registry',label:'Our wish list'}],rsvp:{isEnabled:true,deadline:'2028-09-15'},rsvpEnabled:true,babyDetails:{notes:copy,expectingDate:'2028-11-04'},momDetails:{notes:'Looking forward to celebrating this new chapter with you.'},eventDetails:{notes:copy,expectingDate:'2028-11-04'},parentsName:'Alex & Sam',theme:{text:'text-inherit',accent:'text-inherit'}};
function CanvasFrameProbe(){const [mount,setMount]=useState(null);return <div style={{minHeight:600,backgroundColor:'rgb(239, 222, 200)'}}><iframe srcDoc="<!doctype html><html><head></head><body></body></html>" title="Independent event preview" onLoad={event=>setMount(event.currentTarget.contentDocument.body)} />{mount?createPortal(<EventCanvas><div style={{minHeight:500,backgroundColor:'rgb(29, 22, 39)'}}>Iframe event</div></EventCanvas>,mount):null}</div>;}
function Fixture(){const [selection,setSelection]=useState(null);window.showTemplate=setSelection;useEffect(()=>{window.ready=selection?selection.category+'/'+selection.id+'/'+selection.mode:'ready';},[selection]);if(!selection)return null;const {category,id,mode='actual',sparse=false}=selection;const d=getPublicTemplates(category).find(d=>d.id===id);const profile=getTemplateBodyPresentation(category,id);let view;
if(mode==='geometry')view=<Body presentation={profile} sections={(sparse?names.slice(0,1):names).map((name,i)=>({id:name,content:<section id={name}><h2>{labels[i]}</h2><p>{copy}</p>{i===2?<ol><li>2:00 PM · Welcome</li><li>3:00 PM · Celebration</li><li>5:00 PM · A fond farewell</li></ol>:null}</section>}))}/>;
else if(category==='birthdays'||category==='anniversaries'){const design=CELEBRATION_DESIGN_CATALOG.find(d=>d.id===id);view=<BirthdayBody theme={{id,colors:{primary:design.primaryColor,secondary:design.secondaryColor},fonts:{headline:design.headlineFont},experience:design.experience}} event={{story:copy,goodToKnow:'Parking is available at the north entrance. Please contact your host with dietary needs.',birthdayName:'Alex',date:'2028-09-21T14:00:00',end:'2028-09-21T18:00:00',hosts:event.hosts,gallery:sparse?[]:[image,image,image],schedule:sparse?[]:[{title:'Welcome',time:'14:00'},{title:'Celebration',time:'15:00'},{title:'A fond farewell',time:'17:00'}],registries:event.registries,rsvpEnabled:!sparse}} onRsvpClick={()=>window.action='rsvp'}/>;}
else if(category==='baby-showers'||category==='bridal-showers')view=<Baby {...shared} eventData={{...event,templateId:id,occasion:category==='bridal-showers'?'bridal-shower':undefined,babyName:'A new chapter',momName:'Alex',...(sparse?{gallery:[],hosts:[],registries:[],rsvp:{isEnabled:false},babyDetails:{notes:copy},momDetails:{}}:{})}}/>;
else if(category==='gender-reveal')view=<Reveal {...shared} eventData={{...event,templateId:id,...(sparse?{gallery:[],hosts:[],registries:[],rsvpEnabled:false,rsvp:undefined}:{})}}/>;
else if(category==='signup-forms'){const form={version:1,enabled:true,title:'The celebration',appearance:createSignupAppearance('clean-clear',id),sections:(sparse?names.slice(0,1):names.slice(0,4)).map((name,i)=>({id:name,title:labels[i],description:copy,slots:[1,2,3].map(n=>({id:name+n,label:'Join our welcome team '+n,capacity:4,notes:'Everything you need is provided.'}))})),questions:[],responses:[],settings:{allowMultipleSlotsPerPerson:true,maxGuestsPerSignup:1,waitlistEnabled:true,lockWhenFull:false,collectPhone:false,collectEmail:true,showRemainingSpots:true,autoRemindersHoursBefore:[]}};view=<SignupPage form={form}><SignupViewer eventId="preview" initialForm={form} viewerKind="guest"/></SignupPage>;}
else if(category==='sport-events')view=<Simple {...shared} sessionEmail={null} viewerKind="readonly" eventData={{...event,category:'sport_event',templateId:'sport-event',bodyDesignId:id,details:copy,customFields:{sport:id.split('--')[0]},templateConfig:{detailFields:[{key:'sport',label:'Sport'}]},theme:{bg:'bg-white',text:'text-slate-900',accent:'text-slate-800'},...(sparse?{gallery:[],hosts:[],registries:[],rsvpEnabled:false,rsvp:undefined}:{})}}/>;
else if(category==='gymnastics')view=<GymnasticsPreview design={getGymMeetTemplateMeta(id)}/>;
else if(category==='weddings')view=<Wedding template={{...d,theme:{colors:{primary:d.primaryColor,secondary:d.secondaryColor,background:d.primaryColor},fonts:{headline:d.headlineFont,body:d.bodyFont},decorations:{heroImage:d.heroImage}}}} event={{headlineTitle:'Alex & Sam',couple:{partner1:'Alex',partner2:'Sam'},date:'2028-09-21',location:'The Garden Pavilion',story:copy,schedule:[{title:'Ceremony',time:'14:00',location:'The Garden'},{title:'Dinner',time:'16:00',location:'The Terrace'},{title:'Dancing',time:'18:00',location:'The Hall'}],gallery:[{url:image},{url:image},{url:image}],photos:[image,image,image],party:[{name:'Taylor',role:'Best friend'}],travel:copy,thingsToDo:copy,registry:[{url:'https://example.test',label:'Wish list'}],rsvpEnabled:true,rsvp:{url:'#rsvp',deadline:'2028-09-15'}}}/>;
if(selection.testColor)view=<div data-test-paper style={{minHeight:500,backgroundColor:selection.testColor}}>Live event color</div>;
if(selection.testFrame)view=<CanvasFrameProbe/>;
return <SessionContext.Provider value={{data:null,status:'unauthenticated',update:async()=>null}}><div id="surface" data-category={category} key={category+id+mode} style={{color:'#27343b',background:'#f9f5ed'}}>{selection.canvas?<EventCanvas id="canvas" style={{minHeight:"100vh",padding:24}}>{view}</EventCanvas>:view}</div></SessionContext.Provider>;}
createRoot(document.getElementById('root')).render(<Fixture/>);
`,
);
async function main() {
  const runtime = require("next/dist/compiled/webpack/webpack");
  runtime.init();
  await new Promise((resolve, reject) =>
    runtime.webpack(
      {
        mode: "development",
        devtool: false,
        entry,
        plugins: [
          new runtime.webpack.DefinePlugin({
            "process.env": JSON.stringify({ NODE_ENV: "development" }),
          }),
          {
            apply(compiler) {
              compiler.hooks.normalModuleFactory.tap("CollectCss", (factory) =>
                factory.hooks.afterResolve.tap("CollectCss", (data) => {
                  const file = data.createData?.resource;
                  if (file?.endsWith(".css")) cssFiles.add(file);
                }),
              );
            },
          },
        ],
        output: { path: work, filename: "bundle.js" },
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".mjs"],
          alias: {
            "@/components/StaticMap": path.join(work, "mocks.tsx"),
            "@": path.join(root, "src"),
            "next/navigation": path.join(work, "mocks.tsx"),
            "next-auth/react": path.join(work, "mocks.tsx"),
            "@/components/StaticMap": path.join(work, "mocks.tsx"),
          },
        },
        module: {
          rules: [
            { test: /\.tsx?$/, exclude: /node_modules/, use: path.join(work, "loader.cjs") },
            { test: /\.css$/, use: cssLoader },
            { test: /\.(png|jpg|webp)$/, type: "asset/resource" },
          ],
        },
      },
      (error, stats) =>
        error || stats.hasErrors()
          ? reject(error || Error(stats.toString({ all: false, errors: true })))
          : resolve(),
    ),
  );
  const utilities = await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../../src/components"; @source "../../src/app/event/weddings/_renderers"; @source "./fixture.tsx";',
    { from: path.join(work, "styles.css") },
  );
  const css =
    utilities.css +
    "\n" +
    [...cssFiles]
      .map((file) =>
        file.endsWith(".module.css") ? moduleCss(file).css : fs.readFileSync(file, "utf8"),
      )
      .join("\n");
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      fs.createReadStream(path.join(work, "bundle.js")).pipe(res);
      return;
    }
    if (url.pathname === "/styles.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css);
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json");
      res.end("{}");
      return;
    }
    if (/^\/(templates|fonts|email|brand|images)\//.test(url.pathname)) {
      const file = path.resolve(root, "public", "." + url.pathname);
      if (!file.startsWith(path.join(root, "public") + path.sep) || !fs.existsSync(file)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        file.endsWith(".webp")
          ? "image/webp"
          : file.endsWith(".png")
            ? "image/png"
            : "application/octet-stream",
      );
      fs.createReadStream(file).pipe(res);
      return;
    }
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body style="margin:0;font-family:Arial,sans-serif"><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("Browser: " + e.message + " " + e.stack);
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.error(m.text());
  });
  const j = createJiti(path.join(root, "audit.cjs"), {
    alias: { "@": path.join(root, "src") },
    fsCache: false,
  });
  const { getPublicTemplates } = j(path.join(root, "src/lib/public-template-catalog.ts"));
  const audit = JSON.parse(
    fs.readFileSync(path.join(root, "docs/design/template-body-audit-2026-09-11.json"), "utf8"),
  );
  const categoryArg = process.argv.find((a) => a.startsWith("--category="))?.slice(11);
  const idArg = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
  const modeArg = process.argv.find((a) => a.startsWith("--mode="))?.slice(7) || "actual";
  const sparse = process.argv.includes("--sparse");
  const canvas = process.argv.includes("--canvas");
  const rows = audit.filter(
    (d) =>
      (!categoryArg || d.category === categoryArg) &&
      (!idArg || d.id === idArg) &&
      (modeArg === "geometry" || sparse
        ? d.status === "redesigned"
        : canvas || d.category !== "gymnastics"),
  );
  const results = [];
  try {
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.waitForFunction(() => window.ready === "ready");
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [i, d] of rows.entries()) {
        await page.evaluate(
          (selection) => {
            window.ready = "";
            window.showTemplate(selection);
          },
          { category: d.category, id: d.id, mode: modeArg, sparse, canvas },
        );
        await page.waitForFunction(
          (value) => window.ready === value,
          d.category + "/" + d.id + "/" + modeArg,
        );
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        const geometry = await page.evaluate(() => {
          const surface = document.querySelector("#surface");
          const body = surface.querySelector("[data-template-body-layout]");
          const wedding = surface.getAttribute("data-category") === "weddings";
          const panels = wedding
            ? [
                ...new Set([
                  ...[...surface.querySelectorAll("section,article")].filter(
                    (el) =>
                      !el.closest("footer,header") &&
                      !el.querySelector("h1,header") &&
                      el.textContent.trim(),
                  ),
                  ...[...surface.querySelectorAll("h2,h3")]
                    .filter((h) => !h.closest("footer,header"))
                    .map((h) => {
                      const section = h.closest("section");
                      return section && !section.querySelector("h1") ? section : h.parentElement;
                    }),
                ]),
              ]
            : [
                ...(body || surface).querySelectorAll(body ? "[data-body-section]" : "section"),
              ].filter(
                (el) =>
                  body ||
                  (!el.querySelector("section") &&
                    el.querySelector("h2,h3") &&
                    !el.querySelector("h1")),
              );
          const origin = (body || panels[0] || surface).getBoundingClientRect();
          const signature = panels.map((el) => {
            const b = el.getBoundingClientRect(),
              s = getComputedStyle(el),
              h = el.querySelector("h2,h3");
            return [
              el.getAttribute("data-body-section"),
              Math.round(b.x - origin.x),
              Math.round(b.y - origin.y),
              Math.round(b.width),
              Math.round(b.height),
              s.borderRadius,
              s.borderTopWidth,
              s.borderLeftWidth,
              h ? getComputedStyle(h).fontSize : "",
              h ? getComputedStyle(h).textTransform : "",
            ];
          });
          const overflow = [
            ...surface.querySelectorAll("section,form,[data-body-section],[data-signup-slot]"),
          ]
            .filter((el) => el.scrollWidth > el.clientWidth + 4)
            .map((el) => ({
              tag: el.tagName,
              id: el.id,
              text: el.textContent.slice(0, 70),
              width: el.clientWidth,
              scroll: el.scrollWidth,
            }));
          return {
            hasBody: !!body,
            canvasColor: document.querySelector("#canvas")
              ? getComputedStyle(document.querySelector("#canvas")).backgroundColor
              : null,
            pageColor: document.documentElement.getAttribute("data-event-page-color"),
            signature,
            overflow,
            pageOverflow: document.documentElement.scrollWidth > innerWidth + 2,
          };
        });
        if (canvas) {
          assert.ok(geometry.pageColor, d.category + "/" + d.id + " registers a page color");
          assert.equal(
            geometry.canvasColor,
            geometry.pageColor,
            d.id + " canvas matches navigation",
          );
        }
        results.push({ id: d.id, category: d.category, status: d.status, width, ...geometry });
        if (d.status === "redesigned" && !sparse)
          assert.ok(geometry.hasBody, d.category + "/" + d.id + " uses its assigned body");
        if (
          process.argv.includes("--screens") &&
          (i % 15 === 0 || d.category === "bridal-showers")
        ) {
          const body = page.locator("[data-template-body-layout]").first();
          if (canvas) {
            await page.screenshot({
              path: path.join(output, "canvas-" + d.category + "-" + d.id + "-" + width + ".png"),
            });
          } else if (await body.count())
            await body.screenshot({
              path: path.join(output, d.category + "-" + d.id + "-" + width + ".png"),
            });
        }
        if (i % 50 === 49)
          console.log("Reviewed " + (i + 1) + "/" + rows.length + " at " + width + "px");
      }
      console.log("Reviewed " + rows.length + " bodies at " + width + "px");
    }
    if (canvas) {
      // Keep the same mounted canvas while the selected event palette changes.
      const sample = rows[0];
      for (const testColor of ["rgb(244, 226, 198)", "rgb(29, 22, 39)"]) {
        await page.evaluate((selection) => window.showTemplate(selection), {
          category: sample.category,
          id: sample.id,
          mode: modeArg,
          canvas,
          testColor,
        });
        await page.waitForFunction((color) => {
          const canvas = document.querySelector("#canvas");
          return (
            canvas &&
            getComputedStyle(canvas).backgroundColor === color &&
            document.documentElement.getAttribute("data-event-page-color") === color
          );
        }, testColor);
      }
      await page.evaluate((selection) => window.showTemplate(selection), {
        category: sample.category,
        id: sample.id,
        mode: modeArg,
        canvas,
        testFrame: true,
      });
      console.log("Live palette updates passed");
      await page
        .waitForFunction(
          () => {
            const frame = document.querySelector("iframe");
            return (
              document.documentElement.getAttribute("data-event-page-color") ===
                "rgb(239, 222, 200)" &&
              frame?.contentDocument?.documentElement.getAttribute("data-event-page-color") ===
                "rgb(29, 22, 39)"
            );
          },
          null,
          { timeout: 5000 },
        )
        .catch(async (error) => {
          console.error(
            await page.evaluate(() => ({
              outer: document.documentElement.getAttribute("data-event-page-color"),
              frame: document.querySelector("iframe")?.contentDocument?.documentElement.outerHTML,
              outerCanvas: document.querySelector("#canvas")?.outerHTML,
            })),
          );
          throw error;
        });
      console.log("Iframe event color stays within its own document");
      await page.evaluate(() => window.showTemplate(null));
      await page.waitForFunction(
        () =>
          !document.documentElement.hasAttribute("data-event-page-color") &&
          !document.documentElement.style.getPropertyValue("--event-page-chrome-color"),
      );
      console.log("Live palette updates and navigation color cleanup passed");
    }
    const duplicates = [];
    for (const category of new Set(rows.map((r) => r.category))) {
      if (category === "gymnastics") continue; // Its body compositions have a separate review.
      for (const width of [1280, 375]) {
        const seen = new Map();
        for (const r of results.filter((r) => r.category === category && r.width === width)) {
          const key = JSON.stringify(r.signature);
          if (seen.has(key))
            duplicates.push({ category, width, first: seen.get(key), second: r.id });
          else seen.set(key, r.id);
        }
      }
    }
    const observations = results.filter((r) => r.overflow.length || r.pageOverflow);
    const problems = observations.filter((r) => r.status === "redesigned");
    const existingIssues = observations.filter((r) => r.status === "preserved");
    fs.writeFileSync(
      path.join(
        output,
        "report-" +
          (canvas ? "canvas-" : "") +
          modeArg +
          (sparse ? "-sparse" : "") +
          (categoryArg ? "-" + categoryArg : "") +
          (idArg ? "-" + idArg : "") +
          ".json",
      ),
      JSON.stringify({ results, duplicates, problems, existingIssues, errors }, null, 2),
    );
    console.log(
      JSON.stringify(
        {
          renders: results.length,
          duplicates,
          problems: problems.map(({ id, width, overflow, pageOverflow }) => ({
            id,
            width,
            overflow,
            pageOverflow,
          })),
          existingIssues: existingIssues.map(({ id, width }) => ({ id, width })),
          errors,
        },
        null,
        2,
      ),
    );
    assert.equal(errors.length, 0);
    assert.equal(problems.length, 0);
    if (!sparse) assert.equal(duplicates.length, 0);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
