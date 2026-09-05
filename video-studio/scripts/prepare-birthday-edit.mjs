import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-second-job/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
ff(['-i',base+'chaos.mp4','-filter_complex','[0:v]split=2[a][b];[a]trim=0:7.3,setpts=PTS-STARTPTS,crop=590:1050:65:0,scale=1080:1920,fps=30[v0];[b]trim=7.3:10,setpts=PTS-STARTPTS,scale=1080:1920,fps=30[v1];[v0][v1]concat=n=2:v=1:a=0[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'chaos-clean.mp4']);
const timing=JSON.parse(fs.readFileSync('projects/birthday-second-job/capture-timing.json','utf8'));
for(const [type,duration] of [['rsvp',3.9],['calendar',4.3]])ff(['-ss',String(timing[type]+(type==='rsvp'?1/6:0)),'-i',timing.videoPath,'-t',String(duration),'-vf','crop=430:760:0:0,scale=860:1520,fps=30','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',base+'demo-'+type+'.mp4']);
const rate=48000,N=30*rate,samples=new Float32Array(N);
function tone(t,f,d=.17,gain=.17){const start=Math.floor(t*rate);for(let n=0;n<d*rate;n++){const phase=n/rate,envelope=Math.sin(Math.PI*n/(d*rate))*Math.exp(-phase*12);if(start+n<N)samples[start+n]+=Math.sin(2*Math.PI*f*phase)*envelope*gain;}}
[.23,1.27,2.3].forEach((t,i)=>{tone(t,900+i*90);tone(t+.075,1300+i*80,.14,.12);});
for(const t of [8.6,12.45,18.45]){tone(t,740,.18,.13);tone(t+.09,1109,.25,.13);}
const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[n]*32767))),44+n*2);fs.writeFileSync(base+'effects.wav',buf);
const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(between(t,3.7,7.5)+between(t,22.6,25.8),0.075,if(between(t,25.8,27.15),0,0.29))':eval=frame,afade=t=out:st=29.5:d=0.5[m];[1:a]atrim=0:10,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=9.8:d=0.2[c];[2:a]atrim=10:20,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=7:d=0.2,adelay=20000|20000[p];[3:a]volume=0.6[s];[m][c][p][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[o]";
ff(['-i',base+'music.mp3','-i',base+'chaos.mp4','-i',base+'payoff.mp4','-i',base+'effects.wav','-filter_complex',filter,'-map','[o]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix.wav']);
console.log('Prepared footage, real demo recordings, and 30-second audio mix.');

