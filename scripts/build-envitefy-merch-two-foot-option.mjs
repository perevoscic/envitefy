import { mkdir, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'output/merch/gang-sheet-22x36-2026-10-29-v3');
const out = join(root, 'output/merch/gang-sheet-22x24-option-2026-10-29-v2');
const DPI = 300, W = 6600, H = 7200;
const finalPath = join(out, 'envitefy-22x24-4-shirts-9in-backs-300dpi-v2.png');
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const assert = (value, message) => { if (!value) throw new Error(message); };
const svgDoc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const image = (buffer, x, y, w, h, mime='image/svg+xml') => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:${mime};base64,${buffer.toString('base64')}"/>`;
async function exists(p) { try { await access(p); return true; } catch { return false; } }
function chunks(buffer) { const list=[];let at=8;while(at+12<=buffer.length){const length=buffer.readUInt32BE(at);list.push({type:buffer.toString('ascii',at+4,at+8),data:buffer.subarray(at+8,at+8+length)});at+=length+12;}return list; }
function bounds(mask, w, h) {
  let x0=w,y0=h,x1=-1,y1=-1,count=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}
  return count ? {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,count}:null;
}

await mkdir(out, {recursive:true});
assert(!await exists(finalPath), 'Final option already exists; refusing to overwrite.');
const originalPath = join(source, 'envitefy-4-shirts-22x36in-300dpi.png');
const originalHash = sha(await readFile(originalPath));
const assets = Object.fromEntries(await Promise.all([
  ['back1','back-01-make-it-a-thing.svg'],['back2','back-02-good-plans-great-people.svg'],['front','front-pocket.svg'],
].map(async ([kind,file]) => [kind,await readFile(join(source,file))])));
const sourceSizes = {back1:[400,505],back2:[400,515],front:[400,310]};
// Nested SVG transforms clipped the symbol in the first option. Render the
// complete front into a standalone raster first; rotate those pixels once.
const frontStandalone = await sharp(assets.front).resize(900,698,{fit:'fill'}).png().toBuffer();
const frontRotated = await sharp(frontStandalone).rotate(90).png().toBuffer();
const frontReferenceAlpha = await sharp(frontRotated).extractChannel('alpha').raw().toBuffer();
const frontReferenceBounds = bounds(frontReferenceAlpha,698,900);
assert(frontReferenceBounds.width===698 && frontReferenceBounds.height===900 && frontReferenceBounds.count>169000,'Complete rotated front reference is missing ink');
const placements = [];
for (const [index,x] of [.25,12.75].entries()) {
  placements.push({name:`back-01-copy-${index+1}`,kind:'back1',xIn:x,yIn:.25,widthIn:9,heightIn:11.3625,rotation:0});
  placements.push({name:`back-02-copy-${index+1}`,kind:'back2',xIn:x,yIn:12.1125,widthIn:9,heightIn:11.5875,rotation:0});
}
for (const [index,y] of [.75,7.25,13.75,20.25].entries()) {
  placements.push({name:`front-pocket-${index+1}`,kind:'front',xIn:9.8375,yIn:y,widthIn:2.325,heightIn:3,rotation:90});
}
for (const p of placements) {
  const [sw,sh]=sourceSizes[p.kind];
  const unrotatedWidth=p.rotation ? p.heightIn:p.widthIn;
  const unrotatedHeight=p.rotation ? p.widthIn:p.heightIn;
  assert(Math.abs(unrotatedWidth/unrotatedHeight-sw/sh)<1e-8,`${p.name}: aspect ratio changed`);
  assert(p.xIn>=.25 && p.yIn>=.25 && p.xIn+p.widthIn<=21.75 && p.yIn+p.heightIn<=23.75,`${p.name}: outside quarter-inch sheet margin`);
}
let minClearance=Infinity;
const pairClearances=[];
for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++) {
  const a=placements[i],b=placements[j];
  const dx=Math.max(0,a.xIn-(b.xIn+b.widthIn),b.xIn-(a.xIn+a.widthIn));
  const dy=Math.max(0,a.yIn-(b.yIn+b.heightIn),b.yIn-(a.yIn+a.heightIn));
  const distance=Math.hypot(dx,dy);
  assert(distance>=.5-1e-8,`${a.name}/${b.name}: less than half-inch rectangle clearance`);
  minClearance=Math.min(minClearance,distance);
  pairClearances.push({a:a.name,b:b.name,clearanceIn:distance});
}
const sheet=Buffer.from(svgDoc(W,H,placements.map(p=>{
  const x=p.xIn*DPI,y=p.yIn*DPI,w=p.widthIn*DPI,h=p.heightIn*DPI;
  if(p.rotation===90)return image(frontRotated,x,y,w,h,'image/png');
  return image(assets[p.kind],x,y,w,h);
}).join('')));
await writeFile(join(out,'envitefy-22x24-source.svg'),sheet);
await sharp(sheet,{limitInputPixels:false}).withMetadata({density:DPI}).png({compressionLevel:9,palette:false}).toFile(finalPath);
const file=await readFile(finalPath);
const metadata=await sharp(file).metadata();
const phys=chunks(file).find(c=>c.type==='pHYs');
assert(metadata.width===W && metadata.height===H && metadata.channels===4 && metadata.hasAlpha && metadata.density===DPI,'Final metadata mismatch');
assert(phys && phys.data.readUInt32BE(0)===11811 && phys.data.readUInt32BE(4)===11811 && phys.data[8]===1,'300 DPI pHYs missing');
const alpha=await sharp(file).extractChannel('alpha').raw().toBuffer();
let transparentPixels=0,opaquePixels=0;
for(const a of alpha){if(a===0)transparentPixels++;if(a===255)opaquePixels++;}
assert(transparentPixels>W*H*.5 && opaquePixels>W*H*.05,'Missing real transparency or artwork');
const edgePx=75;
for(let y=0;y<H;y++)for(const x of [0,edgePx-1,W-edgePx,W-1])assert(alpha[y*W+x]===0,'Side margin contains ink');
for(let x=0;x<W;x++)for(const y of [0,edgePx-1,H-edgePx,H-1])assert(alpha[y*W+x]===0,'Top/bottom margin contains ink');
for(const p of placements){
  const left=Math.floor(p.xIn*DPI),top=Math.floor(p.yIn*DPI),width=Math.ceil((p.xIn+p.widthIn)*DPI)-left,height=Math.ceil((p.yIn+p.heightIn)*DPI)-top;
  const roi=await sharp(file).extract({left,top,width,height}).extractChannel('alpha').raw().toBuffer();
  const box=bounds(roi,width,height);
  assert(box && box.count>20000,`${p.name}: no visible print`);
  p.inkBounds={x:left+box.x,y:top+box.y,width:box.width,height:box.height};p.inkPixels=box.count;
  p.unrotatedPrintWidthIn=p.rotation ? p.heightIn:p.widthIn;
  p.unrotatedPrintHeightIn=p.rotation ? p.widthIn:p.heightIn;
  if(p.kind==='front') {
    assert(Math.abs(box.count/frontReferenceBounds.count-1)<.03,`${p.name}: rotated front lost ink`);
    assert(Math.abs(box.width-698)<=1 && box.height===900,`${p.name}: rotated front bounding box mismatch`);
    let bestMeanAlphaError=Infinity;
    // The source is scaled by half a raster pixel horizontally on the sheet.
    // Compare alpha against the independent complete reference, allowing a
    // one-pixel translation for the fractional SVG placement.
    for(const offsetX of [-1,0,1])for(const offsetY of [-1,0,1]){
      let error=0;
      for(let yy=0;yy<900;yy++)for(let xx=0;xx<698;xx++){
        const tx=xx+offsetX,ty=yy+offsetY;
        const actual=tx>=0&&tx<width&&ty>=0&&ty<height?roi[ty*width+tx]:0;
        error+=Math.abs(actual-frontReferenceAlpha[yy*698+xx]);
      }
      bestMeanAlphaError=Math.min(bestMeanAlphaError,error/(698*900));
    }
    assert(bestMeanAlphaError<2.5,`${p.name}: alpha differs from complete rotated reference`);
    p.frontReferenceInkPixels=frontReferenceBounds.count;
    p.bestMeanAlphaError=bestMeanAlphaError;
  }
}
const previewW=880,previewH=960;
const checker=Buffer.from(svgDoc(previewW,previewH,'<defs><pattern id="checker" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f8f8f8"/><path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#e7e7e7"/></pattern></defs><rect width="100%" height="100%" fill="url(#checker)"/>'));
const small=await sharp(file).resize(previewW,previewH).png().toBuffer();
const previewRaw=await sharp(checker).composite([{input:small}]).png().toBuffer();
const proof=Buffer.from(svgDoc(960,1110,`<rect width="100%" height="100%" fill="#fff"/><text x="480" y="42" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#33272e">2-foot option · 22″ × 24″</text><text x="480" y="75" text-anchor="middle" font-family="Arial" font-size="20" fill="#685961">Four 9″ backs + four 3″ chest logos · 300 DPI</text><image x="40" y="100" width="880" height="960" href="data:image/png;base64,${previewRaw.toString('base64')}"/><text x="480" y="1094" text-anchor="middle" font-family="Arial" font-size="19" fill="#685961">Checkerboard is preview only. Upload PNG is fully transparent.</text>`));
const previewPng=join(out,'envitefy-22x24-preview-v2.png');
const previewWebp=join(out,'envitefy-22x24-preview-v2.webp');
await sharp(proof).png().toFile(previewPng);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',previewPng,'-c:v','libwebp','-quality','85','-compression_level','6',previewWebp],{stdio:'pipe'});
const previewMeta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height','-of','json',previewWebp],{encoding:'utf8'}));
assert(previewMeta.streams[0].codec_name==='webp' && previewMeta.streams[0].width===960 && previewMeta.streams[0].height===1110,'WebP preview metadata mismatch');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',previewWebp,'-f','null','-'],{stdio:'pipe'});
await unlink(previewPng);
assert(!await exists(previewPng) && await exists(previewWebp),'Preview PNG cleanup failed');
assert(sha(await readFile(originalPath))===originalHash,'Original 22×36 print sheet was modified');
const report={file:finalPath,version:2,fix:'Complete front rasterized independently before 90-degree rotation to avoid nested SVG clipping',width:W,height:H,dpi:DPI,physicalWidthIn:22,physicalHeightIn:24,format:metadata.format,channels:metadata.channels,hasAlpha:metadata.hasAlpha,pHYs:{x:11811,y:11811,unit:1},printCounts:{back1:2,back2:2,front:4,total:8},backScaleFromOriginal:9/10.5,originalBackWidthIn:10.5,newBackWidthIn:9,frontSizeUnchanged:true,frontReferenceInkPixels:frontReferenceBounds.count,frontReferenceBounds,minRectangleClearanceIn:minClearance,edgeMarginIn:.25,transparentPixels,opaquePixels,placements,pairClearances,sha256:sha(file),bytes:file.length,originalSheetSha256:originalHash,preview:previewWebp};
await writeFile(join(out,'layout-and-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:finalPath,preview:previewWebp,width:W,height:H,dpi:DPI,printCounts:report.printCounts,minRectangleClearanceIn:minClearance,backScale:report.backScaleFromOriginal,transparentPercent:100*transparentPixels/(W*H),bytes:file.length},null,2));
