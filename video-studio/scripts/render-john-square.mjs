
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {selectComposition,renderMedia} from '@remotion/renderer';
const o='out/john-space-disco/',output=o+'john-space-disco-1x1-v2.mp4',render=o+'john-space-disco-1x1-v2-render.mp4',audioSource=o+'john-space-disco-9x16-v11.mp4';
if(fs.existsSync(output))throw Error('Square export already exists');
const serveUrl=await bundle({entryPoint:'src/index.ts',outDir:process.cwd()+'/'+o+'square-bundle-final-v2'});
const composition=await selectComposition({serveUrl,id:'EnvitefyJohnSpaceDiscoSquare'});
let last=0;
await renderMedia({serveUrl,composition,codec:'h264',outputLocation:render,crf:18,pixelFormat:'yuv420p',muted:true,concurrency:2,imageFormat:'jpeg',logLevel:'error',timeoutInMilliseconds:120000,onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p>last){last=p;console.log('Rendering '+p+'%');}}});
function ff(args){execFileSync('ffmpeg',['-y','-hide_banner','-v','error',...args],{windowsHide:true});}
ff(['-i',render,'-i',audioSource,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','copy','-t','30','-movflags','+faststart',output]);
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,duration:format=duration,size','-of','json',output],{encoding:'utf8',windowsHide:true}));
const v=probe.streams.find(x=>x.codec_name==='h264'),a=probe.streams.find(x=>x.codec_name==='aac');
if(!v||v.width!==1080||v.height!==1080||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==900||Number(v.duration)!==30||Number(probe.format.duration)!==30||!a||a.sample_rate!=='48000'||a.channels!==2||Number(a.duration)!==30)throw Error('Unexpected square export format');
const audioHash=f=>execFileSync('ffmpeg',['-v','error','-i',f,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8',windowsHide:true}).trim();
const packetHash=audioHash(output);if(packetHash!==audioHash(audioSource))throw Error('Approved soundtrack changed');
ff(['-xerror','-i',output,'-f','null','-']);
const sound=spawnSync('ffmpeg',['-hide_banner','-i',output,'-vn','-af','loudnorm=I=-15:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8',windowsHide:true});
if(sound.status)throw Error('Sound check failed');
const loudness=JSON.parse(sound.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const sha256=crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
fs.writeFileSync('projects/john-space-disco/square-v2-verification.json',JSON.stringify({date:new Date().toISOString(),path:output,composition:composition.id,probe,sha256,bytes:fs.statSync(output).size,fullDecodePassed:true,audioSource,audioPacketsIdentical:true,audioPacketSha256:packetHash,loudness,approvedPronunciationPreserved:true,shareNarrationPreserved:true,status:'awaiting-final-visual-review'},null,2)+'\n');
const frames=[0,1,2,149,150,214,215,264,265,359,360,422,423,485,486,527,528,569,570,657,658,701,702,779,780,849,880,899];
for(const f of frames)ff(['-i',output,'-vf','select=eq(n\\,'+f+'),scale=480:480','-frames:v','1','-c:v','libwebp','-quality','85','-compression_level','6',o+'square-final-frame-'+f+'.webp']);
for(let page=0;page<2;page++){
 const start=780+page*60,end=start+59;
 ff(['-i',output,'-vf','select=between(n\\,'+start+'\\,'+end+'),scale=200:200,tile=10x6','-frames:v','1','-c:v','libwebp','-quality','85','-compression_level','6',o+'square-ending-all-frames-'+page+'.webp']);
}
const selected=[0,149,150,214,215,264,265,359,360,423,486,528,570,658,702,780,849,899];
for(let page=0;page<2;page++){
 const list=selected.slice(page*9,page*9+9);
 ff([...list.flatMap(f=>['-i',o+'square-final-frame-'+f+'.webp']),'-filter_complex','xstack=inputs=9:layout=0_0|480_0|960_0|0_480|480_480|960_480|0_960|480_960|960_960','-frames:v','1','-c:v','libwebp','-quality','85','-compression_level','6',o+'square-final-review-'+page+'.webp']);
}
console.log('Square export and final review images ready: '+output);

