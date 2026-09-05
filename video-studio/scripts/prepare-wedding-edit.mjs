import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='public/projects/wedding-200-texts/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
const phase=process.argv[2]||'demo';
if(phase==='demo'){
 const timing=JSON.parse(fs.readFileSync('projects/wedding-200-texts/capture-timing.json','utf8'));
 for(const [kind,duration,rate] of [['details',2.6,1],['rsvp',3.3,1],['calendar',2.7,1.65]]){
  ff(['-ss',String(timing[kind]),'-i',timing.videoPath,'-vf',`crop=398:597:16:54,setpts=(PTS-STARTPTS)/${rate},scale=796:1194,fps=30`,'-t',String(duration),'-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',base+'demo-'+kind+'.mp4']);
 }
 ff(['-ss','7','-i',base+'chaos.mp4','-vf','setpts=(PTS-STARTPTS)/1.4,scale=1080:1920,fps=30','-t','1.2','-an','-c:v','libx264','-preset','fast','-crf','18',base+'share-edit.mp4']);
}
if(phase==='payoff'){
 ff(['-i',base+'payoff-toast.mp4','-t','4.5','-vf','scale=1080:1920,fps=30','-c:v','libx264','-preset','fast','-crf','18','-c:a','aac',base+'payoff-edit.mp4']);
 ff(['-i',base+'payoff-edit.mp4','-vn','-ar','24000','-ac','1','projects/wedding-200-texts/ending-audio.mp3']);
}
if(phase==='audio'){
 const rate=48000,N=25*rate,samples=new Float32Array(N);
 function tone(t,f,d,g){const st=Math.round(t*rate);for(let n=0;n<d*rate;n++){const sec=n/rate,env=Math.sin(Math.PI*n/(d*rate))*Math.exp(-sec*10);if(st+n<N)samples[st+n]+=Math.sin(2*Math.PI*f*sec)*env*g;}}
 for(const t of [.08,.64,1.17]){tone(t,145,.16,.11);tone(t+.2,155,.12,.085);}
 for(const t of [9.15,12.65,17.42]){tone(t,880,.11,.07);tone(t+.06,1174,.18,.06);}
 const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[n]*32767))),44+n*2);fs.writeFileSync(base+'effects.wav',buf);
 const alignment=JSON.parse(fs.readFileSync('projects/wedding-200-texts/ending-alignment.json','utf8'));
 const stop=Math.min(22,18+alignment.words.at(-1).end+0.07);
 const filter=`[0:a]atrim=0:${stop},asetpts=PTS-STARTPTS,volume='if(lt(t,7)+gte(t,18.4),0.09,0.3)':eval=frame,afade=t=out:st=${stop-.035}:d=0.035,apad,atrim=0:25[m];[1:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=6.94:d=0.06,apad,atrim=0:25[c];[2:a]atrim=0:4.5,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=4.4:d=0.1,adelay=18000|18000,apad,atrim=0:25[p];[3:a]volume=0.7[s];[m][c][p][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:25[o]`;
 ff(['-i',base+'music.mp3','-i',base+'chaos.mp4','-i',base+'payoff-edit.mp4','-i',base+'effects.wav','-filter_complex',filter,'-map','[o]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix.wav']);
 fs.writeFileSync('projects/wedding-200-texts/mix-timing.json',JSON.stringify({musicStopSeconds:stop},null,2));
}
console.log('Prepared '+phase);

