const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const context=await browser.newContext();
 await context.route('https://**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='envitefy.com'&&url.pathname.startsWith('/email/')){const file=path.join(process.cwd(),'public',url.pathname);if(fs.existsSync(file))return route.fulfill({status:200,contentType:'image/png',body:fs.readFileSync(file)});}return route.abort();});
 const results=[];
 for(const width of [600,375,320])for(const name of ['standard','magazine']){
  const page=await context.newPage();await page.setViewportSize({width,height:900});
  await page.setContent(fs.readFileSync(path.join(__dirname,`${name}.html`),'utf8'),{waitUntil:'load'});
  const footer=page.locator(name==='standard'?'.email-footer':'.footer-shell');
  const cells=footer.locator('.social-icon-cell');assert.equal(await cells.count(),5);
  const assets=await cells.locator('img').evaluateAll(nodes=>nodes.map(img=>({src:img.src,complete:img.complete,width:img.naturalWidth})));
  assert.ok(assets.every(img=>img.complete&&img.width>0));
  const footerHtml=await footer.evaluate(node=>node.outerHTML);
  const emailStyles=await page.locator('style').allTextContents();
  await page.setContent('<style>'+emailStyles.join('\n')+'</style><table width="100%"><tr>'+footerHtml+'</tr></table>',{waitUntil:'load'});
  const table=await cells.first().locator('xpath=../..').boundingBox();
  assert.ok(table.width<=width,`${name}: social row ${table.width}px overflows ${width}px`);
  assert.ok(table.x>=0 && table.x+table.width<=width,`${name}: social links must stay within the footer viewport`);
  const reddit=await footer.getByRole('link',{name:'Reddit',exact:true}).getAttribute('href');assert.equal(reddit,'https://www.reddit.com/user/envitefy/');
  await footer.screenshot({path:path.join(__dirname,`${name}-footer-${width}.png`)});
  results.push({name,width,socialWidth:table.width,assets,reddit});await page.close();
 }
 const stylesheetPage=await context.newPage();await stylesheetPage.goto('http://localhost:3000/faq',{waitUntil:'domcontentloaded',timeout:60000});
 const styleUrls=await stylesheetPage.locator('link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(node=>node.href));
 const styles=(await Promise.all(styleUrls.map(async url=>(await context.request.get(url)).text()))).join('\n');
 const eventPage=await context.newPage();
 await eventPage.setViewportSize({width:375,height:320});
 await eventPage.setContent('<base href="https://envitefy.com/"><style>'+styles+'</style>'+fs.readFileSync(path.join(__dirname,'event-rows.html'),'utf8'),{waitUntil:'load'});
 await eventPage.locator('img').evaluateAll(async nodes=>{await Promise.all(nodes.map(img=>img.decode()))});
 assert.equal(await eventPage.getByRole('link',{name:'Envitefy on Reddit (opens in a new tab)',exact:true}).count(),2);
 await eventPage.screenshot({path:path.join(__dirname,'event-footer-icons.png')});
 fs.writeFileSync(path.join(__dirname,'email-checks.json'),JSON.stringify(results,null,2));
 console.log('Both email footers verified at 600px, 375px, and 320px; all five icon assets load. Light/dark event rows rendered.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
