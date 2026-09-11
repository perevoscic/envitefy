// Render and exercise every production gymnastics composition with the same complete meet.
// All fixture data and network responses are local; no drafts or events are saved.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const Module = require("node:module");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { chromium } = require("playwright");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const work = path.join(root, "tmp", "gymnastics-design-verification");
const output = path.join(work, "review");
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(output, { recursive: true });
const fixtureFile = path.join(work, "fixture.tsx");
fs.writeFileSync(fixtureFile, `
// @ts-nocheck -- local browser fixture, compiled by the verifier's TS loader.
import React, { useEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { SessionContext } from "next-auth/react";
import Renderer from "@/components/gym-meet-templates/GymMeetTemplateRenderer";
import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import { normalizeGymMeetEventData } from "@/components/gym-meet-templates/normalizeGymMeetEventData";
const noop = () => {};
const section = (id, label, kind, blocks) => ({ id, label, kind, blocks, hasContent: true, priority: 0 });
const text = (id, value) => ({ id, type: "text", text: value });
const cards = (id, values) => ({ id, type: "card-grid", cards: values });
export const designs = GYM_MEET_TEMPLATE_LIBRARY;
export function Fixture({ id, mode = "full" }) {
  const design = designs.find(d => d.id === id) || designs[0];
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { document.documentElement.dataset.ready = "true"; }, []);
  const model = normalizeGymMeetEventData({ eventTitle: mode === "long" ? "The Extraordinary Regional Gymnastics Championships and Invitational Celebration" : design.previewTitle, eventData: { pageTemplateId: id, date: "2028-09-21", time: "09:00", venue: design.sampleVenue, hostGym: design.sampleHost, details: design.sampleNote, rsvpEnabled: true }, navItems: [], rosterAthletes: [], headerLocation: design.sampleLocation });
  model.discovery.sections = [
    section("overview", "A meet to remember", "meet_overview", [text("welcome", "A day of courage, connection, and extraordinary gymnastics. Join our athletes on the competition floor and celebrate every landing together."), cards("highlights", [{key:"levels",label:"On the floor",value:"Levels 3–10",body:"Plus all Xcel divisions"},{key:"awards",label:"The celebration",value:"Every session",body:"Individual and team awards"},{key:"teams",label:"Our community",value:"24 teams",body:"One unforgettable meet"}])]),
    section("schedule", "The meet program", "schedule", [cards("sessions", [{key:"one",label:"Session 01 · 8:00 AM",value:"First flight",body:"Levels 3–4. Open stretch at 8:00 AM, march-in at 8:30 AM, and awards following competition."},{key:"two",label:"Session 02 · 11:30 AM",value:"Find your rhythm",body:"Levels 5–7. Team check-in opens 30 minutes before warm-up."},{key:"three",label:"Session 03 · 3:00 PM",value:"A brilliant finish",body:"Levels 8–10 and Xcel. Join us for the final rotation and team celebration."}])]),
    section("admission", "Come cheer them on", "admission", [cards("admission", [{key:"adult",label:"Adults",value:"$18",body:"Full-day spectator admission"},{key:"child",label:"Ages 6–12",value:"$10",body:"Children under six attend free"}]), text("admission-note", "Tickets are available at the venue entrance. Keep your wristband for same-day re-entry.")]),
    section("venue", "Find your way here", "venue", [text("venue-copy", design.sampleVenue + ". Main entrance on the east side; accessible entrance beside the welcome desk."), {id:"directions",type:"cta",title:"Make an easy arrival",text:"Free parking in the south lot. Please leave the drop-off lane clear for arriving teams.",action:{label:"Get directions",url:"https://example.test/directions"}}]),
    section("hotels", "Stay for the weekend", "hotels", [cards("hotel-cards", [{key:"hotel",presentation:"hotel",label:"The Fieldhouse Hotel",highlights:[{label:"Meet rate",value:"$129 / night"},{label:"From the venue",value:"5 minutes"}],details:[{label:"Breakfast",value:"Included",icon:"breakfast"},{label:"Parking",value:"Complimentary",icon:"parking"}],action:{label:"View hotel",url:"https://example.test/hotel"}}])]),
    section("coaches", "For the team", "coaches", [{id:"coach-lines",type:"line-list",lines:[{text:"Coaches check in at the competition desk with their current membership credentials."},{text:"Final roster changes are due one week before the meet."},{text:"Music uploads and equipment questions: contact the meet director."}]}]),
    section("documents", "Your meet essentials", "documents", [{id:"documents",type:"link-list",links:[{label:"Download meet packet",url:"https://example.test/packet.pdf"},{label:"Session assignments",url:"https://example.test/sessions.pdf"}]}]),
    section("news", "A little good to know", "announcements", [text("news", "The team photo station is open throughout the day. Bring your teammates and capture a memory after your awards ceremony.")]),
  ];
  if (mode === "sparse") model.discovery.sections = model.discovery.sections.slice(0, 1);
  if (mode === "empty") model.discovery.sections = [];
  const rsvpProps = { enabled: mode !== "empty", submitted, attending, setAttending, rosterAthletes: [], selectedAthleteId: "", setSelectedAthleteId: noop, nameInput: name, setNameInput: setName, guestEmailInput: "", setGuestEmailInput: noop, guestPhoneInput: "", setGuestPhoneInput: noop, isSignedIn: true, allowGuestAttendanceRsvp: false, submitting: false, onSubmit: () => setSubmitted(true), onReset: () => setSubmitted(false) };
  return <SessionContext.Provider value={{ data: null, status: "unauthenticated", update: async () => null }}><Renderer model={model} rsvpProps={rsvpProps} isOwner={false} isReadOnly onShare={() => {window.shared = true;}} onGoogleCalendar={noop} onAppleCalendar={noop} onOutlookCalendar={noop} /></SessionContext.Provider>;
}
if (typeof window !== "undefined") hydrateRoot(document.getElementById("root"), <Fixture {...window.fixture} />);
`);
fs.writeFileSync(path.join(work, "loader.cjs"), `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = function(source) { return ts.transpileModule(source, {fileName:this.resourcePath,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText; };`);
fs.writeFileSync(path.join(work, "css-loader.cjs"), 'module.exports = () => "module.exports = new Proxy({}, {get: (_, key) => key === \'__esModule\' ? false : String(key)});";');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(root);
  cache.set(file, mod);
  const normal = Module.createRequire(path.join(root, "package.json"));
  mod.require = request => {
    if (request.endsWith(".css")) return new Proxy({}, {get: (_, key) => key === "__esModule" ? false : String(key)});
    if (request === "lucide-react") {
      const lucideFile = path.join(root, "node_modules/lucide-react/dist/cjs/lucide-react.js");
      const lucide = new Module(lucideFile);
      lucide.paths = Module._nodeModulePaths(path.dirname(lucideFile));
      lucide._compile(fs.readFileSync(lucideFile, "utf8"), lucideFile);
      return lucide.exports;
    }
    if (request.startsWith("@/") || request.startsWith(".")) {
      const base = request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : path.resolve(path.dirname(file), request);
      const found = [base, `${base}.tsx`, `${base}.ts`, `${base}.js`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (found) return load(found);
    }
    return normal(request);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText, file);
  return mod.exports;
}
async function main() {
  const runtime = require("next/dist/compiled/webpack/webpack");
  runtime.init();
  await new Promise((resolve, reject) => runtime.webpack({mode:"development",devtool:false,entry:fixtureFile,plugins:[new runtime.webpack.DefinePlugin({"process.env":JSON.stringify({NODE_ENV:"development"})})],output:{path:work,filename:"bundle.js"},resolve:{extensions:[".tsx",".ts",".js"],alias:{"@":path.join(root,"src")},modules:[path.join(root,"node_modules")]},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(work,"loader.cjs")},{test:/\.css$/,use:path.join(work,"css-loader.cjs")}] }},(error,stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all:false,errors:true}))) : resolve()));
  const utilityCss = await require("postcss")([require("@tailwindcss/postcss")()]).process('@import "tailwindcss" source(none); @source "../../src/components/gym-meet-templates"; @source "../../src/components/branding"; @source "../../src/components/CalendarAction.tsx";', {from:path.join(work,"styles.css")});
  const css = utilityCss.css + ["collection-fonts.css","gymnastics-collection.module.css","gymnastics-program.module.css"].map(file => fs.readFileSync(path.join(root,"src/components/gym-meet-templates",file),"utf8")).join("\n");
  const { Fixture, designs } = load(fixtureFile);
  const pages = new Map();
  const server = http.createServer((req,res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname === "/bundle.js") {res.setHeader("Content-Type","text/javascript");res.end(fs.readFileSync(path.join(work,"bundle.js")));return;}
    if (url.pathname === "/styles.css") {res.setHeader("Content-Type","text/css");res.end(css);return;}
    if (url.pathname.startsWith("/api/")) {res.setHeader("Content-Type","application/json");res.end("{}");return;}
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/brand/") || url.pathname.startsWith("/email/")) {
      const file = path.resolve(root,"public",`.${url.pathname}`);
      if (!file.startsWith(path.join(root,"public") + path.sep) || !fs.existsSync(file)) {res.statusCode=404;res.end();return;}
      res.setHeader("Content-Type", file.endsWith(".webp") ? "image/webp" : file.endsWith(".png") ? "image/png" : "application/octet-stream");fs.createReadStream(file).pipe(res);return;
    }
    const props = {id:url.searchParams.get("id") || designs[0].id,mode:url.searchParams.get("mode") || "full"};
    const key = JSON.stringify(props);
    if (!pages.has(key)) pages.set(key, renderToString(React.createElement(Fixture, props)));
    res.setHeader("Content-Type","text/html");
    res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gymnastics design verification</title><link rel="stylesheet" href="/styles.css"></head><body style="margin:0;font-family:Arial,sans-serif"><div id="root">${pages.get(key)}</div><script>window.fixture=${key}</script><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {if (message.type()==="error" && /hydrat|didn.t match/i.test(message.text())) errors.push(message.text());});
  const results = [];
  const designArgument = process.argv.find(arg => arg.startsWith("--design="));
  const selectedDesigns = designArgument ? designs.filter(d => d.id === designArgument.slice(9)) : designs;
  assert.ok(selectedDesigns.length, "The requested design must exist");
  try {
    if (process.argv.includes("--footers")) {
      await page.setViewportSize({width:375,height:844});
      for (const design of selectedDesigns) {
        await page.goto(`${base}/?id=${design.id}&mode=empty`, {waitUntil:"load"});
        await page.waitForSelector('html[data-ready="true"]');
        const colors = await page.evaluate(() => {
          const branding = document.querySelector('[data-envitefy-event-branding]');
          const foreground = getComputedStyle(document.querySelector('[data-gym-design]')).color;
          const text = [...branding.querySelectorAll('p, strong, p a, nav a')].map(el => getComputedStyle(el).color);
          const icons = [...branding.querySelectorAll('nav [aria-hidden="true"]')].map(el => ({color:getComputedStyle(el).backgroundColor,mask:getComputedStyle(el).maskImage}));
          return {foreground,text,icons};
        });
        assert.ok(colors.text.every(color => color === colors.foreground), `${design.id}: footer text matches template`);
        assert.equal(colors.icons.length,5);
        assert.ok(colors.icons.every(icon => icon.color === colors.foreground && icon.mask.includes('/email/social-')), `${design.id}: social icons match template`);
        if (["electric-orchid","airborne-atlas"].includes(design.id)) {
          await page.locator('footer').screenshot({path:path.join(output,`${design.id}-footer.png`)});
        }
      }
      assert.deepEqual(errors,[],"No runtime or hydration errors");
      console.log(`Verified footer text, links and all five social icons inherit the template color in ${selectedDesigns.length} gymnastics designs.`);
      return;
    }
    const widthArgument = process.argv.find(arg => arg.startsWith("--widths="));
    const widths = widthArgument ? widthArgument.slice(9).split(",").map(Number) : process.argv.includes("--refresh") ? [1440, 375] : [1440, 768, 375];
    for (const width of widths) {
      await page.setViewportSize({width,height:1000});
      for (const design of selectedDesigns) {
        await page.goto(`${base}/?id=${design.id}`,{waitUntil:"load"});
        await page.waitForSelector('html[data-ready="true"]');
        await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => {
          const chapters = [...document.querySelectorAll('.chapter')];
          const overflow = [...document.querySelectorAll('.chapter, .detailCard, .chapterHeading, .panel')].filter(el => el.scrollWidth > el.clientWidth + 3).map(el => ({class:el.className, text:el.textContent.slice(0,70),width:el.clientWidth,scroll:el.scrollWidth}));
          const boxes = chapters.map(el => el.getBoundingClientRect());
          const overlap = boxes.some((a,i) => boxes.slice(i+1).some(b => a.left < b.right-2 && a.right > b.left+2 && a.top < b.bottom-2 && a.bottom > b.top+2));
          return {overflow,overlap,pageOverflow:document.documentElement.scrollWidth > innerWidth,chapters:chapters.length, signature: boxes.map(b => [Math.round(b.x),Math.round(b.width),Math.round(b.height)]), mobileActions:[...document.querySelectorAll('.scene')][0]?.previousElementSibling?.getBoundingClientRect().height};
        });
        results.push({id:design.id,width,...geometry});
        assert.equal(geometry.chapters,8,design.id);
        const lastLink = page.locator('.navLinks a').last();
        await lastLink.click();
        const target = await lastLink.getAttribute('href');
        assert.equal(await page.evaluate(href => !!document.getElementById(href.slice(1)),target),true);
        await page.getByLabel("Your Name",{exact:true}).fill("Taylor");
        await page.getByRole("button",{name:/Not Going/}).click();
        assert.equal(await page.getByRole("button",{name:/Not Going/}).getAttribute("aria-pressed"),"true");
        await page.getByRole("button",{name:"Send RSVP",exact:true}).click();
        await page.getByText("Attendance updated.",{exact:true}).waitFor();
        await page.getByRole("button",{name:"Send another response"}).click();
        if (width !== 768) {
          await page.evaluate(() => window.scrollTo(0,0));
          await page.screenshot({path:path.join(output,`${design.id}-${width}.png`),fullPage:true});
          await page.locator('.program').screenshot({path:path.join(output,`${design.id}-${width}-program.png`)});
        }
      }
      console.log(`Verified ${selectedDesigns.length} complete designs at ${width}px`);
    }
    for (const mode of (process.argv.includes("--refresh") ? [] : ["sparse","empty","long"])) {
      for (const design of designs) {
        await page.goto(`${base}/?id=${design.id}&mode=${mode}`);
        await page.waitForSelector('html[data-ready="true"]');
        assert.equal(await page.locator('.chapter').count(),mode === "empty" ? 0 : mode === "sparse" ? 1 : 8);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,`${design.id} ${mode}`);
      }
      console.log(`Verified ${mode} content for all 60 designs`);
    }
    for (let batch=0;batch<5;batch++) {
      const tiles = [];
      for (const [i,d] of designs.slice(batch*12,batch*12+12).entries()) {
        const scaled = await sharp(path.join(output,`${d.id}-1440-program.png`)).resize({width:350}).png().toBuffer();
        const size = await sharp(scaled).metadata();
        const picture = await sharp(scaled).extract({left:0,top:0,width:350,height:Math.min(780,size.height)}).png().toBuffer();
        const label = Buffer.from(`<svg width="370" height="40"><rect width="370" height="40" fill="white"/><text x="10" y="25" font-size="16" font-family="Arial">${d.name.replaceAll("&","&amp;")}</text></svg>`);
        tiles.push({input:label,left:(i%4)*370,top:Math.floor(i/4)*830},{input:picture,left:(i%4)*370+10,top:Math.floor(i/4)*830+40});
      }
      await sharp({create:{width:1480,height:2490,channels:3,background:"#e5e5e5"}}).composite(tiles).png().toFile(path.join(output,`contact-${batch+1}.png`));
    }
    if (designArgument && fs.existsSync(path.join(output,"report.json"))) {
      const previous = JSON.parse(fs.readFileSync(path.join(output,"report.json"),"utf8"));
      results.push(...previous.results.filter(prior => !results.some(current => current.id === prior.id && current.width === prior.width)));
      errors.push(...previous.errors);
    }
    fs.writeFileSync(path.join(output,"report.json"),JSON.stringify({results,errors},null,2));
    const problems = results.filter(r => r.overflow.length || r.overlap || r.pageOverflow);
    for (const width of widths) {
      const shapes = results.filter(r => r.width === width).map(r => JSON.stringify(r.signature));
      assert.equal(new Set(shapes).size, designs.length, `All 60 designs have different measured section geometry at ${width}px`);
    }
    console.log(JSON.stringify({renders:results.length,problems,errors},null,2));
    assert.equal(errors.length,0,"No runtime/hydration errors");
    assert.equal(problems.length,0,"All compositions fit without overlaps or overflow");
  } finally {await browser.close();await new Promise(resolve => server.close(resolve));}
}
main().catch(error => {console.error(error);process.exitCode=1;});
