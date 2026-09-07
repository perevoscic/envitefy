const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require(process.cwd()+'/node_modules/typescript');
const originalLoad = Module._load;
Module._load = function(request,parent,isMain) { if(request === 'lucide-react'){const file=process.cwd()+'/node_modules/lucide-react/dist/cjs/lucide-react.js'; const m=new Module(file,parent); m.paths=Module._nodeModulePaths(path.dirname(file)); m._compile(fs.readFileSync(file,'utf8'),file); return m.exports;} return originalLoad.call(this,request,parent,isMain); };
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request,parent,...rest) { return originalResolve.call(this,request.startsWith('@/')?path.join(process.cwd(),'src',request.slice(2)):request,parent,...rest); };
for(const ext of ['.ts','.tsx']) Module._extensions[ext] = (m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,file);
Module._extensions['.css'] = (m)=>{m.exports=new Proxy({},{get:(_,k)=>k==='__esModule'?false:String(k)});};
const React=require(process.cwd()+'/node_modules/react');
const {renderToStaticMarkup}=require(process.cwd()+'/node_modules/react-dom/server');
const {CELEBRATION_DESIGN_CATALOG}=require(process.cwd()+'/src/data/birthday-design-catalog.ts');
const Hero=require(process.cwd()+'/src/components/birthdays/BirthdayExperienceHero.tsx').default;
const Body=require(process.cwd()+'/src/components/birthdays/BirthdayExperienceBody.tsx').default;
const Provider=require(process.cwd()+'/src/components/birthdays/BirthdayGuestActions.tsx').default;

const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveBirthdayHeroAsset } = require(process.cwd()+'/src/lib/birthday-hero-asset.ts');

test('all 150 celebration designs render bespoke scenes, real assets, and integrated guest tools', () => {
  assert.equal(CELEBRATION_DESIGN_CATALOG.length,150);
  const assets=new Set();
  for(const d of CELEBRATION_DESIGN_CATALOG) {
    const theme={id:d.id,name:d.name,colors:{primary:d.primaryColor,secondary:d.secondaryColor},fonts:{headline:d.headlineFont},heroImage:d.heroImage,experience:d.experience};
    const event={birthdayName:'Alexandra Rose',age:12,date:'2026-11-07T14:00:00',end:'2026-11-07T16:30:00',location:'The Garden Pavilion',story:'A celebration with friends.',party:{parking:'Use the north entrance.',allergies:'Contact the host about dietary needs.'},gallery:[d.heroImage],rsvpEnabled:true};
    const html=renderToStaticMarkup(React.createElement(Provider,{event,eventId:'birthday-test'},React.createElement(React.Fragment,null,React.createElement(Hero,{theme,event,onRsvpClick:()=>{}}),React.createElement(Body,{theme,event,onRsvpClick:()=>{}}))));
    assert.ok(html.includes(`data-birthday-scene="${d.id}"`),d.id);
    assert.ok(html.includes(`data-birthday-art-body="${d.id}"`),d.id);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,d.id);
    for(const text of ['Use the north entrance.','Add to calendar','Share invitation','Get directions','RSVP to celebrate']) assert.ok(html.includes(text),`${d.id}: ${text}`);
    assert.ok(!html.includes('Plan your visit'),d.id);
    for(const [,src] of html.matchAll(/<img[^>]*src="([^"]+)"/g)) if(src.startsWith('/')) assert.ok(fs.existsSync(path.join(process.cwd(),'public',src)),`${d.id}: missing ${src}`);
    assets.add(d.heroImage);
    const custom=renderToStaticMarkup(React.createElement(Hero,{theme:{...theme,heroImage:'/uploads/custom-birthday.jpg'},event}));
    assert.ok(custom.includes('/uploads/custom-birthday.jpg'),`${d.id}: uploaded art`);
  }
  assert.equal(assets.size,150);
});

test('bundled artwork upgrades while uploaded birthday art remains intact', () => {
  assert.equal(resolveBirthdayHeroAsset({customHero:'/templates/birthdays/old.webp',catalogHero:'/templates/birthdays/redesign/new.webp'}),'/templates/birthdays/redesign/new.webp');
  assert.equal(resolveBirthdayHeroAsset({customHero:'https://host.example/custom.jpg',catalogHero:'/templates/birthdays/redesign/new.webp'}),'https://host.example/custom.jpg');
  assert.equal(resolveBirthdayHeroAsset({savedHero:'/uploads/party.jpg',catalogHero:'/templates/birthdays/redesign/new.webp'}),'/uploads/party.jpg');
});

test('all used birthday typefaces have locally bundled font files and licenses', () => {
  const fonts=JSON.parse(fs.readFileSync('public/fonts/birthday/sources.json','utf8'));
  for(const design of CELEBRATION_DESIGN_CATALOG) assert.ok(fonts.some(f=>f.font===design.headlineFont),`${design.id}: ${design.headlineFont}`);
  for(const font of fonts) {
    const slug=font.font.toLowerCase().replace(/[^a-z0-9]/g,'');
    assert.ok(fs.readdirSync('public/fonts/birthday').some(f=>f===`${slug}-OFL.txt` || f===`${slug}-LICENSE.txt`),`${font.font}: license`);
  }
  const css=fs.readFileSync('src/components/birthdays/redesign/birthday-fonts.css','utf8');
  for(const [,url] of css.matchAll(/url\(([^)]+)\)/g)) assert.ok(fs.existsSync(path.join('public',url)),url);
  assert.ok(!css.includes('https://'));
});

