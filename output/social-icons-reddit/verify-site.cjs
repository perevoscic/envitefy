const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = __dirname;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{width:1440,height:1000},{width:375,height:812},{width:812,height:375}]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('http://localhost:3000/faq', {waitUntil:'domcontentloaded', timeout:60000});
      const social = page.locator('footer').getByRole('navigation', {name:'Follow Envitefy'});
      await social.waitFor({state:'visible',timeout:30000});
      await social.scrollIntoViewIfNeeded();
      const links = await social.getByRole('link').evaluateAll(nodes => nodes.map(a => ({href:a.href,label:a.textContent,target:a.target,rel:a.rel,width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})));
      assert.equal(links.length,5);
      await social.locator('img').last().waitFor({state:'visible'});
      await page.waitForFunction(()=>[...document.querySelectorAll('nav[aria-label="Follow Envitefy"] img')].every(img=>img.complete && img.naturalWidth>0));
      assert.ok(links.every(a=>a.width>=44 && a.height>=44 && a.target==='_blank' && a.rel.includes('noopener') && a.label.includes('Envitefy')));
      await social.getByRole('link').first().focus();
      const focusOutline = await social.getByRole('link').first().evaluate(a=>getComputedStyle(a).outlineStyle);
      assert.notEqual(focusOutline,'none');
      await page.screenshot({path:path.join(out,`footer-${viewport.width}.png`)});
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false);
      results.push({surface:'signed-out footer',viewport,links,focusOutline,overflow});
      await context.close();
    }
    for (const viewport of [{width:1440,height:1000},{width:375,height:812},{width:812,height:375}]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(()=>localStorage.setItem('envitefy:privacy-preferences:v1',JSON.stringify({version:1,necessary:true,analytics:false,updatedAt:'2026-09-05T00:00:00.000Z'})));
      console.log('Checking signed-in viewport',viewport.width);
      await context.route('**/api/**', route => {
        const pathname = new URL(route.request().url()).pathname;
        const body = pathname==='/api/auth/session'
          ? {user:{name:'Social Preview',email:'preview@example.test'},expires:'2099-01-01T00:00:00.000Z'}
          : pathname==='/api/history' ? {events:[],hasMore:false} : {};
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
      });
      const page = await context.newPage();
      await page.goto('http://localhost:3000/faq', {waitUntil:'domcontentloaded',timeout:60000});
      await page.locator('footer').waitFor({state:'visible'});
      await Promise.all([page.waitForResponse(response=>response.url().includes('/api/auth/session')),page.evaluate(() => {const timer=setInterval(()=>window.dispatchEvent(new StorageEvent('storage',{key:'nextauth.message',newValue:JSON.stringify({event:'session',data:{trigger:'getSession'},timestamp:Date.now()})})),500);setTimeout(()=>clearInterval(timer),10000);})]);
      const sidebar=page.locator('[aria-label="Sidebar"]');
      await sidebar.waitFor({state:'attached'});
      if(viewport.width<1024) await page.locator('button.nav-chrome-pill-secondary[aria-label="Open navigation"]').click();
      const profile=sidebar.locator('button').filter({hasText:'Social Preview'});
      await profile.click().catch(async error=>{await page.screenshot({path:path.join(out,'profile-error.png')});console.log((await page.locator('body').innerText()).slice(-2200));throw error;});
      const social = sidebar.getByRole('navigation',{name:'Follow Envitefy'});
      await social.waitFor({state:'visible'});
      await social.scrollIntoViewIfNeeded();
      const menu=sidebar.locator('.nav-chrome-menu-card').filter({hasText: 'Follow Envitefy'});
      const bounds=await menu.boundingBox();
      assert.ok(bounds.y>=0 && bounds.y+bounds.height<=viewport.height);
      const links=await social.getByRole('link').evaluateAll(nodes=>nodes.map(a=>({href:a.href,width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})));
      assert.equal(links.length,5);
      await social.locator('img').last().waitFor({state:'visible'});
      await page.waitForFunction(()=>[...document.querySelectorAll('nav[aria-label="Follow Envitefy"] img')].every(img=>img.complete && img.naturalWidth>0));
      assert.ok(links.every(a=>a.width>=44 && a.height>=44));
      assert.equal(await page.locator('footer').getByRole('navigation',{name:'Follow Envitefy'}).count(),0);
      await social.getByRole('link').first().focus();
      await page.screenshot({path:path.join(out,`profile-${viewport.width}.png`)});
      await context.route('https://www.reddit.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Social destination preview</title>'}));
      const popupPromise=page.waitForEvent('popup');
      await social.getByRole('link').last().click();
      const popup=await popupPromise;
      await popup.waitForLoadState();
      assert.equal(popup.url(),'https://www.reddit.com/user/envitefy/');
      await popup.close();
      await profile.click().catch(async error=>{await page.screenshot({path:path.join(out,'profile-error.png')});console.log((await page.locator('body').innerText()).slice(-2200));throw error;});
      assert.equal(await menu.evaluate(node=>node.inert),true);
      results.push({surface:'signed-in profile menu (mock session)',viewport,links,bounds,opensNewTab:true,closedMenuInert:true});
      await context.close();
    }
    fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results.map(({surface,viewport})=>({surface,viewport,status:'passed'})),null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});









