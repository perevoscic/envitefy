import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='public/projects/fridge-freedom/',p='projects/fridge-freedom/',out='out/fridge-freedom/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
const phase=process.argv[2]||'video';
if(phase==='video'){
 const t=JSON.parse(fs.readFileSync(p+'capture-timing.json','utf8')),s=JSON.parse(fs.readFileSync(p+'search-timing.json','utf8')),c=JSON.parse(fs.readFileSync(p+'calendar-timing.json','utf8'));
 const cuts=[['snap',t.videoPath,t.snap,1.9,1],['processing',t.videoPath,t.processing+.15,1.15,1],['event',t.videoPath,t.event,.5,1],['details',t.videoPath,t.details,2.3,1],['share',t.videoPath,t.share,.95,1],['calendar',t.videoPath,t.calendar,1.55,1],['calendar-choice',t.videoPath,t.calendarChoice,.5,1],['search',s.videoPath,s.type,2.55,1],['calendar-add',c.videoPath,c.add+.25,.8,1],['calendar-saved',c.videoPath,c.saved+.15,3,1],['message',c.videoPath,c.message,1.2,1]];
 for(const [name,file,start,dur,rate]of cuts){ff(['-ss',String(start),'-i',file,'-vf',`setpts=(PTS-STARTPTS)/${rate},fps=30,scale=860:1600`,'-t',String(dur),'-an','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p',base+'demo-'+name+'.mp4']);}
 ff(['-ss','12.9','-i',base+'phone.mp4','-t','1.1','-vf','fps=30,scale=1080:1920','-an','-c:v','libx264','-crf','18','-preset','fast',base+'snap-action.mp4']);
 ff(['-ss','8','-i',base+'cleanup.mp4','-vf','setpts=(PTS-STARTPTS)/1.4,fps=30,scale=1080:1920','-t','5.7','-an','-c:v','libx264','-crf','18','-preset','fast',base+'cleanup-edit.mp4']);
 ff(['-ss','14','-i',base+'cleanup.mp4','-vf','setpts=(PTS-STARTPTS)/0.67,fps=30,scale=1080:1920','-t','3','-an','-c:v','libx264','-crf','18','-preset','fast',base+'payoff-edit.mp4']);
 console.log('Phone clips and live-action trims prepared.');
}
if(phase==='audio'){
 const rate=48000,N=30*rate,samples=new Float32Array(N);let seed=4829;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};
 function tone(t,f,d,g){const st=Math.round(t*rate);for(let n=0;n<d*rate;n++){const sec=n/rate,env=Math.sin(Math.PI*n/(d*rate))*Math.exp(-sec*7);if(st+n<N)samples[st+n]+=Math.sin(2*Math.PI*f*sec)*env*g;}}
 function shutter(t){const st=Math.round(t*rate);for(let n=0;n<.12*rate;n++){const sec=n/rate,env=(Math.exp(-sec*110)+.6*Math.exp(-Math.max(0,sec-.043)*150)*(sec>.043?1:0));samples[st+n]+=rand()*env*.17;}}
 for(const t of[12.66,22.56,23.34])shutter(t);
 for(const t of[9.92,11.7,16.8,17.7,18.6,19.55])tone(t,780,.08,.07);
 tone(20.8,1046.5,.3,.1);tone(20.92,1318.5,.38,.095);tone(21.06,1568,.5,.055);
 const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[n]*32767))),44+n*2);fs.writeFileSync(base+'effects.wav',buf);
 const filter="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(lt(t,7),0.11,0.31)':eval=frame,afade=t=in:d=0.12,afade=t=out:st=28.6:d=1.4,apad,atrim=0:30[m];[1:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=1.2,afade=t=out:st=6.93:d=0.07,apad,atrim=0:30[o];[2:a]atrim=8:15,asetpts=PTS-STARTPTS,atempo=1.4,volume=.55,afade=t=in:d=0.08,afade=t=out:st=4.85:d=0.15,adelay=22000|22000,apad,atrim=0:30[c];[3:a]volume=.9[s];[m][o][c][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[a]";
 ff(['-i',base+'music.mp3','-i',base+'opening.mp4','-i',base+'cleanup.mp4','-i',base+'effects.wav','-filter_complex',filter,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix.wav']);console.log('30-second dialogue/music/shutter/calendar mix prepared.');
}

