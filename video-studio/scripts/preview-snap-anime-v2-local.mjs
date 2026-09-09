import fs from 'node:fs/promises';import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const out='out/mom-just-snap-it';const url=await bundle({entryPoint:'src/index.ts'});
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){
 const comp=await selectComposition({serveUrl:url,id});
 for(const frame of [210,240,280,340,360,850,900])await renderStill({serveUrl:url,composition:comp,output:out+`/v2-local-${format}-${frame}.jpg`,frame,scale:.5,imageFormat:'jpeg',logLevel:'error'});
 let last=-1;await renderMedia({serveUrl:url,composition:comp,outputLocation:out+`/v2-local-preview-${format}-opening-pending.mp4`,codec:'h264',scale:.5,crf:23,concurrency:3,logLevel:'error',onProgress:({progress})=>{const n=Math.floor(progress*4)*25;if(n!==last){last=n;console.log(format+' '+n+'%')}}});
 console.log(format+' local fixes preview ready (opening replacement pending permission)');
}
