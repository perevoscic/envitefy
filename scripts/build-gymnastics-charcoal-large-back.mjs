import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';

const root=process.cwd(),out=path.join(root,'output/merch/gymnastics-charcoal-large-back-2026-10-30');
const source=path.join(root,'output/merch/gymnastics-charcoal-shirt-2026-10-30/gymnastics-charcoal-back.svg');
const frontSource=path.join(root,'output/merch/gang-sheet-22x36-2026-10-29-v3/front-pocket.svg');
const assert=(v,m)=>{if(!v)throw new Error(m);},hash=b=>createHash('sha256').update(b).digest('hex');
const target='https://envitefy.com/gymnastics#preview',garment='#67615b';
await fs.mkdir(out,{recursive:true});
const bytes=await fs.readFile(source),sourceHash=hash(bytes),svg=bytes.toString('utf8');
const printPng=path.join(out,'gymnastics-charcoal-back-12x16.27in-300dpi.png');
try{await fs.access(printPng);throw new Error('Large back print already exists; refusing to overwrite.');}catch(e){if(e.code!=='ENOENT')throw e;}
const copy=path.join(out,'gymnastics-charcoal-large-back-source.svg');
await fs.writeFile(copy,bytes);
assert(hash(await fs.readFile(copy))===sourceHash,'Copied source contents changed');
const printSvg=svg.replace('width="900" height="1220"','width="3600" height="4880"');
await sharp(Buffer.from(printSvg)).withMetadata({density:300}).png({compressionLevel:9,palette:false}).toFile(printPng);
const m=await sharp(printPng).metadata();
assert(m.width===3600&&m.height===4880&&m.density===300&&m.channels===4&&m.hasAlpha,'Large print PNG metadata failed');
const alpha=await sharp(printPng).extractChannel('alpha').raw().toBuffer();
let x0=m.width,y0=m.height,x1=-1,y1=-1,ink=0,zero=0;
for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){if(alpha[y*m.width+x]){ink++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}else zero++;}
assert(ink>0&&zero>0,'Large print has no artwork or no transparency');
const actualBounds={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,widthIn:(x1-x0+1)/300,heightIn:(y1-y0+1)/300};
const referencePng=path.join(out,'charcoal-large-reference-temp.png'),referenceWebp=path.join(out,'gymnastics-charcoal-large-back-reference.webp');
await sharp(printPng).resize(1800,2440).flatten({background:garment}).png().toFile(referencePng);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',referencePng,'-c:v','libwebp','-quality','85','-compression_level','6',referenceWebp],{stdio:'pipe'});
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',referenceWebp,'-f','null','-'],{stdio:'pipe'});
const rm=await sharp(referenceWebp).metadata();assert(rm.format==='webp'&&rm.width===1800&&rm.height===2440,'Reference dimensions/format mismatch');
const qrCrop=await sharp(printPng).extract({left:304,top:3692,width:896,height:896}).flatten({background:garment}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const printQr=jsQR(new Uint8ClampedArray(qrCrop.data),qrCrop.info.width,qrCrop.info.height,{inversionAttempts:'dontInvert'});
assert(printQr?.data===target,'Final print PNG QR crop failed standard decode');
const ref=await sharp(referenceWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const refQr=jsQR(new Uint8ClampedArray(ref.data),ref.info.width,ref.info.height,{inversionAttempts:'dontInvert'});
assert(refQr?.data===target,'Reference QR failed standard decode');
await fs.unlink(referencePng);
console.log(JSON.stringify({standaloneReady:true,printPng,referenceWebp,physicalSizeIn:[12,4880/300],visibleBounds:actualBounds}));

const frontBytes=await fs.readFile(frontSource),frontHash=hash(frontBytes);
const front=await sharp(frontBytes).resize(900,698,{fit:'fill'}).png().toBuffer();
const backImage=await fs.readFile(printPng);
const doc=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${b}</svg>`;
const img=(b,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${b.toString('base64')}"/>`;
const s=40,sx=130,sy=200;
const backPlace={xIn:5,yIn:1,widthIn:12,heightIn:4880/300};
const optionalFront={xIn:9.5,yIn:18,widthIn:3,heightIn:698/300,optional:true};
const gap=optionalFront.yIn-backPlace.yIn-backPlace.heightIn;
assert(gap>=.5&&backPlace.xIn+backPlace.widthIn<=22&&optionalFront.yIn+optionalFront.heightIn<=24,'Planning arrangement does not fit');
const plan=doc(1140,1290,`<rect width="1140" height="1290" fill="#fbf8f4"/>
<text x="570" y="48" text-anchor="middle" font-family="Arial" font-size="33" font-weight="700" fill="#302a30">22″ × 24″ · one larger back print</text>
<text x="570" y="88" text-anchor="middle" font-family="Arial" font-size="24" fill="#61575c">12″ × 16.27″ back + optional 3″ pocket logo</text>
<text x="570" y="125" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#98153f">PLANNING PREVIEW ONLY · NOT AN UPLOAD FILE</text>
<path d="M130 176H1010M130 169V183M1010 169V183" fill="none" stroke="#76666d" stroke-width="1.4"/><text x="570" y="166" text-anchor="middle" font-family="Arial" font-size="22" fill="#61575c">22″ wide</text>
<path d="M89 200V1160M82 200H96M82 1160H96" fill="none" stroke="#76666d" stroke-width="1.4"/><text x="66" y="680" text-anchor="middle" transform="rotate(-90 66 680)" font-family="Arial" font-size="22" fill="#61575c">24″ high</text>
<rect x="130" y="200" width="880" height="960" fill="${garment}" stroke="#504b47" stroke-width="1"/>
${img(backImage,sx+5*s,sy+1*s,12*s,(4880/300)*s)}
${img(front,sx+9.5*s,sy+18*s,3*s,(698/300)*s)}
<text x="570" y="1042" text-anchor="middle" font-family="Arial" font-size="16" fill="#fff3e7">Optional pocket logo</text>
<text x="570" y="1202" text-anchor="middle" font-family="Arial" font-size="20" fill="#61575c">The standalone download contains one back design only.</text>
<text x="570" y="1237" text-anchor="middle" font-family="Arial" font-size="18" fill="#61575c">The pocket logo is shown as an optional use of remaining sheet space.</text>
<text x="570" y="1270" text-anchor="middle" font-family="Arial" font-size="17" fill="#61575c">Dark matte is for viewing; the transfer artwork itself is transparent.</text>`);
const planSvg=path.join(out,'22x24-one-large-back-planning.svg'),planPng=path.join(out,'22x24-one-large-back-planning-preview.png'),planWebp=path.join(out,'22x24-one-large-back-planning-preview.webp');
await fs.writeFile(planSvg,plan);await sharp(Buffer.from(plan)).png().toFile(planPng);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',planPng,'-c:v','libwebp','-quality','85','-compression_level','6',planWebp],{stdio:'pipe'});
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',planWebp,'-f','null','-'],{stdio:'pipe'});
assert(hash(await fs.readFile(source))===sourceHash&&hash(await fs.readFile(frontSource))===frontHash,'Original sources changed');
const report={created:'2026-10-30',source,sourceSha256:sourceHash,copiedSvgContentsUnchanged:true,originalsUnchanged:true,artworkContentChanged:false,palette:{main:'#fff3e7',accent:'#ff6688',referenceGarment:garment},print:{widthPx:3600,heightPx:4880,dpi:300,widthIn:12,heightIn:4880/300,channels:4,hasAlpha:true,inkPixels:ink,transparentPixels:zero,actualVisibleInkBounds:actualBounds,standaloneBackCount:1,frontLogoIncluded:false},qr:{placeholder:true,destination:target,ink:'#182d48',quietZoneBacking:'#fff3e7',printPngQrCropNonInvertedDecoded:true,referenceWebpNonInvertedDecoded:true,replaceBeforePrinting:true},frontLogo:'Original gradient front remains separate; optional planning preview only',planning:{status:'Planning preview only; not a production upload sheet',sheetIn:[22,24],backPlace,optionalFront,verticalGapIn:gap,actualProduction22x24SheetCreated:false},files:{copiedSourceSvg:copy,standalonePrintPng:printPng,referenceWebp,planningSvg:planSvg,planningPreviewPng:planPng,planningPreviewWebp:planWebp},script:'scripts/build-gymnastics-charcoal-large-back.mjs'};
await fs.writeFile(path.join(out,'large-back-and-planning-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
