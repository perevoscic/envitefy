import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const project='projects/birthday-support/',out='out/birthday-support-9x16-v2.mp4';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner',...args],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r.stderr;}
ff(['-loglevel','error','-i','out/birthday-support-hook-v2.mp4','-i','out/birthday-support-9x16-v1.mp4','-i','public/projects/birthday-support/final-mix-v2.wav','-filter_complex','[0:v]trim=0:7,setpts=PTS-STARTPTS[opening];[1:v]trim=7:25,setpts=PTS-STARTPTS[rest];[opening][rest]concat=n=2:v=1:a=0,fps=30,trim=0:25[v];[2:a]atrim=0:25,asetpts=PTS-STARTPTS[a]','-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','25','-movflags','+faststart',out]);
ff(['-v','error','-i',out,'-f','null','-']);
const probe=spawnSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,r_frame_rate,duration,nb_read_frames,sample_rate,channels','-show_entries','format=duration,size','-of','json',out],{encoding:'utf8'});
if(probe.status!==0)throw new Error(probe.stderr);const info=JSON.parse(probe.stdout);if(info.streams[0].nb_read_frames!=='750'||Number(info.format.duration)!==25)throw new Error('Duration mismatch');fs.writeFileSync(project+'export-probe-v2.json',JSON.stringify(info,null,2));
const audio=ff(['-i',out,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']);fs.writeFileSync(project+'loudness-v2.txt',audio);
ff(['-loglevel','error','-ss','4.9','-i',out,'-t','2.3','-vf','fps=5,scale=216:384,tile=4x3','-frames:v','1',project+'restored-final-line-v2.jpg']);
ff(['-loglevel','error','-i',out,'-t','7','-vn','-ar','16000','-ac','1',project+'exported-v2-speech.wav']);
console.log(JSON.stringify(info,null,2));console.log(audio.slice(audio.lastIndexOf('{')));
