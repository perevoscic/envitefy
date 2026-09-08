import fs from 'node:fs/promises';
import {demoSession,out} from './john-demo-session.mjs';
const view=process.argv[2]||'card';
const {page,browser}=await demoSession({view,width:view==='card'?600:1200,height:view==='card'?860:820});
try{console.log((await page.locator('body').innerText()).slice(0,15000));await page.screenshot({path:`${out}/inspect-${view}.jpg`});await fs.writeFile(`${out}/inspect-${view}.json`,JSON.stringify(await page.locator('button,input,textarea,a').evaluateAll(els=>els.map(e=>({tag:e.tagName,text:e.textContent,aria:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder'),href:e.getAttribute('href')}))),null,2));}finally{await browser.close();}
