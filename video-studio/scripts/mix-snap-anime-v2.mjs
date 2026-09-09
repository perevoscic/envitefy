import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
const a='public/projects/mom-just-snap-it',o='out/mom-just-snap-it';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner',...args],{encoding:'utf8',maxBuffer:5e6});if(r.status)throw Error(r.stderr);return r;}
const filter="[0:a]highpass=f=85,equalizer=f=2700:t=q:w=0.85:g=2,acompressor=threshold=0.075:ratio=2:attack=12:release=130:makeup=1.15,volume='if(between(t,27.8,31.1),1.3335,1)':eval=frame[d];[1:a]atempo=0.857142857,atrim=0:35,afade=t=in:d=0.4,afade=t=out:st=33.4:d=1.6,volume='if(between(t,27.8,31.2),0.065,if(between(t,0,1.9)+between(t,7,14.6)+between(t,21.1,25.1),0.10,0.22))':eval=frame[m];[2:a]volume=0.7[e];[d][m][e]amix=inputs=3:duration=longest:normalize=0,atrim=0:35,aresample=48000[a]";
ff(['-loglevel','error','-i',a+'/dialogue-edit.wav','-i',a+'/music.mp3','-i',a+'/effects.wav','-filter_complex',filter,'-map','[a]','-ac','2','-c:a','pcm_s24le',o+'/mix-v2-premaster.wav']);
const measure=ff(['-i',o+'/mix-v2-premaster.wav','-af','loudnorm=I=-16:TP=-1.2:LRA=7:print_format=json','-f','null','NUL']);const m=JSON.parse(measure.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const norm=`loudnorm=I=-16:TP=-1.2:LRA=7:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
const encoded=ff(['-i',o+'/mix-v2-premaster.wav','-af',norm,'-ar','48000','-ac','2','-c:a','pcm_s16le',a+'/final-mix-v2.wav']);
await fs.writeFile('projects/mom-just-snap-it/audio-v2-processing.json',JSON.stringify({changes:['Mother payoff +2.5dB before common mastering','Dialogue presence EQ +2dB at2700Hz; gentle compression','Music reduced under mother to0.065 and other speech0.10','One shared master; target -16LUFS and -1.2dBTP'],preMaster:m,normalization:encoded.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]},null,2));
let s=await fs.readFile('src/mom-just-snap-it/SnapAnime.tsx','utf8');s=s.replace('`${A}final-mix.wav`','`${A}final-mix-v2.wav`');await fs.writeFile('src/mom-just-snap-it/SnapAnime.tsx',s);
console.log('Shared V2 dialogue clarity mix ready; original audio preserved.');
