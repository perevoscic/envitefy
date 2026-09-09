import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const b='public/projects/fridge-freedom/',out='out/fridge-freedom/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:4e6});if(r.status!==0)throw Error(r.stderr);}
const filters=[
'[0:v]trim=start=0.466666667:duration=0.566666667,setpts=PTS-STARTPTS,crop=360:640:360:510,scale=1080:1920,fps=30,setsar=1[v0]',
'[1:v]trim=start=0.3:duration=1.9,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[v1]',
'[2:v]trim=start=0.3:duration=2,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[v2]',
'[3:v]trim=start=1.7:duration=2.533333333,setpts=PTS-STARTPTS,crop=430:764:260:110,scale=1080:1920,fps=30,setsar=1[v3]',
'[0:a]atrim=start=0.466666667:duration=0.566666667,asetpts=PTS-STARTPTS,aresample=48000[a0]',
'[1:a]atrim=start=0.3:duration=1.9,asetpts=PTS-STARTPTS,aresample=48000[a1]',
'[2:a]atrim=start=0.3:duration=2,asetpts=PTS-STARTPTS,aresample=48000[a2]',
'[3:a]atrim=start=1.7:duration=2.533333333,asetpts=PTS-STARTPTS,aresample=48000[a3]',
'[v0][a0][v1][a1][v2][a2][v3][a3]concat=n=4:v=1:a=1[v][a]'
];
ff(['-i',b+'opening.mp4','-i',b+'v2-handoff-b.mp4','-i',b+'v2-insert-magnet.mp4','-i',b+'v2-fridge-mishap.mp4','-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-t','7','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k',b+'v2-opening-edit.mp4']);
ff(['-i',b+'v2-opening-edit.mp4','-vf','fps=4,scale=240:426,tile=7x4','-frames:v','1',out+'v2-opening-edit-contact.jpg']);
ff(['-ss','1.6','-i',b+'v2-insert-remove.mp4','-frames:v','1',out+'v2-removal-detail.jpg']);
console.log('New opening assembled at 1x speed.');
