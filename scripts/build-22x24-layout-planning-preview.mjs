import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=process.cwd(),out=path.join(root,'output/merch/22x24-layout-ideas-2026-10-30');
await fs.mkdir(out,{recursive:true});
const backSource=path.join(root,'output/merch/gymnastics-charcoal-shirt-2026-10-30/gymnastics-charcoal-back-9x12.2in-300dpi.png');
const frontSource=path.join(root,'output/merch/gang-sheet-22x36-2026-10-29-v3/front-pocket.svg');
const assert=(v,m)=>{if(!v)throw new Error(m);},hash=b=>createHash('sha256').update(b).digest('hex');
const backBytes=await fs.readFile(backSource),frontBytes=await fs.readFile(frontSource);
const hashes={back:hash(backBytes),front:hash(frontBytes)};
const crop={left:120,top:120,width:2460,height:3424};
const bm=await sharp(backBytes).metadata();assert(bm.width===2700&&bm.height===3660&&bm.density===300&&bm.hasAlpha,'Unexpected back print source');
const fullAlpha=await sharp(backBytes).extractChannel('alpha').raw().toBuffer();
let outsideInk=0,totalBackInk=0;
for(let y=0;y<bm.height;y++)for(let x=0;x<bm.width;x++)if(fullAlpha[y*bm.width+x]){totalBackInk++;if(x<crop.left||x>=crop.left+crop.width||y<crop.top||y>=crop.top+crop.height)outsideInk++;}
assert(outsideInk===0,'Requested transparent crop would clip visible back artwork');
const back=await sharp(backBytes).extract(crop).png().toBuffer();
const front=await sharp(frontBytes).resize(900,698,{fit:'fill'}).png().toBuffer();
const frontAlpha=await sharp(front).extractChannel('alpha').raw().toBuffer();
let x0=900,y0=698,x1=-1,y1=-1,frontInk=0;
for(let y=0;y<698;y++)for(let x=0;x<900;x++)if(frontAlpha[y*900+x]){frontInk++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
assert(x0===0&&y0===0&&x1===899&&y1===697,'Standalone front render is clipped');
const placements=[];
for(const x of [.25,13.55])for(const y of [.25,12.1633333333333])placements.push({kind:'back',xIn:x,yIn:y,widthIn:2460/300,heightIn:3424/300});
for(let i=0;i<8;i++)placements.push({kind:'front',purpose:i<4?'required':'spare',xIn:9.5,yIn:.25+i*(698/300+.5),widthIn:3,heightIn:698/300});
let minGap=Infinity,minEdge=Infinity;
for(const p of placements){const edge=Math.min(p.xIn,p.yIn,22-p.xIn-p.widthIn,24-p.yIn-p.heightIn);assert(edge>=.25-1e-8,'A print box is outside the quarter-inch margin');minEdge=Math.min(minEdge,edge);}
for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){
 const a=placements[i],b=placements[j],dx=Math.max(0,a.xIn-b.xIn-b.widthIn,b.xIn-a.xIn-a.widthIn),dy=Math.max(0,a.yIn-b.yIn-b.heightIn,b.yIn-a.yIn-a.heightIn),gap=Math.hypot(dx,dy);
 assert(gap>=.5-1e-8,`Planning boxes overlap or have too little clearance: ${i}/${j}`);minGap=Math.min(minGap,gap);
}
const scale=40,sheetX=130,sheetY=200,sheetW=22*scale,sheetH=24*scale;
const uri=b=>`data:image/png;base64,${b.toString('base64')}`;
const image=(b,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uri(b)}"/>`;
let art='';
for(const p of placements)art+=image(p.kind==='back'?back:front,sheetX+p.xIn*scale,sheetY+p.yIn*scale,p.widthIn*scale,p.heightIn*scale);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="1290" viewBox="0 0 1140 1290">
<rect width="1140" height="1290" fill="#fbf8f4"/>
<text x="570" y="48" text-anchor="middle" font-family="Arial" font-size="36" font-weight="700" fill="#302a30">22″ × 24″ layout idea</text>
<text x="570" y="88" text-anchor="middle" font-family="Arial" font-size="24" fill="#61575c">4 backs + 8 front logos (4 spares)</text>
<text x="570" y="125" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#98153f">PLANNING PREVIEW · NOT AN UPLOAD FILE</text>
<path d="M130 176H1010M130 169V183M1010 169V183" fill="none" stroke="#76666d" stroke-width="1.4"/>
<text x="570" y="166" text-anchor="middle" font-family="Arial" font-size="22" fill="#61575c">22″ wide</text>
<path d="M89 200V1160M82 200H96M82 1160H96" fill="none" stroke="#76666d" stroke-width="1.4"/>
<text x="66" y="680" text-anchor="middle" transform="rotate(-90 66 680)" font-family="Arial" font-size="22" fill="#61575c">24″ high</text>
<rect x="${sheetX}" y="${sheetY}" width="${sheetW}" height="${sheetH}" fill="#67615b" stroke="#504b47" stroke-width="1"/>
${art}
<text x="570" y="1200" text-anchor="middle" font-family="Arial" font-size="20" fill="#61575c">Spacing study only · Shirt color quantities are not assigned</text>
<text x="570" y="1235" text-anchor="middle" font-family="Arial" font-size="19" fill="#61575c">Back artwork: 8.2″ × 11.41″ visible size · Front logos: 3″ wide</text>
<text x="570" y="1268" text-anchor="middle" font-family="Arial" font-size="17" fill="#61575c">Dark matte is for viewing; the actual transfer canvas would be transparent.</text>
</svg>`;
const svgPath=path.join(out,'22x24-layout-idea-planning.svg'),pngPath=path.join(out,'22x24-layout-idea-planning-preview.png'),webpPath=path.join(out,'22x24-layout-idea-planning-preview.webp');
await fs.writeFile(svgPath,svg);await sharp(Buffer.from(svg)).png().toFile(pngPath);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',pngPath,'-c:v','libwebp','-quality','85','-compression_level','6',webpPath],{stdio:'pipe'});
const pm=await sharp(pngPath).metadata(),wm=await sharp(webpPath).metadata();assert(pm.width===1140&&pm.height===1290&&wm.format==='webp'&&wm.width===1140&&wm.height===1290,'Planning preview dimensions mismatch');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',webpPath,'-f','null','-'],{stdio:'pipe'});
assert(hash(await fs.readFile(backSource))===hashes.back&&hash(await fs.readFile(frontSource))===hashes.front,'Original print sources changed');
const report={created:'2026-10-30',status:'PLANNING PREVIEW ONLY — not a production upload sheet',pendingClarification:'Multi-shirt sheet versus one enlarged print remains unconfirmed; shirt color quantities are not assigned',canvasReference:{widthIn:22,heightIn:24,previewPixelsPerInch:scale},counts:{backs:4,fronts:8,requiredFronts:4,spareFronts:4},backSource,frontSource,sourceHashes:hashes,transparentBackCrop:{...crop,visibleWidthIn:2460/300,visibleHeightIn:3424/300,sourceOutsideCropInkPixels:outsideInk,sourceInkPixels:totalBackInk,artworkScaleChanged:false},frontStandalone:{widthPx:900,heightPx:698,inkPixels:frontInk,fullInkBounds:{x:0,y:0,width:900,height:698},upright:true},placements,verified:{minBoxGapIn:minGap,minOuterEdgeIn:minEdge,noClipping:true,originalsUnchanged:true,production6600x7200PngCreated:false},files:{sourceSvg:svgPath,previewWebp:webpPath,downloadPreviewPng:pngPath},pngPolicy:'This PNG is an explicitly requested planning-preview download, retained; it is not a print/upload sheet.',script:'scripts/build-22x24-layout-planning-preview.mjs'};
await fs.writeFile(path.join(out,'layout-planning-and-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
