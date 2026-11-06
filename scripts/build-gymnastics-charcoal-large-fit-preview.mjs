import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=process.cwd(),out=path.join(root,'output/merch/gymnastics-charcoal-large-back-2026-10-30');
const printPath=path.join(out,'gymnastics-charcoal-back-12x16.27in-300dpi.png');
const bytes=await fs.readFile(printPath),printHash=createHash('sha256').update(bytes).digest('hex');
const meta=await sharp(bytes).metadata();
if(meta.width!==3600||meta.height!==4880||meta.density!==300||!meta.hasAlpha)throw new Error('Unexpected large back print source');
const inch=36,cx=690,top=220,bodyW=22,bodyH=30,printW=12,printH=4880/300;
const artX=cx-printW*inch/2,artY=top+4*inch,artW=printW*inch,artH=printH*inch;
if(Math.abs(artW/artH-meta.width/meta.height)>1e-10)throw new Error('Artwork aspect ratio changed');
const uri=`data:image/png;base64,${bytes.toString('base64')}`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1380" height="1500" viewBox="0 0 1380 1500">
<style>text{font-family:Arial,sans-serif;fill:#342d31}.dim{fill:none;stroke:#8b6072;stroke-width:1.5}.measure{font-size:24px;fill:#7d425b}.sub{font-size:24px;fill:#72656a}</style>
<rect width="1380" height="1500" fill="#fbf8f4"/>
<text x="690" y="62" text-anchor="middle" font-size="38" font-weight="700">Larger back print · exact proportional view</text>
<text x="690" y="108" text-anchor="middle" class="sub">Reference shirt: 22″ flat body width × 30″ shoulder-to-hem length</text>
<g transform="translate(${cx} ${top}) scale(${inch})">
<path d="M-3.8 0L-7.7 1.2L-15.5 5.5L-12.8 12L-11 10.8L-11 29.6Q0 30.4 11 29.6L11 10.8L12.8 12L15.5 5.5L7.7 1.2L3.8 0Q0 2-3.8 0Z" fill="#67615b" stroke="#4e4944" stroke-width=".07"/>
<path d="M-3.8 0Q0 2 3.8 0M-4.05 .08Q0 2.5 4.05 .08M-10.75 28.95Q0 29.7 10.75 28.95M-15.1 5.8L-12.45 11.6M15.1 5.8L12.45 11.6M-11 10.8L-9.7 5.3M11 10.8L9.7 5.3" fill="none" stroke="#8f8780" stroke-width=".055"/>
</g>
<rect x="${artX}" y="${artY}" width="${artW}" height="${artH}" fill="none" stroke="#e2bdcf" stroke-width="1.5" stroke-dasharray="6 5"/>
<image x="${artX}" y="${artY}" width="${artW}" height="${artH}" href="${uri}"/>
<path d="M${artX} ${artY-23}H${artX+artW}M${artX} ${artY-30}V${artY-16}M${artX+artW} ${artY-30}V${artY-16}" class="dim" style="stroke:#e2bdcf"/>
<text x="${cx}" y="${artY-38}" text-anchor="middle" class="measure" style="fill:#fff3e7">12″ canvas width</text>
<path d="M${artX+artW+24} ${artY}V${artY+artH}M${artX+artW+17} ${artY}H${artX+artW+31}M${artX+artW+17} ${artY+artH}H${artX+artW+31}" class="dim" style="stroke:#e2bdcf"/>
<text x="${artX+artW+43}" y="${artY+artH/2}" text-anchor="middle" transform="rotate(90 ${artX+artW+43} ${artY+artH/2})" class="measure" style="fill:#fff3e7">16.27″ canvas height</text>
<path d="M${cx-bodyW*inch/2} ${top+bodyH*inch+44}H${cx+bodyW*inch/2}M${cx-bodyW*inch/2} ${top+bodyH*inch+37}V${top+bodyH*inch+51}M${cx+bodyW*inch/2} ${top+bodyH*inch+37}V${top+bodyH*inch+51}" class="dim"/>
<text x="${cx}" y="${top+bodyH*inch+31}" text-anchor="middle" class="measure">22″ body width</text>
<path d="M86 ${top}V${top+bodyH*inch}M79 ${top}H93M79 ${top+bodyH*inch}H93" class="dim"/>
<text x="61" y="${top+bodyH*inch/2}" text-anchor="middle" transform="rotate(-90 61 ${top+bodyH*inch/2})" class="measure">30″ shoulder to hem</text>
<text x="690" y="1412" text-anchor="middle" class="sub">Artwork and garment share one scale. Top of print canvas: 4″ below high shoulder.</text>
<text x="690" y="1452" text-anchor="middle" class="sub">Full canvas: 12″ × 16.27″ · Visible artwork: 10.93″ × 15.22″</text>
</svg>`;
const svgPath=path.join(out,'charcoal-12in-back-exact-fit-preview-v2.svg'),pngPath=path.join(out,'charcoal-12in-back-exact-fit-preview-v2.png'),webpPath=path.join(out,'charcoal-12in-back-exact-fit-preview-v2.webp');
await fs.writeFile(svgPath,svg);await sharp(Buffer.from(svg)).png().toFile(pngPath);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',pngPath,'-c:v','libwebp','-quality','85','-compression_level','6',webpPath],{stdio:'pipe'});
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',webpPath,'-f','null','-'],{stdio:'pipe'});
const wm=await sharp(webpPath).metadata();if(wm.format!=='webp'||wm.width!==1380||wm.height!==1500)throw new Error('Fit preview export failed');
if(createHash('sha256').update(await fs.readFile(printPath)).digest('hex')!==printHash)throw new Error('Print source changed');
const report={created:'2026-10-30',purpose:'Exact proportional technical sizing proof, not a production transfer upload',referenceGarment:{bodyWidthIn:bodyW,highShoulderToCenterHemIn:bodyH},artwork:{fullCanvasWidthIn:printW,fullCanvasHeightIn:printH,belowHighShoulderIn:4,centered:true,printSource:printPath,printSha256:printHash,printSourceUnchanged:true},commonPixelsPerInch:inch,rendered:{garmentBodyWidthPx:bodyW*inch,garmentLengthPx:bodyH*inch,artX,artY,artWidthPx:artW,artHeightPx:artH,printBelowShoulderPx:4*inch},files:{svg:svgPath,png:pngPath,webp:webpPath},pngMeaning:'Explicitly requested downloadable fit preview; not the standalone print artwork',script:'scripts/build-gymnastics-charcoal-large-fit-preview.mjs'};
await fs.writeFile(path.join(out,'exact-shirt-fit-verification.json'),JSON.stringify(report,null,2));
const mainReportPath=path.join(out,'large-back-and-planning-verification.json');const main=JSON.parse(await fs.readFile(mainReportPath,'utf8'));main.exactProportionalFitPreview=report;await fs.writeFile(mainReportPath,JSON.stringify(main,null,2));
console.log(JSON.stringify(report,null,2));
