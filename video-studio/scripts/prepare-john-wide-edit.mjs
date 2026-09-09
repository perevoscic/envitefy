import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
const b='public/projects/john-space-disco/',o='out/john-space-disco/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
const t=JSON.parse(fs.readFileSync('projects/john-space-disco/vertical-capture-timing.json','utf8'));
for(const [name,duration,hold] of [['ideas',2.334,0],['live',1.72,3],['rsvp',2.1,0],['gift',2.1,0],['directions',1.4,0],['calendar',1.4,0],['edit',1.48,1.3],['updated',2.8,1.5]]){
 ff(['-ss',String(t[name]),'-i',t.video,'-t',String(duration+hold),'-vf','trim=duration='+duration+',setpts=PTS-STARTPTS,fps=30'+(hold?',tpad=stop_mode=clone:stop_duration='+hold:''),'-an','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p',b+'wide-ui-'+name+'.mp4']);
}
ff(['-i',b+'wide-edit-update.mp4','-filter_complex','[0:v]split=2[a][b];[a]trim=0:2.5,setpts=PTS-STARTPTS[a1];[b]trim=2.5:5,setpts=(PTS-STARTPTS)*1.8[b1];[a1][b1]concat=n=2:v=1:a=0,fps=30[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',b+'wide-update-long.mp4']);
ff(['-ss','2.7','-i',b+'wide-edit-guests.mp4','-t','4.267','-vf','fps=30','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',b+'wide-guest-update.mp4']);
const rate=48000,N=30*rate,samples=new Float32Array(N);
function tone(t,f,d,g){for(let n=0;n<d*rate;n++){const x=n/rate,at=Math.floor(t*rate)+n;if(at<N)samples[at]+=Math.sin(2*Math.PI*f*x)*Math.sin(Math.PI*x/d)*Math.exp(-x*10)*g;}}
for(const t of [0.8,2.35,3.18,5.03,7.34,9.64,12.04,14.13,16.23,17.63,21.72,23.45,27.87]){tone(t,880,.16,.035);tone(t+.06,1320,.19,.028);}
for(let n=0;n<.2*rate;n++){const x=n/rate;samples[Math.floor(23.48*rate)+n]+=.18*Math.sin(2*Math.PI*(420*x-1080*x*x))*Math.exp(-x*22);}
const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[n]))*32767),44+n*2);fs.writeFileSync(b+'wide-effects.wav',buf);
const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(between(t,9.7,18.8),0.24,if(gte(t,28),0.23,0.082))':eval=frame,afade=t=in:st=0:d=0.1,afade=t=out:st=29.25:d=0.75[m];[1:a]atrim=0:5,asetpts=PTS-STARTPTS,volume=1.05,afade=t=out:st=4.92:d=0.08[h];[2:a]atrim=0:2.45,asetpts=PTS-STARTPTS,volume=1.1,afade=t=out:st=2.35:d=0.1,adelay=19000|19000[u];[3:a]atrim=0:2,asetpts=PTS-STARTPTS,volume=1.05,afade=t=out:st=1.87:d=0.13,adelay=26000|26000[p];[4:a]volume=1.1,adelay=5350|5350[c];[5:a]volume=1.1,adelay=21500|21500[v];[6:a]volume=1[s];[m][h][u][p][c][v][s]amix=inputs=7:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9,apad,atrim=0:30[a]";
ff(['-i',b+'music.mp3','-i',b+'wide-edit-hook.mp4','-i',b+'wide-edit-update.mp4','-i',b+'wide-edit-payoff.mp4','-i',b+'vo-create.mp3','-i',b+'vo-update.mp3','-i',b+'wide-effects.wav','-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',b+'wide-final-mix.wav']);
ff(['-i',b+'wide-final-mix.wav','-ac','1','-ar','16000',o+'wide-final-review.wav']);
console.log('Product crops, extended update motion and final soundtrack prepared.');
