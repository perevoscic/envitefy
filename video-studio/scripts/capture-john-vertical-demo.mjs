import fs from 'node:fs/promises';import {chromium} from '../../node_modules/playwright/index.mjs';
const p='projects/john-space-disco',out='out/john-space-disco',pub='public/projects/john-space-disco';
const {draft,invitationData}=JSON.parse(await fs.readFile(p+'/demo-data.json','utf8'));
const inspect=process.argv.includes('--inspect');const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({viewport:{width:430,height:800},deviceScaleFactor:2,timezoneId:'America/Chicago',permissions:['clipboard-read','clipboard-write'],recordVideo:inspect?undefined:{dir:out+'/vertical-capture',size:{width:430,height:800}}});
 let updated=false;const actions=[];
 await ctx.route('https://envitefy.com/**',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/john-card.webp')return route.fulfill({contentType:'image/webp',body:await fs.readFile(pub+'/card-art-vertical.webp')});
  if(u.pathname==='/john-demo.js')return route.fulfill({contentType:'text/javascript',body:await fs.readFile(out+'/vertical-demo.js')});
  if(u.pathname==='/john-app.css')return route.fulfill({contentType:'text/css',body:await fs.readFile(out+'/vertical-app.css')});
  if(u.pathname.startsWith('/fonts/')||u.pathname.startsWith('/_next/static/media/')){const response=await ctx.request.get('http://localhost:3000'+u.pathname);return route.fulfill({response});}
  if(u.pathname==='/card/john-is-10'||u.pathname==='/chat'){
   let html=await fs.readFile(out+'/vertical-demo.html','utf8');if(updated)html=html.replaceAll('14:00','15:00').replaceAll('2:00 PM','3:00 PM');
   return route.fulfill({contentType:'text/html',body:html});
  }
  if(u.pathname==='/api/creation/intake'){
   const mode=u.searchParams.get('threadId')||'';const isReady=!mode.includes('ideas');const d=updated?{...draft,startISO:'2026-10-17T15:00:00-05:00',timeText:'3:00 PM'}:draft;
   return route.fulfill({json:{ok:true,draft:d,creationSession:{id:'demo-john-thread',status:'preview_ready'},studioInvite:isReady?{imageUrl:'/john-card.webp',invitationData}:null,savedEventId:mode.includes('edit')?'demo-john-is-10':null,assistantMessage:'Your space dinosaur disco invitation is ready.',suggestedReplies:[],canSave:true,chatMessages:[{id:'a',role:'user',text:'John is turning 10! Space dinosaurs, dancing stars and a DISCO.'},{id:'b',role:'assistant',text:'Let’s bring John’s imagination to life. What are the party details?'},{id:'c',role:'user',text:'October 17, 2:00 PM, Zilker Park. Yes to RSVP and a gift list.'},{id:'d',role:'assistant',text:'Perfect! John’s birthday Live Card is ready to preview.'}]}});
  }
  if(u.pathname==='/api/concierge/events/demo-john-is-10/message'){updated=true;actions.push({action:'edit',body:route.request().postDataJSON()});return route.fulfill({json:{ok:true,event:{id:'demo-john-is-10',title:'John is 10',data:{...draft,startISO:'2026-10-17T15:00:00-05:00',startAt:'2026-10-17T15:00:00-05:00',studio:{imageUrl:'/john-card.webp',invitationData:{...invitationData,eventDetails:{...invitationData.eventDetails,startTime:'15:00'}}}}},assets:[],assistantMessage:'Updated! The party starts at 3:00 PM. Your shared link stays the same.',actions:[],suggestedReplies:[]}});}
  if(u.pathname.includes('/rsvp')){if(route.request().method()==='POST')actions.push({action:'rsvp',demoOnly:true,body:route.request().postDataJSON()});return route.fulfill({json:{ok:true,total:0,responses:[]}});}
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
  return route.abort();
 });
 const origin=Date.now(); const page=await ctx.newPage();page.on('pageerror',e=>console.log('Page error:',e.message));
 await page.goto('https://envitefy.com/card/john-is-10',{waitUntil:'networkidle',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 if(inspect){console.log((await page.locator('body').innerText()).slice(0,6500));await page.screenshot({path:out+'/vertical-inspect-card.png'});await page.goto('https://envitefy.com/chat?view=chat&thread=demo-john-ready',{waitUntil:'networkidle'});await page.waitForTimeout(1200);console.log('CHAT:',(await page.locator('body').innerText()).slice(0,8000));await page.screenshot({path:out+'/vertical-inspect-chat.png'});await ctx.close();await browser.close();process.exit(0);}
 const marks={};const mark=n=>marks[n]=(Date.now()-origin)/1000;
 async function shot(n){await page.screenshot({path:pub+`/demo-${n}.png`});}
 async function tap(locator){const b=await locator.boundingBox();if(!b)throw Error('Missing target');await page.evaluate(({x,y})=>{let c=document.getElementById('demo-tap');if(!c){c=document.createElement('div');c.id='demo-tap';document.body.appendChild(c);}c.style.cssText=`position:fixed;left:${x-18}px;top:${y-18}px;width:36px;height:36px;border:3px solid #9f7aff;border-radius:50%;background:#b799ff66;z-index:999999;pointer-events:none`;},{x:b.x+b.width/2,y:b.y+b.height/2});await page.waitForTimeout(150);await locator.click();await page.waitForTimeout(180);await page.evaluate(()=>document.getElementById('demo-tap')?.remove());}
 mark('card');await shot('card');await page.waitForTimeout(1000);
 await tap(page.getByRole('button',{name:'RSVP',exact:true}));await page.waitForTimeout(350);await tap(page.getByRole('button',{name:'Yes',exact:true}));await page.getByPlaceholder('Name',{exact:true}).fill('Alex Morgan');await page.getByPlaceholder('Email',{exact:true}).fill('birthday-guest@envitefy.com');await page.waitForTimeout(300);mark('rsvp');await shot('rsvp');await page.waitForTimeout(500);await tap(page.getByRole('button',{name:'Send RSVP',exact:true}));await page.waitForTimeout(650);await shot('confirmed');await page.waitForTimeout(800);
 await page.getByRole('button',{name:'Close card details',exact:true}).click();await page.waitForTimeout(350);mark('gift');await tap(page.getByRole('button',{name:'Gift List',exact:true}));await page.waitForTimeout(550);await shot('gift');console.log('Gift:',await page.locator('body').innerText());await page.waitForTimeout(1500);
 await page.getByRole('button',{name:'Close card details',exact:true}).click();await page.waitForTimeout(350);mark('directions');await tap(page.getByRole('button',{name:'Location',exact:true}));await page.waitForTimeout(550);await shot('directions');console.log('Directions:',await page.locator('body').innerText());await page.waitForTimeout(1500);
 await page.getByRole('button',{name:'Close card details',exact:true}).click();await page.waitForTimeout(350);mark('calendar');await tap(page.getByRole('button',{name:'Calendar',exact:true}));await page.waitForTimeout(550);await shot('calendar');console.log('Calendar:',await page.locator('body').innerText());await page.waitForTimeout(1600);
 await page.getByRole('button',{name:'Close card details',exact:true}).click();await page.waitForTimeout(250);await tap(page.getByRole('button',{name:'Overview',exact:true}));await page.waitForTimeout(550);mark('overview');await shot('overview');await page.waitForTimeout(1200);
 await page.goto('https://envitefy.com/chat?view=chat&thread=demo-john-ideas',{waitUntil:'networkidle'});await page.waitForTimeout(700);mark('ideas');await shot('ideas');await page.waitForTimeout(1800);
 await page.goto('https://envitefy.com/chat?view=chat&thread=demo-john-ready',{waitUntil:'networkidle'});await page.waitForTimeout(700);mark('preview');await shot('preview');await page.waitForTimeout(1000);await tap(page.getByRole('button',{name:'Preview',exact:true}).last());await page.waitForTimeout(750);mark('live');await shot('live');await page.waitForTimeout(1300);
 await page.goto('https://envitefy.com/chat?view=chat&thread=demo-john-edit',{waitUntil:'networkidle'});await page.waitForTimeout(700);console.log('Edit controls:',await page.locator('body').innerText());await tap(page.getByRole('button',{name:'Chat',exact:true}));await page.waitForTimeout(350);await page.locator('textarea').fill('Small change: start at 3:00 PM instead of 2:00 PM.');mark('edit');await shot('edit');await page.waitForTimeout(600);await page.locator('textarea').press('Enter');await page.waitForTimeout(750);mark('editdone');await shot('editdone');if(!updated)throw Error('Demo edit was not submitted through actual Concierge UI');
 await page.goto('https://envitefy.com/card/john-is-10',{waitUntil:'networkidle'});await page.waitForTimeout(450);mark('updated');await tap(page.getByRole('button',{name:'Overview',exact:true}));await page.waitForTimeout(550);await shot('updated');await page.waitForTimeout(2200);marks.end=(Date.now()-origin)/1000;
 await fs.writeFile(out+'/vertical-initial-marks.json',JSON.stringify(marks));
 await fs.writeFile(p+'/vertical-captured-actions.json',JSON.stringify(actions,null,2));
 const video=await page.video().path();await ctx.close();await fs.writeFile(p+'/vertical-capture-timing.json',JSON.stringify({video,origin,...marks},null,2));
}finally{await browser.close();}
