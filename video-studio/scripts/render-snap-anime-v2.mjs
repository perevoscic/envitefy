import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia} from '@remotion/renderer';
const out='out/mom-just-snap-it';
const url=await bundle({entryPoint:'src/index.ts'});
const ff=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','public/projects/mom-just-snap-it/final-mix-v2.wav','-t','35','-c:a','aac','-b:a','256k','-ar','48000','-ac','2',out+'/shared-final-audio-v2.m4a'],{encoding:'utf8'});if(ff.status)throw Error(ff.stderr);
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){
 const comp=await selectComposition({serveUrl:url,id});let last=-1;
 await renderMedia({serveUrl:url,composition:comp,outputLocation:out+`/envitefy-snap-anime-${format}-v2-render.mp4`,codec:'h264',crf:17,pixelFormat:'yuv420p',concurrency:3,muted:true,logLevel:'error',onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){last=n;console.log(format+' '+n+'%')}}});
 const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',out+`/envitefy-snap-anime-${format}-v2-render.mp4`,'-i',out+'/shared-final-audio-v2.m4a','-map','0:v:0','-map','1:a:0','-c','copy','-t','35','-movflags','+faststart',out+`/envitefy-snap-anime-${format}-v2.mp4`],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
 console.log(format+' full-resolution export ready');
}
