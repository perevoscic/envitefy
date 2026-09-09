import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const out='out/mom-just-snap-it';const url=await bundle({entryPoint:'src/index.ts'});
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){
 const comp=await selectComposition({serveUrl:url,id});
 for(const frame of [543,548,552,585,602,623,750,780,790,807,850,920,930,980,1049])await renderStill({serveUrl:url,composition:comp,output:`${out}/v3-revised-${format}-${frame}.jpg`,frame,scale:.5,imageFormat:'jpeg',logLevel:'error'});
 let last=-1;await renderMedia({serveUrl:url,composition:comp,outputLocation:`${out}/preview-final-scenes-${format}-v3.mp4`,codec:'h264',scale:.5,crf:23,concurrency:3,frameRange:[480,1049],logLevel:'error',onProgress:({progress})=>{const p=Math.floor(progress*4)*25;if(last!==p){last=p;console.log(format+' revised-scene preview '+p+'%');}}});
}
