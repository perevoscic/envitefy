import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
export const p='projects/john-space-disco',out='out/john-space-disco',a='public/projects/john-space-disco';
export async function demoSession({view='card',record=false,width=600,height=860}={}){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,timezoneId:'America/Chicago',permissions:['clipboard-read','clipboard-write'],...(record?{recordVideo:{dir:out+'/capture-wide',size:{width,height}}}:{})});
 const data=JSON.parse(await fs.readFile(p+'/demo-data.json','utf8')); data.invitationData.artworkTextMode='headline_only';
 const network=[];let updated=false;
 const snapshot=(ready=true)=>({ok:true,draft:data.draft,savedEventId:null,studioInvite:ready?{imageUrl:'http://localhost:3000/john-card.webp',invitationData:data.invitationData}:null,chatMessages:[{id:'j1',role:'user',text:'John is turning 10. Space dinosaurs, dancing stars and a disco!'},{id:'j2',role:'assistant',text:'Let’s bring John’s birthday idea to life. What are the party details?'},{id:'j3',role:'user',text:'October 17 at 2:00 PM, Zilker Park. Please add RSVP and his gift list.'},{id:'j4',role:'assistant',text:'John’s Space Dino Disco invitation is ready to preview.'}]});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.pathname==='/__john.js')return route.fulfill({path:out+'/fixture.js',contentType:'application/javascript'});
  if(u.pathname==='/__john.css')return route.fulfill({path:out+'/fixture.css',contentType:'text/css'});
  if(u.pathname==='/john-card.webp')return route.fulfill({path:a+'/card-art.webp',contentType:'image/webp'});
  if(u.pathname==='/chat'||u.pathname.startsWith('/card/john-is-10')){
   let html=await fs.readFile(out+'/fixture.html','utf8');
   if(updated)html=html.replaceAll('14:00','15:00').replaceAll('2:00 PM','3:00 PM');
   return route.fulfill({body:html,contentType:'text/html'});
  }
  if(u.pathname==='/api/creation/intake'){
   if(req.method()==='GET')return route.fulfill({json:snapshot(view!=='planning')});
   const body=req.postDataJSON();network.push({method:req.method(),path:u.pathname,localFixtureOnly:true,action:body.action,message:body.message});
   if(body.message?.includes('3:00')){updated=true;data.draft.timeText='3:00 PM';data.draft.startISO='2026-10-17T15:00:00-05:00';data.draft.previewCopy.scheduleLine='Saturday, October 17 at 3:00 PM';data.invitationData.eventDetails.startTime='15:00';data.invitationData.eventDetails.calendarStartISO=data.draft.startISO;}
   await new Promise(r=>setTimeout(r,500));
   return route.fulfill({json:{...snapshot(),assistantMessage:'The party now starts at 3:00 PM. Your invitation link stays the same.'}});
  }
  if(u.pathname==='/api/creation/intake/stream'){
   const body=req.postDataJSON();network.push({method:'POST',path:u.pathname,localFixtureOnly:true,message:body.message});
   const state={...snapshot(false),assistantMessage:'John’s party details are confirmed. Your live card is ready to create.'};
   const text='event: delta\ndata: '+JSON.stringify({text:state.assistantMessage})+'\n\nevent: state\ndata: '+JSON.stringify(state)+'\n\n';
   return route.fulfill({contentType:'text/event-stream',body:text});
  }
  if(u.pathname==='/api/events/demo-john-is-10/rsvp'){
   if(req.method()==='POST')network.push({method:'POST',path:u.pathname,localFixtureOnly:true,payload:req.postDataJSON()});
   return route.fulfill({json:{ok:true,status:'saved',responses:[],counts:{yes:1,no:0,maybe:0,total:1}}});
  }
  if(u.pathname.startsWith('/api/')){network.push({path:u.pathname,method:req.method(),blockedFromRealServer:true});return route.fulfill({status:200,json:{ok:true}});}
  if(!['localhost','127.0.0.1'].includes(u.hostname)){network.push({path:u.pathname,host:u.hostname,externalNavigationBlocked:true});return route.abort();}
  if(!['GET','HEAD'].includes(req.method()))return route.abort();
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>console.log('Page error:',e.message));
 await page.goto(view==='card'?'http://localhost:3000/card/john-is-10':`http://localhost:3000/chat?view=chat&thread=john-demo`,{waitUntil:'networkidle',timeout:120000});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 return {browser,context,page,network,data,setUpdated:()=>{updated=true;}};
}
