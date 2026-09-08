import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const root='projects/wedding-characters';
let html=await fs.readFile(root+'/showcase-remote.html','utf8');
const marker='\\"rsvpContact\\":\\"garden-vows@example.com\\"';
html=html.replaceAll(marker,marker+',\\"eventId\\":\\"demo-wedding-characters\\",\\"rsvpEnabled\\":true,\\"rsvpMode\\":\\"envitefy\\"').replaceAll('garden-vows@example.com','wedding-demo@envitefy.com');
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:430,height:760}});
page.on('pageerror',e=>console.log('pageerror',e.message));page.on('console',m=>{if(m.type()==='error')console.log('console',m.text().slice(0,600));});page.on('requestfailed',r=>console.log('requestfailed',new URL(r.url()).pathname,r.failure()?.errorText));
await page.route('**/*',async route=>{const req=route.request();if(!['GET','HEAD'].includes(req.method()))return route.abort();if(req.url()==='https://envitefy.com/showcase/garden-vows')return route.fulfill({status:200,contentType:'text/html',body:html});return route.continue();});
await page.goto('https://envitefy.com/showcase/garden-vows',{waitUntil:'networkidle',timeout:60000});
await page.waitForTimeout(2500);const consent=page.getByRole('button',{name:'Essential only',exact:true});if(await consent.isVisible())await consent.click();await page.getByRole('button',{name:'RSVP',exact:true}).click();await page.waitForTimeout(1200);
console.log((await page.locator('body').innerText()).slice(0,4000));
await page.screenshot({path:'out/wedding-characters/capture-debug.jpg'});
console.log(await page.getByRole('button').allTextContents());console.log(await page.getByRole('button',{name:'RSVP',exact:true}).evaluate(el=>{const key=Object.keys(el).find(k=>k.startsWith('__reactFiber'));let f=el[key];for(let n=0;n<25&&f;n++,f=f.return){if(f.memoizedProps?.invitationData)return f.memoizedProps.invitationData;}return {keys:Object.keys(el),zone:Intl.DateTimeFormat().resolvedOptions().timeZone};}));
}finally{await browser.close();}



