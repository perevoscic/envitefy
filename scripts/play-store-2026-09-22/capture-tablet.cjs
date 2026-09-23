// Re-render the saved production-component markup at a tablet viewport.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
const output=path.join(root,'output/play-store-2026-09-22');
const largeTablet=process.argv.includes('--tablet-10-inch');
const viewport=largeTablet?{width:800,height:1280}:{width:600,height:960};
const scale=largeTablet?2.5:8/3;
const out=path.join(output,largeTablet?'tablet-10-inch':'tablet-7-inch','app-screens');
fs.mkdirSync(out,{recursive:true});
async function main(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport,deviceScaleFactor:scale,reducedMotion:'reduce'});
 const failed=[];const results=[];
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='envitefy-tablet.test')return route.abort();
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html></html>'});
  const file=path.resolve(root,'public','.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(path.join(root,'public')+path.sep)||!fs.existsSync(file)){failed.push(url.pathname);return route.abort();}
  return route.fulfill({path:file});
 });
 try{
  await page.goto('http://envitefy-tablet.test/');
  for(const name of ['card','scan','signup','dashboard']){
   let html=fs.readFileSync(path.join(output,'app-screens',name+'.html'),'utf8');
   // Reserve space for the fixture's fixed navigation at the wider breakpoint.
   html=html.replace('</head>','<style>html{scroll-behavior:auto!important}@media(min-width:768px){.capture-dashboard{padding-top:52px}}</style></head>');
   // Allow the last event section to align below navigation in the local fixture.
   if(largeTablet&&name==='dashboard')html=html.replace('</head>','<style>.capture-dashboard{padding-bottom:360px}</style></head>');
   await page.setContent(html,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(async()=>Promise.all([...document.images].map(image=>image.decode())));
   if(name==='signup')await page.evaluate(isLarge=>{
    const heading=[...document.querySelectorAll('h1,h2,h3')].find(node=>node.textContent.trim()===(isLarge?'Community picnic':'Sign-up board'));
    window.scrollTo(0,heading?Math.max(0,heading.getBoundingClientRect().top+scrollY-(isLarge?110:35)):isLarge?0:300);
   },largeTablet);
   else if(name==='scan')await page.evaluate(()=>{
    const action=[...document.querySelectorAll('a,button')].find(node=>node.textContent.trim().toLowerCase()==='add to calendar');
    window.scrollTo(0,action?Math.max(0,action.getBoundingClientRect().top+scrollY-460):320);
   });
   else if(name==='dashboard'&&largeTablet)await page.evaluate(()=>{
    const agenda=document.querySelector('#dashboard-agenda');
    if(!agenda)throw Error('Upcoming event section missing from dashboard fixture');
    window.scrollTo(0,Math.max(0,agenda.getBoundingClientRect().top+scrollY-96));
   });
   else await page.evaluate(()=>window.scrollTo(0,0));
   const report=await page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},scrollY,brokenImages:[...document.images].filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.src),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,visibleText:document.body.innerText.slice(0,1000)}));
   if(report.brokenImages.length||report.horizontalOverflow)throw Error(name+' capture failed '+JSON.stringify(report));
   const png=await page.screenshot();
   const target=path.join(out,name+'.webp');
   const encoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','pipe:0','-c:v','libwebp','-quality','85','-compression_level','6',target],{input:png,maxBuffer:16*1024*1024});
   if(encoded.status!==0)throw Error(encoded.stderr.toString());
   const meta=await sharp(target).metadata();await sharp(target).raw().toBuffer();
   if(meta.format!=='webp'||meta.width!==Math.round(viewport.width*scale)||meta.height!==Math.round(viewport.height*scale))throw Error('Unexpected capture output '+name);
   fs.writeFileSync(path.join(out,name+'.html'),html);
   results.push({name,...report,output:{width:meta.width,height:meta.height,format:meta.format}});
   console.log('Captured tablet '+name);
  }
 }finally{await browser.close();}
 if(failed.length)throw Error('Missing assets '+failed.join(', '));
 fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify({method:'Local production-component markup re-rendered at a tablet viewport; sample event data; no emulator or account writes.',results,failed},null,2));
 console.log(JSON.stringify(results.map(({name,viewport,output})=>({name,viewport,output})),null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1});
