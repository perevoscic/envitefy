import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const timing=JSON.parse(fs.readFileSync(new URL('../src/fridge-freedom/camera-timing-v4.json',import.meta.url),'utf8'));
const b='public/projects/fridge-freedom/',out='out/fridge-freedom/';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:5e6});if(r.status)throw Error(r.stderr);}
const filter='[0:v]trim=0:2,setpts=PTS-STARTPTS,fps=30,split[base][fg];[1:v]scale=324:660[screen];[base][screen]overlay=190:260:shortest=1[under];[fg]crop=350:690:178:246,chromakey=0x17be20:0.18:0.055[key];[under][key]overlay=178:246:shortest=1,crop=468:832:112:190,scale=1080:1920,setsar=1[out]';
ff(['-ss',String(timing.sourceStartSeconds),'-i',b+'v3-insert-camera.mp4','-i',out+'v4-camera-screen.mp4','-filter_complex',filter,'-map','[out]','-an','-t','2','-c:v','libx264','-crf','16','-preset','fast','-pix_fmt','yuv420p',b+'v4-camera-ready.mp4']);
ff(['-ss','0.8','-i',b+'v4-camera-ready.mp4','-vf','scale=540:960','-frames:v','1',out+'v4-camera-composite-review.jpg']);
ff(['-i',b+'v4-camera-ready.mp4','-vf','fps=8,scale=270:480,tile=4x4','-frames:v','1',out+'v4-camera-motion-review.jpg']);
ff(['-i',b+'v4-camera-ready.mp4','-i',b+'v2-ending-edit.mp4','-filter_complex',`[0:v]trim=start_frame=${timing.cleanupTrimStartFrame}:end_frame=${timing.cleanupTrimStartFrame+timing.cleanupDurationFrames},setpts=PTS-STARTPTS[v0];[1:v]trim=start=1:duration=7,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[v]`,'-map','[v]','-an','-t','8','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p',b+'v4-ending-edit.mp4']);
console.log('Phone screen composited and enlarged; both snap appearances updated.');
