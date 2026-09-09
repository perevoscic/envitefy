import {chromium} from '../../node_modules/playwright/index.mjs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:23783');
for(const page of browser.contexts().flatMap(c=>c.pages())){
 if(!page.url().includes('localhost:3001'))continue;
 console.log(await page.evaluate(()=>({text:document.body.innerText.slice(0,4000),ready:document.readyState,globals:Object.keys(window).filter(k=>/remotion|delay/i.test(k)),resources:performance.getEntriesByType('resource').slice(-8).map(r=>({name:r.name,duration:r.duration}))})));
}
process.exit(0);
