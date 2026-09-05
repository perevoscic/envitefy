import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const project='projects/birthday-support', out='public/projects/birthday-support';
await fs.mkdir(project+'/capture',{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({viewport:{width:430,height:760},deviceScaleFactor:1,permissions:['clipboard-read','clipboard-write'],recordVideo:{dir:project+'/capture',size:{width:430,height:760}}});
 let html=await fs.readFile('projects/birthday-second-job/showcase-remote.html','utf8');
 const marker='\\"rsvpContact\\":\\"555-0107\\"';
 if(!html.includes(marker))throw new Error('Fixture marker missing');
 html=html.replaceAll(marker,marker+',\\"eventId\\":\\"demo-birthday-support\\",\\"rsvpEnabled\\":true,\\"rsvpMode\\":\\"envitefy\\"');
 await context.route('https://envitefy.com/showcase/lara-s-7th-dino-quest',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
 await context.route('**/api/events/**/rsvp',async r=>{
  if(!r.request().url().includes('/demo-birthday-support/'))return r.abort();
  await fs.writeFile(project+'/demo-response.json',JSON.stringify({demoOnly:true,...r.request().postDataJSON()},null,2));
  await new Promise(resolve=>setTimeout(resolve,200));
  await r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
 });
 const page=await context.newPage(); const origin=Date.now(); const marks={};
 await page.goto('https://envitefy.com/showcase/lara-s-7th-dino-quest',{waitUntil:'networkidle',timeout:60000});
 const consent=page.getByRole('button',{name:'Use necessary only',exact:true});if(await consent.isVisible())await consent.click();
 await page.evaluate(()=>document.fonts.ready);
 await page.getByRole('button',{name:'RSVP',exact:true}).waitFor({timeout:30000});
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.evaluate(()=>{const cursor=document.createElement('div');cursor.id='demo-tap';cursor.style.cssText='position:fixed;width:34px;height:34px;border:3px solid #8b5cf6;background:#c4b5fd77;border-radius:50%;pointer-events:none;z-index:99999;display:none;transform:translate(-50%,-50%)';document.body.appendChild(cursor);});
 async function tap(locator){const b=await locator.boundingBox();if(!b)throw new Error('Missing tap target');await page.evaluate(({x,y})=>{const c=document.getElementById('demo-tap');c.style.left=x+'px';c.style.top=y+'px';c.style.display='block';},{x:b.x+b.width/2,y:b.y+b.height/2});await page.waitForTimeout(120);await locator.click();await page.waitForTimeout(130);await page.evaluate(()=>document.getElementById('demo-tap').style.display='none');}
 await page.waitForTimeout(800);
 marks.details=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-details.png'});
 await page.waitForTimeout(1100);
 marks.share=(Date.now()-origin)/1000;await tap(page.getByRole('button',{name:'Share live card',exact:true}));
 await page.waitForTimeout(1500);
 const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
 if(!clipboard.startsWith('https://envitefy.com/'))throw new Error('Unexpected shared URL');
 await fs.writeFile(project+'/share-verification.json',JSON.stringify({url:clipboard},null,2));
 await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(400);await page.getByRole('button',{name:'Yes',exact:true}).click();await page.waitForTimeout(150);
 await page.getByPlaceholder('Name',{exact:true}).fill('Alex Morgan');await page.getByPlaceholder('Email',{exact:true}).fill('birthday-guest@envitefy.com');
 await page.waitForTimeout(600);marks.rsvp=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-rsvp.png'});
 await page.waitForTimeout(350);await tap(page.getByRole('button',{name:'Yes',exact:true}));
 await page.waitForTimeout(400);marks.submit=(Date.now()-origin)/1000;
 await tap(page.getByRole('button',{name:'Send RSVP',exact:true}));
 await page.getByText('Thank you for RSVP-ing.',{exact:true}).waitFor();marks.confirmed=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-confirmed.png'});await page.waitForTimeout(1800);
 await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(500);
 marks.calendar=(Date.now()-origin)/1000;await page.waitForTimeout(250);
 await tap(page.getByRole('button',{name:'Calendar',exact:true}));await page.waitForTimeout(550);
 await page.screenshot({path:out+'/demo-calendar.png'});
 let resolveDownload;const downloadPromise=new Promise(resolve=>{resolveDownload=resolve;});
 await context.route('**/api/ics?*',async route=>{const response=await route.fetch();const body=await response.body();await fs.writeFile(project+'/birthday-invitation.ics',body);await route.fulfill({response});resolveDownload();});
 marks.calendarTap=(Date.now()-origin)/1000;await tap(page.getByRole('button',{name:'Open in Apple Calendar',exact:true}));
 await Promise.race([downloadPromise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('ICS timeout')),15000))]);
 const ics=await fs.readFile(project+'/birthday-invitation.ics','utf8');if(!ics.includes('BEGIN:VEVENT'))throw new Error('Invalid ICS');
 marks.downloaded=(Date.now()-origin)/1000;await page.waitForTimeout(1900);
 marks.end=(Date.now()-origin)/1000;const videoPath=await page.video().path();await context.close();
 await fs.writeFile(project+'/capture-timing.json',JSON.stringify({videoPath,...marks},null,2));console.log(marks);
} finally {await browser.close();}

