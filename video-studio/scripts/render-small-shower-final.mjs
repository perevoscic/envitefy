import {bundle} from '@remotion/bundler';
import fs from 'node:fs/promises';import {selectComposition,renderMedia} from '@remotion/renderer';import {execFileSync} from 'node:child_process';
const out='out/small-shower',pub='public/projects/small-shower';const url=await bundle({entryPoint:'src/index.ts'});await fs.writeFile(out+'/bundle-path.txt',url);
const ff=a=>execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...a],{stdio:'inherit'});
ff(['-i',pub+'/final-mix.wav','-c:a','aac','-b:a','192k','-ar','48000','-t','30',out+'/shared-audio-v1.m4a']);
const jobs=[['EnvitefySmallShowerWide','16x9'],['EnvitefySmallShowerVertical','9x16']];
const results=await Promise.allSettled(jobs.map(async([id,aspect])=>{const composition=await selectComposition({serveUrl:url,id});let last=-1;await renderMedia({serveUrl:url,composition,outputLocation:out+'/small-shower-'+aspect+'-v1-render.mp4',codec:'h264',crf:18,muted:true,concurrency:2,logLevel:'error',onProgress:({progress})=>{const n=Math.floor(progress*10);if(n>last){last=n;console.log(aspect+' render '+n*10+'%')}}});ff(['-i',out+'/small-shower-'+aspect+'-v1-render.mp4','-i',out+'/shared-audio-v1.m4a','-map','0:v:0','-map','1:a:0','-c','copy','-t','30','-movflags','+faststart',out+'/small-shower-'+aspect+'-v1.mp4']);ff(['-i',out+'/small-shower-'+aspect+'-v1.mp4','-vf',aspect==='16x9'?'scale=960:540':'scale=540:960','-c:v','libx264','-preset','fast','-crf','26','-c:a','aac','-b:a','96k',out+'/final-review-'+aspect+'.mp4']);console.log(aspect+' exported');}));
for(const r of results)if(r.status==='rejected'){console.error(r.reason);process.exitCode=1;}

