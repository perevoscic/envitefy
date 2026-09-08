import {chromium} from '../../node_modules/playwright/index.mjs';
import {encode} from '../../node_modules/next-auth/jwt/index.js';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
dotenv.config({path:'../.env',quiet:true});dotenv.config({path:'../.env.local',override:true,quiet:true});
const token=await encode({token:{name:'Mom',email:'fridge-demo@envitefy.com',sub:'fridge-demo',userId:'fridge-demo',isAdmin:false,isAdminCheckedAt:Date.now(),primarySignupSource:'snap',productScopes:['snap'],accessMetadataCheckedAt:Date.now()},secret:process.env.AUTH_SECRET??process.env.NEXTAUTH_SECRET??'dev-build-secret',maxAge:3600});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:430,height:860},deviceScaleFactor:1});
 await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://localhost:3000'}]);
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.pathname==='/api/auth/session')return route.fulfill({json:{user:{name:'Mom',email:'fridge-demo@envitefy.com',id:'fridge-demo',productScopes:['snap']},expires:'2026-09-09T00:00:00Z'}});
  if(u.pathname.startsWith('/api/')&&!['/api/auth/session'].includes(u.pathname))return route.fulfill({status:401,json:{ok:false,error:'Demo has no connected services'}});
  if(!['GET','HEAD'].includes(req.method()))return route.abort();
  await route.continue();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>console.log('pageerror',e.stack));
 await page.goto('http://localhost:3000/snap',{waitUntil:'networkidle',timeout:120000});
 await page.waitForTimeout(1000);
 await page.screenshot({path:'out/fridge-freedom/snap-inspect.png'});
 console.log((await page.locator('body').innerText()).slice(0,6500));
 console.log('buttons',await page.getByRole('button').allTextContents());
 await fs.writeFile('projects/fridge-freedom/snap-inspect.html',await page.content());
 await context.close();
}finally{await browser.close();}

