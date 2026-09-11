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


const assert = require('node:assert/strict');
const test = require('node:test');
const {createHash} = require('node:crypto');
const {BABY_SHOWER_DESIGNS: designs, getBabyShowerDesign, getBabyShowerTheme, resolveBabyShowerHero} = require(process.cwd()+'/src/lib/baby-shower-designs.ts');
const retired = require(process.cwd()+'/src/data/baby-shower-retired-designs.json');
const Preview = require(process.cwd()+'/src/components/baby-showers/BabyShowerDesignPreview.tsx').default;
const Viewer = require(process.cwd()+'/src/components/BabyShowerTemplateView.tsx').default;
const Gallery = require(process.cwd()+'/src/components/event-create/BabyShowersTemplateGallery.tsx').default;

test('the collection contains 60 original designs, images, and sample identities', () => {
  assert.equal(designs.length,60);
  for(const key of ['id','name','heroImage','imagePrompt','composition','subject']) {
    assert.equal(new Set(designs.map(d=>d[key])).size,60,key);
  }
  for(const key of ['babyName','momName','venue','headline','notes']) {
    assert.equal(new Set(designs.map(d=>d.sample[key])).size,60,key);
  }
  const files=fs.readdirSync('public/templates/baby-showers').filter(f=>f.endsWith('.webp')).sort();
  assert.deepEqual(files,designs.map(d=>path.basename(d.heroImage)).sort());
  const fingerprints=new Set();
  for(const d of designs) {
    const bytes=fs.readFileSync(path.join('public',d.heroImage));
    assert.equal(bytes.toString('ascii',0,4),'RIFF',d.id);
    assert.equal(bytes.toString('ascii',8,12),'WEBP',d.id);
    fingerprints.add(createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(fingerprints.size,60);
});

test('all 60 full invitations retain unique artwork and integrated guest tools', () => {
  for(const d of designs) {
    const preview=renderToStaticMarkup(React.createElement(Preview,{designId:d.id}));
    assert.ok(preview.includes('data-baby-scene="'+d.id+'"'),d.id);
    assert.equal((preview.match(/<h1\b/g)||[]).length,1,d.id);
    assert.ok(preview.includes(d.sample.babyName),d.id);
    const html=renderToStaticMarkup(React.createElement(Viewer,{
      eventId:'baby-collection-test', eventTitle:'A celebration for our baby',
      eventData:{templateId:d.id,babyName:'Alexandra Rose',momName:'Jordan',heroImage:d.heroImage,
        theme:getBabyShowerTheme(d),startISO:'2028-03-04T20:00:00Z',endISO:'2028-03-04T22:00:00Z',
        address:'The Garden Pavilion',hosts:[{name:'The family',role:'Hosts'}],
        babyDetails:{notes:'An afternoon of stories and sweet treats.'},
        registries:[{label:'Our wishlist',url:'https://registry.example/wishlist'}],
        rsvp:{isEnabled:true},guestPlanning:{parking:'Use the north entrance.'}},
      shareUrl:'https://envitefy.com/event/baby-collection-test',isOwner:false,isReadOnly:true,editHref:''
    }));
    for(const text of ['Alexandra Rose','Jordan',d.heroImage,'Add to calendar','Get directions','Share invitation','Our wishlist','An afternoon of stories and sweet treats.','Use the north entrance.']) {
      assert.ok(html.includes(text),d.id+': '+text);
    }
    assert.equal((html.match(/<h1\b/g)||[]).length,1,d.id);
  }
});

test('gallery previews use inert square frames and accessible selection buttons', () => {
  const html=renderToStaticMarkup(React.createElement(Gallery,{appliedTemplateId:designs[0].id,appliedVariationId:null,onApplyTemplate:()=>{}}));
  assert.equal((html.match(/data-template-thumbnail-preview/g)||[]).length,60);
  assert.equal((html.match(/aria-hidden="true" inert=""/g)||[]).length,60);
  assert.equal((html.match(/aspect-square/g)||[]).length,60);
  for(const d of designs) assert.ok(html.includes('aria-label="Select '+d.name.replace(/&/g,'&amp;')+'"'),d.id);
  assert.ok(html.includes('aria-pressed="true"'));
});

test('retired designs upgrade without replacing uploaded or external artwork', () => {
  assert.equal(Object.keys(retired).length,24);
  for(const [old,replacement] of Object.entries(retired)) {
    assert.equal(getBabyShowerDesign(old)?.id,replacement);
    assert.equal(resolveBabyShowerHero('/templates/baby-showers/'+old+'.webp'),getBabyShowerDesign(replacement).heroImage);
    assert.ok(!fs.existsSync('public/templates/baby-showers/'+old+'.webp'));
  }
  for(const custom of ['/uploads/my-baby.jpg','https://photos.example/family.png']) {
    assert.equal(resolveBabyShowerHero(custom,designs[0]),custom);
  }
  assert.equal(getBabyShowerDesign('invalid-design'),undefined);
});

test('every scene has a distinct composition and licensed local typeface', () => {
  const css=fs.readFileSync('src/components/baby-showers/baby-shower-designs.module.css','utf8');
  const fonts=JSON.parse(fs.readFileSync('public/fonts/birthday/sources.json','utf8'));
  const fontCss=fs.readFileSync('src/components/birthdays/redesign/birthday-fonts.css','utf8');
  const layouts=new Set();
  for(const d of designs) {
    const blocks=css.split('\n').filter(line=>line.includes('[data-baby-scene="'+d.id+'"]'));
    assert.ok(blocks.length>=4,d.id);
    layouts.add(blocks.map(line=>line.replaceAll(d.id,'scene')).join('\n'));
    assert.ok(fonts.some(f=>f.font===d.displayFont),d.displayFont);
    assert.ok(fontCss.includes("font-family: '"+d.displayFont+"'"),d.displayFont);
    const slug=d.displayFont.toLowerCase().replace(/[^a-z0-9]/g,'');
    assert.ok(fs.readdirSync('public/fonts/birthday').some(file=>file===slug+'-OFL.txt'||file===slug+'-LICENSE.txt'),d.displayFont);
  }
  assert.equal(layouts.size,60);
});
