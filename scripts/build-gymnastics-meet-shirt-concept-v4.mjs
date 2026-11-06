import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const root=process.cwd(),out=path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30-v4');
await fs.mkdir(out,{recursive:true});
const plum='#98153f',coral='#f24772',cream='#f8f1e7';
const target='https://envitefy.com/gymnastics#preview';
const name='gymnastics-meet-upload-live-v4-placeholder';
const svgPath=path.join(out,`${name}.svg`);
try{await fs.access(svgPath);throw new Error('V4 artwork exists; refusing to overwrite.');}catch(e){if(e.code!=='ENOENT')throw e;}
const img=(b,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${b.toString('base64')}"/>`;
const text=(t,x,y,s,w=700,a='start',c=plum)=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${s}" font-weight="${w}" text-anchor="${a}" fill="${c}">${t}</text>`;
async function heading(t,color){const buffer=await sharp({text:{text:`<span foreground="${color}">${t}</span>`,font:'Anton 100',fontfile:path.join(root,'public/fonts/birthday/anton.ttf'),rgba:true,dpi:144}}).trim().png().toBuffer();return {buffer,...await sharp(buffer).metadata()};}
const h1=await heading('UPLOAD A PDF.',plum),h2=await heading('GET A LIVE PAGE.',coral);
const hScale=820/Math.max(h1.width,h2.width);
const logoSource=path.join(root,'public/brand/wordmark-v2/envitefy-wordmark.webp');
const logo=await sharp(await fs.readFile(logoSource)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<logo.data.length;i+=4){logo.data[i]=0x98;logo.data[i+1]=0x15;logo.data[i+2]=0x3f;}
let visibleLogoPixels=0;
for(let i=0;i<logo.data.length;i+=4)if(logo.data[i+3]){visibleLogoPixels++;if(logo.data[i]!==0x98||logo.data[i+1]!==0x15||logo.data[i+2]!==0x3f)throw new Error('Back logo is not uniform plum');}
const logoPng=await sharp(logo.data,{raw:{width:logo.info.width,height:logo.info.height,channels:4}}).png().toBuffer();
const qr=QRCode.create(target,{errorCorrectionLevel:'H'}),quiet=4,n=qr.modules.size,total=n+quiet*2;
let qrPath='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.modules.get(y,x))qrPath+=`M${x+quiet},${y+quiet}h1v1h-1z`;
const qrStandalone=`<svg xmlns="http://www.w3.org/2000/svg" width="${total*10}" height="${total*10}" viewBox="0 0 ${total} ${total}"><path d="${qrPath}" fill="${plum}"/></svg>`;
const qrReference=await sharp(Buffer.from(qrStandalone)).flatten({background:cream}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decodedReference=jsQR(new Uint8ClampedArray(qrReference.data),qrReference.info.width,qrReference.info.height);
if(decodedReference?.data!==target)throw new Error('QR reference did not decode');

const paper=`<g transform="rotate(-7 224 564)">
  <g fill="none" stroke="${plum}" stroke-width="6" stroke-linejoin="round"><path d="M92 369H291L348 426V742H92Z"/><path d="M291 369V426H348" stroke="${coral}"/></g>
  ${text('MEET PACKET',220,460,22,700,'middle')}
  ${text('PDF',220,558,90,900,'middle')}
  <path d="M127 587H312 M127 605H289 M127 623H302" stroke="${plum}" stroke-width="3"/>
  <circle cx="220" cy="685" r="34" fill="none" stroke="${plum}" stroke-width="5"/>
  <path d="M220 706V665 M204 681L220 665L236 681" fill="none" stroke="${coral}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;
const gymnast=`<g transform="translate(571 444) scale(.57)">
  <circle cx="70" cy="5" r="10" fill="${plum}"/><circle cx="76" cy="-7" r="5" fill="${plum}"/>
  <path d="M62 17C72 14 82 17 87 29L100 51L87 62L72 45L61 31Z" fill="${plum}"/>
  <path d="M76 21C95 8 113-4 132-9 M65 21C49 9 37 3 23 5 M94 56C120 46 145 40 168 40L183 35 M82 54C59 62 37 80-2 99L-17 100" fill="none" stroke="${plum}" stroke-width="9" stroke-linecap="round"/>
  <path d="M76 32L86 48L80 51L70 38Z" fill="${coral}"/>
</g>`;
const phoneIcons=`<g fill="none" stroke="${plum}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
  <g id="meet-details-calendar-icon"><rect x="537" y="569" width="22" height="23" rx="3"/><path d="M537 577H559 M543 565V572 M553 565V572"/><path d="M542 582h2 M548 582h2 M554 582h1 M542 587h2 M548 587h2" stroke-width="2"/></g>
  <g id="registration-check-card-icon"><rect x="537" y="640" width="23" height="26" rx="3"/><path d="M543 647H554 M542 656L546 660L555 652"/></g>
  <g id="hotel-bed-icon"><path d="M537 710V736 M537 727H561V736 M537 720H557Q561 720 561 724V727"/><rect x="541" y="714" width="8" height="6" rx="2"/></g>
</g>`;
const phone=`<g fill="none" stroke="${plum}" stroke-width="8"><rect x="495" y="315" width="324" height="485" rx="37"/><path d="M611 335H703" stroke-width="5" stroke-linecap="round"/><path d="M620 781H694" stroke-width="5" stroke-linecap="round"/></g>
${text('LIVE MEET',657,393,32,800,'middle')}
${gymnast}<path d="M545 512H770" stroke="${coral}" stroke-width="9" stroke-linecap="round"/>
<path d="M579 517L573 534 M737 517L743 534" stroke="${plum}" stroke-width="4"/>
<g fill="none" stroke="${plum}" stroke-width="3"><rect x="525" y="553" width="264" height="57" rx="10"/><rect x="525" y="625" width="264" height="57" rx="10"/><rect x="525" y="697" width="264" height="57" rx="10"/></g>
${phoneIcons}${text('Meet details',575,590,25)}${text('Registration',575,662,25)}${text('Hotels',575,734,25)}
<path d="M753 573L764 582L753 591 M753 645L764 654L753 663 M753 717L764 726L753 735" fill="none" stroke="${coral}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
const arrow=`<path d="M367 536H452M427 511L452 536L427 561" fill="none" stroke="${coral}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`;
const lw=355,lh=lw*logo.info.height/logo.info.width;
const qrSize=224;
const body=`${img(h1.buffer,(900-h1.width*hScale)/2,40,h1.width*hScale,h1.height*hScale)}
${img(h2.buffer,(900-h2.width*hScale)/2,170,h2.width*hScale,h2.height*hScale)}
<g transform="translate(45 65) scale(.9)">${paper}${phone}${arrow}</g>
${text('Meet details · Registration · Hotels.',450,861,25,700,'middle')}
<svg x="76" y="923" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${total} ${total}"><path d="${qrPath}" fill="${plum}"/></svg>
${img(logoPng,421,963,lw,lh)}
${text('SEE TODAY’S MEET',188,1181,23,700,'middle')}
${text('envitefy.com/gymnastics',600,1130,24,700,'middle')}`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1220" viewBox="0 0 900 1220">${body}</svg>`;
await fs.writeFile(svgPath,svg);
const flatPng=path.join(out,`${name}-flat.png`),previewPng=path.join(out,`${name}-preview.png`),flatWebp=path.join(out,`${name}-flat.webp`),previewWebp=path.join(out,`${name}-preview.webp`);
await sharp(Buffer.from(svg)).resize(1800,2440).png().toFile(flatPng);
await sharp(Buffer.from(svg)).resize(1800,2440).flatten({background:cream}).png().toFile(previewPng);
for(const[source,dest]of[[flatPng,flatWebp],[previewPng,previewWebp]]){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});const m=await sharp(dest).metadata();if(m.format!=='webp'||m.width!==1800||m.height!==2440)throw new Error('WebP metadata mismatch');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});}
const flatMeta=await sharp(flatWebp).metadata(),flatAlpha=await sharp(flatWebp).extractChannel('alpha').stats();
if(!flatMeta.hasAlpha||flatAlpha.channels[0].min!==0||flatAlpha.channels[0].max!==255)throw new Error('Transparent flat-art alpha verification failed');
const pixels=await sharp(previewWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decodedFinal=jsQR(new Uint8ClampedArray(pixels.data),pixels.info.width,pixels.info.height);
if(decodedFinal?.data!==target)throw new Error('Final preview QR failed decode or encoded wrong target');
await fs.unlink(flatPng);await fs.unlink(previewPng);
const note={created:'2026-10-30',status:'DRAFT CONCEPT ONLY: demo QR placeholder; replace with actual meet URL before printing',concept:'Upload a PDF and get a live page',headline:['UPLOAD A PDF.','GET A LIVE PAGE.'],phoneRows:['Meet details','Registration','Hotels'],phoneIcons:['Calendar','Checked registration card','Hotel bed'],summary:'Meet details · Registration · Hotels.',arrangement:'Tilted PDF file with upload-arrow badge feeds a larger phone; gymnast and beam integrated within phone illustration; QR-left and brand-right footer',physicalReference:{widthIn:9,heightIn:12.2},colors:{plum,coral,cream},wordmark:{source:path.relative(root,logoSource),originalAlphaPreserved:true,visiblePixelsChecked:visibleLogoPixels,uniformTint:plum},frontBranding:'Original gradient front logo remains separate and unchanged',qr:{placeholder:true,actualMeetUrlPending:true,destination:target,caption:'SEE TODAY’S MEET',quietZoneModules:quiet,referenceDecoded:true,finalPreviewDecoded:true,meaning:'Demo placeholder decodes; intended meet destination remains pending'},files:{editableSvg:svgPath,transparentWebp:flatWebp,creamReferenceWebp:previewWebp},script:'scripts/build-gymnastics-meet-shirt-concept-v4.mjs'};
await fs.writeFile(path.join(out,'concept-provenance-v4.json'),JSON.stringify(note,null,2));
console.log(JSON.stringify(note,null,2));
