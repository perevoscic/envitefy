import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const project='projects/birthday-second-job',out='public/projects/birthday-second-job';
await fs.mkdir(project+'/capture',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:430,height:760},deviceScaleFactor:2,permissions:['clipboard-read','clipboard-write'],recordVideo:{dir:project+'/capture',size:{width:860,height:1520}}});
 let html=await fs.readFile(project+'/showcase-remote.html','utf8');
 const marker='\\"rsvpContact\\":\\"555-0107\\"';
 if(!html.includes(marker))throw new Error('Fixture marker missing');
 html=html.replaceAll(marker,marker+',\\"eventId\\":\\"demo-birthday-second-job\\",\\"rsvpEnabled\\":true,\\"rsvpMode\\":\\"envitefy\\"');
 await context.route('https://envitefy.com/showcase/lara-s-7th-dino-quest',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
 await context.route('**/api/events/**/rsvp',async r=>{
  if(!r.request().url().includes('/demo-birthday-second-job/'))return r.abort();
  await fs.writeFile(project+'/demo-response.json',JSON.stringify({demoOnly:true,...r.request().postDataJSON()},null,2));
  await new Promise(resolve=>setTimeout(resolve,280));
  await r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
 });
 const page=await context.newPage();const origin=Date.now();const marks={};
 await page.goto('https://envitefy.com/showcase/lara-s-7th-dino-quest',{waitUntil:'networkidle',timeout:60000});
 const consent=page.getByRole('button',{name:'Use necessary only',exact:true});if(await consent.isVisible())await consent.click();
 await page.evaluate(()=>document.fonts.ready);
 await page.getByRole('button',{name:'RSVP',exact:true}).waitFor({timeout:30000});
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.evaluate(()=>{
   const cursor=document.createElement('div');cursor.id='demo-tap';
   cursor.style.cssText='position:fixed;width:42px;height:42px;border:4px solid #8b5cf6;background:#c4b5fd77;border-radius:50%;pointer-events:none;z-index:99999;display:none;transform:translate(-50%,-50%)';
   document.body.appendChild(cursor);
 });
 async function tap(locator){const b=await locator.boundingBox();if(!b)throw new Error('Tap target missing');
  await page.evaluate(({x,y})=>{const c=document.getElementById('demo-tap');c.style.left=x+'px';c.style.top=y+'px';c.style.display='block';},{x:b.x+b.width/2,y:b.y+b.height/2});
  await page.waitForTimeout(160);await locator.click();await page.waitForTimeout(160);
  await page.evaluate(()=>document.getElementById('demo-tap').style.display='none');
 }
 console.log('Buttons',await page.getByRole('button').evaluateAll(bs=>bs.map(b=>({text:b.innerText,aria:b.getAttribute('aria-label'),title:b.getAttribute('title')}))));
 marks.share=(Date.now()-origin)/1000;
 await tap(page.getByRole('button',{name:'Share live card',exact:true}));
 await page.waitForTimeout(450);
 await page.screenshot({path:out+'/demo-share.png'});
 console.log('Clipboard',await page.evaluate(()=>navigator.clipboard.readText()));
 await page.waitForTimeout(1300);
 await tap(page.getByRole('button',{name:'RSVP',exact:true}));
 await page.waitForTimeout(350);
 await tap(page.getByRole('button',{name:'Yes',exact:true}));
 await page.getByPlaceholder('Name',{exact:true}).fill('Jamie Parker');
 await page.getByPlaceholder('Email',{exact:true}).fill('birthday-guest@envitefy.com');
 await page.waitForTimeout(250);
 marks.rsvp=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-form.png'});
 await page.waitForTimeout(700);
 await tap(page.getByRole('button',{name:'Send RSVP',exact:true}));
 await page.getByText('Thank you for RSVP-ing.',{exact:true}).waitFor();
 marks.confirmed=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-confirmed.png'});await page.waitForTimeout(2600);
 await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(450);
 marks.calendar=(Date.now()-origin)/1000;
 await tap(page.getByRole('button',{name:'Calendar',exact:true}));await page.waitForTimeout(700);
 await page.screenshot({path:out+'/demo-calendar.png'});
 let resolveDownload; const downloadPromise=new Promise(resolve=>{resolveDownload=resolve;}); await context.route('**/api/ics?*',async route=>{const response=await route.fetch();const body=await response.body();await fs.writeFile(project+'/birthday-invitation.ics',body);await route.fulfill({response});resolveDownload('birthday-invitation.ics');});
 await tap(page.getByRole('button',{name:'Open in Apple Calendar',exact:true}));
 const filename=await downloadPromise;console.log('Downloaded',filename);
 const ics=await fs.readFile(project+'/birthday-invitation.ics','utf8');if(!ics.includes('BEGIN:VEVENT'))throw new Error('Invalid ICS');
 marks.downloaded=(Date.now()-origin)/1000;
 await page.waitForTimeout(2500);
 marks.end=(Date.now()-origin)/1000;
 const videoPath=await page.video().path();await context.close();
 await fs.writeFile(project+'/capture-timing.json',JSON.stringify({videoPath,...marks},null,2));
 console.log('Captured',marks);
}finally{await browser.close();}


