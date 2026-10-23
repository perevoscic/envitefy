import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";
import { chromium } from "playwright";

const out = path.resolve("output/dark-ui-browser");
const pink = "rgb(242, 198, 222)";
const surface = "rgb(37, 31, 45)";
const require = createRequire(import.meta.url);

async function assertSidebarBrand(sidebar,kind,appearance,label,{loaded=true}={}) {
  const images=sidebar.locator('a[aria-label="Envitefy home"] img:visible');
  assert.equal(await images.count(),1,`${label} shows exactly one brand image`);
  if(loaded)await images.evaluate(image=>image.decode());
  const image=await images.evaluate(image=>({src:image.getAttribute("src"),width:image.width,height:image.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight}));
  const expected=kind==="symbol"?`/brand/${appearance==="dark"?"white-v1/":""}e-only.png`:`/brand/wordmark-v2/envitefy-wordmark${appearance==="dark"?"-white":""}.webp`;
  assert.equal(image.src,expected,`${label} uses the ${appearance} ${kind}`);
  assert.equal(image.width,kind==="symbol"?44:196,`${label} retains the intended logo width`);
  if(kind==="symbol")assert.equal(image.height,44,`${label} keeps the symbol inside its square box`);
  if(loaded){
    assert.ok(image.naturalWidth>0&&image.naturalHeight>0,`${label} loads its own artwork`);
    if(kind==="symbol")assert.deepEqual([image.naturalWidth,image.naturalHeight],[256,165],`${label} decodes the actual e symbol`);
  }
}

async function assertCompactToggle(scope,isDark,label) {
  const toggle=scope.getByRole("switch",{name:"Dark mode",exact:true});
  assert.equal(await toggle.isChecked(),isDark,`${label} switch reflects the resolved appearance`);
  const geometry=await toggle.evaluate(element=>{
    const measure=node=>{const rect=node.getBoundingClientRect();return {left:rect.left,top:rect.top,width:rect.width,height:rect.height};};
    const spans=[...element.querySelectorAll("span")];
    const track=spans.find(node=>{const rect=node.getBoundingClientRect();return Math.abs(rect.width-56)<.1&&Math.abs(rect.height-28)<.1;});
    const thumb=spans.find(node=>{const rect=node.getBoundingClientRect();return Math.abs(rect.width-24)<.1&&Math.abs(rect.height-24)<.1;});
    const icons=[...element.querySelectorAll("svg")].map(icon=>{
      let opacity=1;for(let node=icon;node&&node!==element;node=node.parentElement)opacity*=Number(getComputedStyle(node).opacity);
      return {kind:icon.classList.contains("lucide-sun")?"sun":icon.classList.contains("lucide-moon")?"moon":"other",opacity,...measure(icon)};
    });
    return {hit:measure(element),track:track&&measure(track),thumb:thumb&&{...measure(thumb),color:getComputedStyle(thumb).backgroundColor},icons};
  });
  assert.ok(geometry.hit.width>=44&&geometry.hit.height>=44,`${label} retains a 44px hit area`);
  assert.ok(geometry.track,`${label} receives its 56x28 CSS module track`);
  assert.ok(geometry.thumb,`${label} receives its 24px CSS module thumb`);
  const visibleIcons=geometry.icons.filter(icon=>icon.opacity>.99);
  assert.deepEqual(visibleIcons.map(icon=>icon.kind),[isDark?"sun":"moon"],`${label} shows one theme icon rather than stacked icons`);
  assert.ok(visibleIcons.every(icon=>icon.width===14&&icon.height===14),`${label} uses the compact 14px icon`);
  assert.ok(geometry.thumb.color.match(/[\d.]+/g).slice(0,3).every(channel=>Number(channel)>=230),`${label} keeps its white thumb`);
  assert.equal(geometry.thumb.left>geometry.track.left+geometry.track.width/2,isDark,`${label} thumb moves to the selected side`);
  return geometry;
}

async function assertAccountFooter(account,label) {
  await assertCompactToggle(account,true,label);
  const geometry=await account.evaluate(panel=>{
    const toggle=panel.querySelector('[role="switch"][aria-label="Dark mode"]');
    const logout=[...panel.querySelectorAll("button")].find(button=>button.textContent.trim()==="Log out");
    const row=logout?.closest("[data-account-menu-actions]");
    if(!logout||!row?.contains(toggle))return null;
    const rect=element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,centerY:box.top+box.height/2};};
    const rowRect=rect(row);
    const earlier=[...panel.querySelectorAll("a,button")].filter(element=>!row.contains(element)&&element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
    return {logout:rect(logout),toggle:rect(toggle),row:rowRect,columns:getComputedStyle(row).gridTemplateColumns.split(" ").map(parseFloat),earlierBottom:Math.max(...earlier.map(element=>rect(element).bottom))};
  });
  assert.ok(geometry,`${label} puts Log out and the toggle in one footer row`);
  assert.equal(geometry.columns.length,2,`${label} uses two footer columns`);
  assert.ok(Math.abs(geometry.columns[0]-geometry.columns[1])<=1,`${label} uses equal footer columns`);
  assert.ok(Math.abs(geometry.logout.centerY-geometry.toggle.centerY)<=1,`${label} aligns the footer controls horizontally`);
  assert.ok(geometry.toggle.right<=geometry.logout.left,`${label} puts the toggle on the left and Log out on the right`);
  assert.ok(geometry.earlierBottom<=geometry.row.top+1,`${label} keeps the shared row below the other account links`);
  const visibleAppearance=await account.getByText("Appearance",{exact:true}).evaluateAll(elements=>elements.filter(element=>{
    const rect=element.getBoundingClientRect();return rect.width>1&&rect.height>1&&element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  }).length);
  assert.equal(visibleAppearance,0,`${label} has no visible Appearance word`);
}

test("actual signed-in sidebar and navbar stay dark with pink menus across desktop/mobile and event tones", {timeout:120000}, async()=>{
  execSync("bun scripts/build-dark-ui-fixture.mjs",{timeout:60000,stdio:"pipe"});
  const [bundle,globalCss,moduleCss,bootstrap]=await Promise.all(["entry.js","global.css","entry.css","bootstrap.js"].map(name=>fs.readFile(path.join(out,name),"utf8")));
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const failures=[];const evidence=[];const errors=[];
  try {
    const context=await browser.newContext({colorScheme:"dark",reducedMotion:"reduce",viewport:{width:1440,height:1080}});
    await context.addInitScript(()=>{localStorage.setItem("sidebar:desktop-pinned","1");localStorage.setItem("sidebar:collapsed","1");});
    await context.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.hostname!=="navigation.test")return route.abort();
      if(url.pathname==="/entry.js")return route.fulfill({contentType:"application/javascript",body:bundle});
      if(url.pathname==="/api/user/profile")return route.fulfill({json:{firstName:"Casey",lastName:"Example",name:"Casey Example",email:"casey@example.test",avatarUrl:null,preferredProvider:null,isAdmin:false}});
      if(url.pathname==="/api/user/creation-access")return route.fulfill({json:{access:{policy:"standard",allowedProducts:["snap","live_card","event_page","signup_form"],allowedCategories:["general","birthdays","weddings","anniversaries","baby-showers","bridal-showers","gender-reveal","gymnastics","football","sport-events"]}}});
      if(url.pathname==="/api/user/feature-visibility")return route.fulfill({json:{visibleTemplateKeys:["general","birthdays","weddings","gymnastics","football_season","baby_showers"],quickAccess:["snap","upload","smart_signup"],sportPreferences:{primarySport:"gymnastics",enabledSports:["gymnastics","football"],setupCompleted:true}}});
      if(url.pathname.startsWith("/api/"))return route.fulfill({json:{items:[],events:[],data:[],ok:true,google:false,microsoft:false,apple:false}});
      if(/\.(png|jpe?g|webp|svg|woff2?|ttf|otf)$/.test(url.pathname)) {
        const filename=path.resolve("public",`.${url.pathname}`);
        if(!filename.startsWith(path.resolve("public")+path.sep))return route.abort();
        try{return route.fulfill({body:await fs.readFile(filename),contentType:url.pathname.endsWith(".svg")?"image/svg+xml":undefined});}catch{return route.fulfill({status:404,body:""});}
      }
      const tone=url.searchParams.get("tone")==="dark"?' data-event-page-tone="dark"':"";
      const styles=url.searchParams.get("tone")==="dark"?`${moduleCss}\n${globalCss}`:`${globalCss}\n${moduleCss}`;
      return route.fulfill({contentType:"text/html",body:`<!doctype html><html${tone}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><script>${bootstrap}</script></head><body><div id="root"></div><script src="/entry.js"></script></body></html>`});
    });
    const page=await context.newPage();page.setDefaultTimeout(10000);page.on("pageerror",error=>{errors.push(error.message);console.error("Navigation fixture:",error.message);});
    const check=async(label,locator,property,expected)=>{
      const actual=await locator.evaluate((el,key)=>getComputedStyle(el)[key],property);
      evidence.push({label,property,actual,expected});if(actual!==expected)failures.push({label,property,actual,expected});
    };
    const snapshot=async(name)=>page.screenshot({path:path.join(out,`signed-in-navigation-${name}.png`)});
    const assertCreateRoot=async(sidebar,label)=>{
      const navigation=sidebar.getByRole("navigation",{name:"Main navigation",exact:true});
      await navigation.waitFor();
      for(const name of ["Snap a Flyer","Live Card","Create event","My Events","Drafts"]){
        await navigation.getByRole("button",{name,exact:true}).waitFor();
      }
      const create=navigation.getByRole("button",{name:"Create event",exact:true});
      assert.equal(await create.getAttribute("aria-current"),"page",`${label} keeps Create event selected`);
      assert.equal(await navigation.getByRole("button",{name:"My Events",exact:true}).getAttribute("aria-current"),null,`${label} does not select My Events for a creation route`);
      assert.equal(await sidebar.getByRole("region",{name:"Create Event list",exact:true,includeHidden:true}).count(),0,`${label} omits the duplicate category submenu`);
      assert.equal(await sidebar.getByRole("region",{name:"Other Events list",exact:true,includeHidden:true}).count(),0,`${label} omits the nested category submenu`);
      await check(`${label} Create event surface`,create,"backgroundColor","rgb(56, 45, 66)");
      await check(`${label} Create event text`,create.locator(".nav-chrome-menu-label"),"color",pink);
      await check(`${label} Create event icon`,create.locator("svg").first(),"color",pink);
    };
    let releaseSymbols;
    const symbolGate=new Promise(resolve=>{releaseSymbols=resolve;});
    await page.route("**/e-only.png",async route=>{await symbolGate;await route.fallback();});
    const symbolRequests=Promise.all([
      page.waitForRequest(request=>new URL(request.url()).pathname==="/brand/e-only.png"),
      page.waitForRequest(request=>new URL(request.url()).pathname==="/brand/white-v1/e-only.png"),
    ]);
    await page.goto("https://navigation.test/navigation?screen=navigation",{waitUntil:"domcontentloaded"});
    const pendingSidebar=page.locator('[data-app-navigation="sidebar"]');
    await page.waitForFunction(()=>document.querySelector('[data-app-navigation="sidebar"]')?.getAttribute("data-sidebar-state")==="expanded");
    await assertSidebarBrand(pendingSidebar,"wordmark","dark","expanded while symbol downloads are pending");
    await symbolRequests;
    const symbol=pendingSidebar.locator('[data-sidebar-brand="symbol"] img').last();
    const symbolNode=await symbol.elementHandle();
    const originalSymbolSource=await symbol.getAttribute("src");
    assert.equal(await pendingSidebar.locator('[data-sidebar-brand="wordmark"] img').count(),2,"both appearance wordmarks stay mounted separately from the symbols");
    await pendingSidebar.getByRole("button",{name:"Collapse sidebar",exact:true}).click();
    await page.mouse.move(1000,700);await page.mouse.click(1000,700);
    await page.waitForFunction(()=>document.querySelector('[data-app-navigation="sidebar"]')?.getAttribute("data-sidebar-state")==="collapsed");
    await assertSidebarBrand(pendingSidebar,"symbol","dark","collapsed while symbol downloads are pending",{loaded:false});
    assert.equal(await pendingSidebar.locator('[data-sidebar-brand="wordmark"]').isHidden(),true,"the loaded wordmark cannot paint inside the collapsed symbol box");
    assert.equal(await symbol.evaluate((image,previous)=>image===previous,symbolNode),true,"collapse retains the symbol's own image node");
    assert.equal(await symbol.getAttribute("src"),originalSymbolSource,"collapse never changes the symbol image source");
    await snapshot("symbol-download-pending");
    releaseSymbols();
    await assertSidebarBrand(pendingSidebar,"symbol","dark","collapsed after the symbol finishes loading");
    await page.unroute("**/e-only.png");
    await pendingSidebar.getByRole("button",{name:"Keep sidebar open",exact:true}).click();
    await page.mouse.move(1000,700);
    for(const tone of ["default","dark"]){
      await page.setViewportSize({width:1440,height:1080});
      await page.goto(`https://navigation.test/navigation?screen=navigation&tone=${tone}`);
      const sidebar=page.locator('[data-app-navigation="sidebar"]');
      await sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).waitFor({timeout:10000});
      await page.waitForFunction(()=>document.querySelector('[data-app-navigation="sidebar"]')?.getAttribute("data-sidebar-state")==="expanded");
      if(tone==="default"){
        await assertSidebarBrand(sidebar,"wordmark","dark","expanded dark sidebar");
        assert.equal(await page.locator("html").getAttribute("data-appearance-preference"),"system");
        assert.equal(await page.evaluate(()=>localStorage.getItem("envitefy:appearance:v1")),null,"navigation starts with the device preference");
        await page.emulateMedia({colorScheme:"light"});
        await page.locator('html[data-theme="general-light"]').waitFor();
        await assertSidebarBrand(sidebar,"wordmark","light","expanded light sidebar");
        await page.emulateMedia({colorScheme:"dark"});
        await page.locator('html[data-theme="general-dark"]').waitFor();
      }
      await check(`${tone} expanded sidebar`,sidebar,"backgroundColor",surface);
      const rootItem=sidebar.getByRole("button",{name:"Snap a Flyer",exact:true});
      await check(`${tone} sidebar menu text`,rootItem.locator(".nav-chrome-menu-label"),"color",pink);
      await check(`${tone} sidebar icon`,rootItem.locator("svg").first(),"color",pink);
      await check(`${tone} account name`,sidebar.locator(".nav-chrome-account-name"),"color",pink);
      await check(`${tone} account detail`,sidebar.locator(".nav-chrome-account-detail"),"color","rgb(205, 181, 200)");
      const navbar=page.getByTestId("signed-in-navbar").locator(".nav-chrome-glass-header:visible");
      await check(`${tone} navbar`,navbar,"backgroundColor",surface);
      await check(`${tone} navbar link`,navbar.getByRole("button",{name:"Recent events",exact:true}),"color",pink);
      await snapshot(`${tone}-desktop-expanded`);

      await page.goto(`https://navigation.test/live-cards?screen=navigation&tone=${tone}`);
      const selected=sidebar.getByRole("button",{name:"Live Card",exact:true});
      await selected.waitFor();
      await check(`${tone} selected Live Card surface`,selected,"backgroundColor","rgb(56, 45, 66)");
      await check(`${tone} selected Live Card text`,selected.locator(".nav-chrome-menu-label"),"color",pink);
      await check(`${tone} selected Live Card icon`,selected.locator("svg").first(),"color",pink);
      await selected.hover();
      await check(`${tone} selected hover text`,selected.locator(".nav-chrome-menu-label"),"color",pink);
      const bounds=await selected.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
      const pressed=await selected.evaluate(el=>getComputedStyle(el).backgroundColor);
      evidence.push({label:`${tone} pressed surface`,property:"backgroundColor",actual:pressed,expected:"dark"});
      if(pressed.match(/[\d.]+/g).slice(0,3).some(channel=>Number(channel)>100))failures.push({label:`${tone} pressed surface must not flash pale`,actual:pressed});
      await check(`${tone} selected press text`,selected.locator(".nav-chrome-menu-label"),"color",pink);
      await page.mouse.up();
      await snapshot(`${tone}-desktop-selected-hover`);

      for(const pathname of ["/create","/event/gymnastics","/event/birthdays","/event/birthdays/customize"]){
        await page.goto(`https://navigation.test${pathname}?screen=navigation&tone=${tone}`);
        await assertCreateRoot(sidebar,`${tone} desktop ${pathname}`);
        if(pathname==="/create"){
          await page.reload();
          await assertCreateRoot(sidebar,`${tone} desktop /create reload`);
          await snapshot(`${tone}-desktop-create-root`);
        }
      }
      await page.goto(`https://navigation.test/navigation?screen=navigation&tone=${tone}`);
      await sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).waitFor();

      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();
      const account=sidebar.getByRole("link",{name:"Profile",exact:true}).locator('xpath=ancestor::div[contains(@class,"nav-chrome-menu-card")][1]');
      await account.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} sidebar account panel`,account,"backgroundColor",surface);
      await check(`${tone} sidebar profile text`,account.getByRole("link",{name:"Profile",exact:true}).locator("span").last(),"color",pink);
      await check(`${tone} sidebar profile icon`,account.getByRole("link",{name:"Profile",exact:true}).locator("svg"),"color",pink);
      await assertAccountFooter(account,`${tone} desktop sidebar account footer`);
      await snapshot(`${tone}-desktop-sidebar-account`);
      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();

      await navbar.getByRole("button",{name:"Profile menu",exact:true}).click();
      const topProfile=navbar.getByRole("link",{name:"Profile",exact:true}).locator('xpath=ancestor::div[contains(@class,"nav-chrome-menu-card")][1]');
      await topProfile.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} navbar profile panel`,topProfile,"backgroundColor",surface);
      await check(`${tone} navbar profile text`,topProfile.getByRole("link",{name:"Profile",exact:true}),"color",pink);
      await check(`${tone} navbar profile icon`,topProfile.getByRole("link",{name:"Profile",exact:true}).locator("svg"),"color",pink);
      await assertAccountFooter(topProfile,`${tone} desktop navbar account footer`);
      evidence.push({label:`${tone} navbar profile cascade`,diagnostic:await topProfile.getByRole("link",{name:"Profile",exact:true}).evaluate(el=>{
        const matched=[];
        const visit=rules=>{for(const rule of rules){if(rule.selectorText){try{if(el.matches(rule.selectorText)&&rule.style.getPropertyValue("color"))matched.push({selector:rule.selectorText,color:rule.style.getPropertyValue("color"),priority:rule.style.getPropertyPriority("color")});}catch{}}else if(rule.cssRules){if(rule.media&&!matchMedia(rule.conditionText).matches)continue;visit(rule.cssRules);}}};
        for(const sheet of document.styleSheets)try{visit(sheet.cssRules);}catch{}
        const ancestors=[];for(let node=el;node;node=node.parentElement){const style=getComputedStyle(node);ancestors.push({tag:node.tagName,className:node.className,color:style.color,ink:style.getPropertyValue("--nav-chrome-ink"),navigation:style.getPropertyValue("--navigation-foreground")});}
        return {matched,ancestors};
      })});
      await snapshot(`${tone}-desktop-navbar-account`);
      await navbar.getByRole("button",{name:"Profile menu",exact:true}).click();

      await sidebar.getByRole("button",{name:"Collapse sidebar",exact:true}).click();
      await page.mouse.move(1000,700);await page.mouse.click(1000,700);
      await page.waitForFunction(()=>document.querySelector('[data-app-navigation="sidebar"]')?.getAttribute("data-sidebar-state")==="collapsed");
      await check(`${tone} collapsed sidebar`,sidebar,"backgroundColor",surface);
      await check(`${tone} collapsed icon`,sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).locator("svg").first(),"color",pink);
      await assertSidebarBrand(sidebar,"symbol","dark",`${tone} collapsed dark sidebar`);
      await page.emulateMedia({colorScheme:"light"});
      await page.locator('html[data-theme="general-light"]').waitFor();
      await assertSidebarBrand(sidebar,"symbol","light",`${tone} collapsed light sidebar`);
      await page.emulateMedia({colorScheme:"dark"});
      await page.locator('html[data-theme="general-dark"]').waitFor();
      await snapshot(`${tone}-desktop-collapsed`);

      await page.setViewportSize({width:390,height:844});
      const mobileTopbar=page.locator('[data-app-mobile-topbar="app"]');
      await mobileTopbar.waitFor();
      await check(`${tone} mobile topbar surface`,mobileTopbar.locator(".nav-chrome-glass-header"),"backgroundColor",surface);
      await check(`${tone} mobile topbar menu icon`,mobileTopbar.getByRole("button",{name:"Open navigation",exact:true}).locator("svg").first(),"color",pink);
      await snapshot(`${tone}-mobile-topbar`);
      await page.getByRole("button",{name:"Open navigation",exact:true}).click();
      await sidebar.getByRole("navigation",{name:"Main navigation",exact:true}).waitFor();
      await check(`${tone} mobile drawer`,sidebar,"backgroundColor",surface);
      await check(`${tone} mobile menu text`,sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).locator(".nav-chrome-menu-label"),"color",pink);
      await check(`${tone} mobile menu icon`,sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).locator("svg").first(),"color",pink);
      await assertSidebarBrand(sidebar,"wordmark","dark",`${tone} mobile dark drawer`);
      await page.emulateMedia({colorScheme:"light"});
      await page.locator('html[data-theme="general-light"]').waitFor();
      await assertSidebarBrand(sidebar,"wordmark","light",`${tone} mobile light drawer`);
      await page.emulateMedia({colorScheme:"dark"});
      await page.locator('html[data-theme="general-dark"]').waitFor();
      await snapshot(`${tone}-mobile-drawer`);
      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();
      await account.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} mobile profile panel`,account,"backgroundColor",surface);
      await check(`${tone} mobile profile text`,account.getByRole("link",{name:"Profile",exact:true}).locator("span").last(),"color",pink);
      await assertAccountFooter(account,`${tone} mobile sidebar account footer`);
      await snapshot(`${tone}-mobile-profile`);
      for(const pathname of ["/create","/event/gymnastics","/event/birthdays/customize"]){
        await page.goto(`https://navigation.test${pathname}?screen=navigation&tone=${tone}`);
        await page.getByRole("button",{name:"Open navigation",exact:true}).click();
        await assertCreateRoot(sidebar,`${tone} mobile ${pathname}`);
        if(pathname==="/create"){
          await page.reload();
          await page.getByRole("button",{name:"Open navigation",exact:true}).click();
          await assertCreateRoot(sidebar,`${tone} mobile /create reload`);
          await snapshot(`${tone}-mobile-create-root`);
        }
      }
      // Each iteration starts from a fresh page, with a pinned desktop rail.
      await context.addInitScript(()=>localStorage.setItem("sidebar:desktop-pinned","1"));
    }
    await fs.writeFile(path.join(out,"signed-in-navigation-computed.json"),JSON.stringify({evidence,failures,errors},null,2));
    assert.deepEqual(errors,[]);
    assert.deepEqual(failures,[],"actual navigation must use dark panels and consistent light-pink menu text/icons");
    await context.close();
  }finally{await browser.close();}
});

test("Next CSS compilation delivers persistent navigation styles and the compact theme switch",{timeout:60000},async()=>{
  const layout=await fs.readFile("src/app/layout.tsx","utf8");
  for(const module of ["navigation/navigation-appearance","appearance-selector"]){
    assert.ok(layout.includes(`import "@/components/${module}.module.css"`),`${module} remains in the persistent root CSS bundle`);
  }
  const directory=path.resolve("output/next-navigation-browser");
  await fs.mkdir(directory,{recursive:true});
  const entry=path.join(directory,"entry.tsx");
  await fs.writeFile(entry,`import React from "react";import {createRoot} from "react-dom/client";
import ThemeProvider from "../../src/components/AppearanceProvider";
import AppearanceSelector from "../../src/components/AppearanceSelector";
import navigationStyles from "../../src/components/navigation/navigation-appearance.module.css";
createRoot(document.getElementById("root")!).render(<ThemeProvider><div data-next-navigation className={navigationStyles.chrome+" nav-chrome-sidebar-surface"}><AppearanceSelector compact/></div></ThemeProvider>);`);
  const compiled=require("next/dist/compiled/webpack/webpack");compiled.init();
  const webpack=compiled.webpack;
  const {getCssModuleLoader}=require("next/dist/build/webpack/config/blocks/css/loaders/modules");
  const {getPostCssPlugins}=require("next/dist/build/webpack/config/blocks/css/plugins");
  const ExtractCss=require("next/dist/build/webpack/plugins/mini-css-extract-plugin").default;
  const span=require("next/dist/trace").trace("next-navigation-css-regression");
  const postcss=require("postcss");
  const plugins=await getPostCssPlugins(process.cwd(),undefined,false,false);
  const lazyPostcss=async()=>({postcss,postcssWithPlugins:postcss(plugins)});
  await new Promise((resolve,reject)=>{
    const compiler=webpack({mode:"development",target:"web",devtool:false,entry,output:{path:directory,filename:"entry.js"},
      resolve:{extensions:[".tsx",".ts",".js"],alias:{"@":path.resolve("src")}},
      module:{rules:[{test:/\.[jt]sx?$/,exclude:/node_modules/,use:path.resolve("scripts/lib/create-guest-ts-loader.cjs")},
        {test:/\.module\.css$/,use:getCssModuleLoader({isClient:true,isServer:false,hasAppDir:true,isAppDir:true,isDevelopment:true,assetPrefix:"",experimental:{useLightningcss:false}},lazyPostcss)}]},
      plugins:[new ExtractCss({filename:"entry.css"}),{apply(compiler){compiler.hooks.compilation.tap("NextCssTrace",compilation=>webpack.NormalModule.getCompilationHooks(compilation).loader.tap("NextCssTrace",context=>{context.currentTraceSpan=span;}));}}]});
    compiler.run((error,stats)=>compiler.close(()=>error||stats?.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):resolve()));
  });
  span.stop();
  const [script,css]=await Promise.all([fs.readFile(path.join(directory,"entry.js"),"utf8"),fs.readFile(path.join(directory,"entry.css"),"utf8")]);
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  try{
    const page=await browser.newPage({colorScheme:"light",reducedMotion:"reduce",viewport:{width:390,height:300}});
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await page.route("https://next-navigation.test/**",route=>route.fulfill(route.request().url().endsWith("entry.js")?{contentType:"application/javascript",body:script}:{contentType:"text/html",body:`<!doctype html><html><head><style>*,*::before,*::after{box-sizing:border-box}body{margin:0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}</style><style>${css}</style></head><body><div id="root"></div><script src="/entry.js"></script></body></html>`}));
    await page.goto("https://next-navigation.test/");
    const navigation=page.locator("[data-next-navigation]");
    await navigation.waitFor();
    await page.locator('html[data-theme="general-light"]').waitFor();
    await assertCompactToggle(navigation,false,"Next-compiled light switch");
    assert.equal(await page.locator("html").getAttribute("data-appearance-preference"),"system");
    await page.screenshot({path:path.join(directory,"light.png")});
    await page.emulateMedia({colorScheme:"dark"});
    await page.locator('html[data-theme="general-dark"]').waitFor();
    await assertCompactToggle(navigation,true,"Next-compiled dark switch");
    assert.equal(await navigation.evaluate(element=>getComputedStyle(element).backgroundColor),surface,"Next delivers the dark navigation module");
    await page.screenshot({path:path.join(directory,"dark.png")});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
