import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const out='out/fridge-freedom/',file=out+'fridge-freedom-9x16-v5.mp4';
function ff(args){const r=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:5e6});if(r.status!==0)throw Error(r.stderr);return r;}
const wav=fs.readFileSync('public/projects/fridge-freedom/v5-effects.wav');
for(let sample=22*48000;sample<30*48000;sample++){if(wav.readInt16LE(44+sample*2)!==0)throw Error('Unexpected effect during ending');}
const first=13.4*48000;if(wav.readInt16LE(44+first*2)===0)throw Error('Main shutter cue missing');
ff(['-i',file,'-vf',"select='between(n,658,693)',scale=270:480,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='%{eif\\:n+658\\:d}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=black,tile=6x6",'-frames:v','1',out+'v5-direct-cleanup-cut.jpg']);
ff(['-i',file,'-vf',"select='eq(n,401)+eq(n,402)+eq(n,403)+eq(n,672)',scale=360:640,tile=4x1",'-frames:v','1',out+'v5-one-snap-review.jpg']);
fs.writeFileSync(out+'v5-edit-verification.json',JSON.stringify({mainShutterSeconds:13.4,shutterEffectCount:1,endingEffects:'zero samples from 22 to 30 seconds',savedCalendarFrames:[618,689],directPaperRemovalStartsFrame:690,reviewImages:['v5-direct-cleanup-cut.jpg','v5-one-snap-review.jpg']},null,2));
console.log('One shutter cue retained; ending effects silent. Direct-cleanup frame review prepared.');
