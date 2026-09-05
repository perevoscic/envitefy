import {chromium} from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const studio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(studio,'public/projects/host-mode');
const staging=path.join(studio,'out/demo-recapture');
await fs.mkdir(out,{recursive:true});
await fs.mkdir(staging,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:430,height:860},deviceScaleFactor:2});
  await page.goto('http://localhost:3000/showcase/the-carter-housewarming',{waitUntil:'networkidle',timeout:60000});
  const consent=page.getByRole('button',{name:'Use necessary only',exact:true});
  if(await consent.isVisible())await consent.click();
  await page.getByRole('button',{name:'RSVP',exact:true}).waitFor({state:'visible',timeout:60000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete&&image.naturalWidth>0));
  const clip={x:16,y:106,width:398,height:597};
  await page.screenshot({path:path.join(staging,'demo-invite.png'),clip});
  for(const [label,file] of [['RSVP','demo-rsvp.png'],['Location','demo-location.png'],['Calendar','demo-calendar.png']]){
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.waitForTimeout(500);
    if(label==='RSVP'){
      const contact=page.getByText('housewarming@example.com',{exact:true});
      await contact.evaluate(node=>{
        const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
        for(let text=walker.nextNode();text;text=walker.nextNode())text.nodeValue=text.nodeValue.replace('housewarming@example.com','housewarming@envitefy.com');
        const link=node.closest('a');
        if(link)link.setAttribute('href','mailto:housewarming@envitefy.com');
      });
    }
    await page.screenshot({path:path.join(staging,file),clip});
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.waitForTimeout(300);
  }
  for(const file of ['demo-invite.png','demo-rsvp.png','demo-location.png','demo-calendar.png'])await fs.copyFile(path.join(staging,file),path.join(out,file));
  console.log((await page.locator('body').innerText()).slice(0,2000));
  console.log(await page.getByRole('button').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,aria:n.getAttribute('aria-label')}))));
}finally{await browser.close();}
