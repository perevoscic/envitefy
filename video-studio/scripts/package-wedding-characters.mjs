import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
const dir='out/wedding-characters/',output=dir+'wedding-characters-9x16-v1.mp4';
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r;}
run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',dir+'wedding-characters-9x16-v1-final-render.mp4','-i','public/projects/wedding-characters/final-mix.wav','-map','0:v:0','-map','1:a:0','-t','25','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','17','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',output]);
const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,sample_rate,channels,nb_frames,duration','-show_entries','format=duration,size','-of','json',output]).stdout);
if(probe.format.duration!=='25.000000')throw new Error('Unexpected final duration: '+probe.format.duration);
const video=probe.streams.find(s=>s.codec_name==='h264');if(video.width!==1080||video.height!==1920||video.nb_frames!=='750')throw new Error('Video dimensions or frames mismatch');
const meter=run('ffmpeg',['-hide_banner','-i',output,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','NUL']).stderr;const matches=meter.match(/\{[\s\S]*?\}/g);const audio=JSON.parse(matches.at(-1));
const logos={};for(const [studio,parent]of [['public/brand/envitefy-com.png','../public/brand/envitefy-com.png'],['public/brand/apple-touch-icon-120.png','../public/icons/apple-touch-icon-120.png']]){const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');logos[studio]={sha256:hash(studio),matchesParent:hash(studio)===hash(parent)};}
const result={file:output,probe,audio,branding:logos,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex')};
fs.writeFileSync(dir+'final-technical-review.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));

