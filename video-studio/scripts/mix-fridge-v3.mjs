import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='public/projects/fridge-freedom/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
 const rate=48000,N=30*rate,samples=new Float32Array(N);let seed=4829;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};
 function tone(t,f,d,g){const st=Math.round(t*rate);for(let n=0;n<d*rate;n++){const sec=n/rate,env=Math.sin(Math.PI*n/(d*rate))*Math.exp(-sec*7);if(st+n<N)samples[st+n]+=Math.sin(2*Math.PI*f*sec)*env*g;}}
 function shutter(t){const st=Math.round(t*rate);for(let n=0;n<.12*rate;n++){const sec=n/rate,env=(Math.exp(-sec*110)+.6*Math.exp(-Math.max(0,sec-.043)*150)*(sec>.043?1:0));samples[st+n]+=rand()*env*.17;}}
 for(const t of[13.2,22.55])shutter(t);
 for(const t of[8.5,9.96,17.04,18.79,19.64,19.94])tone(t,780,.08,.07);
 tone(20.62,1046.5,.3,.1);tone(20.74,1318.5,.38,.095);tone(20.88,1568,.5,.055);
 const buf=Buffer.alloc(44+N*2);buf.write('RIFF');buf.writeUInt32LE(36+N*2,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*2,40);for(let n=0;n<N;n++)buf.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(samples[n]*32767))),44+n*2);fs.writeFileSync(base+'v3-effects.wav',buf);

const mix="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(lt(t,7),0.11,0.31)':eval=frame,afade=t=in:d=0.12,afade=t=out:st=28.6:d=1.4,apad,atrim=0:30[m];[1:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=1.2,afade=t=out:st=6.93:d=0.07,apad,atrim=0:30[o];[2:a]atrim=0:8,asetpts=PTS-STARTPTS,volume=0.65,afade=t=in:d=0.04,afade=t=out:st=7.2:d=0.8,adelay=22000|22000,apad,atrim=0:30[c];[3:a]volume=0.9[s];[m][o][c][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[a]";
ff(['-i',base+'music.mp3','-i',base+'v2-opening-edit.mp4','-i',base+'v2-ending-edit.mp4','-i',base+'v3-effects.wav','-filter_complex',mix,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'v3-final-mix.wav']);console.log('V3 audio synchronized.');
