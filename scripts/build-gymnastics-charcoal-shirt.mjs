import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';

const root=process.cwd(),out=path.join(root,'output/merch/gymnastics-charcoal-shirt-2026-10-30');
const source=path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30-v4/gymnastics-meet-upload-live-v4-placeholder.svg');
await fs.mkdir(out,{recursive:true});
const palette={garment:'#67615b',main:'#fff3e7',accent:'#ff6688'};
const qrInk='#182d48';
const target='https://envitefy.com/gymnastics#preview',assert=(v,m)=>{if(!v)throw new Error(m);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceBytes=await fs.readFile(source),sourceHash=hash(sourceBytes),originalSvg=sourceBytes.toString('utf8');
const sourceImages=[...originalSvg.matchAll(/<image\b[^>]*href="data:image\/png;base64,([^"]+)"[^>]*\/>/g)];
assert(sourceImages.length===3,'Expected two headline PNG inserts and the canonical wordmark');
const originalCopy=[...originalSvg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
assert(['Meet details','Registration','Hotels','Meet details · Registration · Hotels.','SEE TODAY’S MEET'].every(x=>originalCopy.includes(x)),'V4 source copy mismatch');
let svg=originalSvg.replace(/#98153f/gi,palette.main).replace(/#f24772/gi,palette.accent);
const imageChecks=[];
for(let i=0;i<sourceImages.length;i++){
  const src=sourceImages[i],{data,info}=await sharp(Buffer.from(src[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const color=i===1?palette.accent:palette.main;
  const rgb=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16)];
  const alpha=Buffer.alloc(data.length/4);let visible=0;
  for(let k=0;k<alpha.length;k++){alpha[k]=data[k*4+3];if(alpha[k])visible++;data[k*4]=rgb[0];data[k*4+1]=rgb[1];data[k*4+2]=rgb[2];}
  const png=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  const check=await sharp(png).ensureAlpha().raw().toBuffer();
  for(let k=0;k<alpha.length;k++){assert(check[k*4+3]===alpha[k],'Embedded source alpha changed');if(alpha[k])assert(check[k*4]===rgb[0]&&check[k*4+1]===rgb[1]&&check[k*4+2]===rgb[2],'Embedded tint has incorrect visible RGB');}
  const revised=src[0].replace(/href="data:image\/png;base64,[^"]+"/,`href="data:image/png;base64,${png.toString('base64')}"`);
  assert(svg.includes(src[0]),'Source image node is missing');svg=svg.replace(src[0],revised);
  imageChecks.push({role:i===0?'UPLOAD A PDF.':i===1?'GET A LIVE PAGE.':'Canonical Envitefy wordmark',uniformInk:color,alphaPreserved:true,visiblePixels:visible});
}
const qrMatch=svg.match(/<svg x="76" y="923" width="224" height="224" viewBox="0 0 45 45">[\s\S]*?<\/svg>/);
assert(qrMatch,'V4 QR node missing');
const qrNode=qrMatch[0].replace(/(<svg[^>]+>)/,`$1<rect width="45" height="45" fill="${palette.main}"/>`).replace(/(<path d="[^"]+" fill=")[^"]+("\/\>)/,`$1${qrInk}$2`);
svg=svg.replace(qrMatch[0],qrNode);
assert(JSON.stringify([...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]))===JSON.stringify(originalCopy),'Artwork copy changed');
const svgPath=path.join(out,'gymnastics-charcoal-back.svg');await fs.writeFile(svgPath,svg);
const flatWebp=path.join(out,'gymnastics-charcoal-back-flat.webp'),referenceWebp=path.join(out,'gymnastics-charcoal-back-reference.webp');
const renderSvg=svg.replace('width="900" height="1220"','width="1800" height="2440"');
async function exportWebp(temp,dest,background){let s=sharp(Buffer.from(renderSvg));if(background)s=s.flatten({background});await s.png().toFile(temp);execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',temp,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});const m=await sharp(dest).metadata();assert(m.format==='webp'&&m.width===1800&&m.height===2440,'WebP dimensions/format mismatch');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});await fs.unlink(temp);return m;}
const flatMeta=await exportWebp(path.join(out,'charcoal-flat-temp.png'),flatWebp);
await exportWebp(path.join(out,'charcoal-reference-temp.png'),referenceWebp,palette.garment);
assert(flatMeta.hasAlpha,'Flat WebP lost transparency');
const printPng=path.join(out,'gymnastics-charcoal-back-9x12.2in-300dpi.png');
const printSvg=svg.replace('width="900" height="1220"','width="2700" height="3660"');
await sharp(Buffer.from(printSvg)).withMetadata({density:300}).png({compressionLevel:9,palette:false}).toFile(printPng);
const printMeta=await sharp(printPng).metadata(),alphaStats=await sharp(printPng).extractChannel('alpha').stats();
assert(printMeta.width===2700&&printMeta.height===3660&&printMeta.channels===4&&printMeta.hasAlpha&&printMeta.density===300,'Print PNG metadata mismatch');
assert(alphaStats.channels[0].min===0&&alphaStats.channels[0].max===255,'Print PNG alpha range mismatch');
const pixels=await sharp(referenceWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const qrReference=jsQR(new Uint8ClampedArray(pixels.data),pixels.info.width,pixels.info.height,{inversionAttempts:'dontInvert'});
assert(qrReference?.data===target,'Reference QR failed standard non-inverted decode');
const printPixels=await sharp(printPng).flatten({background:palette.garment}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const qrPrint=jsQR(new Uint8ClampedArray(printPixels.data),printPixels.info.width,printPixels.info.height,{inversionAttempts:'dontInvert'});
assert(qrPrint?.data===target,'Print PNG QR failed standard non-inverted decode');
assert(hash(await fs.readFile(source))===sourceHash,'Original V4 source changed');
const report={created:'2026-10-30',status:'Warm charcoal garment concept; QR remains the authorized demo placeholder and must be replaced before printing',source:path.relative(root,source),originalSourceSha256:sourceHash,originalPreserved:true,palette,garmentColorMeaning:'Approximate concept reference; parent uses the user supplied warm-charcoal shirt photo',copy:{headline:['UPLOAD A PDF.','GET A LIVE PAGE.'],phoneRows:['Meet details','Registration','Hotels'],summary:'Meet details · Registration · Hotels.',qrCaption:'SEE TODAY’S MEET'},embeddedImageChecks:imageChecks,wordmarkMatchesMainInk:true,frontBranding:'Existing original-gradient front branding remains separate and unchanged',qr:{placeholder:true,destination:target,modulesInk:qrInk,quietZoneBacking:palette.main,quietZoneModules:4,referenceNonInvertedDecoded:true,printPngNonInvertedDecoded:true},print:{widthPx:2700,heightPx:3660,dpi:300,widthIn:9,heightIn:12.2,channels:4,hasAlpha:true,alphaMin:0,alphaMax:255,pngRetainedByExplicitRequest:true},files:{svg:svgPath,transparentWebp:flatWebp,charcoalReferenceWebp:referenceWebp,downloadPng:printPng},script:'scripts/build-gymnastics-charcoal-shirt.mjs'};
await fs.writeFile(path.join(out,'charcoal-colorway-and-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
