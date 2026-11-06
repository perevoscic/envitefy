import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const root=process.cwd();
const out=path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30-v2');
const args=process.argv.slice(2);
const urlIndex=args.indexOf('--meet-url');
const supplied=urlIndex>=0 ? args[urlIndex+1] : undefined;
const placeholder=args.includes('--placeholder-demo');
if(!supplied&&!placeholder)throw new Error('Provide --meet-url <public meet URL>, or explicitly choose --placeholder-demo for concept preview only.');
if(supplied&&placeholder)throw new Error('Choose a real meet URL or demo placeholder, not both.');
const target=supplied??'https://envitefy.com/gymnastics#preview';
const url=new URL(target);
if(!['https:','http:'].includes(url.protocol))throw new Error('Meet URL must use HTTP or HTTPS.');
const plum='#98153f',coral='#f24772',cream='#f8f1e7';
const suffix=placeholder ? '-placeholder' : '';
const name=`gymnastics-meet-back-v2${suffix}`;
await fs.mkdir(out,{recursive:true});
const svgPath=path.join(out,`${name}.svg`);
try{await fs.access(svgPath);throw new Error('This v2 output exists; refusing to overwrite.');}catch(e){if(e.code!=='ENOENT')throw e;}
let svg=await fs.readFile(path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30/gymnastics-meet-back-concept.svg'),'utf8');
svg=svg.replace('SEE A SAMPLE MEET','SEE TODAY MEET');
const qr=QRCode.create(target,{errorCorrectionLevel:'H'});
const quiet=4,n=qr.modules.size,total=n+quiet*2;
let qrPath='';
for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.modules.get(y,x))qrPath+=`M${x+quiet},${y+quiet}h1v1h-1z`;
const qrNode=`<svg x="344" y="904" width="212" height="212" viewBox="0 0 ${total} ${total}"><path d="${qrPath}" fill="${plum}"/></svg>`;
svg=svg.replace(/<svg x="344" y="904" width="212" height="212" viewBox="[^"]+"><path d="[^"]+" fill="#[^"]+"\/><\/svg>/,qrNode);
if(!svg.includes(qrNode))throw new Error('QR insert was not updated');

// Split leap and balance beam are kept outside the QR's full quiet-zone box.
const gymnastics=`<g id="artistic-gymnastics-cues" fill="${plum}">
  <g id="gymnast-split-leap">
    <circle cx="184" cy="941" r="10"/>
    <circle cx="190" cy="929" r="5"/>
    <path d="M176 952 C184 949 194 952 199 963 L212 985 L199 996 L184 979 L175 966 Z"/>
    <path d="M190 956 C209 943 227 931 246 926 M179 956 C163 944 151 938 137 940 M206 991 C232 981 257 975 280 975 L295 970 M194 989 C171 997 149 1015 110 1034 L95 1035" fill="none" stroke="${plum}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M192 967 L201 983 L195 986 L186 973 Z" fill="${coral}"/>
  </g>
  <path d="M93 1080 H300" fill="none" stroke="${plum}" stroke-width="3"/>
  <path d="M100 1070 V1080 H123 M271 1080 H294 V1070" fill="none" stroke="${coral}" stroke-width="5"/>
  <g id="balance-beam">
    <rect x="625" y="987" width="185" height="14" rx="3" fill="${coral}"/>
    <path d="M672 1001 L657 1074 M765 1001 L780 1074 M638 1077 H676 M761 1077 H800" fill="none" stroke="${plum}" stroke-width="7" stroke-linecap="round"/>
    <path d="M621 1092 H814" fill="none" stroke="${plum}" stroke-width="3"/>
  </g>
</g>`;
svg=svg.replace('</svg>',`</svg>`); // The root closing tag is selected below, after nested QR SVG.
const close=svg.lastIndexOf('</svg>');
svg=svg.slice(0,close)+gymnastics+svg.slice(close);
if(!svg.includes('SEE TODAY MEET')||svg.includes('SEE A SAMPLE MEET'))throw new Error('Exact QR caption replacement failed');
await fs.writeFile(svgPath,svg);
const flatPng=path.join(out,`${name}-flat.png`),previewPng=path.join(out,`${name}-preview.png`);
const flatWebp=path.join(out,`${name}-flat.webp`),previewWebp=path.join(out,`${name}-preview.webp`);
await sharp(Buffer.from(svg)).resize(1800,2440).png().toFile(flatPng);
await sharp(Buffer.from(svg)).resize(1800,2440).flatten({background:cream}).png().toFile(previewPng);
for(const[source,dest]of[[flatPng,flatWebp],[previewPng,previewWebp]]){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});
  const m=await sharp(dest).metadata();if(m.format!=='webp'||m.width!==1800||m.height!==2440)throw new Error('WebP metadata mismatch');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});
}
const raster=await sharp(previewWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decoded=jsQR(new Uint8ClampedArray(raster.data),raster.info.width,raster.info.height);
if(decoded?.data!==target)throw new Error('Concept QR failed decode or encoded wrong target');
await fs.unlink(flatPng);await fs.unlink(previewPng);
const note={created:'2026-10-30',status:placeholder?'CONCEPT ONLY: demo QR placeholder; replace with actual meet URL before printing':'Meet URL supplied; root must verify intended destination before print',caption:'SEE TODAY MEET',physicalReference:{widthIn:9,heightIn:12.2},colors:{plum,coral,cream},gymnasticsCues:['Artistic gymnastics split leap silhouette','Balance beam and floor-corner details'],backBranding:'Canonical wordmark shape remains uniformly plum; existing source alpha and geometry preserved',frontBranding:'Separate original-gradient front logo unchanged',qr:{placeholder,actualMeetUrlPending:placeholder,destination:target,decodedRasterTarget:decoded.data,verificationMeaning:placeholder?'Demo placeholder decodes; this is not the intended meet link':'Supplied target decodes in final flat-art raster',quietZoneModules:quiet},files:{editableSvg:svgPath,transparentWebp:flatWebp,creamReferenceWebp:previewWebp},script:'scripts/build-gymnastics-meet-shirt-concept-v2.mjs'};
await fs.writeFile(path.join(out,`${name}-provenance.json`),JSON.stringify(note,null,2));
console.log(JSON.stringify(note,null,2));
