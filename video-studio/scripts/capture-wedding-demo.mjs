import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const project='projects/wedding-200-texts', out='public/projects/wedding-200-texts';
await fs.mkdir(project+'/capture',{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({viewport:{width:430,height:760},deviceScaleFactor:1,permissions:['clipboard-read','clipboard-write'],recordVideo:{dir:project+'/capture',size:{width:430,height:760}}});
 let html=await fs.readFile(project+'/showcase-remote.html','utf8');
 const marker='\\"rsvpContact\\":\\"garden-vows@example.com\\"';
 if(!html.includes(marker))throw new Error('Fixture marker missing');
 html=html.replaceAll(marker,marker+',\\"eventId\\":\\"demo-wedding-200-texts\\",\\"rsvpEnabled\\":true,\\"rsvpMode\\":\\"envitefy\\"');
 html=html.replaceAll('garden-vows@example.com','wedding-demo@envitefy.com');
 const intercepted=[];
 // One route handles all network traffic: no external writes can leave this context.
 await context.route('**/*',async route=>{
  const request=route.request(), url=new URL(request.url());
  if(url.pathname==='/api/events/demo-wedding-200-texts/rsvp'){
   intercepted.push({demoOnly:true,method:request.method(),path:url.pathname});
   await fs.writeFile(project+'/demo-response.json',JSON.stringify({demoOnly:true,neverSentToServer:true,...request.postDataJSON()},null,2));
   await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});return;
  }
  if(!['GET','HEAD'].includes(request.method())){
   intercepted.push({blocked:true,method:request.method(),path:url.pathname});
   await route.abort();return;
  }
  if(url.href==='https://envitefy.com/showcase/garden-vows'){
   await route.fulfill({status:200,contentType:'text/html',body:html});return;
  }
  if(url.pathname==='/api/ics'){
   const response=await route.fetch();
   await fs.writeFile(project+'/wedding-invitation.ics',await response.body());
   await route.fulfill({response});return;
  }
  await route.continue();
 });
 const page=await context.newPage();const origin=Date.now(),marks={};
 await page.goto('https://envitefy.com/showcase/garden-vows',{waitUntil:'networkidle',timeout:60000});
 const consent=page.getByRole('button',{name:'Use necessary only',exact:true});if(await consent.isVisible())await consent.click();
 await page.evaluate(()=>document.fonts.ready);
 await page.getByRole('button',{name:'RSVP',exact:true}).waitFor({timeout:30000});
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.evaluate(()=>{const c=document.createElement('div');c.id='demo-tap';c.style.cssText='position:fixed;width:34px;height:34px;border:3px solid #8b5cf6;background:#c4b5fd77;border-radius:50%;pointer-events:none;z-index:99999;display:none;transform:translate(-50%,-50%)';document.body.appendChild(c);});
 async function tap(locator){const b=await locator.boundingBox();if(!b)throw new Error('Missing tap target');await page.evaluate(({x,y})=>{const c=document.getElementById('demo-tap');c.style.left=x+'px';c.style.top=y+'px';c.style.display='block';},{x:b.x+b.width/2,y:b.y+b.height/2});await page.waitForTimeout(120);await locator.click();await page.waitForTimeout(130);await page.evaluate(()=>document.getElementById('demo-tap').style.display='none');}
 await page.waitForTimeout(700);marks.details=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-details.png'});await page.waitForTimeout(850);
 marks.share=(Date.now()-origin)/1000;await tap(page.getByRole('button',{name:'Share live card',exact:true}));await page.waitForTimeout(1700);
 const clipboard=await page.evaluate(()=>navigator.clipboard.readText());if(clipboard!=='https://envitefy.com/showcase/garden-vows')throw new Error('Unexpected shared URL');
 await fs.writeFile(project+'/share-verification.json',JSON.stringify({url:clipboard},null,2));
 await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(400);
 await page.getByRole('button',{name:'Yes',exact:true}).click();
 await page.getByPlaceholder('Name',{exact:true}).fill('Alex Morgan');await page.getByPlaceholder('Email',{exact:true}).fill('wedding-guest@envitefy.com');
 await page.waitForTimeout(450);marks.rsvp=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-rsvp.png'});await page.waitForTimeout(350);
 await tap(page.getByRole('button',{name:'Yes',exact:true}));await page.waitForTimeout(300);
 marks.submit=(Date.now()-origin)/1000;await tap(page.getByRole('button',{name:'Send RSVP',exact:true}));
 await page.getByText('Thank you for RSVP-ing.',{exact:true}).waitFor();marks.confirmed=(Date.now()-origin)/1000;
 await page.screenshot({path:out+'/demo-confirmed.png'});await page.waitForTimeout(2200);
 await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(450);
 marks.calendar=(Date.now()-origin)/1000;await tap(page.getByRole('button',{name:'Calendar',exact:true}));await page.waitForTimeout(650);
 await page.screenshot({path:out+'/demo-calendar.png'});marks.calendarTap=(Date.now()-origin)/1000;
 await tap(page.getByRole('button',{name:'Open in Apple Calendar',exact:true}));
 for(let i=0;i<30;i++){if(await fs.stat(project+'/wedding-invitation.ics').catch(()=>null))break;await page.waitForTimeout(200);}
 const ics=await fs.readFile(project+'/wedding-invitation.ics','utf8');if(!ics.includes('BEGIN:VEVENT'))throw new Error('Invalid ICS');
 marks.downloaded=(Date.now()-origin)/1000;await page.waitForTimeout(2100);
 marks.end=(Date.now()-origin)/1000;const videoPath=await page.video().path();await context.close();
 await fs.writeFile(project+'/capture-timing.json',JSON.stringify({videoPath,...marks},null,2));
 await fs.writeFile(project+'/capture-network-safety.json',JSON.stringify({allExternalWritesBlocked:true,intercepted},null,2));console.log(marks);
}finally{await browser.close();}
