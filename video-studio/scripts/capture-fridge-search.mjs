import {chromium} from '../../node_modules/playwright/index.mjs';import fs from 'node:fs/promises';
const out='out/fridge-freedom';await fs.mkdir(out+'/search-capture',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:430,height:800},deviceScaleFactor:1,recordVideo:{dir:out+'/search-capture',size:{width:430,height:800}}});
 const page=await context.newPage();const start=Date.now(),marks={};
 await page.goto('https://www.google.com/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(700);
 const reject=page.getByRole('button',{name:'Reject all',exact:true});if(await reject.isVisible())await reject.click();
 const field=page.locator('textarea[name="q"],input[name="q"]').first();await field.click();marks.type=(Date.now()-start)/1000;
 await field.pressSequentially('turn paper birthday invite into a digital invitation',{delay:32});await page.waitForTimeout(350);await page.screenshot({path:out+'/search-typed.png'});marks.search=(Date.now()-start)/1000;await field.press('Enter');await page.waitForTimeout(1400);await page.screenshot({path:out+'/search-results.png'});marks.results=(Date.now()-start)/1000;await page.waitForTimeout(1500);
 const videoPath=await page.video().path();await context.close();await fs.writeFile('projects/fridge-freedom/search-timing.json',JSON.stringify({videoPath,...marks},null,2));console.log(marks);
}finally{await browser.close();}
