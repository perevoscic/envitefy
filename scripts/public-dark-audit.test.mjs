import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {execSync} from "node:child_process";
import test from "node:test";
import {chromium} from "playwright";
import sharp from "sharp";

const out=path.resolve("output/public-dark-audit");
const guides=["pdf-to-event-page","flyer-to-event-page","live-card-invitations","rsvp-event-page","gymnastics-meet-page","share-event-page-without-app","smart-signup-forms","wedding-event-page","birthday-rsvp-invitation","registry-invitation-page"];
const routes=[...['about','contact','faq','guides','how-it-works','privacy','terms','forgot','reset','verify-request','birthdays','weddings','sports','gymnastics','snap'].map(screen=>({id:screen,url:`/${screen}?screen=${screen}`})),...guides.map(slug=>({id:`guide-${slug}`,url:`/guides/${slug}?screen=guide&slug=${slug}`})),...['baby-showers','bridal-showers','gender-reveal','signup-forms'].map(slug=>({id:slug,url:`/${slug}?screen=category&path=/${slug}`})),{id:'unsubscribe-invalid',url:'/unsubscribe?screen=unsubscribe'},{id:'unsubscribe-valid',url:'/unsubscribe?screen=unsubscribe&token=valid'}];

test("public marketing, help and account pages retain dark app surfaces and readable content",{timeout:240000},async()=>{
  if(!process.env.PUBLIC_DARK_AUDIT_SKIP_BUILD)execSync("bun scripts/build-public-dark-audit.mjs",{timeout:60000,stdio:"pipe"});
  const [bundle,globalCss,moduleCss,bootstrap]=await Promise.all(['entry.js','global.css','entry.css','bootstrap.js'].map(name=>fs.readFile(path.join(out,name),'utf8')));
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  const results=[],errors=[];
  try{
    const context=await browser.newContext({colorScheme:'dark',reducedMotion:'reduce'});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.hostname!=='public.test')return route.abort();
      if(url.pathname==='/entry.js')return route.fulfill({contentType:'application/javascript',body:bundle});
      if(url.pathname.startsWith('/api/'))return route.fulfill({json:{items:[],events:[],data:[],ok:true}});
      if(/\.(png|jpe?g|webp|svg|woff2?|ttf|otf)$/.test(url.pathname)){
        const file=path.resolve('public',`.${url.pathname}`);if(!file.startsWith(path.resolve('public')+path.sep))return route.abort();
        try{return route.fulfill({body:await fs.readFile(file),contentType:url.pathname.endsWith('.svg')?'image/svg+xml':undefined});}catch{return route.fulfill({status:404,body:''});}
      }
      return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${moduleCss}\n${globalCss}</style><script>${bootstrap}</script></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const route of routes.filter(route=>!process.env.PUBLIC_DARK_AUDIT_ROUTES||process.env.PUBLIC_DARK_AUDIT_ROUTES.split(',').includes(route.id))){
      for(const width of [1440,390]){
        await page.setViewportSize({width,height:1000});
        await page.goto(`https://public.test${route.url}`);
        await page.locator('main').first().waitFor({timeout:10000});
        await page.evaluate(()=>document.fonts.ready);
        await page.locator('img').evaluateAll(images=>Promise.all(images.filter(img=>img.getBoundingClientRect().top<innerHeight).map(img=>img.decode().catch(()=>{}))));
        await page.screenshot({path:path.join(out,`${route.id}-${width}.png`),animations:'disabled'});
        // Audit the whole rendered document, including content below the fold.
        const result=await page.evaluate(()=>{
          const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
          const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
          const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]/255+b[i]*(1-a[3]/255));
          const lum=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
          const low=[],pale=[],gradients=[];
          for(const el of document.querySelectorAll('main,main *,[data-public-appearance] *')){
            const r=el.getBoundingClientRect(),s=getComputedStyle(el);
            if(!r.width||!r.height||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||el.closest('[inert],[aria-hidden="true"],[data-appearance-scope="authored"]'))continue;
            const directText=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
            const text=(directText||el.getAttribute('placeholder')||'').replace(/\s+/g,' ').slice(0,100);
            const sample={tag:el.tagName,text,className:typeof el.className==='string'?el.className:'',color:s.color,background:s.backgroundColor,image:s.backgroundImage};
            const own=rgba(s.backgroundColor);
            if(r.width*r.height>2000&&own[3]>100&&lum(own.slice(0,3))>.40&&!el.matches('button,a,[data-public-primary]'))pale.push(sample);
            if(s.backgroundImage!=='none'&&r.width*r.height>10000&&!el.matches('img,video')&&!el.classList.contains('bg-clip-text'))gradients.push(sample);
            if(!text)continue;
            const parents=[];for(let n=el;n;n=n.parentElement)parents.unshift(n);
            let bg=rgba(getComputedStyle(document.documentElement).backgroundColor).slice(0,3),hasGradient=false;
            for(const n of parents){const st=getComputedStyle(n);bg=blend(rgba(st.backgroundColor),bg);hasGradient ||= st.backgroundImage!=='none';}
            if(hasGradient)continue;
            const fg=blend(rgba(s.color),bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
            const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
            if(ratio<(large?3:4.5)&&!el.hasAttribute('disabled'))low.push({...sample,ratio:Math.round(ratio*100)/100});
          }
          return {theme:document.documentElement.dataset.theme,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,pale,gradients,low};
        });
        results.push({route:route.id,...result});
        if(['about','contact','guides','birthdays','weddings','sports','gymnastics','snap'].includes(route.id)) {
          await page.evaluate(()=>scrollTo(0,Math.max(0,(document.documentElement.scrollHeight-innerHeight)/2)));
          await page.screenshot({path:path.join(out,`${route.id}-${width}-middle.png`),animations:'disabled'});
        }
        if(route.id==='weddings'&&width===1440){
          const sample=page.locator('[data-appearance-scope="authored"][class*="h-56"]').first();
          await sample.scrollIntoViewIfNeeded();
          // The promotional badge is app UI; the rounded perimeter blends with
          // the surrounding page. Compare the original invitation interior.
          const pixels=async buffer=>{const image=sharp(buffer),size=await image.metadata();return image.extract({left:30,top:30,width:size.width-60,height:size.height-60}).raw().toBuffer();};
          const screenshotOptions={animations:'disabled',mask:[page.getByText('Most Popular',{exact:true})],maskColor:'#000000'};
          const dark=await sample.screenshot(screenshotOptions);
          await page.getByRole('radio',{name:'Light',exact:true}).first().check({force:true});
          const light=await sample.screenshot(screenshotOptions);
          await fs.writeFile(path.join(out,'wedding-authored-dark.png'),dark);
          await fs.writeFile(path.join(out,'wedding-authored-light.png'),light);
          assert.ok((await pixels(dark)).equals(await pixels(light)),'App appearance preserves the authored wedding suite pixels');
          await page.getByRole('radio',{name:'Dark',exact:true}).first().check({force:true});
        }
      }
    }
    await fs.writeFile(path.join(out,'computed.json'),JSON.stringify({results,errors},null,2));
    assert.deepEqual(errors,[]);
    if(!process.env.PUBLIC_DARK_AUDIT_RECORD_ONLY){
      assert.deepEqual(results.filter(r=>r.overflow).map(r=>({route:r.route,width:r.width})),[],'No route should overflow horizontally');
      assert.deepEqual(results.filter(r=>r.pale.length||r.low.length).map(r=>({route:r.route,width:r.width,pale:r.pale,low:r.low})),[],'App surfaces must stay dark and legible');
    }
    await context.close();
  }finally{await browser.close();}
});
