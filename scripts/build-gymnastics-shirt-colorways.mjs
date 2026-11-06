import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';

const root=process.cwd();
const out=path.join(root,'output/merch/gymnastics-colorways-2026-10-30');
const source=path.join(root,'output/merch/gymnastics-meet-shirt-2026-10-30-v4/gymnastics-meet-upload-live-v4-placeholder.svg');
await fs.mkdir(out,{recursive:true});
const target='https://envitefy.com/gymnastics#preview';
const sourceBytes=await fs.readFile(source),sourceSvg=sourceBytes.toString('utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHash=hash(sourceBytes);
const colors=[
  {id:'ice-blue',label:'ICE BLUE',garment:'#a9c4df',main:'#182d48',accent:'#f24772',qrBacking:false},
  {id:'black',label:'BLACK',garment:'#1a1a1a',main:'#f8f1e7',accent:'#ff6688',qrBacking:true},
  {id:'sunwashed-mint',label:'SUNWASHED MINT',garment:'#b5ded5',main:'#174e4b',accent:'#f06f73',qrBacking:false},
  {id:'manzanita',label:'MANZANITA',garment:'#893b51',main:'#fff3e7',accent:'#ffbaa2',qrBacking:true},
];
const assert=(v,m)=>{if(!v)throw new Error(m);};
const originalImages=[...sourceSvg.matchAll(/<image\b[^>]*href="data:image\/png;base64,([^"]+)"[^>]*\/>/g)];
assert(originalImages.length===3,'Expected two headline images and one canonical wordmark image');
const decodedImages=await Promise.all(originalImages.map(async m=>{
  const b=Buffer.from(m[1],'base64');
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=Buffer.alloc(data.length/4);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
  return {match:m[0],data,info,alpha};
}));
const textBefore=[...sourceSvg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
const expectedCopy=['Meet details','Registration','Hotels','Meet details · Registration · Hotels.','SEE TODAY’S MEET'];
assert(expectedCopy.every(t=>textBefore.includes(t)),'V4 copy does not match required source');
const pixelRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
async function recolorImage(sourceImage,color){
  const rgb=pixelRgb(color),data=Buffer.from(sourceImage.data);
  for(let i=0;i<data.length;i+=4){data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];}
  const png=await sharp(data,{raw:{width:sourceImage.info.width,height:sourceImage.info.height,channels:4}}).png().toBuffer();
  const read=await sharp(png).ensureAlpha().raw().toBuffer();
  let visible=0;for(let i=0;i<sourceImage.alpha.length;i++){
    assert(read[i*4+3]===sourceImage.alpha[i],'Embedded image alpha changed during recoloring');
    if(read[i*4+3]){visible++;assert(read[i*4]===rgb[0]&&read[i*4+1]===rgb[1]&&read[i*4+2]===rgb[2],'Recolored embedded image has wrong visible RGB');}
  }
  return {png,visible};
}
async function exportWebp(svg,inputPng,dest,{background}={}){
  let render=sharp(Buffer.from(svg));if(background)render=render.flatten({background});
  await render.png().toFile(inputPng);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',inputPng,'-c:v','libwebp','-quality','85','-compression_level','6',dest],{stdio:'pipe'});
  const m=await sharp(dest).metadata();assert(m.format==='webp','Output is not WebP');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',dest,'-f','null','-'],{stdio:'pipe'});
  await fs.unlink(inputPng);return m;
}
const variants=[];
for(const c of colors){
  let svg=sourceSvg.replace(/#98153f/gi,c.main).replace(/#f24772/gi,c.accent);
  const tintChecks=[];
  for(let i=0;i<decodedImages.length;i++){
    const result=await recolorImage(decodedImages[i],i===1?c.accent:c.main);
    const old=decodedImages[i].match;
    const updated=old.replace(/href="data:image\/png;base64,[^"]+"/,`href="data:image/png;base64,${result.png.toString('base64')}"`);
    assert(svg.includes(old),'Expected source embedded image is missing');svg=svg.replace(old,updated);
    tintChecks.push({role:i===0?'plum headline':i===1?'coral result headline':'canonical Envitefy wordmark',visiblePixels:result.visible,alphaPreserved:true,uniformInk:i===1?c.accent:c.main});
  }
  const qrMatch=svg.match(/<svg x="76" y="923" width="224" height="224" viewBox="0 0 45 45">[\s\S]*?<\/svg>/);
  assert(qrMatch,'QR node missing');
  const qrInk=c.qrBacking?'#182d48':c.main;
  if(c.qrBacking){
    const backed=qrMatch[0].replace(/(<svg[^>]+>)/,`$1<rect width="45" height="45" fill="${c.main}"/>`).replace(/(<path d="[^"]+" fill=")[^"]+("\/\>)/,`$1${qrInk}$2`);
    svg=svg.replace(qrMatch[0],backed);
  }
  assert(JSON.stringify([...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]))===JSON.stringify(textBefore),'Copy changed during color conversion');
  const svgPath=path.join(out,`${c.id}-back.svg`);await fs.writeFile(svgPath,svg);
  const renderSvg=svg.replace('width="900" height="1220"','width="1800" height="2440"');
  const flatWebp=path.join(out,`${c.id}-back-flat.webp`),refWebp=path.join(out,`${c.id}-back-reference.webp`);
  const flatMeta=await exportWebp(renderSvg,path.join(out,`${c.id}-flat-tmp.png`),flatWebp);
  const refMeta=await exportWebp(renderSvg,path.join(out,`${c.id}-reference-tmp.png`),refWebp,{background:c.garment});
  assert(flatMeta.width===1800&&flatMeta.height===2440&&flatMeta.hasAlpha,'Flat dimensions/alpha failed');
  assert(refMeta.width===1800&&refMeta.height===2440,'Reference dimensions failed');
  const flatAlpha=await sharp(flatWebp).extractChannel('alpha').stats();assert(flatAlpha.channels[0].min===0&&flatAlpha.channels[0].max===255,'Flat art lost transparent/opaque pixels');
  const raster=await sharp(refWebp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const decoded=jsQR(new Uint8ClampedArray(raster.data),raster.info.width,raster.info.height,{inversionAttempts:'dontInvert'});
  assert(decoded?.data===target,`${c.label} reference QR did not decode in standard non-inverted mode`);
  const variant={...c,qrInk,qrDestination:target,qrPlaceholder:true,standardNonInvertedQrDecoded:true,backWordmarkMatchesMainInk:true,embeddedImageChecks:tintChecks,files:{svgPath,flatWebp,referenceWebp:refWebp},svg};
  variants.push(variant);
  console.log(JSON.stringify({variant:c.id,ready:refWebp,qrDecoded:decoded.data}));
}

const boardW=2400,boardH=2590,scale=29;
const doc=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const image=(b,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/svg+xml;base64,${Buffer.from(b).toString('base64')}"/>`;
const shirt=(cx,top,color)=>`<g transform="translate(${cx} ${top}) scale(${scale})"><path d="M-3.8 0L-7.7 1.2L-15.5 5.5L-12.8 12L-11 10.8L-11 29.6Q0 30.4 11 29.6L11 10.8L12.8 12L15.5 5.5L7.7 1.2L3.8 0Q0 2-3.8 0Z" fill="${color}" stroke="#77716b" stroke-width=".06"/><path d="M-3.8 0Q0 2 3.8 0M-4.05 .08Q0 2.5 4.05 .08M-10.75 28.95Q0 29.7 10.75 28.95M-15.1 5.8L-12.45 11.6M15.1 5.8L12.45 11.6M-11 10.8L-9.7 5.3M11 10.8L9.7 5.3" fill="none" stroke="#77716b" stroke-width=".045"/></g>`;
let boardBody='<rect width="2400" height="2590" fill="#eeeae5"/><text x="1200" y="88" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#302d31">Gymnastics meet shirt color concepts</text><text x="1200" y="145" text-anchor="middle" font-family="Arial" font-size="28" fill="#68626b">Same artwork and scale · back views</text>';
for(let i=0;i<variants.length;i++){
  const c=variants[i],cx=i%2===0?605:1795,top=i<2?306:1598;
  boardBody+=`<text x="${cx}" y="${top-55}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" letter-spacing="2" fill="#302d31">${c.label}</text>`;
  boardBody+=shirt(cx,top,c.garment);
  boardBody+=image(c.svg,cx-9*scale/2,top+4*scale,9*scale,12.2*scale);
}
const board=doc(boardW,boardH,boardBody),boardSvg=path.join(out,'four-colorways-shirt-board.svg'),boardWebp=path.join(out,'four-colorways-shirt-board.webp');
await fs.writeFile(boardSvg,board);const boardMeta=await exportWebp(board,path.join(out,'four-colorways-board-tmp.png'),boardWebp);
assert(boardMeta.width===boardW&&boardMeta.height===boardH,'Board dimensions mismatch');
assert(hash(await fs.readFile(source))===sourceHash,'V4 original changed');
const report={created:'2026-10-30',status:'Four concept color directions, not a manufacturer/PMS match or print color proof',source:path.relative(root,source),sourceSha256:sourceHash,originalPreserved:true,backArtReference:{widthIn:9,heightIn:12.2},boardReferenceGarment:{flatBodyWidthIn:22,shoulderToHemIn:30,scalePixelsPerInch:scale},frontLogo:'Original gradient front branding remains separate; no front logo modified',copy:{headline:['UPLOAD A PDF.','GET A LIVE PAGE.'],phoneRows:['Meet details','Registration','Hotels'],summary:'Meet details · Registration · Hotels.',qrCaption:'SEE TODAY’S MEET'},qrStatus:'All four QR references decode to the known demo placeholder only. Replace the destination with the intended meet URL before printing.',variants:variants.map(({svg,...v})=>v),board:{svg:boardSvg,webp:boardWebp,width:boardW,height:boardH},script:'scripts/build-gymnastics-shirt-colorways.mjs'};
await fs.writeFile(path.join(out,'colorways-and-verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({complete:true,boardWebp,variants:variants.map(v=>v.id)}));
