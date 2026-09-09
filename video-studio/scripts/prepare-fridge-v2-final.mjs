import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const b='public/projects/fridge-freedom/',o='out/fridge-freedom/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr);}
let opening=fs.readFileSync('scripts/prepare-fridge-v2-opening.mjs','utf8');opening=opening.replace('crop=600:1066:60:100','crop=430:764:260:110');fs.writeFileSync('scripts/prepare-fridge-v2-opening.mjs',opening);
const rerun=spawnSync(process.execPath,['scripts/prepare-fridge-v2-opening.mjs'],{encoding:'utf8'});if(rerun.status)throw Error(rerun.stderr);
const f='[0:v]trim=0:1,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[v0];[1:v]trim=start=1.266666667:duration=1,setpts=PTS-STARTPTS,crop=326:580:160:700,scale=1080:1920,fps=30,setsar=1[v1];[2:v]trim=0:6,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[v2];[3:a]atrim=0:1,asetpts=PTS-STARTPTS[a0];[1:a]atrim=start=1.266666667:duration=1,asetpts=PTS-STARTPTS,aresample=48000[a1];[2:a]atrim=0:6,asetpts=PTS-STARTPTS,aresample=48000[a2];[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]';
ff(['-i',b+'snap-action.mp4','-i',b+'v2-insert-remove.mp4','-i',b+'v2-insert-last-sheet.mp4','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-filter_complex',f,'-map','[v]','-map','[a]','-t','8','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k',b+'v2-ending-edit.mp4']);
const mix="[0:a]atrim=0:30,asetpts=PTS-STARTPTS,volume='if(lt(t,7),0.11,0.31)':eval=frame,afade=t=in:d=0.12,afade=t=out:st=28.6:d=1.4,apad,atrim=0:30[m];[1:a]atrim=0:7,asetpts=PTS-STARTPTS,volume=1.2,afade=t=out:st=6.93:d=0.07,apad,atrim=0:30[o];[2:a]atrim=0:8,asetpts=PTS-STARTPTS,volume=.65,afade=t=in:d=0.04,afade=t=out:st=7.2:d=0.8,adelay=22000|22000,apad,atrim=0:30[c];[3:a]volume='if(between(t,23.2,23.65),0,0.9)':eval=frame[s];[m][o][c][s]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=8,atrim=0:30[a]";
ff(['-i',b+'music.mp3','-i',b+'v2-opening-edit.mp4','-i',b+'v2-ending-edit.mp4','-i',b+'effects.wav','-filter_complex',mix,'-map','[a]','-ar','48000','-ac','2','-c:a','pcm_s16le',b+'v2-final-mix.wav']);
ff(['-i',b+'v2-ending-edit.mp4','-vf','fps=4,scale=240:426,tile=8x4','-frames:v','1',o+'v2-ending-edit-contact.jpg']);
console.log('V2 selected scenes and 30-second audio mix prepared.');

