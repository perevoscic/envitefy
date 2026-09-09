import fs from 'node:fs/promises';import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const out='out/mom-just-snap-it';
const url=await bundle({entryPoint:'src/index.ts',onProgress:p=>{if(p===100)console.log('Bundle ready')}});
await fs.writeFile(out+'/bundle-path.txt',url);
const frames=[30,170,250,380,515,549,573,595,612,628,653,682,735,822,890,980];
for(const id of ['EnvitefySnapAnimeWide','EnvitefySnapAnimeVertical']){
 const comp=await selectComposition({serveUrl:url,id});const format=id.endsWith('Wide')?'16x9':'9x16';
 for(const frame of frames)await renderStill({serveUrl:url,composition:comp,output:out+`/review-${format}-${frame}.jpg`,frame,scale:format==='16x9'?.28:.25,imageFormat:'jpeg',logLevel:'error'});
 console.log(format+' scene previews ready');
 await renderMedia({serveUrl:url,composition:comp,outputLocation:out+`/preview-${format}-v1.mp4`,codec:'h264',scale:.5,crf:23,concurrency:3,logLevel:'error',onProgress:({progress})=>{const n=Math.round(progress*100);if(n%20===0)console.log(format+' '+n+'%')}});
 console.log(format+' moving preview ready');
}
