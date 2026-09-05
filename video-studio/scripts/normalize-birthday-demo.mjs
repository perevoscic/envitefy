import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('../../node_modules/sharp');
const timing=JSON.parse(fs.readFileSync('projects/birthday-second-job/capture-timing.json','utf8'));
const W=860,H=1520,bytes=W*H*3,records=[];
for(const [kind,duration] of [['rsvp',3.9],['calendar',4.3]]){
 const start=timing[kind]+(kind==='rsvp'?1/6:0);
 const decoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(start),'-i',timing.videoPath,'-t',String(duration),'-vf','fps=30','-an','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{stdio:['ignore','pipe','inherit']});
 const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','796x1194','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','public/projects/birthday-second-job/demo-card-'+kind+'-v3.mp4'],{stdio:['pipe','ignore','inherit']});
 const done=once(encoder,'close');let pending=Buffer.alloc(0),n=0,half=0,full=0,lastCard=null;
 for await(const chunk of decoder.stdout){
  pending=Buffer.concat([pending,chunk]);
  while(pending.length>=bytes){
   const frame=pending.subarray(0,bytes);pending=pending.subarray(bytes);
   let grey=0;
   for(const y of [850,1000,1200,1400])for(const x of [500,600,700,800]){const i=(y*W+x)*3;const r=frame[i],g=frame[i+1],b=frame[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)<=16&&Math.abs((r+g+b)/3-128)<=20)grey++;}
   const halfResolution=grey>=12;
   let normalized=sharp(frame,{raw:{width:W,height:H,channels:3}});
   if(halfResolution){normalized=normalized.extract({left:0,top:0,width:430,height:760}).resize(W,H);half++;}else full++;
   const pixels=await normalized.raw().toBuffer();
   const card=await sharp(pixels,{raw:{width:W,height:H,channels:3}}).extract({left:32,top:108,width:796,height:1194}).raw().toBuffer();
   lastCard=card;
   if(!encoder.stdin.write(card))await once(encoder.stdin,'drain');
   n++;
  }
 }
 while(n<Math.round(duration*30)&&lastCard){if(!encoder.stdin.write(lastCard))await once(encoder.stdin,'drain');n++;}
 encoder.stdin.end();const [code]=await done;if(code!==0)throw new Error('Encoding failed');
 records.push({kind,frames:n,halfResolutionFrames:half,fullResolutionFrames:full});console.log(records.at(-1));
}
fs.writeFileSync('projects/birthday-second-job/demo-normalization-v3.json',JSON.stringify(records,null,2));

