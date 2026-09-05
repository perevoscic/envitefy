import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const base='public/projects/birthday-support/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');}
ff(['-i',base+'chaos.mp4','-filter_complex','[0:v]split=2[a][b];[a]trim=0:5.9,setpts=PTS-STARTPTS,scale=1080:1920,fps=30[v0];[b]trim=1.033333:1.95,setpts=(PTS-STARTPTS)*1.2,scale=1080:1920,fps=30,tpad=stop_mode=clone:stop_duration=0.1,trim=duration=1.1[v1];[v0][v1]concat=n=2:v=1:a=0,fps=30,trim=duration=7[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',base+'opening-edit-v2.mp4']);
const mix="[0:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=0.055[m];[1:a]atrim=0:5.9,asetpts=PTS-STARTPTS,volume=1.35,afade=t=out:st=5.86:d=0.04,apad,atrim=0:7[c];[2:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=0.65[s];[m][c][s]amix=inputs=3:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000,atrim=0:7[opening];[3:a]atrim=7:25,asetpts=PTS-STARTPTS[rest];[opening][rest]concat=n=2:v=0:a=1[out]";
ff(['-i',base+'music.mp3','-i',base+'chaos.mp4','-i',base+'effects.wav','-i',base+'final-mix.wav','-filter_complex',mix,'-map','[out]','-ar','48000','-ac','2','-c:a','pcm_s16le',base+'final-mix-v2.wav']);
let hook=fs.readFileSync('src/birthday-support/Hook.tsx','utf8').replace('opening-edit.mp4','opening-edit-v2.mp4');fs.writeFileSync('src/birthday-support/Hook.tsx',hook);
let main=fs.readFileSync('src/BirthdaySupport.tsx','utf8').replace('final-mix.wav','final-mix-v2.wav');fs.writeFileSync('src/BirthdaySupport.tsx',main);
console.log('Restored continuous source video and dialogue through 5.9 seconds (complete first Please hold); original 7–25 second mix retained.');
