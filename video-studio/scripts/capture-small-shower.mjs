import fs from 'node:fs/promises';import {chromium} from '../../node_modules/playwright/index.mjs';
const p='projects/small-shower',out='out/small-shower',pub='public/projects/small-shower';const {draft,invitationData}=JSON.parse(await fs.readFile(p+'/demo-data.json','utf8'));
const {GET:calendarGet}=await import('../out/small-shower/ics.cjs');const browser=await chromium.launch({headless:true});const inspect=process.argv.includes('--inspect');
try{
 const ctx=await browser.newContext({viewport:{width:430,height:800},deviceScaleFactor:2,timezoneId:'America/Chicago',permissions:['clipboard-read','clipboard-write'],recordVideo:inspect?undefined:{dir:out+'/capture',size:{width:430,height:800}},acceptDownloads:true});
 const actions=[];let ready=false;
 const messages=[{id:'a',role:'user',text:'A sage-and-cream baby shower with teddy bears.'},{id:'b',role:'assistant',text:'Lovely! Who are we celebrating, and when?'},{id:'c',role:'user',text:'Maya. October 17, 2–5 PM at The Garden Room, Austin. Add RSVP and my gift list.'},{id:'d',role:'assistant',text:'Maya’s baby shower invitation is ready. Check the details in Preview.'}];
 await ctx.route('https://envitefy.com/**',async route=>{
  const u=new URL(route.request().url());
  const local={'/shower-art.webp':pub+'/invitation.webp','/demo.js':out+'/demo.js','/app.css':out+'/app.css'};
  if(local[u.pathname])return route.fulfill({body:await fs.readFile(local[u.pathname]),contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'image/webp'});
  if(u.pathname.startsWith('/fonts/'))return route.fulfill({body:await fs.readFile('../public'+decodeURIComponent(u.pathname))});if(u.pathname.startsWith('/_next/static/media/'))return route.fulfill({body:await fs.readFile('../.next-dev/static/media/'+u.pathname.split('/').pop())});
  if(u.pathname==='/chat'||u.pathname==='/card/mayas-baby-shower')return route.fulfill({contentType:'text/html',body:await fs.readFile(out+'/demo.html')});
  if(u.pathname==='/api/creation/intake')return route.fulfill({json:{ok:true,draft,creationSession:{id:'demo-maya-thread',status:'preview_ready',metadata:{}},studioInvite:{imageUrl:'/shower-art.webp',invitationData},savedEventId:null,assistantMessage:messages[3].text,suggestedReplies:[],canSave:true,chatMessages:messages}});
  if(u.pathname.includes('/rsvp')){if(route.request().method()==='POST')actions.push({action:'rsvp',demoOnly:true,body:route.request().postDataJSON()});return route.fulfill({json:{ok:true,total:0,responses:[]}});}
  if(u.pathname==='/api/ics'){const res=await calendarGet(new Request(u.href));return route.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:await res.text()});}if(u.pathname.startsWith('/api/calendar')){const response=await ctx.request.get('http://localhost:3000'+u.pathname+u.search);return route.fulfill({response});}
  if(u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
  return route.abort();
 });
 await ctx.route('https://www.babylist.com/**',route=>route.abort());
 const page=await ctx.newPage();page.on('pageerror',e=>console.log('Page error:',e.message));const marks={};const origin=Date.now();const mark=n=>marks[n]=(Date.now()-origin)/1000;
 async function shot(n){await page.screenshot({path:pub+`/demo-${n}.png`});}
 async function tap(l){const b=await l.boundingBox();if(!b)throw Error('Missing tap');await page.evaluate(({x,y})=>{const c=document.createElement('div');c.id='demo-tap';c.style.cssText=`position:fixed;left:${x-15}px;top:${y-15}px;width:30px;height:30px;border:2px solid #687b60;border-radius:50%;background:#a3bc9477;z-index:999999;pointer-events:none`;document.body.append(c);},{x:b.x+b.width/2,y:b.y+b.height/2});await page.waitForTimeout(150);await l.click();await page.waitForTimeout(170);await page.evaluate(()=>document.getElementById('demo-tap')?.remove());}
 async function close(){await page.getByRole('button',{name:'Close card details',exact:true}).click();await page.waitForTimeout(250);}
 await page.goto('https://envitefy.com/chat?view=chat&thread=demo-maya-ready',{waitUntil:'networkidle',timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 if(inspect){console.log('CHAT:',(await page.locator('body').innerText()).slice(0,7000));await shot('chat-inspect');await page.goto('https://envitefy.com/card/mayas-baby-shower',{waitUntil:'networkidle'});await page.waitForTimeout(500);console.log('CARD:',await page.locator('body').innerText());await shot('card-inspect');await tap(page.getByRole('button',{name:'Registry',exact:true}));await shot('gift-inspect');console.log('GIFT:',await page.locator('body').innerText());await ctx.close();process.exit(0);}
 await page.getByRole('button',{name:'Chat',exact:true}).click();await page.waitForTimeout(500);mark('chat');await shot('chat');await page.waitForTimeout(2600);mark('chatEnd');
 await page.goto('https://envitefy.com/card/mayas-baby-shower',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);mark('card');await shot('card');await page.waitForTimeout(2000);mark('cardEnd');
 mark('details');await tap(page.getByRole('button',{name:'Overview',exact:true}));await page.waitForTimeout(550);await shot('details');await page.waitForTimeout(1400);mark('detailsEnd');await close();
 mark('share');await tap(page.getByRole('button',{name:'Share live card',exact:true}));await page.waitForTimeout(350);actions.push({action:'share',clipboard:await page.evaluate(()=>navigator.clipboard.readText())});await shot('share');await page.waitForTimeout(1300);mark('shareEnd');
 mark('rsvp');await tap(page.getByRole('button',{name:'RSVP',exact:true}));await page.waitForTimeout(250);await tap(page.getByRole('button',{name:'Yes',exact:true}));await page.getByPlaceholder('Name',{exact:true}).fill('Alex Morgan');await page.getByPlaceholder('Email',{exact:true}).fill('shower-guest@envitefy.com');await page.waitForTimeout(150);await shot('rsvp');await tap(page.getByRole('button',{name:'Send RSVP',exact:true}));await page.waitForTimeout(850);await shot('confirmed');mark('rsvpEnd');await close();
 mark('gift');await tap(page.getByRole('button',{name:'Registry',exact:true}));await page.waitForTimeout(450);await shot('gift');await page.waitForTimeout(1600);mark('giftEnd');await close();
 mark('calendar');await tap(page.getByRole('button',{name:'Calendar',exact:true}));await page.waitForTimeout(350);await shot('calendar');console.log('CALENDAR:',await page.locator('body').innerText());
 const download=page.waitForEvent('download',{timeout:8000}).catch(()=>null);await tap(page.getByRole('button',{name:'Open in Apple Calendar',exact:true}));const file=await download;if(file){await file.saveAs(out+'/maya-baby-shower.ics');actions.push({action:'calendar',file:out+'/maya-baby-shower.ics'});}await page.waitForTimeout(750);mark('calendarEnd');await close();
 mark('directions');await tap(page.getByRole('button',{name:'Location',exact:true}));await page.waitForTimeout(350);await shot('directions');console.log('LOCATION:',await page.locator('body').innerText());await page.waitForTimeout(1400);mark('directionsEnd');
 const video=await page.video().path();await ctx.close();await fs.writeFile(p+'/capture-timing.json',JSON.stringify({video,...marks},null,2));await fs.writeFile(p+'/captured-actions.json',JSON.stringify(actions,null,2));console.log(JSON.stringify({video,...marks}));
}finally{await browser.close();}






