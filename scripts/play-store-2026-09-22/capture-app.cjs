// Production React views with fictional, local-only event data. No account writes.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const ts = require('typescript');
const postcss = require('postcss');
const {chromium} = require('playwright');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'output/play-store-2026-09-22/app-screens');
fs.mkdirSync(out, {recursive:true});
const e = React.createElement;
const styles = [];
const originalLoad = Module._load;
const originalResolve = Module._resolveFilename;
const mockRouter = {push(){},replace(){},refresh(){},back(){},prefetch(){}};
const SessionContext=React.createContext({data:{user:{name:'Alex',email:'alex@example.test'}},status:'authenticated'});
Module._load = function(request,parent,isMain) {
  if(request==='lucide-react') {const file=path.join(root,'node_modules/lucide-react/dist/cjs/lucide-react.js');const mod=new Module(file,parent);mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(fs.readFileSync(file,'utf8'),file);return mod.exports;}
  if(request==='next/navigation') return {useRouter:()=>mockRouter,usePathname:()=>'/preview',useSearchParams:()=>new URLSearchParams(),useParams:()=>({})};
  if(request==='next-auth/react') return {SessionContext,useSession:()=>({data:{user:{name:'Alex',email:'alex@example.test'}},status:'authenticated'}),SessionProvider:({children})=>children};
  if(request==='next/image') return {__esModule:true,default:({src,fill,priority,quality,unoptimized,loader,...props})=>e('img',{...props,src:typeof src==='string'?src:src.src,style:{...props.style,...(fill?{position:'absolute',width:'100%',height:'100%',inset:0}:{})}})};
  if(request==='next/link') return {__esModule:true,default:({children,replace,prefetch,scroll,...props})=>e('a',props,children)};
  if(request==='framer-motion') return {useReducedMotion:()=>true,AnimatePresence:({children})=>children,motion:new Proxy({}, {get:(_,tag)=>({initial,animate,exit,transition,whileHover,whileTap,layout,viewport,whileInView,drag,dragMomentum,dragConstraints,dragElastic,onDragEnd,...props})=>e(tag,props)})};
  return originalLoad.call(this,request,parent,isMain);
};
Module._resolveFilename = function(request,parent,...rest){return originalResolve.call(this,request.startsWith('@/')?path.join(root,'src',request.slice(2)):request,parent,...rest)};
for(const ext of ['.ts','.tsx']) Module._extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,file);
Module._extensions['.css']=(mod,file)=>{
  const names={}; const prefix='shot_'+path.basename(file).replace(/\W/g,'_')+'_';
  const parsed=postcss.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.module.css')) parsed.walkRules(rule=>{
    const globals=[];
    rule.selector=rule.selector.replace(/:global\(([^)]+)\)/g,(_,v)=>`__GLOBAL_${globals.push(v)-1}__`).replace(/\.([a-zA-Z_][\w-]*)/g,(_,n)=>{names[n]=prefix+n;return '.'+prefix+n}).replace(/__GLOBAL_(\d+)__/g,(_,i)=>globals[i]);
  });
  styles.push(parsed.toString());mod.exports=names;
};
const Dashboard=require('../../src/components/dashboard/HomeOverviewDashboard.tsx').default;
const Card=require('../../src/components/studio/SharedStudioCardPage.tsx').SharedStudioCardFrame;
const Signup=require('../../src/components/smart-signup-form/SignupPageRenderer.tsx').default;
const SignupViewer=require('../../src/components/smart-signup-form/SignupViewer.tsx').default;
const Scan=require('../../src/components/ScannedInviteSkin.tsx').default;
const Wordmark=require('../../src/components/branding/EnvitefyWordmark.tsx').default;
const {createSignupAppearance}=require('../../src/lib/signup-themes.ts');
const wedding='/images/landing/live-cards/garden-vows.webp';
const brunch='/images/landing/live-cards/madeline-s-garden-brunch.webp';
const picnic='/templates/signup/photographic/church-and-community/community-picnic.webp';
const events=[
 {id:'sample-garden',title:'Ava & James · Garden Vows',startAt:'2026-10-10T16:30:00-04:00',endAt:'2026-10-10T22:00:00-04:00',locationText:'The Conservatory · Charleston, SC',status:'published',category:'wedding',coverImageUrl:wedding,ownership:'invited',createdVia:'scan',hasRsvp:true,numberOfGuests:48},
 {id:'sample-picnic',title:'Community picnic',startAt:'2026-10-17T12:00:00-05:00',endAt:null,locationText:'Oak Meadow Park',status:'published',category:'signup',coverImageUrl:picnic,ownership:'owned'},
 {id:'sample-brunch',title:'Madeline’s Garden Brunch',startAt:'2026-10-24T11:00:00-04:00',endAt:null,locationText:'Willow House · Savannah, GA',status:'published',category:'bridal_shower',coverImageUrl:brunch,ownership:'owned'},
];
const header=e('div',{className:'capture-nav'},e('span',{className:'capture-menu'},e('svg',{width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2},e('path',{d:'M4 6h16M4 12h16M4 18h16'}))),e(Wordmark,{scaled:false,className:'capture-logo'}));
const form={version:1,enabled:true,title:'Community picnic',description:'Good food. Great neighbors. Bring a little something to share.',header:{groupName:'OAK MEADOW NEIGHBORS',backgroundImage:picnic},appearance:createSignupAppearance('community-garden','church-and-community--community-picnic'),start:'2026-10-17T12:00:00',end:'2026-10-17T15:00:00',timezone:'America/Chicago',venue:'Oak Meadow Park',location:'The picnic pavilion',sections:[{id:'food',kind:'slots',purpose:'items',unitLabel:'item',title:'Bring something delicious',description:'Choose what you’d like to bring.',slots:[{id:'main',label:'Sandwiches to share',capacity:4},{id:'fruit',label:'Fresh fruit',capacity:3},{id:'drinks',label:'Drinks & lemonade',capacity:4}]},{id:'volunteers',kind:'slots',purpose:'volunteers',title:'Lend a hand',slots:[{id:'setup',label:'Set-up crew',capacity:4,startTime:'11:00',endTime:'12:00'}]}],questions:[],responses:[],availability:[{sectionId:'food',slotId:'main',confirmed:2,waitlisted:0},{sectionId:'food',slotId:'fruit',confirmed:1,waitlisted:0}],settings:{allowMultipleSlotsPerPerson:true,maxGuestsPerSignup:1,waitlistEnabled:true,lockWhenFull:false,collectPhone:false,collectEmail:true,showRemainingSpots:true,autoRemindersHoursBefore:[]}};
const views={
 dashboard:e(React.Fragment,null,header,e('div',{className:'capture-dashboard'},e(Dashboard,{viewerName:'Alex',loading:false,error:null,metricsLoading:false,onRetry(){},onForceTravel(){},enrichMeta:{hasDestination:true,hasOrigin:true},metrics:null,data:{nextEvent:events[0],snapshot:{upcomingCount7Days:3,upcomingCount30Days:8,nextEventInDays:18},upcoming:events,games:[],rsvp:null,setupHealth:{flags:[]},checklist:{source:'tasks',items:[]},drafts:{count:0,items:[]},metricsEligibility:{weatherEligible:false,travelWindowEligible:false},overview:{attention:[],conflicts:[],signups:[],unavailable:[],drafts:{count:0,items:[]},editLinks:{}}}}))),
 card:e('div',{className:'capture-card'},e(Card,{title:'Ava & James · Garden Vows',imageUrl:wedding,shareUrl:'https://envitefy.com/card/sample',fitToViewport:true,onClose(){},invitationData:{heroTextMode:'image',eventDetails:{product:'live_card',category:'Wedding',eventId:'sample-garden',rsvpEnabled:true,rsvpName:'Ava & James',rsvpContact:'ava@example.test',eventDate:'2026-10-10',startTime:'16:30',timezone:'America/New_York',venueName:'The Conservatory',location:'Charleston, SC',registryLink:'https://example.test/wish-list',detailsDescription:'Join us for our wedding celebration. Dinner and dancing to follow.'}}})),
 signup:e(Signup,{form,imageLoading:'eager'},e(SignupViewer,{eventId:'sample-picnic',initialForm:form,viewerKind:'guest'})),
 scan:e(React.Fragment,null,header,e(Scan,{title:'Ava & James · Garden Vows',categoryLabel:'Wedding',dateLabel:'Saturday, October 10, 2026',timeLabel:'4:30 PM',venueName:'The Conservatory',location:'Charleston, SC',imageUrl:wedding,previewMode:true,palette:{background:'#f8f3e8',primary:'#80623c',secondary:'#d9c59b',accent:'#80623c',text:'#332e24'},calendarLinks:{google:'#google',outlook:'#outlook',appleInline:'#apple'},detailCopy:'Dinner and dancing to follow.'})),
};
form.header.backgroundImage={name:'Community picnic',type:'image/webp',dataUrl:picnic,sizeBytes:0,width:1536,height:1024};
form.appearance.headerLayout='header-3';
form.appearance.density='compact';
form.sections[0].unitLabel='items';
Object.assign(events[0],{title:'Community picnic',startAt:'2026-09-26T12:00:00-05:00',endAt:'2026-09-26T15:00:00-05:00',locationText:'Oak Meadow Park',category:'Community',coverImageUrl:picnic,ownership:'owned',createdVia:'manual'});
Object.assign(events[1],{title:'Ava & James · Garden Vows',startAt:'2026-10-10T16:30:00-04:00',locationText:'The Conservatory · Charleston, SC',category:'Wedding',coverImageUrl:wedding,ownership:'invited'});
views.scan=e(React.Fragment,null,header,e(Scan,{title:'The Carter Housewarming',categoryLabel:'Housewarming',dateLabel:'Saturday, May 16, 2026',timeLabel:'3:00 PM',venueName:'The Carters’ new home',location:'58 Cedar Park Drive, Nashville, TN',imageUrl:'/images/landing/live-cards/the-carter-housewarming.webp',previewMode:true,palette:{background:'#f0f6fc',primary:'#33607d',secondary:'#c1d8e9',accent:'#33607d',text:'#223847'},calendarLinks:{google:'#google',outlook:'#outlook',appleInline:'#apple'},detailCopy:'Come celebrate the Carters’ new home.'}));
// Use the same overlay placement as the public shared Live Card.
views.card=e('div',{className:'capture-card'},e(Card,{title:'Ava & James · Garden Vows',imageUrl:wedding,shareUrl:'https://envitefy.com/card/sample',fitToViewport:true,actionsPlacement:'overlay',onClose(){},invitationData:{heroTextMode:'image',eventDetails:{product:'live_card',category:'Wedding',eventId:'sample-garden',rsvpEnabled:true,rsvpName:'Ava & James',rsvpContact:'ava@example.test',eventDate:'2026-10-10',startTime:'16:30',timezone:'America/New_York',venueName:'The Conservatory',location:'Charleston, SC',registryLink:'https://example.test/wish-list'}}}));
async function run(){
 const tailwindSource=fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8').replace('@import "tailwindcss";','@import "tailwindcss" source(none);\n@source "../components";');
 const utilities=(await postcss([require('@tailwindcss/postcss')()]).process(tailwindSource,{from:path.join(root,'src/app/globals.css')})).css;
 const extra=`@font-face{font-family:Inter;src:url('/fonts/birthday/inter.ttf')}html,body{margin:0;min-height:100%;font-family:Inter,Arial,sans-serif;--font-josefin-slab:'Josefin Slab'}body{background:#f8f5ff}.capture-nav{position:fixed;inset:0 0 auto;z-index:50;height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:#f4f0ff}.capture-menu{height:38px;width:38px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#513796}.capture-logo{font-size:39px}.capture-dashboard{padding:0 16px 22px}.capture-card{height:100vh;background:#171615;display:flex;align-items:center;justify-content:center}body:has(.capture-card){background:#171615}`;
 const pages={};
 for(const [name,view] of Object.entries(views))pages[name]=renderToStaticMarkup(view);
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:412,height:850},deviceScaleFactor:3,reducedMotion:'reduce'});
 const failed=[];
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='envitefy-shots.test')return route.abort();
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html></html>'});
  const file=path.resolve(root,'public','.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(path.join(root,'public')+path.sep)||!fs.existsSync(file)){failed.push(url.pathname);return route.abort();}
  return route.fulfill({path:file});
 });
 await page.goto('http://envitefy-shots.test/');
 const results=[];
 for(const [name,markup] of Object.entries(pages)){
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>${utilities}\n${styles.join('\n')}\n${extra}</style></head><body>${markup}</body></html>`;
  fs.writeFileSync(path.join(out,name+'.html'),html);
  await page.setContent(html,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  if(name==='signup')await page.evaluate(()=>window.scrollTo(0,470));
  else if(name==='scan')await page.evaluate(()=>window.scrollTo(0,410));
  else await page.evaluate(()=>window.scrollTo(0,0));
  const png=await page.screenshot();
  await sharp(png).webp({quality:95}).toFile(path.join(out,name+'.webp'));
  const report=await page.evaluate(()=>({text:document.body.innerText.slice(0,1800),brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),overflow:document.documentElement.scrollWidth>innerWidth}));
  results.push({name,...report});
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify({results,failed},null,2));
 console.log(JSON.stringify({results,failed},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1});
