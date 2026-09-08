import {chromium} from '../../node_modules/playwright/index.mjs';
import {encode} from '../../node_modules/next-auth/jwt/index.js';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
const dir='projects/fridge-freedom',out='out/fridge-freedom',assets='public/projects/fridge-freedom';
await fs.mkdir(out+'/capture',{recursive:true});
const browser=await chromium.launch({headless:true});
const network=[];
try{
 const context=await browser.newContext({viewport:{width:430,height:800},deviceScaleFactor:1,permissions:['clipboard-read','clipboard-write'],recordVideo:{dir:out+'/capture',size:{width:430,height:800}}});
 const token=await encode({token:{name:'Mom',email:'fridge-demo@envitefy.com',sub:'fridge-demo',userId:'fridge-demo',isAdmin:false,isAdminCheckedAt:Date.now(),primarySignupSource:'snap',productScopes:['snap'],accessMetadataCheckedAt:Date.now()},secret:process.env.AUTH_SECRET??process.env.NEXTAUTH_SECRET??'dev-build-secret',maxAge:3600});
 await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://localhost:3000'}]);
 let savedResolve;const saved=new Promise(r=>savedResolve=r);let downloadedResolve;const downloaded=new Promise(r=>downloadedResolve=r);
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.pathname==='/__fixture.js')return route.fulfill({path:out+'/fixture.js',contentType:'application/javascript'});
  if(u.pathname==='/__fixture.css')return route.fulfill({path:out+'/fixture.css',contentType:'text/css'});
  if(u.pathname==='/fridge-flyer.webp')return route.fulfill({path:assets+'/flyer.webp',contentType:'image/webp'});
  if(u.pathname.startsWith('/event/mias-8th')||u.pathname==='/__fridge_demo__')return route.fulfill({path:out+'/fixture.html',contentType:'text/html'});
  if(u.pathname==='/api/auth/session')return route.fulfill({json:{user:{name:'Mom',email:'fridge-demo@envitefy.com',id:'fridge-demo',productScopes:['snap']},expires:'2026-09-09T00:00:00Z'}});
  if(u.pathname==='/api/ocr'){
   network.push({action:'fictional OCR response',externalWrite:false});await new Promise(r=>setTimeout(r,1600));
   return route.fulfill({json:{ocrText:"Mia's 8th Birthday. October 17, 2026. 2:00 PM to 4:00 PM. Maple Park, Austin, TX.",category:'Birthdays',fieldsGuess:{title:"Mia's 8th Birthday",start:'2026-10-17T14:00:00-05:00',end:'2026-10-17T16:00:00-05:00',timeFound:true,timezone:'America/Chicago',location:'Maple Park, Austin, TX',venue:'Maple Park',description:"You're invited! Cake, games and birthday fun!"}}});
  }
  if(u.pathname==='/api/upload')return route.fulfill({json:{ok:true,eventMedia:{thumbnail:'http://localhost:3000/fridge-flyer.webp',attachment:{name:'birthday-flyer.webp',type:'image/webp',dataUrl:'http://localhost:3000/fridge-flyer.webp'}}}});
  if(u.pathname==='/api/history'&&req.method()==='POST'){
   await fs.writeFile(dir+'/saved-scan-fixture.json',JSON.stringify({demoOnly:true,neverSentToServer:true,payload:req.postDataJSON()},null,2));savedResolve();
   return route.fulfill({json:{id:'fridge-demo-event',title:"Mia's 8th Birthday",public_slug:'mias-8th-birthday'}});
  }
  if(u.pathname==='/api/events/calendar/auto')return route.fulfill({json:{status:'skipped',reason:'manual calendar demonstration'}});
  if(u.pathname==='/api/ics'){
   const response=await route.fetch();const bytes=await response.body();await fs.writeFile(dir+'/birthday.ics',bytes);downloadedResolve();return route.fulfill({response});
  }
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{ok:false,error:'Isolated demo'}});
  if(!['GET','HEAD'].includes(req.method())){network.push({blocked:req.method(),path:u.pathname});return route.abort();}
  await route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>console.log('Page error:',e.message));
 const origin=Date.now(),marks={};const mark=k=>{marks[k]=(Date.now()-origin)/1000;};
 await page.goto('http://localhost:3000/snap',{waitUntil:'networkidle',timeout:120000});
 const consent=page.getByRole('button',{name:'Essential only',exact:true});if(await consent.isVisible())await consent.click();
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 async function cursor(){await page.evaluate(()=>{if(document.getElementById('demo-tap'))return;const c=document.createElement('div');c.id='demo-tap';c.style.cssText='position:fixed;width:34px;height:34px;border:3px solid #7b4cf3;background:#b797fa55;border-radius:50%;pointer-events:none;z-index:999999;display:none;transform:translate(-50%,-50%)';document.body.appendChild(c);});}
 async function tap(loc){await cursor();const b=await loc.boundingBox();if(!b)throw Error('Missing tap target');await page.evaluate(({x,y})=>{const c=document.getElementById('demo-tap');c.style.left=x+'px';c.style.top=y+'px';c.style.display='block';},{x:b.x+b.width/2,y:b.y+b.height/2});await page.waitForTimeout(170);await loc.click();await page.waitForTimeout(140);await page.evaluate(()=>{const c=document.getElementById('demo-tap');if(c)c.style.display='none';});}
 mark('snap');await page.waitForTimeout(1200);await page.screenshot({path:out+'/demo-snap.png'});
 const choose=page.waitForEvent('filechooser');await tap(page.getByRole('button',{name:'Snap flyer',exact:true}));await (await choose).setFiles(assets+'/flyer.webp');mark('processing');
 await page.waitForTimeout(850);await page.screenshot({path:out+'/demo-processing.png'});await saved;await page.waitForTimeout(550);
 await page.goto('http://localhost:3000/__fridge_demo__',{waitUntil:'networkidle'});await page.waitForTimeout(900);mark('event');await page.screenshot({path:out+'/demo-event.png'});await page.waitForTimeout(650);
 const when=page.getByText('When',{exact:true});const whenBox=await when.boundingBox();await page.evaluate(y=>window.scrollBy(0,y-80),whenBox.y);await page.waitForTimeout(450);mark('details');await page.screenshot({path:out+'/demo-details.png'});await page.waitForTimeout(2200);
 const share=page.getByRole('button',{name:'Share event',exact:true});await share.scrollIntoViewIfNeeded();await page.waitForTimeout(400);mark('share');await tap(share);await page.waitForTimeout(500);await page.screenshot({path:out+'/demo-share.png'});
 const copied=await page.evaluate(()=>navigator.clipboard.readText());if(copied!=='https://envitefy.com/event/mias-8th-birthday')throw Error('Share verification failed');await fs.writeFile(dir+'/share-verification.json',JSON.stringify({copied,destination:'Other parent (fictional local message)',noExternalMessage:true},null,2));await page.waitForTimeout(700);
 const cal=page.getByRole('button',{name:'Save to Calendar',exact:true});await cal.scrollIntoViewIfNeeded();await page.waitForTimeout(350);mark('calendar');await tap(cal);await page.waitForTimeout(500);await page.screenshot({path:out+'/demo-calendar.png'});mark('calendarChoice');await tap(page.getByRole('button',{name:'Apple',exact:true}));await downloaded;await page.waitForTimeout(550);mark('end');
 const videoPath=await page.video().path();await fs.writeFile(dir+'/capture-timing.json',JSON.stringify({videoPath,...marks},null,2));await fs.writeFile(dir+'/capture-network.json',JSON.stringify({allExternalWritesBlocked:true,network},null,2));
 await context.close();console.log(marks);
}finally{await browser.close();}

