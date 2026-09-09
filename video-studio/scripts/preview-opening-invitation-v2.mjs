import fs from 'node:fs/promises';import {bundle} from '@remotion/bundler';import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';import sharp from 'sharp';
const out='out/mom-just-snap-it';const url=await bundle({entryPoint:'src/index.ts'});const frames=[0,8,15,23,30,60,68,75,83,98,120,143,150,158,165,173,188,210,280];
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){
 const comp=await selectComposition({serveUrl:url,id});for(const f of frames)await renderStill({serveUrl:url,composition:comp,frame:f,output:out+`/invite-v2-${format}-${f}.jpg`,imageFormat:'jpeg',scale:.5,logLevel:'error'});
 console.log(format+' invitation stills ready');
 const tiles=[];for(let i=0;i<frames.length;i++){const b=await sharp(out+`/invite-v2-${format}-${frames[i]}.jpg`).resize({width:format==='16x9'?384:216}).toBuffer();tiles.push({input:b,left:i%4*(format==='16x9'?384:216),top:Math.floor(i/4)*(format==='16x9'?216:384)});}
 await sharp({create:{width:4*(format==='16x9'?384:216),height:5*(format==='16x9'?216:384),channels:3,background:'#fff8ed'}}).composite(tiles).jpeg({quality:88}).toFile(out+`/invite-v2-contact-${format}.jpg`);
 let last=-1;await renderMedia({serveUrl:url,composition:comp,outputLocation:out+`/preview-invite-fixed-${format}-v2.mp4`,codec:'h264',scale:.5,crf:23,concurrency:3,logLevel:'error',onProgress:({progress})=>{const n=Math.floor(progress*4)*25;if(n!==last){last=n;console.log(format+' '+n+'%')}}});
 console.log(format+' moving preview ready');
}
