import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";

const out = path.resolve("output/dark-ui-browser");

test("real Live Card, gallery and marketing surfaces support dark appearance and white branding", {timeout:180000}, async () => {
  execSync("bun scripts/build-dark-ui-fixture.mjs", {timeout:60000,stdio:"pipe"});
  const [bundle,globalCss,moduleCss,bootstrap] = await Promise.all(["entry.js","global.css","entry.css","bootstrap.js"].map(name=>fs.readFile(path.join(out,name),"utf8")));
  const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const measurements=[];
  try {
    const context=await browser.newContext({colorScheme:"dark",reducedMotion:"reduce",viewport:{width:1440,height:1080}});
    const errors=[];
    await context.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.hostname!=="dark-ui.test") return route.abort();
      if(url.pathname==="/entry.js") return route.fulfill({contentType:"application/javascript",body:bundle});
      if(url.pathname==="/api/user/profile") return route.fulfill({json:{firstName:"Casey",lastName:"Example",email:"casey@example.test",avatarUrl:null,preferredProvider:""}});
      if(url.pathname.startsWith("/api/")) return route.fulfill({json:{items:[],events:[],data:[],ok:true}});
      if(/\.(png|jpe?g|webp|svg|woff2?|ttf|otf)$/.test(url.pathname)) {
        const filename=path.resolve("public",`.${url.pathname}`);
        if(!filename.startsWith(path.resolve("public")+path.sep)) return route.abort();
        try {return route.fulfill({body:await fs.readFile(filename),contentType:url.pathname.endsWith(".svg")?"image/svg+xml":undefined});}
        catch {return route.fulfill({status:404,body:""});}
      }
      return route.fulfill({contentType:"text/html",body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${globalCss}\n${moduleCss}</style><script>${bootstrap}</script></head><body><div id="root"></div><script src="/entry.js"></script></body></html>`});
    });
    const page=await context.newPage();
    page.on("pageerror",error=>{errors.push(error.message);console.error("Fixture runtime:",error.message);});
    for(const [screen,route] of [["livecard","/live-cards"],["gallery","/event/birthdays"],["landing","/landing"],["settings","/settings"],["install","/install"]]) {
      for(const width of [1440,390]) {
        await page.setViewportSize({width,height:1080});
        await page.goto(`https://dark-ui.test${route}?screen=${screen}`);
        await page.locator("h1").first().waitFor({timeout:10000}).catch(async error=>{await page.screenshot({path:path.join(out,`${screen}-failed.png`)});throw error;});
        if(screen==="install")await page.getByRole("button",{name:"Install",exact:true}).waitFor();
        await page.evaluate(()=>document.fonts.ready);
        await page.screenshot({path:path.join(out,`${screen}-dark-${width}.png`),fullPage:false});
        const collect=()=>page.evaluate(()=>{
          const canvas=document.createElement("canvas");canvas.width=canvas.height=1;const ctx=canvas.getContext("2d");
          const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
          const blend=(a,b)=>a.slice(0,3).map((value,index)=>value*(a[3]/255)+b[index]*(1-a[3]/255));
          const lum=rgb=>rgb.map(x=>{const c=x/255;return c<=0.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
          const low=[]; const controls=[];
          for(const el of document.querySelectorAll("h1,h2,h3,p,label,button,a,input,textarea,select")) {
            const rect=el.getBoundingClientRect();const style=getComputedStyle(el);
            if(!rect.width||!rect.height||rect.bottom<0||rect.top>innerHeight||rect.right<0||rect.left>innerWidth||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||el.closest('[inert],[aria-hidden="true"],[data-appearance-scope="authored"]'))continue;
            const parents=[];for(let n=el;n;n=n.parentElement)parents.unshift(n);
            let background=rgba(getComputedStyle(document.documentElement).backgroundColor).slice(0,3);let gradient=false;
            for(const n of parents){const s=getComputedStyle(n);background=blend(rgba(s.backgroundColor),background);gradient ||= s.backgroundImage!=="none";}
            const fg=blend(rgba(style.color),background);const ratio=(Math.max(lum(fg),lum(background))+.05)/(Math.min(lum(fg),lum(background))+.05);
            const text=(el.textContent||el.getAttribute("placeholder")||el.getAttribute("aria-label")||"").trim().replace(/\s+/g," ").slice(0,100);
            const sample={tag:el.tagName,text,color:style.color,background:style.backgroundColor,effectiveBackground:background,ratio:Math.round(ratio*100)/100,gradient,className:el.className};
            if(["INPUT","TEXTAREA","SELECT"].includes(el.tagName)) controls.push(sample);
            if(text&&ratio<4.5&&!gradient&&!el.hasAttribute("disabled"))low.push(sample);
          }
          return {theme:document.documentElement.dataset.theme,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,controls,lowContrast:low};
        });
        const result=await collect();
        measurements.push({screen,...result});
        assert.equal(result.theme,"general-dark");
        assert.equal(result.overflow,false,`${screen} overflows at ${width}px`);
        for(const field of result.controls)assert.ok(field.ratio>=4.5,`${screen} control contrast ${field.ratio}: ${field.text}`);
        assert.deepEqual(result.lowContrast,[],`${screen} has visible text below 4.5:1 at ${width}px`);
        if(screen==="livecard") {
          const title=page.getByLabel("Event title",{exact:true});
          await title.fill("Movie Under the Stars");
          await page.getByRole("switch",{name:"Dark mode",exact:true}).uncheck();
          assert.equal(await title.inputValue(),"Movie Under the Stars");
          await page.getByRole("switch",{name:"Dark mode",exact:true}).check();
          assert.equal(await title.inputValue(),"Movie Under the Stars");
        }
        if(screen==="gallery") {
          assert.equal(await page.locator(".nav-chrome-glass-header").first().evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
          assert.equal(await page.locator('[aria-label="envitefy"] > span').first().evaluate(el=>getComputedStyle(el).color),"rgb(255, 255, 255)");
          if(width===1440) {
            const artwork=page.locator('[data-appearance-scope="authored"]').first();
            await artwork.scrollIntoViewIfNeeded();
            await artwork.locator("img").evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
            // The app-owned favorite control overlays the authored thumbnail.
            const screenshotOptions={animations:"disabled",mask:[page.locator("[data-template-masonry-card]").first().getByRole("button")],maskColor:"#000000"};
            const before=await artwork.screenshot(screenshotOptions);
            await page.getByRole("switch",{name:"Dark mode",exact:true}).filter({visible:true}).uncheck();
            const light=await artwork.screenshot(screenshotOptions);
            await fs.writeFile(path.join(out,"authored-artwork-dark.png"),before);
            await fs.writeFile(path.join(out,"authored-artwork-light.png"),light);
            // Rounded clipping exposes app-owned surroundings inside the screenshot's
            // rectangular bounds. Preserve strict comparison of every opaque artwork
            // pixel, excluding only those corners and their one-pixel antialias edge.
            const clipping=await artwork.evaluate(element=>{
              const target=element.getBoundingClientRect();
              const shapes=[];
              for(let node=element;node;node=node.parentElement){
                const style=getComputedStyle(node);
                if(node!==element&&!/(hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`))continue;
                const rect=node.getBoundingClientRect();
                const radius=value=>{
                  const [x,y=x]=value.split(" ");
                  const resolve=(token,size)=>parseFloat(token)*(token.endsWith("%")?size/100:1);
                  return {x:resolve(x,rect.width),y:resolve(y,rect.height)};
                };
                shapes.push({left:rect.left-target.left,top:rect.top-target.top,width:rect.width,height:rect.height,radii:[style.borderTopLeftRadius,style.borderTopRightRadius,style.borderBottomRightRadius,style.borderBottomLeftRadius].map(radius)});
              }
              return {offsetX:target.left-Math.floor(target.left),offsetY:target.top-Math.floor(target.top),shapes};
            });
            const screenshotSize=await sharp(before).metadata();
            await fs.writeFile(path.join(out,"authored-artwork-clipping.json"),JSON.stringify(clipping,null,2));
            const contentPixels=async buffer=>{
              const {data,info}=await sharp(buffer).raw().toBuffer({resolveWithObject:true});
              assert.equal(info.width,screenshotSize.width,"appearance must preserve artwork width");
              assert.equal(info.height,screenshotSize.height,"appearance must preserve artwork height");
              const bytes=[];
              for(let y=1;y<info.height-1;y++)for(let x=1;x<info.width-1;x++){
                const px=x+.5-clipping.offsetX,py=y+.5-clipping.offsetY;
                const opaque=clipping.shapes.every(shape=>{
                  const right=shape.left+shape.width,bottom=shape.top+shape.height;
                  return shape.radii.every((radius,index)=>{
                    if(radius.x<=1||radius.y<=1)return true;
                    const leftSide=index===0||index===3,topSide=index<2;
                    const cx=leftSide?shape.left+radius.x:right-radius.x,cy=topSide?shape.top+radius.y:bottom-radius.y;
                    if((leftSide?px>=cx:px<=cx)||(topSide?py>=cy:py<=cy))return true;
                    return ((px-cx)/(radius.x-1))**2+((py-cy)/(radius.y-1))**2<=1;
                  });
                });
                if(opaque)for(let channel=0;channel<info.channels;channel++)bytes.push(data[(y*info.width+x)*info.channels+channel]);
              }
              assert.ok(bytes.length>data.length*.9,"strict comparison must retain over 90% of artwork pixels");
              return Buffer.from(bytes);
            };
            const authoredPixels=await contentPixels(before);
            assert.ok(authoredPixels.equals(await contentPixels(light)),"real gallery artwork must retain its authored pixels when app appearance changes");
            await page.getByRole("switch",{name:"Dark mode",exact:true}).filter({visible:true}).check();
            assert.ok(authoredPixels.equals(await contentPixels(await artwork.screenshot(screenshotOptions))),"restoring dark must retain authored artwork");
          }
          if(width===390) {
            await page.getByRole("button",{name:"Open navigation",exact:true}).click();
            const menu=page.getByRole("dialog",{name:"Hero navigation",exact:true});
            await menu.waitFor();
            await page.waitForFunction(()=>getComputedStyle(document.getElementById("hero-top-nav-mobile")).opacity==="1");
            assert.equal(await page.locator("#hero-top-nav-mobile").evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
            await menu.screenshot({path:path.join(out,"gallery-mobile-navigation-dark.png")});
            const selector=menu.getByRole("group",{name:"Appearance",exact:true});
            await selector.getByRole("switch",{name:"Dark mode",exact:true}).uncheck();
            await selector.getByRole("switch",{name:"Dark mode",exact:true}).check();
            await menu.getByRole("button",{name:"Close navigation",exact:true}).click();
          }
        }
        if(screen==="landing") {
          const footer=page.locator("footer").last();
          await footer.scrollIntoViewIfNeeded();
          const social=footer.getByRole("navigation",{name:"Follow Envitefy",exact:true});
          await social.waitFor();
          assert.equal(await footer.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)","dark marketing footer must support the white wordmark and social glyphs");
          const visible=await social.locator("img").evaluateAll(images=>images.filter(img=>img.checkVisibility()).map(img=>({src:img.getAttribute("src"),loaded:img.complete&&img.naturalWidth>0})));
          assert.equal(visible.length,5);
          assert.ok(visible.every(img=>img.src.startsWith("/email/white-v1/")&&img.loaded),"dark website footer uses all five loaded white icon assets");
          assert.equal(await footer.getByRole("heading",{name:"Create",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(242, 234, 250)");
          await footer.screenshot({path:path.join(out,`landing-footer-dark-${width}.png`)});
          if(width===1440) {
            await page.getByRole("button",{name:"Open Envitefy Concierge",exact:true}).click();
          } else {
            await page.getByRole("button",{name:"Open the signed-out mobile menu.",exact:true}).click();
            const sheet=page.getByRole("dialog",{name:"Menu",exact:true});
            await sheet.waitFor();
            assert.equal(await sheet.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
            await sheet.getByRole("switch",{name:"Dark mode",exact:true}).check();
            assert.ok((await sheet.getByRole("img",{name:"Envitefy",exact:true}).getAttribute("src")).includes("/brand/white-v1/"));
            await sheet.screenshot({path:path.join(out,"signed-out-mobile-menu-dark.png")});
            await sheet.getByRole("button",{name:"Close menu",exact:true}).click();
            await page.getByRole("button",{name:"Open signed-out creation choices.",exact:true}).click();
            const choices=page.getByRole("dialog",{name:"Create options",exact:true});
            await choices.waitFor();
            assert.equal(await choices.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
            await choices.screenshot({path:path.join(out,"signed-out-create-options-dark.png")});
            await choices.getByRole("button",{name:"Close create options",exact:true}).click();
            await page.getByRole("button",{name:"Answer questions about Envitefy for signed-out visitors.",exact:true}).click();
          }
          const concierge=page.getByRole("dialog",{name:"Envitefy Concierge",exact:true});
          await concierge.waitFor();
          assert.equal(await concierge.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
          assert.equal(await concierge.locator('[style*="mask"]').first().evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(255, 255, 255)","the Concierge brand mark is plain white in dark UI");
          await concierge.screenshot({path:path.join(out,`concierge-dark-${width}.png`)});
        }
        if(screen==="settings") {
          for(const card of await page.locator("[data-settings-surface]:visible").all()) assert.equal(await card.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
          await page.getByRole("navigation",{name:"Settings sections",exact:true}).getByRole("button",{name:/^Calendars/}).click();
          await page.getByRole("heading",{name:"Calendars",exact:true}).waitFor();
          await page.screenshot({path:path.join(out,`settings-calendars-dark-${width}.png`)});
          const calendars=await collect();
          measurements.push({screen:"settings-calendars",...calendars});
          assert.deepEqual(calendars.lowContrast,[],`Settings calendar text must retain4.5:1 contrast at ${width}px`);
          const calendarCards=page.locator("[data-settings-surface]:visible");
          assert.equal(await calendarCards.count(),3,"Google, Apple and Outlook cards all expose the themed settings surface");
          for(const card of await calendarCards.all()) assert.equal(await card.evaluate(el=>getComputedStyle(el).backgroundColor),"rgb(37, 31, 45)");
        }
        if(screen==="install") {
          const install=page.getByRole("button",{name:"Install",exact:true});
          assert.deepEqual(await install.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:"rgb(197, 167, 255)",color:"rgb(37, 16, 62)"});
          assert.ok((await page.getByRole("img",{name:"Envitefy",exact:true}).filter({visible:true}).getAttribute("src")).includes("/brand/white-v1/e-only.png"));
        }
      }
    }
    await fs.writeFile(path.join(out,"computed-appearance.json"),JSON.stringify(measurements,null,2));
    assert.deepEqual(errors,[]);
    await context.close();
  } finally {await browser.close();}
});
