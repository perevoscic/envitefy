import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const root = process.cwd();
const out = path.join(root, 'output/merch/gymnastics-meet-shirt-2026-10-30');
await fs.mkdir(out, {recursive:true});
const plum = '#98153f', coral = '#f24772', cream = '#f8f1e7';
const target = 'https://envitefy.com/gymnastics#preview';
const doc = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const img = (buffer,x,y,w,h) => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${buffer.toString('base64')}"/>`;
const text = (t,x,y,size,weight=700,anchor='start',fill=plum) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${t}</text>`;

async function headline(words,color) {
  const buffer = await sharp({text:{text:`<span foreground="${color}">${words}</span>`,font:'Anton 100',fontfile:path.join(root,'public/fonts/birthday/anton.ttf'),rgba:true,dpi:144}}).trim().png().toBuffer();
  return {buffer,...await sharp(buffer).metadata()};
}
const h1 = await headline('LESS SEARCHING.',plum);
const h2 = await headline('MORE CHEERING.',coral);
const logoSource = path.join(root,'public/brand/wordmark-v2/envitefy-wordmark.webp');
const logo = await sharp(await fs.readFile(logoSource)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<logo.data.length;i+=4){logo.data[i]=0x98;logo.data[i+1]=0x15;logo.data[i+2]=0x3f;}
const logoBuffer = await sharp(logo.data,{raw:{width:logo.info.width,height:logo.info.height,channels:4}}).png().toBuffer();
const logoWidth=290, logoHeight=logoWidth*logo.info.height/logo.info.width;

const qr = QRCode.create(target,{errorCorrectionLevel:'H'});
const quiet=4,n=qr.modules.size,total=n+quiet*2;
let qrPath='';
for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.modules.get(y,x))qrPath+=`M${x+quiet},${y+quiet}h1v1h-1z`;
const qrSvg=doc(total,total,`<path d="${qrPath}" fill="${plum}"/>`);
const qrReference = await sharp(Buffer.from(qrSvg)).resize(total*10,total*10,{kernel:'nearest'}).flatten({background:cream}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const qrDecoded = jsQR(new Uint8ClampedArray(qrReference.data),qrReference.info.width,qrReference.info.height);
if(qrDecoded?.data!==target)throw new Error('QR reference did not decode to exact destination');

const ruleRows = (x,y,width,count,step=14) => Array.from({length:count},(_,i)=>`<path d="M${x},${y+i*step}h${width-(i%4)*16}" stroke="${plum}" stroke-width="3"/>`).join('');
const paper = `<g fill="none" stroke="${plum}" stroke-width="5" stroke-linejoin="round">
  <path d="M83 344H315V646H83Z"/>
  <path d="M95 332H327V634"/>
  <path d="M107 320H298L339 361V622H107Z"/>
  <path d="M298 320V361H339" stroke="${coral}"/>
</g>${text('MEET PACKET',128,397,24)}${ruleRows(128,425,187,7,15)}
${text('SCHEDULE',128,558,18)}${ruleRows(128,578,187,3,14)}`;
const phone = `<g fill="none" stroke="${plum}" stroke-width="7">
  <rect x="556" y="306" width="246" height="357" rx="31"/>
  <path d="M641 324H716" stroke-width="5" stroke-linecap="round"/>
  <path d="M649 645H709" stroke-width="5" stroke-linecap="round"/>
</g>${text('MEET PAGE',580,382,25)}
<path d="M580 404H778" stroke="${coral}" stroke-width="4"/>
<g fill="none" stroke="${plum}" stroke-width="3">
  <rect x="578" y="425" width="200" height="54" rx="10"/>
  <rect x="578" y="494" width="200" height="54" rx="10"/>
  <rect x="578" y="563" width="200" height="54" rx="10"/>
  <path d="M590 441v21m-8-14h16M589 509c-9 0-10 8 0 18 10-10 9-18 0-18zM581 585l8-8 8 8-8 8z"/>
</g>${text('Sessions',611,458,22)}${text('Directions',611,527,22)}${text('Updates',611,596,22)}`;
const arrow = `<path d="M390 484H500M467 451L500 484L467 517" fill="none" stroke="${coral}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`;
const qrSize=212,qrX=(900-qrSize)/2,qrY=904;
const body = `${img(h1.buffer,50,38,800,800*h1.height/h1.width)}
${img(h2.buffer,50,163,800,800*h2.height/h2.width)}
${paper}${phone}${arrow}
${text('Session times · Directions · Meet updates',450,729,25,700,'middle')}
${img(logoBuffer,(900-logoWidth)/2,779,logoWidth,logoHeight)}
<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${total} ${total}"><path d="${qrPath}" fill="${plum}"/></svg>
${text('SEE A SAMPLE MEET',450,1152,25,700,'middle')}
${text('envitefy.com/gymnastics',450,1189,25,700,'middle')}`;
const art = doc(900,1220,body);
const artPath=path.join(out,'gymnastics-meet-back-concept.svg');
await fs.writeFile(artPath,art);
await fs.writeFile(path.join(out,'sample-meet-qr.svg'),qrSvg);

const flatPng = path.join(out,'gymnastics-meet-back-concept-flat.png');
const previewPng = path.join(out,'gymnastics-meet-back-concept-preview.png');
const flatWebp=path.join(out,'gymnastics-meet-back-concept-flat.webp');
const previewWebp=path.join(out,'gymnastics-meet-back-concept-preview.webp');
await sharp(Buffer.from(art)).resize(1800,2440).png().toFile(flatPng);
await sharp(Buffer.from(art)).resize(1800,2440).flatten({background:cream}).png().toFile(previewPng);
for(const [source,dest]of [[flatPng,flatWebp],[previewPng,previewWebp]]) {
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});
  const meta=await sharp(dest).metadata();
  if(meta.format!=='webp'||meta.width!==1800||meta.height!==2440)throw new Error('WebP metadata mismatch');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});
}
const finalPixels=await sharp(previewWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const finalDecoded=jsQR(new Uint8ClampedArray(finalPixels.data),finalPixels.info.width,finalPixels.info.height);
if(finalDecoded?.data!==target)throw new Error('Final flat-art WebP QR did not decode to exact destination');
await fs.unlink(flatPng);await fs.unlink(previewPng);
const note={created:'2026-10-30',type:'deterministic SVG artwork concept for photographic mockup reference',physicalReference:{widthIn:9,heightIn:12.2},colors:{plum,coral,cream},frontBranding:'Existing original-gradient front logo remains separate; not modified by this concept',backBranding:'Canonical lowercase wordmark alpha tinted uniformly to #98153f; original glyph alpha preserved',wordmarkSource:path.relative(root,logoSource),headingFont:'public/fonts/birthday/anton.ttf',qr:{destination:target,errorCorrection:'H',modules:n,quietZoneModules:quiet,referenceDecoded:true,finalFlatWebpDecoded:true},files:{editableSvg:artPath,transparentWebp:flatWebp,creamReferenceWebp:previewWebp},generator:'scripts/build-gymnastics-meet-shirt-concept.mjs',generationMethod:'Local deterministic composition; no AI generation'};
await fs.writeFile(path.join(out,'concept-provenance.json'),JSON.stringify(note,null,2));
console.log(JSON.stringify(note,null,2));
