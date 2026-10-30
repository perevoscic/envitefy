import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';

const root=process.cwd(),out=path.join(root,'output/merch/gymnastics-charcoal-large-back-2026-10-30');
const source=path.join(out,'gymnastics-charcoal-back-12x16.27in-300dpi.png');
const final=path.join(out,'gymnastics-charcoal-22x24-one-back-draft-QR-placeholder-300dpi.png');
try{await fs.access(final);throw new Error('Draft sheet exists; refusing to overwrite.');}catch(e){if(e.code!=='ENOENT')throw e;}
const assert=(v,m)=>{if(!v)throw new Error(m);},hash=b=>createHash('sha256').update(b).digest('hex');
const original=await fs.readFile(source),originalHash=hash(original);
const sm=await sharp(original).metadata();assert(sm.width===3600&&sm.height===4880&&sm.density===300&&sm.channels===4&&sm.hasAlpha,'Unexpected standalone source');
const src=await sharp(original).ensureAlpha().raw().toBuffer();
const W=6600,H=7200,left=1500,top=1160;
const sheet=Buffer.alloc(W*H*4);
for(let y=0;y<sm.height;y++)src.copy(sheet,((top+y)*W+left)*4,y*sm.width*4,(y+1)*sm.width*4);
await sharp(sheet,{raw:{width:W,height:H,channels:4}}).withMetadata({density:300}).png({compressionLevel:9,palette:false}).toFile(final);
const fm=await sharp(final).metadata();assert(fm.width===W&&fm.height===H&&fm.density===300&&fm.channels===4&&fm.hasAlpha,'Draft sheet metadata failed');
const roi=await sharp(final).extract({left,top,width:sm.width,height:sm.height}).ensureAlpha().raw().toBuffer();
assert(roi.equals(src),'Embedded back pixels differ from standalone artwork');
const alpha=await sharp(final).extractChannel('alpha').raw().toBuffer();let outsideInk=0,opaque=0,transparent=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=alpha[y*W+x];if(a){opaque++;if(x<left||x>=left+sm.width||y<top||y>=top+sm.height)outsideInk++;}else transparent++;}
assert(outsideInk===0&&opaque>0&&transparent>0,'Sheet has extra ink outside the one source image or missing transparency');
const qr=await sharp(final).extract({left:left+304,top:top+3692,width:896,height:896}).flatten({background:'#67615b'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decoded=jsQR(new Uint8ClampedArray(qr.data),qr.info.width,qr.info.height,{inversionAttempts:'dontInvert'});
assert(decoded?.data==='https://envitefy.com/gymnastics#preview','Draft sheet QR placeholder did not decode');
assert(hash(await fs.readFile(source))===originalHash,'Standalone source changed');
const temp=path.join(out,'one-back-sheet-preview-temp.png'),preview=path.join(out,'22x24-one-back-draft-sheet-preview.webp');
await sharp(final).resize(1100,1200).flatten({background:'#67615b'}).png().toFile(temp);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',temp,'-c:v','libwebp','-quality','85','-compression_level','6',preview],{stdio:'pipe'});
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',preview,'-f','null','-'],{stdio:'pipe'});
await fs.unlink(temp);
const report={created:'2026-10-30',status:'Draft transfer canvas only: demo QR placeholder must be replaced before printing',counts:{back:1,front:0},canvas:{widthPx:W,heightPx:H,dpi:300,widthIn:22,heightIn:24,channels:4,hasAlpha:true},embeddedBack:{source,widthPx:sm.width,heightPx:sm.height,widthIn:12,heightIn:4880/300,leftPx:left,topPx:top,leftIn:left/300,topIn:top/300,centeredHorizontally:true,centeredVertically:true,sourceFileSha256:originalHash,sourceDecodedRgbaSha256:hash(src),embeddedDecodedRgbaSha256:hash(roi),exactRgbaMatch:true},transparency:{outsideEmbeddedImageInkPixels:outsideInk,nonzeroAlphaPixels:opaque,zeroAlphaPixels:transparent},qr:{placeholder:true,destination:decoded.data,standardNonInvertedDecode:true,replaceBeforePrinting:true},files:{draftSheetPng:final,mattePreviewWebp:preview,standaloneBackPng:source},originalSourceUnchanged:true,script:'scripts/build-charcoal-one-back-draft-sheet.mjs'};
await fs.writeFile(path.join(out,'one-back-draft-sheet-verification.json'),JSON.stringify(report,null,2));
const parentReport=path.join(out,'large-back-and-planning-verification.json');const r=JSON.parse(await fs.readFile(parentReport,'utf8'));r.oneBackDraftTransferSheet=report;await fs.writeFile(parentReport,JSON.stringify(r,null,2));
console.log(JSON.stringify(report,null,2));
