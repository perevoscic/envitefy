const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
// This installed lucide package marks its CommonJS entry as .js under type:module.
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'lucide-react') {
    const file = path.join(process.cwd(), 'node_modules/lucide-react/dist/cjs/lucide-react.js');
    const module = new Module(file, parent);
    module.paths = Module._nodeModulePaths(path.dirname(file));
    module._compile(fs.readFileSync(file, 'utf8'), file);
    return module.exports;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), 'src', request.slice(2)) : request, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName:file, compilerOptions:{module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true, target:ts.ScriptTarget.ES2022},
}).outputText, file);
Module._extensions['.css'] = m => { m.exports = new Proxy({}, {get:(_,k) => k === '__esModule' ? false : String(k)}); };
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createHash } = require('node:crypto');
const { genderRevealDesigns, getGenderRevealDesign } = require('../../lib/gender-reveal-designs.ts');
const { getFamilyTemplateDesign } = require('../../lib/family-template-designs.ts');
const { default: Scene, genderRevealPageStyle } = require('./GenderRevealScene.tsx');
const css = fs.readFileSync('src/components/gender-reveal/gender-reveal-scenes.module.css','utf8');
const prompts = JSON.parse(fs.readFileSync('public/templates/gender-reveal/collection-2026/prompts.json','utf8'));

test('exactly 60 designs have unique identities, compositions, prompts, and WebP bytes', () => {
  assert.equal(genderRevealDesigns.length, 60);
  for (const field of ['id','name','composition','heroImage','imagePrompt']) assert.equal(new Set(genderRevealDesigns.map(d=>d[field])).size,60,field);
  const hashes = new Set();
  for (const design of genderRevealDesigns) {
    const bytes = fs.readFileSync(path.join('public', design.heroImage));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
    assert.ok(css.includes(`.${design.composition} .art`),design.id);
    assert.equal(prompts.artworks.find(p=>p.id===design.id).prompt,design.imagePrompt);
    assert.equal(getFamilyTemplateDesign('gender-reveal',design.id).heroImage,design.heroImage);
  }
  assert.equal(hashes.size,60);
  assert.equal(getGenderRevealDesign('retired-template').id,genderRevealDesigns[0].id);
});

test('every composition renders event details and preserves uploaded artwork', () => {
  for (const design of genderRevealDesigns) {
    const props = {design,title:'Our little surprise',parents:'Alexandra & Christopher',image:design.heroImage,date:'September 21, 2028',time:'2:00 PM – 5:00 PM',location:'The Garden House, Chicago',actions:React.createElement('a',{href:'#rsvp'},'RSVP')};
    const html = renderToStaticMarkup(React.createElement('div',{className:'page',style:genderRevealPageStyle(design)},React.createElement(Scene,props)));
    assert.equal((html.match(/<h1\b/g)||[]).length,1,design.id);
    for (const value of [design.heroImage,'Our little surprise','Alexandra &amp; Christopher','September 21, 2028','2:00 PM','The Garden House','href="#rsvp"']) assert.ok(html.includes(value),`${design.id}: ${value}`);
    const custom = renderToStaticMarkup(React.createElement(Scene,{...props,image:'/uploads/my-own-reveal.webp'}));
    assert.ok(custom.includes('/uploads/my-own-reveal.webp'));
    assert.ok(!custom.includes(design.heroImage));
    if (process.env.REVEAL_REVIEW_DIR) {
      fs.mkdirSync(process.env.REVEAL_REVIEW_DIR,{recursive:true});
      fs.writeFileSync(path.join(process.env.REVEAL_REVIEW_DIR,`${design.id}.html`),`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>${design.name}</title><style>*{box-sizing:border-box}body{margin:0;background:#eee;font-family:Arial,sans-serif}p,h1{margin:0}.page{max-width:1080px;margin:0 auto;min-height:100vh}${css}</style></head><body>${html}</body></html>`);
    }
  }
});

test('collection display fonts load locally with licenses', () => {
  for (const design of genderRevealDesigns) {
    assert.ok(fs.existsSync(`public/fonts/birthday/${design.font}.ttf`));
    assert.ok(['OFL','LICENSE'].some(license=>fs.existsSync(`public/fonts/birthday/${design.font}-${license}.txt`)));
  }
});

const Viewer = require('../GenderRevealTemplateView.tsx').default;
test('all collection designs render through the complete public event viewer',()=>{for(const d of genderRevealDesigns){const html=renderToStaticMarkup(React.createElement(Viewer,{eventId:'',eventTitle:'Our little surprise',eventData:{templateId:d.id,parentsName:'Avery & Jordan',date:'2028-09-21',time:'14:00',rsvpEnabled:true,hosts:[{name:'Family'}],eventDetails:{notes:'Join the celebration.'},genderReveal:{guessesEnabled:true}},shareUrl:'',isOwner:false,isReadOnly:true,editHref:'',preview:true}));assert.ok(html.includes('data-reveal-scene="'+d.id+'"'));assert.ok(html.includes(d.heroImage));assert.ok(html.includes('Join the celebration.'));assert.ok(html.includes('RSVP'));assert.equal((html.match(/<h1\b/g)||[]).length,1);}});
