const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  if (request === "next/image") return (props) => React.createElement("img", {src:props.src, alt:props.alt});
  if (request === "next/link") return (props) => React.createElement("a", props);
  if (request === "@/components/CalendarAction") return {__esModule:true, default: () => React.createElement("button", null, "Add to calendar")};
  if (request === "@/components/EventDeleteModal") return {__esModule:true, default: () => null};
  if (request === "@/components/branding/EnvitefyEventBranding") return {__esModule:true, default: () => React.createElement("footer", null, "Envitefy")};
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
const transpile = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
for (const ext of [".ts", ".tsx", ".mjs"]) Module._extensions[ext] = transpile;
Module._extensions[".css"] = (mod) => { mod.exports = new Proxy({}, {get: (_, key) => key === "__esModule" ? false : String(key)}); };
const { normalizeFootballPageText, updateFootballPageText, footballCopyKey } = require("../../lib/football-page-text.ts");
const { normalizeFootballEventData } = require("../football-discovery/normalizeFootballEventData.mjs");
const { FootballPageTextProvider } = require("./FootballPageText.tsx");
const Page = require("../football-discovery/FootballDiscoveryContent.tsx").default;
const Content = require("./FootballPageContent.tsx").default;
const Hero = require("./FootballHero.tsx").default;
const { useFootballSectionTabs } = require("./FootballSectionTabs.tsx");
const { resolveFootballSeasonTemplateChrome } = require("../../app/event/football-season/customize/footballSeasonTemplateTheme.ts");
const { GYM_MEET_TEMPLATE_LIBRARY: designs } = require("./registry.ts");
const fixture = () => ({
  title: "Falcons Football", details: "Bring your team spirit", extra: {team:"Falcons",season:"2028",headCoach:"Coach Taylor"},
  rsvpEnabled: true, footballPageText: {},
  advancedSections: {
    games:{games:[{id:"g1",opponent:"Owls",date:"2028-10-12",time:"19:00",homeAway:"away",venue:"Owl Field",address:"100 Stadium Road",ticketsLink:"https://tickets.example/game"}]},
    roster:{players:[{id:"p1",name:"Taylor",jerseyNumber:"8",position:"QB",status:"active"}]},
    practice:{blocks:[{id:"p2",day:"Monday",focus:"Passing",startTime:"16:00",endTime:"17:00"}]},
    logistics:{parking:"North gate"}, gear:{items:[{id:"gear1",name:"Helmet"}]},
    volunteers:{slots:[{id:"v1",role:"Concessions"}]}, announcements:{items:[{id:"a1",text:"Welcome\n\nJoin us this season."}]},
  },
});
test("wording normalizes safely, preserves empty lines, and resets without mutating source", () => {
  const raw = {"section:games:title":"Fixture list",subtitle:"",eventTitle:"wrong",eventDetails:"wrong","card:logistics-parking:body":"x".repeat(4500),bad:123};
  const normalized = normalizeFootballPageText(raw);
  assert.equal(normalized["section:games:title"],"Fixture list");
  assert.equal(normalized.subtitle,"");
  assert.equal(normalized["card:logistics-parking:body"].length,4000);
  assert.equal(normalized.eventTitle,undefined);
  for(const malformed of [null,[],42,"copy"]) assert.deepEqual(normalizeFootballPageText(malformed),{});
  const initial = fixture();
  const title = updateFootballPageText(initial,"eventTitle","Friday Night Lights");
  assert.equal(title.title,"Friday Night Lights");
  assert.equal(initial.title,"Falcons Football");
  const details = updateFootballPageText(title,"eventDetails","See you at kickoff.");
  assert.equal(details.details,"See you at kickoff.");
  assert.deepEqual(details.footballPageText,{});
  const edited = updateFootballPageText(details,"subtitle","");
  assert.equal(edited.footballPageText.subtitle,"");
  assert.deepEqual(updateFootballPageText(edited,"subtitle",undefined).footballPageText,{});
});
test("saved wording renders without pencils across every football design", () => {
  assert.equal(designs.length,60);
  for(const design of designs) {
    const data = fixture();
    data.footballPageText = {
      subtitle:"Together under the lights","section:games:title":"Our fixtures","nav:games":"Match days",
      "section:details:caption":"For our fans","field:headCoach:label":"Team leader",
      "card:logistics-parking:title":"Where to park","card:logistics-parking:body":"Use the west gate.",
      [footballCopyKey("Buy tickets")]:"Reserve seats","nav:upcoming-games":"Next up",
    };
    const saved = JSON.parse(JSON.stringify(data));
    const html = renderToStaticMarkup(React.createElement(Page,{eventData:saved,eventTitle:saved.title,pageTemplateId:design.id,chrome:resolveFootballSeasonTemplateChrome(design.id),hideOwnerActions:true}));
    for(const value of ["Together under the lights","Our fixtures","Match days","For our fans","Team leader","Where to park","Use the west gate.","Reserve seats","Next up","Bring your team spirit"]) assert.ok(html.includes(value),design.id+": "+value);
    assert.ok(html.includes('href="https://tickets.example/game"'),design.id);
    assert.doesNotMatch(html,/aria-label="Edit |Reset .*template wording/);
    assert.ok(html.includes("Falcons Football"));
  }
});
function EditorFixture({data,onChange}) {
  const model = normalizeFootballEventData({eventData:data,eventTitle:data.title});
  const tabs = useFootballSectionTabs(model.navItems,false);
  return React.createElement(FootballPageTextProvider,{text:data.footballPageText,title:data.title,details:data.details,onChange},
    React.createElement(Hero,{title:data.title,subtitle:"Football season"}),
    React.createElement(Content,{sections:model.sections,tabs,chrome:resolveFootballSeasonTemplateChrome("elite-athlete"),schedule:{games:data.advancedSections.games.games,teamName:"Falcons",season:"2028"},attendance:model.attendance}));
}
test("editor pencils cover shared sections and stay outside links and tab buttons", () => {
  const html = renderToStaticMarkup(React.createElement(EditorFixture,{data:fixture(),onChange:()=>{}}));
  for(const label of ["Edit event title","Edit event description","Edit game schedule heading","Edit details caption","Edit parking label","Edit buy tickets","Edit upcoming navigation label","Edit attendance heading"]) assert.ok(html.includes('aria-label="'+label+'"'),label);
  for (const match of html.matchAll(/<(a|button|label)\b[^>]*>[\s\S]*?<\/\1>/g)) {
    assert.ok(!/<(?:button|input|select)\b/.test(match[0].replace(/^<[^>]+>/, "")), "pencils must be siblings of controls");
  }
  assert.ok(html.includes('href="https://tickets.example/game"'));
});
test("explicit draft save projects football wording while published edits remain staged", async () => {
  const { saveManualEventProgress } = require("../../lib/manual-event-progress.ts");
  const initialFetch = global.fetch, initialWindow = global.window;
  const data = fixture();
  data.footballPageText = {"section:games:title":"Match days"};
  const snapshot = {data,advancedState:data.advancedSections,pageTemplateId:"elite-athlete"};
  let written;
  global.window = {dispatchEvent:()=>{}};
  try {
    global.fetch = async (_url,options) => {
      if (!options?.body) return {ok:true,json:async()=>({data:{}})};
      written = JSON.parse(options.body);
      return {ok:true,json:async()=>({id:"draft-1",data:{manualEditor:{snapshot}}})};
    };
    await saveManualEventProgress({snapshot,category:"sport_football_season",templateId:"football-season",path:"/event/football-season/customize",clientDraftId:"test"});
    assert.deepEqual(written.data.footballPageText,data.footballPageText);
    assert.equal(written.data.pageTemplateId,"elite-athlete");
    assert.deepEqual(written.data.advancedSections,data.advancedSections);
    assert.equal(written.data.description,data.details);
    global.fetch = async (_url,options) => {
      if (!options?.body) return {ok:true,json:async()=>({data:{status:"published",title:"Published title",footballPageText:{subtitle:"Published copy"}}})};
      written=JSON.parse(options.body);
      return {ok:true,json:async()=>({id:"event-1"})};
    };
    await saveManualEventProgress({eventId:"event-1",snapshot,category:"sport_football_season",templateId:"football-season",path:"/event/football-season/customize",clientDraftId:"test"});
    assert.deepEqual(written.data.footballPageText,{subtitle:"Published copy"});
    assert.deepEqual(written.data.manualEditor.snapshot.data.footballPageText,data.footballPageText);
  } finally { global.fetch=initialFetch; global.window=initialWindow; }
});
