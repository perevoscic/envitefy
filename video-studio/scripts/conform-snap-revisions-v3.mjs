import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
const a='public/projects/mom-just-snap-it';
function ff(args){const r=spawnSync('ffmpeg',['-y','-v','error',...args],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}
if(await fs.stat(a+'/payoff-v3.mp4').catch(()=>null))ff(['-i',a+'/payoff-v3.mp4','-filter_complex','[0:v]trim=0:2.6,setpts=(PTS-STARTPTS)*0.77[v0];[0:v]trim=2.6:9,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0,fps=30,tpad=stop_mode=clone:stop_duration=0.6[v]','-map','[v]','-t','9','-an','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',a+'/payoff-v3-edit.mp4']);
if(await fs.stat(a+'/digital-v3.mp4').catch(()=>null))ff(['-i',a+'/digital-v3.mp4','-filter_complex','[0:v]trim=0:8.43,setpts=PTS-STARTPTS[v0];[0:v]trim=8.87:10,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0,fps=30,tpad=stop_mode=clone:stop_duration=0.44[v]','-map','[v]','-t','10','-an','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',a+'/digital-v3-edit.mp4']);
const file='src/mom-just-snap-it/SnapAnime.tsx';let s=await fs.readFile(file,'utf8');
for(const name of ['payoff','digital'])if(await fs.stat(`${a}/${name}-v3-edit.mp4`).catch(()=>null))s=s.replaceAll(`${name}-edit.mp4`,`${name}-v3-edit.mp4`);
await fs.writeFile(file,s);console.log('Revised shared motion uses the exact original picture trims and unchanged audio.');
