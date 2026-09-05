import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-support/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
const phase=process.argv[2]||'all';
if(phase==='all'||phase==='demo'){
 const timing=JSON.parse(fs.readFileSync('projects/birthday-support/capture-timing.json','utf8'));
 for(const [kind,duration,rate] of [['details',2.2,1],['rsvp',3,1],['calendar',2.6,1.3]]){
  ff(['-ss',String(timing[kind]),'-i',timing.videoPath,'-t',String(duration),'-vf','crop=398:597:16:54,setpts=(PTS-STARTPTS)/'+rate+',scale=796:1194,fps=30,tpad=stop_mode=clone:stop_duration=1','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',base+'demo-'+kind+'.mp4']);
 }
}
if(phase==='all'||phase==='people'){
 ff(['-i',base+'chaos.mp4','-filter_complex','[0:v]split=2[a][b];[a]trim=0:5.05,setpts=PTS-STARTPTS,scale=1080:1920,fps=30[v0];[b]trim=1.033333:1.95,setpts=(PTS-STARTPTS)*2.1272727,scale=1080:1920,fps=30,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=1.95[v1];[v0][v1]concat=n=2:v=1:a=0,fps=30,trim=duration=7[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'opening-edit.mp4']);
 ff(['-ss','7','-i',base+'chaos.mp4','-t','2','-vf','setpts=(PTS-STARTPTS)/1.5,scale=1080:1920,fps=30,tpad=stop_mode=clone:stop_duration=1','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'share-edit.mp4']);
 ff(['-ss','10','-i',base+'payoff.mp4','-t','4.7','-vf','scale=1080:1920,fps=30','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'payoff-edit.mp4']);
}
if(phase==='all'||phase==='audio'){
 const rate=48000,N=25*rate,samples=new Float32Array(N);
 function tone(t,f,d=.13,gain=.1){const start=Math.floor(t*rate);for(let n=0;n<d*rate;n++){const sec=n/rate,envelope=Math.sin(Math.PI*n/(d*rate))*Math.exp(-sec*12);if(start+n<N)samples[start+n]+=Math.sin(2*Math.PI*f*sec)*envelope*gain;}}
 for(const t of [.02,.86,1.94]){tone(t,440,.08,.09);tone(t+.05,660,.07,.08);}
 for(const t of [10.2,13.48,17.0]){tone(t,880,.14,.12);tone(t+.07,1320,.18,.08);}
 let seed=41;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 for(let n=0;n<.16*rate;n++){const x=n/(.16*rate);samples[Math.floor(21.45*rate)+n]+=(random()-.5)*.07*(1-x)*Math.sin(2*Math.PI*(300*n/rate-800*(n/rate)**2));}
 const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[n]*32767))),44+n*2);fs.writeFileSync(base+'effects.wav',buf);
 const filter="[0:a]atrim=0:25,asetpts=PTS-STARTPTS,volume='if(gte(t,21.45),0,if(lt(t,7)+gte(t,19.5),0.085,0.31))':eval=frame[m];[1:a]atrim=0:5.05,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=4.99:d=0.06,apad,atrim=0:7[c];[2:a]atrim=10:14.7,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=3.5:d=0.06,adelay=18000|18000[p];[3:a]volume=0.65[s];[m][c][p][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:25[o]";
 ff(['-i',base+'music.mp3','-i',base+'chaos.mp4','-i',base+'payoff.mp4','-i',base+'effects.wav','-filter_complex',filter,'-map','[o]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix.wav']);
}
console.log('Prepared '+phase);
