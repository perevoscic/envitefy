import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { wordmarkMarkup, wordmarkDocument } from './generate-wordmark-assets.mjs';
import { traceMask } from './lib/merch-contours.mjs';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'output/merch/gang-sheet-22x36-2026-10-29-v3');
const W = 6600, H = 10800, DPI = 300;
const berry = '#98153f', coral = '#f24772';
const uri = (mime, buffer) => `data:${mime};base64,${buffer.toString('base64')}`;
const svgDoc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const img = (input, x, y, w, h, mime='image/svg+xml') => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uri(mime, input)}"/>`;
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

async function exists(path) { try { await access(path); return true; } catch { return false; } }
function assert(value, message) { if (!value) throw new Error(message); }
function bounds(mask, w, h) {
  let x0=w, y0=h, x1=-1, y1=-1, count=0;
  for (let y=0; y<h; y++) for(let x=0; x<w; x++) if(mask[y*w+x]) {
    x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y); count++;
  }
  return count ? {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,count} : null;
}

function cleanMask(mask,w,h) {
  // Keep a binary coverage mask linear: color-managed image blur can expand
  // the ink footprint when thresholded after an implicit gray/RGB conversion.
  const sigma=.7,radius=2,weights=[];let sum=0;
  for(let d=-radius;d<=radius;d++) {const value=Math.exp(-d*d/(2*sigma*sigma));weights.push(value);sum+=value;}
  for(let i=0;i<weights.length;i++) weights[i]/=sum;
  const horizontal=new Float32Array(mask.length),result=new Uint8Array(mask.length);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    let value=0;for(let d=-radius;d<=radius;d++) {const xx=x+d;if(xx>=0 && xx<w)value+=mask[y*w+xx]*weights[d+radius];}
    horizontal[y*w+x]=value;
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    let value=0;for(let d=-radius;d<=radius;d++) {const yy=y+d;if(yy>=0 && yy<h)value+=horizontal[yy*w+x]*weights[d+radius];}
    result[y*w+x]=value>=.5?1:0;
  }
  return result;
}

async function headline(file, crop, coralRange, name) {
  const {data,info}=await sharp(file).extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const all=new Uint8Array(info.width*info.height), face=new Uint8Array(all.length);
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const n=y*info.width+x, p=n*4, r=data[p], g=data[p+1], b=data[p+2];
    const ink=r>70 && r-g>38 && r-b>12 && (r-Math.min(g,b))/Math.max(r,1)>.45;
    if(ink) {
      all[n]=1;
      const originalY=crop.top+y;
      if(originalY>=coralRange[0] && originalY<=coralRange[1] && r>175 && g>25 && b>55) face[n]=1;
    }
  }
  // Remove source-pixel edge nicks before fitting print-resolution curves.
  // This is applied identically to both ink layers so coral stays contained.
  for(const mask of [all,face]) {
    const before=mask.reduce((a,b)=>a+b,0),cleaned=cleanMask(mask,info.width,info.height);
    const after=cleaned.reduce((a,b)=>a+b,0);
    assert(Math.abs(after-before)<Math.max(50,before*.02),'Headline cleanup changed too much ink');
    mask.set(cleaned);
  }
  const box=bounds(all,info.width,info.height);
  assert(box && box.count>10000, `${name}: missing headline ink`);
  const under=traceMask(all,info.width,info.height,{minArea:12,fitError:1,cornerMinRun:5,cornerAngle:65});
  const top=traceMask(face,info.width,info.height,{minArea:8,fitError:1,cornerMinRun:5,cornerAngle:65});
  const padding=2, vw=box.width+padding*2, vh=box.height+padding*2;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${box.x-padding} ${box.y-padding} ${vw} ${vh}"><path fill="${berry}" fill-rule="evenodd" d="${under.path}"/><path fill="${coral}" fill-rule="evenodd" d="${top.path}"/></svg>`;
  await writeFile(join(out,`${name}-headline.svg`),svg);
  return {buffer:Buffer.from(svg),width:vw,height:vh,source:crop,inkPixels:box.count,contours:under.contours.length};
}

async function canonicalWordmark() {
  const options={headless:true};
  if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  let browser;
  try { browser=await chromium.launch(options); }
  catch(error) { if(options.executablePath) throw error; browser=await chromium.launch({headless:true,channel:'chrome'}); }
  try {
    const page=await browser.newPage({viewport:{width:1800,height:700},deviceScaleFactor:4});
    await page.setContent(await wordmarkDocument(`<div id="wordmark">${await wordmarkMarkup('gradient')}</div>`));
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>[...document.fonts].some(f=>f.family==='Josefin Slab' && f.status==='loaded')),'Canonical font did not load');
    const screenshot=await page.locator('#wordmark').screenshot({omitBackground:true});
    const png=await sharp(screenshot).trim().png().toBuffer();
    const metadata=await sharp(png).metadata();
    assert(metadata.hasAlpha && metadata.width>=4000,'Canonical wordmark source is not high resolution');
    return {png,width:metadata.width,height:metadata.height};
  } finally { await browser.close(); }
}

async function canonicalSymbol() {
  const source=join(root,'public/brand/e-only.png');
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const count=info.width*info.height, mask=new Uint8Array(count), rgb=new Uint8Array(count*3);
  const seen=new Uint8Array(count), queue=new Int32Array(count); let start=0,end=0;
  for(let n=0;n<count;n++) {
    mask[n]=data[n*4+3]>=128 ? 1 : 0;
    if(data[n*4+3]>=250) { seen[n]=1;queue[end++]=n;for(let c=0;c<3;c++) rgb[n*3+c]=data[n*4+c]; }
  }
  // Extend only the source's smooth gradient outside its alpha; the traced path
  // supplies the sharp print boundary instead of enlarging the small alpha edge.
  while(start<end) {
    const n=queue[start++], x=n%info.width, y=Math.floor(n/info.width);
    for(const next of [x>0?n-1:-1,x+1<info.width?n+1:-1,y>0?n-info.width:-1,y+1<info.height?n+info.width:-1]) {
      if(next<0 || seen[next]) continue;
      seen[next]=1;queue[end++]=next;
      for(let c=0;c<3;c++) rgb[next*3+c]=rgb[n*3+c];
    }
  }
  const trace=traceMask(mask,info.width,info.height,{minArea:4,fitError:.3});
  const gradient=await sharp(rgb,{raw:{width:info.width,height:info.height,channels:3}}).resize(info.width*8,info.height*8,{kernel:'cubic'}).png().toBuffer();
  const svg=svgDoc(info.width,info.height,`<defs><clipPath id="symbol"><path fill-rule="evenodd" clip-rule="evenodd" d="${trace.path}"/></clipPath></defs><g clip-path="url(#symbol)">${img(gradient,0,0,info.width,info.height,'image/png')}</g>`);
  await writeFile(join(out,'canonical-symbol-traced.svg'),svg);
  return {buffer:Buffer.from(svg),width:info.width,height:info.height};
}

async function socialIcon(name) {
  let source=await readFile(join(root,`public/email/social-${name}.svg`),'utf8');
  source=source.replaceAll('#4E4E50',berry).replaceAll('#4e4e50',berry);
  if(name==='reddit') {
    const match=source.match(/<image\b[^>]*href="data:image\/png;base64,([^"]+)"[^>]*\/>/);
    assert(match,'Reddit source raster was not found');
    const {data,info}=await sharp(Buffer.from(match[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const mask=new Uint8Array(info.width*info.height);
    for(let i=0;i<mask.length;i++) mask[i]=data[i*4+3]>=128?1:0;
    const traced=traceMask(mask,info.width,info.height,{minArea:2,fitError:.3});
    source=source.replace(match[0],`<g transform="translate(10 10) scale(${28/info.width} ${28/info.height})"><path fill="${berry}" fill-rule="evenodd" d="${traced.path}"/></g>`);
  }
  return Buffer.from(source);
}

async function footerText() {
  const fontfile=join(process.env.WINDIR||'C:/Windows','Fonts/arialbd.ttf');
  assert(await exists(fontfile),'Arial Bold font file not available');
  const png=await sharp({text:{text:`<span foreground="${berry}">YOU ARE INVITED</span>`,font:'Arial Bold 180',fontfile,dpi:144,rgba:true}}).trim().png().toBuffer();
  const m=await sharp(png).metadata();
  return {png,width:m.width,height:m.height};
}

async function suffixText() {
  const glyph=await sharp({text:{text:'<span letter_spacing="-12288" weight="700" foreground="#ffffff">com.</span>',font:'Josefin Slab Bold 160',fontfile:join(root,'public/fonts/Josefin_Slab/JosefinSlab-VariableFont_wght.ttf'),rgba:true,dpi:144}}).png().toBuffer({resolveWithObject:true});
  const {width,height}=glyph.info;
  const gradient=svgDoc(width,height,'<defs><linearGradient id="com-gradient" x1="0" y1="0" x2="1" y2="0.1"><stop offset="0%" stop-color="#6b3cff"/><stop offset="22%" stop-color="#6757ff"/><stop offset="54%" stop-color="#5a7dff"/><stop offset="100%" stop-color="#37a8ff"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#com-gradient)"/>');
  const png=await sharp(Buffer.from(gradient)).composite([{input:glyph.data,blend:'dest-in'}]).extend({top:24,bottom:24,left:24,right:24,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  return {png,width:width+48,height:height+48};
}

function readPngChunks(buffer) {
  const chunks=[];let at=8;
  while(at+12<=buffer.length) { const length=buffer.readUInt32BE(at),type=buffer.toString('ascii',at+4,at+8);chunks.push({type,data:buffer.subarray(at+8,at+8+length)});at+=length+12; }
  return chunks;
}

await mkdir(out,{recursive:true});
const finalPath=join(out,'envitefy-4-shirts-22x36in-300dpi.png');
assert(!await exists(finalPath),'Final PNG exists; refusing to overwrite');
const title1=await headline(join(root,'output/merch/envitefy-shirt-01-make-it-a-thing-final-2026-10-29.webp'),{left:920,top:300,width:425,height:295},[440,595],'make-it-a-thing');
const title2=await headline(join(root,'output/merch/envitefy-shirt-02-good-plans-great-people-final-2026-10-29.webp'),{left:925,top:230,width:440,height:450},[440,565],'good-plans-great-people');
console.log('Traced approved headline lettering; fabric and garment pixels excluded.');
const wordmark=await canonicalWordmark();
const symbol=await canonicalSymbol();
const footer=await footerText();
const suffix=await suffixText();
const platforms=['instagram','facebook','youtube','tiktok','reddit'];
const socials=await Promise.all(platforms.map(socialIcon));

const frontW=400,frontH=310;
const front=Buffer.from(svgDoc(frontW,frontH,img(symbol.buffer,70,0,260,260*symbol.height/symbol.width)+img(wordmark.png,0,176,400,400*wordmark.height/wordmark.width,'image/png')));
const b1w=400,b1h=505;
const t1h=400*title1.height/title1.width;
assert(t1h<300,'First headline does not fit its back print');
const mark1h=220*wordmark.height/wordmark.width;
const footerW=270,footerH=footerW*footer.height/footer.width;
const b1=Buffer.from(svgDoc(b1w,b1h,
  img(wordmark.png,90,0,220,mark1h,'image/png')+
  img(title1.buffer,0,90,400,t1h)+
  `<rect x="35" y="391" width="330" height="3" fill="${coral}"/>`+
  socials.map((s,i)=>img(s,42+i*65,406,56,56)).join('')+
  img(footer.png,(400-footerW)/2,477,footerW,footerH,'image/png')));
const b2w=400,b2h=515;
const t2h=400*title2.height/title2.width;
assert(t2h<425,'Second headline does not fit its back print');
const lockW=240,lockX=80,lockY=431;
const b2=Buffer.from(svgDoc(b2w,b2h,
  img(title2.buffer,0,0,400,t2h)+
  img(wordmark.png,lockX,lockY,lockW,lockW*wordmark.height/wordmark.width,'image/png')+
  img(suffix.png,lockX+lockW*760/1200,lockY+lockW*344/1200,lockW*230/1200,(lockW*230/1200)*suffix.height/suffix.width,'image/png')));
const assets=[['front-pocket',front],['back-01-make-it-a-thing',b1],['back-02-good-plans-great-people',b2]];
for(const [name,buffer] of assets) await writeFile(join(out,`${name}.svg`),buffer);

const placements=[
  {name:'back-01-copy-1',kind:'back1',x:75,y:75,width:3150,height:3150*b1h/b1w,asset:b1},
  {name:'back-01-copy-2',kind:'back1',x:3375,y:75,width:3150,height:3150*b1h/b1w,asset:b1},
  {name:'back-02-copy-1',kind:'back2',x:75,y:4275,width:3150,height:3150*b2h/b2w,asset:b2},
  {name:'back-02-copy-2',kind:'back2',x:3375,y:4275,width:3150,height:3150*b2h/b2w,asset:b2},
  ...[1275,2325,3375,4425].map((x,i)=>({name:`front-pocket-${i+1}`,kind:'front',x,y:8550,width:900,height:900*frontH/frontW,asset:front}))
];
for(const p of placements) assert(p.x>=75 && p.y>=75 && p.x+p.width<=W-75 && p.y+p.height<=H-75,`${p.name} outside sheet`);
for(let i=0;i<placements.length;i++) for(let j=i+1;j<placements.length;j++) {
  const a=placements[i],b=placements[j];
  assert(!(a.x<b.x+b.width && b.x<a.x+a.width && a.y<b.y+b.height && b.y<a.y+a.height),'Print rectangles overlap');
}
const sheet=Buffer.from(svgDoc(W,H,placements.map(p=>img(p.asset,p.x,p.y,p.width,p.height)).join('')));
await writeFile(join(out,'envitefy-4-shirts-22x36in-source.svg'),sheet);
await sharp(sheet,{limitInputPixels:false}).withMetadata({density:DPI}).png({compressionLevel:9,palette:false}).toFile(finalPath);
console.log('Rendered 22 x 36 inch PNG at 300 DPI.');

const file=await readFile(finalPath),metadata=await sharp(file).metadata();
const phys=readPngChunks(file).find(c=>c.type==='pHYs');
assert(metadata.width===W && metadata.height===H && metadata.channels===4 && metadata.hasAlpha,'Final dimensions/RGBA verification failed');
assert(phys && phys.data.readUInt32BE(0)===11811 && phys.data.readUInt32BE(4)===11811 && phys.data[8]===1,'PNG 300 DPI pHYs verification failed');
const {data:alpha}=await sharp(file).extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
let zero=0,opaque=0;for(const a of alpha) {if(a===0)zero++;if(a===255)opaque++;}
assert(zero>W*H*.50 && opaque>W*H*.02,'Missing real transparency or artwork');
for(const [x,y] of [[0,0],[W-1,0],[0,H-1],[W-1,H-1],[3300,2000],[100,10500]]) assert(alpha[y*W+x]===0,'Transparent margin/cutting lane is not empty');
const inkBounds=[];
for(const p of placements) {
  const left=Math.floor(p.x),top=Math.floor(p.y),width=Math.ceil(p.width),height=Math.ceil(p.height);
  const roi=await sharp(file).extract({left,top,width,height}).extractChannel('alpha').raw().toBuffer();
  const box=bounds(roi.map(a=>a>0?1:0),width,height);
  assert(box && box.count>20000,`${p.name} contains no artwork`);
  inkBounds.push({name:p.name,kind:p.kind,x:p.x,y:p.y,width:p.width,height:p.height,printWidthIn:p.width/DPI,printHeightIn:p.height/DPI,inkBounds:{x:left+box.x,y:top+box.y,width:box.width,height:box.height},inkPixelCount:box.count});
}
await sharp(file).resize({width:1100}).png().toFile(join(out,'envitefy-gang-sheet-preview-transparent.png'));
// This proof is separate from the upload file; its checkerboard never prints.
const checker=svgDoc(660,1080,'<defs><pattern id="check" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f6f6f6"/><path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#e6e6e6"/></pattern></defs><rect width="100%" height="100%" fill="url(#check)"/>');
const small=await sharp(file).resize(660,1080).png().toBuffer();
await sharp(Buffer.from(checker)).composite([{input:small}]).png().toFile(join(out,'envitefy-gang-sheet-preview-checkerboard.png'));
const report={file:finalPath,width:W,height:H,dpi:DPI,physicalWidthIn:22,physicalHeightIn:36,format:metadata.format,channels:metadata.channels,hasAlpha:metadata.hasAlpha,pHYs:{x:phys.data.readUInt32BE(0),y:phys.data.readUInt32BE(4),unit:phys.data[8]},transparentPixels:zero,opaquePixels:opaque,printCounts:{back1:2,back2:2,front:4,total:8},placements:inkBounds,headlines:[{name:'back1',source:title1.source,inkPixels:title1.inkPixels,contours:title1.contours},{name:'back2',source:title2.source,inkPixels:title2.inkPixels,contours:title2.contours}],wordmarkRender:{width:wordmark.width,height:wordmark.height,source:'actual canonical EnvitefyWordmark component'},sha256:hash(file),bytes:file.length};
await writeFile(join(out,'layout-and-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:finalPath,width:W,height:H,dpi:DPI,prints:8,bytes:file.length,transparentPercent:100*zero/(W*H)},null,2));
