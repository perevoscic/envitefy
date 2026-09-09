import fs from 'node:fs';import {spawnSync,execFileSync} from 'node:child_process';
const b='public/projects/john-space-disco/',o='out/john-space-disco/';
function ff(a){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...a],{stdio:'inherit',windowsHide:true});if(r.status)throw Error('FFmpeg failed');}
const phase=process.argv[2]||'all';
if(phase==='all'||phase==='people')for(const [name,start,dur,speed] of [['hook',0,6,1.2],['create',6.5,6.5,6.5/7],['guests',0,7,1],['update',6,5,1],['payoff',6.3333333333,3.6666666667,11/12]]){ff(['-ss',String(start),'-i',b+name+'.mp4','-t',String(dur/speed),'-vf','setpts=(PTS-STARTPTS)/'+speed+',scale=1080:1920:flags=lanczos,fps=30','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',b+'vertical-'+name+'.mp4']);}
if(phase==='all'||phase==='demo'){
 const t=JSON.parse(fs.readFileSync('projects/john-space-disco/vertical-capture-timing.json','utf8'));
 for(const [name,duration] of [['card',1],['rsvp',2.05],['gift',1.45],['directions',1.75],['calendar',1.75],['ideas',1.8],['preview',1.5],['live',1.7],['edit',1.5],['editdone',1.2],['updated',2.8]]){
 ff(['-ss',String(t[name]),'-i',t.video,'-t',String(duration),'-vf','fps=30,scale=860:1600:flags=lanczos','-an','-c:v','libx264','-preset','fast','-crf','15','-pix_fmt','yuv420p',b+'vertical-demo-'+name+'.mp4']);}
}
if(phase==='all'||phase==='audio'){
const rate=48000,N=30*rate,samples=new Float32Array(N);
function tone(t,f,d,g){for(let n=0;n<d*rate;n++){const x=n/rate,at=Math.floor(t*rate)+n;if(at<N)samples[at]+=Math.sin(2*Math.PI*f*x)*Math.sin(Math.PI*x/d)*Math.exp(-x*10)*g;}}
for(const t of [1.3,2.3,3.45,7.3,9.1,12.08,14.05,15.5,17.25,23.2]){tone(t,880,.15,.06);tone(t+.07,1320,.20,.055);}
for(let n=0;n<.17*rate;n++){const x=n/rate;samples[Math.floor(21.8*rate)+n]+=.23*Math.sin(2*Math.PI*(340*x-850*x*x))*Math.exp(-x*30);}
const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[n]))*32767),44+n*2);fs.writeFileSync(b+'vertical-effects.wav',buf);
const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(between(t,10,18.8),0.25,0.095)':eval=frame,afade=t=out:st=29.3:d=0.7[m];[1:a]atrim=0:6,asetpts=PTS-STARTPTS,atempo=1.2,afade=t=out:st=4.9:d=0.1,volume=1.2[h];[2:a]atrim=6:9.1,asetpts=PTS-STARTPTS,afade=t=out:st=3:d=0.1,volume=1.2,adelay=19000|19000[u];[3:a]atrim=6.3333333333:10,asetpts=PTS-STARTPTS,atempo=0.9166666667,afade=t=out:st=3.85:d=0.15,volume=1.1,adelay=26000|26000[p];[4:a]volume=1.1,adelay=5500|5500[c];[5:a]volume=1.1,adelay=22350|22350[v];[6:a]volume=1[s];[m][h][u][p][c][v][s]amix=inputs=7:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9,apad,atrim=0:30[a]";
ff(['-i',b+'music.mp3','-i',b+'hook.mp4','-i',b+'update.mp4','-i',b+'payoff.mp4','-i',b+'vo-create.mp3','-i',b+'vo-update.mp3','-i',b+'vertical-effects.wav','-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',b+'vertical-final-mix.wav']);}
console.log('Prepared vertical '+phase);
