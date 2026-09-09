import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const preview=process.argv.includes('--preview');
const out='out/mom-just-snap-it';
const url=await bundle({entryPoint:'src/index.ts'});
await fs.writeFile(out+'/bundle-v3-path.txt',url);
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
if(!preview)ff(['-i','public/projects/mom-just-snap-it/final-mix-v2.wav','-t','35','-c:a','aac','-b:a','256k','-ar','48000','-ac','2',out+'/shared-final-audio-v3.m4a']);
for(const [id,format] of [['EnvitefySnapAnimeWide','16x9'],['EnvitefySnapAnimeVertical','9x16']]){
 const comp=await selectComposition({serveUrl:url,id});
 if(preview)for(const frame of [0,15,60,98,135,150,165,180,209,210,380,515,555,573,585,598,610,623,640,680,750,822,890,980,1049]){
  await renderStill({serveUrl:url,composition:comp,output:out+`/v3-preview-${format}-${frame}.jpg`,frame,scale:.5,imageFormat:'jpeg',logLevel:'error'});
 }
 const raw=out+(preview?`/preview-${format}-v3.mp4`:`/envitefy-snap-anime-${format}-v3-render.mp4`);
 let last=-1;
 await renderMedia({serveUrl:url,composition:comp,outputLocation:raw,codec:'h264',crf:preview?23:17,pixelFormat:'yuv420p',scale:preview?.5:1,concurrency:3,muted:!preview,logLevel:'error',onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){last=n;console.log(format+' '+(preview?'preview':'final')+' '+n+'%');}}});
 if(!preview)ff(['-i',raw,'-i',out+'/shared-final-audio-v3.m4a','-map','0:v:0','-map','1:a:0','-c','copy','-t','35','-movflags','+faststart',out+`/envitefy-snap-anime-${format}-v3.mp4`]);
 console.log(format+' '+(preview?'preview':'final')+' completed');
}
