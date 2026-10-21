import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import test from "node:test";
import { chromium } from "playwright";

const out = path.resolve("output/dark-ui-browser");
const pink = "rgb(242, 198, 222)";
const surface = "rgb(37, 31, 45)";

test("actual signed-in sidebar and navbar stay dark with pink menus across desktop/mobile and event tones", {timeout:120000}, async()=>{
  execSync("bun scripts/build-dark-ui-fixture.mjs",{timeout:60000,stdio:"pipe"});
  const [bundle,globalCss,moduleCss,bootstrap]=await Promise.all(["entry.js","global.css","entry.css","bootstrap.js"].map(name=>fs.readFile(path.join(out,name),"utf8")));
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const failures=[];const evidence=[];const errors=[];
  try {
    const context=await browser.newContext({colorScheme:"dark",reducedMotion:"reduce",viewport:{width:1440,height:1080}});
    await context.addInitScript(()=>{localStorage.setItem("sidebar:desktop-pinned","1");localStorage.setItem("sidebar:collapsed","1");localStorage.setItem("envitefy:appearance:v1","dark");});
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
    for(const tone of ["default","dark"]){
      await page.setViewportSize({width:1440,height:1080});
      await page.goto(`https://navigation.test/navigation?screen=navigation&tone=${tone}`);
      const sidebar=page.locator('[data-app-navigation="sidebar"]');
      await sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).waitFor({timeout:10000});
      await page.waitForFunction(()=>document.querySelector('[data-app-navigation="sidebar"]')?.getAttribute("data-sidebar-state")==="expanded");
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

      // Unified creation navigates away; category routes mount the retained category submenu.
      await page.goto(`https://navigation.test/event/gymnastics?screen=navigation&tone=${tone}`);
      const create=sidebar.getByRole("region",{name:"Create Event list",exact:true});
      await create.getByRole("button",{name:"Birthdays",exact:true}).waitFor({timeout:10000});
      const birthday=create.getByRole("button",{name:"Birthdays",exact:true});
      await check(`${tone} create submenu text`,birthday.locator(".nav-chrome-menu-label"),"color",pink);
      await check(`${tone} create submenu icon`,birthday.locator("svg").first(),"color",pink);
      await snapshot(`${tone}-desktop-submenu`);
      await page.goto(`https://navigation.test/navigation?screen=navigation&tone=${tone}`);
      await sidebar.getByRole("button",{name:"Snap a Flyer",exact:true}).waitFor();

      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();
      const account=sidebar.getByRole("link",{name:"Profile",exact:true}).locator('xpath=ancestor::div[contains(@class,"nav-chrome-menu-card")][1]');
      await account.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} sidebar account panel`,account,"backgroundColor",surface);
      await check(`${tone} sidebar profile text`,account.getByRole("link",{name:"Profile",exact:true}).locator("span").last(),"color",pink);
      await check(`${tone} sidebar profile icon`,account.getByRole("link",{name:"Profile",exact:true}).locator("svg"),"color",pink);
      await snapshot(`${tone}-desktop-sidebar-account`);
      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();

      await navbar.getByRole("button",{name:"Profile menu",exact:true}).click();
      const topProfile=navbar.getByRole("link",{name:"Profile",exact:true}).locator('xpath=ancestor::div[contains(@class,"nav-chrome-menu-card")][1]');
      await topProfile.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} navbar profile panel`,topProfile,"backgroundColor",surface);
      await check(`${tone} navbar profile text`,topProfile.getByRole("link",{name:"Profile",exact:true}),"color",pink);
      await check(`${tone} navbar profile icon`,topProfile.getByRole("link",{name:"Profile",exact:true}).locator("svg"),"color",pink);
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
      await snapshot(`${tone}-mobile-drawer`);
      await sidebar.getByRole("button",{name:"Account menu for Casey Example",exact:true}).click();
      await account.getByRole("link",{name:"Profile",exact:true}).waitFor();
      await check(`${tone} mobile profile panel`,account,"backgroundColor",surface);
      await check(`${tone} mobile profile text`,account.getByRole("link",{name:"Profile",exact:true}).locator("span").last(),"color",pink);
      await snapshot(`${tone}-mobile-profile`);
      // Each iteration starts from a fresh page, with a pinned desktop rail.
      await context.addInitScript(()=>localStorage.setItem("sidebar:desktop-pinned","1"));
    }
    await fs.writeFile(path.join(out,"signed-in-navigation-computed.json"),JSON.stringify({evidence,failures,errors},null,2));
    assert.deepEqual(errors,[]);
    assert.deepEqual(failures,[],"actual navigation must use dark panels and consistent light-pink menu text/icons");
    await context.close();
  }finally{await browser.close();}
});
