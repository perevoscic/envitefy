import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const root='projects/wedding-characters';
const response=await fetch('https://envitefy.com/showcase/garden-vows');
if(!response.ok)throw new Error('Showcase HTTP '+response.status);
await fs.writeFile(root+'/showcase-remote.html',await response.text());
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:430,height:760}});
 await page.goto('https://envitefy.com/showcase/garden-vows',{waitUntil:'networkidle',timeout:60000});
 const consent=page.getByRole('button',{name:'Use necessary only',exact:true});if(await consent.isVisible())await consent.click();
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'out/wedding-characters/ui-inspection.png'});
 console.log(await page.locator('body').innerText());
 console.log(await page.getByRole('button').evaluateAll(bs=>bs.map(b=>({text:b.innerText,aria:b.getAttribute('aria-label'),title:b.getAttribute('title')}))));
}finally{await browser.close();}

