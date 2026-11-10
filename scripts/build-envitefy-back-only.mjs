import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {traceMask} from './lib/merch-contours.mjs';
import {buildBackFooter} from './lib/merch-back-footer.mjs';

const root=resolve(import.meta.dirname,'..');
const out=join(root,'output/merch/back-only-2026-11-05');
const doc=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const image=(bytes,x,y,w,h)=>`<image href="data:image/svg+xml;base64,${bytes.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const assert=(v,m)=>{if(!v)throw new Error(m);};
const sha=b=>createHash('sha256').update(b).digest('hex');

function smooth(mask,w,h){
 const weights=[.0056,.1942,.6004,.1942,.0056];
 const temp=new Float32Array(mask.length),result=new Uint8Array(mask.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let d=-2;d<=2;d++)if(x+d>=0&&x+d<w)temp[y*w+x]+=mask[y*w+x+d]*weights[d+2];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let sum=0;for(let d=-2;d<=2;d++)if(y+d>=0&&y+d<h)sum+=temp[(y+d)*w+x]*weights[d+2];
  result[y*w+x]=sum>=.5?1:0;
 }
 return result;
}
function removeSpecks(mask,w,h,minSize=160){
 const visited=new Uint8Array(mask.length),queue=new Int32Array(mask.length),result=new Uint8Array(mask.length);
 let removed=0,kept=0;
 for(let n=0;n<mask.length;n++){
  if(!mask[n]||visited[n])continue;
  let head=0,tail=1;queue[0]=n;visited[n]=1;
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);
   for(const q of [x?p-1:-1,x+1<w?p+1:-1,y?p-w:-1,y+1<h?p+w:-1])if(q>=0&&mask[q]&&!visited[q]){visited[q]=1;queue[tail++]=q;}
  }
  if(tail>=minSize){kept++;for(let i=0;i<tail;i++)result[queue[i]]=1;}else removed+=tail;
 }
 return {mask:result,removed,kept};
}
function bbox(mask,w,h){let x0=w,y0=h,x1=-1,y1=-1,count=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}
 return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,count};
}
async function headline(source,kind){
 const crop={left:0,top:0,width:1122,height:955};
 const {data,info}=await sharp(source).extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,all=new Uint8Array(w*h),top=new Uint8Array(w*h),accent=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=y*w+x,p=n*4,r=data[p],g=data[p+1],b=data[p+2],a=data[p+3];if(a<180)continue;
  if(kind==='ticket'){
   const red=r>100&&r>b*1.25&&r>g*1.8;
   const blue=y<865&&b>90&&b>r*1.3&&b>g*1.5;
   if(red||blue)all[n]=1;if(blue)top[n]=1;
  }else{
   const cream=r>195&&g>150&&b>110;
   const orange=r>175&&g>35&&g<175&&b<110;
   const plum=r<145&&g<100&&b<155;
   if(cream||orange||plum)all[n]=1;if(cream)top[n]=1;if(orange)accent[n]=1;
  }
 }
 const cleaned=[all,accent,top].map(m=>removeSpecks(smooth(m,w,h),w,h));
 // All overlay ink stays inside the complete silhouette.
 for(const layer of cleaned.slice(1))for(let n=0;n<all.length;n++)if(!cleaned[0].mask[n])layer.mask[n]=0;
 const box=bbox(cleaned[0].mask,w,h);assert(box.count>150000,'Missing main artwork');
 const traces=cleaned.map(({mask})=>traceMask(mask,w,h,{minArea:45,fitError:.85,cornerMinRun:5,cornerAngle:65}));
 const underColor=kind==='ticket'?'#d41442':'#43214e';
 let body=`<path fill="${underColor}" fill-rule="evenodd" d="${traces[0].path}"/>`;
 if(kind==='people')body+=`<path fill="#ff7b0b" fill-rule="evenodd" d="${traces[1].path}"/>`;
 body+=`<path fill="${kind==='ticket'?'#0737b4':'#fff0c6'}" fill-rule="evenodd" d="${traces[2].path}"/>`;
 const padding=3,width=box.width+2*padding,height=box.height+2*padding;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${box.x-padding} ${box.y-padding} ${width} ${height}">${body}</svg>`;
 await writeFile(join(out,`${kind}-headline.svg`),svg);
 return {buffer:Buffer.from(svg),width,height,statistics:{ink:box.count,layers:traces.map((t,i)=>({contours:t.contours.length,removedSpeckPixels:cleaned[i].removed,keptComponents:cleaned[i].kept}))}};
}

await mkdir(out,{recursive:true});
const specs=[
 {name:'envitefy-see-you-there-back',kind:'ticket',color:'#d41442',source:'C:/Users/rjosan/.codex/generated_images/01a18903-cb1a-7783-aee5-8dac51694f51/exec-dde14456-1149-4f26-857b-35013a2edb57.png'},
 {name:'envitefy-bring-your-people-back',kind:'people',color:'#43214e',source:'C:/Users/rjosan/.codex/generated_images/01a18903-cb1a-7783-aee5-8dac51694f51/exec-d16f36ec-98e8-4531-8857-834ec46ffb7e.png'}
];
const report=[];
for(const spec of specs){
 const path=join(out,`${spec.name}-300dpi.png`);
 try{await access(path);throw new Error('Final output exists; refusing overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
 await copyFile(spec.source,join(out,`${spec.kind}-extraction-source.png`));
 const title=await headline(spec.source,spec.kind);
 const contentWidth=3150,pad=75,canvasWidth=3300;
 const titleH=contentWidth*title.height/title.width;
 const footer=await buildBackFooter({root,color:spec.color,width:contentWidth});
 const footerY=pad+titleH+50;
 const canvasHeight=Math.ceil(footerY+footer.height+pad);
 const svg=Buffer.from(doc(canvasWidth,canvasHeight,image(title.buffer,pad,pad,contentWidth,titleH)+image(footer.buffer,pad,footerY,footer.width,footer.height)));
 await writeFile(join(out,`${spec.name}-source.svg`),svg);
 await sharp(svg,{limitInputPixels:false}).withMetadata({density:300}).png({compressionLevel:9}).toFile(path);
 const png=await readFile(path),metadata=await sharp(png).metadata();
 assert(metadata.format==='png'&&metadata.hasAlpha&&metadata.channels===4&&metadata.width===3300&&metadata.density===300,'PNG metadata verification failed');
 const {data:alpha}=await sharp(png).extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
 let transparent=0,opaque=0;for(const a of alpha){if(a===0)transparent++;if(a===255)opaque++;}
 assert(transparent>alpha.length*.20&&opaque>alpha.length*.10,'Genuine transparency or solid ink missing');
 for(let y=0;y<canvasHeight;y++)for(let x=0;x<60;x++)assert(alpha[y*canvasWidth+x]===0&&alpha[y*canvasWidth+canvasWidth-1-x]===0,'Side margin is not transparent');
 for(let y=0;y<60;y++)for(let x=0;x<canvasWidth;x++)assert(alpha[y*canvasWidth+x]===0&&alpha[(canvasHeight-1-y)*canvasWidth+x]===0,'Top/bottom margin is not transparent');
 const preview=await sharp(png).resize({width:700}).png().toBuffer();
 const previewMetadata=await sharp(preview).metadata();
 const checker=Buffer.from(doc(700,previewMetadata.height,'<defs><pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#fff"/><path d="M0 0h16v16H0zM16 16h16v16H16z" fill="#ededed"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/>'));
 await sharp(checker).composite([{input:preview}]).png().toFile(join(out,`${spec.name}-preview.png`));
 report.push({file:path,width:canvasWidth,height:canvasHeight,dpi:300,canvasWidthIn:11,canvasHeightIn:canvasHeight/300,artworkWidthIn:10.5,transparentPixels:transparent,opaquePixels:opaque,sha256:sha(png),bytes:png.length,title:title.statistics,notes:'Imagegen extraction headline colors flattened and contours smoothed; native original brand/footer assets; no fabric or printed background. PNG explicitly requested; PNGs retained.'});
 console.log(JSON.stringify(report.at(-1)));
}
await writeFile(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
