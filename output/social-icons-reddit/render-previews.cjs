const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(name,parent,...args){return originalResolve.call(this,name.startsWith('@/')?path.resolve('src',name.slice(2)):name,parent,...args)};
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const {ENVITEFY_SOCIAL_LINKS}=require('../../src/lib/envitefy-social-links.ts');
const {createEmailTemplate}=require('../../src/lib/email-template.ts');
const {renderMagazineEmail}=require('../../src/lib/email-templates/magazine-1.ts');
for(const [name,html]of [['standard',createEmailTemplate({title:'You are invited',body:'<p>Everything for your next event, in one place.</p>'})],['magazine',renderMagazineEmail({baseUrl:'https://envitefy.com'})]]){
 for(const social of ENVITEFY_SOCIAL_LINKS){assert.ok(html.includes(`href="${social.href}"`));assert.ok(html.includes(`https://envitefy.com${social.iconSrc}`));}
 assert.equal((html.match(/class="social-icon-cell"/g)||[]).length,5);
 fs.writeFileSync(path.join(__dirname,`${name}.html`),html);
}
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const Social=require('../../src/components/branding/EnvitefySocialLinks.tsx').default;
fs.writeFileSync(path.join(__dirname,'event-rows.html'),renderToStaticMarkup(React.createElement('div',null,React.createElement('div',{style:{padding:24,background:'#fcfbf7',color:'#4e4e50'}},React.createElement(Social,{placement:'event'})),React.createElement('div',{style:{padding:24,background:'#251b47',color:'#fff'}},React.createElement(Social,{placement:'event',inverse:true})))));
assert.deepEqual(fs.readFileSync('public/email/social-reddit.png'),fs.readFileSync('C:/Users/rjosan/AppData/Local/Temp/codex-clipboard-5b0add6d-e234-47e2-b1a6-fa451391f67f.png'));
console.log('Both email templates include all five shared accounts and image assets; supplied Reddit PNG preserved byte-for-byte.');
